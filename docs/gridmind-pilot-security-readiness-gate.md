# GridMind Pilot Security and Readiness Gate

Status: **not approved for production pilot**. This checklist is a control document, not evidence that a control has passed.

## 1. Live environment facts (read-only audit, 2026-10-09)

- One factory and one organization exist.
- Eight factory assets exist.
- All eight assets are not marked calibrated and have zero or unknown sensor coverage.
- One asset has missing or non-positive rated power.
- No active factory memberships or organization memberships were found.
- No canonical observations, operating contexts, economic contexts, data sources, or data-source mappings were found.
- The `factory_analysis_runs` table/migration is not present in the live schema.
- No GridMind Edge Functions are deployed.
- Supabase Security Advisor reported:
  1. `public.create_factory_workspace(p_name text, p_location text, p_industry text)` is executable by the `authenticated` role as `SECURITY DEFINER`.
  2. Auth leaked-password protection is disabled.

These findings describe the environment at the time of the audit and must be refreshed before any deployment decision.

## 2. Security review — workspace creation RPC

Do not revoke or broaden grants blindly. First inspect the exact function definition, owner, grants, and every function it calls in the migration history and live database.

- [ ] Retrieve the live `pg_get_functiondef` for the exact overload.
- [ ] Confirm `SECURITY DEFINER` is intentional and the function has a fixed, safe `search_path`.
- [ ] Confirm object references are schema-qualified where appropriate.
- [ ] Verify caller identity comes from trusted `auth.uid()` context; never trust a caller-supplied user ID as proof of identity.
- [ ] Verify organization/factory membership and role checks occur before privileged writes.
- [ ] Verify a caller cannot create or attach a workspace to an organization they do not control.
- [ ] Verify all input parameters are validated and errors do not leak sensitive details.
- [ ] Inspect `EXECUTE` grants for `PUBLIC`, `anon`, and `authenticated`; grant only the intended caller class.
- [ ] Add database tests for unauthenticated calls, unauthorized users, authorized users, cross-tenant attempts, and malformed inputs.
- [ ] Apply the fix through a reviewed migration and rerun clean migration replay, security assertions, and authenticated HTTP acceptance tests.

**Pass condition:** the function's intended product behavior is documented, least-privilege grants are verified, and automated negative/positive authorization tests pass. A warning disappearing alone is not sufficient.

## 3. Authentication hardening

- [ ] Enable Supabase leaked-password protection in the correct project/auth settings.
- [ ] Confirm expected sign-in and password-reset behavior.
- [ ] Record the setting change and verify the advisor no longer reports the warning.
- [ ] Do not change production auth settings without the project owner's authorization and a rollback/communication plan.

## 4. Real pilot access and evidence

- [ ] Provision membership only for named, authorized pilot users.
- [ ] Confirm the factory and organization association is correct.
- [ ] Select one asset with an identifiable meter/source and a responsible factory contact.
- [ ] Confirm rated power and equipment identity against a source record.
- [ ] Obtain traceable energy readings and comparable production/output data across an agreed baseline window.
- [ ] Record operating hours, states, product/process mix, and material downtime that could affect comparability.
- [ ] Record units, time zone, period boundaries, source system, source record/reference, quality status, and whether values are estimated.
- [ ] Obtain an effective-dated tariff, recoverable fraction, and intervention cost with a documented source and approver.
- [ ] Validate calibration and sensor coverage rather than treating inventory metadata as proof of measurement.
- [ ] Reject fabricated, untraceable, or mismatched records; preserve missing/invalid/stale/zero as distinct states.

The existing CSV intake templates should be used for canonical observations, operating contexts, and economic contexts. Synthetic test fixtures must remain clearly labelled and must never be copied into live factory evidence.

## 5. Controlled deployment and acceptance

Do not deploy until all relevant items below are evidenced:

- [ ] Review the full PR diff and current head SHA; do not rely on old CI results.
- [ ] CI, GridMind Quality Gate, clean migration replay, database security assertions, and authenticated HTTP acceptance all pass on the exact candidate commit.
- [ ] Re-run read-only live readiness diagnostics and resolve all hard blockers.
- [ ] Review the migration plan, backup/rollback path, required privileges, and expected downtime.
- [ ] Obtain explicit project-owner approval for production migrations and Edge Function deployment.
- [ ] Deploy in the approved sequence and verify JWT authorization and tenant isolation.
- [ ] Run analysis against real, authorized canonical evidence.
- [ ] Independently recompute the result from source records and verify source IDs, assumptions, period alignment, algorithm version, refusal codes, and reproducibility.
- [ ] Report opportunities as estimates until post-intervention measurements verify realized outcomes.

## 6. Go/no-go rule

**NO-GO** while memberships, canonical evidence, operating/economic context, required migration/function deployment, or security validation are missing. Do not bypass a gate with synthetic records or by weakening access controls.

This checklist does not authorize production changes.