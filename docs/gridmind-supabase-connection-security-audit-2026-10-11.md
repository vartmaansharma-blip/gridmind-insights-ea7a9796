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


## Follow-up execution — 2026-10-11

### GitHub Actions and migration replay
- The first CI failure was diagnosed from job logs: `docs/gridmind-next-plan-2026-10-11.md` linked to a non-existent anchor `#commercial-economics-gate--required-before-choosing-a-wedge` in the commercial wedge scorecard.
- Fixed the anchor to `#commercial-economics-gate-required-before-choosing-a-wedge` in commit `f19ac0d6e1ce776b7d84279fb95d4c54fb736c31`.
- CI passed on that commit: Markdown link audit, TypeScript typecheck, semantic ESLint, unit tests, and production build all succeeded. [CI run](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118189300).
- The Quality Gate also passed on the same commit, including the Edge Function Deno check. [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118189276).
- A clean local migration replay previously passed on commit `a25550be3b37473144c5180d610de5a2d4183d74`, which already contained both new migration files. The latest replay after the anchor fix was still running at the time of this update; final completion must be checked before calling the latest commit fully green. [Latest migration replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118189349).
- The remote Supabase migration history contains versions `20261011062242` and `20261011062256`, matching the committed migration source filenames. The clean replay result is the reproducibility evidence; remote history alone is not.

### Authenticated RLS smoke test — read-only, rollback-protected
The live database currently has one Auth user, four factories, three factory memberships, zero assets, zero observations, and zero analysis runs. That means a true two-real-user cross-tenant test and a populated analysis write/reload test cannot yet be completed using existing production data.

Using a transaction with `SET LOCAL ROLE authenticated` and a request user-id claim:
- The existing authenticated user could see 3 factories through the factories RLS policy.
- A non-member test UUID could see 0 factories, 0 factory memberships, and 0 observations.
- An update against a factory as the non-member test UUID affected 0 rows; the transaction was rolled back.
- The existing user and the non-member test UUID both saw 0 assets because the live asset table currently has no rows. This does not prove asset-level isolation with populated fixtures.
- A direct SELECT against `public.organizations` was denied because the `authenticated` role has no SELECT table privilege. Do not add that grant merely to make an administrative smoke test pass: the inspected client repository reads factory records and does not need direct organization-table access for the tested path. Preserve this as an intentional least-privilege boundary unless a real application requirement proves otherwise.

These SQL checks support the basic non-member visibility boundary, but they are **not** a substitute for the existing automated two-user migration-replay/HTTP acceptance suite or an authenticated production API test.

### Workspace bootstrap function review
- Effective ACL check: `authenticated` can execute `public.create_factory_workspace`; `anon` and `PUBLIC` cannot.
- Function definition has an empty `search_path`, rejects a missing `auth.uid()`, and does not accept an organization ID supplied by the caller. It uses the caller's active owner/admin organization when available, otherwise creates a new organization, then creates a factory and owner membership.
- No direct privilege bypass was demonstrated by static inspection. The advisor warning remains because the function is SECURITY DEFINER and callable by authenticated users. Multi-organization selection (first owner/admin organization by ID) remains a product/security edge case to test before users can manage multiple organizations.

### Still open
1. Confirm the latest migration replay run reaches success on the same commit as the passing CI and Quality Gate.
2. Run the automated two-user tenant-isolation and authenticated Edge Function acceptance suite from Migration Replay; review its final job output.
3. Complete a production authenticated flow test using the intended owner account: sign-in, create/select workspace, persist an analysis, reload it, and verify retry/idempotency.
4. Create no production fixtures just to make tests pass; use the isolated local test stack for two-user tests.
5. Enable leaked-password protection through Supabase Auth settings after reviewing the expected password sign-up/sign-in flow. The available database tools did not change this Auth setting, and the advisor still reports it disabled.
6. Recheck Vercel deployment SHA and resolve the separate build-rate-limit blocker before asserting that the currently tested source is the deployed source.

**Status update:** CI and Quality Gate passed after the documentation fix. Latest migration replay and live production end-to-end acceptance remain pending. No production business rows were inserted or modified during the RLS smoke tests.


## End-to-end workflow execution checkpoint — 2026-10-11

