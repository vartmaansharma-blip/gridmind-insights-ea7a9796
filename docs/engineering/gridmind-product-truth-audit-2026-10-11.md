# GridMind Product Truth Audit — 2026-10-11

**Status:** Repository/source audit started; live production verification is still incomplete.  
**Scope:** Read-only inspection of the GitHub `main` branch and GitHub Actions metadata. No application code, production data, or deployed configuration was changed.  
**Authority:** The Decision Constitution and Contradiction Register remains controlling.

## Executive finding

GridMind is more than a static dashboard in source: the repository contains an authenticated workspace UI, tenant-scoped Supabase schema/RLS migrations, a server-authoritative factory-analysis Edge Function, append-only persisted analysis runs, input snapshots, result fingerprints, and reload/recompute verification code. The latest visible CI and Quality Gate runs succeeded on commit `f1b06ef152adf6447ca50f0644329da3957c0366`.

That is meaningful engineering evidence, but it is **not yet proof of live end-to-end readiness**. The migration-replay workflow for that commit was still in progress when inspected. This audit did not execute the application, query the live Supabase project, run the SQL readiness diagnostic, inspect deployed Edge Function versions, or verify a real authorized factory workflow. No customer demand or measured customer outcome has been established by this code audit.

## Evidence inspected

### Repository and tooling
- Repository: `vartmaansharma-blip/gridmind-insights-ea7a9796`, default branch `main`, private repository.
- `package.json` defines `typecheck`, `lint`, `test`, `build`, `check`, and Markdown-link checks. The combined `check` script is typecheck → lint → tests → build.
- CI workflow runs frozen Bun install, Markdown link audit, TypeScript typecheck, selected semantic ESLint, Vitest, and production build.
- Quality Gate additionally checks the authoritative Supabase Edge Function and Deno HTTP acceptance test.
- Latest visible GitHub Actions metadata at audit time:
  - [Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38110322545): completed, success, commit `f1b06ef...`.
  - [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38110322409): completed, success, commit `f1b06ef...`.
  - [Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38110322477): in progress at inspection time; outcome unknown here.
- These workflow statuses are GitHub-reported results. This audit did not independently rerun them.

### Product UI and data-path evidence
- `src/routes/index.tsx` is the current factory overview route. It presents energy/cost KPIs, estimated exposure, findings, evidence limits, and savings-verification status. It explicitly labels exposure as estimated rather than verified loss, and states monthly inputs do not support specific machine-fault diagnosis.
- `src/routes/auth.tsx` implements Supabase password sign-in/sign-up and directs the user to the overview route after authentication. Source inspection alone does not prove deployed authentication settings or live session behavior.
- `src/lib/gridmind/analysis-runner.ts` calls persistence and then reload/recompute verification. It sends factory/asset IDs and an idempotency key rather than client-supplied measurements.
- `src/lib/gridmind/analysis-run-store.ts` invokes the `persist-factory-analysis` Edge Function for both persistence and verification. It expects a stored run and a recomputed result; it exposes a `reproducible` field from the server response.
- `supabase/functions/persist-factory-analysis/index.ts` exists as the authoritative Edge Function entry point. Its deployed version and live behavior were not verified in this audit.
- The `factory_analysis_runs` migration defines an append-only run table, factory/asset foreign-key consistency, unique per-factory idempotency keys, algorithm version, input snapshot, result fingerprint, status and refusal codes. A later migration adds a SHA-256 digest for canonical input snapshots, nullable for historical rows.
- A read-only diagnostic exists at `supabase/tests/gridmind-live-readiness.sql`. It checks factory membership, assets, canonical observations, operating/economic contexts, data sources/mappings and the analysis-runs table. **The diagnostic has not been run against the live project**, so no factory is certified ready by this audit.
- Security-oriented SQL and Deno integration tests exist, including tenant-isolation assertions. Existence of tests is not equivalent to passing against the currently deployed environment.

## Confirmed strengths from source and CI metadata

