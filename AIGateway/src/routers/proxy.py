"""
Public proxy endpoints — authenticated via virtual keys (no JWT required).

Employees point their OpenAI SDK here:
    client = OpenAI(base_url="https://gateway.company.com/v1", api_key="sk-vw-xxx")

These endpoints handle the full request lifecycle:
    1. Authenticate virtual key
    2. Resolve endpoint (provider, model, API key)
    3. Check budget + rate limits
    4. Run guardrails on input
    5. Forward to LLM via litellm
    6. Log spend + reconcile budget
"""

import asyncio
import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from services.trace_service import (
    start_trace,
    emit_span,
    complete_trace,
    read_trace_header,
    mark_active_trace,
    set_parent,
    current as current_trace,
)

from services.proxy_service import (
    authenticate_virtual_key,
    resolve_endpoint_for_key,
    resolve_endpoint_by_id,
    enforce_model_provider_acls,
    check_org_budget,
    reconcile_budget,
    enforce_rate_limits,
    log_spend,
    log_cache_hit,
    run_guardrails,
)
from services.cache_service import generate_cache_key, check_cache, store_in_cache, is_cache_globally_enabled
from services.cost_service import estimate_prompt_cost
from services.llm_service import chat_completion, embedding, stream_chat_completion

logger = logging.getLogger("uvicorn")

router = APIRouter()

MAX_FALLBACK_DEPTH = 3


# ─── Request Models ──────────────────────────────────────────────────────────

class ProxyChatRequest(BaseModel):
    model: str  # endpoint slug
    messages: list[dict]
    stream: bool = False
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, ge=1, le=128000)
    top_p: Optional[float] = Field(None, ge=0, le=1)
    # Tool / function calling passthrough (needed for agents using MCP tools).
    tools: Optional[list] = None
    tool_choice: Optional[object] = None


class ProxyEmbeddingRequest(BaseModel):
    model: str  # endpoint slug
    input: str | list[str]


# ─── Auth Helper ─────────────────────────────────────────────────────────────

