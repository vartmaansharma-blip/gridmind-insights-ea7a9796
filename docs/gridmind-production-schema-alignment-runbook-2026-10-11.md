# GridMind production schema alignment and release gate — 2026-10-11

**Status:** Preflight confirmed a production/repository schema mismatch. This document is an execution runbook, not authorization to mutate production.
**Environment:** Supabase project `bvqmvgbfqhgczwbvlqkk`; Vercel project `gridmind`.
**Authority:** Follow the GridMind Decision Constitution and the Phase 1, 2, and 3 trackers. Security, evidence integrity, and human approval override release pressure.

## 1. Decision

**NO-GO for declaring production-ready. NO production migration was applied in this run.**

The production migration inventory ends at `20261010104942 scope_membership_update_policy`. A read-only `information_schema.columns` query returned no rows for either expected Phase 3 column:

- `public.asset_interventions.implemented_at`
- `public.factory_analysis_runs.input_snapshot_sha256`

Repository migrations that have passed clean migration replay are not automatically applied to the live database. The application code now expects the input digest field when persisting/verifying analysis runs, so deployment readiness alone cannot establish application/database compatibility.

## 2. Confirmed facts vs. unverified assumptions

### Confirmed in this preflight
- Production Supabase migration inventory ends at `20261010104942`.
- Neither of the two Phase 3 columns above was found by the read-only information-schema query.
- No production DDL or data change was performed.
- The Vercel deployment previously observed as READY is not evidence that production database schema or authenticated flows are correct.

### Not yet established
- Whether all migration preconditions and constraints match the current live schema.
- Whether the deployed application fails on the missing digest column in every path; verify with a controlled authenticated smoke test rather than infer the exact user-visible failure.
- Whether a safe rollback of additive DDL would be appropriate after any data has been written.
- Whether all RLS relationships and edge-function paths pass two-user tenant-isolation tests.
- Whether leaked-password protection and multi-organization workspace selection are correctly configured/behave.

## 3. Required pre-migration checks

Run and save results before any production DDL:

1. Confirm the target project ID and environment in the Supabase dashboard; ensure no preview/local project is mistaken for production.
2. Capture current migration inventory and schema metadata for:
   - `public.asset_interventions` (all columns, types, nullability, defaults, constraints, indexes, triggers, policies, grants);
   - `public.factory_analysis_runs` (same, especially `input_snapshot`, idempotency uniqueness, append-only enforcement, result fingerprint fields).
3. Read both repository migrations in order and compare them with the actual schema:
   - `supabase/migrations/20261010140000_add_intervention_implemented_at.sql`
   - `supabase/migrations/20261010150000_add_analysis_input_snapshot_sha256.sql`
4. Verify migration replay passed on the current reviewed commit, not only on a prior branch head.
5. Establish a maintenance window or low-traffic window, a named operator, a second-person reviewer, a written stop condition, and a tested recovery path. Do not disable RLS, append-only guards, or tenant policies to make the migration pass.
6. Confirm a database backup/restore point and retention before changes. A schema rollback is not a substitute for restoring data if post-migration writes occur.
7. Do not backfill guessed timestamps or hashes. Existing `implemented_at` and `input_snapshot_sha256` values must remain NULL unless a valid source record exists and a separately reviewed backfill is justified.

## 4. Controlled migration sequence — only after explicit production-change authorization

1. Apply the repository migrations through the approved Supabase migration workflow, in timestamp order. Do not hand-edit the production schema outside the migration history.
2. Verify the recorded migration versions and the actual column definitions immediately afterward.
3. Verify constraints/defaults:
   - `implemented_at` is nullable `timestamptz`, with no default;
   - `input_snapshot_sha256` is nullable text, with no default, and accepts NULL or `sha256:` followed by exactly 64 lowercase hexadecimal characters.
4. Verify old records remain intact and both new fields are NULL for historical rows unless explicitly supported evidence says otherwise.
5. Re-run effective grants, RLS policy, append-only trigger, and tenant-isolation inventory. The additive migration must not weaken existing security controls.
6. If any unexpected schema/data change occurs, stop further release activity, preserve logs, and use the approved recovery plan. Do not improvise a destructive rollback.

**Authorization boundary:** this runbook does not itself authorize production migration. Do not execute DDL merely because a checklist exists.

## 5. Post-migration acceptance tests

All tests must use the intended production deployment and legitimately provisioned test accounts/data. Record timestamp, deployed Git SHA, project/environment, route, actor, expected result, actual result, and evidence.

### Database and compatibility
- [ ] Both migrations appear in production migration inventory.
- [ ] Both columns match exact nullability/type/default/constraint requirements.
- [ ] Existing rows are preserved; no invented timestamps/digests.
- [ ] Append-only semantics and RLS/grants remain effective.
- [ ] No unexpected pending migration or schema drift remains.