1. **Server-authoritative analysis boundary:** browser code passes canonical entity identifiers; the Edge Function is intended to assemble authoritative inputs.
2. **Reproducibility intent:** persisted input snapshot, algorithm version, result fingerprint, idempotency key and reload/recompute verification are represented in code/schema.
3. **Tenant-security intent:** migrations and tests explicitly address active organization/factory membership, RLS and cross-tenant reads.
4. **Evidence discipline in UI copy:** estimates, unknown machine condition and verified savings are distinguished.
5. **Automated checks exist and recently passed:** CI and Quality Gate succeeded for the inspected commit.

These strengths support continued verification; they do not justify a production-ready claim yet.

## Blockers and unknowns

| Area | Current status | Evidence required to close |
|---|---|---|
| Live deployment identity | Unknown | Record deployed frontend commit/build and deployed Edge Function version; confirm environment without exposing secrets. |
| Migration state | Unknown; replay workflow was in progress | Completed migration-replay result and migration ledger from the intended environment. |
| Authenticated end-to-end workflow | Source path exists; live path unverified | Authorized test account/workspace; sign in, select an authorized factory/asset, persist run, reload and verify the same run. |
| Tenant isolation | Security migrations/tests exist; live enforcement unverified | Isolated two-user/two-organization acceptance test in an ephemeral environment, plus deployed-policy verification. Never test by accessing another customer's data. |
| Persistence and reproducibility | Implemented in source; runtime outcome unverified | Show persisted run, canonical input digest, result fingerprint, idempotency behavior, and successful reload/recompute; document expected differences/refusals. |
| Data readiness | Diagnostic exists; no live result captured | Run the read-only readiness SQL only in an authorized environment and record blockers by test fixture/factory with sensitive data minimized. |
| Real-world validity | Not established by code/CI | Qualified reviewer adjudicates findings against source records; establish a baseline and document uncertainty. |
| Customer/problem fit | Not established by this audit | Buyer interviews and a recent concrete problem with data owner, reviewer and budget owner. |
| Value realization | No verified customer outcome established | Approved intervention, defensible baseline, measurement window, confounder handling and customer confirmation. |

## Next actions, in order

### A. Close the CI/migration evidence gap
1. Re-check the linked Migration Replay workflow and record its final result.
2. If failed, identify the exact failing migration/test before changing SQL; reproduce on an ephemeral local database first.
3. Do not push speculative migration fixes directly to `main`.

### B. Verify one authorized vertical slice
1. Identify a non-customer test workspace or owner-authorized factory/asset.
2. Confirm deployed frontend and Edge Function identity.
3. Sign in and confirm only the authorized workspace is visible.
4. Run one analysis with a new idempotency key.
5. Inspect the persisted run and input snapshot digest.
6. Reload/recompute the same run; capture the returned reproducibility result and fingerprint comparison.
7. Retry the same key and verify idempotency; verify a different key behaves as intended.
8. Confirm a no-evidence case fails closed rather than inventing a diagnosis.
9. Record exact steps, environment, timestamps, outcomes and failures. Never include secrets or unnecessary factory data in logs/docs.

### C. Only then select the smallest product fix
Prioritize the first demonstrated blocker that threatens authorization, tenant isolation, source lineage, deterministic recomputation or honest interpretation. Add a regression test, run relevant CI, and record the commit plus test evidence. Do not spend this cycle on the rejected topographic motion concept or full marketing-site implementation.

## Audit limitations

- This was a GitHub source and Actions-metadata inspection, not a local execution session.
- No live Supabase SQL was executed.
- No production endpoint or live customer data was queried.
- No browser flow was executed.
- No customer interview, buyer validation, or savings measurement was performed.
- Therefore, this document does not certify security, deployment readiness, analytical accuracy, product-market fit, or verified value.

## Exit criterion

The product-truth phase is not complete until the authorized workflow has been observed end-to-end in a known environment, tenant-boundary tests have passed in an appropriate isolated environment, the migration state is known, and every unresolved blocker has an owner and a next test.
