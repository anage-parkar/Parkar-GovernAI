# Parkar GovernAI — AI Gateway · Epics & Backlog

> Jira-ready breakdown of the AI Gateway workstream. Project key: **PG**.
> Status legend: ✅ Done · 🟡 In Progress · ⬜ To Do
> Estimates in story points (SP). Statuses reflect work completed to date.

---

## Epic summary

| Epic | Key | Theme | Status | Stories |
|------|-----|-------|--------|---------|
| LLM Gateway Core | **PG-100** | Govern every model call through one endpoint | ✅ Done (expansion pending) | 6 |
| MCP Gateway | **PG-200** | Govern & audit agent tool calls | ✅ Done (HITL pending) | 6 |
| Guardrails & Policy Enforcement | **PG-300** | Inline PII / content / injection controls | ✅ Done (output-side pending) | 6 |
| Observability, Logging & Insights | **PG-400** | Logs, cost, metrics, audit evidence | ✅ Done (export pending) | 6 |
| Agent Onboarding & Integration | **PG-500** | Onboard any agent + per-user attribution | ✅ Done (MS sign-in pending) | 6 |

---

## EPIC PG-100 — LLM Gateway Core
**Summary:** A single OpenAI-compatible endpoint that all LLM traffic routes through, with provider abstraction, per-key scoping, budgets, and rate limits.
**Goal / value:** Apps point at one governed URL instead of providers directly — enabling control and audit with no SDK rewrite.
**Status:** ✅ Done (provider expansion backlogged) · **Labels:** `ai-gateway` `core`

### PG-101 — Provider API key management · ✅ Done · 3 SP
Store upstream provider credentials, encrypted at rest, usable by endpoints.
- **AC:** Admin can add/list/delete keys for OpenAI, Anthropic, Gemini, Mistral, xAI, OpenRouter.
- **AC:** Keys encrypted (AES-256); plaintext never returned after creation.
- Subtasks: provider validation · key masking in responses · encryption-at-rest.

### PG-102 — Endpoint configuration · ✅ Done · 3 SP
Bind provider + model + API key under a short slug.
- **AC:** Endpoint has slug, provider, model (LiteLLM format), linked API key, optional max_tokens/temperature.
- **AC:** The slug is the value clients pass as `model` (real model name hidden).
- Subtasks: slug validation · role-based visibility (`allowed_role_ids`) · cache config.

### PG-103 — Virtual key issuance & scoping · ✅ Done · 3 SP
Issue `sk-vw-…` credentials decoupled from provider keys.
- **AC:** Key shows plaintext once; stored as SHA-256 hash.
- **AC:** Per-key allowed endpoints, model/provider ACLs, budget, rate limit.
- Subtasks: create/revoke API · key prefix display.

### PG-104 — OpenAI-compatible proxy · ✅ Done · 5 SP
Proxy chat completions & embeddings to the resolved provider via LiteLLM.
- **AC:** `POST /v1/chat/completions` and `/v1/embeddings` work with any OpenAI-style SDK.
- **AC:** Streaming and non-streaming both supported.
- Subtasks: `tools`/`tool_choice` passthrough (enables agent tool-calling) · fallback chains · `drop_params` handling.

### PG-105 — Budgets & rate limits · ✅ Done · 3 SP
Enforce per-org/per-key spend caps and request limits.
- **AC:** Budget exhausted → HTTP 402; rate limit exceeded → HTTP 429; both logged.
- **AC:** Monthly budget reset.

### PG-106 — Provider expansion (Azure / Vertex / Bedrock) · ⬜ To Do · 8 SP
Support multi-field provider credentials.
- **AC:** Endpoint creation supports Azure OpenAI (endpoint+version+deployment), Vertex (project+location+SA JSON), Bedrock (AWS keys+region).
- Subtasks: extend `VALID_PROVIDERS` · extend api_keys schema for multi-field creds · UI fields.

---

