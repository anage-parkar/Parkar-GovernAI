# Wiring an external app (Vector) into Parkar GovernAI

> **Status:** Design / future work — NOT yet implemented.
> **Last Updated:** 2026-06-22
> **Audience:** Anyone wiring a separate application (referred to here as **Vector**) so that a
> signed-in GovernAI user sees *their own* GovernAI insights, metrics, logs, and FlowTrace data
> inside that external app.

---

## 1. The goal

A GovernAI **user/admin** (e.g. `x@parkar.in`) signs into the **Vector** application using their
**Microsoft (Azure AD) account**, and inside Vector sees the **same insights / metrics / logs /
agent traces they would see on the GovernAI dashboard** — i.e. their **organization's** data,
respecting their **role**.

> This is *not* about the per-end-user email tagged on agent requests (the `x-vw-metadata.user`
> tag). It is about a GovernAI **console user** viewing GovernAI data from a second front-end.

### Key realization

The per-user / per-role visibility the requirement asks for **already exists** and needs **no new
data-layer code**. Every AI Gateway endpoint is scoped by `x-organization-id` (and forwards
`x-role`), and the Express backend derives those from the caller's **GovernAI JWT**. So whoever
holds a valid GovernAI JWT for org *N* automatically sees exactly org *N*'s data, with their
role's permissions — which is precisely "what they see on the GovernAI dashboard."

**Therefore the only thing to build is the auth bridge: getting a GovernAI JWT into Vector for the
Microsoft-authenticated user.**

---

## 2. Data API — what Vector calls once it has a JWT

All endpoints are exposed by the Express backend under **`/api/ai-gateway/*`**, which authenticates
the JWT and proxies to the AI Gateway's `/internal/*` routes (injecting `x-internal-key`,
`x-organization-id`, `x-user-id`, `x-role`).

**Base URL:** `http://<governai-backend>:3000/api/ai-gateway`
**Auth:** `Authorization: Bearer <GovernAI JWT>`

### Insights & spend metrics

| Endpoint | Returns |
|---|---|
| `GET /spend?period=7d` | Dashboard: totals, by-day, by-model, by-provider, error-rate-by-day, tokens/endpoint |
| `GET /spend/insights?period=30d` | High-value operational insights |
| `GET /spend/by-endpoint?period=7d` | Cost / requests / tokens per endpoint |
| `GET /spend/by-user?period=7d` | Cost / requests / tokens per user |
| `GET /spend/by-tag?tag=project&period=7d` | Grouped by any `x-vw-metadata` tag |

`period` ∈ `1d | 7d | 30d | 90d`.

### Logs

| Endpoint | Returns |
|---|---|
| `GET /spend/logs?limit=50&offset=0&status=success&search=<q>` | Paginated request/spend log detail |
| `GET /guardrails/logs` · `GET /guardrails/stats` | Guardrail block/mask events + metrics |
| `GET /mcp/audit/logs` · `/mcp/audit/stats` · `/stats/by-tool` · `/stats/by-agent` | MCP tool-call audit + metrics |

### FlowTrace (live agent graph + tracing)

| Endpoint | Returns |
|---|---|
| `GET /flowtrace/agents` | Agents seen in recent traces (+ trace & distinct-user counts) |
| `GET /flowtrace/agents/{agent_key}/graph` | Static topology for one agent |
| `GET /flowtrace/traces?agent=<key>&limit=20` | Recent traces (with requester) |
| `GET /flowtrace/traces/{trace_id}` | Full reconstructed span tree |
| `GET /flowtrace/traces/{trace_id}/insight` | Cached AI summary of a trace |
| `GET /flowtrace/traces/stream?agent=<key>` | **SSE** live stream of spans / `trace.completed` |

> Reference SSE client: `Clients/src/presentation/pages/AIGateway/AgentMonitoring/useTraceStream.ts`.

### Direct-to-gateway alternative (server-to-server)

Skip the Express proxy and call the gateway at `http://<gateway>:8100/internal/*` directly. You then
must send the headers the backend would otherwise inject:

```
x-internal-key: <AI_GATEWAY_INTERNAL_KEY>
x-organization-id: <org id>
x-role: <Admin|Reviewer|Editor|Auditor>   # for role-gated routes
```

This is a **fixed service identity**, not per-user — use it only for backend jobs, not for the
user-facing Vector views.

---

## 3. The auth bridge — Option B (Vector has its own application)

Vector authenticates its own users (it is a separate app with its own login), so it needs to obtain
a **GovernAI JWT** for the Microsoft-authenticated user. The good news: **~90% already exists.**

### What already exists in GovernAI

- **Azure AD SSO is built in.** Per-org config (client ID / secret / tenant) is stored encrypted in
  `sso_configurations` and gated by the env flag `SSO_ENABLED=true`.
  - Config helpers: `Servers/utils/ssoConfig.utils.ts` (`getAzureADConfigForLoginQuery`, …)
  - Config admin routes: `Servers/routes/ssoConfig.route.ts`
- **A working Microsoft login → GovernAI JWT exchange already exists:**
  **`POST /api/users/login-microsoft`** → `loginUserWithMicrosoft` in
  `Servers/controllers/user.ctrl.ts` (~line 540+).

  It currently:
  1. Accepts a Microsoft OAuth2 **authorization `code`** + `organizationId` + `redirectUri`
  2. Redeems it via MSAL (`@azure/msal-node` `ConfidentialClientApplication.acquireTokenByCode`)
     using that org's Azure AD config
  3. Fetches the profile from Microsoft Graph (`/v1.0/me`) → extracts the **email**
  4. Looks up the GovernAI user by email, with **JIT provisioning** and **role mapping** (explicit
     Azure `roles` claim > invited role > `Editor` default), and enforces org membership (403 on
     mismatch)
  5. Mints the GovernAI **access JWT (1h)** + **refresh JWT (30d)** via
     `Servers/utils/jwt.utils.ts` (`generateToken`, `generateRefreshToken`)

  That issued JWT is exactly the org+role-scoped token the gateway data endpoints already trust.

### GovernAI JWT payload (what the gateway scopes on)

```ts
interface TokenPayload {
  id: number;            // user id
  email: string;
  organizationId: number;
  tenantId: string;
  roleName: string;      // Admin | Reviewer | Editor | Auditor
  expire: number;        // Date.now() + ttl
}
```

### Two flavors of Option B

The right one depends on **what Vector can hand to GovernAI**.

#### Flavor 1 — Vector performs the auth-code flow (≈ zero backend work)

Vector runs the standard Microsoft OAuth2 redirect, gets the authorization `code`, and POSTs
`{ code, organizationId, redirectUri }` to the **existing** `POST /api/users/login-microsoft`. It
receives the GovernAI access + refresh tokens and uses them against `/api/ai-gateway/*`.

Requirements:
- Vector's redirect URI is registered on the org's Azure AD app registration.
- Vector knows / selects the target `organizationId` (e.g. a tenant→org map or a picker).
- **No GovernAI code change.**

#### Flavor 2 — Vector already holds its own Microsoft token (needs a new endpoint)

If Vector has already signed the user in and is holding a Microsoft **id_token / access_token**
(not a fresh auth `code`), the existing endpoint doesn't fit (it expects a `code` to redeem). Add a
sibling endpoint, e.g. **`POST /api/users/sso/exchange`**, that:

1. **Verifies the incoming MS token against Microsoft's JWKS** — signature, `iss`, `aud` (= the
   app's client ID), `tid` (= expected tenant), and expiry. *Strict validation is mandatory — an
   unvalidated MS token would let anyone mint a GovernAI session.*
2. Extracts the email.
3. **Reuses the same user-lookup + role-mapping + JIT-provisioning logic** as
   `loginUserWithMicrosoft` — refactor that second half into a shared helper so both paths stay
   byte-for-byte identical.
