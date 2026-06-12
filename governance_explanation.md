# Parkar GovernAI — Complete Demo Guide
> A sales-ready walkthrough of every module in the platform

---

## What Is Parkar GovernAI?

Parkar GovernAI is an **AI Governance platform** that helps organizations comply with AI regulations and industry standards — primarily the **EU AI Act**, **ISO 42001**, **ISO 27001**, and **NIST AI RMF**. It answers a fundamental business question every enterprise faces today:

> *"We use AI — but can we prove we're doing it responsibly, safely, and in compliance with the law?"*

The platform provides a single system of record for:
- Every AI system (use case) in the organization
- Every AI model, dataset, and agent deployed
- Every risk identified and mitigated
- Every policy written and approved
- Every compliance control tracked
- Every incident reported

Think of it as **the compliance backbone for your AI program** — the same way a SIEM is the security backbone, or a GRC tool is the audit backbone.

---

## The Big Picture: How the Modules Connect

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PARKAR GOVERNAI                              │
│                                                                     │
│  INVENTORY (What AI do we have?)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Use Cases   │──│   Models     │──│ Datasets │  │  Agents   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  └───────────┘  │
│         │                 │                                         │
│  ASSURANCE (Are we managing it safely?)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐  │
│  │    Risks     │  │  Frameworks  │  │Evidence  │  │ Reporting │  │
│  └──────────────┘  └──────────────┘  └──────────┘  └───────────┘  │
│                                                                     │
│  GOVERNANCE (Are we operating responsibly?)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Vendors    │  │   Policies   │  │   Incident Management    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                     │
│  OPERATIONS (Who is doing what?)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │    Tasks     │  │  Training    │  │      AI Trust Center     │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Demo Flow — Recommended Order

Start from the beginning of the journey a governance team takes:

1. **Login → Start Here** — orientation and onboarding
2. **Dashboard** — the command center
3. **Use Cases** — register your first AI system
4. **Model Inventory** — document the model used
5. **Datasets** — document training data
6. **Agent Discovery** — find all AI agents automatically
7. **Frameworks** — map to EU AI Act / ISO 42001
8. **Risk Management** — identify and track risks
9. **Vendors** — assess third-party AI providers
10. **Policy Manager** — write governance policies
11. **Training Registry** — track team training
12. **Evidence Hub** — collect compliance documents
13. **Incident Management** — handle AI incidents
14. **Reporting** — generate board/regulator reports
15. **AI Trust Center** — publish your public transparency page

---

# MODULE 1: Start Here

**Route:** `/start-here`  
**Purpose:** Onboarding hub and orientation center

## What It Shows

When a user logs in for the first time, this is the welcome screen. It is personalized — it greets the user by name with a time-aware greeting ("Good morning, Kamlesh") and immediately shows them what to do next.

### The 5-Step Onboarding Checklist (right sidebar)
A circular progress ring tracks completion:
1. ✅ Create your account (auto-completed)
2. ✅ Set up your organization (auto-completed)
3. ⬜ Invite a team member → links to `/settings` (team tab)
4. ⬜ Create your first use case → links to `/home`
5. ⬜ Complete a risk assessment → links to `/risk-management`

When all 5 are done, a **confetti animation** fires and the checklist auto-dismisses.

### Main Content Area
- **Getting Started cards** — 4 cards: Welcome video, Quick start guide, Navigating the dashboard, Installation guide
- **Explore GovernAI carousel** — 10 feature cards: AI governance, Compliance, Risk management, LLM Evals, AI detection, Shadow AI, Policies, Reporting, Training, Plugins (each opens a feature video)
- **Shortcuts grid** — 8 quick-access icons: Use cases, Risks, Models, Vendors, Tasks, Reporting, Policies, Settings

### Right Sidebar
- **Your experts panel** — contact details for two AI governance consultants (Ulas Ozguven, David Pinkney) with a direct link to book a consultation
- **Resources** — User guide, Blog, API documentation, Community
- **What's new** — 4 recent regulatory news articles (e.g., "US AI regulations 2026", "EU AI Act omnibus: what changed")

## Why It Matters for the Demo
> *"The moment someone joins your team, they're not lost. They see exactly what they need to do, they can watch a 2-minute intro video, and within 10 minutes they understand the entire platform. There's no steep learning curve."*

---

# MODULE 2: Dashboard

**Route:** `/` (home/index)  
**Purpose:** Executive and operational command center

## What It Shows

The dashboard is the most data-dense screen in the platform. It supports **two views** — toggle between them with a single button:

### Executive View (Board/CISO level)
Shows the big picture:
- **5 Quick Stat cards** at the top: Models count, Vendors count, Policies count, Trainings count, Incidents count — each clickable to navigate to that module
- **AI Governance Score** — a composite score (0–100) breaking down governance maturity across all modules
- **Framework Completion donuts** — ISO 42001 Clauses, ISO 42001 Annexes, ISO 27001, NIST AI RMF — with left/right carousel navigation between frameworks
- **Risk Distribution donuts** — Use Case Risks (High/Medium/Low), Vendor Risks (Very High through Very Low), Model Risks (Critical through Low)
- **Recent Activity feed** — last 5 changes across the entire platform (policies updated, risks added, incidents opened, evidence uploaded)
- **Recent Use Cases table** — last 5 projects with compliance progress %
- **Training, Policy, Incident status cards** — distribution by status

