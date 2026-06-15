# Parkar GovernAI — Architecture

This document describes how the platform is structured: the services, how a request
flows through them, the data model boundaries, and the Parkar-specific additions layered
on top of the open-source base.

> **One-line summary:** Parkar GovernAI is a control plane for enterprise AI — a React UI
> and Node API backed by PostgreSQL, fronted by a Python **AI Gateway** that every LLM and
> agent-tool call routes through for policy enforcement, guardrails, spend tracking, and
> audit; plus a Python **Eval** service for quality/bias testing.

---

## 1. System overview

```
                           ┌──────────────────────────────────────────────┐
   Browser ───────────────▶│  Clients/  (React + Vite + MUI, served by nginx)│
                           └───────────────┬──────────────────────────────┘
                                           │  /api/*  (JWT)
                                           ▼
                           ┌──────────────────────────────────────────────┐
                           │  Servers/  (Node + Express + Sequelize)        │
                           │  routes → controllers → services → repos       │
                           └──┬───────────┬───────────────┬───────────┬────┘
                              │           │               │           │
                  PostgreSQL ◀┘   Redis / BullMQ ◀┘  AIGateway ◀┘  EvalServer ◀┘
                  (verifywise        (worker jobs)   (LLM + MCP      (LLM evals,
                   schema)                            gateway)        bias audits)

   Agents / apps ───────────────────────────────────────────▶ AIGateway  /v1/chat/completions  (sk-vw-…)
   (incl. my_agent)                                            AIGateway  /v1/mcp                (sk-mcp-…)
```

**Runtime services (Docker Compose):** `frontend`, `backend`, `worker`, `ai_gateway`,
`eval_server`, `postgresdb`, `redis`.

| Service | Tech | Port | Responsibility |
|---|---|---|---|
| frontend | React 19 / Vite / MUI 7 | 5173 | All UI; nginx also proxies `/api` → backend |
| backend | Node 22 / Express 4 / Sequelize 6 | 3000 | Auth, business logic, DB owner, proxies to gateway/eval |
| worker | Node (BullMQ) | — | Background jobs (scheduled scans, etc.) |
| ai_gateway | Python 3.12 / FastAPI / LiteLLM | 8100 | LLM + MCP proxy, guardrails, spend, audit |
| eval_server | Python 3.12 / FastAPI / DeepEval | 8000 | LLM evaluations, bias audits |
| postgresdb | PostgreSQL 16 | 5432 | System of record (shared `verifywise` schema) |
| redis | Redis 7 | 6379 | Cache, rate limits, BullMQ, MCP sessions |

---

## 2. Repository layout

```
Clients/        React frontend (clean architecture)
Servers/        Node/Express backend
AIGateway/      Python LLM + MCP gateway          ← Parkar's primary governance runtime
EvalServer/     Python LLM evaluation service (+ SDK)
my_agent/       Reference AIONIQ agent + chat UI   ← Parkar addition
EvaluationModule/, GRSModule/   standalone eval/bias research modules
shared/, docs/, CodeRules/, agents/   docs, standards, content
kubernetes/, ansible/, scripts/, install.sh       deploy/ops
docker-compose*.yml, .env.dev, nginx.frontend.dev.conf   local/dev infra
```

### 2.1 `Clients/` — frontend (clean architecture)
- `src/presentation/` — UI: `pages/` (AIGateway, Authentication, Landing, Home/StartHere,
  GovernanceOS, SettingsPage…), `components/`, `themes/` (navy design tokens), `assets/`.
- `src/application/` — `redux/` state, `repository/` + `hooks/` data access,
  `config/routes.tsx`, `validations/`.
- `src/infrastructure/api/` — axios client (`networkServices`).
- `src/domain/` — TS interfaces/types. `src/i18n/` — translations.
- Built to `Clients/dist`; the frontend container (nginx) serves that bundle and proxies
  `/api` to the backend.

