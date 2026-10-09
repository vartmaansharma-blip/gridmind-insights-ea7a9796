# GridMind authoritative factory-analysis loop

## Runtime path

The canonical asset page sends only `factoryId`, `assetId`, and an idempotency key; the server assigns the analysis timestamp. After validating the caller's JWT and passing the caller-scoped factory RLS check, the authenticated `persist-factory-analysis` Edge Function independently loads the asset's canonical observations, applicable operating contexts, and active economic contexts using its privileged client. It assembles the input with the shared adapter, calculates, persists the server-built snapshot, then reloads and recomputes before returning a conclusion. Client-supplied measurements or analysis inputs are rejected.

The Edge Function recalculates with the same shared engine used by the test suite. Browser clients have no direct SELECT/INSERT grants on `factory_analysis_runs`. A positive opportunity is presented only when the persisted result reproduces and the estimated net value is positive.

## Explicit ingestion contract

The adapter intentionally does not guess metric meanings or fill missing values. The Edge Function enforces the 4 MB request limit against the actual streamed UTF-8 body, even when `Content-Length` is absent or inaccurate, and separately rejects more than 5,000 baseline periods. Data must be explicitly aggregated upstream rather than silently truncated.

### Observation roles

Set `observations.metadata.analysis_role` (or `provenance.analysis_role`) to one of:

- `energy`
- `production`
- `operating_hours`
- `operating_state`
- `product_code`

When that metadata is absent, only these exact canonical metric names are recognized:

- `energy_consumption_kwh` → energy
- `production_output` → production
- `operating_hours` → operating hours
- `operating_state` → operating state
- `product_code` → product code

Each observation needs an explicit unit and a real observation period. `metadata.period_start` can define the common period start; otherwise `observed_at` is used. `observed_until` or explicit `metadata.period_end` must define the period end. The adapter does not infer a period from a single point timestamp. Source observation IDs, raw values, units, quality, provenance, and period boundaries remain in the persisted input snapshot.

Duplicate role measurements, unknown explicit role labels, conflicting context, missing values, non-valid quality, overlapping periods, unsupported units, and numeric overflow are refused rather than resolved by arbitrary selection. The algorithm version is stored with each result; semantic changes require a version bump.

### Operating context

An applicable `operating_contexts` row may supply operating state and product context; it must have `scope_type = 'asset'`, the asset's `scope_id`, and a usable status (`observed`, `derived`, or `validated`; legacy `active`/`valid` values are also tolerated). Its `values.analysis_loop` object can supply `operatingState` and `productCode`. Explicit `operating_state` and `product_code` observations can supply those values instead. If both sources provide a value and disagree, the period is refused. A value absent from both sources remains missing and cannot support a comparable sample. Equally ranked applicable contexts with different values are treated as ambiguous.

### Economic context

An active, effective `economic_contexts` row may supply `metadata.analysis_loop` fields:

- `tariffInrPerKwh`
- `recoverableFraction` (0–1)
- `interventionCostInr`

These fields must be finite numbers; no generic tariff, recovery rate, or intervention cost is invented. Multiple equally current economic contexts are treated as ambiguous. Missing or unsupported economic inputs prevent an opportunity claim.

## Acceptance coverage

- Missing versus invalid values and genuine zero: `analysis-loop.test.ts`, `analysis-run-store.test.ts`
- Strict timezone-aware timestamps, calendar validity, stale/future periods, operating-hour bounds: `analysis-loop.test.ts`
- Non-overlapping historical baseline, comparable operating rates, duplicate IDs, deterministic input order: `analysis-loop.test.ts`
- Canonical observation assembly, source IDs, unknown role, absent context/economics, no-observation refusal: `analysis-input-adapter.test.ts`
- Canonical read → persist → reload/recompute orchestration: `analysis-runner.test.ts`
- Browser sends only canonical identifiers; no client measurement payload: `analysis-run-store.test.ts`, `analysis-runner.test.ts`
- Database-level tenant isolation, direct-table denial, least-privilege service-role grants, idempotency uniqueness, and append-only update/delete protection: `supabase/tests/factory-analysis-security.sql`
- Authenticated local Edge Function HTTP acceptance (authorized/unauthorized users, cross-tenant denial, client-input rejection, same-key retry, conflicting asset, concurrent retry, verification, direct-table denial, and oversized request): `supabase/tests/factory-analysis-integration.deno.ts`; fixtures: `supabase/tests/factory-analysis-integration-setup.sql`; CI runner: `.github/workflows/migration-replay.yml`
- Streamed request-size enforcement, malformed lengths, and malformed JSON: `supabase/functions/_shared/request-body.test.ts`

## Live-environment verification still required

The code and migration are in the feature branch only. They have not been applied or deployed to the live Supabase project. A read-only inspection found no deployed Edge Functions and no factory/org membership rows, so real tenant-isolation tests cannot yet pass against the current live dataset. Before enabling this path, ensure the automated isolated Supabase HTTP integration suite passes on the final commit and independently validate a real factory result with known-good canonical evidence. Do not infer production readiness from unit tests or a successful build alone.