### Operations View (Compliance team level)
Reorders the same cards to prioritize action items:
- **Task Radar** — Overdue / Due today / Upcoming tasks (at the top — most urgent)
- **Incident Status** — Open / Investigating / Mitigated / Closed
- **Evidence Coverage** — how many models have compliance documents attached
- **Model Lifecycle** — distribution across lifecycle stages

### 4 Dashboard Tabs
1. **Overview** — all the cards above
2. **Audit Readiness** — per-control readiness scores, EU AI Act Article compliance tracker
3. **AI Content Review** — reviews and approvals for AI-generated content (EU AI Act Article 52)
4. **AI Audit** — full audit trail for every AI action (EU AI Act Article 12 - record keeping)

## Key Actions
- Toggle Executive ↔ Operations view (saved per user)
- Click any stat card to navigate directly to that module
- Click a use case row to open the full project view
- On first login: a **"Change Organization Name" modal** auto-opens

## Why It Matters for the Demo
> *"Your CISO opens the dashboard every Monday morning. In 30 seconds they know: Are we compliant? Are there new risks? Are incidents being handled? Are there overdue tasks? No spreadsheets, no chasing people — one screen tells the entire story."*

---

# MODULE 3: Tasks

**Route:** `/tasks`  
**Purpose:** Work management for the governance team

## What It Shows

### 5 Summary Tiles
- Total, Open (blue), Overdue (red), In Progress (orange), Completed (green)
- Clicking any tile filters the table instantly

### List View (default)
A filterable table: Task title | Priority (Critical/High/Medium/Low) | Status | Due date | Assignees | Actions

### Deadline View (second tab)
Tasks grouped into time buckets: Overdue | Today | This week | Next week | This month | Later | No due date

## Key Actions

- **Create task** — set title, priority, due date, assignees, and most importantly: **link the task to other entities** (a specific use case, a compliance control, a risk). This creates traceability: "We created a task to fix Risk #14 in the Fraud Detection AI use case."
- **Inline status/priority change** — update right in the table row, no modal needed
- **Export to CSV/Excel** — for status reporting
- **AI Agent Integration** — the GovernanceOS AI can **automatically create tasks** on behalf of the team based on compliance gaps it detects. The table auto-refreshes when an AI-generated task is approved.

## Why It Matters for the Demo
> *"Every compliance framework generates action items. Instead of managing these in Jira or spreadsheets alongside your governance data, everything lives here. And when our AI advisor identifies a gap in your ISO 42001 implementation, it can create the remediation task automatically."*

---

# MODULE 4: Frameworks

**Route:** `/framework`  
**Purpose:** Compliance control center — map governance activities to regulatory standards

## Supported Frameworks (Out of the Box)
- **ISO 42001** — AI Management Systems (Clauses + Annexes)
- **ISO 27001** — Information Security Management (Clauses + Annexes)
- **NIST AI RMF** — AI Risk Management Framework (Govern / Map / Measure / Manage functions)
- **EU AI Act** — managed per use case (not at org level)
- **Plugins**: SOC 2, GDPR, HIPAA, and more via the plugin marketplace

## What It Shows — 5 Tabs

### Tab 1: Dashboard
- Framework completion donuts per framework
- Assignment status (% of controls with an owner)
- Status breakdown (Not Started → Draft → In Progress → Awaiting Review → Implemented)
- Per-framework control category overview cards with progress bars

### Tab 2: Framework Risks
- Risks identified at the organizational level, linked to framework controls

### Tab 3: Linked Models
- All AI models from the Model Inventory that are mapped to this framework's requirements

### Tab 4: Requirements and Controls (the core work area)
This is where the compliance work happens:

**For ISO 42001 & ISO 27001:** Two sub-tabs — Clauses | Annexes
- Each clause/control row shows: title, status, applicability, owner (assignee), reviewer, due date, description, evidence attachments
- Inline editing of all fields
- Filter by: status, owner, reviewer, due date, applicability

**For NIST AI RMF:** Four sub-tabs — Govern | Map | Measure | Manage
- Each subcategory shows status and assignment
- Filter by status and search term

### Tab 5: Settings
- Configure which frameworks are active
- Bulk enable/disable frameworks

## Key Actions
- Switch frameworks via the ButtonToggle at the top
- Update any control's status, assign an owner, attach evidence — all inline
- Navigate via URL deep-links (clicking from the Dashboard → jumps to the exact control)
- Add/remove frameworks via the "Manage frameworks" dropdown

## The Organizational Project Concept
All framework work lives inside an **Organizational Project** — one master project for the whole company's governance posture. When you first visit, if no project exists, you're prompted to create one. This is the governance container.

## Why It Matters for the Demo
> *"This is your compliance control room. ISO 42001 has 38 clauses and 93 annex controls. NIST AI RMF has 106 subcategories. You don't manage those in a spreadsheet. Here, every control has an owner, a status, a due date, and attached evidence. Your auditor can see — for every single control — exactly who is responsible, what has been done, and what evidence proves it."*

---

# MODULE 5: Use Cases (AI System Registry)

**Route:** `/home` (shown as "Use Cases" in sidebar)  
**Purpose:** Register and govern every AI system in the organization

## The Core Concept

