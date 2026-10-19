# GridMind 3.1 — Repository Conversion & Engineering Acceptance

## Connected Step 1 continuation — 20 October 2026

Refs #152; base is merged #153 (`42fc8c9959fd9dc5412ca04ca68c4969e9c77380`). This continuation adds an **isolated synthetic method attachment**, not professional or commercial validation. The historical offline checkpoint below remains a dated record.

- Flow: authenticated existing case → server-authorized factory/organization and equipment → bounded original CSV import → normalized interval validation and descriptive investigation → independent assigned simulated reviewer → proposed action → manager-recorded simulated customer authorization → completion evidence → explicit outcome verification → auditable saved report. The internal adapter lives in the existing connected workbench; public pages, dashboard, electricity and C1/C4 calculations are preserved.
- Identity: no new organization, equipment or membership system. `private.investigation_access` and existing factory/organization membership authorize **every** scope lookup, read, receipt and append. Reviewer assignments must be active/unexpired; review actor differs from importer. A manager is not automatically an independent reviewer. Customer approvals are explicitly simulated records entered by an authorized manager, **not a real customer signature**.
- Custody: original CSV bytes, source name/SHA-256, authenticated importer/time, normalized dataset hash, organization/factory/asset IDs and physical source lines persist in append-only revisions. Each read reparses the original source and checks normalized equality/hash; PostgreSQL checks stored snapshot hashes. Parent-case locking, compare-and-swap and actor-bound request fingerprints make duplicate/lost-response retries return the original receipt. Imports/reviews clear superseded current actions/verification; historical revisions remain readable only with current permission.
- Outcome: a separate actor/time/hash-bound verification record requires an accepted simulated review and completed approved action. It records matched versus insufficient descriptive intervals, source lines, operator rationale and confounders. Causal outcome is always **inconclusive**, verified savings stays null, and customer delivery remains false. No hypothesis is promoted automatically to an engineering finding.
- Activation: server `GRIDMIND_COMPRESSED_AIR_ENABLED=isolated-synthetic-only`, existing connected-case configuration and **loopback HTTP Supabase only**. Private `compressed_air_gate` defaults false and is enabled solely by disposable fixtures. No production connection, SQL, migration history repair, Auth changes or real customer evidence. The SQL file is source for isolated validation only.
- Verified locally: 39 native PostgreSQL migrations plus case/portal/compressed-air integration; two-tenant denial, role/assignment/expiry/revocation, invalid import/no partial write, retry/conflict, stale review, immutable history, review/action/verification/export and parent preservation. Native fixtures are **not** Supabase Auth/PostgREST proof. Application tests, typecheck and semantic lint passed (nine existing warnings); final candidate checks and full-stack browser results belong in the PR.
- Reproduce: `bun install --frozen-lockfile`; `bun run check`; `cd verification && bun install --frozen-lockfile && bun run test`. Full Supabase Auth → API → PostgreSQL → browser acceptance is part of Migration Replay, including `e2e/compressed-air-authenticated.pw.ts`; it accepts only the disposable loopback stack. Do not set these fixtures or flags on a shared database.
- Limitations: pressure reference and flow reference conditions, comparability thresholds, uncertainty model, serial dependence, baseline selection and causal interpretation require a qualified engineer. A completed action need not precede the already imported synthetic after-period: this demonstrates record handling, not a prospective causal study. UI draft fields/retry survive same-page failures; unsent browser work is not persisted across closing/reloading. Immutable snapshots duplicate small synthetic sources; production retention, deletion and scale require separate design/rights review. No independent security or qualified-method signoff is claimed.
- Next milestone: inspect exact-head full-stack CI, obtain independent tenancy/RPC/migration review and qualified method review. #152 stays **open**; #29/#130, #150 independent bootstrap review, data rights and retention remain release gates. Keep the PR draft until applicable review/checks pass. Rollback: disable the feature and revert application code by new commit; retain immutable evidence/history rather than dropping tables. No merge or production release is implied by this checkpoint.

## Step 1 execution checkpoint — 19 October 2026

