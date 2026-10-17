# GridMind Resolve — Domain, UX and Engineering Contract
**Date:** 2026-10-17 · **Class:** Supporting technical specification, not commercial authorization or a second master plan.  
**Authority:** [Canonical Master Plan](gridmind-master-plan-2026-10-11.md) governs sequencing. [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), [Technical Release Gate](release-gate.md) and the live discovery tracker cannot be bypassed by this document.  
**Code truth:** current connected engine supports **C1 and C4 synthetic cases** only. The R1/R2/R3 preview is read-only, synthetic commercial discovery. R1 quality, R2 acceptance/payment, and future R3 tariff methods below are **target contracts**, not implemented features.

## 1. Build one case resolution product, not six application suites
A factory exception is an economically relevant event that an authorized user needs to investigate and act on: rejection of a batch, repeat defect, quality-linked stoppage, disputed acceptance, missing invoice basis, or a bill/contract decision. A single record may link out to an existing ERP/CMMS/QMS document reference, but GridMind is **not the system of record** for inventory, general ledger, payments, payroll, plant control, calibration, approved PPAP records or shipping transactions.

**First paid method:** to be selected by R1/R2/R3 customer evidence. Design reusable primitive case objects now; only implement specialized validators for the selected lane after review.

**North-star interaction:** “What happened → what can be proved → what needs a qualified decision → who is accountable → how will we know it worked?”

## 2. Actors and explicit authorization boundaries
| Actor | May view / do | Must not |
|---|---|---|
| Public visitor | Read accurate positioning and fictional demo without login; request non-confidential contact | Upload confidential factory data or see private cases |
| Prospect / business owner | Request scoped discussion after business approval | View another organization’s data or infer engagement acceptance |
| Customer member | View cases explicitly granted to own org/factory; request/submit records through released secure custody; accept decisions | View reviewer-only cost/dissent or override staff approvals |
| Factory approver | Grant/withdraw scope and approve customer-owned actions within authority | Grant access to third-party supplier records without permission |
| GridMind investigator | Work assigned cases, record facts/hypotheses with provenance | Self-certify independent technical conclusions |
| Independent qualified reviewer | Read assigned frozen revision, review within competence, record acceptance/revision/rejection and dissent | Approve own investigator work if independence requirement applies |
| GridMind manager | Approve scope, assign reviewer, release signed result after policy checks | Alter frozen technical conclusions invisibly or bypass tenant policy |
| Administrator | Maintain accounts, permissions, monitoring | Treat technical access as a right to read customer trade secrets |

Use server-side case/organization permission checks on every operation; navigation-only restrictions are insufficient. Tenant scope = authenticated principal × role × organization × factory × assigned case × consent × revision.

## 3. Canonical domain vocabulary
- **Exception**: one observed or reported problem with ownership and consequence, not an opportunity, fault diagnosis or proof of saving.
- **Case**: bounded investigation around one question, with methods, permissions, time window and versioned state.
- **Source**: original document or account of an event, with source owner, permitted purpose, custody, checksum, retention and provenance.
- **Observation**: what the source directly supports; include event time, timezone/units and uncertainty.
- **Hypothesis**: plausible explanation distinct from a confirmed observation; may have contrary evidence.
- **Finding**: versioned statement citing sources, status and limitations.
- **Review**: a competent human’s revision-bound decision, with scope, rationale, dissent and independence.
- **Brief**: approved customer projection (not raw internal database dump), traceable, versioned and retractable.
- **Corrective action**: approved recommendation converted into customer-controlled ownership, deadline, status and verification.
- **Outcome**: observed result relative to agreed baseline and confounders, not automatic causation or realized financial saving.
- **Case economics**: cost to *GridMind* to deliver versus value to customer, kept separate.
- **Permission**: documented, specific right to use, retain, distribute and delete information for the agreed purpose.

## 4. Case state machine and no-false-completion invariants
~~~text
FICTIONAL DISCOVERY  (synthetic, no customer permissions)
        |
       NO direct transition to paid customer case
        v
REAL REQUEST (after releases) --scope rejected--> CLOSED / DECLINED
        |
ACCEPTED SCOPE + explicit consent + competent staffing
        |
EVIDENCE COLLECTION --> NEEDS EVIDENCE / BLOCKED / WITHDRAWN
        |
VERIFIED SOURCE / RECONCILIATION --> INVESTIGATION
        |
FINDINGS + COUNTEREVIDENCE --> INDEPENDENT REVIEW
        |                                      |
    REVISE / REJECT <---------------------------|
        |
    REVIEW ACCEPTED (frozen hash-bound technical revision)
        |
MANAGER AUTHORIZED RELEASE --> CUSTOMER BRIEF (approved projection)
        |
CUSTOMER DECISION: ACCEPT / DEFER / DECLINE
        |
CUSTOMER-OWNED ACTION (if authorized)
        |
VERIFICATION PERIOD / RESULT / CONFOUNDERS
        |
CLOSED (outcome may be UNKNOWN / UNVERIFIED)
~~~

