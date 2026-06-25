"""
FlowTrace read model — agent topology, recent traces, and trace reconstruction.

All queries are scoped to organization_id (the tenant boundary). Spans hold only
masked/summarised attrs, so nothing sensitive is returned here.
"""

import logging
from typing import Optional

from sqlalchemy import text as sql_text

from database.db import get_db

logger = logging.getLogger("uvicorn")

# Canonical hop order for assembling a trace's "path".
_PATH_ORDER = ["agent", "gateway", "guardrail", "llm", "mcp", "tool"]


def _status_from_flags(has_error: bool, has_block: bool, has_mask: bool) -> str:
    if has_error:
        return "error"
    if has_block:
        return "block"
    if has_mask:
        return "mask"
    return "ok"


async def get_agents(org_id: int, limit: int = 50) -> list[dict]:
    """Distinct runtime agents seen in recent traces (powers the left rail)."""
    async with get_db() as db:
        result = await db.execute(
            sql_text(
                """
                SELECT
                    agent_key,
                    MAX(ts_start) AS last_ts,
                    COUNT(DISTINCT trace_id) AS traces,
                    MAX(name) FILTER (WHERE type = 'llm') AS model,
                    COUNT(DISTINCT attrs->>'requester')
                        FILTER (WHERE attrs->>'requester' IS NOT NULL) AS users
                FROM ai_gateway_trace_spans
                WHERE organization_id = :org AND agent_key IS NOT NULL
                GROUP BY agent_key
                ORDER BY last_ts DESC
                LIMIT :limit
                """
            ),
            {"org": org_id, "limit": limit},
        )
        rows = result.mappings().fetchall()
        return [
            {
                "key": r["agent_key"],
                "name": r["agent_key"],
                "model": r["model"],
                "traces": int(r["traces"] or 0),
                "users": int(r["users"] or 0),
                "last_ts": r["last_ts"].isoformat() if r["last_ts"] else None,
            }
            for r in rows
        ]


async def get_agent_graph(org_id: int, agent_key: str) -> dict:
    """Static topology for an agent: the agent node + the org's connected MCP
    servers and their tools (the catalog the agent can reach). The full graph is
    rendered before any trace runs; live spans then light the traversed path."""
    async with get_db() as db:
        # latest model this agent reasoned with (for the LLM node label)
        model_row = (
            await db.execute(
                sql_text(
                    """
                    SELECT name FROM ai_gateway_trace_spans
                    WHERE organization_id = :org AND agent_key = :agent AND type = 'llm'
                    ORDER BY ts_start DESC LIMIT 1
                    """
                ),
                {"org": org_id, "agent": agent_key},
            )
        ).mappings().first()

        result = await db.execute(
            sql_text(
                """
                SELECT s.id AS server_id, s.name AS server_name, s.slug AS server_slug,
                       t.tool_name
                FROM ai_gateway_mcp_servers s
                LEFT JOIN ai_gateway_mcp_tools t
                       ON t.server_id = s.id AND t.is_active = true
                WHERE s.organization_id = :org AND s.is_active = true
                ORDER BY s.name, t.tool_name
                """
            ),
            {"org": org_id},
        )
        rows = result.mappings().fetchall()

    servers: dict[int, dict] = {}
    for r in rows:
        sid = r["server_id"]
        if sid not in servers:
            servers[sid] = {
                "id": sid,
                "name": r["server_name"] or r["server_slug"] or f"server-{sid}",
                "tools": [],
            }
        if r["tool_name"]:
            servers[sid]["tools"].append(r["tool_name"])

    return {
        "agent": {
            "id": agent_key,
            "name": agent_key,
            "model": model_row["name"] if model_row else None,
        },
        "servers": list(servers.values()),
    }


async def get_recent_traces(org_id: int, agent: Optional[str] = None, limit: int = 20) -> list[dict]:
    """Recent traces (most recent first), optionally filtered to one agent."""
    where_agent = "AND agent_key = :agent" if agent else ""
    params = {"org": org_id, "limit": limit}
    if agent:
        params["agent"] = agent
    async with get_db() as db:
        result = await db.execute(
            sql_text(
                f"""
                SELECT
                    trace_id,
                    MAX(agent_key) AS agent_key,
                    MAX(attrs->>'requester') AS requester,
                    MIN(ts_start) AS started_at,
                    SUM(latency_ms) AS total_latency,
                    array_agg(DISTINCT type) AS types,
                    bool_or(status = 'error') AS has_error,
                    bool_or(status = 'block') AS has_block,
                    bool_or(status = 'mask') AS has_mask,
                    SUM(CAST(attrs->>'tokens' AS integer)) FILTER (WHERE type = 'llm') AS tokens,
                    SUM(CAST(attrs->>'cost_usd' AS numeric)) FILTER (WHERE type = 'llm') AS cost_usd
                FROM ai_gateway_trace_spans
                WHERE organization_id = :org {where_agent}
                GROUP BY trace_id
                ORDER BY started_at DESC
                LIMIT :limit
                """
            ),
            params,
        )
        rows = result.mappings().fetchall()

    traces = []
    for r in rows:
        types = set(r["types"] or [])
        traces.append(
            {
                "trace_id": r["trace_id"],
                "agent_key": r["agent_key"],
                "requester": r["requester"],
                "started_at": r["started_at"].isoformat() if r["started_at"] else None,
                "status": _status_from_flags(r["has_error"], r["has_block"], r["has_mask"]),
                "path": [t for t in _PATH_ORDER if t in types],
                "totals": {
                    "latency_ms": int(r["total_latency"] or 0),
                    "tokens": int(r["tokens"] or 0),
                    "cost_usd": float(r["cost_usd"] or 0),
                },
            }
        )
    return traces