## EPIC PG-200 — MCP Gateway
**Summary:** Proxy and audit every agent tool call through registered MCP servers, with agent-key auth and ACLs.
**Goal / value:** Govern what agents *do* (tools), not just what they *say* (LLM) — full tool-call audit trail.
**Status:** ✅ Done (approvals/HITL backlogged) · **Labels:** `ai-gateway` `mcp` `agents`

### PG-201 — Register upstream MCP servers · ✅ Done · 3 SP
- **AC:** Admin registers a Streamable-HTTP MCP server (name, slug, url, auth_type).
- **AC:** Health status tracked per server.

### PG-202 — Tool discovery · ✅ Done · 2 SP
- **AC:** "Discover" calls `tools/list` and upserts tools into the registry; removed tools deactivated.

### PG-203 — Agent key issuance & ACLs · ✅ Done · 3 SP
- **AC:** `sk-mcp-…` keys with allowed/blocked tools, allowed servers, rate limit.
- **AC:** Plaintext shown once; SHA-256 stored.

### PG-204 — Tool-call proxy `/v1/mcp` · ✅ Done · 5 SP
- **AC:** Streamable-HTTP JSON-RPC (`initialize`, `tools/list`, `tools/call`) proxied to the correct backend.
- **Bug subtask (✅):** MCP session manager Redis connection — fixed `REDIS_URL` so sessions work in Docker.

### PG-205 — Tool-call audit · ✅ Done · 3 SP
- **AC:** Every call logged (tool, agent key, args, result status, latency).
- **AC:** Stats by-tool and by-agent available.

### PG-206 — Tool approvals (HITL) & per-tool guardrails · 🟡 In Progress · 5 SP
- **AC:** Tools flagged `requires_approval` return an approval request; admin approves/denies.
- **AC:** Per-tool input guardrails (block/mask on arguments).

---

## EPIC PG-300 — Guardrails & Policy Enforcement
**Summary:** Inline request inspection that blocks or masks before the model is reached.
**Goal / value:** Active governance (not just observation); enforced at the gateway so every agent inherits it.
**Status:** ✅ Done (output-side backlogged) · **Labels:** `ai-gateway` `guardrails` `compliance`

### PG-301 — Content filter (keyword / regex) · ✅ Done · 3 SP
- **AC:** Rules with keyword or regex patterns; action block or mask.
- **AC:** Verified: self-harm regex blocks (HTTP 400); clean prompt passes.

### PG-302 — PII detection & masking · ✅ Done · 5 SP
- **AC:** Presidio-based entity detection (CREDIT_CARD, EMAIL_ADDRESS, …) with per-entity block/mask.
- **AC:** Verified: credit card blocked, email masked before reaching model.
- Subtask: score thresholds config.

### PG-303 — Prompt-injection / jailbreak rules · ✅ Done · 2 SP
- **AC:** Regex rule blocks "ignore previous instructions / reveal system prompt / developer mode" style attempts.

### PG-304 — Guardrail logging & stats · ✅ Done · 2 SP
- **AC:** Every detection logged (type, action, entity, matched text); aggregate stats by type/day.

### PG-305 — Output-side (response) guardrails · ⬜ To Do · 5 SP
- **AC:** Scan and block/mask the model's *response*, not just the request.

### PG-306 — Per-org body-logging & guardrail toggles · ⬜ To Do · 2 SP
- **AC:** Org setting to enable/disable request/response body capture for privacy-sensitive clients.

---

## EPIC PG-400 — Observability, Logging & Insights
**Summary:** Full per-request logging plus dashboards turning runtime telemetry into operational and audit insight.
**Goal / value:** "Hand auditors the evidence automatically" — cost, usage, safety, and per-user attribution.
**Status:** ✅ Done (external export backlogged) · **Labels:** `ai-gateway` `observability` `finops`