**Non-negotiable invariants:** no document without permission and secure custody; no review accepted when source conflict or validation blocker remains; review references exact evidence/method revision; revisions invalidate prior publication; no externally visible “verified result” without defined measurement; actions never dispatch to machines automatically; rejected/deferred cases remain auditable; audit events append rather than rewrite history.

A “no issue found” or “insufficient evidence” outcome can be professionally correct.

## 5. Proposed data relations and contracts (not production DDL)
~~~text
Organization(id, display_name, contract_owner)
Factory(id, organization_id, label, legal_data_controller)
Membership(principal_id, organization_id, factory_id, role, status)
Case(id, factory_id, lane_id, scope_version, method_version, status)
Permission(case_id, source_owner, purpose, data_classes, expiry, sharing_policy)
Evidence(id, case_id, owner, provenance, checksum, verification, retention)
Event(id, case_id, source_id, original_time, corrected_time, timezone, event_type)
Finding(id, case_id, kind, source_ids, counterevidence, uncertainty, revision)
Review(id, case_id, revision_hash, qualified_person, independence, decision, rationale, dissent)
PublishedBrief(id, case_id, review_id, release_hash, customer_visible_version)
Action(id, case_id, owner, requested_change, approval, status, verification_criteria)
Outcome(id, case_id, metric, baseline, observed, attribution_limitations, evidence_ids)
CaseCost(id, case_id, labor_role, hours, rate, direct_expenses, payment_state)
Audit(id, actor, case_id, action, revision, time, context)
~~~

Design case lane as a method family, not generic AI fault mode. Document retention/consent may have multiple legal owners. Stable references distinguish buyer, seller, other factories and suppliers. The schema above must be refined by a qualified reviewer and database/security engineer before migration. **No production DDL authorized.**

## 6. Method R1 — Quality rejection with production context (candidate)
**Inputs when authorized:** nonconformance/complaint notice, product/batch identifier, specification version, inspection or test results with calibration context, process/shift records, containment status, prior CAPA/8D results, relevant machine stoppage/maintenance history, supplier material evidence and customer acceptance status. Minimal intake depends on event; do not demand full ERP export.

**Deterministic checks:** IDs and revisions; defect/quantity/unit consistency; timeline order and shifts/timezones; missing approvals; source rights; trace of corrective action to original problem; repeated complaint definitions; evidence that an action was actually taken; measurement window for effectiveness.

**Human tasks:** define the problem; authorize containment/technical investigation; validate any proposed process cause, safety-related or customer-specific compliance conclusion; own corrective action and confirmation of effectiveness.

**Possible output:** affected parts/batches and open questions, source-linked chronology, hypothesis table with supporting/counterevidence, accountable corrective action log, effectiveness check. “Reported correlation” is not “confirmed root cause.”

**Reject:** unsupported guaranteed zero defects, AI-generated process setting, unreviewed 8D approval or formal IATF compliance attestation.

## 7. Method R2 — Acceptance and invoice dispute (candidate)
**Inputs when authorized:** purchase order and revision, dispatch/despatch evidence, receiving acknowledgment, quality acceptance/rejection notice, contractual acceptance criteria, invoice and credit note references, correspondence, milestone and actual payment statuses. Customer must have the right to share commercial records.

**Checks:** dates/timezones and PO/invoice IDs, quantity/price/currency consistency, acceptance status and documentary gap, reconciliation across allowed parties, statutory/contractual claim boundaries flagged for expert—not ruled upon automatically.

**Output:** reconciled document index, disputed vs undisputed components, missing acceptance evidence, responsible action owner and next authorized reconciliation step. **Not** a legal opinion, debt recovery demand, credit decision, automatic invoice enforcement, transfer of funds or buyer fault verdict.

**Important:** payment delays often arise from cash-flow, commercial terms and finance processes unrelated to defects. Do not build the entire company on an assumed quality → payment causal chain.

## 8. Method R3 — Electricity billing and demand exposure (candidate)
**Inputs:** bill pages with applicable connection identifier, billing period, tariff category, contractual demand, period/versioned public tariff order, meter evidence and qualified reviewer context as needed.

**Checks:** applicable tariff dates and categories, measured vs contract demand definitions, units, invoice period overlap, consistent production denominator where intensity is assessed, conflicting sources and missing tariff context.

**Output:** sourced billing observations, open technical questions, expert-checked next steps and explicit “no material issue found” where defensible. No physical electrical safety assessment or automatic savings guarantee.

**Existing code warning:** source includes synthetic C4 intensity calculation, which is **not the same thing as a tariff compliance audit**. Do not represent the engine as having solved contract demand, power factor or tariff classification.

## 9. Evidence handling and AI guardrails
**Input contract:** user, organization, factory, case, source owner, permitted purpose, authenticity category, received time, data type, source checksum, sharing/retention, confidentiality classification, verification actor, known conflicts. Missing permission → reject before storage. Example upload field shown in a demo ≠ approved custody.

