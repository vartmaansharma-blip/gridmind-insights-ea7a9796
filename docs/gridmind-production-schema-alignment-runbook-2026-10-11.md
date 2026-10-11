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


## 8. Fresh read-only production recheck — 2026-10-11 (execution follow-up)

A fresh read-only Supabase check was performed after the earlier repository documentation update.

- Project ID confirmed: `bvqmvgbfqhgczwbvlqkk`; project status `ACTIVE_HEALTHY`; region `ap-south-1`; PostgreSQL 17.11.
- Current migration inventory now includes `20261011062242 harden_public_default_table_privileges` and `20261011062256 add_factory_analysis_run_fk_indexes`. Therefore the earlier report's production migration head `20261010104942` was stale by this follow-up.
- The latest live migration version observed is `20261011062256`, still earlier than repository migrations `20261010140000_add_intervention_implemented_at.sql` and `20261010150000_add_analysis_input_snapshot_sha256.sql` when comparing their intended migration chronology.
- A fresh `information_schema.columns` query again returned zero rows for both `asset_interventions.implemented_at` and `factory_analysis_runs.input_snapshot_sha256`.

**Updated conclusion:** the two expected columns are still absent in the currently inspected project, and the migration inventory does not show the two corresponding repository migrations as applied. This confirms the schema gap is still present; it does not reveal why those migrations were not applied. Before production change, reconcile timestamp/name conventions against the complete current repository migration directory and Supabase migration history to avoid version-order mistakes. Do not infer safety from the earlier stale migration head.

No production migration or other mutation was performed. Continue to require fresh preflight, reviewed exact migration content, backup/recovery point, authorized operator, independent reviewer, and stop conditions before applying any DDL.


## 9. Correction to earlier cause wording after fresh migration inventory

The fresh inventory shows live migrations `20261011062242` and `20261011062256`, which are later than the repository migration versions `20261010140000` and `20261010150000`, while the two expected columns remain absent. Therefore this is **not accurately described as a simple production migration head lag**. The current evidence is more precisely an **out-of-order/missing migration-history or schema-drift discrepancy**: later migration versions are present, but these earlier repository migrations and their columns are absent. The exact mechanism (migration files omitted from an applied release, history manipulation, manual drift, or another cause) is not established by the available evidence.

Before remediation, the authorized operator must compare the complete migration directory and recorded production history, verify the current branch/commit and migration naming, and determine whether the migration runner will attempt the two earlier versions safely. Do not blindly apply migrations or insert migration-history rows manually. If the normal runner cannot safely reconcile this gap, stop and prepare a reviewed, explicit reconciliation plan with the database owner and independent reviewer. Preserve migration history; do not bypass it.


## Exact repository-to-live migration reconciliation — 2026-10-11

A direct read-only comparison of the full `supabase/migrations/` directory with the live Supabase migration inventory was completed. It found **33 SQL migration files in GitHub and 30 recorded migration entries in production**. Comparing only the newest timestamps was insufficient and the earlier notes did not fully describe the mismatch.

### Findings

1. **Repository file with no corresponding live migration entry by filename prefix:** `20261006030000_gridmind_rls_auto_enable_bootstrap.sql`. The live inventory has no `20261006030000` version. Do not assume it is safe or necessary to replay; inspect its exact effect against current schema and grants first.
2. **Two repository migrations whose versions are absent from live history and whose expected columns are absent in the live schema:**
   - `20261010140000_add_intervention_implemented_at.sql` — `public.asset_interventions.implemented_at`
   - `20261010150000_add_analysis_input_snapshot_sha256.sql` — `public.factory_analysis_runs.input_snapshot_sha256`
3. **Seven repository migrations are recorded under different live version IDs**, even though the live entry names indicate corresponding migration intent:
   - repository `20261009130000_gridmind_factory_analysis_runs_v1.sql` → live version `20261010075630`
   - `20261010100000_restore_authenticated_factory_api_privileges.sql` → `20261010081740`
   - `20261010103000_grant_authenticated_factory_profile_updates.sql` → `20261010082541`
   - `20261010104000_grant_authenticated_factory_asset_writes.sql` → `20261010082706`
   - `20261010110000_harden_organization_membership_rls.sql` → `20261010103936`
   - `20261010120000_revoke_public_structural_table_privileges.sql` → `20261010104457`
   - `20261010130000_scope_membership_update_policy.sql` → `20261010104942`

### Interpretation and limits

This is a **migration identity/version drift plus two unapplied-or-unrecorded schema changes**, and a bootstrap migration that is not represented by its repository prefix. The comparison does **not** prove why the versions differ, whether the bootstrap's effects were applied through another path, or whether the two missing migrations were intentionally withheld. The live migration names are evidence of likely correspondence, not cryptographic proof that the SQL bodies match. The database's current objects, constraints, grants, triggers, policies and function definitions must be compared with the exact repository SQL before any remediation.

### Required safe next step

