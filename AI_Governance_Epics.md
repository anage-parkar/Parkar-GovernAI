# Parkar GovernAI — AI Governance · Epics & Backlog

> Jira-ready breakdown of the AI Governance workstream. Project key: **PG**.
> Status legend: ✅ Done · 🟡 In Progress · ⬜ To Do
> Estimates in story points (SP). Statuses reflect work completed to date.

---

## Epic summary

| Epic | Key | Theme | Status | Stories |
|------|-----|-------|--------|---------|
| Compliance Framework Manager | **PG-600** | Multi-framework controls, scoring & conformity | ✅ Done (report generation pending) | 6 |
| Risk & Vendor Governance | **PG-700** | Risk register, vendor assessment & scorecards | ✅ Done (heatmap analytics pending) | 6 |
| AI Model Lifecycle Management | **PG-800** | Inventory, model cards, evaluations & retirement | ✅ Done (retirement workflow pending) | 6 |
| Evidence, Policy & Training | **PG-900** | Document hub, policies, training & AI Trust Centre | ✅ Done (share links pending) | 6 |
| Incident, Monitoring & Reporting | **PG-1000** | Incidents, post-market monitoring, FRIA & reports | 🟡 In Progress (FRIA & reporting pending) | 6 |

---

## EPIC PG-600 — Compliance Framework Manager
**Summary:** A unified interface for onboarding regulatory frameworks, answering per-control assessments, tracking compliance scores, and linking evidence to controls.
**Goal / value:** Replace scattered spreadsheet audits with a single governed workspace — compliance officers work one control at a time; scores and gaps surface automatically.
**Status:** ✅ Done (report generation backlogged) · **Labels:** `ai-governance` `frameworks` `compliance`

### PG-601 — Multi-framework onboarding & configuration · ✅ Done · 3 SP
Select and activate compliance frameworks scoped to the organisation.
- **AC:** Admin can activate EU AI Act, ISO 42001, ISO 27001, and NIST AI RMF from the framework catalogue.
- **AC:** Each activated framework gets a dedicated dashboard showing domain breakdown and overall score.
- **AC:** Framework version and issuing body metadata displayed; deactivation preserves historical assessment data.
- Subtasks: framework catalogue seed data · version metadata · activation/deactivation toggle.

### PG-602 — Control questionnaire & assessment engine · ✅ Done · 5 SP
Structured per-control questions with response capture, evidence attachment, and reviewer notes.
- **AC:** Each control loads its requirement text, response options (Compliant / Partial / Non-Compliant / N/A), and evidence slots.
- **AC:** Responses auto-save; reviewer can add notes and flag a control for follow-up.
- **AC:** Bulk status update supported for controls sharing the same evidence.
- Subtasks: control response history (who changed what, when) · partial-credit weighting configuration · bulk status update.

### PG-603 — Compliance score calculation & readiness dashboard · ✅ Done · 3 SP
Real-time compliance percentage scores and readiness bands per framework.
- **AC:** Score calculated as weighted ratio of Compliant + Partial controls to total applicable controls.
- **AC:** Per-domain breakdown shown (e.g. EU AI Act: Risk Management 80%, Transparency 60%).
- **AC:** Readiness bands: Red (<50%), Amber (50–79%), Green (≥80%) with visual indicators.
- **AC:** Score trend chart shows movement across last 6 assessment snapshots.
- Subtasks: threshold configuration per org · snapshot scheduling.

### PG-604 — Control-to-evidence linking · ✅ Done · 3 SP
Attach Evidence Hub files to specific framework controls as supporting documentation.
- **AC:** Reviewer selects one or more evidence files from the Evidence Hub and links them to a control.
- **AC:** Evidence sufficiency flag (Sufficient / Insufficient / Pending) set per link by the reviewer.
- **AC:** Expiry dates on evidence trigger alerts when linked evidence is approaching or past expiry.
- Subtasks: evidence expiry alerts · linked-evidence count badge on control cards.