### Current evidence
- Latest tracked migration-replay run: [run 38118239514](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118239514), commit `2d498a01c00716a323a6be7b28f4515327f9cce4`. At the latest inspection, the job was still in progress at **Start isolated local Supabase stack**; migration replay and downstream SQL/HTTP tests had not started. Do not treat this as a pass. The workflow job-log fetch returned no log artifact, so the cause of the delay is not yet established.
- The repository already includes a two-user HTTP acceptance suite in `supabase/tests/factory-analysis-integration.deno.ts`. It covers cross-tenant requests, rejected client-provided measurements/economics, persistence, same-key retry, idempotency conflicts, concurrent retries, recomputation/input-digest verification, direct-table access denial, and oversized-request rejection. The SQL security suite also checks tenant isolation, membership boundaries, append-only analysis persistence, and least-privilege grants. The current workflow must finish successfully for this test coverage to count as executed evidence.
- The latest Vercel production deployment is marked `READY`: [deployment](https://vercel.com/vartmaansharma-blips-projects/gridmind/BkYZkNwHQJ8Muvyj2gNdEhn5bHBT). It runs commit `a078aafd002935865fa5e6b000fe55a26483d05a`, while GitHub `main` is at `2d498a01c00716a323a6be7b28f4515327f9cce4` (five commits ahead). The intervening comparison showed documentation and a database migration, not application-source changes. Therefore the source SHA is not identical, but no frontend code difference was identified in that comparison. Live sign-in and analysis persistence still have not been verified by this check.
- Vercel reported no grouped runtime errors in the selected previous 24-hour window. This is useful operational evidence, not proof that the end-to-end workflow works.
- A fresh Supabase Security Advisor check still reports two warnings: the authenticated `public.create_factory_workspace(text,text,text)` SECURITY DEFINER RPC requires a documented, tested authorization rationale, and leaked-password protection remains disabled. Do not suppress the function warning merely to make the dashboard green. The multi-organization selection behavior should be tested before the product supports users belonging to multiple owner/admin organizations.

### Next actions — in order
1. Recheck the migration-replay run and inspect step/job logs if it fails or remains stalled. Do not run the same test against production.
2. If the local stack starts, confirm all migration replay, schema contract, SQL security, and authenticated Edge Function HTTP tests pass on the exact commit.
3. Investigate the workspace bootstrap RPC's multi-organization behavior and add an isolated regression test before changing its authorization logic.
4. Verify the deployed user journey with a designated authorized test account and a safe test asset: sign in, select/create workspace, persist an analysis, reload/recompute it, and verify tenant denial. Avoid inserting synthetic business records into the live database.
5. Resolve leaked-password protection through Supabase Auth settings after reviewing the sign-in flow; this has not been changed by the database tools.
6. Re-run CI, Quality Gate, migration replay, and Supabase advisors after any code or schema fix, and update this audit with the resulting evidence.

**Current gate:** basic live RLS smoke checks and CI/Quality Gate are positive; migration replay and the production authenticated journey remain unverified. GridMind is not yet cleared as production-ready.


### Follow-up verification results — 2026-10-11, later check
- Migration replay run [38118239514](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118239514) subsequently completed with **success** on commit `2d498a01c00716a323a6be7b28f4515327f9cce4`. This is positive evidence that clean migration replay plus the configured SQL/HTTP acceptance suite passed on that commit.
- After this audit checkpoint was committed, CI and Quality Gate both completed successfully on the newer documentation-only commit `bb0b4386c553dea5f7a908b5ee63295da4e8f8a6`: [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118481636) and [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118481623).
- A new migration-replay run on `bb0b4386c553dea5f7a908b5ee63295da4e8f8a6`, [run 38118481616](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38118481616), was still in progress at the **Start isolated local Supabase stack** step at the time of this check. The previous successful replay is not proof that this newer run has finished; recheck before closing the gate.
- The deployed homepage returned HTTP 200 and clearly labeled its displayed factory as fictional demo data. The public `/auth` page returned HTTP 200 and describes authenticated private workspace access. This verifies route availability and the demo label, not a successful sign-in or a live authenticated save/reload.
- Vercel production is `READY` on commit `a078aafd002935865fa5e6b000fe55a26483d05a`; the newer repository changes inspected since that SHA are documentation and database migration files. Vercel reported no grouped runtime errors in the prior 24-hour window.


### Milestone verification — 2026-10-11, fresh live checks
- Supabase reported PostgreSQL **17.11**; catalog checks found **42 public base tables and zero without RLS**.
- Fresh administrative counts: **1 Auth user, 4 factories, 8 factory assets, 0 observations, 0 factory analysis runs**. These are aggregate counts only; no production records were created or modified.
- A rollback-protected authenticated-role smoke test for the existing user returned 3 visible factories, 0 visible assets, and 0 visible observations. A non-member test UUID returned 0 for all three. The eight assets are not visible to the current user's membership, so this does not prove populated asset-level cross-tenant isolation.
- A diagnostic attempt to select `public.factory_analysis_runs` directly as `authenticated` was denied by table privileges. This is not automatically a defect: the intended write path is the JWT-verified `persist-factory-analysis` Edge Function. Preserve least privilege and verify the authorized read/write contract through the real client/Edge Function flow before changing grants.
- The latest Security Advisor check still reports the authenticated `public.create_factory_workspace(text,text,text)` SECURITY DEFINER warning and disabled leaked-password protection. These remain open.
- Combined status on commit `6874f4e291f1418841e40d840a324513ec4fe589` reports a Vercel failure whose target indicates a build-rate-limit/plan restriction. Treat the latest release check as blocked; this is not enough evidence to diagnose an application-code defect. Previously green CI/Quality Gate/replay runs on earlier SHAs must not be represented as current-SHA success.
- Added [Secure Operation & Factory Value Milestone](gridmind-secure-operation-and-factory-value-milestone-2026-10-11.md), defining exact two-user, persistence, and release acceptance criteria plus a preregistered factory-pilot protocol. The 15% improvement threshold is a proposed test hurdle only, not a forecast or result.

**Current gate remains open:** RLS catalog coverage and a basic non-member smoke test are positive. Two-real-user isolation on populated fixtures, authenticated analysis create/reload, exact-current-commit pipeline success, and measured factory value are not yet demonstrated. Do not mark GridMind production-ready.


## Supabase implementation checkpoint — 2026-10-15

**Status: Partially complete. Refs [Issue #29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29).** This checkpoint supersedes older readiness statements above. Implementation is on `codex/supabase-plan`, based on GitHub main `4ad1fb2197598aa91ca1c477b53a0c7ae62281b1`. Production has not been mutated or deployed.

### Implemented

- Added `20261015083942_reject_ambiguous_workspace_organization.sql`. The existing three-argument RPC retains its signature, authentication check, empty search path, and authenticated-only EXECUTE grant. Zero eligible organizations creates a separate owner workspace; one active owner/admin organization is reused; multiple eligible organizations raise `WORKSPACE_ORGANIZATION_AMBIGUOUS` before writes. Viewer/inactive memberships and user-editable metadata never select an organization. The client explains the ambiguous-membership error. Explicit multi-organization selection remains a future product contract; this patch fails closed rather than guessing.
- Added rollback-protected local bootstrap tests for zero/one/multiple eligible memberships, viewer/suspended membership, missing identity, blank name, anonymous denial, and partial-write denial. Wired these into the existing Migration Replay security SQL entry point with a relative psql include. Migration inventory tests run in the existing Vitest entry point; no workflow changes are required.
- Extracted the Edge Function's existing digest/reproducibility verification into a shared module used by the handler. Fourteen regression cases cover valid refusals, legacy NULL/empty/mismatched digests, changed inputs, row/result bindings, wrong requested factory, and canonical key ordering. Three client tests cover onboarding success, ambiguous membership, and other authorization errors.
- Corrected the membership-denial SQL fixture to capture the forbidden organization ID before switching roles. It no longer depends on authenticated SELECT access to `organizations`; no grant was added. Strengthened schema/security assertions for denied authenticated analysis SELECT, nullable text digest without a default, malformed digest rejection, and legacy NULL preservation.
- Added `supabase/tests/gridmind-schema-preflight.sql`, a SELECT-only metadata inventory, and `scripts/check-supabase-migration-drift.mjs`, a read-only identity comparison with six regression cases. Matching names are explicitly only alias candidates; the tool never repairs history or applies SQL. The HTTP fixture suite now rejects hosted target URLs before authentication.

### Fresh live evidence

- GridMind project `bvqmvgbfqhgczwbvlqkk` is ACTIVE_HEALTHY; PostgreSQL 17.11. All 42 public tables have RLS. No `TRUNCATE`, `REFERENCES`, `TRIGGER`, or `MAINTAIN` privileges were found for API roles on public tables.
- Both `asset_interventions.implemented_at` and `factory_analysis_runs.input_snapshot_sha256` remain absent. The input-digest constraint is absent with the column. Existing analysis constraints are validated and the append-only trigger is enabled. Browser analysis SELECT/INSERT/UPDATE/DELETE remain denied; service_role retains SELECT/INSERT and lacks UPDATE/DELETE.
- Candidate source has 34 migrations; live history has 30 entries. Seven source versions have possible differently versioned live counterparts. The recovered RLS bootstrap and both missing-column migrations are unrecorded by their source version; the new workspace migration is also intentionally unapplied. Identity matching alone cannot establish SQL equivalence.
- Security Advisor still reports the authenticated SECURITY DEFINER workspace RPC and disabled leaked-password protection. Performance Advisor reports 86 informational unused-index findings; none were dropped.

The workspace RPC deliberately needs SECURITY DEFINER to atomically create organization/owner/factory memberships without granting browser roles administrative table access. Retain the advisor warning with this authorization rationale and tests; do not suppress it by broad grants or SECURITY INVOKER. This candidate has not yet received independent security review or production execution.

### Executed verification and limits

- Native isolated PostgreSQL **17.10** replay: **all 34 source migrations passed**, followed by `factory-analysis-schema-contract.sql`, `factory-analysis-security.sql`, and `workspace-bootstrap-security.sql`. This used a temporary loopback database with minimal Auth schema/role fixtures and `auth.uid()` semantics. It is meaningful PostgreSQL/SQL authorization evidence, **not** a full Supabase Auth/PostgREST/Edge Runtime test or remote migration-history proof.
- Vitest: **82 tests passed in 11 files**, including six migration comparison regressions. TypeScript `tsc --noEmit`, documentation links (94 Markdown files), changed-TypeScript semantic ESLint, Deno check of the actual Edge Function/HTTP suite, and production build passed.
- Repository-wide semantic ESLint on the unchanged main baseline still has two errors: `prefer-const` in `src/integrations/supabase/previewAuthStorage.ts:38` and `no-explicit-any` in `src/routes/opportunities.tsx:38`, plus eight existing Fast Refresh warnings. The focused change does not claim to close repository-wide validation work.
- Full isolated Supabase HTTP acceptance was **not run locally**: Docker is unavailable. GitHub Actions previously had the account billing/spending-limit blocker tracked in [Issue #42](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/42); exact candidate checks must be read after publication. Production sign-in/recovery and save/reload remain unverified.

### Remaining release requirements

1. Restore Actions execution if still blocked; run all three workflows on the exact reviewed candidate, including real local Auth and authenticated Edge Function HTTP acceptance.
2. Independent security/database review must compare the seven version aliases' SQL and live object definitions. Establish the named operator, reviewer, recovery/restore point, maintenance window, stop conditions, and explicit production authorization required by [the alignment runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md). Do not blindly run `db push`, replay the bootstrap, rename published migration history, or fabricate backfills.
3. Apply the approved missing-column and workspace migrations through reviewed reconciliation; verify types/defaults/constraints and preserved legacy NULLs. Deploy the matching Edge Function only after that compatibility gate passes.
4. The authorized Auth operator must review sign-up/sign-in/recovery and enable [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), then rerun Security Advisor. No supported configuration-write connector was available in this run.
5. Verify the exact deployment with legitimately provisioned accounts/data: normal sign-in, workspace visibility, analysis save/reload/recompute, retry/conflict, and populated two-user cross-tenant denial. Never run synthetic fixture suites on production.

**Score: 7/10** — scope 2/2, evidence 2/2, execution 1.5/2, independent verification 0.5/3, recordkeeping 1/1. Lost points reflect unrun full Supabase HTTP/current-SHA CI, missing independent review, and unexecuted production reconciliation/Auth changes. Outcome: repository fixes and isolated SQL/unit evidence are available. Next task: execute full isolated Supabase replay/HTTP on the reviewed PR, because production changes depend on that evidence. Future-answer rules: compare full migration identities; preserve unknown historical fields; distinguish native PostgreSQL tests from Supabase HTTP tests; never turn advisor silence or a successful build into a production-readiness claim.

### Integration follow-up — 2026-10-15

[Draft PR #72](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/72) contains this implementation. Main advanced during execution; it was incorporated with a normal merge (no published history rewrite). Combined code candidate **`21727ea06fe5258cfda175a1c62c079eaa53f267`** includes main through `fcc796d`.

- Fresh combined-candidate verification: **96 Vitest tests passed in 15 files**, TypeScript passed, repository-wide semantic ESLint passed with **zero errors and eight existing Fast Refresh warnings**, Markdown links passed (94 files), Deno checked the authoritative Edge Function and HTTP suite, and production build passed. The earlier two main-baseline lint errors above were resolved by the intervening main changes; they are no longer blockers on this combined candidate.
- All 34 source migrations and the schema/security/bootstrap assertions passed again in native isolated PostgreSQL 17.10. The temporary native harness expands the psql relative include without altering SQL dollar quoting; real Migration Replay executes that include directly through psql. Docker/full Supabase HTTP acceptance remains unrun locally.
- Exact combined candidate's [Migration Replay run](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38709031222) failed before the job started. GitHub's failure annotation explicitly identifies failed recent account payments or a spending limit that needs increasing. The current CI and Quality Gate checks also report failure. This is the existing Issue #42 infrastructure blocker, not evidence of an executed application/SQL failure.
- Vercel's GitHub status is “Deployment was blocked”; its cause was not diagnosed in this task. Supabase Preview is skipped because this branch is not associated with a provisioned Supabase branch. No paid branch was provisioned.

**Remaining gate:** account owner resolves Actions billing/spending restriction, reruns all exact-candidate workflows including isolated HTTP acceptance, and obtains independent database/security review with the recovery point and controlled production reconciliation/Auth plan. Production remains HOLD. The implementation's score remains **7/10** because these material release requirements are unverified/unexecuted; the local repository validation blocker is now resolved.
