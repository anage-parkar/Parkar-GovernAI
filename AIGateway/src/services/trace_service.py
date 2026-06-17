"""
FlowTrace — lightweight, fire-and-forget request tracing for the gateway.

Correlates the spans of one logical agent request:
    agent → gateway → guardrail → llm                (the LLM turn)
    agent → gateway → guardrail → mcp → tool          (each tool call)
into a single trace, persists each span, and publishes it to Redis pub/sub so
the live FlowTrace graph (SSE) can light up the path in real time.

Non-negotiables (see CLAUDE.md / governance constraints):
  * Emission is best-effort and ASYNC — it must never add latency to, or fail,
    the proxied request. Every public function swallows + logs its own errors.
  * No secrets, raw PII, or full payloads in span attrs — summarised only.
  * Cross-worker safe: live fan-out is via Redis pub/sub, not an in-process queue
    (the gateway runs uvicorn --workers N in prod).

Trace propagation — Option 3 (hybrid):
  * If the client sends `X-Trace-Id`, we honour it (precise correlation across
    the client-driven LLM→tool boundary).
  * Otherwise we generate one and drop a short-lived Redis pointer keyed by
    (org, requester) so the MCP tool calls that follow an LLM turn attach to the
    same trace (best-effort heuristic stitching).
"""

import asyncio
import json
import logging
import secrets
import time
from contextvars import ContextVar
from typing import Optional

from sqlalchemy import text as sql_text

from config import settings
from database.db import get_db
from utils.redis import get_redis

logger = logging.getLogger("uvicorn")

# Per-org pub/sub channel: gw:traces:{org_id}
SPAN_CHANNEL_PREFIX = "gw:traces"
# Heuristic stitch pointer: gw:trace:active:{org_id}:{requester}
ACTIVE_TRACE_KEY = "gw:trace:active"

# Keys that must never be copied verbatim into a span's attrs (governance).
_FORBIDDEN_ATTR_KEYS = {
    "content", "messages", "message", "arguments", "args", "text", "input",
    "prompt", "response", "completion", "matched_text", "result", "payload",
}
_MAX_ATTR_STR = 160

# The active trace for the CURRENT request (set per request, inherited by tasks).
_ctx: ContextVar[Optional[dict]] = ContextVar("flowtrace_ctx", default=None)


# ─── id helpers ──────────────────────────────────────────────────────────────

def _now_ms() -> int:
    return int(time.time() * 1000)


def new_trace_id() -> str:
    return "trc_" + secrets.token_hex(4)


def new_span_id() -> str:
    return "spn_" + secrets.token_hex(4)


def _safe_attrs(attrs: dict) -> dict:
    """Drop forbidden keys, coerce scalars, truncate strings. Defensive — callers
    are expected to pass already-summarised values, but we never trust that."""
    out: dict = {}
    for k, v in (attrs or {}).items():
        kl = str(k).lower()
        if kl in _FORBIDDEN_ATTR_KEYS:
            continue
        if isinstance(v, str):
            out[k] = v[:_MAX_ATTR_STR]
        elif isinstance(v, (int, float, bool)) or v is None:
            out[k] = v
        elif isinstance(v, list):
            # keep short lists of scalars (e.g. masked entity types)
            out[k] = [str(x)[:_MAX_ATTR_STR] for x in v[:12]]
        else:
            out[k] = str(v)[:_MAX_ATTR_STR]
    return out


# ─── per-request context ─────────────────────────────────────────────────────

def start_trace(
    *,
    trace_id: Optional[str],
    org_id: int,
    agent_key: Optional[str],
    requester: Optional[str],
    root_span_id: Optional[str] = None,
) -> dict:
    """Initialise the trace context for the current request and set it as active.
    `agent_key` is the logical agent identity used to group traces (the requester
    when available, else the key name)."""
    ctx = {
        "trace_id": trace_id or new_trace_id(),
        "org_id": org_id,
        "agent_key": agent_key,
        "requester": requester,
        "parent": root_span_id,
    }
    _ctx.set(ctx)
    return ctx


def current() -> Optional[dict]:
    return _ctx.get()


def set_parent(span_id: Optional[str]) -> None:
    ctx = _ctx.get()
    if ctx:
        ctx["parent"] = span_id


def read_trace_header(headers) -> Optional[str]:
    """Honour a client-supplied X-Trace-Id (validated to our id shape)."""
    try:
        raw = (headers.get("x-trace-id") or "").strip()
    except Exception:
        return None
    if not raw:
        return None
    if 3 <= len(raw) <= 40 and all(c.isalnum() or c in "_-" for c in raw):
        return raw
    return None


# ─── emit ────────────────────────────────────────────────────────────────────

