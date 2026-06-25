# Response Analysis Pipeline — Agent Quality Metrics

> **Status:** Implemented (Phases 1–4), OFF by default. EvalServer scorer wiring is
> the remaining operator config; the gateway LLM-judge is the working default scorer.
> **Last Updated:** 2026-06-25
> **Audience:** Engineers building out-of-band quality analysis for agent responses
> (Accuracy, Hallucination, Faithfulness, Bias) surfaced per-agent in FlowTrace.

## Implementation status

| Piece | State | Where |
|---|---|---|
| Config flags (`response_analysis_*`, off by default) | ✅ | `AIGateway/src/config.py` |
| Tables `ai_gateway_response_captures` + `ai_gateway_response_scores` | ✅ | migration `a0007_create_response_analysis.py` |
| Sampled, fire-and-forget capture (non-stream + stream) | ✅ | `routers/proxy.py` → `capture_response()` |
| Capture + scoring + in-process worker | ✅ | `services/response_analysis_service.py` |
| LLM-judge scorer (default) | ✅ | `_score_via_judge` (self-call via judge VK) |
| EvalServer scorer (preferred) | ⚙️ stub — operator wires scorers | `_score_via_evalserver` |
| Quality endpoints (`/flowtrace/agents/{k}/quality`, `/flowtrace/quality`) | ✅ | `routers/traces.py`, `crud/traces.py` |
| FlowTrace UI quality cards (Accuracy/Faithful/Hallucination/Bias) | ✅ | `Clients/.../AgentMonitoring/index.tsx` |

**To turn it on:** set `RESPONSE_ANALYSIS_ENABLED=true`, run the `a0007` migration, and
set `RESPONSE_ANALYSIS_JUDGE_ENDPOINT` + `RESPONSE_ANALYSIS_JUDGE_VK` (a cheap endpoint
slug + a virtual key the gateway uses to call itself). Optionally set
`RESPONSE_ANALYSIS_EVALSERVER_URL` + configure EvalServer scorers to use EvalServer
instead of the judge. The worker starts automatically (in-process background task);
it can be split into its own process later. Capture is sampled
(`RESPONSE_ANALYSIS_SAMPLE_RATE`, default 0.25) and stores only post-guardrail
(PII-masked) prompt text.

---

## 1. Goal

Measure the **quality** of agent/LLM responses flowing through Parkar GovernAI and surface
per-agent metrics — **Accuracy, Hallucination, Faithfulness, Bias/Fairness**, plus operational
quality (refusals, format violations) — so teams can see how good their agents are and whether
they're drifting.

### What this is NOT
This is **not an output guardrail**. Quality metrics like hallucination and accuracy need ground
truth, retrieval comparison, or an LLM judge — slow and probabilistic — so they **cannot reliably
block in the hot path**. This pipeline runs **out-of-band (async)**, so it never adds latency to a
live request.

> **Design principle (same as FlowTrace emit and the Fiddler discussion):** enforcement is inline
> and fast; *analysis is asynchronous and off the hot path.* Inline guardrails (incl. any future
> output guardrails for PII/secrets/unsafe content) handle "must stop now"; this pipeline handles
> "measure and improve."

---

## 2. High-level architecture

```
Live request (hot path, unchanged):
  Agent → Gateway → guardrails(input) → LLM → response → caller
                         │
                         │ (opt-in) enqueue {trace_id, agent_key, requester, prompt, response, ctx}
                         ▼
                 Redis queue / BullMQ-style stream         ← decouples hot path from analysis
                         │
        ┌────────────────┴───────────────────┐
        ▼  async worker (off hot path)        │
  Response Analysis Worker
    1. dedupe / sample (not every request needs scoring)
    2. score via EvalServer / LLM-judge:
         correctness · faithfulness · hallucination · bias · refusal/format
    3. persist scores → ai_gateway_response_scores
    4. publish → FlowTrace (per-agent metric rollups)
        │
        ▼
  Surfaced in: FlowTrace Agent Monitor (per-agent quality cards)
               + /flowtrace endpoints + spend/insights-style API
```

The hot path only does one extra thing: **fire-and-forget enqueue** of the (consented) prompt +
response. All scoring happens in a separate worker — exactly the decoupling FlowTrace already uses
with `asyncio.create_task` + Redis pub/sub.

---

## 3. Response capture (the privacy-critical part)

FlowTrace's redaction guard (`_safe_attrs` in `trace_service.py`) **deliberately drops** content,
messages, prompts, and responses before persisting spans. Quality scoring needs the actual text, so
capture must be a **separate, opt-in, access-controlled path** — never a weakening of the default
redaction.

Rules:
1. **Opt-in per org / per agent.** A `response_analysis_enabled` flag (org- and/or agent-scoped).
   Off by default. No capture unless explicitly enabled.
2. **Captured payload is stored separately** from FlowTrace spans, encrypted at rest, with stricter
   access control (Admin/Auditor only) and a **short, configurable retention** (e.g. 7–30 days)
   distinct from span retention.
3. **PII handling.** Reuse the existing guardrail/Presidio masking to redact PII *before* the
   captured text is stored for analysis, unless an org explicitly consents to raw capture for
   eval purposes.
4. **The capture is keyed by `trace_id`** so a score links back to the exact FlowTrace request.

---

## 4. Scoring

Reuse what already exists rather than building a new scorer.