### PG-605 — Core Governance OS — cross-framework control mapping · ✅ Done · 5 SP
Unified coverage layer that maps equivalent controls across active frameworks to eliminate duplicated effort.
- **AC:** Admin can map a control in Framework A to one or more controls in Framework B; mapping stored and bidirectional.
- **AC:** Governance OS dashboard shows unified coverage: how many unique requirements are covered across all frameworks.
- **AC:** Gap analysis view lists controls with no mapping and no linked evidence across all active frameworks.
- Subtasks: control gap analysis export · scenario modelling (add a framework and preview new gaps).

### PG-606 — Conformity assessment report auto-generation · ⬜ To Do · 5 SP
Auto-generate regulation-ready PDF reports from assessment responses and evidence.
- **AC:** EU AI Act report populated from PG-602 responses following Annex IV technical documentation structure.
- **AC:** ISO 42001 and NIST AI RMF report templates available; per-framework format.
- **AC:** Report includes score, per-control status, linked evidence list, and open gaps.
- **AC:** Reports versioned and archived; scheduled auto-generation supported.
- Subtasks: report template editor · scheduled delivery to stakeholder email list · report archive.

---

## EPIC PG-700 — Risk & Vendor Governance
**Summary:** A centralised risk register supporting IBM and MIT risk frameworks, paired with vendor management, scorecard-driven third-party risk assessments, and risk-to-control linkage.
**Goal / value:** Give risk owners a single place to identify, rate, mitigate, and evidence AI risks; give vendor managers a structured way to qualify and re-assess third parties.
**Status:** ✅ Done (portfolio heatmap backlogged) · **Labels:** `ai-governance` `risk` `vendor`

### PG-701 — Risk register with IBM/MIT framework support · ✅ Done · 5 SP
Create, categorise, and own AI risks aligned to recognised risk taxonomies.
- **AC:** Risk entry includes name, category, description, owner, likelihood, impact, severity (auto-calculated), and framework alignment (IBM / MIT / Custom).
- **AC:** Risk ID auto-generated (e.g. RISK-2026-001); full creation and edit audit trail.
- **AC:** IBM and MIT risk category taxonomies available as classification templates.
- Subtasks: risk ID generation · risk history audit trail · CSV bulk import.

### PG-702 — Risk lifecycle & mitigation tracking · ✅ Done · 3 SP
Manage risks through a defined lifecycle with linked mitigation actions and residual risk recording.
- **AC:** Status lifecycle: Identified → Under Review → Mitigating → Mitigated → Accepted → Closed.
- **AC:** Mitigation actions can be linked to platform Tasks (PG-1003); completion of the task reflects in risk status.
- **AC:** Residual risk (post-mitigation severity) recorded separately; re-assessment reminders triggered at configurable intervals.
- Subtasks: risk re-assessment reminder scheduler · mitigation effectiveness rating.

### PG-703 — Vendor management & onboarding · ✅ Done · 3 SP
Maintain a governed vendor register covering service details, risk classification, and contract lifecycle.
- **AC:** Vendor record includes name, service category, primary contact, risk level (High/Medium/Low), status, and contract dates.
- **AC:** Contract expiry notifications sent to vendor owner at 90, 30, and 7 days before expiry.
- **AC:** Vendor archived (not deleted) on contract end; historical assessments preserved.
- Subtasks: vendor tags & categories · contract expiry notification scheduler · CSV bulk import.

### PG-704 — Vendor risk scorecard & review cycle management · ✅ Done · 5 SP
Structured multi-dimension scorecard to assess and re-assess vendor risk at configurable intervals.
- **AC:** Scorecard covers: Information Security, Data Privacy & GDPR, Operational Reliability, Regulatory Compliance, and Financial Stability dimensions.
- **AC:** Review cycles configured per vendor (quarterly / semi-annual / annual); overdue reviews flagged on vendor list.
- **AC:** Scorecard history tracks score per dimension over time; trend view available.
- Subtasks: scorecard template configuration per vendor category · reviewer assignment · scorecard PDF export.