A **Use Case** (internally called a "Project") is the central governance object. Every AI system deployed in the organization gets a Use Case record. Everything else — risks, models, datasets, compliance controls, vendors — links back to a Use Case.

**EU AI Act requires:** Organizations must enumerate all AI systems, classify them by risk level, and demonstrate compliance per system. This is that registry.

## What It Shows

Two views — Card view and Table view:

**Table columns:** UC-ID | Use case title | AI risk level | Role | Start date | Last updated | Actions

**Summary tiles:** By status (Not started / In progress / Under review / Completed / Closed / On hold / Rejected)

## Key Fields When Creating a Use Case

| Field | Purpose |
|---|---|
| **UC-ID** | Auto-generated (UC-1, UC-2...) — immutable reference number |
| **AI Risk Classification** | Prohibited / High risk / Limited risk / Minimal risk (EU AI Act Article 6) |
| **Role** | Deployer / Provider / Distributor / Importer / Manufacturer / Authorized Rep |
| **Linked Frameworks** | EU AI Act, ISO 42001, ISO 27001, NIST AI RMF (multi-select) |
| **Owner + Members** | Team assignment with roles |
| **Geography + Industry** | Compliance context |
| **Status** | Full lifecycle tracking |

## Inside a Use Case — 5 Tabs

### Tab 1: Overview
- Compliance progress per framework (% of controls completed, % of assessments completed)
- Risk count by severity
- Linked members, vendors, models, datasets

### Tab 2: Risks
- All risks scoped to this specific AI system
- Direct access to the project risk register

### Tab 3: Project Settings
- Edit framework assignments, member roles, and classification details
- FRIA (Fundamental Rights Impact Assessment) — EU AI Act Article 27 requirement
- CE Marking documentation

### Tab 4: Activity
- Full change history for the use case — every field change, status transition, member addition

### Tab 5: Post-Market Monitoring
- Ongoing monitoring questions and answers for deployed AI systems (EU AI Act Article 72)

## Why It Matters for the Demo
> *"Step one of any AI governance program is: know what AI you have. We start by creating a Use Case for 'Fraud Detection AI'. We classify it as High Risk under EU AI Act (because it makes decisions affecting people financially). We assign the EU AI Act framework to it. Now we have a compliance container — every control, every risk, every piece of evidence for this system lives here. If a regulator asks 'show me your AI systems and how you're governing them', you pull up this list."*

---

# MODULE 6: Model Inventory

**Route:** `/model-inventory`  
**Purpose:** Centralized registry of all AI/ML models — who approved them, what risks they carry

## What It Shows — 4 Tabs

### Tab 1: Models
- Summary tiles: Total / Approved / Restricted / Pending / Blocked
- Table: Provider | Model name | Version | Approver | Security Assessment | Risk count | Status | Status date

### Tab 2: Model Risks
- Cross-model risk register
- Summary tiles: Total / Low / Medium / High / Critical
- Table: Risk name | Model | Risk level | Status | Owner | Next review date

### Tab 3: Evaluations
- LLM evaluation results from the EvalServer integration
- Performance benchmarks, safety scores, bias test results

### Tab 4: Evidence Hub
- Compliance documents linked to each model
- 15 standardized evidence types (Model Card, Risk Assessment, Bias Report, CE Documentation, etc.)

## Key Fields When Adding a Model

| Field | What It Captures |
|---|---|
| **Provider** | OpenAI, Anthropic, AWS, Microsoft, Internal, etc. |
| **Model + Version** | GPT-4o, Claude 3.5, Llama 3.2, etc. |
| **Status** | Approved / Restricted / Pending / Blocked — the approval gate |
| **Approver** | Who signed off on using this model |
| **Security Assessment** | Boolean flag + uploaded assessment document |
| **Hosting Provider** | Cloud / On-premises / SaaS |
| **Known Biases** | Documented limitations |
| **Linked Use Cases** | Which AI systems use this model |
| **Linked Frameworks** | Which compliance requirements apply |

## The Approval Workflow
New models enter as **Pending**. An approver reviews the security assessment and sets status to:
- **Approved** — cleared for use
- **Restricted** — approved with conditions
- **Blocked** — not permitted in the organization

This is your **model governance gate** — no unapproved model should be in production.

## Why It Matters for the Demo
> *"How many organizations know every AI model running in their environment? We show you GPT-4 is approved, Llama 3 is restricted (runs on-prem only), and there are 3 models in Pending status awaiting security review. EU AI Act Articles 9, 13 require technical documentation for every model. Each model has evidence attached — the security assessment, the model card, the bias report. One click to see the full documentation trail."*

---

# MODULE 7: Datasets

**Route:** `/datasets`  
**Purpose:** Data governance and lineage tracking for AI training and evaluation data

## What It Shows

Summary tiles: Total / Draft / Active / Deprecated / Archived

Table: Name | Version | Type | Source | Classification | PII flag | Status | Owner | Updated

## Key Fields When Adding a Dataset

| Field | Why It Matters |
|---|---|
| **Type** | Training / Validation / Testing / Production / Reference |
| **Classification** | Public / Internal / Confidential / Restricted |
| **Contains PII** | Boolean — triggers GDPR/CCPA compliance obligations |
| **PII Types** | Specific categories documented (names, health data, financial data) |
| **Known Biases** | What bias sources exist in the data |
| **Bias Mitigation Steps** | What was done to address them |
| **Collection Method** | How data was gathered |
| **Preprocessing Steps** | Transformations applied |
| **Linked Models** | Which models were trained on this data |
| **Linked Use Cases** | Which AI systems this data belongs to |

