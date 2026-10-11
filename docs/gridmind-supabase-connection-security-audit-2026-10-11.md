# GridMind Supabase connection and security audit — 2026-10-11

**Scope:** read-only inspection plus two verified, non-destructive database hardening migrations.  
**Project:** `GridMind projects` — `bvqmvgbfqhgczwbvlqkk` (region `ap-south-1`, PostgreSQL 17).  
**Repository:** [gridmind-insights-ea7a9796](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796), `main`.  
**Status:** database connectivity verified through Supabase management/SQL tools; frontend live sign-in and end-to-end user workflow are NOT verified by this audit.

## Verified positives
- Supabase reports `ACTIVE_HEALTHY`.
- The repository's `.env.example` and `supabase/config.toml` reference the same Supabase project ref.
- The client implementation reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in browser builds, with server-side fallbacks. The source throws a clear error if these values are absent.
- 42 public tables were inspected; all 42 have RLS enabled and none lacks policies.
- The `persist-factory-analysis` Edge Function is active and JWT verification is enabled.
- Four foreign keys on `factory_analysis_runs` are validated.

## Fixes applied and verified
### 1. Remove structural/maintenance privileges from API roles
Migration: `20261011062242_harden_public_default_table_privileges`

Revoked `MAINTAIN`, `TRUNCATE`, `REFERENCES`, and `TRIGGER` from `PUBLIC`, `anon`, `authenticated`, and `service_role` on existing public tables, and set matching default privileges for future public tables created by `postgres`. Ordinary application DML privileges were not intentionally changed.

**Post-change verification:** query across public tables returned zero tables where `anon` or `authenticated` retains `TRUNCATE` or `MAINTAIN`. The two machine catalog tables checked also no longer grant these privileges. Their SELECT privileges were already absent before the change; this audit did not add SELECT access.

### 2. Add covering indexes for analysis-run foreign keys
Migration: `20261011062256_add_factory_analysis_run_fk_indexes`

Added:
- `factory_analysis_runs_asset_factory_fk_idx` on `(asset_id, factory_id)`, covering the composite asset/factory FK and the asset-id prefix.
- `factory_analysis_runs_created_by_idx` on `(created_by)`, covering the creator FK.

**Post-change verification:** both indexes exist and the four `factory_analysis_runs` FK constraints are validated.

## Remaining findings / blockers
### High — review the workspace bootstrap SECURITY DEFINER function
Supabase Security Advisor flags `public.create_factory_workspace(text,text,text)` because authenticated users can call it. Source inspection shows it checks `auth.uid()`, requires a non-empty name, and creates/uses an organization plus owner membership and factory membership. Its fixed empty search path is a positive hardening measure. The warning alone does not prove exploitability, and this audit did not revoke the intended onboarding call. Required next: test the function using real authorized and unauthorized test identities in an isolated environment, and verify a caller cannot attach themselves to an existing organization they do not control.

Reference: [Supabase database linter guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

### Medium — leaked-password protection is disabled
Supabase Security Advisor still reports Auth leaked-password protection disabled. This is a dashboard/Auth configuration setting and was not changed here. Enable it after reviewing current Auth configuration and the expected sign-in flows.

Reference: [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

### High — tenant isolation and actual client flow still need adversarial tests
RLS is enabled across the inspected public tables, and policies exist, but catalog inspection is not proof that cross-factory access is denied in every application path. Test two separate authenticated identities and explicitly assert that factory A cannot read/write factory B's rows, including RPCs, Edge Functions, storage (if used), and any views.

### High — end-to-end connection is not yet proven
The repository client configuration is consistent with the Supabase project reference. Management SQL access and active function status prove the project is reachable to the administrative tools, not that production frontend environment variables are populated correctly or a user can sign in and save/reload an analysis. Test the deployed application using the normal login and an isolated authorized fixture.

### Medium — schema/migration source alignment needs verification
The two migrations above are now applied to the remote database. Their source files must be kept in the repository and migration replay/CI must be run to confirm a fresh database can reproduce the schema. Do not mark this complete until the migration files are committed and replay is green.

### Informational — unused-index notices
The advisor reports 84 unused indexes. Do not drop them solely from this low-traffic snapshot; inspect workload and query plans first.

## Next execution order
1. Commit the two matching migration source files and this audit record.
2. Run migration replay and CI on the exact resulting commit.
3. Test the deployed login → workspace/factory → analysis persistence → reload path.
4. Test cross-tenant read/write denial with separate authorized identities.
5. Review the bootstrap RPC authorization contract and enable leaked-password protection.
6. Re-run Supabase security/performance advisors and refresh this report with evidence.

**Do not claim production readiness from schema/RLS inspection alone.**