### 2.2 `Servers/` — backend (layered)
- `routes/` (≈100) → `controllers/` → `services/` → `repositories/`+`utils/` → DB.
- `domain.layer/` (models, enums, interfaces); `database/migrations/` (the `verifywise`
  schema); `middleware/` (JWT auth + tenant isolation); `jobs/` (BullMQ → `worker`);
  `advisor/` (AI Advisor); `lib/ai-detection/` (repo scanning); `services/email/`
  (multi-provider email).
- Notable routers: `aiGateway.route.ts` (thin proxy to AIGateway), `ssoConfig.route.ts`
  (Entra ID), `user.route.ts` (login + Microsoft SSO), `eu.route.ts` (EU AI Act controls),
  `vwmailer.route.ts` (invites), `evidenceHub`/`fileManager` (evidence).

### 2.3 `AIGateway/` — LLM + MCP gateway (`src/`)
- `routers/` — public `proxy.py` (`/v1/chat/completions`, `/v1/embeddings`),
  `mcp_proxy.py` (`/v1/mcp`); internal CRUD/analytics: `api_keys`, `endpoints`,
  `virtual_keys`, `guardrails*`, `spend` (+insights), `budget`, `cache`, `risk`,
  `prompts`, and `mcp_servers/agent_keys/tools/audit/approvals/guardrails`.
- `services/` — `proxy_service.py` (auth, ACLs, budget, rate-limit, spend + body logging),
  `guardrail_service.py` (content/PII scan), `presidio_engine.py`, `llm_service.py`
  (LiteLLM), `mcp_proxy_service.py`, `mcp_session.py`.
- `crud/`, `database/migrations/` (Alembic), `middlewares/` (internal-key + tenant),
  `utils/` (redis, encryption).

### 2.4 `EvalServer/` — evaluations
- `src/` — `routers/`, `controllers/`, `crud/`, `engines/` (eval runners), `models/`,
  `presets/` (bias configs), `data/`. Mounted at `/deepeval/*`.
- `sdk/` — the `pip install verifywise` Python SDK; `action/` — CI integration.

### 2.5 `my_agent/` — reference agent (Parkar)
- `agent.py` (ADK agent → gateway), `web.py` (FastAPI chat wrapper + Google Sign-In,
  per-user identity), `static/index.html` (chat UI), `mcp_tools_server.py` (FastMCP
  `web_search`/`calculator`).

---

## 3. Request flows

### 3.1 UI → backend
Browser calls `/api/*`; nginx in the frontend container proxies to `backend:3000`.
`auth.middleware` validates the JWT, attaches `userId`/`organizationId`/`role`, and runs
the controller. Multi-tenancy is enforced by `organization_id` scoping (shared schema).

### 3.2 LLM call (the governed path)
```
agent/app ──Bearer sk-vw-…──▶ AIGateway /v1/chat/completions
  1. authenticate virtual key            5. run input guardrails (PII/content/injection)
  2. resolve endpoint (provider+model+key)6. call provider via LiteLLM
  3. enforce model/provider ACLs          7. log spend (tokens, cost, latency, status,
  4. check budget (402) + rate limit (429)   prompt/response, metadata incl. requester)
```
The `model` field in the request is the **endpoint slug**; the real model name and provider
key stay server-side. Identity/cost tags ride on the `x-vw-metadata` header.

### 3.3 Tool call (MCP)
```
agent ──Bearer sk-mcp-…──▶ AIGateway /v1/mcp (Streamable HTTP JSON-RPC)
  initialize → tools/list (ACL-filtered) → tools/call → proxy to registered MCP server
  → audit row (tool, agent, args, result, latency); optional HITL approval / guardrails
```

### 3.4 Governance / compliance
Backend owns projects (use cases), frameworks (EU AI Act, ISO 42001/27001, NIST AI RMF),
controls, risks, evidence. Creating a project + framework auto-generates that framework's
controls; gateway artifacts (logs, guardrail events) are attached as **evidence**.

---

## 4. Data & security model

- **Database:** single PostgreSQL with a shared `verifywise` schema; tenant isolation via
  `organization_id`. Gateway tables are prefixed `ai_gateway_*` (endpoints, api_keys,
  virtual_keys, spend_logs, guardrails(+logs), mcp_servers/agent_keys/tools/audit_logs,
  cache, budgets).
