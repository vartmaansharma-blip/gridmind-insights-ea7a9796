# GridMind Execution Plan — 30-Day Sprint

> **REFERENCE ONLY — superseded for execution on 2026-10-11.** The sole execution authority is [GridMind Master Plan](gridmind-master-plan-2026-10-11.md); the sole live discovery tracker is [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md). This document may preserve useful analysis, but its old schedules, candidate letters, gates, engineering priorities, and numeric targets are not active instructions. Use stable candidate IDs C1–C5 and the two-tier gates in the canonical files. Do not create another plan from this document.


**Plan date:** 2026-10-11  
**Planning window:** 2026-10-12 to 2026-11-10  
**Status:** Execution baseline. Milestones below are targets, not claims of completed work.  
**Accountable owner:** Founder. Technical changes require an authorized operator and independent reviewer; industrial findings require a qualified domain reviewer.

Related docs: [Product rating](gridmind-product-rating-2026-10-11.md) · [Master plan](gridmind-master-plan-2026-10-11.md) · [Technical readiness snapshot](gridmind-technical-readiness-snapshot-2026-10-11.md) · [Buyer discovery sprint](gridmind-buyer-discovery-sprint-2026-10-11.md)

## 1. The 30-day objective

Earn two kinds of proof in parallel:

1. **Commercial proof:** target 10 substantive industrial discovery conversations, select a leading workflow only from evidence, and seek one buyer-authorized retrospective test with a qualified reviewer.
2. **Technical proof:** resolve release blockers in a controlled process and demonstrate the authenticated workflow on an identified release candidate.

**Day-30 success:** an evidence-backed wedge decision, documented customer problem and economic consequence, a permissioned test scope if a buyer agrees, and a reproducible technical acceptance report tied to an exact candidate. A paid pilot is a stretch outcome, not a promise.

## 2. Priority and ownership

| Priority | Workstream | Accountable roles | Exit evidence |
|---|---|---|---|
| P0 | Production schema/security readiness | Founder coordinates; authorized Supabase operator executes; second reviewer reviews | Reviewed migration plan, recovery point, verified schema, security findings disposition, acceptance evidence |
| P0 | Buyer discovery | Founder | Consent-aware notes on past events, recurrence, consequence, current workaround, owner, evidence availability, next step |
| P1 | Permissioned retrospective test | Founder + buyer sponsor + domain reviewer | Written authorization, minimum data scope, baseline, review criteria, result and limitations |
| P1 | Authenticated end-to-end acceptance | Technical operator + tester | Reproducible pass/fail matrix tied to candidate SHA and environment |
| P2 | Pilot offer | Founder + buyer | Bounded scope, deliverables, exclusions, responsibilities, price hypothesis and measurable success criteria |
| P2 | UX/features | Founder/product | Prioritize only after buyer feedback or a release-critical defect; no broad roadmap expansion yet |

## 3. Week-by-week execution

### Week 1 — Establish facts and open doors (Oct 12–18)

**Technical**
- Re-read the two repository migrations and code paths requiring asset_interventions.implemented_at and factory_analysis_runs.input_snapshot_sha256.
- Compare repository migration history with live schema metadata using read-only checks first. Document exact definitions, constraints, dependencies, policies, grants, backfill semantics, and recovery approach.
- Reproduce required schema and authorization tests in an isolated environment from an empty database.
- Prepare the authenticated acceptance checklist: sign-in → workspace/factory selection → authorized asset → analysis → durable persistence → authorized reload → idempotent retry/conflict behavior → cross-tenant denial.
- No production DDL without an authorized operator, explicit approval, verified backup/recovery point, second-person review, maintenance window, and written stop conditions.

**Commercial**
- Identify 10 potential *roles or introduction paths*, not invented named prospects: plant leader, maintenance/reliability, production/quality, utilities/energy, operations excellence, or finance owner.
- Ask one trusted connection for an introduction using the existing draft, once the recipient is confirmed. Do not imply production readiness.
- Target 2–3 substantive conversations if access is secured. Ask about specific past incidents, frequency, consequence, current workaround, who owns the metric/budget, and what records support the account.

**Gate:** do not expand features. Keep production changes blocked until operator, reviewer, recovery and approval prerequisites exist.

### Week 2 — Test authorization and narrow the problem (Oct 19–25)

**Technical**
- In an isolated environment, use two distinct test users and separate factory fixtures. Test both authorized access and attempted cross-tenant reads/writes across relevant tables, RPCs, Edge Functions, views and storage where applicable.
- Test workspace-bootstrap RPC behavior for authorized, unauthorized and unauthenticated callers, including whether organization selection can be abused.
- Review leaked-password protection and authentication/recovery implications. Enable only through the authorized project owner, then test if approved.
- Run migration replay, typecheck, lint, production build and critical integration tests. Record exact commit SHA, environment and failures.

**Commercial**
- Target 4–5 conversations cumulatively.
- Compare problems by consequence, recurrence, urgency, evidence access, buyer authority, current alternatives and ability to verify improvement.
- Select no wedge if evidence is weak; record disconfirming evidence.

**Gate:** no production-ready claim while critical schema, security or authenticated acceptance gates remain open.

### Week 3 — Run a bounded evidence test (Oct 26–Nov 1)

