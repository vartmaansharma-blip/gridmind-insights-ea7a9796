> [!IMPORTANT]
> **Status: HISTORICAL SNAPSHOT — NOT A CURRENT EXECUTION AUTHORITY (reviewed 2026-10-13).** This document is preserved for context and evidence. Its dated ratings, status claims, recommendations, and next steps may be stale; do not treat them as current instructions or proof of present readiness. Follow the [canonical Master Plan](gridmind-master-plan-2026-10-11.md), [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and current linked GitHub issues for present decisions and blockers. No historical findings below have been deleted or rewritten.

# GridMind Phase 3 — canonical data integrity and reproducible analysis

**Decision date:** 2026-10-10  
**Status:** Execution started; scope and acceptance gates are defined. No completion claim is implied by this document.  
**Branch:** `phase-3/data-integrity-reproducibility`  
**Dependencies:** Phase 1 correction is merged; Phase 2 schema hardening is applied to Supabase. Phase 1 deployment acceptance and several Phase 2 production checks remain open.  
**Authority:** The [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) governs conflicts. This phase is subordinate to its security, evidence, and human-approval rules.

## 1. Why this phase comes next

The system needs more than safe database permissions. It must also prove that an industrial result was derived from the correct source records, the correct asset and period, the right operating context, a versioned calculation, and a repeatable persisted snapshot. If any link is ambiguous, the correct behavior is to flag or refuse the conclusion—not to silently guess.

Phase 3 therefore builds the **evidence-to-result integrity chain**. It does not expand the product into more dashboards, add speculative integrations, or claim industrial accuracy before evaluation.

## 2. First-principles objective

For every material result, GridMind should be able to answer:

1. **What exactly was measured?** Source ID, asset/process mapping, unit, quality state, observed interval, and provenance.
2. **Was it comparable?** Time boundaries, production denominator, operating state, product mix, exclusions, and context version.
3. **How was it transformed?** Deterministic algorithm/version, conversion rules, assumptions, and validation warnings.
4. **Can it be reproduced?** The same canonical input snapshot and calculation version reproduce the same output after reload.
5. **What does it justify?** A finding, a provisional hypothesis, or an explicit insufficient-evidence result—never a stronger claim than the inputs support.
6. **What happened next?** If an intervention is approved, its actual implementation timestamp, owner, evidence, cost, and separately verified outcome.

## 3. Phase 3 workstreams

### P0 — close inherited release gates (parallel prerequisite work)

**Phase 1**
- Confirm the exact commit served by Vercel; do not infer deployed state from a successful GitHub merge.
- Run sign-in, workspace selection, save/reload, analysis, and route smoke tests against that deployment.
- Add a regression test for the intervention-date projection and decide whether an undated legacy intervention should be hidden, shown as “date not recorded,” or represented as unknown. Never substitute the current month.
- Keep the deployed SHA, environment, timestamp, routes tested, results, and failures in the Phase 1 baseline.

**Phase 2**
- Enable Supabase Auth leaked-password protection after checking the user-facing password/reset behavior.
- Execute authorized production negative tests using two legitimately provisioned test accounts and separate workspaces. Test direct REST access as well as UI visibility for factories, assets, observations, analysis runs, interventions, and outcomes.
- Complete a table-by-table matrix of RLS predicates, SELECT/INSERT/UPDATE/DELETE grants, relationship constraints, edge-function authorization, and SECURITY DEFINER function ACL/search-path behavior.
- Verify workspace bootstrap when the user belongs to zero, one, and multiple organizations; remove any ambiguous “first organization” behavior or document a deliberate, tested selection rule.
- Re-run effective privilege and policy inventory after changes. Record each finding as observed, fixed, retested, or accepted with rationale.

**Gate P0:** no unresolved known cross-tenant read/write path in the defined acceptance suite; deployed commit identified; no critical security finding left without an explicit stop/mitigation decision. These tests reduce risk but are not a security certification.

### P1 — intervention lifecycle truth (first implementation target)

The prior correction stopped inventing `implementedMonth`, but an empty string is only a temporary compatibility behavior. The canonical data model needs a real timestamp and explicit lifecycle semantics.

- Inspect the current canonical intervention table, repository types, UI projection, migrations, and test fixtures before designing a schema change.
- Add a nullable, timezone-aware `implemented_at` field to the canonical intervention record, with a migration that preserves existing rows as unknown rather than backfilling guessed dates.
- Keep approval time, planned date, implementation time, and verification time distinct. Do not overload one timestamp for several events.
- Validate lifecycle transitions: proposed → approved/rejected → implemented (if approved) → outcome pending/verified. Permit legitimate exceptions only when documented.
- Show unknown legacy implementation dates honestly in the UI; do not silently sort them as if they happened in the current period.
- Ensure the value persists through save/reload and is included in canonical repository mappings and generated types.
- Add regression tests for null/unknown date, valid timestamp, timezone boundaries, month boundaries, rejected/not-implemented interventions, and reload consistency.
- Do not mark an intervention implemented solely because an estimated saving exists.

**Gate P1:** no synthetic lifecycle timestamps; migration replay passes; old rows are preserved; UI and canonical API represent unknown dates honestly; tests prove round-trip persistence.

### P2 — define a versioned analysis input contract

- Identify one canonical analysis input snapshot. It must reference immutable/source observation IDs or stable content hashes, source mappings, time interval, operating context, economic context, exclusions, and data-quality status.
- Record the analysis algorithm/version and the exact input snapshot/version used for each persisted run.
- Reject ambiguous joins: overlapping periods, duplicate role/period observations, conflicting equally ranked operating contexts, incompatible units, missing denominators, stale data, and invalid numeric values.
- Preserve the difference between a measured zero, a missing value, an estimated value, and an invalid value.
- Do not impute, infer units, allocate factory-level data to an asset, or fill missing timestamps without an explicit reviewed rule.
- Add idempotency and concurrency tests so retries cannot create contradictory duplicate runs or overwrite newer snapshots silently.
- Keep raw source evidence immutable; corrections should be append-only or explicitly versioned, not silently overwrite the original fact.

**Gate P2:** every material result can be traced to a canonical source snapshot and algorithm version; invalid/ambiguous fixtures refuse or flag explicitly; deterministic reference cases pass.

### P3 — reproducibility and independent verification

- Test the same input snapshot across browser and edge analysis paths; they must agree within a defined numeric tolerance or fail visibly.
- Test save → reload → recompute → compare, including timezone, unit conversion, missing data, stale data, and concurrent writes.
- Independently recompute a sample of outputs using a second implementation or a manually reviewed calculation sheet.
- Persist a reviewable record of input hash, algorithm version, result hash, warnings, and reviewer decision. Avoid storing secrets or unnecessary sensitive source payloads in logs.
- Separate calculation correctness from causal attribution: reproducible analysis does not prove that GridMind caused savings.
- Track defect metrics: invalid input caught, unsupported finding refused, reproducibility mismatch, duplicate/stale run, reviewer disagreement, and time to diagnose.

**Gate P3:** repeatable tests cover representative positive, negative, missing, ambiguous, and boundary cases; no silent mismatch; reviewers can reconstruct a result from the recorded evidence.

### P4 — evidence-quality dashboard for engineering, not marketing

Build a small internal quality report before a customer-facing score:
- required-input completeness;
- provenance/source coverage;
- valid-period and context coverage;
- mapping review status;
- refusal and warning counts;
- deterministic reproduction pass rate;
- expert-reviewed finding precision/recall once independently adjudicated cases exist.

Do not collapse these into one “AI accuracy” score. Do not publish accuracy, savings, or ROI claims from synthetic fixtures or a handful of unrepresentative cases.

**Gate P4:** metric definitions, denominators, missing-data treatment, case inclusion/exclusion, and reviewer process are documented before displaying any percentage.

## Execution log — first implementation slice

**Merged to `main`; deployment remains unverified:**
- Added migration `20261010140000_add_intervention_implemented_at.sql` with nullable `timestamptz`. Existing rows remain NULL; there is no guessed backfill or default.
- Added `implemented_at` to generated database types and the canonical intervention domain contract.
- Updated the repository query to load the canonical timestamp.
- Replaced the previous always-empty timeline projection with a timezone-aware projection based only on the recorded instant and the factory timezone. Missing/invalid timestamp or timezone remains unknown and is not shown as a fabricated month.
- Added unit tests for missing timestamps, timezone month boundaries, invalid timestamps, and invalid timezones.
- Added migration-replay schema assertions that `implemented_at` is nullable, uses `timestamp with time zone`, and has no default.

**Verified on 2026-10-10:** PR [#23](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/23) was merged by squash as `5853cbbbee697bc8b780937e7892d88491cccbc0`. On the reviewed PR head `f4ee8d9ef959ada7eb24c743acceee57213c4f02`, [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38046877112), [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38046877120), and [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38046877096) all passed. A new post-merge main-branch migration replay was started as run [38050619929](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38050619929) and was still in progress at the last check. The new migration has not been applied to production.

**Still unverified:** exact deployed UI behavior and a complete intervention status-transition workflow. This is a narrow first slice, not completion of Phase 3.

## 4. Execution order

1. Re-read current source and migration state; write a short file-by-file implementation map.
2. Complete the inherited P0 checks that can be safely verified now; clearly separate blocked live tests from completed repository tests.
3. Implement P1 timestamp semantics with migration, type updates, UI behavior, and focused regression tests.
4. Implement P2 input snapshot/version contract only after mapping current persistence behavior.
5. Add P3 reproducibility and concurrency tests; fix defects exposed by them.
6. Create the P4 internal quality report only after its measures have reliable denominators.
7. Run CI, Quality Gate, clean migration replay, schema/tenant tests, and live acceptance where authorized.
8. Update the Phase 1/2 records and this document with commit SHAs, exact test evidence, unresolved risks, and the next decision.

## 5. Out of scope

- New marketing pages, animations, speculative AI agents, or broad feature expansion.
- Automatic operational control or unapproved procurement actions.
- Public savings, ROI, accuracy, or “works for every factory” claims.
- Cross-customer learning without explicit rights, consent/contract basis, and suitable confidentiality controls.
- Fabricating customer datasets or using production customer data in tests without authorization.

## 6. Exit criteria

Phase 3 is complete only when all of the following are evidenced:

- [ ] Intervention lifecycle timestamps are schema-backed, honest for legacy records, and covered by regression tests.
- [ ] Canonical analysis inputs are versioned and traceable to source IDs/hashes, periods, units, context, and algorithm version.
- [ ] Save/reload/recompute produces reproducible outputs for the defined acceptance suite.
- [ ] Invalid, incomplete, stale, conflicting, or non-comparable inputs fail closed or produce a clearly provisional result.
- [ ] CI, Quality Gate, and clean migration replay pass on the final commit.
- [ ] No unresolved high-severity defect is silently waived.
- [ ] Phase 1 deployment and Phase 2 security blockers are closed or explicitly separated as release blockers with owners and retest plans.
- [ ] A human reviewer can independently reconstruct at least one bounded result from original evidence.

## 7. Decision log

- **Previous state:** Phase 1's invented implementation month was removed; Phase 2 corrected organization-membership RLS, revoked unnecessary structural table privileges, and explicitly scoped the membership UPDATE policy. Schema checks confirmed RLS on all 42 public base/partitioned tables and no audited app-role structural privileges on those tables.
- **Change now:** Phase 3 prioritizes trustworthy evidence, lifecycle timestamps, versioned input snapshots, and reproducibility before broader features.
- **Why:** a secure system can still produce a wrong industrial conclusion if source mapping, periods, context, or persistence are incorrect.
- **Trade-off:** slower visible feature velocity in exchange for lower risk of false conclusions and a defensible path to customer review.
- **Known blockers:** Vercel deployed-SHA verification, Supabase Auth leaked-password protection, authenticated two-user production API isolation, complete semantic policy/grant review, and ambiguous multi-organization selection behavior.
- **Next decision:** refresh inherited Phase 1/2 release gates, then implement P2 canonical input snapshot integrity after reviewing the existing adapter and persisted-run contract. No production migration is authorized by this plan alone.

## Execution log — input snapshot integrity slice

**Implemented on branch; not yet merged or deployed:**

- Added nullable `input_snapshot_sha256` to persisted analysis runs. Historical records remain NULL; no hash is invented for legacy data.
- The persistence Edge Function computes SHA-256 over the canonicalized exact `AnalysisInput` snapshot at write time.
- Verification recomputes the digest from the stored snapshot and exposes `inputSnapshotIntegrity`; a missing/mismatched digest cannot be reported as reproducible.
- Added clean-migration schema assertions for the nullable digest and its format constraint, plus authenticated integration assertions for the stored/recomputed digest.
- SHA-256 detects accidental divergence and supports auditability. It is **not** a digital signature and cannot prove resistance to a privileged database administrator who can alter both data and digest.
- No production migration has been applied. Merge requires CI, Quality Gate, migration replay, and end-to-end authenticated integration tests to pass on the exact final commit.


## Execution log — cryptographic snapshot integrity merged

**Merged to `main` on 2026-10-11:** PR [#25](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/25) was squash-merged as `beb16d9a45e5ecf9e5c6b95296a96762016ac171` from reviewed head `c60aaf0ad990b96aafd9779a5f27d613ef5873a5`.

- CI run [38050989130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38050989130), Quality Gate run [38050989141](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38050989141), and Migration Replay run [38050989147](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38050989147) completed successfully on the exact reviewed PR head. The migration replay included the schema contract, tenant isolation/direct-table denial/append-only tests, authenticated Edge Function integration, and no-pending-local-migrations check.
- The nullable `input_snapshot_sha256` column and canonical SHA-256 verification are now in repository `main`; historical rows intentionally remain NULL and therefore cannot be certified reproducible by this digest check.
- **Not deployed:** the migration has not been applied to production, and the Vercel deployment quota failure remains a separate live-release blocker.
- **Next test gap:** add explicit negative-path coverage for a missing legacy digest and a mismatched digest/snapshot. Because the application table is append-only, tampering simulation must be confined to an isolated local test fixture or a pure integrity-verification unit test; do not weaken production append-only rules for testing.
- Continue inherited Phase 1/2 gates in parallel: identify deployed SHA, smoke-test auth/workspace/save/reload/analysis, complete semantic tenant-isolation tests, and resolve leaked-password protection and multi-organization selection behavior. Do not call Phase 3 or production readiness complete yet.
