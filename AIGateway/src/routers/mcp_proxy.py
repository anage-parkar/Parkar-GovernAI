"""
Public MCP proxy endpoint — authenticated via agent keys (sk-mcp-*).

AI agents connect here to discover and call MCP tools:
    POST /v1/mcp  — JSON-RPC 2.0 over Streamable HTTP
    GET  /v1/mcp  — SSE keep-alive for server-initiated notifications

The gateway routes tool calls to the correct backend MCP server,
enforcing ACLs, rate limits, guardrails, and approval requirements.
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from config import settings
from services.trace_service import (
    start_trace,
    emit_span,
    complete_trace,
    read_trace_header,
    lookup_active_trace,
    set_parent,
)
from crud.mcp_approvals import create_approval_request, get_approval_status, get_approved_request, get_pending_request
from crud.mcp_tools import get_all_tools
from services.mcp_audit_service import log_tool_call
from services.mcp_guardrail_service import scan_tool_input
from services.mcp_proxy_service import (
    authenticate_agent_key,
    resolve_tool,
    enforce_tool_acls,
    enforce_mcp_rate_limits,
    forward_tool_call,
)
from services.mcp_session import create_session, get_backend_session, set_backend_session
from utils.acl import matches_acl

logger = logging.getLogger("uvicorn")

router = APIRouter()


def _jsonrpc_error(id, code: int, message: str, data: dict | None = None) -> dict:
    error = {"code": code, "message": message}
    if data:
        error["data"] = data
    return {"jsonrpc": "2.0", "id": id, "error": error}


def _jsonrpc_result(id, result: dict) -> dict:
    return {"jsonrpc": "2.0", "id": id, "result": result}


def _mcp_requester(request: Request) -> str | None:
    """Pull the requester (end-user) from x-vw-metadata so MCP tool calls can be
    attributed and stitched to the LLM turn that triggered them."""
    raw = request.headers.get("x-vw-metadata")
    if not raw:
        return None
    try:
        d = json.loads(raw)
        if isinstance(d, dict) and d.get("user"):
            return str(d["user"])
    except Exception:
        return None
    return None


async def _extract_agent_key(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <agent-key>")
    token = auth[7:].strip()
    try:
        return await authenticate_agent_key(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/v1/mcp")
async def mcp_jsonrpc(request: Request):
    """Handle JSON-RPC 2.0 requests from MCP clients."""
    agent_key = await _extract_agent_key(request)
    org_id = agent_key["organization_id"]

    try:
        body = await request.json()
    except Exception:
        return JSONResponse(content=_jsonrpc_error(None, -32700, "Parse error"), status_code=200)

    msg_id = body.get("id")
    method = body.get("method")
    params = body.get("params", {})

    if body.get("jsonrpc") != "2.0":
        return JSONResponse(content=_jsonrpc_error(msg_id, -32600, "Invalid JSON-RPC version"), status_code=200)

    # ── initialize ──────────────────────────────────────────────────────
    if method == "initialize":
        session_id = await create_session()
        result = {
            "protocolVersion": "2025-03-26",
            "capabilities": {"tools": {"listChanged": True}},
            "serverInfo": {"name": "Parkar GovernAI MCP Gateway", "version": "1.0.0"},
        }
        response = JSONResponse(content=_jsonrpc_result(msg_id, result))
        response.headers["Mcp-Session-Id"] = session_id
        return response

    # ── notifications/initialized ───────────────────────────────────────
    if method == "notifications/initialized":
        return JSONResponse(content=None, status_code=202)

    # ── tools/list ──────────────────────────────────────────────────────
    if method == "tools/list":
        all_tools = await get_all_tools(org_id)
        allowed = agent_key.get("allowed_tools") or []
        blocked = agent_key.get("blocked_tools") or []

        filtered = [
            t for t in all_tools
            if (not allowed or matches_acl(t["tool_name"], allowed))
            and (not blocked or not matches_acl(t["tool_name"], blocked))
        ]

        tools_list = [
            {"name": t["tool_name"], "description": t.get("description", ""), "inputSchema": t.get("input_schema", {})}
            for t in filtered
        ]
        return JSONResponse(content=_jsonrpc_result(msg_id, {"tools": tools_list}))

    # ── tools/call ──────────────────────────────────────────────────────
    if method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if not tool_name:
            return JSONResponse(content=_jsonrpc_error(msg_id, -32602, "Missing tool name in params"), status_code=200)

        start_time = time.time()
        tool = None

        async def _audit(status: str, summary: str | None, is_error: bool):
            await log_tool_call(
                organization_id=org_id,
                agent_key_id=agent_key["id"],
                server_id=tool.get("server_id") if tool else None,
                tool_name=tool_name,
                arguments=arguments,
                result_status=status,
                result_summary=summary[:500] if summary else None,
                is_error=is_error,
                latency_ms=int((time.time() - start_time) * 1000),
            )

        # ── FlowTrace: stitch this tool call into the agent's trace ──────────
        _t0 = time.time()
        _requester = _mcp_requester(request)
        _agent_id = _requester or agent_key.get("name") or f"mcp:{agent_key['id']}"
        _hdr_trace = read_trace_header(request.headers)
        _stitch_tid, _stitch_gw = (None, None)
        if not _hdr_trace:
            _stitch_tid, _stitch_gw = await lookup_active_trace(org_id, _requester)
        _trace = start_trace(
            trace_id=_hdr_trace or _stitch_tid, org_id=org_id,
            agent_key=_agent_id, requester=_requester, root_span_id=_stitch_gw,
        )
        _trace["t0"] = _t0
        _mcp_span = None
        if not (_hdr_trace or _stitch_tid):
            # Standalone tool call (no LLM turn to attach to) — emit agent+gateway hops.
            _ag = emit_span(type="agent", name=_agent_id, status="ok", latency_ms=0,
                            attrs={"source": "mcp"})
            _gw = emit_span(type="gateway", name="gateway", status="ok", latency_ms=0,
                            parent_span_id=_ag, attrs={})
            set_parent(_gw)

        try:
            tool = await resolve_tool(org_id, tool_name)
            enforce_tool_acls(agent_key, tool_name)
            await enforce_mcp_rate_limits(agent_key, tool_name)

            if tool.get("requires_approval"):
                # Check if an approved request already exists for this agent+tool
                approved = await get_approved_request(org_id, agent_key["id"], tool_name)
                if not approved:
                    # Reuse an existing pending request if one exists, otherwise create a new one
                    pending = await get_pending_request(org_id, agent_key["id"], tool_name)
                    if pending:
                        approval = pending
                    else:
                        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.mcp_approval_expiry_seconds)
                        approval = await create_approval_request(org_id, {
                            "agent_key_id": agent_key["id"],
                            "tool_id": tool.get("id"),
                            "tool_name": tool_name,
                            "arguments": arguments,
                            "expires_at": expires_at,
                        })
                        await _audit("approval_required", f"Approval request {approval.get('id')} created", False)
                    return JSONResponse(content=_jsonrpc_error(msg_id, -32001, "Tool requires approval", {
                        "approval_id": approval.get("id"),
                        "poll_endpoint": f"/v1/mcp/approvals/{approval.get('id')}/status",
                        "expires_at": approval["expires_at"].isoformat() if hasattr(approval["expires_at"], "isoformat") else str(approval["expires_at"]),
                    }), status_code=200)

            _t_gr = time.time()
            scan_result = await scan_tool_input(org_id, tool_name, arguments)
            if scan_result and scan_result.blocked:
                reason = scan_result.block_reason or "policy violation"
                await _audit("blocked", f"Guardrail: {reason}", False)
                emit_span(type="guardrail", name="tool-input-check", status="block",
                          latency_ms=int((time.time() - _t_gr) * 1000),
                          attrs={"action": "block", "tool": tool_name})
                complete_trace(
                    status="block",
                    totals={"latency_ms": int((time.time() - _t0) * 1000), "tokens": 0, "cost_usd": 0.0},
                    path=["agent", "gateway", "guardrail"],
                )
                return JSONResponse(content=_jsonrpc_error(msg_id, -32003, f"Blocked by guardrail: {reason}"), status_code=200)
            emit_span(type="guardrail", name="tool-input-check", status="ok",
                      latency_ms=int((time.time() - _t_gr) * 1000),
                      attrs={"action": "clean", "tool": tool_name})
            # FlowTrace: mcp hop — server authorized for this tool
            _mcp_span = emit_span(type="mcp", name=f"server-{tool.get('server_id')}", status="ok",
                                  latency_ms=0, attrs={"server_id": tool.get("server_id"), "tool": tool_name})
            set_parent(_mcp_span)

            # Look up cached backend session
            gateway_session = request.headers.get("mcp-session-id")
            backend_session = None
            if gateway_session:
                backend_session = await get_backend_session(gateway_session, tool["server_id"])

            result, new_backend_session = await forward_tool_call(
                server_url=tool["url"],
                auth_type=tool.get("auth_type", "none"),
                auth_config=tool.get("auth_config") or {},
                tool_name=tool_name,
                arguments=arguments,
                session_id=backend_session,
            )

            # Cache new backend session for next call
            if new_backend_session and gateway_session:
                await set_backend_session(gateway_session, tool["server_id"], new_backend_session)

            content_text = None
            if result.get("content"):
                content_text = str(result["content"][0].get("text", ""))
            await _audit("success", content_text, False)

            # FlowTrace: tool hop + completion
            emit_span(type="tool", name=tool_name, status="ok",
                      latency_ms=int((time.time() - start_time) * 1000), parent_span_id=_mcp_span,
                      attrs={"server_id": tool.get("server_id"), "tool": tool_name, "status_code": 200})
            complete_trace(
                status="ok",
                totals={"latency_ms": int((time.time() - _t0) * 1000), "tokens": 0, "cost_usd": 0.0},
                path=["agent", "gateway", "guardrail", "mcp", "tool"],
            )

            return JSONResponse(content=_jsonrpc_result(msg_id, result))

        except ValueError as e:
            await _audit("error", str(e), True)
            emit_span(type="tool", name=tool_name, status="error",
                      latency_ms=int((time.time() - start_time) * 1000), parent_span_id=_mcp_span,
                      attrs={"tool": tool_name, "error": "bad_request"})
            complete_trace(status="error",
                           totals={"latency_ms": int((time.time() - _t0) * 1000), "tokens": 0, "cost_usd": 0.0},
                           path=["agent", "gateway", "guardrail", "mcp", "tool"])
            return JSONResponse(content=_jsonrpc_error(msg_id, -32602, str(e)), status_code=200)
        except HTTPException:
            raise
        except Exception as e:
            await _audit("error", str(e), True)
            emit_span(type="tool", name=tool_name, status="error",
                      latency_ms=int((time.time() - start_time) * 1000), parent_span_id=_mcp_span,
                      attrs={"tool": tool_name, "error": "internal"})
            complete_trace(status="error",
                           totals={"latency_ms": int((time.time() - _t0) * 1000), "tokens": 0, "cost_usd": 0.0},
                           path=["agent", "gateway", "guardrail", "mcp", "tool"])
            logger.error("MCP tool call failed: tool=%s org=%s error=%s", tool_name, org_id, e, exc_info=True)
            return JSONResponse(content=_jsonrpc_error(msg_id, -32603, "Internal error"), status_code=200)

    return JSONResponse(content=_jsonrpc_error(msg_id, -32601, f"Method not found: {method}"), status_code=200)


@router.get("/v1/mcp/approvals/{request_id}/status")
async def mcp_approval_status(request: Request, request_id: int):
    """Poll approval status — authenticated via agent key."""
    agent_key = await _extract_agent_key(request)
    org_id = agent_key["organization_id"]

    approval = await get_approval_status(org_id, request_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    return {
        "approval_id": approval["id"],
        "status": approval["status"],
        "decided_at": approval["decided_at"].isoformat() if approval.get("decided_at") else None,
        "decision_reason": approval.get("decision_reason"),
        "expires_at": approval["expires_at"].isoformat() if approval.get("expires_at") else None,
    }


@router.get("/v1/mcp")
async def mcp_sse(request: Request):
    """SSE endpoint for server-initiated messages. Keep-alive for v1."""
    async def event_stream():
        while True:
            if await request.is_disconnected():
                break
            yield ": keep-alive\n\n"
            await asyncio.sleep(30)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