- Fetch and review the full SQL body of the bootstrap migration and both missing-column migrations, plus the seven repository migrations whose live version IDs differ.
- Compare their intended effects with current live schema and privilege/function metadata using read-only queries.
- Confirm the repository commit/branch and migration runner's behavior for already-recorded renamed versions.
- Prepare a reconciliation matrix for an authorized database operator and independent reviewer. Use a recovery point and explicit stop conditions before any production DDL.
- Do **not** blindly replay the bootstrap or earlier migrations, alter migration history manually, or backfill fabricated historical timestamps/hashes. Keep production **NO-GO** until reviewed reconciliation and authenticated acceptance tests pass.

This section supersedes any earlier wording that implied the only discrepancy was two missing columns or simple migration-head lag. No production mutation was performed during this comparison.


## Object-level preflight after migration identity comparison — 2026-10-11

Read-only catalog inspection adds important context:

- The live database has event trigger `ensure_rls` enabled for `ddl_command_end`, and `public.rls_auto_enable()` exists as a SECURITY DEFINER event-trigger function. This is consistent with the bootstrap migration's intended capability, even though live migration history has no `20261006030000` entry. The live function definition is not byte-for-byte proven to match the repository file; **do not replay the bootstrap simply to make the version appear**.
- Live catalog inspection confirms `private.is_org_admin(bigint)`, `private.is_factory_member_v2(bigint)`, `private.reject_factory_analysis_run_mutation()`, and the `factory_analysis_runs_append_only` trigger exist. Relevant live RLS policies were present for factories, organization members, asset interventions, and factory analysis runs. This is existence evidence only; it does not prove grants, predicates, or tenant-isolation behavior are safe.
- The live `public.create_factory_workspace(text,text,text)` function is SECURITY DEFINER with an empty search path, requires `auth.uid()`, and creates/attaches a factory based on the caller's active owner/admin membership or creates a new organization when none is found. Its code currently selects the first active owner/admin organization by ascending ID when the caller belongs to multiple organizations. This is a concrete behavior to test with a qualified reviewer; it is not by itself proof of an authorization bypass. The existing Security Advisor warning remains open.
- The two required columns remain absent in the read-only column check.

### Decision

The bootstrap migration is **functionally represented in live objects but not represented by its repository version prefix**. The two nullable column migrations are **not evidenced as applied and their columns are absent**. Seven other migration bodies appear represented under different live version IDs, but body equivalence is not proven. The safe resolution is a per-migration reconciliation matrix (repository SQL hash/content, live version/name, current object effects, differences, disposition), not bulk replay and not manual history edits.

No schema, data, grants, settings, migration history or deployment was changed. Production remains NO-GO pending independent review and authenticated cross-tenant/end-to-end acceptance.


## Read-only grants and policy comparison — 2026-10-11

A catalog query compared current table grants and selected RLS policy definitions against the intent of the seven repository migrations that appear under different live version IDs.

### Observed matches

- Authenticated grants exist for the application tables named in the privilege-restoration migration, including factory read/update, asset read/insert/update, observation/data-source/context/opportunity/intervention/outcome writes, organization membership read/insert/update, and verification plan/run writes.
- factory_analysis_runs has service-role SELECT/INSERT grants, and its RLS policies target authenticated for member reads/inserts. Insert checks require private.is_factory_member_v2(factory_id) and created_by = auth.uid().
- organization_members policies are explicitly scoped to authenticated; reads are self or organization-admin, and inserts/updates use private.is_org_admin(organization_id).
- factories and factory_assets have authenticated-member read policies and owner/admin update/write policies in the live catalog.
- The live bootstrap event trigger/function and live policy/grant state are consistent with several repository migration intentions.

### Limits / unresolved

This is a spot-check of current grants and selected policies, not a complete semantic diff of all seven migration SQL bodies. It does not prove each migration was applied exactly once or that no unintended privileges exist elsewhere. The missing column migrations remain unresolved. Cross-tenant denial still requires tests with two distinct authenticated identities and fixtures in a non-production environment. The SECURITY DEFINER workspace RPC needs explicit tests for users with zero, one, and multiple active owner/admin organization memberships.

### Next safe action

Produce a complete per-migration disposition table and arrange non-production two-user tests. No production mutation or migration-history edit is authorized by this read-only result.


## Per-migration disposition matrix — read-only review, 2026-10-11