async def _extract_virtual_key(request: Request) -> dict:
    """Extract and validate virtual key from Authorization header."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <virtual-key>")
    token = auth[7:].strip()
    try:
        return await authenticate_virtual_key(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


def _apply_request_tags(vk: dict, request: Request) -> None:
    """Merge optional per-request governance tags (x-vw-metadata: JSON object)
    onto the virtual key so they are recorded in the spend log metadata and
    surface in the spend-by-tag dashboard (e.g. {"app": "aioniq", "env": "dev"})."""
    raw = request.headers.get("x-vw-metadata")
    if not raw:
        return
    try:
        parsed = json.loads(raw)
    except Exception:
        return
    if isinstance(parsed, dict):
        vk["_extra_metadata"] = {str(k): str(v) for k, v in parsed.items()}


# ─── Chat Completions ────────────────────────────────────────────────────────

@router.post("/v1/chat/completions")
async def proxy_chat(request: Request, body: ProxyChatRequest):
    """OpenAI-compatible chat completions endpoint with virtual key auth."""
    vk = await _extract_virtual_key(request)
    _apply_request_tags(vk, request)
    org_id = vk["organization_id"]
    endpoint_slug = body.model  # "model" field is the endpoint slug

    # ── FlowTrace: open the trace for this request (agent hop) ──────────────
    # Agent identity is the APP/AGENT (stable, shared by many users) — the `agent`
    # or `app` x-vw-metadata tag, else the virtual-key name. The end user (`user`
    # tag) is per-request attribution (requester), NOT a separate agent. This is
    # how it works in prod: one agent, many users pointing at the gateway.
    _t_req = time.time()
    _meta = vk.get("_extra_metadata") or {}
    _requester = _meta.get("user")
    _agent_id = _meta.get("agent") or _meta.get("app") or vk.get("name") or f"vk:{vk.get('id')}"
    _trace = start_trace(
        trace_id=read_trace_header(request.headers),
        org_id=org_id, agent_key=_agent_id, requester=_requester,
    )
    _trace["t0"] = _t_req
    _agent_span = emit_span(type="agent", name=_agent_id, status="ok", latency_ms=0,
                            attrs={"source": "llm", "requester": _requester})
    set_parent(_agent_span)

    try:
        endpoint = await resolve_endpoint_for_key(
            org_id, endpoint_slug, vk.get("allowed_endpoint_ids") or [],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Model/provider access control
    try:
        enforce_model_provider_acls(vk, endpoint)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # FlowTrace: gateway hop (auth + routing + ACLs done). Mark this requester as
    # mid-trace so the client-driven MCP tool calls that follow stitch into it.
    _gw_span = emit_span(
        type="gateway", name="gateway", status="ok",
        latency_ms=int((time.time() - _t_req) * 1000), parent_span_id=_agent_span,
        attrs={"model": endpoint["model"], "provider": endpoint["provider"],
               "endpoint": endpoint.get("slug")},
    )
    set_parent(_gw_span)
    asyncio.create_task(mark_active_trace(org_id, _requester, _trace["trace_id"], _gw_span))

    _reject_meta = {"virtual_key_id": str(vk["id"]), **vk.get("_extra_metadata", {})}

    # Rate limit: per-endpoint + per-key (log the 429 rejection so it's countable)
    try:
        await enforce_rate_limits(endpoint, vk)
    except HTTPException as e:
        if e.status_code == 429:
            await log_spend(
                organization_id=org_id, endpoint_id=endpoint["id"], virtual_key_id=vk["id"],
                provider=endpoint["provider"], model=endpoint["model"],
                prompt_tokens=0, completion_tokens=0, total_tokens=0,
                cost_usd=0.0, latency_ms=0, status_code=429, metadata=_reject_meta,
            )
        raise

    # Cost estimation + budget check (log the 402 rejection so it's countable)
    estimated_cost = estimate_prompt_cost(
        model=endpoint["model"],
        messages=body.messages,
        max_tokens=body.max_tokens or endpoint.get("max_tokens") or 4096,
    )
    if not await check_org_budget(org_id, estimated_cost):
        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"], virtual_key_id=vk["id"],
            provider=endpoint["provider"], model=endpoint["model"],
            prompt_tokens=0, completion_tokens=0, total_tokens=0,
            cost_usd=0.0, latency_ms=0, status_code=402, metadata=_reject_meta,
        )
        raise HTTPException(status_code=402, detail="Organization budget limit exceeded")

    # Guardrails (FlowTrace: guardrail hop — the ring inspects every request)
    _t_gr = time.time()
    try:
        scanned_messages = await run_guardrails(org_id, body.messages, endpoint["id"], vk=vk)
    except HTTPException as gr_exc:
        if gr_exc.status_code == 400:
            emit_span(type="guardrail", name="input-check", status="block",
                      latency_ms=int((time.time() - _t_gr) * 1000), parent_span_id=_gw_span,
                      attrs={"action": "block"})
            complete_trace(
                status="block",
                totals={"latency_ms": int((time.time() - _t_req) * 1000), "tokens": 0, "cost_usd": 0.0},
                path=["agent", "gateway", "guardrail"],
            )
        raise
    _gr_masked = scanned_messages != body.messages
    emit_span(type="guardrail", name="input-check",
              status="mask" if _gr_masked else "ok",
              latency_ms=int((time.time() - _t_gr) * 1000), parent_span_id=_gw_span,
              attrs={"action": "mask" if _gr_masked else "clean"})

    # --- Cache check (exact match, after guardrails for security) ---
    prompt_hash = None
    cache_hit = None
    use_cache = (
        endpoint.get("cache_enabled")
        and not body.stream
        and await is_cache_globally_enabled(org_id)
    )
    if use_cache:
        # Include system prompt in hash — it affects the LLM response
        cache_messages = scanned_messages
        if endpoint.get("system_prompt"):
            cache_messages = [{"role": "system", "content": endpoint["system_prompt"]}] + scanned_messages
        prompt_hash = generate_cache_key(
            model=endpoint["model"],
            messages=cache_messages,
            temperature=body.temperature if body.temperature is not None else endpoint.get("temperature"),
            max_tokens=body.max_tokens or endpoint.get("max_tokens"),
        )
        cache_hit = await check_cache(org_id, endpoint["id"], prompt_hash)

    if cache_hit is not None:
        await log_cache_hit(
            organization_id=org_id,
            endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"],
            provider=endpoint["provider"],
            model=cache_hit.get("model", endpoint["model"]),
            prompt_tokens=cache_hit.get("prompt_tokens", 0),
            completion_tokens=cache_hit.get("completion_tokens", 0),
            total_tokens=cache_hit.get("total_tokens", 0),
            original_cost_usd=float(cache_hit.get("cost_usd", 0)),
            latency_ms=0,
        )
        # Reverse the budget estimate (cache hits are free)
        await reconcile_budget(org_id, estimated_cost, 0)
        cached_response = json.loads(cache_hit["response_body"])
        return JSONResponse(
            content=cached_response,
            headers={"x-vw-cache": "HIT"},
        )

    # Build final messages (system prompt prepended if configured)
    final_messages = scanned_messages
    if endpoint.get("system_prompt"):
        final_messages = [{"role": "system", "content": endpoint["system_prompt"]}] + scanned_messages

    # Build kwargs
    kwargs = {}
    if body.temperature is not None or endpoint.get("temperature") is not None:
        kwargs["temperature"] = body.temperature if body.temperature is not None else float(endpoint["temperature"])
    if body.max_tokens is not None or endpoint.get("max_tokens") is not None:
        kwargs["max_tokens"] = body.max_tokens or endpoint["max_tokens"]
    if body.top_p is not None:
        kwargs["top_p"] = body.top_p
    if body.tools is not None:
        kwargs["tools"] = body.tools
    if body.tool_choice is not None:
        kwargs["tool_choice"] = body.tool_choice

    start_time = time.time()

    if body.stream:
        return await _handle_stream(
            org_id, vk, endpoint, final_messages, kwargs, estimated_cost, start_time,
        )

    return await _handle_completion(
        org_id, vk, endpoint, final_messages, kwargs, estimated_cost, start_time,
        _prompt_hash=prompt_hash,
        _scanned_messages=scanned_messages if prompt_hash else None,
    )


async def _handle_completion(
    org_id: int, vk: dict, endpoint: dict,
    messages: list[dict], kwargs: dict,
    estimated_cost: float, start_time: float,
    _depth: int = 0,
    _prompt_hash: Optional[str] = None,
    _scanned_messages: Optional[list[dict]] = None,
):
    """Non-streaming completion with fallback support and optional cache store."""
    try:
        result = await chat_completion(
            model=endpoint["model"],
            messages=messages,
            api_key=endpoint["decrypted_key"],
            **kwargs,
        )

        latency_ms = int((time.time() - start_time) * 1000)
        usage = result.get("usage", {})
        cost = result.get("cost_usd", 0)

        choices = result.get("choices") or [{}]
        await log_spend(
            organization_id=org_id,
            endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"],
            provider=endpoint["provider"],
            model=result.get("model", endpoint["model"]),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            cost_usd=cost,
            latency_ms=latency_ms,
            metadata={"virtual_key_id": str(vk["id"]), **vk.get("_extra_metadata", {})},
            # messages are post-guardrail (PII already masked) — safe to audit
            request_messages=messages,
            response_text=(choices[0].get("message") or {}).get("content"),
        )
        await reconcile_budget(org_id, estimated_cost, cost)

        # FlowTrace: llm hop + completion (parent = gateway, via context)
        _has_tools = bool((choices[0].get("message") or {}).get("tool_calls"))
        emit_span(
            type="llm", name=result.get("model", endpoint["model"]), status="ok",
            latency_ms=latency_ms,
            attrs={
                "tokens": usage.get("total_tokens", 0),
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "cost_usd": round(float(cost or 0), 6),
                "tool_calls": _has_tools,
            },
        )
        _tc = current_trace()
        complete_trace(
            status="ok",
            totals={
                "latency_ms": int((time.time() - (_tc or {}).get("t0", start_time)) * 1000),
                "tokens": usage.get("total_tokens", 0),
                "cost_usd": round(float(cost or 0), 6),
            },
            path=["agent", "gateway", "guardrail", "llm"],
        )

        # Store in cache if caching enabled
        if _prompt_hash:
            await store_in_cache(
                organization_id=org_id,
                endpoint_id=endpoint["id"],
                prompt_hash=_prompt_hash,
                model=result.get("model", endpoint["model"]),
                messages=_scanned_messages or messages,
                response_body=json.dumps(result),
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
                cost_usd=cost,
                ttl_seconds=endpoint.get("cache_ttl_seconds", 14400),
            )

        return JSONResponse(content=result, headers={"x-vw-cache": "MISS" if _prompt_hash else "DISABLED"})

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)

        # Log failed request
        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"], provider=endpoint["provider"],
            model=endpoint["model"], prompt_tokens=0, completion_tokens=0,
            total_tokens=0, cost_usd=0, latency_ms=latency_ms, status_code=500,
        )
        await reconcile_budget(org_id, estimated_cost, 0)

        # Fallback — don't cache fallback responses against original endpoint.
        # The recursive call emits its own llm span + completion, so don't here.
        if endpoint.get("fallback_endpoint_id") and _depth < MAX_FALLBACK_DEPTH:
            fallback = await resolve_endpoint_by_id(org_id, endpoint["fallback_endpoint_id"])
            if fallback:
                logger.info(f"Falling back to {fallback['slug']} (depth {_depth + 1})")
                return await _handle_completion(
                    org_id, vk, fallback, messages, kwargs, 0, time.time(), _depth + 1,
                    _prompt_hash=None, _scanned_messages=None,
                )

        # FlowTrace: llm hop errored, no fallback left
        emit_span(type="llm", name=endpoint["model"], status="error", latency_ms=latency_ms,
                  attrs={"error": "provider_error"})
        _tc = current_trace()
        complete_trace(
            status="error",
            totals={"latency_ms": int((time.time() - (_tc or {}).get("t0", start_time)) * 1000),
                    "tokens": 0, "cost_usd": 0.0},
            path=["agent", "gateway", "guardrail", "llm"],
        )
        logger.error(f"LLM provider error: {e}")
        raise HTTPException(status_code=502, detail="LLM provider request failed")


async def _handle_stream(
    org_id: int, vk: dict, endpoint: dict,
    messages: list[dict], kwargs: dict,
    estimated_cost: float, start_time: float,
):
    """Streaming completion — returns SSE response."""

    async def _stream_generator():
        total_prompt = 0
        total_completion = 0
        total_cost = 0.0
        final_model = endpoint["model"]
        response_parts: list[str] = []

        try:
            async for chunk_str in stream_chat_completion(
                model=endpoint["model"],
                messages=messages,
                api_key=endpoint["decrypted_key"],
                **kwargs,
            ):
                yield chunk_str

                # Parse SSE for usage data
                if chunk_str.startswith("data: ") and chunk_str.strip() != "data: [DONE]":
                    try:
                        chunk = json.loads(chunk_str[6:])
                        if "usage" in chunk:
                            total_prompt = chunk["usage"].get("prompt_tokens", total_prompt)
                            total_completion = chunk["usage"].get("completion_tokens", total_completion)
                        if "cost_usd" in chunk:
                            total_cost = chunk["cost_usd"]
                        if "model" in chunk:
                            final_model = chunk["model"]
                        delta = (chunk.get("choices") or [{}])[0].get("delta") or {}
                        if isinstance(delta.get("content"), str):
                            response_parts.append(delta["content"])
                    except (json.JSONDecodeError, KeyError):
                        pass

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': 'LLM provider stream failed'})}\n\n"
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            await log_spend(
                organization_id=org_id, endpoint_id=endpoint["id"],
                virtual_key_id=vk["id"], provider=endpoint["provider"],
                model=final_model,
                prompt_tokens=total_prompt, completion_tokens=total_completion,
                total_tokens=total_prompt + total_completion,
                cost_usd=total_cost, latency_ms=latency_ms,
                metadata={"virtual_key_id": str(vk["id"]), **vk.get("_extra_metadata", {})},
                request_messages=messages,
                response_text="".join(response_parts) or None,
            )
            await reconcile_budget(org_id, estimated_cost, total_cost)

            # FlowTrace: llm hop + completion for the streamed response
            emit_span(
                type="llm", name=final_model, status="ok", latency_ms=latency_ms,
                attrs={"tokens": total_prompt + total_completion,
                       "prompt_tokens": total_prompt, "completion_tokens": total_completion,
                       "cost_usd": round(float(total_cost or 0), 6), "stream": True},
                trace=_trace_ctx,
            )
            complete_trace(
                status="ok",
                totals={"latency_ms": int((time.time() - (_trace_ctx or {}).get("t0", start_time)) * 1000) if _trace_ctx else latency_ms,
                        "tokens": total_prompt + total_completion,
                        "cost_usd": round(float(total_cost or 0), 6)},
                path=["agent", "gateway", "guardrail", "llm"],
                trace=_trace_ctx,
            )

    # Capture the trace context now — the generator runs as a separate task where
    # the contextvar would otherwise be lost.
    _trace_ctx = current_trace()
    return StreamingResponse(_stream_generator(), media_type="text/event-stream")


# ─── Embeddings ──────────────────────────────────────────────────────────────

@router.post("/v1/embeddings")
async def proxy_embeddings(request: Request, body: ProxyEmbeddingRequest):
    """OpenAI-compatible embeddings endpoint with virtual key auth."""
    vk = await _extract_virtual_key(request)
    _apply_request_tags(vk, request)
    org_id = vk["organization_id"]
    endpoint_slug = body.model

    try:
        endpoint = await resolve_endpoint_for_key(
            org_id, endpoint_slug, vk.get("allowed_endpoint_ids") or [],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Model/provider access control
    try:
        enforce_model_provider_acls(vk, endpoint)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Rate limit
    await enforce_rate_limits(endpoint, vk)

    # Guardrails on embedding input
    input_texts = body.input if isinstance(body.input, list) else [body.input]
    scanned_texts = []
    for text_item in input_texts:
        scanned = await run_guardrails(
            org_id, [{"role": "user", "content": text_item}], endpoint["id"], vk=vk,
        )
        scanned_texts.append(scanned[0].get("content", text_item))

    # Cost estimation + budget
    estimated_cost = estimate_prompt_cost(
        model=endpoint["model"],
        messages=[{"role": "user", "content": " ".join(scanned_texts)}],
    )
    if not await check_org_budget(org_id, estimated_cost):
        raise HTTPException(status_code=402, detail="Budget limit exceeded")

    start_time = time.time()

    try:
        result = await embedding(
            model=endpoint["model"],
            input_text=scanned_texts if isinstance(body.input, list) else scanned_texts[0],
            api_key=endpoint["decrypted_key"],
        )

        latency_ms = int((time.time() - start_time) * 1000)
        usage = result.get("usage", {})
        cost = result.get("cost_usd", 0)

        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"], provider=endpoint["provider"],
            model=result.get("model", endpoint["model"]),
            prompt_tokens=usage.get("prompt_tokens", 0), completion_tokens=0,
            total_tokens=usage.get("total_tokens", 0),
            cost_usd=cost, latency_ms=latency_ms,
            metadata={"virtual_key_id": str(vk["id"]), **vk.get("_extra_metadata", {})},
        )
        await reconcile_budget(org_id, estimated_cost, cost)

        return JSONResponse(content=result)

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"], provider=endpoint["provider"],
            model=endpoint["model"], prompt_tokens=0, completion_tokens=0,
            total_tokens=0, cost_usd=0, latency_ms=latency_ms, status_code=500,
        )
        await reconcile_budget(org_id, estimated_cost, 0)
        logger.error(f"Embedding error: {e}")
        raise HTTPException(status_code=502, detail="Embedding request failed")


# ─── Models List ─────────────────────────────────────────────────────────────

@router.get("/v1/models")
async def list_models_for_key(request: Request):
    """List available endpoint slugs for the authenticated virtual key."""
    vk = await _extract_virtual_key(request)
    _apply_request_tags(vk, request)
    from src.database.db import get_db
    from sqlalchemy import text as sql_text

    db = await get_db()
    try:
        allowed = vk.get("allowed_endpoint_ids") or []
        if allowed:
            result = await db.execute(
                sql_text("""
                    SELECT slug AS id, display_name AS name, provider, model
                    FROM ai_gateway_endpoints
                    WHERE organization_id = :org_id AND is_active = true
                      AND id = ANY(:ids)
                    ORDER BY display_name
                """),
                {"org_id": vk["organization_id"], "ids": allowed},
            )
        else:
            result = await db.execute(
                sql_text("""
                    SELECT slug AS id, display_name AS name, provider, model
                    FROM ai_gateway_endpoints
                    WHERE organization_id = :org_id AND is_active = true
                    ORDER BY display_name
                """),
                {"org_id": vk["organization_id"]},
            )
        models = [dict(r) for r in result.mappings().fetchall()]
        return {"object": "list", "data": [{"id": m["id"], "object": "model", "owned_by": m["provider"]} for m in models]}
    finally:
        await db.close()
