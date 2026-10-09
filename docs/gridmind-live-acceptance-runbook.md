# GridMind live acceptance runbook

## Purpose and safety boundary

Use this runbook to prepare one real asset for a controlled GridMind analysis. The readiness SQL is read-only; it does not create memberships, write observations, apply migrations, or deploy code.

**Never fill gaps with invented factory measurements.** Use actual meter/SCADA/PLC/production records, documented operating logs, and the factory's tariff/invoice and intervention-cost evidence. If an input is estimated or unverified, retain that quality/origin and treat the resulting analysis as provisional.

## Current live preflight

The last read-only inspection of project `bvqmvgbfqhgczwbvlqkk` found:
- 1 factory and 8 registered assets.
- 0 active organization/factory membership rows.
- 0 canonical observations, operating contexts, economic contexts, data sources, and source mappings.
- No `factory_analysis_runs` table and no deployed Edge Function.

The existing assets have not been calibrated according to their current `calibration_status` values. This is a measurement-quality caveat, not permission to manufacture calibration evidence.

## Steps

1. **Run the diagnostic.** Execute `supabase/tests/gridmind-live-readiness.sql` in the Supabase SQL editor. It is SELECT-only and reports factory blockers plus asset-level observation-role coverage.
2. **Restore legitimate access.** Have the actual workspace owner sign in and use the authenticated workspace flow, or have an authorized project administrator establish the correct active organization and factory membership for the intended user. Do not guess a user UUID or attach a random account to an existing factory. Confirm both membership layers before proceeding.
3. **Select one pilot asset.** Choose a real asset with a known meter/production source and a responsible factory contact. Record its actual asset ID and a bounded analysis window.
4. **Ingest canonical observations.** For each comparable period, store asset-scoped observations with the same `factory_id`, `subject_type='asset'`, and `subject_id=<asset id>`. Supply exactly one observation for each required role per period:
   - `energy`: energy consumed, unit `kWh`; canonical metric `energy_consumption_kwh` or `metadata.analysis_role='energy'`.
   - `production`: output, in a stable unit; canonical metric `production_output` or `metadata.analysis_role='production'`.
   - `operating_hours`: operating duration, unit `h`; canonical metric `operating_hours` or `metadata.analysis_role='operating_hours'`.
   - Define each period with timezone-aware `observed_at` and `observed_until`, or explicit `metadata.period_start` and `metadata.period_end`. Periods must be comparable and non-overlapping.
   - Keep source IDs and provenance. Do not label data `valid` unless the source and measurement have actually been checked. Use `estimated`, `unverified`, `suspect`, or other accurate quality states when appropriate.
5. **Record operating context.** Add an asset-scoped `operating_contexts` row whose interval covers each period and whose `values.analysis_loop` contains the relevant operating state and product code when applicable. Do not create overlapping equally ranked conflicting contexts.
6. **Record economics.** Add exactly one active `economic_contexts` row effective for the analysis timestamp. Use the currency actually applicable to the source evidence and set `metadata.analysis_loop.tariffInrPerKwh`, `recoverableFraction`, and `interventionCostInr` from documented inputs. These fields must not be guessed. Resolve ambiguous or overlapping economic contexts before analysis.
7. **Review readiness again.** Require at least four complete comparable historical periods plus a current period for the initial pilot, and inspect all blockers and quality flags. The code's formal caps are not a substitute for sufficient evidence.
8. **Apply the migration and deploy only after authorization.** The current PR's isolated clean replay and authenticated HTTP acceptance gates pass. Review and merge PR #3, apply its migration to the intended Supabase project, and deploy the function with JWT verification enabled only after membership/evidence preconditions and change approval are satisfied.
9. **Run and independently verify.** Use the asset page's “Run and verify” action. Check the source observation IDs, period boundaries, operating context, tariff, recoverable fraction, intervention cost, calculation, and refusal/provisional limitations against the original factory records. Reload and repeat verification. A reproducible result means the calculation is repeatable; it does not by itself prove causality or realized savings.
10. **Close the loop.** Have a qualified factory engineer review the finding. Only claim realized savings after a separately documented intervention and a suitable post-intervention measurement/verification protocol.

## Acceptance checklist

- [ ] Correct active organization and factory membership confirmed.
- [ ] Pilot asset and its source mapping confirmed.
- [ ] At least five comparable periods, each with energy, production, and operating-hours observations.
- [ ] Period boundaries, units, source provenance, and quality states reviewed.
- [ ] Operating contexts cover the relevant periods without unresolved ambiguity.
- [ ] One unambiguous effective economic context uses documented values.
- [ ] Live migration and Edge Function deployment authorized and recorded.
- [ ] Run saved, source IDs checked, reload/recompute verification succeeds.
- [ ] Independent engineer review recorded.
- [ ] Estimated opportunity is not represented as verified or realized savings.

## Related implementation

- PR #3: https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/3
- Authoritative analysis design: `docs/gridmind-authoritative-analysis.md`
- Clean replay and HTTP acceptance workflow: `.github/workflows/migration-replay.yml`
