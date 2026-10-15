# GridMind system-alignment audit

**Audit date:** 2026-10-10  
**Scope:** repository evidence, PRs #7–#10, canonical analysis code, intake templates/validator, migration-replay workflow, and the existing live-acceptance runbook. This snapshot was refreshed after PRs #7, #8, and #10 were merged; PR #9 remains under review.  
**Purpose:** align the build to one evidence-to-action-to-verification outcome before adding features.  
**Evidence limits:** this is a source-code and recorded-readiness audit, not an independent industrial engineering review. A passing test proves only the tested behavior. The live-readiness figures below are those recorded in the runbook's last read-only inspection and must be refreshed before operational decisions.

## Executive decision

**Pause feature expansion. Do not call GridMind pilot-ready.** Keep the product direction; tighten the evidence contract and release sequence.

GridMind's single intended outcome is: **turn authorized, traceable, quality-qualified factory evidence into a reproducible, context-aware finding; let a qualified person decide and track an intervention; then verify the result against a defensible baseline.** A finding is not a root-cause diagnosis, a financial estimate is not realized savings, and a technically valid CSV is not proof of factory truth.

The project has useful foundations: a shared deterministic analysis engine, a canonical adapter, a server-side persistence path, database security tests, explicit templates, a local intake validator, and a real-factory data request/runbook. The main problem is not a lack of features; it is that the entire path has not yet been demonstrated end-to-end on real evidence, while multiple adjacent paths and unverified assumptions can create false confidence.

## Alignment matrix

| Layer | Intended contract | Current evidence | Alignment judgement | Gate |
|---|---|---|---|---|
| Business thesis | Evidence-backed industrial economic intelligence, ending in verified action | Strategy and pilot docs describe this coherently | Direction aligned | Keep as north star; resist generic dashboard expansion |
| Factory/asset identity and authorization | Caller is legitimately authorized for both factory and organization; asset belongs to requested factory | Server-side function and security tests exist; runbook records zero active membership rows at last inspection | Code design exists; live access/readiness blocked or stale until rechecked | Verify current membership and tenant isolation before any real run |
| Raw evidence intake | Source, period, unit, quality, estimate flag, and provenance retained; missing is not zero | Three CSV templates plus PR #9 local validator; PR #7 improves a separate monthly CSV path | Partial alignment; two input paths have different schemas and semantics | Define one canonical contract and explicitly label any legacy screening path |
| Canonical assembly | Only authorized factory/asset evidence, exact role mapping, unambiguous periods, context coverage, and source IDs | Shared adapter maps observations and contexts into analysis samples; tests cover some role, zero, missing context, and source-ID cases | Promising but not proven against every validator/schema edge case | Contract tests must cover the full adapter and database contract |
| Physical analysis | Comparable periods, explicit exclusion/refusal reasons, no invented cause | Shared deterministic loop with quality/origin and comparability checks | Algorithm exists; industrial validity and precision not independently established | Synthetic tests plus independent engineering review on blinded real data |
| Economic quantification | Correct effective tariff/currency, recovery fraction and intervention cost with provenance; estimate labelled as estimate | Engine refuses incomplete/malformed economics; PR #10 removes an implicit INR fallback when no context exists | Improving, but economic context selection and zero/missing distinctions need explicit contract tests | No monetary claim unless all required economic inputs are valid and effective for the analyzed period |
| Persistence/reproducibility | Server assembles input, persists immutable snapshot/result/source IDs, reload/recompute matches | Edge Function, run store, migration and migration-replay workflow exist | Designed, but live deployed behavior is not established | Local clean replay + authenticated HTTP + tenant-isolation tests pass on the same current SHA; later authorized live acceptance |
| UI/API | UI invokes the authoritative server path and communicates evidence limits accurately | Browser runner sends IDs; monthly energy pipeline also exists | Potential conceptual split: legacy monthly screening and canonical persisted analysis are distinct paths | Document which UI/action calls which pipeline; avoid presenting legacy screening as authoritative persisted analysis |
| Intervention and M&V | Track action, dates, costs, operational changes and post-intervention evidence; distinguish estimated from realized value | Strategy/runbook describe verification principles; no demonstrated factory outcome recorded | Not yet proven as a complete operating workflow | No “realized savings” claim until post-intervention measurement and review |
| Pilot operations | One real factory/asset, controlled data transfer, responsible contacts, expert review | PR #8 data request and live-acceptance runbook | Preparation exists; commercial proof absent | Receive real data, qualify it, run blind analysis, review, act, measure, verify |
| Commercial proof | Independently reviewed finding with material value and repeatable delivery | Uploaded comparison rates commercial validation 1/10; no verified real-factory outcome is evidenced in reviewed material | Not validated | Do not infer product-market fit or savings from synthetic fixtures or code tests |

