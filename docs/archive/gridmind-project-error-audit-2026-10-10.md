> [!IMPORTANT]
> **Status: HISTORICAL SNAPSHOT — NOT A CURRENT EXECUTION AUTHORITY (reviewed 2026-10-13).** This document is preserved for context and evidence. Its dated ratings, status claims, recommendations, and next steps may be stale; do not treat them as current instructions or proof of present readiness. Follow the [canonical Master Plan](../gridmind-master-plan-2026-10-11.md), [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and current linked GitHub issues for present decisions and blockers. No historical findings below have been deleted or rewritten.

# GridMind project error audit — 2026-10-10

## Scope and limits
Read-only audit of GitHub default-branch files, Vercel deployment metadata and grouped runtime errors, Supabase unified logs, public schema/RLS flags, migration history, and Edge Function inventory. No product-code changes were made during this audit. Vercel's current Hobby-plan runtime-log query for the last 30 minutes returned no matching records; the attempted 24-hour query was rejected because the plan does not retain that window. Absence of recent Vercel runtime logs is not proof of no current runtime errors.

## Findings (ordered by priority)

### P1 — Factory profile writes failed due to missing table privilege (historical production error confirmed; fix applied, browser acceptance unverified)
- Evidence: Supabase Postgres logs on 2026-10-10 around 08:23–08:25 UTC show repeated SQLSTATE 42501 permission denied for table factories for an UPDATE changing industry, location, metadata, and name.
- Fixes applied in production and committed: restore_authenticated_factory_api_privileges (commit f8acf8408536f9f0f4f86665e5f2d6539ef76c0c) and grant_authenticated_factory_profile_updates (commit 56d4e51aef36a0ec3cd2cb3efd9962ff09112933).
- Verification: SQL privilege check after migration returned authenticated SELECT/UPDATE on factories.
- Remaining: no observed authenticated browser save + refresh acceptance yet. Do not mark fixed end-to-end until that passes.

### P1 — Equipment persistence lacked INSERT/UPDATE table grants (confirmed privilege gap; grants applied, browser acceptance unverified)
- Evidence: privilege check showed authenticated lacked INSERT/UPDATE on factory_assets while SELECT existed. Existing RLS policies require factory owner/admin membership for asset writes.
- Fix: grant_authenticated_factory_asset_writes, committed as 016c41435ef23542c3976a2057fa261af555c326.
- Verification: subsequent SQL privilege check returned SELECT/INSERT/UPDATE on factory_assets.
- Remaining: test create/update equipment through UI and verify persistence after reload.

### P1 — Historical SSR crash: ReferenceError: setActive is not defined (Vercel grouped errors; current status not proven)
- Evidence: Vercel error grouping reports 6 occurrences across 3 users on route /__server, first/last 2026-10-08 08:52–08:54 UTC, deployment dpl_LRMGwuNyt8YxdH96piW7zKG5nfoB. Stack points to AppShell.
- Current source inspection: src/components/gm/app-shell.tsx imports setActive from useEnergy(), so current checked source contains the binding. This suggests the historical failure may be from an older deployed bundle, but does not prove the live route was retested.
- Action: reproduce the deployed route and verify production serves the expected commit. Add a regression check for SSR rendering of AppShell.

### P1 — Monthly data and analysis persistence are not end-to-end verified
- Evidence: prior live workspace snapshot had no observations, operating/economic contexts, or analysis runs; the screenshot showed 0/100 data quality and no monthly/equipment rows. These are signs of an unpopulated workspace, not by themselves proof of code failure.
- Active Supabase Edge Function: persist-factory-analysis, JWT verification enabled, version 1. Verify client invocation, success/error handling, idempotency/retry, and reload retrieval in a controlled test.
- Action: trace monthly row writes and analysis persistence from UI handler through Supabase API/function, then verify rows and reload behavior.

### P2 — Error visibility is too generic in Add Factory
- Evidence: src/components/gm/app-shell.tsx catches exceptions and stores error.message in the dialog, but displays a generic toast, Factory creation failed. Detailed text is only visible inside the dialog.
- Action: improve developer-safe detail and structured request logging without exposing secrets/tokens.

### P2 — Build/test status not established
- package.json defines typecheck, lint, test, build, and combined check scripts. These scripts were not run because this audit used connected repository tools and no local checkout/command runner was available in this audit context.
- Action: run bun run check in CI/local environment and record actual results. Deployment READY does not prove checks pass.

## Security and data isolation
- All inspected public tables report RLS enabled.
- Policies inspected for factories and factory_assets restrict writes to owner/admin factory members; member reads are membership-scoped. Grants add table-level capability but do not remove RLS as the row authorization boundary.
- Still required: test cross-tenant isolation using a second non-member account in a controlled test. RLS enabled alone does not prove every policy is correct.
- Do not seed fictional operational data into a real customer's factory. Use a dedicated, clearly labelled test workspace.

## Deployment observations
- Latest listed production deployment is READY and points at commit daaa53d4cb8e1e86cd1e15111732254249a76dc0, a documentation-only audit gate commit.
- Vercel logs API refused the 24-hour query under the project's Hobby retention; a 30-minute warning/error query returned no matching entries. Runtime log visibility is limited.
- Supabase migration history includes the privilege-related migrations, including factory and asset grants.

## Recommended order before new product work
1. Verify profile save + refresh persistence in authenticated production.
2. Verify monthly data save + refresh persistence.
3. Verify equipment create/update + refresh persistence.
4. Verify analysis run persistence/reload through persist-factory-analysis.
5. Test a non-member cannot read or write the workspace.
6. Run typecheck, lint, tests, and build; resolve failures.
7. Recheck historical SSR setActive crash on current production and add regression coverage.
8. Improve error observability and user-facing failure messages.

## Audit status
Partial, evidence-based audit complete. No new code fixes made in this pass. Main uncertainty is live end-to-end persistence, followed by build/test execution and current-production SSR verification.


## Repair execution update — 2026-10-10

### Code change committed
- Commit: [990a718](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/commit/990a718057c0e115c6ad78e045ac6dfd1321288b)
- File: `src/lib/energy/store.tsx`
- Change: serialize debounced persistence operations per factory to prevent overlapping writes from completing out of order; surface persistence failures with a user-visible toast while retaining the detailed error in the console for diagnosis.
- Rationale: the UI updated local React state optimistically and persistence failures were only written to the console, so a failed save could look successful. Concurrent debounced writes could also race.
- Verification status: source change committed. Build/typecheck/test results and authenticated save-after-reload acceptance are not yet established. Do not call this issue fully resolved until CI/build succeeds and profile, monthly rows, and equipment are saved and verified after reload in an authenticated test workspace.
