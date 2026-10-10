# GridMind Phase 2 — security and factory-isolation execution tracker

**Date:** 2026-10-10  
**Branch:** `security/phase-2-tenant-isolation`  
**Base:** Phase 1 stabilization branch `fix/no-synthetic-intervention-dates`  
**Scope:** harden the organization membership authorization path and expand automated tenant-isolation checks. This is not a security certification.

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

## Phase 2 checklist

| Item | Status | Evidence / next action |
|---|---|---|
| 2.1 Review tenant identity model | **Reviewed in source** | Organization membership + factory membership are separate gates; factory membership has organization linkage and composite integrity constraints. Verify live RLS and membership state independently. |
| 2.2 Fix organization membership policy recursion | **Implemented; automated tests pass; review/production rollout pending** | Migration `20261010110000_harden_organization_membership_rls.sql`; migration replay passed. |
| 2.3 Add cross-tenant asset read denial test | **Implemented and passing locally in CI** | `supabase/tests/factory-analysis-security.sql`; Migration Replay passed. |
| 2.4 Add cross-tenant membership write denial test | **Implemented and passing locally in CI** | Same test script, user A attempting to update/insert in org B. |
| 2.5 Verify SECURITY DEFINER function grants and search path | **Core bootstrap checks passing; full catalogue audit open** | Test asserts public workspace bootstrap is executable by authenticated, not anon, and has empty search path. Existing private helper ACLs still need a broader catalogue audit. |
| 2.6 Audit all RLS policies and table grants across canonical tables | **In progress / incomplete** | The organization_members structural grants were corrected in the proposed migration and are tested; a table-by-table matrix for all public tables and functions remains. |
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

**Current decision:** the proposed organization-membership RLS fix and structural-privilege revocation pass CI, Quality Gate, and clean migration replay on PR head `8b0c562eb94d9adbddc8b050233c0bd2294b6159`. Phase 2 remains in progress: the full schema/grant audit, Auth leaked-password setting, multi-organization bootstrap behavior, production rollout, and deployed two-user API acceptance are still open.
