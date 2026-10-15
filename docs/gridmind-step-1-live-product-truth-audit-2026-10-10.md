> [!IMPORTANT]
> **Status: HISTORICAL SNAPSHOT — NOT A CURRENT EXECUTION AUTHORITY (reviewed 2026-10-13).** This document is preserved for context and evidence. Its dated ratings, status claims, recommendations, and next steps may be stale; do not treat them as current instructions or proof of present readiness. Follow the [canonical Master Plan](gridmind-master-plan-2026-10-11.md), [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and current linked GitHub issues for present decisions and blockers. No historical findings below have been deleted or rewritten.

# GridMind Step 1 — Live Product Truth Audit

**Checked:** 2026-10-10, approximately 07:49 UTC  
**Scope:** GitHub `main`, linked Vercel project, live Supabase project `bvqmvgbfqhgczwbvlqkk`.  
**Method:** read-only repository, deployment, schema, migration, SQL metadata, and advisor checks. No production writes, migrations, memberships, deployments, or factory-data ingestion were performed.

## Executive verdict

**Step 1 is partially complete: the environment and key blockers are now verified. GridMind is not yet ready for a real-factory analysis or a pilot claim.**

The deployed web application is reachable and the latest Vercel production deployment is marked READY. The database has a substantial schema and recorded migrations. However, the live Supabase project currently has **no deployed Edge Functions, no `factory_analysis_runs` table, zero organization/factory membership rows, and zero canonical source observations/contexts**. The canonical analysis path therefore has not been demonstrated in this live environment.

The immediate next action is an authorized, controlled workspace-bootstrap and analysis-runtime readiness fix—not more UI feature work.

## Verified facts

### 1. Vercel / deployed application

- Vercel project: `gridmind`, linked to `vartmaansharma-blip/gridmind-insights-ea7a9796`.
- Latest production deployment: `dpl_79sPFhdDJ59UxfPHhZ9MQTAWFN1v`, state `READY`.
- Latest deployment commit: `4cc12c7f276de33ab894dc955bbb64fc7aea783e`.
- The deployed root and `/factory` routes returned HTTP 200 when fetched through the Vercel access integration.
- The rendered overview explicitly labels the example as **“Demo data · fictional factory.”** Keep that label: it prevents sample values being mistaken for a real customer result.
- Vercel's aggregated runtime-error view reported no runtime errors in the selected 24-hour window. This does not prove end-to-end product correctness.
- A 24-hour detailed runtime-log query could not be retrieved because the account's Hobby plan does not retain logs for that requested window. This is a limitation, not evidence of no logs.

### 2. Supabase database / migrations

- Supabase project `GridMind projects` (`bvqmvgbfqhgczwbvlqkk`) is `ACTIVE_HEALTHY`.
- Read-only live query timestamp: `2026-10-10 07:49:26 UTC`.
- The live database reports 21 applied migrations, through `20261009075300_require_active_org_membership_for_factory_access_v1`.
- The public schema contains 41 listed tables; Row Level Security is enabled on the listed tables, including `observations`, `operating_contexts`, `economic_contexts`, `organization_members`, and `factory_members`.
- Live counts:
  - Factories: **1**
  - Registered assets: **8**
  - Organization membership rows: **0**
  - Factory membership rows: **0**
  - Canonical observations: **0**
  - Operating contexts: **0**
  - Economic contexts: **0**
  - Data sources: **0**
  - Source mappings: **0**
- The table `public.factory_analysis_runs` is absent.
- `public.persist_factory_analysis` is absent.
- Supabase Edge Function listing is empty: **no Edge Functions are currently deployed to this project**.
- Therefore the repository's canonical persistence/reload/recompute design is not currently present as a live deployed analysis path in this Supabase project.

### 3. Security and performance advisories

- Security advisor reports one warning: authenticated users can execute `public.create_factory_workspace(text,text,text)`, a SECURITY DEFINER function.
- Read-only inspection of its current definition shows it requires `auth.uid()`, requires a non-empty factory name, and creates a new organization only if the caller has no active owner/admin organization; it then creates a factory and owner membership. It sets an empty search path and schema-qualifies its table references.
- **Recommendation:** do not blindly revoke execution. Have a security reviewer confirm the intended onboarding contract and verify authorization tests, including whether an authenticated caller can create a new workspace under the intended policy.
- Supabase Auth's leaked-password protection is disabled; enable it when feasible.
- Performance advisor reports 90 unused-index notices. Do not remove indexes based on this alone; a young or low-traffic environment can have valid indexes that have not yet been used.

## Critical blockers

### P0 — No active authorized workspace memberships

The live database has zero organization and factory membership rows. The current application may render the fictional demo, but the intended real-factory workflow needs a legitimate signed-in owner/admin and factory membership.

**Next action:** the actual workspace owner should sign in and use the authenticated workspace flow. Confirm the resulting organization and factory memberships via read-only SQL. Do not fabricate a user UUID or attach an arbitrary account to an existing factory.

### P0 — Canonical analysis runtime is not deployed

The live database has no `factory_analysis_runs` table or `persist_factory_analysis` function, and Supabase lists no deployed Edge Functions. A Vercel page returning 200 does not establish that analysis can run or persist.

**Next action:** reconcile repository migrations and the intended Supabase project. Determine why the analysis-run persistence migration/runtime is not present in the applied migration set. Verify clean migration replay and authenticated integration tests on the current commit before requesting approval for any production migration/deployment. Do not deploy or migrate as part of this read-only audit.

### P0 — No real canonical evidence

There are no observations, operating contexts, economic contexts, data sources or mappings in the live database. The registered assets are not proof of actual measured consumption or production.

**Next action:** only after access and runtime readiness, select one real asset and request authorized, traceable source records with matching periods, operating context and documented economic inputs. Do not invent missing readings or assumptions.

### P1 — Security setting needs review

The workspace-bootstrap SECURITY DEFINER warning is not automatically a vulnerability, but it is security-sensitive. Review the function's authorization intent and tests. Enable leaked-password protection as a separate auth-hardening action.

## Acceptance criteria for closing Step 1

- [x] Identify the linked Vercel project and current production deployment.
- [x] Confirm the deployed application can return the overview and factory routes.
- [x] Query the live Supabase schema and applied migration list.
- [x] Query membership and canonical evidence counts.
- [x] Check deployed Edge Functions and analysis persistence objects.
- [x] Retrieve current Supabase security/performance advisor results.
- [ ] Confirm a real owner/admin can sign in and establish legitimate workspace/factory access.
- [ ] Reconcile missing analysis-run table/function and deployed Edge Function with repository migrations.
- [ ] Pass current-SHA clean migration replay and authenticated end-to-end integration tests.
- [ ] Run an authorized, controlled analysis with real traceable evidence and verify persistence/reload/recompute.
- [ ] Obtain qualified domain review before making pilot or outcome claims.

## Recommended next move

**Fix and verify the canonical runtime before adding product features.** First inspect the repository's migration-replay workflow and integration-test contract against the live applied migration list; identify the exact missing migration and function deployment sequence. Then use a non-production/clean replay environment for proof. Production changes require explicit authorization and a reviewed change plan.

In parallel, arrange the authorized owner sign-in to establish workspace membership. Keep the marketing website's claims conservative until the runtime and real-data path are proven.

## Evidence sources

- [GridMind live-acceptance runbook](gridmind-live-acceptance-runbook.md)
- [System-alignment audit](gridmind-system-alignment-audit.md)
- [Authoritative analysis design](gridmind-authoritative-analysis.md)
- [Canonical migration design](canonical-application-migration-v1.md)
- [Release gate](release-gate.md)
- [GridMind repository](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796)
- [Latest Vercel deployment](https://vercel.com/vartmaansharma-blips-projects/gridmind/79sPFhdDJ59UxfPHhZ9MQTAWFN1v)


## Corrected source/migration reconciliation (verified after the initial report)

The initial follow-up note above incorrectly stated that the repository did not contain the persistence-table migration. A full migration filename/content scan found the exact migration on `main`:

- `supabase/migrations/20261009130000_gridmind_factory_analysis_runs_v1.sql`
- It creates `public.factory_analysis_runs`, enforces append-only behavior, applies RLS, and grants table writes to the service role rather than browser roles.
- The live Supabase migration history stops at `20261009075300_require_active_org_membership_for_factory_access_v1`. Therefore `20261009130000_gridmind_factory_analysis_runs_v1` is present in source but **not applied to the live database**.
- The repository also contains `supabase/functions/persist-factory-analysis/index.ts`, but the live Supabase project reports zero deployed Edge Functions.

**Correct diagnosis:** this is not a missing migration source. It is a pending production migration plus an undeployed Edge Function. Do not add a duplicate migration. The safe next step is to run/verify the existing migration through the approved release path, then deploy the function with the required secrets and validate authenticated persistence/reload/reproducibility. These production operations were not performed by this documentation commit.

The prior incorrect sentence claiming that no migration definition exists is superseded by this corrected finding.


## Engineering follow-through committed

The following safe repository changes were made after the live audit:

1. Added `supabase/tests/factory-analysis-schema-contract.sql`, a read-only post-migration contract test that fails if the persistence table, RLS, member-scoped read/insert policies, append-only trigger, or expected role grants are missing.
2. Updated `.github/workflows/migration-replay.yml` to run this contract test immediately after a clean local migration replay.
3. Corrected the diagnosis above: the migration exists in source; it is pending in the live project. No duplicate migration was added.

Commits:
- `0d416a9b15184780f7bd0ef7725c7d22c372350c` — correct audit diagnosis.
- `7e755d5c931d542e46b42e7ed62de401c82b822e` — add schema contract test.
- `a2ed14729830d7ccef754635a8127c4d8f6536b6` — wire test into migration replay.
- `b1d69708af51edabf3f81329b26b25c01d32080f` — correct workflow DB URL parsing.

**Validation status:** repository source and commit metadata were inspected; the latest combined commit status was still pending at the time of this update. Do not claim the new migration replay test passed until its workflow result is confirmed.

**Still blocked:** applying migration `20261009130000_gridmind_factory_analysis_runs_v1` to production through the approved release path; deploying `persist-factory-analysis` with the required secrets; establishing a legitimate authorized owner/factory membership; and running the authenticated end-to-end verification against live authorized evidence. None of those production operations were performed by these commits.


## Production follow-through — 2026-10-10

After the repository changes above, the existing migration was applied to the live Supabase project using the exact committed SQL from `supabase/migrations/20261009130000_gridmind_factory_analysis_runs_v1.sql`. No duplicate migration file was created.

### Live database verification

A read-only post-deployment query confirmed:

- `public.factory_analysis_runs` exists.
- Row-level security is enabled.
- The expected member-scoped SELECT and INSERT policies exist.
- The append-only trigger exists.
- `authenticated` cannot directly INSERT analysis runs.
- `service_role` has the intended SELECT and INSERT privileges.

Supabase migration history records the migration as version `20261010075630` with name `20261009130000_gridmind_factory_analysis_runs_v1`. Supabase assigned a fresh history version during application; retain the committed source migration as the canonical definition and verify future migration replay against this live history.

### Edge Function deployment

Deployed `persist-factory-analysis` as active version 1 with JWT verification enabled. The initial deployment attempt failed because the deployment bundler did not resolve the source tree's parent-relative `../_shared/` imports. The deployment package was corrected by bundling the exact shared source modules alongside the entrypoint and adjusting only the packaged import paths. No source files were changed by that packaging adjustment.

- Function ID: `27cae70d-8852-4c31-9062-ad01307dd092`
- Status: `ACTIVE`
- JWT verification: enabled
- Function source is available in the repository at `supabase/functions/persist-factory-analysis/index.ts` and its imported shared modules.

### Remaining validation — not yet complete

- The GitHub Migration Replay workflow for commit `37c028df80b065057dbab036891353c8be6e6320` was still `in_progress` at the last check. Do not report its test suite as passing until a completed result is visible.
- A live authenticated HTTP persist/retry/verify test has not yet been completed. Production has zero organization-membership rows and zero factory-membership rows from the earlier audit, so do not create fabricated production identities or seed synthetic evidence merely to make this pass.
- Function deployment is confirmed by Supabase's control plane, but runtime HTTP behavior remains unverified. Inspect function logs and test with a legitimately authorized account and factory before declaring Step 1 closed.
- Existing security-advisor warnings remain: the authenticated SECURITY DEFINER workspace-creation function and disabled leaked-password protection. The workspace function was reviewed previously and should not be changed without an explicit authorization-contract review.

**Current state:** schema deployment and Edge Function deployment are complete; security-preserving live schema checks pass. Authenticated runtime acceptance and the CI migration-replay result remain open. Demo data remains synthetic and must not be described as a real-factory finding.


## Pilot readiness check — 2026-10-10

A fresh read-only inventory query shows the single registered factory and its eight configured assets. All eight currently report `manufacturer = Generic`, `calibration_status = not_calibrated`, and `sensor_coverage_pct = 0`. No canonical observations or saved analysis runs exist, and there are no organization/factory membership rows.

**Decision:** none of these asset records currently qualifies as a real-data pilot candidate based on the database evidence. Treat this inventory as configured/demo setup until an authorized factory contact confirms the site and asset identity. Do not pick a machine or calculate savings from its nameplate data alone.

### Next external dependency

Obtain a legitimate factory/workspace owner account and authorization for one real pilot site, then request existing source records using [the real-factory pilot data request](gridmind-real-factory-pilot-data-request.md). Prefer an asset with an identifiable meter boundary, matched production output, operating hours/context, documented tariff, and a reviewer who can validate the source. Only after access and data provenance are established should canonical observations be ingested and the authenticated production acceptance test be run.

The GitHub migration replay / authenticated HTTP test workflow was still running at the last check. Its result remains unconfirmed.


## Current verified state — rechecked 2026-10-10, approximately 08:05 UTC

This section supersedes the earlier top-level environment snapshot where it conflicts with the later production follow-through notes.

### Workflow evidence

On commit `aecd4f2839358f0d72f8034862f7313972288d63`, all three latest GitHub Actions workflows completed successfully:

- [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036362857): typecheck, semantic ESLint, tests, and production build passed.
- [GridMind Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036362793): passed.
- [GridMind Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036362872): clean local Supabase startup, replay of every migration from an empty database, schema contract, tenant-isolation/direct-table-denial/append-only tests, authenticated Edge Function HTTP integration using isolated local fixtures, and no-pending-local-migrations check all passed.

This closes the repository-level CI/replay gate for that commit. It does **not** prove that the production account can authenticate, that the live workspace membership is correct, or that a real-factory analysis is valid.

### Fresh live account and data preflight

A new read-only query found one Supabase Auth user. The user matching the email used by the repository's GitHub commits exists, but has zero organization memberships and zero factory memberships. The query deliberately did not copy the email address into this audit. Live counts remain: one organization, one factory, zero organization memberships, zero factory memberships, zero analysis runs, zero canonical observations, zero operating contexts, and zero economic contexts. The Edge Function remains ACTIVE version 1 with JWT verification enabled.

The eight configured assets are still not evidence of real operating measurements: the latest asset inventory reported generic manufacturers, not-calibrated status, and 0% sensor coverage. Do not treat this workspace as a real pilot until an authorized factory contact confirms its identity and supplies traceable records.

### Decision and next action

**Do not create or directly attach a membership from an administrative SQL shortcut.** The founder's existing authentication identity is present; the missing step is authenticated workspace setup and correct authorization. Sign in through the application with that existing account, then determine whether the configured factory belongs to the founder or is merely demo/third-party inventory. If it is not the founder's workspace, create a separate workspace using the authenticated workspace-creation flow rather than attaching the founder to the existing factory.

After the authenticated workspace flow, verify both organization and factory memberships read-only. Then select one confirmed real asset, obtain the real-factory data request and evidence, and perform live authenticated persist/retry/reload/recompute plus cross-tenant denial checks. No live membership, data, migration, or deployment writes were made by this recheck.


## Follow-up execution check — 2026-10-10, after documentation commit `394cdb2`

### Account and application flow

The existing Supabase Auth identity matching the repository commit email is present, but read-only counts still show zero organization memberships and zero factory memberships. The app's implemented route is `/auth`; it uses password-based Supabase sign-in and does not require creating another identity. After sign-in, `src/components/gm/app-shell.tsx` presents **Create your first factory** when no authenticated factory is visible. Its Add Factory flow calls `createFactoryWorkspace` in `src/lib/gridmind/repository.ts`, which invokes the authenticated `create_factory_workspace` RPC and reloads the caller's factory snapshots. This is the appropriate path; do not manually insert memberships or attach the account to the configured existing factory until its ownership is confirmed.

### Workflow status correction

For commit `394cdb25d1ef9e5e28ac7e2e12812f98b2b78cd4`, CI passed and GridMind Quality Gate passed. Migration Replay was still pending at the latest check. Earlier commit `aecd4f2` had all three workflows pass, but that historical pass must not be presented as a pass for the newer commit. See [CI run](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036717626), [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036717676), and [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036717696).

### Hard blocker and safe next step

The remaining immediate blocker is an interactive sign-in using the founder's existing credentials. The assistant cannot complete this without a user-authenticated browser session and must not ask for or handle the password. Once the founder signs in and creates a factory they own, verify both membership layers read-only, then perform production persist/retry/recompute and tenant-isolation acceptance. Real-factory analysis still requires authorized, traceable evidence; configured demo assets are not evidence.


## Live readiness refresh — 2026-10-10, current recheck

This section supersedes older live-count and deployment statements above where they conflict. It records read-only observations only; it does not represent an authenticated end-to-end acceptance test.

### Verified current observations

- **Supabase public-table inventory:** 2 organizations, 4 factories, 8 factory assets, 1 active organization membership (role: owner), 3 factory memberships (all role: owner), 0 canonical observations, 0 operating contexts, 0 economic contexts, and 0 persisted factory analysis runs.
- **Interpretation limit:** row counts do not establish that any site or asset is a real customer facility, that the current user is authorized to use it for a pilot, or that the recorded memberships have the intended ownership. The earlier zero-membership snapshot is now stale.
- **Vercel:** the most recent deployment returned by the deployment listing is in `READY` state and points to source commit `74015c0de7b80fb254acb8a2c0dd14b6a864c9e6`. This is older than the latest documentation-only commits. A READY deployment is not evidence that authenticated application flows pass.
- **Runtime errors:** Vercel's aggregated runtime-error view reported no runtime errors during the preceding 24 hours. This does not test business logic, authorization boundaries, data correctness, or persistence.
- **GitHub checks:** the latest documentation commit's CI, GridMind Quality Gate, and Migration Replay runs were pending at the time of this check. Earlier successful workflow runs apply only to their own recorded commit and must not be carried forward as current status.

### Acceptance-gate status

| Gate | Status | Evidence / limitation |
|---|---|---|
| Source repository has CI, quality, migration replay and test definitions | **Verified present** | Workflow and test files exist in the repository. |
| Latest commit passes CI, quality and migration replay | **Pending / unknown** | Must confirm final workflow conclusions for the final commit. |
| Production deployment exists and reports READY | **Verified, limited** | Deployment source commit is older than latest documentation commits; readiness does not prove functional acceptance. |
| No aggregated runtime errors in prior 24 hours | **Verified, limited** | Error aggregation is not a functional test. |
| Authenticated live persist → idempotent retry → reload/recompute | **Not verified** | No end-to-end result was collected in this read-only refresh. |
| Cross-tenant denial and direct-write denial in production | **Not verified in this refresh** | Historical local isolated tests are not substitutes for current production acceptance. |
| Real-factory source data, independent review and measured outcome | **Not established** | Current canonical evidence/context/run counts are zero. |
| Buyer pain and willingness to pay validated | **Not established** | No interview or paid-pilot evidence was collected by this refresh. |

### Next safe action

Use the authorized application sign-in/workspace flow to establish which factory workspace belongs to the legitimate user. Do not modify memberships or seed factory data as a shortcut. After authorization is confirmed, run the documented live acceptance sequence with a clearly identified test analysis, then request traceable factory records under explicit permission. In parallel, begin structured buyer discovery using the common candidate rubric in [the pilot comparison scorecard](gridmind-pilot-comparison-scorecard.md).

**Readiness decision:** GridMind is **not yet demonstrated pilot-ready** by the evidence collected here. This is an evidence-status decision, not a claim that the product cannot become ready.
