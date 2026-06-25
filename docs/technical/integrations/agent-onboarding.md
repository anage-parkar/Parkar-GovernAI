# Onboarding an Agent to Parkar GovernAI

> **Audience:** Developers building an AI agent who want it governed by Parkar GovernAI
> (guardrails, spend metering, request tracing / FlowTrace, and MCP tool governance).
> **Last Updated:** 2026-06-23

---

## How it works (read this first)

Parkar GovernAI's gateway is **OpenAI-API-compatible** (`/v1/chat/completions`, `/v1/embeddings`,
`/v1/models`), built on **LiteLLM**, with **native MCP** for tool governance (`/v1/mcp`).

> **You do not rewrite your agent.** Point your framework's LLM client at the GovernAI gateway
> instead of the model provider, attach an identity tag, and every call is automatically governed
> and traced.

There are exactly **four things** every framework needs:

| # | What | Value |
|---|------|-------|
| 1 | **Base URL** | `https://<your-gateway-host>/v1` (dev: `http://localhost:8100/v1`) |
| 2 | **API key** | Your **gateway virtual key** (issued by a GovernAI admin) |
| 3 | **Model name** | `claude-sonnet` for OpenAI-style clients · `openai/claude-sonnet` for LiteLLM-based clients (CrewAI, ADK). Ask your admin which models are enabled. |
| 4 | **Identity header** | `x-vw-metadata` — a JSON string identifying the agent + user (drives FlowTrace + per-user attribution) |

### The identity header (`x-vw-metadata`)

```json
{"app": "aioniq", "env": "dev", "agent": "<your-agent-name>", "user": "<end-user-email>"}
```

- `agent` → becomes the **agent node** in FlowTrace (falls back to `app`, then the key name).
- `user` → the **end user** the request is attributed to (per-user spend + trace attribution).
- Set `agent` to a stable name for your agent; set `user` per request to the signed-in user.

---

## Step 0 — Get your credentials (one-time)

Ask a GovernAI admin for:

1. **Gateway virtual key** — scoped to your organization, with a budget. Used as the `api_key`.
2. **(Optional) MCP agent key** — only if your agent uses tools through GovernAI's MCP governance.
3. **Gateway base URL** and the **enabled model name(s)**.

Keep keys in env vars / a secret store — never hard-code them.

```bash
export VW_URL="http://localhost:8100/v1"
export VW_KEY="<gateway-virtual-key>"
export VW_MODEL="claude-sonnet"          # use openai/claude-sonnet for LiteLLM-based frameworks
```

---

## Step 1 — Connect your framework

Each section is a complete, minimal, **working** example. ✅ = verified end-to-end against the
running gateway (request succeeded **and** the agent appeared in FlowTrace).

### Google ADK ✅ (reference: `my_agent/web.py`)

```python
import json
from google.adk import Agent
from google.adk.models.lite_llm import LiteLlm

tags = json.dumps({"app": "aioniq", "agent": "my_agent", "user": "x@parkar.in"})

agent = Agent(
    name="root_agent",
    model=LiteLlm(
        model="openai/claude-sonnet",          # LiteLLM 'openai/' = OpenAI-compatible route
        api_base="http://localhost:8100/v1",
        api_key="<GATEWAY_KEY>",
        extra_headers={"x-vw-metadata": tags},
    ),
    instruction="You are a helpful assistant.",
)
```

### LangChain / LangGraph ✅

```python
import json
from langchain_openai import ChatOpenAI

tags = json.dumps({"app": "aioniq", "agent": "langchain-agent", "user": "x@parkar.in"})

llm = ChatOpenAI(
    model="claude-sonnet",
    base_url="http://localhost:8100/v1",
    api_key="<GATEWAY_KEY>",
    default_headers={"x-vw-metadata": tags},
)
print(llm.invoke("Hello").content)
# LangGraph: pass this same `llm` into your graph nodes — no other change.
```

### CrewAI ✅

> **Gotcha:** CrewAI 1.14+ no longer bundles LiteLLM. For a custom endpoint you must also
> `pip install litellm`.

```python
import json
from crewai import Agent, Task, Crew, LLM

tags = json.dumps({"app": "aioniq", "agent": "crewai-agent", "user": "x@parkar.in"})

llm = LLM(
    model="openai/claude-sonnet",              # 'openai/' = OpenAI-compatible route
    base_url="http://localhost:8100/v1",
    api_key="<GATEWAY_KEY>",
    extra_headers={"x-vw-metadata": tags},
)
agent = Agent(role="Assistant", goal="Help the user", backstory="...", llm=llm)
task = Task(description="Say hello", expected_output="A greeting", agent=agent)
print(Crew(agents=[agent], tasks=[task]).kickoff())
```

### Microsoft AutoGen (v0.4: `autogen-agentchat`) ✅

