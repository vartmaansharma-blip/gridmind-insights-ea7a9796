# GridMind Phase 13.2 — Canonical Application/Data-Contract Boundary

Status: implemented

## Authoritative application path

Authenticated user → organization → factory → physical assets/data sources → observations → canonical intelligence → opportunities → decisions → interventions → verification → verified outcomes.

## Rules

- Supabase canonical tables are authoritative for operational and economic state.
- Browser state is UI state only.
- The demo factory is synthetic and in-memory only.
- Factory-scoped reads use the authenticated Supabase client and RLS.
- Every domain query is scoped by the active factory context.
- Opportunities displayed by production routes must come from canonical `opportunities`.
- Alerts are projections of canonical `performance_deviations`.
- Savings/verification displays come from `verification_plans`, `verification_runs`, and `verified_outcomes`.
- Machine views use `factory_assets`, `data_sources`, `data_source_mappings`, and `observations`.
- Physical asset retirement is represented in `asset_metadata.lifecycle_status`; historical rows are not deleted merely because the UI removed them.
- Observations are append-oriented. The application does not silently overwrite physical evidence.
- Legacy intelligence tables are not production write targets.

## Phase boundary

13.2 establishes contracts and authoritative application boundaries. It deliberately does not yet generate new baselines, expectations, deviations, evidence bundles, or opportunities from raw observations. That is Phase 13.3.

## Canonical route ownership

- `/factory`: factory context + physical assets + canonical observations
- `/machines`: canonical physical assets/data sources/mappings/observations
- `/energy`: descriptive observation-derived visualization; intelligence conclusions wait for 13.3
- `/opportunities`: canonical opportunities only
- `/savings`: canonical interventions/verification only; no before/after shortcut
- `/alerts`: canonical deviations only

## Security boundary

No ordinary application workflow may use a service-role client for factory-scoped reads. Privileged server-side operations must be explicit and isolated.

## Definition of done

- Canonical domain contracts exist.
- Organization-aware factory context exists.
- Operational persistence is canonical.
- Local browser storage is not authoritative.
- Legacy machine route is removed from production use.
- Opportunities, verification, and alerts no longer manufacture production truth in the browser.
- Factory asset edits persist canonically with provenance-preserving retirement.
- Required data-source fields are populated.
- Generated Supabase types remain the database contract.