## The Compliance Story

**EU AI Act Article 10** requires high-risk AI systems to have documented data governance practices covering:
- Training, validation, and testing datasets ✓
- Data collection methodology ✓
- Data processing steps ✓
- Known limitations and biases ✓
- Measures taken to address biases ✓

This page captures exactly that evidence.

## Why It Matters for the Demo
> *"Your fraud detection AI was trained on customer transaction data. That data contains PII. Under EU AI Act, GDPR, and CCPA you need to document what data was used, classify it, and prove you addressed any biases. This is the dataset record for that training data — Classification: Restricted, Contains PII: Yes, Bias mitigation: stratified sampling applied. Link it to the model, link it to the use case, and now you have a complete data lineage trail that goes all the way to your regulator."*

---

# MODULE 8: Agent Discovery

**Route:** `/agent-discovery`  
**Purpose:** Automatically discover and inventory all AI agents running in your organization

## The Problem It Solves

Most enterprises don't know all the AI agents running in their environment — GitHub Copilot agents, Azure AI Foundry agents, AWS Bedrock agents, Slack bots, custom LLM pipelines. This is the **shadow AI problem**. You can't govern what you don't know about.

## What It Shows

Summary tiles: Total / Unreviewed / Confirmed / Rejected / Stale

Table: Agent name | Source system | Agent type | Permissions | Last activity | Review status | Stale flag

## The Discovery Flow

### 1. Sync (Auto-Discovery)
Click **"Sync now"** → the platform calls connected systems (Azure AI Foundry, custom sources via plugins) and automatically discovers all AI agents. Returns counts: "Found 23 agents — 18 new, 5 updated."

### 2. Review Each Agent
Click any discovered agent to open the **Review drawer**:
- Display name and source system
- **Permission categories** — normalized into 10 categories: `ai:invoke`, `ai:manage`, `data:read`, `data:write`, `identity:read`, `identity:manage`, `code:read`, `code:write`, `comms:read`, `comms:write`
- Last activity timestamp
- **Confirm** (this agent is approved) or **Reject** (this agent should not be running)

### 3. Link to Model Inventory
Link a confirmed agent to its corresponding model in the Model Inventory. This creates the complete chain:
```
Use Case → Model → Agent → Permissions
```

### Stale Agent Detection
Agents with no activity for 30+ days are automatically flagged as **Stale** — enabling cleanup of abandoned AI deployments.

## Why It Matters for the Demo
> *"Before we built Agent Discovery, one of our customers found 47 AI agents running in their Azure environment that their governance team didn't know about — including one with `identity:manage` permissions. EU AI Act Article 14 requires human oversight of AI systems. You can't have oversight of agents you've never seen. Click Sync, 30 seconds later you have a complete inventory. Then you review each one, confirm the approved ones, reject the rogue ones, and link them all to your model governance records."*

---

# MODULE 9: Risk Management

**Route:** `/risk-management`  
**Purpose:** The central AI risk register — identify, assess, track, and mitigate risks across all AI systems

## What It Shows

### 6 Summary Tiles
Total | Very High (red) | High (orange) | Medium (yellow) | Low (green) | Very Low (grey)

### Risk Table
Risk name | Owner | Severity | Mitigation Status | Risk Level | Target Date | Linked Controls | Actions

### Risk Level Calculation
```
Risk Level = Likelihood × 1 + Severity × 3
```
Severity is weighted 3× — because a catastrophic but unlikely event still warrants high attention. This mirrors EU AI Act risk assessment methodology.

## 3 Ways to Add Risks

### 1. Manual Entry
Full form: risk name, description, AI lifecycle phase (7 phases from Problem Definition to Decommissioning), likelihood, severity, mitigation status, mitigation plan, implementation strategy, evidence document, framework linkages.

### 2. Import from IBM AI Risk Database (Recommended)
113 curated, research-backed AI risks covering:
- Agentic AI risks
- Data privacy violations
- Model inference attacks
- Operational failures
- Fairness and bias risks

Browse, select the relevant ones, review, and save. **No risk writing from scratch.**

### 3. Import from MIT AI Risk Repository
Academic research-based risks covering AI safety, fairness, accountability, transparency, and societal impact.

## 7 Mitigation Statuses
Not Started → In Progress → Completed → On Hold → Deferred → Cancelled → Requires Review

## Analytics Drawer
Historical trend charts showing severity, likelihood, mitigation status, and risk level distributions over configurable timeframes (7 days to 1 year). Watch your risk posture improve over time.

## Why It Matters for the Demo
> *"Most organizations start their AI risk program with a blank spreadsheet. We give you two curated risk databases — 113 risks from IBM, academic research from MIT. Click import, select the risks relevant to your AI system, and in 5 minutes you have a populated risk register. Now assign owners, set target dates, track mitigation progress. Your CISO can see in real-time: we have 3 Very High risks, 2 are In Progress, 1 is On Hold. The analytics drawer shows that our overall risk level has dropped 40% over the last 6 months."*

---

# MODULE 10: Vendors

