"""
FlowTrace AI insight (Phase 4) — on trace.completed, summarise the span rollup
in plain language via OUR OWN gateway, cache it per trace_id, and publish a
`trace.insight` event for the live UI.

Feature-flagged (settings.flowtrace_ai_insight_enabled) and fully best-effort:
any failure is swallowed. Only the masked/summarised rollup is sent to the model
— never raw prompts, payloads, or PII.
"""

import json
import logging

from config import settings
from crud.traces import get_trace
from utils.redis import get_redis

logger = logging.getLogger("uvicorn")

INSIGHT_KEY = "gw:trace:insight"          # gw:trace:insight:{trace_id}
INSIGHT_LOCK = "gw:trace:insight:lock"    # one generation per trace
SPAN_CHANNEL_PREFIX = "gw:traces"


def _summarise(trace: dict) -> str:
    """Build a compact, PII-free description of the trace for the model."""
    lines = []
    for s in trace.get("spans", []):
        a = s.get("attrs") or {}
        bits = [f"{s['type']}={s['name']}", f"status={s['status']}", f"{s.get('latency_ms', 0)}ms"]
        if s["type"] == "llm":
            bits.append(f"tokens={a.get('tokens', 0)}")
        if s["type"] in ("mcp", "tool") and a.get("server_id") is not None:
            bits.append(f"server={a.get('server_id')}")
        lines.append(" ".join(str(b) for b in bits))
    totals = trace.get("totals", {})
    return (
        f"Agent: {trace.get('agent_key')}\n"
        f"Status: {trace.get('status')}\n"
        f"Path: {' -> '.join(trace.get('path', []))}\n"
        f"Totals: {totals.get('latency_ms', 0)}ms, {totals.get('tokens', 0)} tokens, "
        f"${totals.get('cost_usd', 0)}\n"
        f"Hops:\n" + "\n".join(lines)
    )


async def _call_gateway(rollup: str) -> str | None:
    try:
        import httpx
    except Exception:
        return None
    if not (settings.flowtrace_insight_endpoint and settings.flowtrace_insight_vk):
        return None
    prompt = (
        "You are a governance analyst. In ONE short paragraph (max 3 sentences), "
        "explain what this AI agent did and whether anything looks off (PII masking, "
        "blocks, anomalies, latency). Be concrete and neutral. Trace:\n\n" + rollup
    )
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"http://localhost:{settings.ai_gateway_port}/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.flowtrace_insight_vk}"},
                json={
                    "model": settings.flowtrace_insight_endpoint,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 160,
                },
            )
        if resp.status_code != 200:
            logger.debug("flowtrace insight call non-200: %s", resp.status_code)
            return None
        data = resp.json()
        return ((data.get("choices") or [{}])[0].get("message") or {}).get("content")
    except Exception as e:
        logger.debug("flowtrace insight call failed: %s", e)
        return None


async def generate_insight(org_id: int, trace_id: str, payload: dict) -> None:
    if not settings.flowtrace_ai_insight_enabled:
        return
    try:
        r = await get_redis()
        # one generation per trace (NX lock)
        got = await r.set(f"{INSIGHT_LOCK}:{trace_id}", "1", nx=True, ex=120)
        if not got:
            return
        trace = await get_trace(org_id, trace_id)
        if not trace:
            return
        text = await _call_gateway(_summarise(trace))
        if not text:
            return
        await r.set(f"{INSIGHT_KEY}:{trace_id}", text, ex=86400)
        await r.publish(
            f"{SPAN_CHANNEL_PREFIX}:{org_id}",
            json.dumps({"event": "trace.insight", "data": {"trace_id": trace_id, "insight": text, "agent_key": payload.get("agent_key")}}),
        )
    except Exception as e:
        logger.debug("flowtrace generate_insight failed: %s", e)


async def get_cached_insight(trace_id: str) -> str | None:
    try:
        r = await get_redis()
        return await r.get(f"{INSIGHT_KEY}:{trace_id}")
    except Exception:
        return None