### PG-705 — Risk-to-evidence & control linking · ✅ Done · 3 SP
Connect risk register entries to supporting evidence and the framework controls they address.
- **AC:** Risk can be linked to one or more Evidence Hub files; links displayed in both the risk record and evidence file.
- **AC:** Risk linked to one or more framework controls; compliance score of linked controls visible from risk record.
- **AC:** Risk-to-use-case mapping allows portfolio-level "which risks affect which AI projects" query.
- Subtasks: risk-to-use-case mapping · linked-risk count badge on framework control cards.

### PG-706 — Risk heatmap & portfolio analytics · ⬜ To Do · 5 SP
Visual analytics layer turning the risk register into an executive-facing risk dashboard.
- **AC:** Interactive heatmap plots all active risks on a likelihood × impact grid; clickable cells drill into risk list.
- **AC:** Portfolio summary: total open risks, risks by severity, risks by category, new/closed this period.
- **AC:** Risk trend chart: open risk count and average severity over last 12 months.
- **AC:** Executive risk summary exportable as PDF for board reporting.
- Subtasks: risk concentration alerts (>N High risks in same category) · heatmap PDF snapshot export.

---

## EPIC PG-800 — AI Model Lifecycle Management
**Summary:** A model inventory that tracks every AI model from registration through production to retirement, with model cards, per-model risk assessment, and evaluation project integration.
**Goal / value:** Give the AI team and auditors a definitive record of every AI model in use — what it does, how it performs, what risks it carries, and what evidence supports it.
**Status:** ✅ Done (retirement workflow backlogged) · **Labels:** `ai-governance` `models` `lifecycle`

### PG-801 — Model inventory & registration · ✅ Done · 3 SP
Central registry for all AI models with provider, version, use-case, and lifecycle metadata.
- **AC:** Model entry includes name, provider, version, type (LLM / CV / Classifier / etc.), linked use case, risk classification, and lifecycle stage.
- **AC:** Risk classification follows EU AI Act Annex III categories: Unacceptable / High / Limited / Minimal.
- **AC:** Lifecycle stages: Development → Testing → Staging → Production → Monitoring → Deprecated.
- **AC:** Model ID auto-generated; full creation and edit audit trail.
- Subtasks: bulk model import · model ID generation · EU AI Act Annex III auto-classification prompt.

### PG-802 — Model card documentation (EU AI Act Annex IV) · ✅ Done · 5 SP
Structured model card capturing all technical documentation required by EU AI Act Article 11 and Annex IV.
- **AC:** Model card sections: Intended Purpose, Training Data, Performance Metrics, Limitations, Prohibited Uses, Human Oversight Mechanisms, and Update History.
- **AC:** Card enforces Annex IV fields for models classified High-Risk; required fields highlighted.
- **AC:** Model card version history maintained; each update timestamped with author.
- Subtasks: model card PDF export · Annex IV completeness indicator · pre-fill from model metadata.

### PG-803 — Per-model risk assessment · ✅ Done · 3 SP
Model-scoped risk register covering technical, fairness, and operational risk categories.
- **AC:** Risks raised on a model appear in both the model risk tab and the global Risk Register (PG-701).
- **AC:** EU AI Act Annex III classification indicator shown on model; prompted when use-case type suggests High-Risk.
- **AC:** Model-level risk summary (count by severity) displayed on model inventory list card.
- Subtasks: automated risk level suggestion based on model type + use-case pair · risk count badge.