**AI controls:** allow drafts and extraction only after permission; bind every extracted number to source span, unit and version; require uncertainty; compare independent calculations; block fabricated citations; treat instructions inside customer documents as data (prompt injection resistance). Do not disclose sensitive text to unapproved model providers or train a cross-customer model absent rights and opt-in.

**Security:** server-side authorization; row-level security and storage rules; encrypted transit/at rest; audit logging; retention and deletion; incident plan; secret handling; isolated staging; backup restore; vendor risk; no AI tool with unfettered access to confidential files.

## 10. Release acceptance and negative tests
| Test | Evidence needed |
|---|---|
| Anonymous visitor | Cannot access case record or upload |
| Customer A / Factory A | Can see only explicit assigned, approved projection |
| Customer A / Factory B | Cannot list, load, infer count, download or mutate |
| Reviewer A on case B | Denied; role and identity are server sourced |
| Source owner revokes consent | New processing stops; retention/delete rules executed and audited |
| Changed source after approval | Previous review and publication invalidated |
| Invalid case provenance | Fail closed, cannot claim customer success |
| AI hallucinated amount/date | Source-bound validation rejects or marks uncertain |
| Conflict/missing source | No approved technical conclusion |
| Duplicate retry | Idempotent, no duplicate cases/payments/evidence |
| Concurrent save | Revision expected match; stale writer receives clear conflict |
| Document contains hostile instructions | Never changes system instructions, roles or approved action |
| Reviewer conflict of interest | Escalate or replace reviewer, record dissent |
| Outcome with confounders | Shows limitations; no net savings automatically asserted |
| Rollback from failed release | Approved prior state restored without untracked leakage |

No “pass” without exact commit, environment, logs/test evidence and authorized review.

## 11. Existing route adaptation map
| Existing route/component | Keep | Next authorized adaptation |
|---|---|---|
| /website / public-site | Cinematic site, signature green, fictional bill | Broad mission and honest first-use-case gate; no fake claims |
| / (dashboard) | Existing factory overview | Eventually feature-gated open cases/action-first top-level summary; do not erase legacy energy demos |
| /factory | Factory selection/profile | Same canonical organization/factory ID |
| /machines, /energy | Historical technical research/demos | Context-only evidence; no automatic diagnosis |
| /investigations | Synthetic C1/C4 workbench | Read-only R1/R2/R3 triage beside it, clearly separated |
| /cases, /cases/$caseId | Customer case projections | Actual customer data only after tenant/release gates |
| /team/intake, /team/cases | Internal scope/review workflow | Reviewer assignment, cost and evidence process with no permission regression |
| /auth | Login/session | Server-decided roles and safe redirect |
| /design-preview | Existing visual experiment | Not a live customer-service promise |

No route migration to root or destructive design refactor in the strategy PR. Future route movement requires SEO/accessibility/mobile smoke and reversible release plan.

## 12. Design requirements and Lovable handoff
- Preserve authentic GridMind green token as signature; it conveys conversation. Do not substitute muted sage for the existing actual brand token.
- Public experience: strong typography, clear cinematic but accessible motion, progressive disclosure, genuine industrial subject imagery with proper rights, fictional interactive worked example, plain-language trust and limits, high-quality mobile.
- Respect reduced-motion preferences; no blocking animation on mobile, keyboard focus preserved, adequate contrast.
- Customer: “what needs my approval?” before secondary KPIs; evidence provenance and uncertainty visible, safe empty states.
- Internal team: status with next action, critical blockers, reviewer changes, ability to correct source safely, transparent audit.
- Marketing claims: no pilot logos, reported savings, customer stories or available technical modules without corroborating records.
- Engineering owns behavior, authorization, data/quality tests; Lovable handles presentation, not backend business rules or industrial expertise.

## 13. Definition of MVP (conditional)
An MVP is *not* “all departments on one dashboard.” Minimum after winning one lane: a secure case request/acceptance path, permissioned source references (and approved custody if real files), coherent review and findings, safe customer projection, customer-action tracking, a verified-or-unknown outcome, and fully costed case economics. Every step must survive refresh/retry and role changes.

The **current internal fictional triage** is only a discovery illustration, not this MVP. The existing synthetic C1/C4 engine and some connected sample routes are foundations requiring security/release acceptance before customer use.

## 14. Exit conditions / future capability additions
Promote a new service only after documented incremental buyer demand, qualified delivery capability, legal data rights, comparative gross/contribution margin, customer retention and reproducibility on at least two independent representative cases. Broader supplier networks require separate consent and buyer/supplier agreements. Infrastructure/OT work is a separate safety-critical undertaking and never an automatic consequence of the GridMind mission.

## Reference anchors
- [Master Plan](gridmind-master-plan-2026-10-11.md); [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md); [Implementation handoff](gridmind-mvp-lovable-handoff.md).
- [AIAG Quality Core Tools](https://www.aiag.org/expertise-areas/quality/quality-core-tools) provides industry method context but not rights to reproduce proprietary standards.
- [NIST OT Security Guide](https://csrc.nist.gov/pubs/sp/800/82/r3/final) explains unique physical safety/reliability requirements, not a license to assess live factory controllers.