Owner: Codex; evidence: repository inspection and read-only connected-service checks. Refs #152. Current main inspected at `6b549c5d3d0db03e644dbbe3072c61f0af435b5e`: homepage promotion `62770bb`, electricity intake #147 and fictional public demo #151 are merged. Earlier root-route statements below are historical. Supabase has 31 live migration records versus 38 source files and RLS enabled on all 45 public tables inspected; this alone does not prove policy isolation. Live history differs from source; no SQL was applied. Security advisor reports intentional authenticated bootstrap SECURITY DEFINER execution and disabled leaked-password protection. Bootstrap hardening is pending independent review in #150; do not duplicate or merge it as part of this slice. Existing open #132/#133/#125 overlap with historical navigation/connection proposals; none is integrated here.

Vercel production is READY at the inspected main commit: [deployment](https://gridmind-lp23tw8x8-vartmaansharma-blips-projects.vercel.app). Lovable project remains [existing GridMind](https://lovable.dev/projects/12d7acd4-2c00-472a-9b77-af92553ef7dc). Repository is currently public, so only fictional fixtures are committed. No credentials or customer records are exported.

Implemented first slice: strict bounded CSV import; SHA-256 and physical source lines; scoped identity contract; explicit timestamp intervals; positive finite canonical kW, m³/min and bar; non-overlap validation; baseline matching on declared context, pressure within 0.2 bar and flow within 10%; minimum three baseline intervals; descriptive baseline range expanded by declared measurement uncertainty; source-linked excess-power observations; hypotheses and simulated review/action records; immutable-file JSON export. These tolerances are unvalidated software demonstration parameters, not an industrial standard. No currency conversion or causal savings output.

Run `bun scripts/export-compressed-air.ts data/compressed-air/synthetic.csv /tmp/compressed-air-report.json` with a new output filename. Import accepts a strict simple CSV dialect and rejects quotes, missing cells and unknown units. A comparison is descriptive per interval, not a statistical confidence interval. Before/after export includes matched residual-intensity change ranges; no aggregation across unmatched regimes. Outcome stays pending engineer review and confounder assessment. Uncertainty is conservatively propagated through both power and flow ratios. Review/action records require matching source digest, normalized dataset snapshot and valid source lines; completed actions require approval and completion evidence. They are local simulated records, not authenticated claims.

Local validation: locked install, 239 Vitest tests across 28 files, typecheck, documentation links and production build passed. Semantic lint passed with nine pre-existing warnings. CLI import/export executed successfully. Remote exact-head checks and preview must be recorded in the PR before merge.

Exact next Codex tasks: (1) independently review comparability/uncertainty with a qualified compressed-air engineer and extend representative negative fixtures, (2) integrate a minimal internal adapter using existing case/reviewer identities and immutable revision binding, (3) implement server-authorized organization/site/asset lookup and append-only import/review/action persistence in a disposable Supabase stack, (4) test two-tenant authorization, revocation, replay, altered imports, review staleness and export custody, (5) complete #130/#29 and #150 review before any production/customer-data release. No duplicate identity tables, public upload or live telemetry. This checkpoint completes an offline foundation only; connected Step 1 acceptance remains open.

**Date:** 2026-10-17. **Class:** Supporting engineering acceptance specification; not a second master plan or discovery tracker.

**Authority:** [Master Plan](../gridmind-master-plan-2026-10-11.md); [Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md); [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md); [Release Gate](../release-gate.md). This file does not approve paid work, production changes or customer-data processing.

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

**Historical blocker snapshot (earlier 17 Oct 2026):** some older GitHub Actions runs ended before steps and Vercel hit a build-rate limit. **Superseded for head `208747c`:** four GitHub workflows passed, but Vercel failed there; subsequent documentation commits moved the head again. The latest exact-commit state must be checked in GitHub, not inferred from a historical paragraph. See the [checkpoint evidence](gridmind-3-1-exact-checkpoint-and-integration-register-2026-10-17.md) and [pre-merge decision packet](gridmind-3-1-pre-merge-decision-packet-2026-10-17.md). These do not remove the independent security, Supabase and real-data gates.

## 7. Current connection and branch reconciliation — 17 October 2026

This is an observed snapshot, not permission to release. Recheck exact heads before merging because connected state can move.

| Surface | Observed evidence | Implication and next safe action |
|---|---|---|
| GitHub | The repository became public on 17 October after the $6/$6 private Actions budget blocked job startup. Draft [PR #136](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/136) remains based on main 74e7c52. At head `3c4586d`, CI, Quality Gate, isolated Migration Replay, Public Site Browser and the Vercel preview all passed. An active [main ruleset](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/settings/rules/25302961) requires those five contexts, but has zero required approvals for the solo owner; enforcement has not been exercised on a harmless PR. | Run required jobs on every **new exact head**, obtain independent security review of tenant/migration/Edge changes, test the ruleset, reconcile production migration drift and perform authorized live acceptance before any release claim. Public visibility avoids the private-runner budget block but does not authorize production deployment. Record account/billing incidents in [#42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42). |
| Vercel | Project gridmind uses tanstack-start-lovable. Preview dpl_7A767VqU4oeDmzP96C93kY27CAFH was READY for 540b08c; target was preview, not production. | A subsequent documentation commit makes that preview stale for the PR's current head. Wait for an exact-head preview and inspect build plus protected browser flows; READY alone proves neither tests nor live service readiness. |
| Lovable | GridMind project latest reported commit was 74e7c52, the main/base commit, while its project description remained energy-centered. | PR branch content is not evidenced as synced into the Lovable editor or published site. After safe integration, use the [Lovable handoff](../product/gridmind-mvp-lovable-handoff.md) to reconcile public copy and design on the appropriate source; do not describe the branch as live. |
| Supabase | Project bvqmvgbfqhgczwbvlqkk is ACTIVE_HEALTHY in ap-south-1. Read-only migration list contains 31 live entries and ends with scooter_poc_reference_catalogue. [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130) documents missing case tables/columns on its last schema inspection. | Service health and a migration registry do not establish schema parity or tenant safety. Reconcile source/live SQL and the parked scooter PR, create an approved recovery plan and isolated Auth/PostgREST/Edge acceptance. No migration or real-data use follows from this strategy PR. |

**Concurrent PR disposition:** [#132](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/132) proposes a public-root and role-onboarding route migration and overlaps the site/navigation contract; keep it separate until schema, role and route tests pass. [#133](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/133) proposes a synthetic case-analysis bridge and depends on the case schema/release work; preserve it as a distinct technical review. [#125](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/125) is an older site enquiry draft; compare its exact UI scope before combining. [#120](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/120) is a parked scooter reference catalogue, with a live migration-history interaction; no POC or separate launch is implied. Older machine-library, authentication and design PRs stay issue-scoped; no bulk merge into GridMind 3.1 is justified by shared branding.

The corrective order is: exact branch and PR diff → source/merge-conflict review → account-side CI diagnosis → checks actually executing on the new head → preview at that head → isolated security and browser acceptance where applicable → independent review and explicit release decision. Keep the live buyer gate and production release gate separate.

## Pre-merge implementation authority

The founder's GridMind 3.1 direction authorizes a reviewable **synthetic** codebase and truthful public-site source, **not** automatic production rollout. The [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) G31-M01–M10 and [pre-merge decision packet](gridmind-3-1-pre-merge-decision-packet-2026-10-17.md) now distinguish Class I informational release, Class S synthetic-only demo and Class D production customer-data workflow. For #136, either narrow the releasable scope in a separate non-history-rewriting branch or obtain independent review of the entire mixed code diff and explicit founder production authorization. The default remains **draft/HOLD**.

When code uses production-connected /, /website, /cases or /team routes, verify route invariants, server-side roles, tenant isolation, data-rights restrictions, feature flags, and a tested rollback on the **exact final** Vercel commit. The live Supabase schema/migration registry mismatch in #130 and authenticated release checks in #29 are blocking Class D, irrespective of passing local replay. The 215-file diff and overlapping #132/#133/#125/#120 PRs require documented per-scope disposition; avoid blind bulk merges.

## 8. Completion definition

A change is complete only if its issue states the customer/correctness need, scoped implementation, risks, acceptance tests, exact SHA, executed test results, independent review where needed, merge and deployment proof if applicable. Unknown metrics remain unknown. Building beautifully without buyers, or earning revenue without positive case contribution, does not complete a commercial gate.

**References:** [Resolve Domain Contract](../product/gridmind-resolve-domain-and-product-contract-2026-10-17.md); [Economics & Risk Register](../operations/gridmind-company-economics-and-risk-register-2026-10-17.md); [Lovable Handoff](../product/gridmind-mvp-lovable-handoff.md); [Contribution Rules](../../CONTRIBUTING.md).

## GM-3.1-001 electricity intake slice — 19 October 2026

Supporting acceptance record; owner: Codex implementation / independent security reviewer pending. [Issue #146](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/146) is the work item; [Master Plan](../gridmind-master-plan-2026-10-11.md) remains execution authority.

- Baseline main: `8e6b413ef9a8c6ddb45ee4c3ed7ffca0e22228e9`; CI, Quality and Migration Replay success inspected. Open #132/#133/#125 remain excluded. Lovable configuration, generated integrations, existing case engine, `/` and `/website` retained; route tree regenerated by Vite.
- Live read-only: Supabase has 31 migration entries, no investigation tables; RLS enabled on listed public tables. Existing factory contents were not read. Source baseline has 37 migrations, extended to 38 here. No migration-history repair or live writes. #130 remains unresolved.
- Vercel: current-main production attempt `dpl_6ezGtLt3HzrFd1s7UHEocnmJMqiq` is CANCELED. Latest READY production inspected: `dpl_3MXQnBZhwPTYSKRE3QP8W2thj7Z4`, commit `363cbface9e164319df43660ef9f9886b8b7fdb7`. Protected `/website` fetched successfully (HTTP 200); this is not authenticated customer acceptance.
- Implementation: `/team/electricity` and `/api/electricity`; reuse factory/organization membership, Supabase browser auth, DashboardFrame, nav and UI primitives. `electricity_cases`, `electricity_evidence`, `electricity_events` are an intake model; existing synthetic reviewed snapshots remain unchanged. Only active owner/admin creates; assigned active analyst or manager accesses. Suspended organizations fail closed. Viewer/customer membership is insufficient. No service-role key is needed by the new endpoint.
- Case creation is retry-safe by supplied UUID; immutable identity/initial fields must match on retry. Status uses expected revision and an explicit transition graph, ending at inconclusive closure. Events are append-only. The private `electricity-bills` bucket allows PDF/PNG/JPEG up to 10 MiB; metadata reservation precedes upload and finalization checks object size/MIME. No overwrite/delete policy; no public URLs. Downloads use current authenticated Storage access, not transferable signed URLs. Case list is bounded to the latest 100 visible records; pagination is deferred.
- Failure boundary: a failed upload stays visibly pending, never “uploaded.” Same-page retry keeps its identifier; after navigation an operator can upload as a new evidence record. Pending reservations expire for Storage insertion after one hour. Automated orphan cleanup, retention/deletion workflow, malware scanning and independent authenticity/hash attestation are not implemented; they are live-data release prerequisites, not claims made by this synthetic slice. File MIME checks do not prove file safety. No real customer bills.
- Enable only in disposable environments with `GRIDMIND_ELECTRICITY_ENABLED=synthetic-only`, server `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`, and matching public `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. Default API is disabled. SQL is source-only; the environment switch is not a replacement for database permission controls or authorization to apply migrations.

Reproduce with Bun 1.3.5: `bun install --frozen-lockfile`; `bun run check`. Native SQL rehearsal: `cd verification && bun install --frozen-lockfile && bun test` (minimal Auth/Storage catalog fixtures, not HTTP proof). Full disposable Supabase acceptance is in Migration Replay: replay all migrations, run `supabase/tests/factory-analysis-schema-contract.sql`, provision synthetic Auth fixtures, then `cd e2e && bun install --frozen-lockfile && bun run test`. The electricity browser case tests create/upload/download bytes/reload/status/audit and another tenant's API/Storage denial. Do not point acceptance tools at production.

Release sequence: exact-head checks → independent review of tenancy/RPC/Storage/migration → #130 recovery and forward-only reconciliation → #29 populated live acceptance → separately authorized real-data handling. Keep PR draft until review and required checks are complete. Rollback before activation: revert application changes through a new PR and keep the feature disabled; never destructively drop evidence tables or rewrite Lovable history. Immediate next engineering action is independent security review of this narrow slice; live schema reconciliation remains a separate gated task.