> **Gotcha:** AutoGen needs `model_info={...}` for non-OpenAI model names (it's how it learns the
> model's capabilities).

```python
import asyncio, json
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

tags = json.dumps({"app": "aioniq", "agent": "autogen-agent", "user": "x@parkar.in"})

client = OpenAIChatCompletionClient(
    model="claude-sonnet",
    base_url="http://localhost:8100/v1",
    api_key="<GATEWAY_KEY>",
    default_headers={"x-vw-metadata": tags},
    model_info={"vision": False, "function_calling": True, "json_output": True,
                "family": "unknown", "structured_output": False},
)
agent = AssistantAgent("demo", model_client=client)
print(asyncio.run(agent.run(task="Hello")).messages[-1].content)
```

### OpenAI Agents SDK ✅

> **Gotcha:** disable OpenAI's own tracing (GovernAI/FlowTrace does the tracing), and use the
> **chat-completions** model wrapper since the gateway is chat-completions compatible.

```python
import asyncio, json
from openai import AsyncOpenAI
from agents import Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled

set_tracing_disabled(True)
tags = json.dumps({"app": "aioniq", "agent": "openai-agents-agent", "user": "x@parkar.in"})

client = AsyncOpenAI(base_url="http://localhost:8100/v1", api_key="<GATEWAY_KEY>",
                     default_headers={"x-vw-metadata": tags})
agent = Agent(name="demo", instructions="Be concise.",
              model=OpenAIChatCompletionsModel(model="claude-sonnet", openai_client=client))
print(asyncio.run(Runner.run(agent, "Hello")).final_output)
```

### LlamaIndex (pattern — same OpenAI-compatible contract)

```python
import json
from llama_index.llms.openai_like import OpenAILike

tags = json.dumps({"app": "aioniq", "agent": "llamaindex-agent", "user": "x@parkar.in"})
llm = OpenAILike(
    model="claude-sonnet",
    api_base="http://localhost:8100/v1",
    api_key="<GATEWAY_KEY>",
    is_chat_model=True,
    default_headers={"x-vw-metadata": tags},
)
```

### Microsoft Semantic Kernel (pattern)

```python
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from openai import AsyncOpenAI
import json

tags = json.dumps({"app": "aioniq", "agent": "semantic-kernel-agent", "user": "x@parkar.in"})
client = AsyncOpenAI(base_url="http://localhost:8100/v1", api_key="<GATEWAY_KEY>",
                     default_headers={"x-vw-metadata": tags})
chat = OpenAIChatCompletion(ai_model_id="claude-sonnet", async_client=client)
```

### Vercel AI SDK / Mastra / LangChain.js (TypeScript, pattern)

```ts
import { createOpenAI } from "@ai-sdk/openai";

const tags = JSON.stringify({ app: "aioniq", agent: "vercel-ai-agent", user: "x@parkar.in" });
const openai = createOpenAI({
  baseURL: "http://localhost:8100/v1",
  apiKey: process.env.VW_KEY!,
  headers: { "x-vw-metadata": tags },
});
const model = openai("claude-sonnet");
// LangChain.js: new ChatOpenAI({ model: "claude-sonnet", configuration: { baseURL, defaultHeaders } })
```

> **Any other framework:** if it lets you set a custom **OpenAI base URL + API key + default
> headers** (or uses LiteLLM), it works — follow the same four-step contract above.

---

## Step 2 — (Optional) Govern tool calls via MCP

If your agent uses tools, route them through GovernAI's MCP endpoint to get tool-call **approval,
audit, and guardrails**. Carry the **same `x-vw-metadata` tag** so tool calls stitch to the LLM turn
that triggered them.

**Google ADK example (from `my_agent/web.py`):**
```python
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset, StreamableHTTPConnectionParams

MCPToolset(connection_params=StreamableHTTPConnectionParams(
    url="http://localhost:8100/v1/mcp",
    headers={"Authorization": "Bearer <MCP_KEY>", "x-vw-metadata": tags},
))
```

Most frameworks with MCP support (LangChain MCP adapters, OpenAI Agents SDK MCP, ADK) connect the
same way: point the MCP client at `/v1/mcp` with the MCP key + the metadata tag.

---

## Step 3 — Verify it's governed

1. **Send one request** through your agent.
2. **Check FlowTrace:** open the **Agent Monitor** page in GovernAI (`/ai-gateway/agent-monitor`),
   or query the API:
   ```bash
   curl -s "http://<backend>/api/ai-gateway/flowtrace/agents" -H "Authorization: Bearer <JWT>"
   ```
   You should see your agent listed by its `agent` tag, with trace + distinct-user counts.
3. **Check spend:** `GET /api/ai-gateway/spend/by-user` should show the request attributed to the
   `user` you tagged.

If the agent appears with the right name and user, onboarding is complete — guardrails, spend, and
tracing are now all active automatically.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `401 Unauthorized` | Bad/expired gateway key, or missing `Authorization: Bearer`. |
| Agent shows as the **key name** instead of your agent name | `x-vw-metadata` not sent, or missing `agent` field. Ensure the header is on **every** call. |
| Model "not found" / provider error | Wrong model name. Use `claude-sonnet` (OpenAI-style) or `openai/claude-sonnet` (LiteLLM-style); confirm the model is enabled for your org. |
| CrewAI: `Unable to initialize LLM ... LiteLLM fallback not installed` | `pip install litellm` (CrewAI 1.14+ dropped the bundled dependency). |
| AutoGen: error about unknown model capabilities | Provide `model_info={...}`. |
| Request `400 blocked by guardrail` | Working as intended — a governance guardrail blocked the content. |
| Tool calls not attributed / not stitched | Send the **same** `x-vw-metadata` tag on the MCP connection as on the LLM client. |

---

## Verified status (in this repo)

| Framework | Status |
|---|---|
| Google ADK | ✅ Proven (`my_agent`) |
| LangChain / LangGraph | ✅ Smoke-tested against the gateway |
| CrewAI | ✅ Smoke-tested |
| Microsoft AutoGen (v0.4) | ✅ Smoke-tested |
| OpenAI Agents SDK | ✅ Smoke-tested |
| LlamaIndex, Semantic Kernel, Vercel AI SDK, Mastra, LangChain.js | Pattern provided — same OpenAI-compatible contract, not yet smoke-tested |
