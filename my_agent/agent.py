
# from google.adk.agents.llm_agent import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.tools.mcp_tool.mcp_toolset import (
    MCPToolset,
    StreamableHTTPConnectionParams,
)

# root_agent = Agent(
#     model=LiteLlm(model="anthropic/claude-opus-4-8"),
#     name="root_agent",
#     description="A helpful assistant for user questions.",
#     instruction="Answer user questions to the best of your knowledge",
# )

import os
from pathlib import Path

from google.adk import Agent


def _load_local_env() -> None:
    env_paths = [
        Path(__file__).with_name(".env"),
        Path(__file__).resolve().parent.parent / ".env",
    ]

    for env_path in env_paths:
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if value:
                os.environ[key] = value

    if "GOOGLE_API_KEY" not in os.environ and "GOOGLE_GEMINI_API_KEY" in os.environ:
        os.environ["GOOGLE_API_KEY"] = os.environ["GOOGLE_GEMINI_API_KEY"]

    if "ANTHROPIC_API_KEY" not in os.environ and "CLAUDE_API_KEY" in os.environ:
        os.environ["ANTHROPIC_API_KEY"] = os.environ["CLAUDE_API_KEY"]

    if "CLAUDE_API_KEY" not in os.environ and "ANTHROPIC_API_KEY" in os.environ:
        os.environ["CLAUDE_API_KEY"] = os.environ["ANTHROPIC_API_KEY"]


_load_local_env()

# Route all LLM calls through the VerifyWise AI Gateway (governance: guardrails,
# spend tracking, rate limits). The gateway is OpenAI-compatible, so we use the
# LiteLlm "openai/<endpoint-slug>" form pointed at the gateway's base URL and
# authenticated with a virtual key (sk-vw-...). Config comes from .env.
_GATEWAY_URL = os.environ.get("VERIFYWISE_GATEWAY_URL", "http://localhost:8100/v1")
_GATEWAY_KEY = os.environ.get("VERIFYWISE_GATEWAY_KEY", "")
_GATEWAY_MODEL = os.environ.get("VERIFYWISE_GATEWAY_MODEL", "openai/claude-sonnet")
# Governance tags attached to every request (x-vw-metadata) so this agent's usage
# is isolable on the VerifyWise spend-by-tag dashboard.
_GATEWAY_TAGS = os.environ.get(
    "VERIFYWISE_GATEWAY_TAGS",
    '{"app":"aioniq","env":"dev","agent":"my_agent"}',
)

# Tools come from the VerifyWise MCP Gateway (Streamable HTTP), authenticated with
# an MCP agent key (sk-mcp-...). Every tool call the agent makes is proxied and
# written to VerifyWise's MCP audit log.
_MCP_URL = os.environ.get("VERIFYWISE_MCP_URL", "http://localhost:8100/v1/mcp")
_MCP_KEY = os.environ.get("VERIFYWISE_MCP_KEY", "")

_tools = []
if _MCP_KEY:
    _tools.append(
        MCPToolset(
            connection_params=StreamableHTTPConnectionParams(
                url=_MCP_URL,
                headers={"Authorization": f"Bearer {_MCP_KEY}"},
            )
        )
    )

root_agent = Agent(
    name="root_agent",
    model=LiteLlm(
        model=_GATEWAY_MODEL,
        api_base=_GATEWAY_URL,
        api_key=_GATEWAY_KEY,
        extra_headers={"x-vw-metadata": _GATEWAY_TAGS},
    ),
    description="Assistant routed through the VerifyWise AI Gateway for governance.",
    instruction=(
        "You are a helpful assistant. Use the web_search tool for questions about "
        "facts or current information, and the calculator tool for arithmetic. "
        "Answer clearly and concisely."
    ),
    tools=_tools,
)