| Repository migration | Live evidence | Disposition |
|---|---|---|
| `20261006030000_gridmind_rls_auto_enable_bootstrap.sql` | `ensure_rls` event trigger is enabled and `public.rls_auto_enable()` exists with matching high-level behavior. | **Functionally represented; version identity unresolved.** Do not replay just to align history. Compare full function definition/ACL and migration runner semantics before deciding whether to repair history or repository migration strategy. |
| `20261009130000_gridmind_factory_analysis_runs_v1.sql` | Table, expected core constraints, append-only trigger, service-role persistence grants, member read/insert policies and related indexes exist. Extra indexes also exist. | **Core effects represented; exact body equivalence unproven.** The two column migrations below are separate and remain absent. |
| `20261010100000_restore_authenticated_factory_api_privileges.sql` | Read-only grants show expected authenticated SELECT/INSERT/UPDATE privileges for the named factory workflow tables. | **Spot-check matches.** Complete semantic diff of all grants and API-exposed objects still required. |
| `20261010103000_grant_authenticated_factory_profile_updates.sql` | `authenticated` has UPDATE on `factories`. | **Observed effect matches.** |
| `20261010104000_grant_authenticated_factory_asset_writes.sql` | `authenticated` has INSERT/UPDATE on `factory_assets`; owner/admin RLS policies exist. | **Observed effect matches.** Tenant behavior still needs two-user tests. |
| `20261010110000_harden_organization_membership_rls.sql` | `private.is_org_admin` exists; organization membership policies use it and are scoped to authenticated. Function ACL shows authenticated EXECUTE. | **Observed effect broadly matches.** Confirm no unintended ACLs and test real authorization/recursion behavior. |
| `20261010120000_revoke_public_structural_table_privileges.sql` | Catalog spot-check returned no TRUNCATE/REFERENCES/TRIGGER grants to PUBLIC, anon, authenticated or service_role for the checked public tables. | **Spot-check matches.** Query should be repeated across all public tables in final acceptance. |
| `20261010130000_scope_membership_update_policy.sql` | `admins update organization_members` policy is scoped to `{authenticated}`. | **Observed effect matches.** |
| `20261010140000_add_intervention_implemented_at.sql` | `asset_interventions.implemented_at` is absent. | **Not applied or not represented.** Safe additive nullable column; historical values must remain NULL. Requires approved migration reconciliation. |
| `20261010150000_add_analysis_input_snapshot_sha256.sql` | `factory_analysis_runs.input_snapshot_sha256` and its format constraint are absent. | **Not applied or not represented.** Safe additive nullable column plus check constraint; historical hashes must remain NULL. Requires approved migration reconciliation. |

### Reconciliation conclusion

The evidence supports two different classes of mismatch: (a) version identity drift where most inspected effects are already present, and (b) two additive schema changes whose columns and associated check constraint are absent. The bootstrap's live capability is present even though its version prefix is missing. The safe next step is to agree on the canonical migration-history strategy and test it on a restored/staging copy first; never bulk replay migrations or manually manufacture history entries. A complete ACL/function-body diff and authenticated two-tenant tests remain required before production approval.


## Follow-up catalog verification — 2026-10-11

A refreshed migration inventory contains two additional migrations absent from the earlier snapshot:
- `20261011062242_harden_public_default_table_privileges` (recorded live under the same name/version): aims to revoke MAINTAIN/TRUNCATE/REFERENCES/TRIGGER on existing public tables and defaults for future public tables.
- `20261011062256_add_factory_analysis_run_fk_indexes` (recorded live under the same name/version): both indexes exist in the live catalog.

**New unresolved finding:** a read-only `pg_default_acl` inspection returned entries for MAINTAIN, TRUNCATE, REFERENCES, and TRIGGER for `anon`, `authenticated`, and `service_role` in the public schema's default table ACL. This conflicts with the intended least-privilege defaults in `harden_public_default_table_privileges`. Do not assume the migration achieved the desired state just because it appears in migration history. Re-query the raw default ACL, identify the creating role and grant source, and test the behavior on a fresh staging table before designing a narrowly scoped correction.

The two missing columns remain absent. The exact function-body comparison for `public.rls_auto_enable()` shows matching behavior in the inspected body (formatting differs), but full ACL/version reconciliation is still pending. Security Advisor still reports the authenticated SECURITY DEFINER RPC `public.create_factory_workspace(text,text,text)` and disabled leaked-password protection. Production remains **NO-GO**.


## ACL discrepancy clarification — 2026-10-11

The earlier catalog result was too broad to label a confirmed migration failure. A more precise `pg_default_acl` query identified the creator role for each default ACL:
- For creator role `postgres`, the public-schema default ACL contains only `postgres` as grantee for MAINTAIN, REFERENCES, TRIGGER, and TRUNCATE. No API-role grantees were returned for the `postgres` creator-role ACL.
- The entries for `anon`, `authenticated`, and `service_role` are associated with creator role `supabase_admin`, granted by `supabase_admin`.

The repository migration explicitly uses `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so the `supabase_admin` entries do **not by themselves prove that migration failed**; default privileges are creator-role-specific. They do reveal a coverage question: if `supabase_admin` can create public tables in this environment, its defaults may not have the same least-privilege behavior. Next, verify which role actually creates application tables and whether `supabase_admin` is expected/able to create public tables; reproduce with a harmless staging table created by each relevant role. Do not change provider-managed role defaults blindly.

Therefore classify this as **default-privilege coverage to verify**, not a confirmed production exploit or confirmed migration failure. No production changes were made. Other NO-GO gates remain: missing nullable columns, incomplete authenticated two-tenant and end-to-end tests, and the two Security Advisor warnings.