### PG-804 — Model evidence hub · ✅ Done · 3 SP
Model-scoped evidence storage linking technical artefacts (bias reports, security assessments, test results) to the model record.
- **AC:** Evidence files uploaded to the model evidence hub are tagged to that model and discoverable from the global Evidence Hub.
- **AC:** Evidence linked to framework controls propagates the model's evidence to compliance assessments.
- **AC:** Evidence freshness indicator flags files not updated in >90 days.
- Subtasks: evidence freshness indicator · cross-link to framework controls · evidence count badge on model card.

### PG-805 — Model evaluation integration (EvalServer) · ✅ Done · 8 SP
Full evaluation project lifecycle: create experiments, manage datasets, run against multiple LLM providers, and view results.
- **AC:** Evaluation projects linked to a model in the inventory; project list scoped to org.
- **AC:** LLM API keys (OpenAI, Anthropic, Gemini, Mistral, xAI) managed per org under Eval Settings.
- **AC:** Dataset editor supports creating and editing test datasets for evaluation runs.
- **AC:** Experiment results (score, latency, token cost) stored and comparable across runs.
- Subtasks: evaluation result history · benchmark comparison view · dataset versioning.
- **Bug subtask (✅):** EvalServer–Gateway auth handshake — fixed missing `Authorization` header forwarding to EvalServer in Docker.

### PG-806 — Model decommission & retirement workflow · ⬜ To Do · 3 SP
Structured deprecation process ensuring evidence is preserved and downstream systems notified.
- **AC:** Deprecation request captures reason, replacement model reference, and planned retirement date.
- **AC:** All linked evidence and model card versions retained as read-only after deprecation; evidence not deletable.
- **AC:** Linked use cases and framework controls notified; control evidence links flagged as "model retired."
- **AC:** Regulatory notification checklist generated for High-Risk models being retired.
- Subtasks: regulatory notification checklist template · evidence archival freeze · use-case notification.

---

## EPIC PG-900 — Evidence, Policy & Training
**Summary:** The document management backbone of the governance platform — evidence hub with versioned file storage, policy library with lifecycle management, training registry, approval workflows, and the public AI Trust Centre.
**Goal / value:** Auditors find every piece of governance evidence in one searchable, versioned, access-controlled hub; policies and training records are always current and signed off.
**Status:** ✅ Done (governed share links backlogged) · **Labels:** `ai-governance` `evidence` `policy` `training`

### PG-901 — Evidence hub & file management · ✅ Done · 5 SP
Central, versioned document repository with approval workflows and cross-linking to risks, controls, and models.
- **AC:** Files uploadable with tags, categories, description, and optional expiry date; virtual folder organisation supported.
- **AC:** File version history maintained; previous versions downloadable; current version highlighted.
- **AC:** Approval workflow integrated — files can be submitted for sign-off before being linked to controls or policies.
- **AC:** Search and filter by tag, category, linked entity (risk, control, model, vendor), and expiry status.
- Subtasks: bulk upload (ZIP unpack) · expiry-date alert emails · file preview for PDF/image/Office docs.

### PG-902 — Policy library & lifecycle management · ✅ Done · 5 SP
Governed policy authoring and approval with template library, version control, and acknowledgement tracking.
- **AC:** Policy lifecycle: Draft → Under Review → Approved → Published → Archived; transitions gated by role.
- **AC:** Rich-text editor with policy metadata: owner, review schedule, version, effective date.
- **AC:** Policy template library includes: AI Acceptable Use, AI Data Governance, Model Risk Management, Incident Response, and Bias & Fairness policies.
- **AC:** Published policies linked to framework controls as supporting evidence.
- Subtasks: policy acknowledgement tracking per user role · review schedule reminder · version diff view.

### PG-903 — Training registry & completion tracking · ✅ Done · 3 SP
Log, track, and evidence AI governance training programmes across departments.
- **AC:** Training record includes: programme name, provider, target audience (department/role), duration, delivery date, and status.
- **AC:** Completion status: Planned / Scheduled / In Progress / Completed; completion rate (%) calculated per programme.
- **AC:** Evidence upload per programme (certificates, attendance lists) linked to training record.
- **AC:** Training evidence links to framework controls (e.g. EU AI Act Article 26 deployer training obligation).
- Subtasks: completion rate dashboard widget · overdue training reminders · certificate bulk upload.