### PG-401 — Per-request spend logging · ✅ Done · 3 SP
- **AC:** Each call logs provider, model, tokens, cost, latency, status, metadata.
- **Bug subtask (✅):** Fixed `:param::type` SQL casts (jsonb/array) that broke spend logging & key creation.

### PG-402 — Prompt / response / requester capture · ✅ Done · 5 SP
- **AC:** Logs store guardrail-scanned request messages + response text (bounded); expandable in UI.
- **AC:** Requester shown per row via `x-vw-metadata` user tag; system prompts hidden in the view.

### PG-403 — Spend dashboard · ✅ Done · 3 SP
- **AC:** Totals (cost/requests/tokens), avg & **P95 latency**, **error rate**, cache hit rate; by endpoint/user/tag; period filters.

### PG-404 — Operational insights · ✅ Done · 5 SP
- **AC:** Cost per client/agent, budget utilization + NEAR/OVER alerts, 429/402 counts, PII-by-type, per-agent tool latency & blocks, spend anomaly flag.
- Subtask: log 429/402 rejections so they are countable.

### PG-405 — External export (SIEM / monitoring) · ⬜ To Do · 5 SP
- **AC:** Read-only service API key + stable `/metrics` and logs endpoints for Vector AI / SIEM ingestion.
- Subtasks: read-only key auth · Prometheus exporter · webhook on block/budget events.

### PG-406 — Log retention & purge policy · ⬜ To Do · 2 SP
- **AC:** Configurable retention (days) and purge for spend/guardrail/audit logs.

---

## EPIC PG-500 — Agent Onboarding & Integration
**Summary:** Make onboarding any agent a config step, with per-user attribution and reference tooling.
**Goal / value:** Any agent — basic script or multi-agent system — is governed the moment it routes through the gateway.
**Status:** ✅ Done (Microsoft sign-in backlogged) · **Labels:** `ai-gateway` `onboarding` `agents`

### PG-501 — Client agent onboarding pattern · ✅ Done · 3 SP
- **AC:** Documented flow: provider key → endpoint → virtual key → set `base_url` + key + slug.
- **AC:** Validated with OpenAI SDK, LangChain, and Google ADK (LiteLlm) samples.

### PG-502 — Per-user identity tagging · ✅ Done · 2 SP
- **AC:** `x-vw-metadata` header carries app/agent/user; surfaces in logs and `spend/by-tag`.

### PG-503 — AIONIQ chat UI with Google Sign-In · ✅ Done · 5 SP
- **AC:** FastAPI wrapper verifies Google ID token server-side; per-user agent attaches verified email to gateway calls.
- **AC:** Chat UI (sign-in, streaming replies, tool display, guardrail-block messaging).

### PG-504 — Agent MCP toolset wiring · ✅ Done · 3 SP
- **AC:** ADK / LangGraph agents connect tools via `/v1/mcp` with an agent key; calls appear in MCP audit.

### PG-505 — AI Gateway setup guide (docs) · ✅ Done · 2 SP
- **AC:** End-to-end HTML guide: keys → endpoints → virtual keys → connect → guardrails → MCP → logs, with gotchas reference.

### PG-506 — Microsoft sign-in for agent UI · 🟡 In Progress · 3 SP
- **AC:** Entra ID sign-in option on the agent chat (platform Entra SSO already enabled; extend to the agent wrapper).

---

## Suggested sprint sequencing (next backlog)
1. **PG-405** External export (SIEM/Vector AI) — high stakeholder value (manager dashboards).
2. **PG-305** Output-side guardrails — closes the request-only gap.
3. **PG-106** Azure / Vertex / Bedrock providers — unblocks enterprise client agents.
4. **PG-206** Tool approvals (HITL) — enterprise control story.
5. **PG-306 / PG-406** Privacy toggles & retention — compliance hygiene before external clients.

---
*Generated from the AI Gateway implementation work. Import: create Epics PG-100…PG-500, then stories under each; convert "Subtask" bullets to Jira sub-tasks.*