| Metric | How |
|---|---|
| **Correctness / Accuracy** | EvalServer scoring against a reference/expected answer (when a dataset/ground truth exists) or an LLM-judge rubric. |
| **Faithfulness** | Compare response against the retrieved context (RAG) — does the answer stay grounded in sources? |
| **Hallucination** | LLM-judge / NLI check: claims in the response not supported by context/known facts. |
| **Bias / Fairness** | EvalServer's existing bias & fairness scans. |
| **Refusal / format / quality** | Lightweight heuristics + classifier (did it refuse? valid JSON? empty?). |

Two scoring backends, used together:
- **EvalServer** (`EvalServer/`) — already scores correctness, faithfulness, hallucination, bias.
  The worker calls it for the heavy/standardized metrics.
- **LLM-as-judge** — for rubric-based scoring with no ground truth. Reuse the
  **`trace_insight_service.py`** pattern: call the gateway with a rubric, cache the result per
  `trace_id`. (Feature-flagged, same as trace insight.)

**Sampling, not 100%.** Scoring every request is expensive. Default to a configurable sample rate
(e.g. 10%) plus always-score for flagged/high-risk traces. **Log the sample rate** so dashboards
never imply full coverage when they're sampled (the "no silent caps" rule).

---

## 5. Storage

New table `ai_gateway_response_scores` (org-scoped, like all gateway tables):

| Column | Notes |
|---|---|
| `id` | PK |
| `org_id` | tenant isolation |
| `trace_id` | FK-ish link to the FlowTrace request |
| `agent_key` | the agent (`x-vw-metadata.agent`) |
| `requester` | per-user attribution |
| `model` | model used |
| `metric` | correctness \| faithfulness \| hallucination \| bias \| refusal \| … |
| `score` | numeric (0–1) |
| `verdict` | pass \| warn \| fail vs configured threshold |
| `detail` | JSON: judge rationale, matched spans (redaction-guarded) |
| `scored_by` | evalserver \| llm-judge \| heuristic |
| `created_at` | for retention + trend windows |

Captured prompt/response text lives in a **separate, stricter** store (see §3), not in this table.

---

## 6. Surfacing the metrics

Mirror the existing FlowTrace + spend patterns:

- **FlowTrace Agent Monitor** — add per-agent **quality cards** (Accuracy, Hallucination %,
  Faithfulness, Bias) next to the existing trace/user counts. Trend sparklines over the window.
- **New endpoints** (under the gateway `/internal`, proxied via `/api/ai-gateway/...`):
  - `GET /flowtrace/agents/{agent_key}/quality?period=7d` — metric rollups for one agent
  - `GET /flowtrace/quality?period=7d` — org-wide quality summary
  - `GET /flowtrace/traces/{trace_id}/scores` — scores for a single request
- **Compliance tie-in** — quality scores can be filed as **evidence** (LLM Evals pillar), e.g. for
  EU AI Act accuracy/robustness obligations.

---

## 7. Privacy, security, governance

- [ ] Capture is **opt-in**, off by default, org/agent-scoped.
- [ ] Captured text stored separately, encrypted at rest, Admin/Auditor-only, short retention.
- [ ] PII masked before storage unless explicitly consented for eval.
- [ ] FlowTrace's default `_safe_attrs` redaction is **unchanged** — this pipeline never relaxes it.
- [ ] Scores are org-scoped; access follows existing RBAC.
- [ ] Sample rate and any coverage caps are logged/surfaced, never hidden.

---

## 8. Phased rollout

1. **Phase 1 — capture + storage (flagged).** Opt-in response capture → separate encrypted store +
   `ai_gateway_response_scores` table. No scoring yet; verify the hot path is untouched (latency).
2. **Phase 2 — async worker + EvalServer scoring.** Sampled scoring for correctness/faithfulness/
   bias; persist scores; one endpoint.
3. **Phase 3 — LLM-judge for hallucination/no-ground-truth.** Reuse the trace-insight pattern;
   cache per trace.
4. **Phase 4 — FlowTrace quality cards + trends.** Per-agent dashboards; compliance evidence export.
5. **Phase 5 — alerting on drift.** Threshold breaches (e.g. hallucination rising) raise alerts via
   the existing notification path.

---

## 9. Implementation pointers (when built)

| Concern | Location |
|---|---|
| Hot-path enqueue (fire-and-forget) | `AIGateway/src/routers/proxy.py` (after the LLM response, ~line 318+) |
| Async emit pattern to copy | `AIGateway/src/services/trace_service.py` (`asyncio.create_task`, Redis pub/sub) |
| LLM-judge pattern to reuse | `AIGateway/src/services/trace_insight_service.py` (gateway call + per-trace cache) |
| Heavy scoring backend | `EvalServer/` (correctness, faithfulness, hallucination, bias) |
| Redaction guard to respect (do not weaken) | `AIGateway/src/services/trace_service.py` → `_safe_attrs` |
| New migration | `AIGateway/src/database/migrations/versions/` (`ai_gateway_response_scores`) |
| New endpoints | `AIGateway/src/routers/traces.py` (+ `crud/traces.py`) |
| Frontend quality cards | `Clients/src/presentation/pages/AIGateway/AgentMonitoring/` |
| Backend proxy (already generic) | `Servers/routes/aiGateway.route.ts` |

---

## 10. Open decisions

- **Sample rate** default and per-agent overrides.
- **Ground truth** — which agents have reference datasets (enables true Accuracy) vs judge-only.
- **Retention** for captured text vs scores (likely different windows).
- **Streaming responses** — capture the assembled final text post-stream for analysis (no hot-path
  impact since analysis is async).
- **Cost controls** — budget cap for LLM-judge scoring (it runs through the gateway and counts as
  spend).
