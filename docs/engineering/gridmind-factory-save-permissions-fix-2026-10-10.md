# GridMind factory save permissions fix — 2026-10-10

## Findings
Production Postgres logs showed `permission denied for table factories` while the app attempted to update `factories` fields (`industry`, `location`, `metadata`, `name`). A privilege check also showed authenticated users lacked `INSERT` and `UPDATE` on `factory_assets`, blocking equipment persistence even where RLS policies authorize the user.

## Changes applied
- Migration `restore_authenticated_factory_api_privileges`: restored selected API privileges for the authenticated role; commit `f8acf8408536f9f0f4f86665e5f2d6539ef76c0c`.
- Migration `grant_authenticated_factory_profile_updates`: `GRANT UPDATE ON public.factories TO authenticated;` commit `56d4e51aef36a0ec3cd2cb3efd9962ff09112933`.
- Migration `grant_authenticated_factory_asset_writes`: `GRANT INSERT, UPDATE ON public.factory_assets TO authenticated;` commit `016c41435ef23542c3976a2057fa261af555c326`.

## Authorization boundary
These are table privileges, not tenant access grants. Existing RLS policies remain the row-level authorization boundary. Factory update policy checks owner/admin membership; asset write policies check owner/admin membership. Do not bypass these policies or seed fake data into a real customer workspace.

## Verification performed
A production privilege check returned true for authenticated SELECT/UPDATE on `factories`, SELECT/INSERT/UPDATE on `factory_assets`, and INSERT/UPDATE on `observations`.

## Still required: end-to-end acceptance
Privilege checks do not prove the browser flow is fixed. In the authenticated app:
1. Refresh `/factory` and edit the test workspace profile; confirm save and reload persistence.
2. Add one clearly synthetic test equipment record; confirm it remains after refresh.
3. Add one clearly synthetic monthly record through the UI; confirm it remains after refresh.
4. Run analysis only after data is saved; confirm a run is recorded and still visible after reload.
5. Confirm a different user without membership cannot read or modify these records.

If any action fails, capture its browser/network error and correlate with Supabase logs before applying another permission change. Do not claim the live save flow passed until these steps are actually observed.
