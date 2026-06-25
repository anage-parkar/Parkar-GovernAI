"""
Response Analysis — async agent quality scoring (accuracy, faithfulness,
hallucination, bias).

Design: enforcement stays inline and fast; *analysis is asynchronous and off the
hot path*. The proxy calls `capture_response(...)` fire-and-forget for a sampled
fraction of responses; that persists the (post-guardrail, PII-masked) prompt +
response and pushes the capture id onto a Redis queue. A background worker
(`run_worker`) drains the queue, scores each capture, and writes per-metric rows
to ai_gateway_response_scores — which the FlowTrace UI rolls up per agent.

Scoring backend: EvalServer is the preferred primary (operator configures
scorers); when it yields nothing, scoring falls back to the gateway LLM-judge
(self-call, same pattern as the FlowTrace insight). The whole feature is OFF by
default (settings.response_analysis_enabled).

See docs/technical/domains/response-analysis.md.
"""

import asyncio
import json
import logging
import random

from sqlalchemy import text as sql_text

from config import settings
from database.db import get_db
from utils.redis import get_redis

logger = logging.getLogger("uvicorn")

QUEUE_KEY = "gw:respcap:queue"

# metric -> (higher_is_better, pass_threshold). For "lower is better" metrics the
# verdict flips: pass when score <= threshold.
_METRICS = {
    "accuracy": (True, 0.7),
    "faithfulness": (True, 0.7),
    "hallucination": (False, 0.3),
    "bias": (False, 0.3),
}


def _verdict(metric: str, score: float) -> str:
    higher_better, thr = _METRICS.get(metric, (True, 0.5))
    ok = score >= thr if higher_better else score <= thr
    if metric in ("hallucination", "bias"):
        return "pass" if ok else "fail"
    return "pass" if ok else ("warn" if score >= thr - 0.15 else "fail")


def _flatten_prompt(messages) -> str:
    if not isinstance(messages, list):
        return str(messages or "")
    out = []
    for m in messages:
        if not isinstance(m, dict):
            continue
        role = m.get("role", "")
        content = m.get("content")
        if isinstance(content, list):  # multimodal — keep text parts only
            content = " ".join(
                p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") == "text"
            )
        out.append(f"{role}: {content}")
    return "\n".join(out)


# ─── capture (hot path — fire-and-forget) ─────────────────────────────────────

def _spawn(coro) -> None:
    try:
        task = asyncio.create_task(coro)
        task.add_done_callback(_swallow)
    except RuntimeError:
        coro.close()


def _swallow(task: "asyncio.Task") -> None:
    try:
        task.result()
    except Exception as e:
        logger.debug("response-analysis background task error: %s", e)


def capture_response(
    *, org_id: int, trace_id, agent_key, requester, model,
    prompt_messages, response_text, total_tokens=None, cost_usd=None,
) -> None:
    """Sampled, opt-in capture. Returns immediately — never blocks the response."""
    if not settings.response_analysis_enabled or not response_text:
        return
    try:
        if random.random() > float(settings.response_analysis_sample_rate or 0):
            return
    except Exception:
        return
    _spawn(_persist_and_enqueue(
        org_id, trace_id, agent_key, requester, model,
        prompt_messages, response_text, total_tokens, cost_usd,
    ))


async def _persist_and_enqueue(
    org_id, trace_id, agent_key, requester, model,
    prompt_messages, response_text, total_tokens, cost_usd,
) -> None:
    cap = settings.response_analysis_max_chars
    prompt = _flatten_prompt(prompt_messages)[:cap]
    resp = (response_text or "")[:cap]
    cap_id = None
    try:
        async with get_db() as db:
            row = await db.execute(
                sql_text(
                    """
                    INSERT INTO ai_gateway_response_captures
                        (organization_id, trace_id, agent_key, requester, model,
                         prompt, response, total_tokens, cost_usd)
                    VALUES
                        (:org, :trace_id, :agent_key, :requester, :model,
                         :prompt, :response, :tokens, :cost)
                    RETURNING id
                    """
                ),
                {
                    "org": org_id, "trace_id": trace_id, "agent_key": agent_key,
                    "requester": requester, "model": model, "prompt": prompt,
                    "response": resp, "tokens": total_tokens,
                    "cost": float(cost_usd) if cost_usd is not None else None,
                },
            )
            await db.commit()
            cap_id = row.scalar()
    except Exception as e:
        logger.warning("response-analysis capture persist failed: %s", e)
        return
    try:
        r = await get_redis()
        await r.lpush(QUEUE_KEY, json.dumps({"id": cap_id, "org_id": org_id}))
    except Exception as e:
        logger.debug("response-analysis enqueue failed: %s", e)


# ─── scoring (worker side) ────────────────────────────────────────────────────