**Route:** `/vendors`  
**Purpose:** Third-party AI risk management — assess and track every AI vendor relationship

## The EU AI Act Requirement
EU AI Act Article 28 imposes specific obligations on deployers who use third-party AI systems. If you use OpenAI, AWS Rekognition, or any external AI API, you have a vendor obligation to document and assess that relationship.

## What It Shows — 2 Tabs

### Tab 1: Vendors List
Summary tiles by review status.
Table: Name | Assignee | Review status | Risk count | Scorecard (0-100) | Review date

### Tab 2: Vendor Risks
Cross-vendor risk register:
Table: Risk description | Vendor | Linked use case | Action owner | Risk severity | Risk level

## The Vendor Scorecard (0–100)

The scorecard automatically calculates a composite risk score based on 4 dimensions:

| Dimension | Values |
|---|---|
| **Data Sensitivity** | None / Internal only / PII / Financial / Health (HIPAA) / Model weights / Other sensitive |
| **Business Criticality** | Low / Medium / High (critical to core services) |
| **Past Issues** | None / Minor incident / Major incident (data breach, legal issue) |
| **Regulatory Exposure** | None / GDPR / HIPAA / SOC 2 / ISO 27001 / EU AI Act / CCPA / Other |

A vendor processing your customer health data (HIPAA), critical to your core service, with a past security incident, and EU AI Act regulatory exposure will score very high → **triggers immediate review.**

## Review Workflow
Not started → In review → Reviewed → Requires follow-up

## Why It Matters for the Demo
> *"When you select OpenAI as a vendor, you set: Data Sensitivity = PII (your users' messages go to their API), Business Criticality = High, Past Issues = None, Regulatory Exposure = EU AI Act. The scorecard calculates a risk score automatically. Now your procurement team reviews it and adds specific risks — 'vendor lock-in risk', 'data residency risk for EU customers'. Each risk gets an action owner and a timeline. You have a documented, auditable third-party AI risk program."*

---

# MODULE 11: Policy Manager

**Route:** `/policies`  
**Purpose:** Write, version, approve, and publish AI governance policies

## Why Policies Matter
EU AI Act, ISO 42001, NIST AI RMF all require written AI governance policies. This isn't optional — auditors will ask to see your AI Ethics Policy, your AI Risk Management Policy, your Human Oversight Policy. This module is where you create and manage those documents.

## What It Shows — 2 Tabs

### Tab 1: My Policies
**7 status tiles:** Total | Draft | Under Review | Approved | Published | Archived | Deprecated

**Table:** Title | Status | Next Review date | Author | Last Updated | Updated By

**Virtual folder sidebar** — organize policies into folders (Core AI governance, Model lifecycle, Data and security, Legal and compliance, etc.)

### Tab 2: Templates
Pre-built policy templates organized by category. Click "Use template" to start with a professionally written, framework-aligned policy draft instead of a blank page.

Template categories:
- Core AI governance
- Model lifecycle
- Data and security
- Legal and compliance
- People and organization
- Industry packs

## The Policy Editor
A full-screen rich text editor (like Google Docs) with:
- Complete formatting toolbar (Bold, Italic, Tables, Images, Headings, Bullet lists, Code blocks)
- DOCX import — paste in your existing Word policy documents
- **Right-side metadata panel:** Status, Tags, Next review date, Policy owner, Assigned reviewers

### 19 AI Governance Tags
Assign tags to categorize policies: AI ethics, Fairness, Transparency, Explainability, Bias mitigation, Privacy, Data governance, Model risk, Accountability, Security, LLM, Human oversight, EU AI Act, ISO 42001, NIST RMF, Red teaming, Audit, Monitoring, Vendor management

## The Approval Workflow
```
[Draft] → "Request Review" → [Under Review] → Reviewer Approves → [Approved] → Publish
                                                     ↓ Rejects ↓
                                              [back to Draft + rejection comment]
```

## Linking Policies to Compliance
Each policy can be linked to:
- **Controls** — "This policy satisfies ISO 42001 Clause 6.1"
- **Risks** — "This policy mitigates Risk #14"
- **Evidence** — "This policy is supported by this audit report"

This traceability chain is what auditors look for.

## Export
Export any policy to **PDF** or **DOCX** — branded, ready for regulatory submission.

## Why It Matters for the Demo
> *"Your ISO 42001 certification audit will ask: show me your AI Risk Management Policy. Instead of finding a 2-year-old Word document on a SharePoint drive, you open the Policy Manager. There's the policy, currently in 'Approved' status, reviewed last month by the CISO, next review date is Q3. It has 3 linked controls showing exactly which ISO 42001 requirements it satisfies. One click exports it as a branded PDF. That is audit-ready governance."*

---

# MODULE 12: Training Registry

**Route:** `/training-registry` (accessible from sidebar as "Training registry")  
**Purpose:** Track AI literacy and governance training programs across the organization

## The Compliance Requirement
**EU AI Act Article 4** requires organizations to take measures to ensure sufficient AI literacy. **ISO 42001** requires documented training programs. You need to prove: who was trained, on what, when, and by whom.

## What It Shows — 2 Tabs

### Tab 1: Trainings
Table: Training name | Duration | Provider | Department | Status | Number of people | Actions

**3 Statuses:**
- **Planned (0%)** — scheduled but not started
- **In Progress (50%)** — currently running
- **Completed (100%)** — finished, headcount locked