## Severity-ranked findings

### P0 — No verified real-factory outcome
The runbook's recorded last read-only inspection found one factory, eight registered assets, zero active organization/factory memberships, zero canonical observations, operating contexts, economic contexts, data sources and mappings, and no analysis-runs table or deployed Edge Function at that time. These are historical recorded findings, not a fresh live query. The runbook also says assets were not calibrated according to their current status values.

**Why it matters:** without legitimate access, real evidence and a usable deployed path, GridMind cannot demonstrate the value proposition. Registered assets and nameplate kW do not establish actual consumption.

**Required correction:** refresh read-only readiness; establish legitimate membership through the authorized owner/admin; choose one asset with traceable meter and matching production data; gather the requested history and tariff/operating records; do not fabricate missing values.

### P0 — End-to-end proof is not yet established
The code has a canonical adapter, deterministic engine, persistence function and reload/recompute design. That does not prove the live deployed path works or that a real finding survives expert review. PRs #7 and #10 were merged only after CI, Quality Gate, and Migration Replay reported success on their respective heads. PR #8's pilot data-request document was also merged after its checks passed. These merges do not prove production deployed behavior. PR #9's validator changes are under review; its intake-specific tests and CI/Quality Gate passed on the latest checked head, while Migration Replay was still running. No production deployment/migration was performed.

**Required correction:** require all core checks to pass on the same SHA, then a controlled local end-to-end run, then authorized live acceptance. Never use a green unrelated check or an older SHA as proof for the current code.

### P1 — Two ingestion/analysis concepts can be mistaken for one product pipeline
The monthly CSV path uses `month,kwh,cost,peak_kva,production,operating_hours,power_factor`; the canonical pilot templates use period boundaries, role/metric, provenance, quality and economic-context records. The monthly pipeline also has heuristic screening rules (including a tariff band and stale threshold). These are not interchangeable contracts.

**Risk:** users may assume a monthly screening result is the same as a canonical persisted analysis result, or that generic thresholds are authoritative factory economics.

**Required correction:** map every UI entry point to its exact pipeline and output type. Either explicitly call the monthly path “screening/preliminary” with its own limitations, or retire it from the authoritative workflow. Do not silently blend outputs.

### P1 — Intake validator is a preflight, not the canonical authority
PR #9 validates the three CSV headers and many structural properties, but it is local-only. It does not write or upload data and explicitly says it is not a substitute for the server adapter, tenant authorization or expert review. Header parity is tested, but header parity alone does not guarantee semantic parity with database constraints and adapter behavior.

**Required correction:** add contract-level fixtures proving that accepted intake rows map to exactly the intended canonical observations/contexts/economics; rejected or ambiguous rows must not become analysis-eligible. Include cross-file factory/asset identity, units, duplicate source identity across each evidence class, zero versus blank, non-finite/negative values, date effectiveness and role/metric overlap behavior. Keep validation logic single-sourced where practical; avoid maintaining contradictory rule lists.

### P1 — Economic-context provenance and effective selection must be proven, not inferred
The engine accepts tariff, recoverable fraction, intervention cost and currency; the adapter reads the `analysis_loop` metadata contract. PR #10 correctly removes the INR fallback when no economic context exists. The next issue is broader: tests must show that the chosen context is effective for the analysis timestamp and period, currency is consistent with the INR-specific tariff field, required values are finite and in range, and missing versus explicit zero has intentional semantics. A tariff value of zero must not be confused with a blank field simply because it is falsy.

