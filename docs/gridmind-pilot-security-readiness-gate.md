# GridMind Pilot Security and Readiness Gate

Status: **NO-GO for a production pilot until all applicable gates below are evidenced.** This checklist is a control document, not proof that a control has passed.

## 1. Read-only environment audit (2026-10-09)

- One factory, one organization, and eight assets exist.
- All eight assets are not marked calibrated and have zero or unknown sensor coverage.
- One asset has missing or non-positive rated power.
- No active factory or organization memberships were found.
- No canonical observations, operating contexts, economic contexts, data sources, or data-source mappings were found.
- The `factory_analysis_runs` table/migration is absent from the live schema.
- No GridMind Edge Functions are deployed.
- Supabase Security Advisor reports that `public.create_factory_workspace(p_name text, p_location text, p_industry text)` is executable by the `authenticated` role as `SECURITY DEFINER`, and that leaked-password protection is disabled.

Refresh these findings before any deployment decision.

## 2. Review the workspace-creation RPC

Do not blindly revoke grants or change the function. Inspect the live function definition, owner, grants, and all functions it calls first.

- [x] Retrieved the live `pg_get_functiondef` for `public.create_factory_workspace(text, text, text)` and inspected its ACLs on 2026-10-09.
- [ ] Confirm `SECURITY DEFINER` is intentional and uses a fixed, safe `search_path`.
- [ ] Confirm object references are schema-qualified where appropriate.
- [ ] Verify identity derives from trusted `auth.uid()` context, not a caller-supplied user ID.
- [ ] Verify membership and role checks happen before privileged writes.
- [ ] Verify users cannot create or attach workspaces to organizations they do not control.
- [ ] Validate inputs and ensure errors do not expose sensitive details.
- [ ] Inspect `EXECUTE` grants for `PUBLIC`, `anon`, and `authenticated`; grant only the intended caller class.
- [ ] Add automated tests for unauthenticated, unauthorized, authorized, cross-tenant, and malformed-input calls.
- [ ] Implement any fix through a reviewed migration; rerun clean migration replay, database security assertions, and authenticated HTTP acceptance.

### Live review result (read-only, 2026-10-09)

- Owner: `postgres`; `SECURITY DEFINER` is enabled; function-level `search_path` is set to the empty string.
- The function obtains the caller from `auth.uid()`, rejects unauthenticated calls and blank factory names, and schema-qualifies its table references.
- It selects an active organization where the caller has `owner` or `admin` role; if none exists, it creates an organization and owner membership. It then creates a factory and factory-owner membership.
- ACL inspection showed `EXECUTE` for `authenticated` and the owner, with no `anon` or `PUBLIC` execute grant.
- This makes the advisor warning a review signal, not by itself proof of an exploitable issue. The remaining work is to test authorization/tenant edge cases and confirm the product intends to choose the lowest-ID active owner/admin organization when multiple matches exist. No live function or grants were changed.

**Pass condition:** intended behavior is documented, least-privilege grants are verified, and positive and negative authorization tests pass. A disappearing warning alone is insufficient.

## 3. Authentication hardening

- [ ] Enable Supabase leaked-password protection in the correct project/auth settings.
- [ ] Confirm sign-in and password-reset behavior.
- [ ] Re-run the security advisor and record the result.
- [ ] Obtain project-owner authorization and a rollback/communication plan before changing production auth settings.

## 4. Real pilot access and evidence

- [ ] Provision membership only for named, authorized pilot users; confirm organization/factory linkage.
- [ ] Select an asset with an identifiable meter/source and responsible factory contact.
- [ ] Confirm equipment identity and rated power against source records.
- [ ] Obtain traceable energy readings and comparable production/output records over an agreed baseline window.
- [ ] Record operating hours/states, product or process mix, and material downtime.
- [ ] Capture units, timezone, period boundaries, source system, source record/reference, quality status, and estimated-vs-measured status.
- [ ] Obtain an effective-dated tariff, recoverable fraction, and intervention cost with source and approver.
- [ ] Validate calibration and sensor coverage; inventory metadata alone is not proof of measurement.
- [ ] Keep missing, invalid, stale, and measured-zero values distinct. Reject fabricated or untraceable evidence.

Use the existing canonical observation, operating-context, and economic-context CSV intake templates. Synthetic test fixtures must remain labelled as synthetic and must never be copied into live factory evidence.

## 5. Controlled deployment and acceptance

- [ ] Review the full PR diff and current head SHA; do not rely on old check results.
- [ ] CI, GridMind Quality Gate, clean migration replay, database security assertions, and authenticated HTTP acceptance pass on the exact candidate commit.
- [ ] Refresh read-only readiness diagnostics and resolve hard blockers.
- [ ] Review migration sequence, required privileges, backup/rollback path, and expected downtime.
- [ ] Obtain explicit project-owner approval before production migrations or Edge Function deployment.
- [ ] Verify JWT authorization and tenant isolation after deployment.
- [ ] Run analysis only against real, authorized canonical evidence.
- [ ] Independently recompute the result and verify source IDs, assumptions, period alignment, algorithm version, refusal codes, and reproducibility.
- [ ] Describe opportunities as estimates until post-intervention measurements verify realized outcomes.

## 6. Go/no-go rule

**NO-GO** while memberships, canonical evidence, operating/economic context, required migration/function deployment, or security validation remain missing. Never bypass a gate with synthetic data or weakened access controls.

This checklist does not authorize production changes.