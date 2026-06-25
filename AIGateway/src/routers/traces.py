"""
FlowTrace internal API — agent topology, recent traces, trace detail, and a live
SSE stream. Mounted under /internal, so the Express backend exposes these to the
frontend at /api/ai-gateway/flowtrace/* with JWT auth + tenant scoping.

Live spans are fanned out via Redis pub/sub (gw:traces:{org_id}) so the stream
works across uvicorn workers.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from crud.traces import (
    get_agents,
    get_agent_graph,
    get_recent_traces,
    get_trace,
    delete_expired_trace_spans,
    get_agent_quality,
    get_quality_summary,
)
from config import settings
from utils.auth import get_org_id, require_admin
from utils.redis import get_redis

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/flowtrace", tags=["FlowTrace"])


@router.get("/agents", summary="Runtime agents seen in recent traces (left rail)")
async def list_agents(request: Request):
    org_id = get_org_id(request)
    return {"agents": await get_agents(org_id)}


@router.get("/agents/{agent_key}/graph", summary="Static topology for one agent")
async def agent_graph(request: Request, agent_key: str):
    org_id = get_org_id(request)
    return await get_agent_graph(org_id, agent_key)


@router.get("/agents/{agent_key}/quality", summary="Agent quality metrics rollup")
async def agent_quality(request: Request, agent_key: str, period: int = 7):
    """Accuracy / faithfulness / hallucination / bias rollup for one agent (async
    Response Analysis). Empty until the response-analysis worker has scored traffic."""
    org_id = get_org_id(request)
    period = max(1, min(period, 90))
    return await get_agent_quality(org_id, agent_key, period)


@router.get("/quality", summary="Org-wide agent quality summary")
async def quality_summary(request: Request, period: int = 7):
    org_id = get_org_id(request)
    period = max(1, min(period, 90))
    return await get_quality_summary(org_id, period)


@router.get("/traces/stream", summary="Live span / trace.completed SSE stream")
async def traces_stream(request: Request, agent: Optional[str] = None):
    """Server-Sent Events of span + trace.completed events for this org.
    Optional ?agent= filters to one agent_key. Heartbeats keep the link warm."""
    org_id = get_org_id(request)
    channel = f"gw:traces:{org_id}"

    async def event_stream():
        r = await get_redis()
        pubsub = r.pubsub()
        await pubsub.subscribe(channel)
        try:
            # Prime the connection so the client's onopen fires immediately.
            yield ": flowtrace connected\n\n"
            while True:
                if await request.is_disconnected():
                    break
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=15.0)
                if not msg or msg.get("type") != "message":
                    # 15s heartbeat (comment line — ignored by EventSource parsers)
                    yield ": ping\n\n"
                    continue
                payload = msg.get("data")
                if not isinstance(payload, str):
                    continue
                event = "span"
                try:
                    obj = json.loads(payload)
                    event = obj.get("event", "span")
                    if agent:
                        ak = (obj.get("data") or {}).get("agent_key")
                        if ak and ak != agent:
                            continue
                except Exception:
                    pass
                yield f"event: {event}\ndata: {payload}\n\n"
        finally:
            try:
                await pubsub.unsubscribe(channel)
                await pubsub.aclose()
            except Exception:
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/traces", summary="Recent traces (optionally filtered by agent)")
async def recent_traces(request: Request, agent: Optional[str] = None, limit: int = 20):
    org_id = get_org_id(request)
    limit = max(1, min(limit, 100))
    return {"traces": await get_recent_traces(org_id, agent, limit)}


@router.get("/traces/{trace_id}/insight", summary="Cached AI insight for a trace")
async def trace_insight(request: Request, trace_id: str):
    get_org_id(request)
    from services.trace_insight_service import get_cached_insight
    return {"trace_id": trace_id, "insight": await get_cached_insight(trace_id)}


@router.get("/traces/{trace_id}", summary="Full reconstructed trace")
async def trace_detail(request: Request, trace_id: str):
    org_id = get_org_id(request)
    trace = await get_trace(org_id, trace_id)
    if not trace:
        return {"trace": None}
    return {"trace": trace}


@router.post("/cleanup", summary="Drop spans past the retention window")
async def cleanup(request: Request):
    require_admin(request)
    get_org_id(request)  # ensure tenant context present
    deleted = await delete_expired_trace_spans(settings.flowtrace_retention_days)
    return {"deleted": deleted, "retention_days": settings.flowtrace_retention_days}
