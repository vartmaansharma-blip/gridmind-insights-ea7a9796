# GridMind Supabase readiness remediation — 2026-10-12

**Status: remediation in progress; production release remains NO-GO.** This document records verified observations and proposed changes. It does not claim that production has been fixed.

## Target project

- Supabase project: `bvqmvgbfqhgczwbvlqkk` (`GridMind projects`)
- Region: `ap-south-1`
- PostgreSQL: `17.11.0.002`
- Project state observed: `ACTIVE_HEALTHY`

## Read-only findings

- The public schema contains 42 tables and all 42 have RLS enabled; 117 public-schema policies were observed. These counts do not prove policy correctness or tenant isolation.
- Supabase Security Advisor reports:
  - `public.create_factory_workspace(text,text,text)` is SECURITY DEFINER and executable by the authenticated role. This is an intentional onboarding endpoint in the current design, but it requires independent privilege-boundary review because the function owner can bypass RLS.
  - Leaked-password protection is disabled.
- Two expected production columns remain absent:
  - `public.asset_interventions.implemented_at`
  - `public.factory_analysis_runs.input_snapshot_sha256`
- The live migration inventory contains 30 records and ends at `20261011062256`. The seven migration filename/version alignments were merged to `main` in PR #36; this aligns version identifiers in source control but does not apply the two missing-column migrations to production.
- Performance Advisor reports 86 unused-index candidates. Because the project has limited observed workload, these are review candidates, not an instruction to drop indexes.
- Production authentication, schema, data, migration history, grants, and deployment were not changed during this audit.

## Remediation changes proposed in this branch

1. Fail closed in workspace bootstrap when a user has multiple active owner/admin organization memberships; never silently select an organization.
2. Add a SQL contract for unauthenticated rejection, correct single-organization placement, ambiguous-context rejection without side effects, and first-workspace owner membership.
3. Make input-snapshot integrity verification reject NULL/legacy, malformed, and mismatched SHA-256 digests.
4. Add exact contract tests to the clean migration replay workflow and lint the new helper.
5. Give the factory-creation UI a truthful recovery message for ambiguous organization context; it does not pretend that an organization selector exists.
6. Keep production migration and Auth remediation behind separate reviewed change control.

## Required release gates

- [ ] CI, GridMind Quality Gate, and clean migration replay pass on the exact current head.
- [ ] Review the full SECURITY DEFINER function body, ACLs, role assumptions, writes, and abuse cases independently.
- [ ] Reconcile local/remote schema and migration state using a reviewed CLI dry-run against the confirmed project; inspect every pending SQL statement.
- [ ] Establish a verified recovery point and a named authorized operator plus independent reviewer before any production schema change.
- [ ] Apply the two nullable-column migrations through the approved migration workflow, then verify the columns and constraints directly.
- [ ] An authorized Auth settings owner enables leaked-password protection and tests sign-in, password reset, and account recovery.
- [ ] Prove two-user tenant isolation and the authenticated sign-in → workspace → analysis → reload journey in a controlled target.
- [ ] Review index candidates against foreign keys, constraints, query plans, and representative workload before any removal.

## Non-negotiable production boundary

Do not hand-edit `supabase_migrations.schema_migrations`, blindly replay migrations whose effects may already exist, use a remote database reset, weaken RLS/grants to silence warnings, or drop indexes solely because they are unused. No production DDL, migration-history repair, Auth configuration change, or deployment promotion is authorized by this document alone.
