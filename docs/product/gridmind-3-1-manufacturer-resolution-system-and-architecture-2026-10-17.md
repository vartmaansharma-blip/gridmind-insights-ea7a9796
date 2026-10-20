# GridMind 3.1 — Manufacturer Resolution System / Product Architecture

> **Current authority — 20 October 2026:** [Master Plan §7](../gridmind-master-plan-2026-10-11.md) and [G31-C20-01–08](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md#canonical-consolidation-decisions-20-october-2026) supersede older priorities, calendar targets, route/status statements and M1-only queues here. No number-one commercial opportunity is approved; the premature quality-loss ranking is withdrawn. Preserve earlier technical evidence, synthetic-build authorizations and release safeguards. Current routes are public `/` and application `/dashboard`; #136/#149/#153 are merged. #154/#156/#158/#160/#162 remain drafts; #150 is open/behind main at this audit. This document is supporting guidance, not another plan.

**Implementation/release-status correction, 18 October 2026:** PR #140 (industrial intelligence research), PR #142 (synthetic Resolve triage) and PR #136 (strategy-document integration) were merged, without enabling a real R1/R2/R3 professional engine, production case storage or any live bill calculator. Later detailed examples remain design proposals unless checked against the current `src/` and Supabase schema. The [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) controls final status.

**Date:** 17 October 2026 · **Class:** Supporting product and solution architecture, **not an implementation claim**, separate roadmap, new brand, or authorization to ship. The user's term “SOAP plan” is interpreted here as a comprehensive **Service–Operations–Architecture–Payments** operating design (a working shorthand, not the SOAP XML network protocol). “Redmind” has not been approved as a GridMind brand rename.  
**Strategic authority:** [sole Master Plan](../gridmind-master-plan-2026-10-11.md), [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), [sole Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md). Read [100-problem Research Atlas](../research/gridmind-100-manufacturing-problem-opportunity-atlas-2026-10-17.md) as testable taxonomy, and [Commercial & Payment SOP](../operations/gridmind-3-1-service-sop-commercial-and-payment-blueprint-2026-10-17.md) for future business operations.

## 1. Customer job to be done and product promise

Manufacturers rarely lack data or software altogether. They may lack a trusted and timely **cross-functional resolution of a costly exception** when sources conflict, cause is uncertain, economic consequences are disputed, and responsibility is fragmented. GridMind proposes to reduce time-to-_defensible decision_, not claim magical operational diagnosis or substitute for an established ERP, QMS, CMMS, accountant, approved energy auditor, safety professional, counsel or payment processor.

**North-star case:** “What happened? What sources can actually prove? What remains unknown? Which domain expert must decide? Who owns the customer-approved action? Did follow-up evidence demonstrate the intended outcome?” This is an outcome hypothesis, not a validated customer claim.

**Scope tiers:** 100 **recognized problem hypotheses** (10 categories) → three R1/R2/R3 discovery interviews → **one** validated paid method → conditionally reusable platform components → future specializations after proof. Do not build 100 engines.

## 2. Users and purchasing circumstances

| Role                           | Need                                                       | Allowed UI/rights                                                                          |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Anonymous industrial visitor   | Understand credible scope and limitations                  | Public /website, fictional example, non-confidential contact only                          |
| Factory owner / economic buyer | Case economics, decisions, delivery status                 | Own authorized cases and released briefs; no internal reviewer dissent/pricing internals   |
| Quality or production champion | Historical failure/inspection/corrective-action links      | Scoped factory/case evidence and approved assigned actions                                 |
| Commercial/accounts sponsor    | Acceptance/invoice documentary blockers                    | Authorized R2 case scope only; no access to unrelated payroll, treasury or client payments |
| Plant energy sponsor           | Contract/bill anomaly review                               | R3 scoped tariff/bill evidence after permission and qualified review                       |
| GridMind investigator          | Observations, questions, source quality and draft findings | Only assigned, permissioned cases; cannot independently certify own findings               |
| Independent qualified reviewer | Frozen revision and competence-limited judgment            | Assigned source/revision; deny publish or technical signoff beyond scope                   |
| GridMind manager / finance     | Customer deliverables, workload and GridMind invoices      | Need-to-know permissions; billing ledger separate from technical sources                   |
| Administrator / DevOps         | Identity, availability, incident response and migrations   | No routine entitlement to customer trade secrets based merely on admin access              |

**Authorization:** authenticated principal × organization × factory × case assignment × role × source purpose/consent × frozen revision; server-side checks and RLS both required. UI-hidden controls are NOT security.

## 3. The seven logical product modules

1. **Public narrative and research contact** — source: existing Lovable-connected `/website`. Signature brand green `#9ADD00` preserved, compelling motion with accessibility/reduced-motion, fictional case demo, honest status, actual non-confidential recipient and privacy/consent. No checkout; root `/` retains current dashboard until separately tested root migration.
2. **Resolve case workbench** — case question and owner; R1/R2/R3 as _candidate tags_; intake scope, state and evidence requests; no automated diagnosis solely by candidate name.
3. **Evidence/provenance layer** — signed scope, permitted sources, immutable/versioned documents or references, checksum, origin, collection method, event time, timezone, units, contradicting evidence and retention. Closed by default without customer data custody clearance.
4. **Observation and hypothesis engine** — deterministic parsers and calculations per **chosen/verified** method; source-to-claim links; missingness/uncertainty labels; unresolved competing explanations. Generative AI may summarize permitted text or propose _questions_, not make technical fact claims without source/reviewer.
5. **Human review and resolution workflow** — qualified reviewer assignment, frozen-revision signoff/rejection, dissent, customer-approved action, action owner, reminders and effectiveness check. No synthetic simulation masquerading as a real signature.
6. **Customer, team and economics views** — released briefs, next decisions, outcomes; internal case queue, contributor work/costs, client delivery status, _GridMind's own_ billing status via authorized finance workflow. No cross-tenant cost exposure.
7. **Future integration adapters** — read-only and consented ERP/QMS/accounting exports, specialist test results and, _only if needed and safe_, process telemetry. No factory controller, OT command, autonomous maintenance, payment custody or cross-supplier pooled access.

**Architecture rule:** modules 2–5 are a shared **case core**. Domain “methods” are separately reviewed plugins with proof of specialized requirements; vendor integrations should be adapters, not the center of the product.

## 4. Canonical objects and proof obligations (schema proposal, NOT migration DDL)

| Object                                                 | Must capture                                                           | Core invariant                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Organization`, `Factory`, `CaseGrant`                 | legal/customer organization, factory scope, role/assignment            | cross-tenant deny, least privilege                             |
| `OpportunityCandidate`                                 | ID R1/R2/R3, evidence _status_, not promise                            | speculative catalogue is not paid service                      |
| `InvestigationCase`                                    | bounded question, event/window, scope, owner, lifecycle                | case not proof of cause/value                                  |
| `ConsentScope`                                         | authority, purpose, sources, allowed processing, withdrawal, expiry    | no source processing outside accepted scope                    |
| `EvidenceSource` / `EvidenceRevision`                  | checksum, chain of custody, origin, timestamps, permissions            | immutable referenced revision; real data gated                 |
| `Observation`                                          | exact source and transformation, unit, uncertainty, status             | not diagnosis or “verified savings”                            |
| `Hypothesis`                                           | supporting and disconfirming observations, unanswered tests            | cannot silently be promoted into observation                   |
| `ReviewDecision`                                       | professional competence, revision hash, reviewer/independence, dissent | own work cannot self-certify where independent review required |
| `ResolutionBrief`                                      | fact vs unknown vs alternative; approved customer projection           | no release on stale/failing review                             |
| `CustomerDecision` & `ActionTask`                      | customer approver, permitted recommendation, owner, due date           | action is not autonomous plant control                         |
| `OutcomeAssessment`                                    | comparator, baseline, timeframe, counterfactual limitations, costs     | estimate and verified realized improvement remain distinct     |
| `ServiceAgreement` / `BillingInvoice` / `PaymentEvent` | lawful GridMind fee terms, settlement and accounting trace             | isolated from factory receivables; no live payment now         |
| `AuditEvent`                                           | actor/time/purpose/decision/revision                                   | append-only, no retroactive invisible rewrite                  |

Case state model (proposed): **request → fit screened → commercial/legal scope accepted → evidence authorized → evidence incomplete/ready → investigator draft → qualified review pending/approved/rejected → customer decision pending/recorded → follow-up → outcome verified / inconclusive / referred / closed.** Deny skipping authorization; evidence revision after review invalidates dependent approvals; customer decision is separate from reviewer opinion; closed never automatically means savings.

## 5. Domain method contracts — not just enum expansion

**R1/C2 quality + directly related C1 production:**

- Input candidates: customer rejection notice, part revision, batch/lot, approved inspection summaries, relevant production/shift incidents, prior CAPA and verifiable action windows; do not require unrelated employee personal data.
- Computation: chronology, repeat-event comparison, missing source checklist, scrapped/reworked units × **documented incremental cost assumptions**; optional SPC/MSA only by qualified method.
- Output: quality evidence brief and method-specific uncertainties; qualified review aligned with existing APQP/PPAP/FMEA/8D practices when appropriate. **Not** automatic PPAP/quality certification or root-cause guarantee.

**R2/C6 acceptance and invoice documentary exception:**

- Input candidates: PO/version, dispatch, delivery confirmation, acceptance notice, quality claim, agreed deduction basis, invoiced amount, credit note, owner-authorized correspondence.
- Computation: expected versus observed dates/quantities, document consistency, open acceptance steps and commercial signoff; never treat full outstanding receivable as GridMind impact.
- Output: documentation gap map, action owner, response pack. No legal representation, financing, payment processing or promise to collect an invoice.

**R3/C4 electricity bill/contract exposure:**

- Input candidates: disclosed tariff class and contract, permitted electricity bill periods, demand/power-factor line items, change dates, optionally production context.
- Computation: transparent line-item comparisons, anomaly screening, explicit tariff-version uncertainty and confounders.
- Output: reviewer-ready anomaly and clarification report. No physical audit, unsafe electrical testing, energy savings warranty or grid control.

**C3/C5 and remaining 94 themes:** taxonomy tags or contributing evidence as needed, not customer-released automatic methods. Add a method only after buyer, rights, expert cost, acceptance fixture and safety gates.

## 6. On-site first but software-enabled

The initial product is a _service operating system_, where an authorized trained professional can investigate with permission and the customer retains decisions. Start with manual or spreadsheet/CSV-scope evidence mapping on synthetic test cases; do not depend on installation of 20 sensors, new edge hardware, ERP replatforming or telemetry just to discuss a recent quality/invoice exception.

**Illustrative historical case journey**: manufacturing owner discusses rejected components without revealing secrets → scoped fit check → accepted expert-led investigation contract → approved source custody → analyst compiles rejection chronology and contradictory inspection documents → reviewer rejects/accepts specific interpretation → owner authorizes proposed corrective action → follow-up observed → outcome typed verified/inconclusive. If rights or specialist are unavailable, record refusal/referral, not fabricated certainty.

## 7. Present source and routes — do not overclaim

Existing main software: **TanStack Start, React, Vite, Bun, Lovable, Supabase** with a synthetic C1/C4 investigation/analysis history and reviewable client/team screens. The **fictional non-persistent R1/R2/R3 triage** was integrated via merged PR #142, and the GridMind 3.1 documentation consolidation was merged via PR #136. The broader proposed public marketing copy is **not** shipped; [#138](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/138) remains its separate acceptance gate. No connected qualified R1/R2 engine or production customer-data release is established.

**Route preservation:** `/website` public; `/` existing dashboard; `/investigations` fictional discovery/synthetic path; `/cases` authorized customer-facing sample; `/team/intake` and `/team/cases` staff routes. PR #132 proposes a different public-root/onboarding route, but is held separately until exact route, auth, RLS and browser acceptance.

**Deployment/security:** [pre-merge decision packet](../engineering/gridmind-3-1-pre-merge-decision-packet-2026-10-17.md), issue #130 production migration drift and issue #29 populated tenant/authenticated checks remain binding. The same public repo must not contain real factory records; server credentials may not be placed in the browser. No production Supabase mutation from this doc.

## 8. User experience acceptance (fictional case)

| Screen                  | Answers for the user                                 | Required safety/accessibility behaviors                                                                                       |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Public hero             | “What is GridMind and why might I trust its method?” | honest early-stage claims, #9ADD00 signature green, readable mobile contrast, reduced-motion, functional non-confidential CTA |
| Fictional case timeline | “What happened and how do documents connect?”        | prominent fictional banner, provenance graph, unknown states, no false customer endorsement                                   |
| Case overview           | “What is unresolved and who can decide?”             | owner, priority, permission scope, next review, reviewer status, clear timeline                                               |
| Evidence view           | “Can I verify the source of this finding?”           | revision/hash/source/timestamp, no unauthorized downloads or cross-tenant visibility                                          |
| Investigator panel      | “What is observed vs hypothesized?”                  | unresolved contradiction, test/absence, no diagnosis generated from monthly bills                                             |
| Reviewer panel          | “Which frozen version am I signing?”                 | competence and independent assignment; reject/require more evidence                                                           |
| Customer brief          | “What action is recommended and why?”                | released facts/options, explicit bounds and approver action                                                                   |
| Outcome view            | “Did it actually help?”                              | baseline, timing, confounders, measured versus estimated/unknown                                                              |
| Finance view            | “What did GridMind bill and collect?”                | own fee ledger separate from client AR; no live payment integration initially                                                 |

## 9. Test matrix and domain gates

**Synthetic acceptance now:** fictional 10-category selection does not create 100 methods; invalid/missing scope rejected; tenant-role request cannot access other factory; stale reviewer approval invalidated by revision; no automatic “root cause” or “savings”; rejected evidence displayed as unknown; contact only non-confidential; reduced-motion and keyboard path function. Existing C1/C4 tests remain intact.

**Conditional customer/production acceptance:** independently reviewed migrations and populated two-tenant auth, data agreement, source custody, security logs, reviewer competence, customer approval and legally authorized operating arrangement; real case handled retrospectively under named oversight; no equipment control. A passing CI/build or green Vercel deployment is not customer-ready.

**Commercial acceptance:** actual recent customer pain, paid next step, reviewed real economics and repeat need from buyer tracker; no use of fictional invoice as proof of cash recovery.

## 9A. Industrial intelligence competitor learning — product-contract addendum (18 Oct 2026)

**Primary mapping:** [competitor learning register](../research/gridmind-industrial-intelligence-competitor-learnings-2026-10-18.md) CL-01–CL-12. These principles refine acceptance, not authorize implementation. [R3 tariff/bill screening method and twelve negative fixtures](gridmind-r3-electricity-screening-method-and-test-fixtures-2026-10-18.md) is the proposed first research method **subject to professional approval**.

- **Source-first search (CADDi lesson):** source, owner, collection purpose, company/site, date/effective period, revision, original units and permission precede synthesis. No source or conflicting sources → explain why inconclusive.
- **Insight-to-execution (Arch lesson):** every case has a named reviewer, customer approver, authorized action owner, follow-up observation window, and verified / unverified / inconclusive classification. A report or closed task is not automatically verified value.
- **Shared core, bounded domain methods (Noetive lesson):** R1 quality, R2 acceptance/invoice, R3 billing have independently reviewed required sources/calculations; a common enum is NOT enough. R3 first in discovery only; R2 comparator remains mandatory.
- **Deterministic-before-generative (Siemens lesson):** tariff bill arithmetic uses date-specific professional rules and typed units. AI cannot fill missing parameters or invent a savings forecast; one state must be “need qualified review.”
- **Future topology and physical constraints (Neara/GE lesson):** note architectural possibility for future approved infrastructure models; no network graph, simulation or OT-control implementation in current MVP.
- **Adapt rather than replace (incumbents):** prefer read-only/manual authorized records and exported CSV; integration is conditional on actual buyer need and independently tested security.
- **Acceptance:** synthetic correct/invalid/inconclusive/adversarial cases, reviewer revision integrity, tenant negative checks; no claims of working real R1/R2/R3 technical engine or live professional services from spec edits alone.

## 10. How expansion earns permission

For each additional domain method require: (i) more than an attractive opportunity score—actual buyer access and specific repeated pain; (ii) independent expert/method owner; (iii) minimum auditable sources and permission model; (iv) valid test fixtures and negative controls; (v) priced delivery with collected cash and sustainable contribution; (vi) release approval and reversal plan. The fact that two domains share a table does not mean their regulated actions share an approval.

**Out-of-scope unless separately validated/authorized:** full ERP/QMS/CMMS, supplier marketplace, autonomous plant controller, OT cyber penetration testing, regulated receivables finance, lawyer/certifier substitution, digital payment aggregation, grid/BESS dispatch or a universal AI agent.

**Research/competitor references:** [AIAG Quality Core Tools](https://www.aiag.org/expertise-areas/quality/quality-core-tools), [NIST MEP Supply Chain](https://www.nist.gov/mep/supply-chain), [Odoo Quality](https://www.odoo.com/app/quality-features), [Zoho Books](https://www.zoho.com/in/books/pricing/), [BEE MSME energy programmes](https://saathee.beeindia.gov.in/sme-programme/). Existing providers' products are real; GridMind's superiority remains unproven.
