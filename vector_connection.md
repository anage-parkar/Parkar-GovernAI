# Connecting Parkar GovernAI → Vector AI

How to feed Parkar GovernAI's **logs, audit trail, and metrics** into **Vector AI**
(your monitoring / logging / insights platform) so they can be displayed and analysed there.

```
Parkar GovernAI (source of governance telemetry)            Vector AI (your platform)
──────────────────────────────────────────────             ─────────────────────────
  • LLM spend / token usage logs                  ──┐
  • MCP / tool-call audit                          ──┼──▶  ingest  ──▶  dashboards
  • guardrail (block/mask) events                  ──┤                  metrics
  • service logs + (optional) /metrics             ──┘                  alerts
```

There are **three connection patterns** — pick based on how Vector AI ingests data:

| Pattern | Direction | Use when Vector AI can… | Effort |
|--------|-----------|--------------------------|--------|
| **A. Pull (REST)** *(recommended)* | Vector AI → Parkar | poll an HTTP/JSON API | Low |
| **B. Push (webhook/HTTP export)** | Parkar → Vector AI | receive events at an ingest URL | Medium |
| **C. Direct DB read** | Vector AI → Postgres | query a database directly | Low (internal only) |

---

## What data is available

All governance telemetry is already exposed as JSON REST (the Parkar dashboard uses it).
Two equivalent surfaces:

- **Express API** — `https://<parkar-host>:3000/api/ai-gateway/*` — **JWT / service-key auth** (use this for Vector AI).
- **Gateway internal** — `http://<gateway>:8100/internal/*` — internal-key auth (trusted network only).

| Telemetry | Endpoint (Express) | Payload |
|-----------|--------------------|---------|
| LLM spend / token usage (per request) | `GET /api/ai-gateway/spend/logs?limit=200&offset=0` | `{ "data": [ row, … ] }` |
| Spend summary | `GET /api/ai-gateway/spend?period=30d` | aggregates (cost, tokens, requests) |
| Spend by tag / endpoint / user | `GET /api/ai-gateway/spend/by-tag?tag=app&period=30d` (`/by-endpoint`, `/by-user`) | `{ "data": [ {tag_value,total_cost,total_requests,total_tokens} ] }` |
| MCP / tool-call audit | `GET /api/ai-gateway/mcp/audit/logs` | `{ "data": [ row, … ] }` |
| MCP stats | `GET /api/ai-gateway/mcp/audit/stats/by-tool` (`/by-agent`) | aggregates |
| Guardrail events | `GET /api/ai-gateway/guardrails/logs` | `{ "data": [ row, … ] }` |
| Guardrail stats | `GET /api/ai-gateway/guardrails/stats?period=30d` | summary + byType + byDay |

### Row schemas (what Vector AI will receive)

**Spend log row**
```json
{
  "id": 7, "provider": "anthropic", "model": "claude-sonnet-4-6",
  "prompt_tokens": 64, "completion_tokens": 25, "total_tokens": 89,
  "cost_usd": 0.000483, "latency_ms": 1840, "status_code": 200,
  "virtual_key_id": 1,
  "metadata": { "app": "aioniq", "env": "dev", "agent": "my_agent" },
  "created_at": "2026-06-09T05:56:24Z"
}
```
**MCP audit row**
```json
{
  "id": 2, "tool_name": "web_search", "agent_key_id": 1, "server_id": 1,
  "result_status": "success", "is_error": false, "latency_ms": 482,
  "arguments": { "query": "..." }, "result_summary": "...",
  "session_id": "…", "created_at": "2026-06-09T11:20:20Z"
}
```
**Guardrail log row**
```json
{
  "id": 2, "guardrail_type": "content_filter", "action_taken": "blocked",
  "entity_type": "Block secret codename", "matched_text": "nightfall",
  "endpoint_id": 2, "execution_time_ms": 3, "created_at": "2026-06-09T10:10:52Z"
}
```

---

## Step 0 — Create a read-only access credential

Vector AI needs an auth token to call the Parkar API. Options:

- **Recommended:** a **read-only service API key** (long-lived, can only `GET` logs/metrics).
  > This is the only piece that needs enabling on the Parkar side — ask the Parkar team (or
  > we add a `pk-ro-…` key + middleware). Until then use one of the below.
- **Now (interim):** a JWT from a dedicated service user
  (`POST /api/users/login` → `data.token`); refresh hourly.
- **Internal network only:** call `http://<gateway>:8100/internal/*` with headers
  `x-internal-key`, `x-organization-id`, `x-user-id`, `x-role` (do **not** expose the
  internal key outside a trusted network).

---

## Pattern A — Vector AI pulls from Parkar (recommended)