def emit_span(
    *,
    type: str,
    name: str,
    status: str = "ok",
    latency_ms: Optional[int] = None,
    ts_start_ms: Optional[int] = None,
    parent_span_id: Optional[str] = None,
    attrs: Optional[dict] = None,
    trace: Optional[dict] = None,
) -> str:
    """Fire-and-forget span emit. Returns the new span_id immediately and never
    raises — persistence + publish happen on a background task."""
    span_id = new_span_id()
    if not settings.flowtrace_enabled:
        return span_id
    try:
        ctx = trace or current()
        if not ctx:
            return span_id
        end_ms = _now_ms()
        start_ms = ts_start_ms if ts_start_ms is not None else end_ms - (latency_ms or 0)
        span = {
            "trace_id": ctx["trace_id"],
            "span_id": span_id,
            "parent_span_id": parent_span_id if parent_span_id is not None else ctx.get("parent"),
            "type": type,
            "name": name,
            "status": status,
            "ts_start": start_ms,
            "ts_end": end_ms,
            "latency_ms": latency_ms if latency_ms is not None else max(0, end_ms - start_ms),
            "agent_key": ctx.get("agent_key"),
            "attrs": _safe_attrs(attrs or {}),
        }
        _spawn(_persist_and_publish(int(ctx["org_id"]), span))
    except Exception as e:  # never let tracing touch the hot path
        logger.warning("flowtrace emit_span failed: %s", e)
    return span_id


def complete_trace(*, status: str, totals: dict, path: list, trace: Optional[dict] = None) -> None:
    """Publish a trace.completed event (and kick off the optional AI insight)."""
    if not settings.flowtrace_enabled:
        return
    try:
        ctx = trace or current()
        if not ctx:
            return
        payload = {
            "trace_id": ctx["trace_id"],
            "agent_key": ctx.get("agent_key"),
            "requester": ctx.get("requester"),
            "status": status,
            "totals": totals,
            "path": path,
        }
        _spawn(_publish(int(ctx["org_id"]), "trace.completed", payload))
        if settings.flowtrace_ai_insight_enabled:
            from services.trace_insight_service import generate_insight  # lazy: avoids import cycle
            _spawn(generate_insight(int(ctx["org_id"]), ctx["trace_id"], payload))
    except Exception as e:
        logger.warning("flowtrace complete_trace failed: %s", e)


# ─── heuristic stitching (LLM turn ↔ its tool calls) ─────────────────────────

async def mark_active_trace(org_id: int, requester: Optional[str], trace_id: str, gateway_span_id: Optional[str]) -> None:
    """Remember 'this requester is mid-trace' so the client-driven MCP calls that
    follow can attach to the same trace_id (and parent under its gateway span)."""
    if not requester:
        return
    try:
        r = await get_redis()
        await r.set(
            f"{ACTIVE_TRACE_KEY}:{org_id}:{requester}",
            f"{trace_id}|{gateway_span_id or ''}",
            ex=settings.flowtrace_stitch_ttl_seconds,
        )
    except Exception as e:
        logger.debug("flowtrace mark_active_trace failed: %s", e)


async def lookup_active_trace(org_id: int, requester: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Return (trace_id, gateway_span_id) for an in-flight trace, if any."""
    if not requester:
        return None, None
    try:
        r = await get_redis()
        v = await r.get(f"{ACTIVE_TRACE_KEY}:{org_id}:{requester}")
        if v:
            tid, _, gsp = v.partition("|")
            return tid or None, (gsp or None)
    except Exception as e:
        logger.debug("flowtrace lookup_active_trace failed: %s", e)
    return None, None


# ─── internals ───────────────────────────────────────────────────────────────

def _spawn(coro) -> None:
    """Run a coroutine detached, swallowing any result/exception."""
    try:
        task = asyncio.create_task(coro)
        task.add_done_callback(_swallow)
    except RuntimeError:
        # No running loop (shouldn't happen inside async endpoints) — drop it.
        coro.close()


def _swallow(task: "asyncio.Task") -> None:
    try:
        task.result()
    except Exception as e:
        logger.debug("flowtrace background task error: %s", e)


async def _persist_and_publish(org_id: int, span: dict) -> None:
    # persist
    try:
        async with get_db() as db:
            await db.execute(
                sql_text(
                    """
                    INSERT INTO ai_gateway_trace_spans
                        (trace_id, span_id, parent_span_id, organization_id, agent_key,
                         type, name, status, ts_start, ts_end, latency_ms, attrs)
                    VALUES
                        (:trace_id, :span_id, :parent_span_id, :org_id, :agent_key,
                         :type, :name, :status,
                         to_timestamp(:ts_start / 1000.0), to_timestamp(:ts_end / 1000.0),
                         :latency_ms, CAST(:attrs AS jsonb))
                    """
                ),
                {
                    "trace_id": span["trace_id"],
                    "span_id": span["span_id"],
                    "parent_span_id": span["parent_span_id"],
                    "org_id": org_id,
                    "agent_key": span["agent_key"],
                    "type": span["type"],
                    "name": span["name"],
                    "status": span["status"],
                    "ts_start": span["ts_start"],
                    "ts_end": span["ts_end"],
                    "latency_ms": span["latency_ms"],
                    "attrs": json.dumps(span["attrs"]),
                },
            )
            await db.commit()
    except Exception as e:
        logger.warning("flowtrace persist failed: %s", e)
    # publish (live)
    await _publish(org_id, "span", span)


async def _publish(org_id: int, event: str, data: dict) -> None:
    try:
        r = await get_redis()
        await r.publish(f"{SPAN_CHANNEL_PREFIX}:{org_id}", json.dumps({"event": event, "data": data}))
    except Exception as e:
        logger.debug("flowtrace publish failed: %s", e)
