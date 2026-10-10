# GridMind live acceptance runbook

## Purpose and safety boundary

Use this runbook to prepare one real asset for a controlled GridMind analysis. The readiness SQL is read-only; it does not create memberships, write observations, apply migrations, or deploy code.

**Never fill gaps with invented factory measurements.** Use actual meter/SCADA/PLC/production records, documented operating logs, and the factory's tariff/invoice and intervention-cost evidence. If an input is estimated or unverified, retain that quality/origin and treat the resulting analysis as provisional.

## Current live preflight

Read-only checks of project `bvqmvgbfqhgczwbvlqkk` on 2026-10-10 (latest recheck approximately 08:05 UTC) found 1 organization, 1 factory, and 8 assets; zero organization-membership rows, factory-membership rows, canonical observations, operating contexts, economic contexts, or persisted analysis runs. The project has one Supabase Auth user, and the user matching the repository's commit email exists; that account has zero organization and factory memberships. No email address is copied into this runbook. The `factory_analysis_runs` table is live with RLS, member-scoped policies, append-only protection, denied direct authenticated inserts, and intended service-role grants. Edge Function `persist-factory-analysis` is ACTIVE (version 1) with JWT verification enabled. On commit `aecd4f2839358f0d72f8034862f7313972288d63`, CI, GridMind Quality Gate, and GridMind Migration Replay all completed successfully. The migration-replay job passed clean local replay, schema contract, tenant isolation/direct-table denial/append-only checks, and authenticated Edge Function integration using isolated local test fixtures. This is strong repository-level evidence, not proof of live production authenticated acceptance. Asset calibration and 0% sensor-coverage values remain measurement-quality caveats; do not manufacture evidence. Production acceptance still requires a legitimate owner session, correct workspace membership, and real source evidence.

## Steps

1. **Run the diagnostic.** Execute `supabase/tests/gridmind-live-readiness.sql` in the Supabase SQL editor. It is SELECT-only and reports factory blockers plus asset-level observation-role coverage. Use the blank intake sheets under `docs/templates/gridmind/` to collect and review real source data before writing it to canonical tables; these templates are not SQL imports and must not be treated as validated records.
2. **Establish legitimate founder/workspace access.** A read-only check confirms that the existing Supabase Auth user matching the repository's GitHub commit email exists, but it has no organization or factory membership. The next action is for the founder to sign in to GridMind with that existing account and use the authenticated workspace flow. Before attaching the account to the already configured factory, confirm that the factory/workspace is actually founder-owned and intended for this account. If it is demo or third-party inventory, do not attach the founder to it; create a separate workspace through the authenticated application flow instead. Do not guess a user UUID, create a duplicate identity, or directly insert memberships as a shortcut. Confirm both membership layers after the authenticated flow.
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
8. **Confirm deployed release state.** The analysis persistence migration is already applied to the live project and `persist-factory-analysis` is deployed with JWT verification enabled. Do not reapply the migration just to repeat the same change. The latest CI, Quality Gate, and Migration Replay workflows passed on commit `aecd4f2839358f0d72f8034862f7313972288d63`, including clean local migration replay and authenticated local HTTP integration. Continue with legitimate production membership and evidence preconditions; local fixture tests do not substitute for live authenticated acceptance.
9. **Run and independently verify.** Use the asset page's “Run and verify” action. Check the source observation IDs, period boundaries, operating context, tariff, recoverable fraction, intervention cost, calculation, and refusal/provisional limitations against the original factory records. Reload and repeat verification. A reproducible result means the calculation is repeatable; it does not by itself prove causality or realized savings.
10. **Close the loop.** Have a qualified factory engineer review the finding. Only claim realized savings after a separately documented intervention and a suitable post-intervention measurement/verification protocol.

## Blank data-intake templates

- `docs/templates/gridmind/observations.csv`: one row per asset observation; collect energy, production, and operating-hours records for each comparable period, with source references and honest quality flags.
- `docs/templates/gridmind/operating-contexts.csv`: one row per asset operating-context interval, including state/product context and source reference.
- `docs/templates/gridmind/economic-context.csv`: one effective economic assumption set, with tariff, recoverable fraction, intervention cost, and source references.

Keep source documents/exports alongside the filled templates in the project's controlled storage. Do not send credentials, personal data, or confidential records into chat. The templates are an intake contract, not proof that values are correct.

## Acceptance checklist

- [ ] Correct active organization and factory membership confirmed.
- [ ] Pilot asset and its source mapping confirmed.
- [ ] At least five comparable periods, each with energy, production, and operating-hours observations.
- [ ] Period boundaries, units, source provenance, and quality states reviewed.
- [ ] Operating contexts cover the relevant periods without unresolved ambiguity.
- [ ] One unambiguous effective economic context uses documented values.
- [x] Live migration and Edge Function deployment recorded; schema contract verified.
- [x] GitHub CI, Quality Gate, clean migration replay, schema contract, tenant isolation, direct-table denial, append-only persistence, and authenticated local HTTP integration pass on the recorded commit.
- [ ] Live production authenticated HTTP acceptance completes using the legitimate founder/workspace account and authorized real evidence.
- [ ] Run saved, source IDs checked, reload/recompute verification succeeds.
- [ ] Independent engineer review recorded.
- [ ] Estimated opportunity is not represented as verified or realized savings.

## Related implementation

- PR #3: https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/3
- Authoritative analysis design: `docs/gridmind-authoritative-analysis.md`
- Clean replay and HTTP acceptance workflow: `.github/workflows/migration-replay.yml`


## Founder setup — exact application path and latest workflow state

### Authenticated setup path

The current application already implements the intended flow; no new account or administrative membership write is required:

1. Open the deployed GridMind app and go to `/auth`.
2. Choose **Sign in** and enter the existing account credentials in the browser. Credentials must never be sent through ChatGPT, GitHub issues, documentation, or chat.
3. After sign-in, the application loads canonical factory snapshots using the authenticated Supabase client. If no factory is visible, the app shell displays **Create your first factory** and the **Add factory** dialog.
4. Submit the real factory name, location, and sector. The app calls the authenticated `create_factory_workspace` RPC, then reloads snapshots and verifies the newly created factory is visible under the caller's RLS scope.
5. If the configured existing factory is not confirmed to be founder-owned, do not attach the account to it. Create a separate founder-owned workspace through the app.
6. After the flow, recheck organization and factory memberships with read-only queries. Then test the live persistence Edge Function using the signed-in session.

### Latest CI state for documentation commit `394cdb25d1ef9e5e28ac7e2e12812f98b2b78cd4`

- [CI](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036717626): passed.
- [GridMind Quality Gate](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036717676): passed.
- [GridMind Migration Replay](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38036717696): **pending at last check**; do not mark this commit's replay gate passed until GitHub reports a completed success.

The app flow is ready to be exercised, but an external authenticated browser session is required. The assistant cannot sign in as the founder without the founder privately entering credentials. No production membership, workspace, measurement, migration, or deployment writes were performed during this check.
