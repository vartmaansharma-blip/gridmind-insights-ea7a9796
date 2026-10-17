> [!IMPORTANT]
> **Status: HISTORICAL TECHNICAL TRACKER — NOT A CURRENT EXECUTION AUTHORITY (reviewed 2026-10-13).** The dated status below is a historical engineering snapshot; it is not a security certification or proof of current production state. Do not follow its old branch/phase sequence as a live task queue. Use the [canonical Master Plan](../gridmind-master-plan-2026-10-11.md), [technical release gate](../release-gate.md), and current GitHub issues for current priorities and acceptance. Historical findings are preserved.

# GridMind Phase 2 — security and factory-isolation execution tracker

**Date:** 2026-10-10  
**Branch:** `security/phase-2-tenant-isolation`  
**Base:** Phase 1 stabilization branch `fix/no-synthetic-intervention-dates`  
**Scope:** harden the organization membership authorization path and expand automated tenant-isolation checks. This is not a security certification.

## Current verified status (supersedes stale historical snapshots below)

The original findings and initial rollout notes below are retained as audit history; some early paragraphs describe the pre-fix state and should not be read as the current production state.

- Merged PRs: [#20](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/20), [#21](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/21), [#22](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/22).
- Applied production migrations: `20261010103936 / harden_organization_membership_rls`, `20261010104457 / revoke_public_structural_table_privileges`, and `20261010104942 / scope_membership_update_policy`.
- Last verified read-only schema audit: 42/42 public base/partitioned tables have RLS enabled; no public-table RLS policies target PUBLIC/anon; 0/42 tables have effective app-role TRUNCATE/REFERENCES/TRIGGER privileges.
- Still open: complete semantic DML/RLS/relationship audit, Auth leaked-password protection, multi-organization bootstrap selection, deployed-SHA alignment, and authenticated two-user production API acceptance.
- These database catalog checks are not a security certification and do not prove all factory graph relationships are isolated at the API layer.


## Evidence-backed findings

### Finding 1 — organization membership RLS recursively queried its own table

The prior policies on `public.organization_members` used subqueries against `public.organization_members` to decide whether the caller was an active owner/admin. Because the same table's RLS policies apply to those subqueries, this can recursively re-enter the policies and fail with a recursion error rather than authorizing safely.

**Implemented in this branch:** migration `20261010110000_harden_organization_membership_rls.sql` adds `private.is_org_admin(bigint)`, a narrowly scoped `SECURITY DEFINER` predicate with an empty search path and no caller-supplied user ID. It revokes execute from PUBLIC/anon, grants it to authenticated, and rewrites SELECT/INSERT/UPDATE policies to call that predicate. The predicate only returns true for the caller's active owner/admin membership in the specified organization.

**Validation status:** clean migration replay and the tenant security test passed on PR head `8b0c562eb94d9adbddc8b050233c0bd2294b6159` in [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045250549). The migration diff still requires review and has not been applied to production.

### Finding 2 — existing coverage was narrow

The existing `supabase/tests/factory-analysis-security.sql` tested factory visibility and the special append-only analysis-run table, but did not directly assert cross-tenant asset invisibility or organization-membership write denial.

**Implemented in this branch:** expanded the existing migration-replay security test to assert:
- user A sees only their test factory and its assets, not tenant B's assets;
- a user cannot update or insert organization memberships in another tenant;
- workspace bootstrap execution is granted to authenticated and denied to anon;
- the public workspace bootstrap function has a pinned empty search path;
- existing least-privilege analysis-run table/sequence grants and append-only constraints continue to be checked.

**Validation status:** [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045250515), [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045250513), and [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045250549) all passed on PR head `8b0c562eb94d9adbddc8b050233c0bd2294b6159`.

## Live database cross-check (read-only, 2026-10-10)

The connected Supabase project was queried read-only after the initial code review.

- **Confirmed in the live database:** the current SELECT/INSERT/UPDATE policies on `public.organization_members` contain direct subqueries against `public.organization_members` itself. This matches the recursive-policy defect described above. The new migration is **not applied to production**; live behavior remains unchanged until a reviewed release is approved.
- **Confirmed:** `public.create_factory_workspace(text,text,text)` is SECURITY DEFINER, has `search_path=""`, and its current ACL grants execute to `authenticated` (not `anon`). This is consistent with its intended authenticated onboarding role; continue to test its behavior and avoid relying on the advisor warning alone.
- **Confirmed:** existing private membership/asset helper functions are SECURITY DEFINER, have an empty search path, and have execute grants to `authenticated` but not PUBLIC/anon in their ACLs.
- **Confirmed excess structural privileges:** effective privilege checks show `anon` has `TRUNCATE`, `REFERENCES`, and `TRIGGER` on `organization_members`; `authenticated` also has these structural privileges. Row-level security does not constrain `TRUNCATE`. The proposed migration now explicitly revokes these unnecessary privileges from PUBLIC, anon, authenticated, and service_role, and the migration-replay test asserts they are absent. This is a high-priority least-privilege correction; it remains unverified until the updated migration replay passes.
- The live migration history is still at `20261010082706`; this branch's `20261010110000_harden_organization_membership_rls.sql` has not been applied to the live project.

The SQL was read-only. No production policy, grants, Auth setting, membership, or data was changed.

## Production rollout result (read-only verification after migration)

**Migration applied:** Supabase accepted `harden_organization_membership_rls` and recorded version `20261010103936`. The SQL is the same as the reviewed migration committed in GitHub, with the applied version recorded by Supabase.

**Post-apply checks passed:**
- `organization_members` SELECT/INSERT/UPDATE policies now call `private.is_org_admin(organization_id)` rather than self-querying the RLS-protected table.
- Effective privilege checks now report `anon`: no SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER; `authenticated`: SELECT/INSERT/UPDATE remain available under RLS, with DELETE/TRUNCATE/REFERENCES/TRIGGER denied; `service_role`: the listed direct table privileges are denied on this table (service-role bypass capabilities remain a separate platform concern).
- The live migration history contains `20261010103936 / harden_organization_membership_rls`.

No factory, organization, or membership rows were changed by the migration. This resolves the identified recursive-policy definition and unnecessary structural grants in the live schema. It does **not** finish Phase 2 by itself: Auth leaked-password protection remains disabled, the all-table/function privilege audit is unfinished, multi-organization workspace selection still needs a product decision, and authenticated production API smoke tests/deployed commit alignment remain to be completed.

## Follow-up finding: structural grants across the entire public schema

After applying the first production fix, a read-only audit across every public base/partitioned table found that `anon` and `authenticated` still had effective `TRUNCATE`, `REFERENCES`, and `TRIGGER` privileges on many other tables. `TRUNCATE` bypasses row-level security. This is broader than the original organization-membership issue.

A second corrective migration is proposed in branch `security/revoke-public-structural-grants`:
- `20261010120000_revoke_public_structural_table_privileges.sql` revokes only `TRUNCATE`, `REFERENCES`, and `TRIGGER` from PUBLIC, anon, authenticated, and service_role across all public base and partitioned tables.
- Ordinary SELECT/INSERT/UPDATE/DELETE grants and RLS policies are left unchanged.
- The migration-replay security test now checks effective privileges across all public base/partitioned tables so this class of over-grant cannot silently return.

**Status:** merged in [PR #21](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/21), with [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045773200), [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045773147), and [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38045773190) passing. Applied to production as migration `20261010104457 / revoke_public_structural_table_privileges`. Post-apply read-only audit across all 42 public base/partitioned tables reports **0 tables** where anon, authenticated, or service_role has effective `TRUNCATE`, `REFERENCES`, or `TRIGGER` privilege. The same audit reports RLS enabled on all 42/42 public base/partitioned tables.

## Follow-up finding: explicit role scope on membership UPDATE policy

The live policy inventory after the first RLS fix showed `admins update organization_members` targeted `PUBLIC` because the migration omitted an explicit `TO authenticated`. Its predicate still required `private.is_org_admin(organization_id)`, and effective table privileges for anon UPDATE were false, so this was not evidence that anonymous writes succeeded. Nevertheless, policy scope should be explicit and least-privilege.

Proposed correction in branch `security/scope-membership-update-policy`:
- Migration `20261010130000_scope_membership_update_policy.sql` recreates the policy with `TO authenticated`.
- Migration-replay test asserts the policy's role list is exactly `authenticated`.
- Apply to production only after clean replay and CI pass, then re-query `pg_policies` to confirm the live policy roles.


## Production rollout update — 2026-10-10

A third small migration was merged in [PR #22](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/22) after the live policy inventory found the organization-membership UPDATE policy's target role was `PUBLIC` rather than explicitly `authenticated`.

- Applied production migration `20261010104942 / scope_membership_update_policy`.
- Requeried `pg_policies`: SELECT, INSERT, and UPDATE policies on `organization_members` now all target `authenticated`; UPDATE calls `private.is_org_admin(organization_id)`.
- Requeried all 42 public base/partitioned tables: **42/42 have RLS enabled**.
- After the structural-grant migration, the effective-privilege audit reports **0/42 tables** with app-role `TRUNCATE`, `REFERENCES`, or `TRIGGER` privileges.

These are schema/grant checks, not a substitute for a live authenticated two-user API test.


## Broader policy/function inventory — 2026-10-10

A further read-only catalogue query after the third production migration found:
- All **42/42** public base/partitioned tables have RLS enabled.
- No current public-table RLS policies target `PUBLIC` or `anon`.
- The public schema has two SECURITY DEFINER functions: `public.create_factory_workspace` and `public.rls_auto_enable`. The bootstrap function has an empty search path, execute denied to anon/PUBLIC, and execute granted to authenticated (intentional onboarding RPC). `rls_auto_enable` is not executable by anon, authenticated, or PUBLIC and has `search_path=pg_catalog`.
- Supabase Security Advisor continues to report leaked-password protection disabled. That Auth setting cannot be changed by a SQL migration and remains a dashboard/configuration action.

This is a useful inventory baseline, not a complete proof that every policy predicate and every cross-factory relationship is correct. The next engineering checks are table-by-table predicate/grant review and authenticated API-level negative tests across the canonical graph.

## Phase 2 checklist

| Item | Status | Evidence / next action |
|---|---|---|
| 2.1 Review tenant identity model | **Reviewed in source** | Organization membership + factory membership are separate gates; factory membership has organization linkage and composite integrity constraints. Verify live RLS and membership state independently. |
| 2.2 Fix organization membership policy recursion | **Implemented; automated tests pass; review/production rollout pending** | Migration `20261010110000_harden_organization_membership_rls.sql`; migration replay passed. |
| 2.3 Add cross-tenant asset read denial test | **Implemented and passing locally in CI** | `supabase/tests/factory-analysis-security.sql`; Migration Replay passed. |
| 2.4 Add cross-tenant membership write denial test | **Implemented and passing locally in CI** | Same test script, user A attempting to update/insert in org B. |
| 2.5 Verify SECURITY DEFINER function grants and search path | **Core bootstrap checks passing; full catalogue audit open** | Test asserts public workspace bootstrap is executable by authenticated, not anon, and has empty search path. Existing private helper ACLs still need a broader catalogue audit. |
| 2.6 Audit all RLS policies and table grants across canonical tables | **Partially verified; semantic review incomplete** | All 42/42 public base/partitioned tables have RLS enabled; no public-table policies target PUBLIC/anon; no app role has structural TRUNCATE/REFERENCES/TRIGGER grants. Continue reviewing each policy predicate, DML grant, relationship constraint, and edge-function boundary. |
| 2.7 Verify cross-factory composite constraints | **Partially implemented in schema; runtime coverage incomplete** | Several canonical graph edges already have composite factory-scoped foreign keys. Add explicit negative tests for cross-factory observations, mappings, opportunities, interventions, verification plans/runs, and outcomes. |
| 2.8 Review workspace bootstrap organization selection | **Open** | The RPC chooses the first active owner/admin organization when a caller belongs to multiple organizations. Confirm intended product behavior; preferably require an explicit authorized organization or a separate “create new organization” flow rather than silently selecting the first. |
| 2.9 Review leaked-password protection | **Blocked on Auth configuration access** | Previous read-only Supabase advisor snapshot reported it disabled. Confirm current setting and enable through authorized Auth settings after reviewing login/reset UX. No production setting changed. |
| 2.10 Recheck public SECURITY DEFINER warning | **Needs live confirmation** | The public workspace bootstrap function is intentionally callable by authenticated users for onboarding, uses `auth.uid()`, and has a pinned empty search path. Confirm current grants and function definition in the live database; do not treat the advisor warning alone as proof of exploitability. |
| 2.11 Verify deployed release and authenticated smoke tests | **Blocked by Phase 1 Vercel rate limit** | Deploy only after checks pass and provider permits deployment; verify deployed SHA, sign-in, factory isolation, and authorized/unauthorized writes. |
| 2.12 Live two-user isolation acceptance | **Not yet run** | Use two independent authenticated test users and at least two factories in separate organizations; prove read and write denial at API level, not only through UI filtering. Do not use real customer data. |

## Safety boundaries

- Do not remove RLS, broaden grants, or use the service role in browser code to make workflows pass.
- Do not change production Auth settings or apply migrations to production without authorization and a reviewed release.
- A zero-row UPDATE can be a valid RLS denial; tests must distinguish that from a successful write.
- Test both read isolation and write isolation; UI filtering is not a security boundary.
- Treat tenant isolation as defense in depth: RLS + constrained RPCs + relational factory-consistency constraints + authenticated integration tests.
- Keep credentials, tokens, customer records, and secrets out of logs and documentation.

## Phase 2 exit criteria

Phase 2 is not complete until:
1. Migration replay and all CI workflows pass on the final PR head.
2. The membership policy recursion fix is reviewed and merged.
3. Cross-tenant read/write denial is demonstrated by automated tests and a separate authenticated API smoke test.
4. The table/grant/RLS matrix covers every public table and every SECURITY DEFINER function.
5. Leaked-password protection and current live function grants are confirmed in Supabase.
6. Vercel serves the approved SHA and deployed authorization checks pass.

**Current decision:** two security migrations are merged and applied to production. Read-only checks confirm organization membership policies no longer self-query, all 42 public base/partitioned tables have RLS enabled, and no API role has effective TRUNCATE/REFERENCES/TRIGGER on those tables. Phase 2 remains in progress: the complete table-by-table DML/RLS/function audit, Auth leaked-password setting, multi-organization bootstrap behavior, deployed-commit alignment, and authenticated two-user production API acceptance are still open.