### Tab 2: Evidence Hub (Training scope)
Evidence documents linked to training programs:
Training completion certificates | Attendance records | Training materials | Assessment results

## Business Rules (Important for the Demo)
- Once a training is **Completed**, you cannot reduce the participant count — ensures the record is an accurate audit trail, not editable retrospective data
- You cannot revert "Completed" back to "Planned"
- Evidence documents have an **expiry date** — certificates that are about to lapse appear in the Dashboard's highlighted files section

## Department-Level Tracking
By adding Department to each training, you get coverage reporting:
- "Legal team: 100% trained in EU AI Act"
- "Engineering team: 60% trained in AI Safety"
- "Management: 100% completed AI Ethics awareness"

## Why It Matters for the Demo
> *"Regulators under EU AI Act don't just want to know your AI is compliant — they want to know your people are AI literate. Here you track every training program. Legal team completed 'EU AI Act for Business Owners' training — 24 people, 4 hours, external provider, completed last quarter. The certificate is attached. If the cert expires in 30 days, the dashboard flags it. This is your auditable proof of organizational AI literacy."*

---

# MODULE 13: Evidence Hub

**Route:** Accessible within Model Inventory (Tab 4) and Training Registry (Tab 2)  
**Purpose:** The compliance evidence vault — collect, organize, and track all governance documentation

## What It Shows

Table: Evidence name | Type | Mapped models/trainings | Uploaded by | Uploaded date | Expiry date

## 15 Evidence Types (Mapped to EU AI Act Annex IV)

| # | Evidence Type | Regulatory Mapping |
|---|---|---|
| 1 | Model Card | EU AI Act Article 13 (Transparency) |
| 2 | Risk Assessment Report | EU AI Act Article 9 |
| 3 | Bias and Fairness Report | EU AI Act Article 10 |
| 4 | Security Assessment Report | EU AI Act Article 15 |
| 5 | Data Protection Impact Assessment | GDPR Article 35 |
| 6 | Robustness and Stress Test Report | EU AI Act Article 15 |
| 7 | Evaluation Metrics Summary | EU AI Act Article 9 |
| 8 | Human Oversight Plan | EU AI Act Article 14 |
| 9 | Post-Market Monitoring Plan | EU AI Act Article 72 |
| 10 | Version Change Log | EU AI Act Article 12 |
| 11 | Third-Party Audit Report | ISO 42001 Audit |
| 12 | Conformity Assessment Report | EU AI Act Annex VI |
| 13 | Technical File / CE Documentation | EU AI Act Annex IV |
| 14 | Vendor Model Documentation | Article 28 |
| 15 | Internal Approval Record | ISO 42001 |

## Document Review Workflow
Every evidence document has a review status:
**Draft → Pending Review → Approved → Expired**

Documents approaching expiry appear in the **Dashboard "Files needing attention" section**.

## File Access Logging
Every time someone views or downloads a compliance document, it's logged: who, when, what. This is your **chain of custody** — auditors can verify the document's integrity and access history.

## Linking Evidence to Multiple Entities
One evidence document can link to multiple models, training programs, policies, and compliance controls simultaneously — no duplication, full traceability.

## Why It Matters for the Demo
> *"Think of this as your compliance evidence vault. Your Risk Assessment Report is uploaded here, linked to the Fraud Detection Model, linked to the EU AI Act compliance controls it satisfies, and linked to the 'AI Risk Management' policy. When your auditor asks for Annex IV technical documentation, you don't hunt through email attachments — you filter by model, filter by evidence type, and download everything in seconds. Every document has an expiry date, so you never miss a certification renewal."*

---

# MODULE 14: Incident Management

**Route:** `/ai-incident-management`  
**Purpose:** EU AI Act Article 73 serious incident reporting — track, investigate, and report AI incidents

## The Legal Requirement
**EU AI Act Article 73** requires providers and deployers of High-Risk AI systems to **report serious incidents** to market surveillance authorities. This is not optional. Failure to report a serious incident is a regulatory violation.

## What It Shows

**4 Lifecycle status cards:** Open | Investigating | Mitigated | Closed

Table: Incident ID (INC-XXXX) | AI Project | Type | Severity | Status | Occurred Date | Approved By | Actions

## 7 Incident Types
Malfunction | Unexpected behavior | Model drift | Misuse | Data corruption | Security breach | Performance degradation

## 3 Severity Levels
- **Minor** — limited impact, no regulatory reporting required
- **Serious** — significant impact, regulatory reporting may be required
- **Very Serious** — major harm, EU AI Act Article 73 reporting obligation triggered

## What Gets Captured (4-Section Form)

### Section 1: Incident Information
AI project | Type | Severity | Status | Occurred date | Date detected | Reporter name | Model/system version

### Section 2: Impact Assessment
**Categories of harm** (multi-select — directly maps to EU AI Act Article 9 harm categories):
- Health
- Safety
- Fundamental Rights
- Property
- Environment
- Financial Impact
- Customer Trust / Reputation
- Fairness / Ethical Concerns

Affected persons/groups | Incident description | Relationship/causality analysis

### Section 3: Response and Actions
Immediate mitigations taken | Planned corrective actions

### Section 4: Approval and Reporting
Approval status (Pending / Approved / Rejected / Not required) | Approved by | Approval date | Approval notes | **Interim report toggle** (for ongoing incidents requiring periodic updates)