**Required correction:** one documented economic contract and regression tests for missing, zero, malformed, expired, future-effective, overlapping and conflicting contexts. Financial outputs must preserve source context ID/name/effective interval and assumptions. Quantified value remains an estimate, never verified savings.

### P1 — The evidence contract must agree across templates, validator, adapter, DB and engine
The adapter accepts explicit roles and maps canonical metrics; the analysis loop expects energy, production, operating hours and comparability context. The local validator has its own role/unit/quality checks. These boundaries need executable parity tests, not only similar wording.

**Required correction:** publish a field-by-field contract table with allowed role/metric/unit/quality/origin, timestamp and interval semantics, source ID uniqueness, zero/missing/invalid rules, context scope/coverage and economics effectiveness. For each rule, point to the enforcing layer and test. If a rule is not enforced, state that explicitly.

### P1 — Security assurance needs current, repeatable proof
The server path is designed to authenticate the caller, check factory/organization membership before service-role reads, bound requests, and persist append-only runs. A prior migration replay has tested tenant isolation and direct-table denial, but those historical results do not replace a run on the current SHA or live authorization proof. The recorded live state had no active memberships at the time.

**Required correction:** clean migration replay and security/HTTP integration tests must pass on the exact candidate SHA. Live access must be validated with two distinct users/tenants and read-only diagnostics before any authorized write. Never use service-role credentials in the browser or bypass RLS to “make the demo work.”

### P2 — Test success can be mistaken for physical or commercial validation
Synthetic fixtures demonstrate deterministic behavior only. The known synthetic example (₹4,000 gross, ₹2,000 recoverable, ₹1,500 net) is not a factory result. The uploaded comparison's ratings (overall 5.5/10, intelligence 3/10, financial credibility 3.5/10, security 4/10, commercial validation 1/10) are engineering judgments, not measured benchmarks.

**Required correction:** label synthetic/demo outputs visibly; measure precision against independently adjudicated findings; record false positives and exclusions; have a plant/energy engineer review evidence and assumptions before recommendations reach an operator.

### P2 — Verification loop is described more clearly than it is demonstrated
The project direction correctly distinguishes a detected deviation, an estimated opportunity, an implemented intervention and verified savings. The reviewed evidence does not demonstrate a complete post-intervention counterfactual/M&V workflow for a real factory.

**Required correction:** define the intervention record, owner, start date, cost, operating changes, comparable post-period, adjustment factors, calculation, reviewer and evidence attachment before making verified-savings claims.

## PR state and what it means

Snapshot from the reviewed GitHub state:

- **PR #7 — missing-vs-zero in monthly CSV:** merged as `e77a65266ec557f1203695d9ad0786ae57bc46e8`; this improves the legacy monthly evidence path only.
- **PR #8 — real-factory data request:** merged as `6a9aefc2484edf50be7a860322f3def4c4156405`; this is a pilot operations artifact, not factory evidence.
- **PR #9 — local pilot intake validator:** open, under review; changes now include extra-column handling and period coverage blockers. Intake-specific tests, CI and Quality Gate passed on the latest checked head; Migration Replay was still running at refresh time. Recheck before merge.
- **PR #10 — no implicit currency default:** merged as `fb02cf8323c72ff215985770865d4fde497b7a3e`; this removes an unsupported currency assumption, but does not validate real economics.

Merge decisions must follow code review and current checks on the exact head SHA. A merge is not proof of live readiness.

## One corrective sequence — execute in this order

### Gate 1 — Freeze and name the authoritative path
1. Keep the deterministic shared analysis loop as the only calculation implementation for authoritative persisted findings.
2. Define the authoritative flow: authorized user → factory/asset selection → source intake → canonical records → adapter → engine → immutable analysis run → reload/recompute → human review → intervention tracking → M&V.
3. Label the monthly CSV route as preliminary screening unless and until it is explicitly connected to that same evidence and persistence contract.
4. Publish one ownership table for every field and validation rule.

**Exit condition:** no ambiguity about which pipeline powers each user-facing result.

