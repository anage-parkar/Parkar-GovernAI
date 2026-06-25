# Parkar GovernAI — Go-Live Checklist (Client Agent Onboarding)

> **Purpose:** Track readiness to host Parkar GovernAI and onboard **client agents** (external
> agents connecting through the AI Gateway for governed LLM + MCP/tool traffic).
> **Last Updated:** 2026-06-23
> **Status legend:** ⬜ Not started · 🟡 In progress · ✅ Done · ➖ N/A

---

## Readiness tiers

| Scenario | Gate |
|---|---|
| Internal pilot / demo agent (e.g. `my_agent`) | Already works today — no blockers |
| Trusted design-partner agent (controlled env) | Section 1 (Security) complete |
| **External client agents in production** | Sections 1–3 complete |

---

## What already works (no action needed)

The agent onboarding path is built and proven end-to-end with `my_agent`:

- Issue a **virtual key** (org-scoped, budgeted) + optional **MCP agent key**.
- Agent points LLM calls at `/v1/chat/completions` and tool calls at `/v1/mcp`, carrying the
  `x-vw-metadata` tag (`agent`, `app`, `user`). Reference: `my_agent/web.py`.
- Guardrails, spend metering, MCP approval/audit, and FlowTrace tracing apply automatically.

The remaining work below is **hardening and operations**, not new capability.

---

## 1. 🔴 Security — BLOCKING (must complete before any client-facing host)

| # | Item | Detail / acceptance | Owner | Status |
|---|------|---------------------|-------|--------|
| 1.1 | **Rotate Aiven DB password** | The DB password was exposed in chat → treat as compromised. Rotate in Aiven console, update the secret store, redeploy. Verify old credential no longer works. | | ⬜ |
| 1.2 | **Rotate app secrets** | Regenerate `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `AI_GATEWAY_INTERNAL_KEY` for production (do not reuse dev values). | | ⬜ |
| 1.3 | **Enforce real TLS verification to DB** | **Code done** — all four configs (backend `db.ts`, sequelize-cli `config.js`, AI Gateway + EvalServer `config.py`) now support `DB_CA_CERT`: when set, the DB server cert is verified strictly against that CA. `docker-compose.yml` passes `DB_CA_CERT`/`REJECT_UNAUTHORIZED` to all services. **Remaining (deploy):** (a) download Aiven's `ca.pem`, (b) mount it into each container (e.g. `/certs/aiven-ca.pem`), (c) set `DB_CA_CERT=/certs/aiven-ca.pem` + `DB_SSL=true` in prod env, (d) redeploy and confirm connections succeed with verification on. See `CONFIGURATION_REFERENCE.md`. | | 🟡 |
| 1.4 | **Production secrets management** | Replace the `.env.dev` file with a real secret store (vault / cloud secrets manager). No plaintext secrets in env files or images. | | ⬜ |
| 1.5 | **Confirm no secrets in git** | `.env.dev` stays `skip-worktree` and uncommitted; scan history for leaked secrets; ensure `flowtrace-feature.patch` and screenshots aren't committed. | | ⬜ |
| 1.6 | **Security hardening review** | Walk `docs/deployment/SECURITY_HARDENING_GUIDE.md` and confirm each item (CORS, headers, auth, rate limits). | | ⬜ |

---

## 2. 🟠 Deployment topology — move from dev to production

| # | Item | Detail / acceptance | Owner | Status |
|---|------|---------------------|-------|--------|
| 2.1 | **Use production images, not `Dockerfile.dev`** | Current stack uses dev Dockerfiles, build-at-runtime worker, mounted source, and nginx serving a locally-built bundle. Follow `docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md` for prod topology. | | ⬜ |
| 2.2 | **Gateway: multi-worker + SSE-safe** | Gateway runs single-process (we removed `--reload` because it wedged on FlowTrace SSE). For multi-client load, run multiple uvicorn workers with an SSE-aware setup; confirm Redis pub/sub fan-out works across workers. | | ⬜ |
| 2.3 | **Reverse proxy / TLS termination** | Public HTTPS in front of the gateway + backend; confirm SSE (`/flowtrace/traces/stream`) passes through with no buffering/timeout (`X-Accel-Buffering: no`). | | ⬜ |
| 2.4 | **Frontend served from prod build** | Serve the production bundle via the prod image, not a host-mounted `Clients/dist`. | | ⬜ |
| 2.5 | **Resource limits & health checks** | Container CPU/mem limits, restart policies, `/health` liveness/readiness probes for gateway, backend, worker, eval. | | ⬜ |

---

## 3. 🟡 Operational readiness — required for real tenants

| # | Item | Detail / acceptance | Owner | Status |
|---|------|---------------------|-------|--------|
| 3.1 | **Load / concurrency test** | The async multi-user agent + SSE stability fixes are verified functionally, not under load. Run realistic concurrent client traffic (LLM + MCP + open SSE streams) and confirm latency + no gateway wedge. | | ⬜ |
| 3.2 | **Rate limiting / abuse protection** | Add rate limits on the public `/v1` surface (per virtual key / per org); confirm budget caps enforce and notify. | | ⬜ |
| 3.3 | **Client onboarding flow** | Define how a client org + admin user + virtual key + MCP key get provisioned (admin-driven vs self-serve). Document the runbook. | | ⬜ |
| 3.4 | **Backups & retention** | DB backups (Aiven) verified + restore-tested per `DISASTER_RECOVERY_GUIDE.md`. Set FlowTrace span retention + spend-log retention to agreed windows. | | ⬜ |
| 3.5 | **Monitoring & alerting** | Metrics + alerts for gateway errors, latency, DB health, Redis, budget exhaustion, guardrail spikes. | | ⬜ |
| 3.6 | **Logging & audit retention** | Centralized logs; confirm MCP audit + guardrail logs retained per compliance requirement. | | ⬜ |
| 3.7 | **Disaster recovery drill** | Run one full restore drill (DB + services) and record RTO/RPO. | | ⬜ |

---

## 4. ➖ Optional / dependent on scope (not blocking agent onboarding)

| # | Item | Detail | Owner | Status |
|---|------|--------|-------|--------|
| 4.1 | **External dashboard auth (Vector SSO)** | Only needed if clients must *view* governance data from an external app. Design: `docs/technical/integrations/vector-app-integration.md`. Not required for agents to *connect*. | | ⬜ |
| 4.2 | **Self-serve key management UI** | If clients should manage their own keys/budgets without admin. | | ⬜ |
| 4.3 | **Per-client usage billing/export** | If usage-based billing is in scope (spend data already captured per org/user/tag). | | ⬜ |

---

## Go-live sign-off

| Gate | Criteria | Sign-off | Date |
|------|----------|----------|------|
| Pilot | Internal/demo agent governed + traced | | |
| Design partner | Section 1 complete | | |
| **Production** | Sections 1–3 complete; DR drill passed | | |

> Update the **Last Updated** date and statuses as items progress. Related docs:
> `PRODUCTION_DEPLOYMENT_GUIDE.md`, `SECURITY_HARDENING_GUIDE.md`, `DISASTER_RECOVERY_GUIDE.md`,
> `CONFIGURATION_REFERENCE.md`.