## CE Marking Integration
Serious incidents can be linked directly to **CE Marking** conformity records — the connection between incident reporting and regulatory filing, all in one system.

## Why It Matters for the Demo
> *"Your fraud detection AI misclassified 800 loan applications last Tuesday. Under EU AI Act Article 73 you must report this. You open Incident Management, create INC-0047, mark it as 'Serious', select 'Malfunction' as the type, check 'Fundamental Rights' and 'Financial Impact' as harm categories. You document the immediate mitigation — model rolled back to previous version. The incident goes through your internal approval workflow. The whole record — what happened, when, who decided what, what was done — is captured immutably. This is your regulatory filing trail."*

---

# MODULE 15: Reporting

**Route:** `/reporting`  
**Purpose:** Generate board-ready, regulator-ready compliance reports in PDF or DOCX — with your branding

## What It Shows

A list of all previously generated reports: Report name | Type | Project/Organization | Date generated | Generated by | Download | Delete

## Generating a Report

### Step 1: Scope
Choose between:
- **Use Case Report** — for a specific AI system
- **Organization Report** — across all AI systems and the entire governance posture

### Step 2: Framework
Select which framework to report against: EU AI Act | ISO 42001 | ISO 27001 | NIST AI RMF

### Step 3: Section Selection
Choose which data to include, organized in 3 groups:

**Risk Analysis:** Use Case Risks | Vendor Risks | Model Risks

**Compliance & Governance:** Compliance Controls (EU AI Act) | Assessment Tracker | ISO Clauses & Annexes | NIST Subcategories

**Organization:** AI Models | Vendors | Training Registry | Policy Manager | Incident Management

### Step 4: Branding
- Organization name and logo (uploaded)
- Primary color (default: Parkar green)
- Secondary color

### Step 5: Format
- **PDF** (via headless Chromium) — non-editable, for regulators and auditors
- **DOCX** (native Word) — for internal stakeholders who need to annotate

The report is generated in seconds, stored in the platform, and available for download at any time.

## What the Report Contains
- Professional cover page with your logo and branding
- Table of contents
- Risk distribution charts (SVG-embedded horizontal bar charts and donuts)
- Compliance progress tables
- Framework control status tables
- Summary metrics with executive highlights
- Evidence references

## Why It Matters for the Demo
> *"Your board asks for a quarterly AI governance update. You click Generate Report, select Organization scope, EU AI Act framework, select all sections, upload your logo, choose your brand colors, click Generate — 15 seconds later you have a 40-page branded PDF. Your CISO submits it to the board. Your legal team submits a version to the regulator. No consultant, no PowerPoint, no manual data collection. Your governance data is already in the system — reporting is just one click."*

---

# MODULE 16: AI Trust Center

**Route:** `/ai-trust-centre` (admin) | `/aiTrustCentre/:tenantHash` (public)  
**Purpose:** Your public-facing AI transparency page — show customers, partners, and regulators how responsibly you use AI

## The Concept

The AI Trust Center is a **public-facing webpage** that your organization publishes to demonstrate AI governance transparency. It's your equivalent of a security trust center (like Stripe's trust.stripe.com) but specifically for AI governance.

Every organization gets a **unique, shareable URL** — no authentication required for visitors.

## What the Public Page Shows (3 Tabs)

### Tab 1: Overview
- Your AI governance mission statement
- Your AI ethics statement
- **Compliance badges** (up to 8): SOC 2 Type I, SOC 2 Type II, ISO 27001, ISO 42001, CCPA, GDPR, HIPAA, EU AI Act
- Company background and core values

### Tab 2: Resources
- Downloadable compliance documents (AI Ethics Policy PDF, Bias Assessment Summary, Conformity Declaration)
- Per-resource visibility control — you decide what to make public

### Tab 3: Subprocessors
- A complete list of third-party vendors/services that process data on your behalf
- Company name | Purpose | Location | Website
- Required for GDPR Article 28 transparency

## Admin Configuration Interface — 4 Tabs

### Tab 1: Overview
Toggle each section on/off, edit mission statement, select compliance badges

### Tab 2: Resources
Upload PDFs, set visibility per document (published or hidden from public view)

### Tab 3: Subprocessors
Add, edit, delete subprocessor entries

### Tab 4: Settings
- Upload your company logo
- Set header color (brand your trust center)
- Set trust center title
- **Published / Unpublished toggle** — the page is invisible until you explicitly publish it

## Why It Matters for the Demo
> *"When your enterprise customer's procurement team is evaluating you, they ask: 'How do you govern your AI? Are you GDPR compliant? What AI systems are you using that touch our data?' Instead of sending a questionnaire back and forth, you send them this link. They see your ISO 42001 badge, they download your AI Ethics Policy, they check your subprocessor list. Transparency becomes a competitive advantage — it accelerates enterprise deals. And it's fully branded with your logo and colors, not Parkar's."*

---

# The Demo Narrative — Putting It All Together

## The Story to Tell

> *"Imagine you're the Chief AI Officer at a bank. You're deploying an AI-powered loan approval system. Under EU AI Act, that's a High-Risk AI system. What do you need to prove?"*

**Walk through this sequence:**