### Application flow
- [ ] Confirm exact Vercel production deployment SHA.
- [ ] Sign in as authorized test user A.
- [ ] Select the correct workspace; test zero, one, and multiple organization memberships where fixtures permit.
- [ ] Load the factory route and inspect assets/observations.
- [ ] Persist an analysis run, reload it, and verify the stored input digest equals the recomputed digest.
- [ ] Retry the same idempotency key; the same run must be returned.
- [ ] Reuse the same key for a different asset; the request must be rejected.
- [ ] Missing legacy digest must not be called reproducible.
- [ ] Mismatched digest/snapshot must fail integrity verification in an isolated fixture/unit test; do not mutate production append-only rows to simulate tampering.
- [ ] Confirm the intervention implementation date remains unknown when NULL and projects by the factory timezone only when a real timestamp exists.
- [ ] User B cannot read or mutate user A's factory, assets, observations, runs, interventions, or outcomes through either UI or direct API.
- [ ] Unauthenticated requests and direct table access to protected analysis runs remain denied.
- [ ] Run the defined sign-in, workspace, save/reload, analysis, and route smoke suite.

### Release decision
- **GO:** all critical checks pass on the exact deployed SHA; schema matches; no unresolved high-severity tenant-isolation or data-integrity issue; evidence is attached to the trackers.
- **HOLD:** any critical test is unrun, inconclusive, or blocked by access/tooling.
- **ROLL BACK / INCIDENT REVIEW:** unexpected data mutation, cross-tenant access, loss of persisted evidence, or critical integrity failure. Follow the recovery plan; do not improvise.
- A successful smoke suite reduces risk but is not a security certification or proof of industrial decision accuracy.

## 6. Next execution order

1. Complete the missing legacy-digest and mismatched-digest pure/unit tests on a feature branch.
2. Finish a full semantic RLS/grants/relationship/edge-function audit and two-user acceptance plan.
3. Resolve Auth leaked-password protection and multi-organization workspace selection.
4. Obtain explicit authorization for the production migration window and named reviewer.
5. Apply the migrations using the approved workflow; run all post-migration acceptance tests.
6. Update Phase 1/2/3 trackers with exact SHA, timestamps, evidence, failures, owners, and retest status.
7. Only then decide whether the live engineering release gate is closed. Customer validation and independently reviewed factory evidence remain separate product-market/value gates.


## 7. Read-only discrepancy reconciliation — 2026-10-11

**Finding: repository migrations exist, but the recorded production migration history stops before them.** This is the directly supported cause of the observed version/schema mismatch; the available evidence does not establish why the migrations were not applied (for example, skipped, blocked, or applied to a different environment).

| Contract | Repository evidence | Production evidence in the 2026-10-11 snapshot | Conclusion |
|---|---|---|---|
| `public.asset_interventions.implemented_at` | Migration `supabase/migrations/20261010140000_add_intervention_implemented_at.sql` adds nullable `timestamptz` with no default. | Migration inventory ended at `20261010104942 scope_membership_update_policy`; read-only `information_schema.columns` lookup returned no matching column. | Migration version `20261010140000` is later than the recorded live head and is not evidenced as applied in production. |
| `public.factory_analysis_runs.input_snapshot_sha256` | Migration `supabase/migrations/20261010150000_add_analysis_input_snapshot_sha256.sql` adds nullable text, constraining non-NULL values to `sha256:` plus 64 lowercase hex characters. | Same recorded live head; read-only column lookup returned no matching column. | Migration version `20261010150000` is later than the recorded live head and is not evidenced as applied in production. |

### Why this matters
- The intervention timestamp migration preserves historical uncertainty: existing records remain NULL; no timestamp should be inferred from status, creation date, or today's date.
- The analysis persistence function selects `input_snapshot_sha256` as part of its run contract. A missing column can break affected persistence/read paths; exact user-visible failure must be confirmed by controlled testing, not guessed from the schema observation alone.
- The generated TypeScript database types already include `asset_interventions.implemented_at` and the function contract names `input_snapshot_sha256`; code/type presence is not evidence of production DDL.

### Safe remediation path — prepared, not authorized/executed
1. Reconfirm project ID and environment and capture a fresh migration inventory and full table metadata immediately before the change; the earlier snapshot is dated evidence, not a live guarantee.
2. On a reviewed branch/current commit, run migration replay and inspect both migrations, the surrounding schema, constraints, indexes, triggers, grants and RLS. Resolve any drift before production.
3. Have an authorized project operator and independent second reviewer approve the exact migration SHAs, low-traffic window, tested recovery/restore point, monitoring and written stop conditions.
4. Apply the two migrations in timestamp order through the approved Supabase migration workflow only. Do not run ad-hoc DDL, disable RLS/append-only controls, or invent backfills.
5. Verify migration history and exact column definitions; confirm existing rows are preserved and both new fields remain NULL for historical rows absent valid source evidence.
6. Run analysis digest creation/recomputation, idempotent retry, conflicting-key rejection, null legacy digest handling, intervention date projection, and isolated two-user tenant-isolation tests. Record candidate SHA and evidence.
7. If inventory, definitions, data, constraints, or security behavior differ from expectation, stop and follow the approved recovery plan. Do not improvise a destructive rollback.

**No production migration, setting change, deployment, or data mutation was performed as part of this read-only reconciliation. Production remains NO-GO until the authorized remediation and acceptance tests pass.**