4. Mints the GovernAI JWT (`generateToken` / `generateRefreshToken`).

This is the cleaner fit for "Vector has its own application," but it is the flavor that requires new
code.

### Decision that picks the flavor

> **Does Vector obtain a fresh Microsoft authorization `code` (and can register its redirect URI on
> the org's Azure app)?**
> - **Yes** → **Flavor 1**: reuse `/api/users/login-microsoft`; work is integration on Vector's side.
> - **No — Vector already holds its own MS id_token/access_token** → **Flavor 2**: build
>   `/api/users/sso/exchange` (verify MS token + shared mint helper).

---

## 4. End-to-end flow (Flavor 2, the expected path)

```
x@parkar.in  ──MS login──►  Vector app  (holds MS id_token)
      │
      │  POST /api/users/sso/exchange   { ms_token }
      ▼
GovernAI backend
   1. verify ms_token against Microsoft JWKS (iss/aud/tid/exp)
   2. email = claims.email  →  look up GovernAI user (+ org, role)
   3. mint GovernAI JWT { id, email, organizationId, roleName, ... }
      │
      ▼  returns access + refresh JWT
Vector app  (now holds GovernAI JWT)
      │
      │  GET /api/ai-gateway/spend/insights        Authorization: Bearer <JWT>
      │  GET /api/ai-gateway/flowtrace/traces       Authorization: Bearer <JWT>
      │  GET /api/ai-gateway/flowtrace/traces/stream (SSE)
      ▼
GovernAI backend  ──scopes by org+role from JWT──►  AI Gateway  ──►  data
```

The data returned is automatically identical to what `x@parkar.in` sees on the GovernAI dashboard,
because it is scoped by the same org + role carried in the same kind of JWT.

---

## 5. Security checklist (applies to either flavor)

- [ ] `SSO_ENABLED=true` and the org's Azure AD config present in `sso_configurations` (encrypted).
- [ ] The MS account email must resolve to a GovernAI user **in the target org** — mismatches → 403.
      This is what keeps results user/role-correct.
- [ ] **Flavor 2 only:** validate the MS token strictly (signature via JWKS, `iss`, `aud`, `tid`,
      expiry). Never trust an unverified MS token.
- [ ] GovernAI access token is short-lived (1h) with a 30-day refresh — Vector must handle refresh.
- [ ] Never expose `AI_GATEWAY_INTERNAL_KEY` to the browser; the direct-to-gateway path is
      server-to-server only.
- [ ] Role-gated endpoints (e.g. `*/cleanup`, `*/logs/purge`) require `Admin`; the JWT's role is
      enforced server-side.

---

## 6. Implementation pointers (for when this is built)

| Concern | Location |
|---|---|
| Existing MS login → JWT exchange | `Servers/controllers/user.ctrl.ts` → `loginUserWithMicrosoft` |
| MS login route | `Servers/routes/user.route.ts` → `POST /login-microsoft` |
| Azure AD config helpers | `Servers/utils/ssoConfig.utils.ts` |
| JWT mint/verify | `Servers/utils/jwt.utils.ts` (`generateToken`, `generateRefreshToken`) |
| Gateway proxy + header injection | `Servers/routes/aiGateway.route.ts` (`injectGatewayHeaders`) |
| Gateway data endpoints | `AIGateway/src/routers/spend.py`, `…/traces.py`, `…/guardrails_crud.py`, `…/mcp_audit.py` |
| FlowTrace SSE client reference | `Clients/src/presentation/pages/AIGateway/AgentMonitoring/useTraceStream.ts` |

**Suggested build steps for Flavor 2:**
1. Refactor the user-lookup + role-mapping + JIT block of `loginUserWithMicrosoft` into a shared
   helper (e.g. `resolveOrProvisionSsoUser(email, orgId, roleClaim, profile)`).
2. Add `POST /api/users/sso/exchange` that validates the MS token (JWKS), then calls that helper and
   mints the JWT.
3. Document the new endpoint in the API reference and add it to the swagger spec.