### 1. Register the AI System (2 minutes)
- Go to **Use Cases** → "New use case"
- Name: "Loan Approval AI"
- Risk classification: **High Risk** (EU AI Act Article 6 — creditworthiness assessment)
- Role: **Deployer**
- Frameworks: EU AI Act ✓, ISO 42001 ✓
- Show the auto-generated **UC-1** identifier

### 2. Register the Model (2 minutes)
- Go to **Model Inventory** → "Add new model"
- Provider: OpenAI | Model: GPT-4o | Version: 2024-11
- Upload the **Security Assessment** document
- Status: **Pending** → set to **Approved** after review
- Link to Use Case: "Loan Approval AI"

### 3. Document the Training Data (1 minute)
- Go to **Datasets** → "Add new dataset"
- Name: "Customer Transaction History 2019-2024"
- Type: Training | Classification: **Restricted** | Contains PII: **Yes**
- Link to the GPT-4o model

### 4. Discover All Agents (1 minute)
- Go to **Agent Discovery** → click "Sync now"
- Show: 3 agents discovered from Azure AI Foundry
- Review the loan processing agent: permissions = `ai:invoke`, `data:read`
- Click **Confirm** | Link to the GPT-4o model in inventory

### 5. Map Compliance Controls (3 minutes)
- Go to **Frameworks** → Requirements & Controls → EU AI Act
- Show: Article 9 (Risk Management), Article 10 (Data Governance), Article 13 (Transparency), Article 14 (Human Oversight)
- Update Article 10 status to **In Progress**, assign owner, attach the dataset record as evidence
- Show compliance progress % increase in real-time

### 6. Add Risks (2 minutes)
- Go to **Risk Management** → "Import from IBM AI Risk Database"
- Search "bias" → select "Demographic bias in training data" and "Historical bias amplification"
- Save both risks with owner assigned and target date set
- Show risk level auto-calculation: Severity 4 (Major) × 3 + Likelihood 3 = **15 (High)**

### 7. Assess the Model Vendor (1 minute)
- Go to **Vendors** → "Add vendor"
- Name: OpenAI | Data Sensitivity: PII | Criticality: High | Regulatory Exposure: EU AI Act
- Show the **scorecard auto-calculating**
- Add a vendor risk: "Data residency — EU customer data processed outside EU"

### 8. Write a Policy (1 minute)
- Go to **Policy Manager** → Templates → "AI Risk Management Policy"
- Show the pre-filled template with EU AI Act tags
- Click "Request Review" → status moves to Under Review

### 9. Handle an Incident (1 minute)
- Go to **Incident Management** → "Add new incident"
- Type: Model drift | Severity: Serious | Harm: Financial Impact, Fundamental Rights
- Show INC-0001 auto-generated
- Status: Open → Investigating → Mitigated

### 10. Generate the Audit Report (1 minute)
- Go to **Reporting** → "Generate Report"
- Scope: Use Case — "Loan Approval AI"
- Framework: EU AI Act | All sections selected
- Upload bank logo, set brand color
- Click Generate → **30 seconds → 40-page branded PDF**
- Show the regulator-ready output

### 11. Publish the Trust Center (1 minute)
- Go to **AI Trust Center** → Settings → Toggle Published
- Select EU AI Act compliance badge
- Upload the AI Ethics Policy as a resource
- Show the **public URL** — no login required
- *"This is what you send to your enterprise customers."*

---

## Key Differentiators to Emphasize

| Feature | Why It Wins Deals |
|---|---|
| **IBM + MIT Risk Databases** | No blank-sheet risk assessment — 100+ curated AI risks ready to import |
| **Agent Discovery** | Solves shadow AI — auto-discovers agents across Azure, AWS, custom sources |
| **One-Click PDF Reports** | Board + regulator ready in 30 seconds, fully branded |
| **Public AI Trust Center** | Transparent, shareable URL — a competitive differentiator in enterprise sales |
| **EU AI Act Native** | Built from the ground up for EU AI Act Article mapping, not retrofitted |
| **GovernanceOS AI** | AI advisor that detects compliance gaps and auto-creates remediation tasks |
| **Multi-Framework** | ISO 42001, ISO 27001, NIST AI RMF, SOC 2, GDPR, HIPAA — all in one platform |
| **Full Audit Trail** | Every field change, every approval, every access — immutable change history |
| **Plugin Marketplace** | 30+ plugins for extending framework coverage and integrations |

---

## Regulatory Frameworks Covered

| Regulation | Coverage in Platform |
|---|---|
| **EU AI Act** | Per-use-case compliance controls, incident reporting (Article 73), technical documentation (Annex IV), human oversight (Article 14), data governance (Article 10), transparency (Article 13) |
| **ISO 42001** | All Clauses and Annexes, organizational project, control assignments |
| **ISO 27001** | All Clauses and Annexes, integrated alongside AI governance |
| **NIST AI RMF** | All 4 functions: Govern, Map, Measure, Manage — all subcategories |
| **GDPR** | Data Protection Impact Assessment evidence type, subprocessor transparency in Trust Center, PII tracking in Datasets |
| **SOC 2** | Available via plugin |
| **HIPAA** | Health data classification in Vendors/Datasets, compliance badge in Trust Center |
| **CCPA** | PII classification, regulatory exposure tracking in Vendors |

---

*Last updated: 2026-06-12 | Generated from live codebase exploration*