- **Auth:**
  - Users: JWT (email/password) or **Microsoft Entra ID SSO** (`/api/users/login-microsoft`,
    per-org config in `sso_configurations`, JIT provisioning honoring invites).
  - Apps/agents: **virtual keys** (`sk-vw-…`) for LLM, **agent keys** (`sk-mcp-…`) for tools —
    stored as SHA-256 hashes.
  - Backend ↔ gateway: shared internal key + tenant headers.
- **Secrets at rest:** provider API keys and SSO client secrets encrypted (AES-256) using
  `ENCRYPTION_KEY` / `SSO_SECRET`.
- **Enforcement boundary:** guardrails, budgets, and rate limits run **in the gateway** —
  outside agent code — so every agent that routes through it inherits the policy and cannot
  bypass it. Direct-to-provider traffic is *not* governed (egress should be restricted to
  the gateway in production).

---

## 5. Parkar GovernAI additions (on top of the OSS base)

| Area | Addition |
|---|---|
| AI Gateway | `/spend/insights` (cost-per-client, budget utilization, 429/402 counts, PII-by-type, per-agent tool latency, anomaly); P95 latency + error-rate cards; **prompt/response + requester capture** in logs; 429/402 rejection logging; SQL `CAST(...)` and Redis-session fixes |
| Guardrails | PII (Presidio), content-filter, prompt-injection rules — verified blocking/masking |
| Identity | **Entra ID SSO** enabled; invite-aware Microsoft JIT provisioning; SMTP email |
| Agent | `my_agent` chat UI with Google Sign-In + per-user governance attribution |
| Governance | Seeded "AIONIQ Assistant" use case (EU AI Act controls + gateway-log evidence); coverage rollup on the Governance OS chart |
| Branding/UX | Navy theme, Parkar logo + favicon, marketing **Landing page** (`/landing`), module trimming (Governance + AI Gateway only), in-app user-guide + AI Gateway setup guide |

---

## 6. Local development & deployment

**Run the stack (build backend from source — important):**
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml --env-file .env.dev up -d --build
```
- `name: verifywise` is pinned in `docker-compose.yml` so the project (and the `verifywise_db`
  data volume) stays attached regardless of the folder name.
- `ai_gateway` and `eval_server` run from **mounted source** (`--reload`); the **frontend**
  serves `Clients/dist` (rebuild with `cd Clients && npm run build-dev`); the **backend** must
  be rebuilt with `--build` or Compose re-pulls the prebuilt image and drops local code.

**Run the reference agent:**
```bash
python my_agent/mcp_tools_server.py            # tools (web_search, calculator)
python -m uvicorn my_agent.web:app --port 8200 # chat UI (Google Sign-In)
```

**Config:** `.env.dev` (git-tracked but `skip-worktree` locally so real secrets aren't
committed). Key vars: DB/Redis, `ENCRYPTION_KEY`, `SSO_ENABLED`/`SSO_SECRET`, SMTP,
`AI_GATEWAY_INTERNAL_KEY`.

> Operational gotcha: the gateway's `--reload` can wedge on long-lived MCP/SSE connections —
> `docker restart verifywise-ai_gateway-1` after backend edits.

---

## 7. Known limitations / roadmap

See `AI_Gateway_Epics.md` for the full backlog. Headline pending items:
- Provider expansion: **Azure OpenAI / Vertex AI / Bedrock** (multi-field credentials).
- **Output-side guardrails** (scan responses, not just requests).
- **MCP tool approvals (HITL)** and per-tool guardrails.
- **External export** (Vector AI / SIEM) via a read-only service key + `/metrics` + webhooks.
- Log **retention/purge** and per-org body-logging toggles.
- Managed-platform agents (Foundry/Vertex/Bedrock Agents) need **telemetry ingestion**
  (they can't be proxied — no redirectable endpoint).

---
*For module-specific details see the per-directory `CLAUDE.md` files (Servers, AIGateway,
EvalServer) and `docs/technical/`.*
