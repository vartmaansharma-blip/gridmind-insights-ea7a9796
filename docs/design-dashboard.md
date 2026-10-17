# GridMind — Dashboard Design Specification (DesignDashboard)

**Version:** 1.0 · **Recorded:** 2026-10-15 · **Classification:** Supporting future-state design reference, **not** execution authority  
**Status:** Architecture and UX proposal; not implemented or customer-validated.  
**Document owner:** GridMind product/design. **Change reference:** [Issue #86](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/86).

> **Authority and scope:** The [canonical Master Plan](gridmind-master-plan-2026-10-11.md) alone determines active work; the [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) alone records live access/discovery, and the [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) governs guardrails and decision changes. D7 freezes speculative modules and feature PRs through the **2026-11-10** gate except necessary correctness, infrastructure, security, and safety fixes. This document captures design discussion **without altering that freeze** or adding a second implementation queue. The founder requested its preservation, not immediate feature deployment.

## 1. Product thesis and assessment

**Present positioning hypothesis:** GridMind is an evidence-first, human-reviewed industrial investigation service helping a manufacturer answer **one consequential operating question** with authorized records, explicit uncertainty, a reviewable conclusion, a bounded next action, and—if an intervention occurs—a measured or explicitly inconclusive outcome. The initial commercial wedge is **unselected**; C1 downtime/production loss and C4 energy/resource inefficiency remain discovery probes in Jamshedpur–Adityapur.

**Long-term destination:** A trusted industrial intelligence and value-realization system linking context → evidence → investigation → qualified review → customer decision → approved intervention → verification → retained learning. A dashboard is one interface to this work, **not the core product**.

**Assessment of earlier multi-company design:** Qualitative ~**7.2/10**: strong long-term vision and evidence architecture, but excessive near-term breadth, weak customer delivery emphasis, unproven complex multi-company needs and the risk of generic KPI/map designs. **Revised specification target ~9/10 (design aspiration, not empirically measured)** by separating execution stages, elevating the investigation object, and preserving real service delivery.

**Five corrections:** (1) commercial/discovery vs technical case work are separate but linked; (2) investigation, not machine/chart or company directory, is the core decision object; (3) one shared case lifecycle; (4) on-site human delivery and reviewed briefs work even without frequent customer logins; (5) expand only at demonstrated evidence gates.

## 2. Three experiences, one governed evidence model

| Experience | Intended user | Primary job | Boundary |
|---|---|---|---|
| **GridMind Operations — NOW (proposed lightweight internal view)** | Founder, authorized collaborator/reviewer | Keep discovery, readiness, scoped investigations and next actions organized | No assumed customer portfolio, no new module during D7 freeze |
| **GridMind Headquarters — FUTURE** | Authorized internal operations, analysts, reviewers, account owners and leadership | Coordinate many companies, sites, engagements, investigations, reviews, assignments and outcomes | Portfolio permissions must be explicitly scoped; employment does not imply unrestricted access |
| **Customer Company Workspace — FUTURE** | Authorized client executives, engineers, plant staff | Understand only their organization's investigations, relevant sites, decisions, actions and outcomes | Tenant-scoped with site/case-level permission as required |
| **Investigation Canvas — SHARED CORE** | Assigned GridMind specialists, reviewers, permitted client decision-makers | Evaluate one question using evidence, alternatives, economics, human decision, action and verification | The same underlying facts, role-specific presentation |

Marketing homepage and Discovery Lab are separate from daily operations. Cinematic marketing motion is not an operating-dashboard pattern.

## 3. BUILD/OPERATE NOW: minimal useful operating workflow

**Current truth (as recorded in Master Plan updated 2026-10-13, recheck before use):** No confirmed customer conversations, buyer next steps, authorized customer data or qualified reviewer; C1 and C4 are probes; no proven revenue, pilot or verified savings. ASIA public-route inquiry was sent 2026-10-12 without confirmed response at that snapshot. D8 targets >=3 substantive conversations and >=1 explicit buyer next step by 2026-10-31; GO TO BOUNDED TEST / NARROW / PIVOT / STOP gate 2026-11-10. These are goals, not achieved results.

**NOW Overview: five lightweight concepts** (use existing canonical documents/tools during freeze rather than implement all five as software):

| Component | Exact user job | Minimum fields / output | Must not imply |
|---|---|---|---|
| **Today's priorities** | Know the next few valuable actions | Action, owner, due/next review, blocker, status, source | Automated priorities or customer work without records |
| **Discovery status** | Track access to buyer and actual pain | Prospect/role, introduction route, conversation status, problem statement, evidence class, next action; link to canonical discovery tracker | Prospect = customer, synthetic interview = evidence |
| **Investigation queue** | If and when a bounded case is authorized, keep it traceable | Stable case ID, permissioned company/site, exact question, stage, evidence state, owner, next action, planned deliverable | Unqualified diagnosis or implied production workflow |
| **Evidence & reviewer readiness** | See what prevents a defensible finding | Authorized source availability, provenance, missing input, method, required reviewer, review state | Received = validated, reviewed = verified savings |
| **Product & commercial readiness** | Differentiate technical ability from buyer proof | Buyer access, permission/data feasibility, qualified reviewer, live workflow verification, decision gate, next test | One invented composite readiness score |

**NOW visual hierarchy:** title/context → Today's priorities (primary) → discovery and bounded cases (two compact modules) → evidence/reviewer blockers → milestone/decision gate. Use no geography hero, company logos, charts filled with synthetic growth, or fabricated ROI.

**NOW initial navigation hypothesis:** Overview, Discovery, Investigations, Evidence, Settings. Do not destructively replace current Factory, Energy, Machines, Opportunities, Alerts, Savings routes while still useful. Current energy product includes demo/local screening and canonical records that must remain distinct.

**Now acceptance:** founder can locate a real next action and its evidence; synthetic example is explicitly labelled; no false save/analysis success; authorized data stays out until Tier 2 gates; no second tracker.

## 4. FUTURE Headquarters Overview: detailed information architecture

**Definition:** A permission-aware multi-company operations command centre consolidating relationships, industrial investigations, evidence readiness, assigned responsibilities, decision progress, delivery and verified outcomes across the **authorized** portfolio.

**Primary question:** What needs attention, why, who owns it, and what can be done next?

### 4.1 Global command bar

Persistent selected scope (Headquarters / company / investigation); cross-entity permission-filtered search grouped by company, site, case, documents, personnel and tasks; user role; notification centre; saved views; quick create for permitted record types; scoped filters for company, region, team, workflow, date. Search must never reveal unauthorized company names or record metadata. Keyboard, focus, no-results, loading and query-failure states required.

### 4.2 Portfolio snapshot (compact, secondary)

Six precise counts: **active companies**, **active sites**, **open investigations**, **needs attention**, **awaiting expert review**, **overdue commitments**. Each opens the relevant filtered list. Overlapping categories must be allowed and explained; a failed query is not zero. Reveal selected scope and freshness, and use independently authorized aggregate queries instead of downloading all underlying customer details.

### 4.3 Attention Centre (primary)

Explainable queue for time-sensitive commitments, urgent reported incidents, blocked evidence, review requests, customer decisions, pending verification and unassigned cases.

**Row contract:** priority + why prioritized; organization and site only if permitted; case and exact problem; workflow stage; evidence sufficiency; assigned owner; due date; last meaningful update; *one* valid next action. Separate **severity**, **workflow urgency**, and **readiness**; never replace them with an unexplainable AI score. Selecting a row opens an in-place context inspector without losing filters or scroll position. Failed actions must show errors and preserve retry context.

### 4.4 Investigation pipeline (primary)

Lifecycle: **Intake → Evidence collection → Investigation → Technical review → Customer decision → Approved action → Verification → Closed**. Branches include declined, insufficient evidence, rejected, inconclusive and formally withdrawn. Stage differs from technical conclusion, evidence class, urgency and verification state. Provide stage summary, sortable table, filtered views and optional time-axis view; do not depend on an unwieldy Kanban board at high volume. Every case needs a durable ID, owner, audit history and permitted transitions.

### 4.5 Company portfolio (primary navigation)

Sortable, searchable, paginated index: account name; sector; sites; relationship/engagement state (prospect, discovery, evaluation, approved pilot, active, inactive); open cases; attention; account owner; last meaningful update; next commitment. Separate commercial **Client Account** from security **Organization** and from **Engagement**, **Site**, **Investigation**, and **Asset**. A prospect can exist without a plant-data workspace. Opening a company shows permitted site and engagement context, cases, decisions, actions and delivery history.

### 4.6 Evidence and review readiness

Readiness states: **not received → received/unassessed → validation needed → insufficient evidence / ready for review → reviewed with decision**. These are not savings-verification states. Summarize required sources, provenance, units and time periods, coverage, material exclusions, mapping quality, reviewer identity/qualifications where established, review request/due date, outcome and revision requests. Important gaps remain visible when details collapse. A review queue must separate internal process review from qualified engineering review.

### 4.7 Team, schedule and field delivery

My Work queue; assigned owner, dependent action, deadline, blocked state; workload bottlenecks; customer update commitments; site visits with scope, authorization, attendees, preparation, result and follow-up. Integrate email/calendar only when it eliminates real friction; do not build a substitute messaging platform. Encourage timely, correct work, not crude volume-based staff rankings.

### 4.8 Outcomes, verification and commercial operations

Separate case delivery (review turnaround, completed/reopened cases, blocked cases, outstanding deliverables) from *economic value states* and from GridMind revenue/margin/engagement retention. Value hierarchy: **estimated exposure ≠ potential ≠ expected ≠ implemented ≠ realized ≠ verified**. Each verified outcome requires accepted method, baseline, time window, confounders, attribution, reviewer and authorized access; aggregate across companies only if definitions, permissions, and time horizons make it legitimate.

## 5. Future customer view and shared investigation canvas

**Customer Overview:** Their own authorized sites, open cases, evidence requirements, reviewed findings, decisions, action owners, reports and verified outcomes. Exclude other clients and GridMind's internal leads, team staffing, margins and confidential notes. Executives and engineers may receive different emphases but not contradictory facts.

**Investigation Canvas:** (desktop) left context rail ~20% (site, asset/process, time window, data coverage), central evidence/economics canvas ~55% (observable signal; source → calculation → interpretation; alternatives; bounded economics and limitations), right decision panel ~25% (evidence sufficiency, reviewer, next step, owner, decision/approval, verification plan). Mobile reading order: identity/state → decision/economics → context → evidence/alternatives → action → details → history. The existing [opportunity-workspace prototype spec](gridmind-opportunity-workspace-prototype-v1-2026-10-11.md) is the detailed authority for interaction exploration, not proof of implementation.

**Real-world workflows:** (a) authorized bill question → scoped case → source request → tariff/calculation review → qualified assessment → customer decision → subsequent verification if applicable; (b) multi-case manager filters overdue review/evidence blockers and assigns work; (c) engineer challenges assumptions and records a review outcome. The headquarters queue updates only after server-confirmed writes.

## 6. Data contract, product truth and security

**Candidate domain entities:** ClientAccount; Organization/access boundary; Engagement; Site; System/Asset; Investigation; EvidenceSource; Observation; Finding/Opportunity; Calculation/AnalysisRun; Review; Decision; Task; Intervention; Verification/Outcome; User/Membership; Activity/AuditEvent. Reuse existing Supabase organization, factory, opportunity, intervention, outcome, and analysis-run structures where semantically correct; do not assume every item requires a new table. Handle cross-site cases and organization-specific engagement rights deliberately.

**Case minimum contract:** immutable ID; customer/site scope; exact question and expected decision; consent/permission reference; owner and reviewer; status/stage; observed fact vs calculation vs hypothesis; source IDs and timestamps; method/version and uncertainty; material missing evidence; next action; timestamps; decision history; outcome status.

**Security:** server-enforced tenant isolation, least-privilege membership, role + scope-based authorization for headquarters, permitted site/case, controlled document access and export, audit history, intentional retention/deletion, no confidential data in public GitHub or demo assets. A GridMind staff login must not create blanket technical-data access. External qualified specialists receive limited, revocable access. Test direct URLs, filters, search and exports for cross-tenant leaks.

**Operational truth states:** loading, no records, not run, not connected, insufficient evidence, stale, failed request, synthetic demo, persisted screening, reviewed finding, implemented-unverified, verified/inconclusive. A failed query never renders zero or success. Persisted status changes require authoritative confirmation, retry/recovery and clear failure feedback. Estimates require scopes, units, periods and defensible methods. AI assistance must retain evidence citations and human review; no autonomous plant control.

## 7. UX, layout and visual identity

**Hierarchy:** (1) Attention Centre, (2) selected case context/evidence inspector, (3) company portfolio, (4) workflow pipeline, (5) compact metrics, (6) supporting scheduled work and outcomes. **Suggested desktop:** compact 64px command bar; 224–240px dark graphite sidebar; warm mineral-white work surface; 24px content gutters; primary queue ~65–70% width, inspector ~30–35%; responsive stacked mobile. Use virtual/paginated tables and saved filters at scale; avoid equal-weight cards and giant maps. Map only when field logistics/physical context alters a decision.

**Visual grammar — Clarity Engineered:** warm neutrals, graphite, restrained semantic industrial green/amber/red; legible sans (existing Manrope), considered display (Space Grotesk), tabular/monospaced technical numerals (IBM Plex Mono). Compact cards, clear hierarchy and precise annotations. Avoid neon/glassmorphism excess, fictional customer logos, simulated connected telemetry, speculative savings dashboards, decorative photography, donut-chart wallpaper and permanent animation.

**Meaningful motion:** **Context Snap** highlights the selected case and corresponding site/time frame; **Layer Cut** reveals observed signal → calculation → interpretation → alternative explanations → next evidence/action; **Evidence Fold** expands provenance without hiding crucial caveats. Fast, interruptible, keyboard/touch accessible, reduced-motion safe, never the only conveyance of information. Marketing homepage may be cinematic; daily operations should be calm.

**Wireframe — FUTURE** (placeholder information, no actual customers):

```text
GRIDMIND / HEADQUARTERS     [Search authorized records...] [Scope] [User]
Portfolio overview          [Company ▾] [Team ▾] [Saved view ▾]
[Active companies] [Open cases] [Attention] [Reviews] [Overdue]
┌─ ATTENTION CENTRE (65–70%) ─────────┬─ SELECTED CASE (30–35%) ───────┐
│ Priority | Company | Case | Owner  │ Question / Site / Stage           │
│ Evidence blocker / Review / Due     │ Evidence gaps / Reviewer         │
│ Actionable, sortable queue          │ Next action [Open investigation] │
└─────────────────────────────────────┴─────────────────────────────────┘
Investigation pipeline: Intake → Evidence → Analysis → Review → Decision → Verify
Company portfolio: Company | Sites | Engagement | Cases | Owner | Next action
Upcoming work / site visits         Delivery status / verified outcomes
```

**Wireframe — NOW** (operational concept; no feature commitment):

```text
GRIDMIND / OPERATIONS         [Search] [Account]
TODAY'S PRIORITIES: action | owner | blocker | next milestone
DISCOVERY STATUS                     BOUNDED INVESTIGATIONS
Evidence & reviewer readiness / missing records
Current readiness gates / next legitimate customer-access action
```

## 8. Build-versus-future separation and gates

| Dimension | NOW (operational practice / only authorized fixes) | FUTURE (after evidence gates) |
|---|---|---|
| Goal | Prove accessible, valuable industrial problem | Scaled industrial decision intelligence |
| Primary users | Founder, qualified reviewer as secured | GridMind teams, customers, specialists |
| Core object | Discovery observation → bounded case | Durable investigation with authorized context and outcome |
| HQ overview | Lightweight next actions and readiness using existing records | Multi-company command centre |
| Customer management | Canonical discovery tracker; no duplicate CRM | Client account/engagement portfolio |
| Evidence | Minimal, only after explicit Tier 2 permission and reviewer gates | Versioned permissioned multi-source evidence |
| Analysis | Narrow reviewable test after gates | Validated advanced analytics and approved connectors |
| Delivery | Human-reviewed one-page workflow map / later bounded brief | Repeatable briefs, customer portal and workflow coordination |
| Financial | Case-specific uncertainty and method; no claims | Verified outcomes, separate delivery economics |
| Security | Fix existing auth, RLS, persistence and trust defects | Cross-company scoped roles, audit and portfolio aggregation |
| Map/digital twin/automation | Not needed for discovery | Only when directly supported by customer need and instrumented reality |

**Execution order is conditional, not a second plan:** (0) necessary correctness/security fixes and live readiness verification; (1) Tier 1 buyer problem evidence and Tier 2 permissions/reviewer/baseline; (2) one complete investigation vertical slice; (3) small operations summary and customer delivery experience when work volume justifies; (4) standardized repeated engagements; (5) multi-company HQ, advanced integrations, system explorer and portfolio intelligence only after repeatable paid value. **No speculative feature PRs before 2026-11-10 gate** absent canonical decision change.

## 9. Acceptance gates and falsification

**User/task criteria (proposed, not measured):** identify top action in ~10 seconds; open a known company/case in few navigational steps; explain *why* a case is prioritized; see what evidence is missing; assign or complete allowed action; engineer can reproduce/challenge a calculation; finance can separate estimates from verified outcomes; failed save cannot masquerade as success.

**System states:** zero companies, single company, large portfolio (pagination), unassigned case, insufficient/stale evidence, query error, failed mutation, unauthorized direct URL, demo fixture, inaccessible reviewer, implemented-unverified, closed-inconclusive. Validate desktop/mobile, keyboard, screen-reader labels and reduced motion. Test tenant isolation across two organizations in an isolated approved environment.

**Commercial gates:** do not call UX polish or passing code tests customer validation. Compare against current manual workflow and measure reviewability, elapsed time, corrections/false confidence, buyer adoption, willingness to pay, delivery cost and repeatability. Once a real workflow demonstrates demand, choose the minimum next capability required to deliver it better.

## 10. References, related records and change control

**Design principles (references, not copied templates):**
- [Palantir operational apps](https://www.palantir.com/docs/foundry/app-building/operational-apps) — decision/action workflows.
- [Cognite Industrial Canvas](https://www.cognite.com/en/industrial-canvas) — contextualized evidence.
- [Seeq](https://www.seeq.com/) — reproducible industrial analysis.
- [EnergyCAP](https://www.energycap.com/) — bill/utility review practices, relevant if C4 is selected.
- [AVEVA PI Vision](https://www.aveva.com/en/products/aveva-pi-vision/) — time-series access, not assumed GridMind integration.
- [Linear UI principles](https://linear.app/changelog/2026-03-12-ui-refresh) — coherent, quiet interface.

**Existing internal records to preserve:**
- [Master Plan](gridmind-master-plan-2026-10-11.md) — sole execution plan.
- [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) — live access tracker.
- [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) — decision hierarchy.
- [Future-state design audit](gridmind-future-state-design-audit-phase-1-2026-10-11.md) — historical technical/design snapshot.
- [Opportunity workspace prototype](gridmind-opportunity-workspace-prototype-v1-2026-10-11.md) — detailed interaction hypothesis.
- [Clarity Engineered creative direction](gridmind-creative-direction-clarity-engineered-2026-10-11.md) — creative exploration only.
- [Documentation index](README.md) — current repository map.

**Versioning:** This document is a stable design record, *not* approved scope, customer validation, acceptance evidence or a parallel product roadmap. Any material decision affecting D7, selected wedge, access rights or current priorities must be evaluated and recorded under the Decision Constitution and Master Plan before code work. Update this design document by reviewed amendments with dated rationale; preserve prior context and avoid fictional metrics. No customer data or personal contact records should be committed here.
