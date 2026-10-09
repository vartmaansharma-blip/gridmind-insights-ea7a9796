# GridMind authoritative factory-analysis loop

## Runtime path

The canonical asset page calls `runCanonicalFactoryAnalysis`. That service reads canonical asset observations, applicable operating contexts, and the active economic context; builds an immutable analysis input; calls the authenticated `persist-factory-analysis` Edge Function; and requests a server-side reload/recalculation before presenting a conclusion.

The Edge Function recalculates with the same shared engine used by the test suite. Browser clients have no direct SELECT/INSERT grants on `factory_analysis_runs`. A positive opportunity is presented only when the persisted result reproduces and the estimated net value is positive.

## Explicit ingestion contract

The adapter intentionally does not guess metric meanings or fill missing values.

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

Duplicate role measurements, unknown explicit role labels, conflicting context, missing values, non-valid quality, overlapping periods, and unsupported units are refused rather than resolved by arbitrary selection.

### Operating context

An applicable `operating_contexts` row must have `scope_type = 'asset'`, the asset's `scope_id`, and status `active` or `valid`. Its `values.analysis_loop` object must contain `operatingState` and `productCode` for the period. Equally ranked conflicting contexts are treated as ambiguous.

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
- JSON-safe immutable request and server-only persistence contract: `analysis-run-store.test.ts`

## Live-environment verification still required

The code and migration are in the feature branch only. They have not been applied or deployed to the live Supabase project. A read-only inspection found no deployed Edge Functions and no factory/org membership rows, so real tenant-isolation tests cannot yet pass against the current live dataset. Before enabling this path, provision valid test memberships in an isolated Supabase environment and test authorized access, cross-tenant denial, direct-table denial, idempotent concurrent retries, and reload/recompute integrity. Do not infer production readiness from unit tests or a successful build alone.
