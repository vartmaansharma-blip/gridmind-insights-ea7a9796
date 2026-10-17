# GridMind 3.1 — Repository Conversion & Engineering Acceptance
**Date:** 2026-10-17. **Class:** Supporting engineering acceptance specification; not a second master plan or discovery tracker.

**Authority:** [Master Plan](gridmind-master-plan-2026-10-11.md); [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md); [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md); [Release Gate](release-gate.md). This file does not approve paid work, production changes or customer-data processing.

## 1. Existing source truth and the safe conversion principle

The actual app remains TanStack Start / React / Vite / Bun with Lovable and Supabase. Current connected case methods support synthetic C1 downtime and C4 energy examples only. GridMind 3.1's R1/R2/R3 intake demo is synthetic and non-persistent. The app is **not** an ERP, QMS, CMMS, payment network or factory controller. Reuse working engineering assets and preserve history rather than rewriting all existing components.

Original root / still opens the operational energy dashboard. /website is the public-site design. Customer /cases and internal /team/* routes are separate views. A domain/root swap requires a separate testable deployment, not a blind file rename. Retain legacy energy machinery pages as historical/demo/context, but **do not advertise them as an available, validated industrial service**.

## 2. Primary site and UI contract

| Audience/surface | Current source | Immediate truthful state | Future conditional state |
|---|---|---|---|
| Public /website | public-site/site.tsx and site.css | Broad factory-problem promise, fictional example, no invented endorsements or earnings | First paid service only after buyers and reviewers |
| Factory root / | routes/index.tsx | Existing energy demo/operating view retained and labeled | Action-first cases and verified outcomes, independently tested |
| Internal synthetic cases | /investigations | R1/R2/R3 fiction-only commercial screening alongside C1/C4 method demo | One selected domain-specific review workflow |
| Customer preview | /cases and /cases/$caseId | Existing gated sample/case projection | Real data only when access/custody/release are approved |
| Internal case & reviewer | /team/intake, /team/cases, /team/cases/$caseId | Reuse investigation and review pipeline | Specialist R1/R2 method after domain gate |
| Machines/energy | /machines, /energy | Historical energy screens | Source references for chosen paid problem, never automatic physical control |
| Savings/opportunities | /savings, /opportunities | Keep measured/estimated distinct | Case-linked, source-verified economics |

**Lovable:** typography, interaction, accessibility, mobile and actual immutable signature green token. **Engineering:** data contracts, case methods, security, APIs, migrations, independent review and test evidence. No duplicate customer identity model.

## 3. Ordered engineering epics — acceptance, not a parallel calendar

**E0 — Fix validation infrastructure (P0).** Inspect GitHub PR head and the exact failed runs, GitHub Actions allowance, Vercel build-rate limit; do not weaken workflows. Run locked-install, docs:links, typecheck, lint, test, build and relevant isolated migration/browser acceptance on exact candidate SHA. Record logs. References: [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136), [#42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42), [#137](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/137). **Done:** actual steps execute and pass; source issues fixed rather than bypassed.

**E1 — Repo strategic consolidation (P0).** Canonical plan, discovery, constitution, support product contract, operating risk/economics, handoff, root README and accurate code labels. **Done:** no active competing master; no claim that R1/R2 connected analysis exists. Historical documents preserved, not deleted.

**E2 — Synthetic Resolve preview (P0 internal).** One fictional situation per lane: owner, current alternative, adverse consequence as unverified, missing/permissioned evidence, reviewer availability, next decision and action. **Done:** non-persistent demo cannot transition to real customer approval; unit tests cover missing consent, missing technical review and stale revision. No production migration.

**E3 — Specialist method (after November gate).** Select one lane from real customer evidence, obtain qualified domain-method review, implement a distinct schema and deterministic validation. **Done:** source/counterevidence, fact vs hypothesis, chronology/invoice/tariff method as appropriate, independent review, negative and representative cases. [#135](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/135). Never just rename a C1/C4 enum.

**E4 — Secure real workflow (gated).** Organization/factory/case server rights, scoped consent and document ownership, safe custody and retention, version binding, reviewer independence, customer projection, action and outcome verification. **Done:** populated two-user two-factory isolation, revocation, idempotent retry, audit, restore and authorization negative tests. [#29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29).

**E5 — Paid case operation (after adult/legal/professional readiness).** Written scope and fee, expert costs, secure evidence, report QA, customer decision/acceptance, cash record, closure, remediation and liability boundaries. **Done:** customer-paid useful case with honest fully loaded economics. A source commit does not constitute a sale.

**E6 — Service productization (after repeated cases).** Automate repeatable safe intake and reminders; measure specialist hours, document errors, gross margin and payment timing. **Done:** proven quality stable/improving and cost per valid case falls.

**E7 — Enterprise/multi-factory expansion (later).** Buyer-sponsored programmes, separate supplier consent, conflict controls, security and proper financial case. **Done:** signed enterprise interest, independent favorable customer outcomes and acceptable contribution. Never speculate scale based on marketplace fantasies.

## 4. Synthetic workflow invariants and tests

The internal synthetic triage may output process-stage explanations, evidence gaps and “what qualified reviewer would be needed.” It may **not** confirm a root cause, certify compliance, claim a recovered debt, calculate guaranteed savings, authorize customer data, or change any real machinery.

- Reject origin other than synthetic and unknown R1/R2/R3 lanes.
- Flag a missing source, missing permission, unverified provenance, conflicting evidence or missing reviewer as an explicit stop condition.
- A fictional reviewed state must match a defined revision exactly; new source invalidates it.
- No response, even a fully populated fictional input, has approvedForCustomerUse=true or verifiedEconomicOutcome=true.
- A completed correction plan without baseline and observed follow-up is not a verified improvement.
- Simulated source records cannot establish real data rights or a professional's competence.
- Disable/avoid upload and real-data persistence in fictional UI; warn when user could interpret it as live.

## 5. Core quality and safety acceptance tests

**Source and case:** missing required fields, duplicate references, conflicting timestamps, timezone/units/invoice/version mismatches, unsupported facts, prohibited consent and hidden cross-case data.

**Authorization:** unauthenticated access, wrong organization, wrong factory, reviewer from different case, revoked or expired grant, internal cost/dissent exposure and alternate API routes.

**Decision and method:** reviewer independence, revision/hash freshness, scope boundary, no review of unknown sources, customer approval separate from professional approval, withdrawal and versioned correction.

**Economics:** quoted, contracted, invoiced, collected differentiated; loss estimates vs recovered cash; direct variable costs and founder time; negative margin; no invented customer outcome.

**AI:** malicious document text as inert data, fabricated citations, unsupported professional claims, model leakage and unsafe equipment recommendation refused.

**User experience:** tab order, focus after modal/nav, reduced-motion, mobile overflow, transparent fictional status, error/empty-state copy, existing green design token.

## 6. Release controls / rollback

1. Confirm branch, parent, head SHA, relevant issues and intended release environment.
2. Complete exact-head locked-install, Markdown link audit, typecheck, lint, Vitest, build, isolated API/migration/auth/browser tests.
3. Verify Github Actions ran steps; a ~2-second failure with no steps means **infrastructure failure**, not a source test result. Investigate account-side limitation.
4. Confirm Vercel preview points to **same SHA**; old READY deployments are not current tests.
5. Verify user flows with realistic synthetic records and cross-factory denial.
6. Verify no unapproved SQL, auth settings, industrial machine controls, personal documents or customer data touched.
7. Obtain independent required reviews; merge without force push/history rewrites; verify main SHA/deployment; retain rollback path.
8. If any safety or tenant problem appears, halt customer-data use and restore last tested state.

**Observed blocker snapshot, 17 Oct 2026:** GitHub Actions on the previous PR commit ended before steps; Vercel reported build-rate-limit and no latest-commit deployment. GitHub source branch is not merged. No check or browser deployment is claimed successful by this plan.

## 7. Current connection and branch reconciliation — 17 October 2026

This is an observed snapshot, not permission to release. Recheck exact heads before merging because connected state can move.

| Surface | Observed evidence | Implication and next safe action |
|---|---|---|
| GitHub | Private repository; draft [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136) began at 540b08c, based on main 74e7c52. Its four Actions workflows failed; the CI job shows no steps and its log fetch returned BlobNotFound. | Check the current run annotation and account Actions allowance/budget first. The billing restriction was previously cleared on 15 October per [#42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42), so recurrence needs fresh account evidence. Then rerun locked-install, docs links, typecheck, lint, tests, migration replay and browser checks on the **new exact head**. Do not call this a source failure or waive a gate. |
| Vercel | Project gridmind uses tanstack-start-lovable. Preview dpl_7A767VqU4oeDmzP96C93kY27CAFH was READY for 540b08c; target was preview, not production. | A subsequent documentation commit makes that preview stale for the PR's current head. Wait for an exact-head preview and inspect build plus protected browser flows; READY alone proves neither tests nor live service readiness. |
| Lovable | GridMind project latest reported commit was 74e7c52, the main/base commit, while its project description remained energy-centered. | PR branch content is not evidenced as synced into the Lovable editor or published site. After safe integration, use the [Lovable handoff](gridmind-mvp-lovable-handoff.md) to reconcile public copy and design on the appropriate source; do not describe the branch as live. |
| Supabase | Project bvqmvgbfqhgczwbvlqkk is ACTIVE_HEALTHY in ap-south-1. Read-only migration list contains 31 live entries and ends with scooter_poc_reference_catalogue. [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130) documents missing case tables/columns on its last schema inspection. | Service health and a migration registry do not establish schema parity or tenant safety. Reconcile source/live SQL and the parked scooter PR, create an approved recovery plan and isolated Auth/PostgREST/Edge acceptance. No migration or real-data use follows from this strategy PR. |

**Concurrent PR disposition:** [#132](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/132) proposes a public-root and role-onboarding route migration and overlaps the site/navigation contract; keep it separate until schema, role and route tests pass. [#133](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/133) proposes a synthetic case-analysis bridge and depends on the case schema/release work; preserve it as a distinct technical review. [#125](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/125) is an older site enquiry draft; compare its exact UI scope before combining. [#120](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/120) is a parked scooter reference catalogue, with a live migration-history interaction; no POC or separate launch is implied. Older machine-library, authentication and design PRs stay issue-scoped; no bulk merge into GridMind 3.1 is justified by shared branding.

The corrective order is: exact branch and PR diff → source/merge-conflict review → account-side CI diagnosis → checks actually executing on the new head → preview at that head → isolated security and browser acceptance where applicable → independent review and explicit release decision. Keep the live buyer gate and production release gate separate.

## 8. Completion definition

A change is complete only if its issue states the customer/correctness need, scoped implementation, risks, acceptance tests, exact SHA, executed test results, independent review where needed, merge and deployment proof if applicable. Unknown metrics remain unknown. Building beautifully without buyers, or earning revenue without positive case contribution, does not complete a commercial gate.

**References:** [Resolve Domain Contract](gridmind-resolve-domain-and-product-contract-2026-10-17.md); [Economics & Risk Register](gridmind-company-economics-and-risk-register-2026-10-17.md); [Lovable Handoff](gridmind-mvp-lovable-handoff.md); [Contribution Rules](../CONTRIBUTING.md).
