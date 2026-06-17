"""
AIONIQ agent — minimal web chat with Google Sign-In.

Every signed-in user's messages run through the Parkar GovernAI gateway with
their identity attached (x-vw-metadata user tag), so the Logs page shows the
requester, prompt, response, and per-user cost.

Run (from the repo root):
    python -m uvicorn my_agent.web:app --port 8200

Then open http://localhost:8200
Google Cloud Console: add http://localhost:8200 as an Authorized JavaScript origin.
"""

import asyncio
import json
import os
import time
from pathlib import Path

import google.auth.transport.requests
import google.oauth2.id_token
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from google.adk import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import InMemoryRunner
from google.adk.tools.mcp_tool.mcp_toolset import (
    MCPToolset,
    StreamableHTTPConnectionParams,
)
from google.genai import types

# Loads my_agent/.env into os.environ (same loader the CLI agent uses).
from my_agent.agent import _load_local_env

_load_local_env()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GATEWAY_URL = os.environ.get("VERIFYWISE_GATEWAY_URL", "http://localhost:8100/v1")
GATEWAY_KEY = os.environ.get("VERIFYWISE_GATEWAY_KEY", "")
GATEWAY_MODEL = os.environ.get("VERIFYWISE_GATEWAY_MODEL", "openai/claude-sonnet")
MCP_URL = os.environ.get("VERIFYWISE_MCP_URL", "http://localhost:8100/v1/mcp")
MCP_KEY = os.environ.get("VERIFYWISE_MCP_KEY", "")

APP_NAME = "aioniq-chat"
STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="AIONIQ Agent Chat")

# Per-user runner + session, keyed by verified email.
_runners: dict[str, InMemoryRunner] = {}
_sessions: dict[str, str] = {}
# Per-user lock so concurrent first-requests don't build duplicate runners.
_runner_locks: dict[str, asyncio.Lock] = {}
# Verified-token cache: token -> (claims, expiry_epoch). A user's ID token is
# valid ~1h, so we verify once and reuse it across their messages instead of
# re-fetching Google's certs (a blocking network call) on every request.
_token_cache: dict[str, tuple[dict, float]] = {}


def _make_agent(user_email: str) -> Agent:
    """Build the governed agent for one user — their identity rides on every
    gateway call via the x-vw-metadata tag, which Parkar GovernAI logs."""
    tags = json.dumps(
        {"app": "aioniq", "env": "dev", "agent": "my_agent", "user": user_email}
    )
    tools = []
    if MCP_KEY:
        tools.append(
            MCPToolset(
                connection_params=StreamableHTTPConnectionParams(
                    url=MCP_URL,
                    # Carry the same identity tag on MCP tool calls so FlowTrace can
                    # attribute them and stitch them to the LLM turn that triggered
                    # them (requester-based correlation in the gateway).
                    headers={
                        "Authorization": f"Bearer {MCP_KEY}",
                        "x-vw-metadata": tags,
                    },
                )
            )
        )
    return Agent(
        name="root_agent",
        model=LiteLlm(
            model=GATEWAY_MODEL,
            api_base=GATEWAY_URL,
            api_key=GATEWAY_KEY,
            extra_headers={"x-vw-metadata": tags},
        ),
        description="AIONIQ assistant routed through the Parkar GovernAI gateway.",
        instruction=(
            "You are the AIONIQ assistant. Use the web_search tool for factual or "
            "current-events questions and the calculator tool for arithmetic. "
            "Answer clearly and concisely."
        ),
        tools=tools,
    )


def _verify_token_sync(token: str) -> dict:
    """Blocking Google ID-token verification (fetches Google's signing certs)."""
    return google.oauth2.id_token.verify_oauth2_token(
        token,
        google.auth.transport.requests.Request(),
        GOOGLE_CLIENT_ID,
        # Tolerate small clock drift (avoids "Token used too early/late").
        clock_skew_in_seconds=60,
    )


async def _verify_token(request: Request) -> dict:
    """Verify the Google ID token — cached per token, and the (rare) real
    verification runs in a threadpool so it never blocks the event loop. This is
    what lets many users run concurrently without queueing behind each other."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Google ID token")
    token = auth[7:].strip()
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Server missing GOOGLE_CLIENT_ID")

    now = time.time()
    cached = _token_cache.get(token)
    if cached and cached[1] > now + 30:
        return cached[0]

    try:
        claims = await asyncio.to_thread(_verify_token_sync, token)
    except Exception as e:
        print(f"[auth] 401: token verification failed -> {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    if not claims.get("email"):
        raise HTTPException(status_code=401, detail="Google token has no email")

    _token_cache[token] = (claims, float(claims.get("exp", now + 300)))
    if len(_token_cache) > 512:  # opportunistic cleanup of expired entries
        for k, (_, exp) in list(_token_cache.items()):
            if exp <= now:
                _token_cache.pop(k, None)
    print(f"[auth] OK: {claims.get('email')}")
    return claims


async def _get_runner(email: str) -> tuple[InMemoryRunner, str]:
    # Fast path — already built.
    if email in _runners and email in _sessions:
        return _runners[email], _sessions[email]
    # Build under a per-user lock so concurrent first-requests don't race.
    lock = _runner_locks.setdefault(email, asyncio.Lock())
    async with lock:
        if email not in _runners:
            _runners[email] = InMemoryRunner(agent=_make_agent(email), app_name=APP_NAME)
        if email not in _sessions:
            session = await _runners[email].session_service.create_session(
                app_name=APP_NAME, user_id=email
            )
            _sessions[email] = session.id
    return _runners[email], _sessions[email]


@app.get("/", response_class=HTMLResponse)
async def index():
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    return html.replace("__GOOGLE_CLIENT_ID__", GOOGLE_CLIENT_ID)


@app.post("/api/chat")
async def chat(request: Request):
    claims = await _verify_token(request)
    email = claims["email"]
    body = await request.json()
    message = (body.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    runner, session_id = await _get_runner(email)
    content = types.Content(role="user", parts=[types.Part(text=message)])

    reply_parts: list[str] = []
    tool_calls: list[str] = []
    try:
        async for event in runner.run_async(
            user_id=email, session_id=session_id, new_message=content
        ):
            calls = event.get_function_calls() if hasattr(event, "get_function_calls") else []
            for c in calls or []:
                tool_calls.append(c.name)
            if event.is_final_response() and event.content and event.content.parts:
                for part in event.content.parts:
                    if getattr(part, "text", None):
                        reply_parts.append(part.text)
    except Exception as e:
        # Surface guardrail blocks (gateway 400) and provider errors readably.
        detail = str(e)
        if "blocked by guardrail" in detail:
            return JSONResponse(
                {"reply": "⛔ This request was blocked by a governance guardrail.",
                 "blocked": True, "user": email},
            )
        raise HTTPException(status_code=502, detail=detail[:500])

    return {
        "reply": "\n".join(reply_parts) or "(no response)",
        "tools_used": tool_calls,
        "user": email,
    }


@app.post("/api/reset")
async def reset(request: Request):
    claims = await _verify_token(request)
    _sessions.pop(claims["email"], None)
    return {"status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "client_id_configured": bool(GOOGLE_CLIENT_ID)}