### Gate 2 — Contract and adversarial tests
1. Compare the intake validator, all three templates, canonical adapter, database schema constraints and engine inputs rule by rule.
2. Test blank vs zero, negative/non-finite numbers, unsupported roles, different metrics sharing a role, duplicate source IDs across all input classes, timezone/interval overlap, context coverage, asset/factory mismatch, estimated evidence, stale/invalid quality, and economic context effective intervals.
3. Test that missing evidence blocks claims instead of defaulting; ensure no false positive from an ambiguous mapping.
4. Add mutation/adversarial tests where a plausible but wrong input must be refused.

**Exit condition:** every material rule has an enforcing layer and a regression test.

### Gate 3 — Reproducible secure execution
1. Run typecheck, lint, unit tests, production build, Deno checks, clean migration replay, tenant isolation/direct-table denial, and authenticated Edge Function HTTP integration on one exact SHA.
2. Verify idempotency, immutable source snapshots, reload/recompute fingerprints and error/refusal behavior.
3. Record actual job results, not just status summaries; separate Vercel quota failures from code failures.

**Exit condition:** all required checks pass on the same candidate commit.

### Gate 4 — Controlled real-data pilot
1. Refresh the read-only live readiness report.
2. Obtain real records with consent and a controlled transfer process; do not put sensitive source files into a public repo.
3. Use the PR #8 request: at least six months requested, twelve preferred; match energy, production and operating conditions for the selected boundary.
4. Have a qualified reviewer inspect data quality, units, meter scope, product/shift changes and economic sources.
5. Run one bounded analysis; save the immutable run; reload and recompute; review every exclusion, assumption and finding with an independent engineer.

**Exit condition:** one finding is defensible from source record to result, or the system correctly refuses to quantify it.

### Gate 5 — Action and verification
1. Track the selected intervention, owner, cost, dates and operational changes.
2. Collect comparable post-intervention evidence and adjust for production/product/operating differences.
3. Have a reviewer approve the M&V method and calculation.
4. Report estimated, implemented and verified value as separate states.

**Exit condition:** one opportunity reaches an independently reviewed verification outcome, including a documented “no savings proven” result if evidence does not support savings.

### Gate 6 — Repeatability and commercialization
Only after the first verified pilot, test the same workflow on a second materially different factory. Document what is factory-specific, what is reusable, onboarding effort, analyst time, false-positive rate, data completeness, and the customer's willingness to pay. Scale only after the process is repeatable.

## Stop doing these things for now

- Stop adding dashboard polish, generic features or extra AI layers before Gates 1–3 pass.
- Stop treating draft PRs or old green workflow runs as release proof.
- Stop using synthetic results as evidence of customer savings or commercial validation.
- Stop treating nameplate power, plant-level bills, or a generic tariff range as asset-level evidence without a defensible allocation.
- Stop inventing defaults for currency, tariff, recovery, cost, operating context, units, missing values or calibration.
- Stop treating “structurally valid intake” as “analysis-ready.”
- Stop calling deviations root causes, recommendations implemented, or estimates verified savings.
- Stop production migrations, deployments, auth changes or data writes until explicit authorization and the readiness gate are satisfied.

## Operating dashboard for project decisions

Track these as gates, not vanity metrics:

1. **Data readiness:** source coverage by role and period; estimated/missing/stale/conflicting shares; traceable source IDs.
2. **Analysis validity:** accepted/excluded baseline periods and reasons; mapping/context issues; reproducibility after reload.
3. **Economic defensibility:** effective economic source, currency, tariff, recovery fraction and intervention cost all evidenced.
4. **Security:** authorized membership, cross-tenant negative tests, append-only persistence.
5. **Engineering readiness:** all required checks on the same SHA and clean migration replay.
6. **Expert validation:** independent adjudication, false positives, missed opportunities, uncertainty.
7. **Outcome proof:** action tracked and post-intervention M&V completed.
8. **Commercial evidence:** second-factory repeatability, onboarding cost and customer willingness to pay.

## Bottom line

