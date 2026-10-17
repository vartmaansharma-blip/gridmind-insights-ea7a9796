# GridMind MVP — Slice 2A: synthetic machine evidence format preview

**Date:** 2026-10-17. **Status:** Product implementation candidate, not a customer-data ingestion system.

## Capability
- A registered machine's existing Evidence Readiness card now includes a clearly separated **Measurement format sandbox**.
- The sandbox accepts only *fictional* CSV text entered in the browser, with fixed explicit columns `period_start,period_end,energy_kwh,output_units,operating_hours,operating_state,product_code,source_reference`.
- Strong input bounds (16KB, 100 periods), strict positive numeric values, explicit ISO timestamps with zone offsets, disallow duplicates/overlapping periods, require source references, flag fewer than four candidate periods, and reject malformed CSV syntax.
- Shows candidate periods and number of declared source references, together with violations. All rows retain `synthetic_unverified` status; **never** yields a cause, savings claim, calibrated baseline, valid canonical observation or a verified model-specific diagnosis.
- No network send; no calls to the existing Supabase client; no writes, files, localStorage or persistent factory/customer data; no real customer upload authorization. The only UI input is bounded client-side text. The source values disappear when the page unloads.
- This sandbox is **not displayed on production machine pages by default**: development mode or explicitly enabled `VITE_GRIDMIND_SYNTHETIC_INTAKE_LAB=enabled` is required. Do not enable it for real customer sites without an explicit non-production demonstration agreement.

## Why this approach
The owner instructed us to complete the MVP before field instrumenting a factory. The deployed machine page already indicates observation gaps; this slice demonstrates the future input contract and correction UX with safe examples while real customer custody/permissions are not approved. It avoids populating the production `observations` table with invented demo values.

## Not yet delivered (issue #123 remains open)
- Permissioned factory/asset data source registration, reviewed ingestion and immutable correction history.
- Dedicated row-level and tenant-scoped server ingestion, quarantine, provenance, calibration and source/file retention.
- Linking imported canonical observations to the existing analysis server function and a single case's reviewer/brief workflow.
- Human-reviewed live technical conclusions and measured interventions.

## Next hard gate
Implement an isolated backend ingestion endpoint with deny-by-default auth/tenant controls, replay-safe identities, immutable source citations, RLS tests, and permissioned contract. Test with a disposable local Supabase stack *before* any actual factory document is accepted. The sandbox must never be described to a customer as an active monitoring service.

## Test strategy
`vitest` checks accept controlled fictional data, reject malformed/duplicate/overlapping readings, invalid numeric values and formula strings, and never enable machine diagnosis or production ingestion. CI typechecks the embedded React form. No production database migration or new API was created.
