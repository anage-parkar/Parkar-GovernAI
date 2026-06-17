# FlowTrace — Live Agent Graph & Request Tracing

> **Last Updated:** 2026-06-17

FlowTrace adds a real-time **agent flow graph** to the AI Gateway. For a selected
agent it renders the topology
`agent → gateway (guardrail = inspection ring) → llm + connected MCP servers → tools`
and animates the **actual path** each request takes, live, with per-hop
latency/tokens/status and an optional AI-generated trace summary.

UI: **AI Gateway → Agent Monitor** (`/ai-gateway/agent-monitor`). Visual
reference: `docs/design/flowtrace.html`.

---

## The core problem it solves

LLM calls and MCP tool calls are logged as **separate rows** (`ai_gateway_spend_logs`,
`ai_gateway_mcp_audit_logs`, `ai_gateway_guardrail_logs`). FlowTrace **correlates**
them into a single trace so one logical agent request can be reconstructed and
animated as one graph.

### Trace propagation (Option 3 — hybrid)

The agent loop is **client-driven**: the client receives the LLM response, parses
tool calls itself, then calls `POST /v1/mcp` separately. The LLM call and its tool
calls are independent HTTP transactions using **different keys** (`sk-vw-` vs
`sk-mcp-`), so in-process `contextvars` cannot bridge them. FlowTrace therefore:

1. **Honours `X-Trace-Id`** if the client sends it on both calls (precise).
2. Otherwise **stitches heuristically**: the LLM hop drops a short-lived Redis
   pointer keyed by `(org, requester)` (`gw:trace:active:{org}:{requester}`,
   TTL `flowtrace_stitch_ttl_seconds`); the MCP calls that follow look it up and
   attach to the same `trace_id`, parented under the LLM turn's gateway span.

`requester` comes from the `x-vw-metadata` `user` tag. `my_agent` sends it on
**both** the LLM (`LiteLlm.extra_headers`) and MCP (`MCPToolset` headers) calls,
so its turns stitch into complete multi-hop traces.

`contextvars` still correlate spans **within** a single request cleanly.

---

## Span model

Table `ai_gateway_trace_spans` (migration `a0006`), one row per hop:

| field | notes |
|-------|-------|
| `trace_id`, `span_id`, `parent_span_id` | correlation |
| `organization_id`, `agent_key` | tenant + logical agent (requester, else key name) |
| `type` | `agent` \| `gateway` \| `guardrail` \| `llm` \| `mcp` \| `tool` |
| `name`, `status` | `status` ∈ `ok` \| `mask` \| `block` \| `error` \| `running` |
| `ts_start`, `ts_end`, `latency_ms` | timing |
| `attrs` (JSONB) | **masked/summarised only** — see redaction below |

A nullable `trace_id` is also added to `spend_logs` / `mcp_audit_logs` /
`guardrail_logs` for cross-reference.

**Redaction (governance non-negotiable):** `trace_service._safe_attrs` drops
forbidden keys (`content`, `messages`, `arguments`, `matched_text`, `prompt`,
`response`, …), truncates strings, and caps lists. **No secrets, raw PII, or full
payloads ever land in a span.**

---

## Emission & live fan-out

- `services/trace_service.py` — `start_trace`, `emit_span`, `complete_trace`,
  `mark_active_trace` / `lookup_active_trace`, `read_trace_header`.
- Emission is **fire-and-forget** (`asyncio.create_task`) and swallows its own
  errors — it never adds latency to, or fails, the proxied request.
- Spans are persisted **and** published to Redis pub/sub `gw:traces:{org_id}`, so
  the SSE stream works across uvicorn workers.
- Instrumented in `routers/proxy.py` (agent/gateway/guardrail/llm) and
  `routers/mcp_proxy.py` (gateway/guardrail/mcp/tool).
- Retention: `crud.traces.delete_expired_trace_spans` (default
  `flowtrace_retention_days = 7`), exposed at `POST /internal/flowtrace/cleanup`.

---

## API (internal; Express proxies to `/api/ai-gateway/flowtrace/*`)

| Endpoint | Purpose |
|----------|---------|
| `GET /flowtrace/agents` | runtime agents seen in recent traces (left rail) |
| `GET /flowtrace/agents/{agent_key}/graph` | static topology (agent + MCP servers + tools) |
| `GET /flowtrace/traces?agent=&limit=` | recent traces |
| `GET /flowtrace/traces/{trace_id}` | full reconstructed trace |
| `GET /flowtrace/traces/{trace_id}/insight` | cached AI insight (Phase 4) |
| `GET /flowtrace/traces/stream` | **SSE** — `span` / `trace.completed` / `trace.insight` |
| `POST /flowtrace/cleanup` | retention sweep (Admin) |

All scope to `organization_id` (tenant boundary). The SSE stream has a dedicated
no-timeout proxy route in `Servers/routes/aiGateway.route.ts` (the catch-all's 30s
timeout would otherwise kill it).

---

## Frontend

`Clients/src/presentation/pages/AIGateway/AgentMonitoring/`
- `index.tsx` — page (rail, header stats, live event log, insight/waterfall/totals).
- `FlowGraph.tsx` — SVG bezier edges + `<animateMotion>` packets + spinning
  guardrail ring; topology from the backend, driven imperatively by live spans.
- `useTraceStream.ts` — SSE via `fetch()` + `ReadableStream` (JWT in header,
  auto-reconnect), mirroring `useNotifications`.
- `styles.ts` — dark theme scoped under `.ft-root`.

Mask vs block differ visibly (amber vs red ring; blocked path stops before
llm/mcp). Respects `prefers-reduced-motion`.

---

## AI insight (Phase 4 — feature-flagged, off by default)

On `trace.completed`, `services/trace_insight_service.py` summarises the **span
rollup** (PII-free) via our own gateway, caches it per `trace_id` (Redis, 24h),
and publishes `trace.insight`. Enable with:

```
FLOWTRACE_AI_INSIGHT_ENABLED=true
FLOWTRACE_INSIGHT_ENDPOINT=<a cheap endpoint slug>
FLOWTRACE_INSIGHT_VK=sk-vw-<a virtual key>
```

When off, the UI shows a deterministic local summary derived from the trace.

---

## Config (`AIGateway/src/config.py`)

`flowtrace_enabled` (default true), `flowtrace_retention_days` (7),
`flowtrace_stitch_ttl_seconds` (90), `flowtrace_ai_insight_enabled` (false),
`flowtrace_insight_endpoint`, `flowtrace_insight_vk`.

---

## Tests

`AIGateway/tests/test_13_flowtrace.py` — redaction guard (no PII/payload leakage),
status-severity ordering, canonical path order, id shapes, `X-Trace-Id` validation.