### PG-904 — Approval workflows & AI content review · ✅ Done · 5 SP
Configurable multi-step approval chains for evidence, policies, and AI-generated content disclosures.
- **AC:** Approval chains configurable per content type (evidence, policy, AI output) with ordered approver steps.
- **AC:** EU AI Act Article 52 — AI-generated content flagged for human review before publication; review queue in dashboard.
- **AC:** Approval history records every decision (approve/reject), reviewer identity, timestamp, and comments.
- **AC:** Delegation: approver can delegate to a substitute with time limit.
- Subtasks: approval rules configuration UI · delegation with time limit · email notification per approval stage.

### PG-905 — AI Trust Centre (public transparency page) · ✅ Done · 5 SP
Public-facing transparency page per organisation exposing compliance posture, certified documents, and sub-processor disclosures.
- **AC:** Trust Centre accessible via unique org hash URL (no login required); content controlled by org admin.
- **AC:** Resources tab: compliance certifications and published policy documents with download links.
- **AC:** Sub-processors tab: list of third-party providers with data category and DPA status.
- **AC:** Overview section: AI governance statement, framework coverage badges, last-updated timestamp.
- Subtasks: custom branding (logo, accent colour) per org · publish/unpublish individual documents · page view analytics for admins.

### PG-906 — Governed share links & access-controlled resource export · ⬜ To Do · 3 SP
Time-limited, permission-scoped shareable links for evidence, frameworks, and report artefacts.
- **AC:** Share links generated for evidence files, framework assessments, and reports with configurable expiry (hours / days).
- **AC:** Permissions: view-only / download / comment; email-gated access optional (recipient must verify email).
- **AC:** All shared resource views logged (accessor, timestamp, IP) in the audit trail.
- **AC:** Link owner can revoke a share link at any time; revocation immediate.
- Subtasks: link expiry enforcement · email-gated access flow · share link audit log view.

---

## EPIC PG-1000 — Incident, Monitoring & Reporting
**Summary:** Covers the operational governance loop — AI incident tracking, post-market monitoring cycles, task management, FRIA, and the reporting layer that turns governance data into audit-ready outputs.
**Goal / value:** Close the loop between identifying a governance issue and resolving it — every incident, monitoring finding, and task is tracked, evidenced, and reportable.
**Status:** 🟡 In Progress (FRIA automation and report export backlogged) · **Labels:** `ai-governance` `incidents` `monitoring` `reporting`

### PG-1001 — AI incident management (EU AI Act Article 73) · ✅ Done · 5 SP
Structured incident lifecycle covering discovery, investigation, resolution, and regulatory notification.
- **AC:** Incident record includes: ID (auto-generated), type (Performance / Bias / Security / Compliance / Operational), severity, linked AI system, linked model, and linked risks.
- **AC:** Status lifecycle: Open → Under Investigation → Resolved → Closed; each transition timestamped.
- **AC:** EU AI Act Article 73 serious incident drafting workflow: pre-filled notification template generated for High/Critical incidents.
- **AC:** Incident linked to corrective action Tasks (PG-1003); task completion reflected in incident status.
- Subtasks: incident ID auto-generation · regulatory notification draft PDF · SLA breach alert (unresolved High/Critical > N days).

### PG-1002 — Post-market monitoring cycles · ✅ Done · 5 SP
Recurring monitoring periods with structured questionnaires to verify ongoing compliance and model performance.
- **AC:** Monitoring cycle defined with: linked AI system, period (monthly/quarterly/annual), owner, and control scope.
- **AC:** Cycle questionnaire auto-populated from framework controls linked to the AI system; answers captured per cycle run.
- **AC:** Completed cycle archived as a monitoring report with responses, scores, and evidence links.
- **AC:** Overdue cycle alerts triggered when a scheduled cycle start date is passed without initiation.
- Subtasks: cycle scheduling · overdue alerts · archived cycle report list · cycle-over-cycle comparison view.