async def get_trace(org_id: int, trace_id: str) -> Optional[dict]:
    """Full reconstructed trace: every span ordered by start time."""
    async with get_db() as db:
        result = await db.execute(
            sql_text(
                """
                SELECT trace_id, span_id, parent_span_id, agent_key, type, name, status,
                       ts_start, ts_end, latency_ms, attrs
                FROM ai_gateway_trace_spans
                WHERE organization_id = :org AND trace_id = :trace_id
                ORDER BY ts_start ASC, id ASC
                """
            ),
            {"org": org_id, "trace_id": trace_id},
        )
        rows = result.mappings().fetchall()

    if not rows:
        return None

    spans = []
    has_error = has_block = has_mask = False
    tokens = 0
    cost = 0.0
    for r in rows:
        has_error = has_error or r["status"] == "error"
        has_block = has_block or r["status"] == "block"
        has_mask = has_mask or r["status"] == "mask"
        attrs = r["attrs"] or {}
        if r["type"] == "llm":
            tokens += int(attrs.get("tokens") or 0)
            cost += float(attrs.get("cost_usd") or 0)
        spans.append(
            {
                "trace_id": r["trace_id"],
                "span_id": r["span_id"],
                "parent_span_id": r["parent_span_id"],
                "agent_key": r["agent_key"],
                "type": r["type"],
                "name": r["name"],
                "status": r["status"],
                "ts_start": int(r["ts_start"].timestamp() * 1000) if r["ts_start"] else None,
                "ts_end": int(r["ts_end"].timestamp() * 1000) if r["ts_end"] else None,
                "latency_ms": r["latency_ms"],
                "attrs": attrs,
            }
        )

    types = {s["type"] for s in spans}
    return {
        "trace_id": trace_id,
        "agent_key": spans[0]["agent_key"],
        "status": _status_from_flags(has_error, has_block, has_mask),
        "path": [t for t in _PATH_ORDER if t in types],
        "totals": {
            "latency_ms": sum(s["latency_ms"] or 0 for s in spans),
            "tokens": tokens,
            "cost_usd": round(cost, 6),
        },
        "spans": spans,
    }


async def delete_expired_trace_spans(retention_days: int = 7) -> int:
    """Bounded retention — drop spans older than retention_days. Returns rows deleted."""
    async with get_db() as db:
        result = await db.execute(
            sql_text(
                """
                DELETE FROM ai_gateway_trace_spans
                WHERE ts_start < NOW() - make_interval(days => :days)
                """
            ),
            {"days": retention_days},
        )
        await db.commit()
        return result.rowcount or 0


# ─── Response Analysis quality rollups ────────────────────────────────────────

async def _quality_rows(org_id: int, agent_key: Optional[str], period_days: int) -> list:
    where = "organization_id = :org AND created_at > NOW() - make_interval(days => :days)"
    params = {"org": org_id, "days": period_days}
    if agent_key:
        where += " AND agent_key = :ak"
        params["ak"] = agent_key
    async with get_db() as db:
        result = await db.execute(
            sql_text(
                f"""
                SELECT metric,
                       AVG(score)                                  AS avg_score,
                       COUNT(*)                                    AS scored,
                       SUM(CASE WHEN verdict = 'fail' THEN 1 ELSE 0 END) AS failed
                FROM ai_gateway_response_scores
                WHERE {where}
                GROUP BY metric
                """
            ),
            params,
        )
        return result.mappings().fetchall()


def _shape_quality(rows: list) -> dict:
    metrics = {
        r["metric"]: {
            "avg": round(float(r["avg_score"]), 4) if r["avg_score"] is not None else None,
            "scored": int(r["scored"] or 0),
            "failed": int(r["failed"] or 0),
        }
        for r in rows
    }
    total = max((m["scored"] for m in metrics.values()), default=0)
    return {"metrics": metrics, "scored": total}


async def get_agent_quality(org_id: int, agent_key: str, period_days: int = 7) -> dict:
    """Per-metric quality rollup (accuracy/faithfulness/hallucination/bias) for one
    agent over the window. Reads ai_gateway_response_scores (async-scored)."""
    rows = await _quality_rows(org_id, agent_key, period_days)
    return {"agent_key": agent_key, "period_days": period_days, **_shape_quality(rows)}


async def get_quality_summary(org_id: int, period_days: int = 7) -> dict:
    """Org-wide quality rollup across all agents over the window."""
    rows = await _quality_rows(org_id, None, period_days)
    return {"period_days": period_days, **_shape_quality(rows)}
