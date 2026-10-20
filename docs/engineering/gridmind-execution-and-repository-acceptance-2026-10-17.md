# GridMind 3.1 — Repository Conversion & Engineering Acceptance

## Current implementation and acceptance — 20 October 2026

**Supporting implementation evidence, not another execution plan.** Read [Master Plan §§3–6](../gridmind-master-plan-2026-10-11.md) for current status, dependencies and P0–P4 meaning; this ledger owns the technical detail. Inspected main is `42fc8c9959fd9dc5412ca04ca68c4969e9c77380` (merged #153). Connected continuation #154 is **OPEN / DRAFT**, inspected head `123fc2a7554427d9db6d1060d0e37cda6dbe2233`, base main `42fc8c9`. No code from that draft is merged by this documentation change.

**M1 next executable task:** reproduce the draft's bounded workflow and execute its [independent security and engineering-method review packet at the inspected SHA](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/blob/123fc2a7554427d9db6d1060d0e37cda6dbe2233/docs/engineering/gridmind-execution-and-repository-acceptance-2026-10-17.md). The packet is retained on #154; this branch neither rewrites it nor duplicates its implementation. Founder must arrange qualified independent people; an author or AI self-review does not satisfy those decisions. Keep #152 open/#154 draft until declared acceptance passes.

### What exists and how it connects

| Shared responsibility | Merged main / inspected draft evidence | Required boundary |
|---|---|---|
| Identity and case | Main `src/lib/investigation/schema.ts`, `connected-contract.ts`, `connected.server.ts`; existing organization/factory/equipment and case grants | Server-authorized identity and current scope for every read/write/export. No second identity system |
| Evidence and validation | Main `src/lib/compressed-air/investigation.ts`, electricity contract/server and synthetic bill provenance; draft `compressed-air/connected.ts` | Original source bytes/lines/digest, units, interval/time/context and normalized revision. Valid syntax/hash does not prove calibration or genuine acquisition |
| Contextual analysis/investigation | Main descriptive matched baseline, uncertainty and competing hypotheses; draft attaches to existing connected workbench | Demonstration tolerances unvalidated; no monthly bill → compressor fault inference, universal diagnosis or causal claim |
| Review → customer decision → action | Main existing investigation/portal contracts; draft source-bound independent assigned simulated review, manager-recorded simulated approval and completion | Reviewer differs from importer and remains assigned; revision changes invalidate dependent approval. Simulation is not professional/customer authority |
| Outcome → institutional knowledge | Main offline JSON report; draft explicit inconclusive assessment and atomically persisted immutable report/history | In inspected draft, causal outcome stays inconclusive, verified savings null, customer delivery false. History is retained learning; no cross-case mining, trained model or shared customer dataset is established |
| Persistence and authorization | Draft `connected.server.ts`, `verification/compressed-air-acceptance.ts`, `supabase/migrations/20261019182727_connected_compressed_air.sql` | Isolated loopback disposable stack only; private default-off gate, role/tenant denial, CAS, retries, revocation/suspension and append-only custody. Never apply the unmerged migration to production |

This supports keeping one case loop and distinct domain methods. Reusable workflow responsibilities are demonstrated in source; full generalized reuse across industrial domains remains unproved. No new services, universal ontology or platform rewrite is needed to accept M1.

### Exact candidate verification versus independent authority

Observed on #154 `123fc2a`: [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39307732386), [Quality](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39307732502), [Public Browser](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39307732423) and [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/39307732342) completed SUCCESS; Vercel context SUCCESS; Supabase Preview SKIPPED. These are live GitHub status observations, not reruns by this documentation task. The draft's 249-unit-test/native/browser details belong to that candidate's PR evidence, not to current merged main. The PR body still says final checks pending; the observed rollup supersedes that pending-check sentence only, not review requirements.

- **M1 acceptance blockers:** qualified independent security and engineering-method scoped accept/revise/reject decisions; resolve findings on the refreshed final candidate, rerun applicable acceptance and reconcile documentation/main before normal consolidation. Test import → save/reload → independent simulated review → approved/completed action → explicit inconclusive outcome → saved historical export. Include wrong tenant/role, revoked/expired grants, suspended organization, missing gate, malformed/altered import, lost response retry, stale review, concurrent revision and export integrity.
- **M2 production blockers:** #130 read-only drift/recovery/change-control plan; #29 populated authenticated acceptance including inherited parent/portal suspension and session lifecycle semantics; #150 independent bootstrap review. No live migration or Auth/settings/flag mutation follows from M1 success.
- **M3 method/data blockers:** engineer must challenge pressure/flow reference conditions, instrument/clock quality, context/baseline coverage, 0.2 bar/10%/three-interval assumptions, uncertainty/covariance/drift, before/after pairing and confounders. Accept bounded synthetic demonstration separately from real-case validity. Real follow-up requires a prospective protocol.
- **M4 rights/customer blockers:** actual source consent/purpose/custody/retention/recovery, professional engagement and customer action authority. A hash is not a signature; pre-imported after-periods are not an intervention study. Do not claim customer value without actual evidence.

### Reproduction and concurrent handoff

Use pinned Bun 1.3.5 and locked dependencies. On the relevant candidate run `bun run docs:links`, `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`; `bun run check` adds production-preview smoke. Security/schema changes additionally require the existing disposable Migration Replay Auth → API → database → browser workflow and qualified review. Never use production or real customer fixtures.

#154 already edits these canonical files. Its owner must integrate the alignment commit through a normal main merge, preserve its method/security packet and current code, resolve documentation conflicts semantically, and rerun checks on the resulting candidate. Older #154 priority numbering is a supporting snapshot; use the Master Plan's current P0–P4 classification. #132/#125 route/contact and #133 bridge proposals need remaining-delta review, not bulk integration. #150 stays separate; no duplicate bootstrap fix.

**Routes and source:** #149 `62770bb` established approved public `/` and `/dashboard`; preserve `/design-preview`, `/website` compatibility and signature green. #147/#151 electricity source is merged but customer release remains gated. #136 merged as documentation consolidation `363cbfa`; historical broad-candidate HOLD is superseded. No production deployment/Supabase state was freshly verified in this documentation audit.

## Historical technical checkpoints — retained evidence only

Everything below records its own dated candidate/environment. Its old routes, E0–E7 priority sequence, outstanding-adapter tasks and #136 candidate status do not govern present execution. The current section above and Master Plan own status/sequence; durable security requirements remain. Dated live counts are not current measurements.

## Historical offline Step 1 checkpoint — 19 October 2026

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

<a id="3-ordered-engineering-epics-acceptance-not-a-parallel-calendar"></a>

## 3. Historical engineering epics — superseded work order

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

The founder's GridMind 3.1 direction authorizes a reviewable **synthetic** codebase and truthful public-site source, **not** automatic production rollout. The [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) G31-M01–M10 and [pre-merge decision packet](gridmind-3-1-pre-merge-decision-packet-2026-10-17.md) now distinguish Class I informational release, Class S synthetic-only demo and Class D production customer-data workflow. Historical #136 broad-candidate disposition was draft/HOLD; the final documentation consolidation merged as `363cbfa`. It did not waive production/customer-data requirements. Current work follows the Master Plan and candidate-specific review.

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
