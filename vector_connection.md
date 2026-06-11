# Connecting Parkar GovernAI to External Apps with Vector

This guide configures **[Vector](https://vector.dev)** (the observability data pipeline) to
collect Parkar GovernAI's **logs and metrics** and route them to other applications —
SIEMs, dashboards, data lakes, or your own services.

Vector follows a **sources → transforms → sinks** model:

```
Parkar GovernAI                 Vector                         Destinations
─────────────────        ───────────────────          ───────────────────────
spend / usage logs  ──▶   http_client (poll)   ──┐
MCP / tool audit    ──▶   http_client (poll)   ──┼─▶ remap ──▶  Elasticsearch
guardrail events    ──▶   http_client (poll)   ──┤              Splunk / Datadog
container logs      ──▶   docker_logs          ──┤              Loki / Grafana
metrics (optional)  ──▶   prometheus_scrape    ──┘              S3 / Kafka
                                                                your app (HTTP)
```

> **Do you need to build new APIs first?** No. Parkar GovernAI already exposes the
> data over REST (the dashboard uses it). Vector just polls those endpoints. The only
> production hardening is auth (see [Step 5](#step-5--production-hardening)).

---

## What data is available

| Data | Source endpoint (gateway, internal) | Returns |
|------|-------------------------------------|---------|
| LLM spend / token usage (per request) | `GET /internal/spend/logs?limit=N` | `{ "data": [ {provider, model, total_tokens, cost_usd, status_code, metadata, created_at}, … ] }` |
| Spend summary / by tag | `GET /internal/spend?period=30d`, `/internal/spend/by-tag?tag=app` | aggregates |
| MCP / tool-call audit | `GET /internal/mcp/audit/logs` | `{ "data": [ {tool_name, agent_key_id, result_status, latency_ms, arguments, …} ] }` |
| Guardrail events (blocks/masks) | `GET /internal/guardrails/logs` | `{ "rules"/"data": [ … ] }` |
| Raw service logs | container stdout (`ai_gateway`, `backend`) | text/JSON lines |

> Via the Express backend the same data is at `/api/ai-gateway/*` (JWT-auth). For a
> machine pipeline it's simpler to hit the gateway's `/internal/*` routes directly with
> the internal key (see auth note below).

---

## Prerequisites

- Parkar GovernAI running via Docker Compose (network `verifywise_default`).
- The gateway internal key (`AI_GATEWAY_INTERNAL_KEY` from `.env.dev`).
- Your org/user/role for the tenant headers (e.g. org `1`, user `2`, role `Admin`).
- A destination to ship to (Elasticsearch / Splunk / Datadog / Loki / your HTTP API …).

---

## Step 1 — Create the Vector config

Create `vector.yaml` in the repo root:

```yaml
# vector.yaml — Parkar GovernAI → external apps

# ── SOURCES ──────────────────────────────────────────────────────────────
sources:
  # 1) Poll LLM spend / token-usage logs every 60s
  spend_logs:
    type: http_client
    endpoint: "http://ai_gateway:8100/internal/spend/logs?limit=200"
    method: GET
    scrape_interval_secs: 60
    headers:
      x-internal-key: ["${AI_GATEWAY_INTERNAL_KEY}"]
      x-organization-id: ["1"]
      x-user-id: ["2"]
      x-role: ["Admin"]
    decoding: { codec: json }

  # 2) Poll MCP / tool-call audit
  mcp_audit:
    type: http_client
    endpoint: "http://ai_gateway:8100/internal/mcp/audit/logs"
    method: GET
    scrape_interval_secs: 60
    headers:
      x-internal-key: ["${AI_GATEWAY_INTERNAL_KEY}"]
      x-organization-id: ["1"]
      x-user-id: ["2"]
      x-role: ["Admin"]
    decoding: { codec: json }

  # 3) Poll guardrail events
  guardrail_logs:
    type: http_client
    endpoint: "http://ai_gateway:8100/internal/guardrails/logs"
    method: GET
    scrape_interval_secs: 60
    headers:
      x-internal-key: ["${AI_GATEWAY_INTERNAL_KEY}"]
      x-organization-id: ["1"]
      x-user-id: ["2"]
      x-role: ["Admin"]
    decoding: { codec: json }

  # 4) Tail raw container logs (needs the docker socket mounted)
  service_logs:
    type: docker_logs
    include_containers:
      - "verifywise-ai_gateway-1"
      - "verifywise-backend-1"

# ── TRANSFORMS ───────────────────────────────────────────────────────────
# The REST responses wrap rows in {"data": [...]}. Unroll into one event per row
# and stamp a source label so destinations can filter.
transforms:
  spend_rows:
    type: remap
    inputs: ["spend_logs"]
    source: |
      rows = array(.data) ?? []
      . = map_values(rows) -> |row| { merge(row, { "vw_source": "spend" }) }
    # NOTE: see "Array unrolling" below if your Vector version needs the lua/unnest pattern.

  mcp_rows:
    type: remap
    inputs: ["mcp_audit"]
    source: |
      rows = array(.data) ?? []
      . = map_values(rows) -> |row| { merge(row, { "vw_source": "mcp_audit" }) }

  guardrail_rows:
    type: remap
    inputs: ["guardrail_logs"]
    source: |
      rows = array(.data) ?? array(.rules) ?? []
      . = map_values(rows) -> |row| { merge(row, { "vw_source": "guardrail" }) }

# ── SINKS (destinations) ─────────────────────────────────────────────────
sinks:
  # Start here: print to console to confirm data flows
  debug_console:
    type: console
    inputs: ["spend_rows", "mcp_rows", "guardrail_rows", "service_logs"]
    encoding: { codec: json }
```

---

## Step 2 — Run Vector on the same Docker network

Add a service to `docker-compose.override.yml` (so Vector can reach `ai_gateway:8100`):

```yaml
  vector:
    image: timberio/vector:0.40.0-debian
    depends_on: [ai_gateway]
    volumes:
      - ./vector.yaml:/etc/vector/vector.yaml:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro   # only needed for docker_logs
    environment:
      - AI_GATEWAY_INTERNAL_KEY=${AI_GATEWAY_INTERNAL_KEY}
```

Start it:

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml --env-file .env.dev up -d vector
docker compose -f docker-compose.yml -f docker-compose.override.yml --env-file .env.dev logs -f vector
```

You should see JSON events (spend/MCP/guardrail rows + container logs) in the Vector logs.
Generate some traffic (run the agent) and watch new rows appear.

---

## Step 3 — Point it at your destination

Replace/append the `debug_console` sink with your real target. Examples:

**Elasticsearch / OpenSearch**
```yaml
  elasticsearch:
    type: elasticsearch
    inputs: ["spend_rows", "mcp_rows", "guardrail_rows"]
    endpoints: ["http://your-es:9200"]
    bulk: { index: "parkar-governai-%Y.%m.%d" }
```

**Splunk (HEC)**
```yaml
  splunk:
    type: splunk_hec_logs
    inputs: ["spend_rows", "mcp_rows", "guardrail_rows", "service_logs"]
    endpoint: "https://splunk:8088"
    default_token: "${SPLUNK_HEC_TOKEN}"
```

**Datadog Logs**
```yaml
  datadog:
    type: datadog_logs
    inputs: ["spend_rows", "mcp_rows", "guardrail_rows"]
    default_api_key: "${DD_API_KEY}"
```

**Grafana Loki**
```yaml
  loki:
    type: loki
    inputs: ["spend_rows", "mcp_rows", "guardrail_rows"]
    endpoint: "http://loki:3100"
    labels: { source: "{{ vw_source }}", app: "parkar-governai" }
```

**Your own application (generic HTTP)**
```yaml
  downstream_app:
    type: http
    inputs: ["spend_rows", "mcp_rows", "guardrail_rows"]
    uri: "https://your-app.example.com/ingest"
    method: post
    encoding: { codec: json }
    request:
      headers: { Authorization: "Bearer ${DOWNSTREAM_TOKEN}" }
```

**Object storage (archive) / Kafka** — Vector also has `aws_s3`, `gcp_cloud_storage`, `kafka` sinks; same `inputs:` pattern.

You can wire multiple sinks at once (e.g. Elasticsearch **and** your app) by listing the
same `inputs:`.

---

## Step 4 — (Optional) Metrics endpoint

The pollers above ship **logs**. For numeric **metrics** scraping (request rate, tokens/min,
spend/min, error rate) the cleanest path is a Prometheus-style `/metrics` endpoint on the
gateway. That endpoint does **not exist yet** — once it's added, scrape it with:

```yaml
sources:
  parkar_metrics:
    type: prometheus_scrape
    endpoints: ["http://ai_gateway:8100/metrics"]
    scrape_interval_secs: 30
sinks:
  prometheus_out:
    type: prometheus_exporter      # expose to Grafana/Prometheus
    inputs: ["parkar_metrics"]
    address: "0.0.0.0:9598"
```

> Ask the Parkar team to enable the `/metrics` exporter if you need true metrics rather
> than computing aggregates downstream from the logs.

---

## Step 5 — Production hardening

1. **Auth** — the examples use the gateway **internal key** (fine on a trusted Docker
   network). For Vector running *outside* the cluster, do **not** expose the internal key.
   Instead use a **read-only service API key** against the Express `/api/ai-gateway/*`
   routes (recommended; ask the Parkar team to enable it), or poll through an internal-only
   network.
2. **Secrets** — keep `AI_GATEWAY_INTERNAL_KEY`, HEC/API tokens in env vars (Vector reads
   `${VAR}`), never inline in `vector.yaml`. Don't commit real keys.
3. **No duplicates** — the pollers re-fetch the latest N rows each interval. De-dupe at the
   sink (use the row `id` as the document key) or add a Vector `dedupe` transform keyed on
   `id`, or have the API support an `after_id`/`since` cursor.
4. **TLS** — terminate TLS for any sink leaving the host (`tls:` block per sink).
5. **Buffering/retries** — add `buffer: { type: disk, max_size: 268435456 }` to sinks so
   data survives restarts and downstream outages.

---

## Array unrolling note

`http_client` emits the **whole JSON body** as one event. The `remap` transforms above pull
`.data` into a list. Depending on your Vector version, fanning a list into **one event per
row** may need the `lua` transform or an `unnest`/`reduce` step. The simplest alternative is
to have the API return **NDJSON** (one row per line) — then set `decoding: { codec: bytes }`
+ `framing: { method: newline_delimited }` and each row arrives as its own event with no
unrolling needed. Confirm with `vector validate vector.yaml`.

---

## Quick reference

| Want | Source | Notes |
|------|--------|-------|
| Spend / tokens / cost | `http_client` → `/internal/spend/logs` | per-request rows |
| Tool / MCP calls | `http_client` → `/internal/mcp/audit/logs` | per-call audit |
| Guardrail blocks | `http_client` → `/internal/guardrails/logs` | safety events |
| Raw service logs | `docker_logs` | needs docker socket |
| Numeric metrics | `prometheus_scrape` → `/metrics` | needs exporter (future) |

| Ship to | Sink type |
|---------|-----------|
| Elasticsearch/OpenSearch | `elasticsearch` |
| Splunk | `splunk_hec_logs` |
| Datadog | `datadog_logs` |
| Grafana Loki | `loki` |
| Your app | `http` |
| S3 / GCS / Kafka | `aws_s3` / `gcp_cloud_storage` / `kafka` |

---

**Validate before running:** `vector validate /etc/vector/vector.yaml`
**Docs:** https://vector.dev/docs/