The strategic direction remains coherent. The current failure mode is **premature parallelization**: several useful components are being improved, but the single authoritative path has not yet been proven from real source data through independently reviewed, verified economic outcome. Align contracts and release gates first; then finish one real pilot before expanding the product.

## Competitive bar — outperform a conventional on-site assessment

**Commercial thesis:** GridMind must not compete on “AI” or prettier reporting. It must outperform a conventional engineer-led assessment on a defined set of jobs while preserving the engineer's physical inspection, process knowledge, and safety judgment. Software cannot infer physical conditions that are absent from its evidence.

### The target operating model

1. **See more continuously:** join authorized energy, production, operating-state, tariff, maintenance and equipment evidence across time, rather than rely only on a periodic visit. Missing feeds must be explicit.
2. **Diagnose more rigorously:** detect deviations and rank plausible explanations using operating context, but label these as hypotheses until corroborated by measurements, inspection, or a qualified reviewer.
3. **Quantify defensibly:** calculate the economic significance only from traceable, period-appropriate tariffs, comparable baselines and documented assumptions. Separate observed facts, inferred hypotheses, estimated opportunity and realized outcome.
4. **Prioritize better:** rank next investigations/actions by expected value, confidence, implementation cost, downtime, safety/quality risk, feasibility and evidence gaps—not savings estimate alone.
5. **Close the loop:** assign an owner, record the intervention and its cost, collect comparable post-action evidence, and verify whether the result persisted.
6. **Learn across sites responsibly:** reuse methods and anonymized patterns only where contracts, consent, data rights and context permit; never assume one factory's operating relationships transfer to another.

### Head-to-head acceptance scorecard

For each pilot, compare GridMind plus the plant expert against the plant's existing assessment process. Record the conventional baseline first; do not manufacture a favorable comparison.

- **Coverage:** proportion of relevant assets/processes and periods with usable, traceable evidence.
- **Time to a defensible finding:** elapsed analyst time and calendar time, including data cleaning and review.
- **Finding quality:** independent expert adjudication of true positives, false positives, missed material issues and unsupported causal claims.
- **Economic accuracy:** difference between pre-action estimate and independently measured outcome, with uncertainty and operating-condition normalization.
- **Actionability:** proportion of findings accepted for investigation, rejected with reasons, or converted into approved interventions.
- **Verification:** proportion of implemented actions with adequate post-action evidence and an independently reviewed result.
- **Repeatability:** onboarding effort and performance on a second materially different site.
- **Trust and usability:** plant-team agreement that evidence, assumptions, uncertainty and next steps are understandable and auditable.

Set thresholds with the pilot customer before examining results. A faster report is not a win if it misses important problems or creates false positives. Do not claim GridMind beats an engineer until the blinded or independently adjudicated comparison supports that claim.

### Product capability ladder

- **Level 1 — Evidence integrity:** authorized data access, source lineage, unit/period/quality checks, explicit insufficiency, reliable persistence.
- **Level 2 — Context-aware screening:** comparable-period analysis with production, operating-state and tariff context; explainable exclusions and uncertainty.
- **Level 3 — Engineer-grade investigation support:** competing hypotheses, the measurements/inspection needed to discriminate between them, and qualified human review. This level requires industrial domain expertise and validated methods, not merely generated text.
- **Level 4 — Verified economic outcomes:** tracked interventions, normalized measurement and verification, and evidence separating forecast value from realized savings.
- **Level 5 — Continuous multi-site intelligence:** reliable connectors, drift/data-quality monitoring, site-specific calibration, secure fleet comparisons, and learning from verified outcomes.

The next target is **not Level 5**. Prove Level 1 end-to-end and one narrow Level 2/3 use case with a real factory, then measure against the existing engineer-led process. Do not imply the current product has reached a level merely because code or a UI exists.

### Immediate execution target

Within the first controlled pilot, select one asset/process and one costly recurring question; obtain authorized source records and expert access; define a baseline assessment; run the same case through GridMind; compare findings independently; investigate the strongest candidate physically; and, only if the factory approves an intervention, measure the post-action result. The pilot succeeds if it produces a defensible, useful decision—or correctly refuses an unsupported claim—and establishes whether the workflow deserves a paid repeat engagement.