### PG-1003 — Task management & governance action tracking · ✅ Done · 3 SP
Governance-aware task system linking action items to risks, controls, incidents, vendors, and models.
- **AC:** Task entry includes: title, description, priority (Critical/High/Medium/Low), due date, assignee, and linked entity (risk / control / incident / vendor / model).
- **AC:** Status: Open → In Progress → Completed → Overdue; overdue status auto-set at midnight past due date.
- **AC:** Task radar view shows open tasks by priority and due-date bucket for assigned user.
- Subtasks: recurring task templates · overdue notification to assignee and task owner · task radar dashboard widget.

### PG-1004 — FRIA — Fundamental Rights Impact Assessment · 🟡 In Progress · 5 SP
Structured FRIA questionnaire aligned to EU AI Act Article 27 for deployers of high-risk AI systems.
- **AC:** FRIA scoped to a specific AI deployment; deployer details, AI system reference, and assessment date captured.
- **AC:** Questionnaire covers: impact on privacy, non-discrimination, human dignity, freedom of expression, right to effective remedy, and data protection.
- **AC:** Each question supports a risk rating (Low/Medium/High), justification text, and evidence attachment.
- **AC:** Sign-off workflow: DPO review → Legal approval → published FRIA version; version history maintained.
- Subtasks: FRIA template aligned to EU AI Act Article 27 obligations · FRIA version history · regulatory export format.
- **Bug subtask (✅):** FRIA form state not persisting on tab switch — fixed Redux slice missing rehydration on route change.

### PG-1005 — Governance dashboard & audit readiness analytics · ✅ Done · 5 SP
Integrated executive dashboard surfacing risk posture, compliance scores, model lifecycle, and task health in one view.
- **AC:** Dashboard panels: active risks by severity, compliance scores per framework, vendor risk summary, model lifecycle count by stage, open incidents, and task radar.
- **AC:** Audit Readiness tab shows per-control readiness scores across all active frameworks with evidence coverage indicators.
- **AC:** AI Audit Trail tab: complete chronological log of every governance action (control responses, evidence uploads, policy approvals, incident updates).
- **AC:** Role-scoped views: Admin sees full dashboard; Reviewer sees their pending approvals; Auditor sees read-only evidence and scores.
- Subtasks: executive summary PDF snapshot · role-specific dashboard view configuration.

### PG-1006 — Report generation & scheduled delivery · ⬜ To Do · 5 SP
On-demand and scheduled report generation from compliance, risk, vendor, training, and evidence data.
- **AC:** Report types: Audit Readiness, Risk Register Summary, Vendor Risk Register, Training Completion, Evidence Inventory, and Incident Log.
- **AC:** Each report customisable: date range, framework scope, entity filters (by use case, department, or model).
- **AC:** Scheduled reports delivered to named recipients by email on configurable cadence.
- **AC:** Report archive with version history; reports exportable as PDF and CSV.
- Subtasks: report template editor · schedule configuration UI · report archive page · CSV + PDF dual export.

---

## Suggested sprint sequencing (next backlog)
1. **PG-1004** FRIA automation — in-flight; close out Article 27 template and sign-off workflow.
2. **PG-1006** Report generation & scheduled delivery — high stakeholder value for audit cycles.
3. **PG-606** Conformity assessment report auto-generation — closes the evidence → report loop.
4. **PG-706** Risk heatmap & portfolio analytics — executive-facing risk visibility story.
5. **PG-906 / PG-806** Governed share links & model retirement — compliance hygiene before external auditor access.

---
*Generated from the AI Governance implementation work. Import: create Epics PG-600…PG-1000, then stories under each; convert "Subtask" bullets to Jira sub-tasks.*