**Technical**
- After approved schema alignment, verify definitions and migration history. Do not invent historical timestamps/hashes or disable RLS to make tests pass.
- Run the full authenticated acceptance workflow against a release candidate. Verify persistence, authorized reload, same-key idempotency, conflicting-input rejection and cross-tenant denial.
- Confirm Vercel deployment corresponds to the exact candidate SHA; READY on an older SHA is not acceptance.

**Commercial**
- Target 7–8 conversations cumulatively.
- If a buyer agrees, define a minimal retrospective test: objective, permitted fields, data owner, retention/deletion, access controls, baseline, reviewer and success/failure criteria.
- Keep confidential factory data out of chat and personal tools. Use the buyer-approved secure transfer and handling process.
- Have a qualified industrial reviewer assess findings before they are presented as operational recommendations.

**Gate:** if there is no authorized data access, do not simulate success; return to discovery or test another evidence-supported problem.

### Week 4 — Decide and propose a pilot (Nov 2–10)

**Technical**
- Close acceptance failures or keep release status NO-GO. Publish a release report with candidate SHA, test matrix, failures, residual risks and reviewer sign-off.
- Re-check production status after approved changes. Documentation CI or a successful build alone is not end-to-end readiness.

**Commercial**
- Target 10 substantive conversations cumulatively.
- Make a documented wedge decision: pursue, revise or reject, including contrary evidence and why alternatives lost.
- If a retrospective test produced a reviewer-accepted result, ask whether a bounded paid pilot is worth evaluating.
- Draft an offer only with deliverables, exclusions, buyer responsibilities, timeline, price hypothesis and measurable acceptance criteria. Make no unverified savings or performance claims.

**Day-30 decision:**  
A. Pursue a bounded pilot if buyer need, authorized evidence, reviewer acceptance and a buyer-backed next step exist.  
B. Continue discovery if the need is plausible but unproven.  
C. Change the wedge if consequence, urgency, data access or buyer commitment is weak.

## 4. Scorecard and counting rules

| Metric | 30-day target | Counting rule |
|---|---:|---|
| Substantive discovery conversations | 10 | Completed conversations with relevant operators/buyers; messages do not count |
| Problems with concrete past-event evidence | At least 3 | Specific event, impact and evidence source identified |
| Leading workflow selected | 1 or explicitly none | Decision includes alternatives and disconfirming evidence |
| Permissioned retrospective test | Seek 1 | Count only after authorization and scope; a request is not access |
| Domain-reviewed finding | Seek 1 | Reviewer records acceptance, rejection or uncertainty |
| Isolated tenant-security acceptance | All defined critical tests pass | Positive access and negative cross-tenant attempts both pass |
| Authenticated end-to-end acceptance | All critical-path tests pass for candidate | Report identifies exact SHA and environment |
| Production readiness | Pass only after every release gate | Green CI or deployment READY is insufficient |
| Paid pilot | Stretch outcome | Count only a buyer-approved paid scope/commitment |

## 5. Production safety gates

Production remains **NO-GO** until applicable conditions are met:

1. Missing-column discrepancies are resolved by an authorized, reviewed migration with a recovery point, stop conditions and post-change verification.
2. Workspace-bootstrap RPC authorization is tested and the warning is remediated or formally risk-accepted by a qualified reviewer.
3. Leaked-password protection is addressed by the authorized settings owner and relevant authentication flows are tested.
4. Populated two-user tenant-isolation tests pass in a non-production environment across relevant API/RPC/Edge Function paths.
5. Authenticated persistence, reload, idempotency, conflict handling and unauthorized denial pass end to end.
6. CI and deployment refer to the exact candidate SHA; residual risks and reviewer sign-off are recorded.

Do not grant broad table access, disable RLS, hand-edit production schema, fabricate historical values, or create synthetic production customer data to make a test pass.

## 6. Commercial safety gates

- Do not claim savings, diagnosis accuracy or superiority without a defined baseline and evidence.
- Distinguish observation, inference, estimate, recommendation, implemented action and verified outcome.
- Use only customer-authorized data and the smallest necessary scope.
- Keep humans responsible for consequential industrial decisions; initial GridMind pilots are decision support, not autonomous plant control.
- Do not call an interview a pilot, a demo a customer result, or a hypothesis product-market fit.

## 7. Decision log

For every meaningful result, record date, responsible role, hypothesis, evidence and permission basis, observed result and uncertainty, pass/fail/blocked decision, customer impact or technical risk, next action/owner/due date, and relevant commit/workflow/test report.

## 8. Immediate actions

1. **Founder:** identify one trusted connection who can introduce GridMind to an industrial decision-maker; send the warm-intro request only to that confirmed recipient.
2. **Technical operator:** prepare the reviewed schema-alignment plan and isolated two-user acceptance matrix; do not apply production changes yet.
3. **Founder + domain reviewer:** schedule the first discovery conversation and capture the buyer's own language, past-event evidence and current workaround.
4. **Founder:** update this plan only when evidence changes status; preserve planned / in progress / blocked / complete distinctions.

**Operating principle:** prove the problem, prove the evidence, prove the outcome, then scale the workflow. The ten-year ambition does not lower the proof required for the next step.