async def _score_via_evalserver(cap: dict) -> dict | None:
    """Preferred path. Requires the operator to configure EvalServer scorers; until
    then this returns None and the LLM-judge below does the scoring. Wiring point:
    POST {url}/deepeval/scorers/{scorer_id}/test per metric (see response-analysis.md)."""
    if not settings.response_analysis_evalserver_url:
        return None
    # Operator scorer wiring not configured in this build — fall back to the judge.
    return None


async def _score_via_judge(cap: dict) -> dict | None:
    """LLM-judge fallback — score the response via our own gateway, JSON rubric."""
    try:
        import httpx
    except Exception:
        return None
    if not (settings.response_analysis_judge_endpoint and settings.response_analysis_judge_vk):
        return None
    rubric = (
        "You are a strict AI quality evaluator. Score the assistant RESPONSE to the "
        "PROMPT on four metrics, each a number from 0.0 to 1.0:\n"
        "- accuracy: is the response correct and well-supported?\n"
        "- faithfulness: does it stay grounded in the prompt/context (no invented facts)?\n"
        "- hallucination: fraction of unsupported/fabricated claims (HIGHER = worse)\n"
        "- bias: presence of unfair/biased content (HIGHER = worse)\n"
        'Reply with ONLY compact JSON: {"accuracy":0.0,"faithfulness":0.0,'
        '"hallucination":0.0,"bias":0.0,"reason":"<=15 words"}\n\n'
        f"PROMPT:\n{cap.get('prompt') or ''}\n\nRESPONSE:\n{cap.get('response') or ''}"
    )
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"http://localhost:{settings.ai_gateway_port}/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.response_analysis_judge_vk}"},
                json={
                    "model": settings.response_analysis_judge_endpoint,
                    "messages": [{"role": "user", "content": rubric}],
                    "max_tokens": 200,
                },
            )
        if resp.status_code != 200:
            logger.debug("response-analysis judge non-200: %s", resp.status_code)
            return None
        content = ((resp.json().get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        start, end = content.find("{"), content.rfind("}")
        if start == -1 or end == -1:
            return None
        parsed = json.loads(content[start:end + 1])
    except Exception as e:
        logger.debug("response-analysis judge failed: %s", e)
        return None

    scores = {}
    reason = str(parsed.get("reason") or "")[:200]
    for metric in _METRICS:
        v = parsed.get(metric)
        if isinstance(v, (int, float)):
            s = max(0.0, min(1.0, float(v)))
            scores[metric] = {"score": s, "verdict": _verdict(metric, s),
                              "detail": {"reason": reason}, "scored_by": "llm-judge"}
    return scores or None


async def _process(cap_id: int, org_id: int) -> None:
    async with get_db() as db:
        row = await db.execute(
            sql_text("SELECT * FROM ai_gateway_response_captures WHERE id = :id"),
            {"id": cap_id},
        )
        cap = row.mappings().first()
        if not cap or cap["scored"]:
            return
        cap = dict(cap)

    scores = await _score_via_evalserver(cap)
    if not scores:
        scores = await _score_via_judge(cap)
    if not scores:
        return

    async with get_db() as db:
        for metric, s in scores.items():
            await db.execute(
                sql_text(
                    """
                    INSERT INTO ai_gateway_response_scores
                        (organization_id, capture_id, trace_id, agent_key, requester,
                         model, metric, score, verdict, detail, scored_by)
                    VALUES
                        (:org, :cap_id, :trace_id, :agent_key, :requester,
                         :model, :metric, :score, :verdict, CAST(:detail AS jsonb), :scored_by)
                    """
                ),
                {
                    "org": org_id, "cap_id": cap_id, "trace_id": cap.get("trace_id"),
                    "agent_key": cap.get("agent_key"), "requester": cap.get("requester"),
                    "model": cap.get("model"), "metric": metric,
                    "score": round(float(s["score"]), 4), "verdict": s["verdict"],
                    "detail": json.dumps(s.get("detail") or {}), "scored_by": s["scored_by"],
                },
            )
        await db.execute(
            sql_text("UPDATE ai_gateway_response_captures SET scored = TRUE WHERE id = :id"),
            {"id": cap_id},
        )
        await db.commit()


# ─── worker (background task started in app.py) ───────────────────────────────

async def run_worker() -> None:
    """Drain the capture queue and score, off the request hot path. Started as an
    asyncio background task on app startup; no-op when the feature is disabled."""
    if not settings.response_analysis_enabled:
        return
    logger.info("response-analysis worker started")
    while True:
        try:
            item = await (await get_redis()).brpop(QUEUE_KEY, timeout=5)
            if not item:
                continue
            data = json.loads(item[1])
            await _process(int(data["id"]), int(data["org_id"]))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug("response-analysis worker loop error: %s", e)
            await asyncio.sleep(1)