### Step A1 — Verify the endpoints
```bash
# JWT example
TOKEN=$(curl -s -X POST http://<parkar-host>:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"svc@yourorg.com","password":"…"}' | jq -r .data.token)

curl -s "http://<parkar-host>:3000/api/ai-gateway/spend/logs?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Step A2 — Add a data source in Vector AI
In Vector AI, create an **HTTP / API poller** data source per stream:

| Setting | Value |
|---------|-------|
| Base URL | `http://<parkar-host>:3000` |
| Auth header | `Authorization: Bearer <service-key-or-jwt>` |
| Endpoints | `/api/ai-gateway/spend/logs`, `/api/ai-gateway/mcp/audit/logs`, `/api/ai-gateway/guardrails/logs` |
| Method / format | `GET` / JSON, rows under `data[]` |
| Poll interval | 30–60s |
| Incremental cursor | track max `id` (or `created_at`); request next page with `offset` / `after_id` |

### Step A3 — Map fields to Vector AI's model
Suggested mapping so dashboards/metrics work cleanly:

| Parkar field | Vector AI concept |
|--------------|-------------------|
| `created_at` | timestamp |
| `cost_usd`, `total_tokens`, `latency_ms` | numeric metrics |
| `provider`, `model`, `status_code` | dimensions/labels |
| `metadata.app` / `.agent` / `.env` | tenant/app/agent labels (filtering) |
| `tool_name`, `result_status`, `agent_key_id` | tool-audit dimensions |
| `guardrail_type`, `action_taken`, `matched_text` | safety-event fields |

### Step A4 — De-duplicate
Pollers re-read recent rows. Use the row **`id`** as the unique key in Vector AI (or page
with `offset`/cursor) so repeated polls don't double-count.

---

## Pattern B — Parkar pushes to Vector AI

If Vector AI exposes an **ingest URL / webhook**, have Parkar forward events instead of
being polled. Two ways:

1. **Event webhooks** (real-time, for alerts) — on guardrail block / budget exceeded,
   Parkar `POST`s the event to Vector AI's ingest endpoint. *(Needs a small exporter added
   on the Parkar side — ask the Parkar team / we can wire it.)*
2. **Scheduled forwarder** — a cron/worker reads the same REST endpoints and `POST`s batches
   to `https://<vector-ai>/ingest` with your Vector AI API key.

Vector AI ingest contract to share with Parkar:
```
POST https://<vector-ai-host>/api/ingest
Authorization: Bearer <vector-ai-ingest-key>
Content-Type: application/json
Body: { "source": "parkar-governai", "type": "spend|mcp_audit|guardrail", "events": [ …rows… ] }
```

---

## Pattern C — Direct database read (internal/BI)

Fastest if Vector AI can query Postgres directly (no API):

```sql
-- create a read-only user for Vector AI
CREATE USER vectorai_ro WITH PASSWORD '••••';
GRANT USAGE ON SCHEMA verifywise TO vectorai_ro;
GRANT SELECT ON
  verifywise.ai_gateway_spend_logs,
  verifywise.ai_gateway_mcp_audit_logs,
  verifywise.ai_gateway_guardrail_logs
TO vectorai_ro;
```
Point Vector AI at: host `<parkar-host>:5433` (local) / `postgresdb:5432` (in-cluster),
db `verifywise`, schema `verifywise`. Query the three tables above (incremental on `id`/`created_at`).

---

## Step — Metrics (numeric series)

The endpoints above are **logs**; Vector AI can compute metrics from them (sum `cost_usd`,
count requests, error rate by `status_code`, p95 `latency_ms`, group by `metadata.app`).

For **native metrics scraping**, Parkar would expose a Prometheus `/metrics` endpoint —
**not present yet**. If Vector AI prefers a metrics feed over deriving it from logs, request
the `/metrics` exporter be enabled, then point Vector AI's Prometheus/OpenMetrics scraper at
`http://<gateway>:8100/metrics`.

---

## Step — Verify the connection

1. Generate traffic (run an agent through the gateway).
2. In Parkar: confirm rows exist — `GET /api/ai-gateway/spend/logs?limit=5`.
3. In Vector AI: confirm the same rows appear in the connected source within one poll cycle.
4. Build a first dashboard (e.g. spend by `metadata.app`, tool calls by `tool_name`,
   guardrail blocks over time).

---

## Checklist

- [ ] Read-only credential issued (service key preferred; JWT/internal-key interim)
- [ ] Vector AI source(s) created for spend / mcp_audit / guardrail logs
- [ ] Auth header configured
- [ ] Incremental cursor + de-dupe on `id`
- [ ] Field mapping (cost/tokens/latency as metrics; provider/model/app as labels)
- [ ] (Optional) push webhooks for real-time alerts
- [ ] (Optional) `/metrics` exporter for native metrics
- [ ] First dashboard validated against live agent traffic

---

### Open items needing a Parkar-side change
- **Read-only service API key** (`pk-ro-…`) — for clean Vector AI auth without JWT refresh.
- **Push exporter / webhooks** — only if using Pattern B (real-time).
- **`/metrics` endpoint** — only if Vector AI wants native metrics instead of deriving them.

> Want these built? The read-only key + a stable `/api/governance/logs` & `/metrics`
> surface can be added so Vector AI integrates with one credential and no internal-key exposure.
