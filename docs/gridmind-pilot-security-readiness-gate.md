# GridMind Pilot Security and Readiness Gate

Status: **NO-GO for a production pilot until all applicable gates below are evidenced.** This checklist is a control document, not proof that a control has passed.

## 1. Fresh read-only environment audit (2026-10-10)

Live read-only SQL confirmed:
- 1 factory and 8 registered assets.
- 0 active organization memberships and 0 factory memberships.
- 0 canonical observations, operating contexts, economic contexts, data sources, and data-source mappings.
- The `public.factory_analysis_runs` table is absent.
- No GridMind Edge Functions are currently deployed.
- The Supabase Security Advisor reports that `public.create_factory_workspace(p_name text, p_location text, p_industry text)` is executable by `authenticated` as a `SECURITY DEFINER` function, and leaked-password protection is disabled.

These counts describe the current inspection, not proof of equipment measurement quality. Refresh them before each deployment decision.

## 2. Workspace-creation RPC security review

The RPC is a necessary bootstrap path because normal table writes are membership-gated. The advisor warning is a review signal, not by itself proof of exploitability. Do not blindly revoke grants or switch to `SECURITY INVOKER`; that could break legitimate workspace creation without proving the authorization issue is solved.

Source migrations show the function:
- Derives identity from `auth.uid()`, rejects unauthenticated calls and blank names.
- Uses an empty fixed `search_path` in a later hardening migration.
- Uses schema-qualified table references.
- Grants execution to `authenticated` and does not grant it to `anon`.
- Chooses an active organization where the caller has an owner/admin role, or creates a new organization for the caller if no eligible organization exists; then creates a factory and owner membership.

The current production ACL and function definition should still be rechecked before any release, because source migrations are not a substitute for live state.

- [x] Read source migrations and identify the intended bootstrap behavior.
- [x] Confirm the latest Security Advisor warning and leaked-password finding.
- [ ] Add automated positive and negative tests for unauthenticated, authorized, cross-tenant, malformed-input, and multiple-eligible-organization cases.
- [ ] Prove a caller cannot attach a factory to an organization they do not control or bypass active organization membership.
- [ ] Confirm the behavior when a user has multiple active owner/admin organizations is deliberate and deterministic.
- [ ] Re-run clean migration replay, tenant-isolation tests, and authenticated HTTP acceptance on the same candidate SHA.

**Pass condition:** intended behavior is documented, least-privilege grants are verified live, and positive/negative authorization tests pass. A disappearing warning alone is insufficient.

## 3. Authentication hardening

- [ ] Project owner enables Supabase leaked-password protection in the correct Auth settings.
- [ ] Confirm sign-in and password-reset behavior.
- [ ] Re-run the Security Advisor and record the result.
- [ ] Record owner approval and a rollback/communication plan before changing production Auth settings.

This is an owner-level setting; it has not been changed by this audit.

## 4. Real pilot access and evidence

- [ ] Have the actual workspace owner or authorized administrator provision membership for named pilot users.
- [ ] Confirm both organization and factory membership, and verify tenant isolation.
- [ ] Select an asset with an identifiable meter/source and responsible factory contact.
- [ ] Obtain traceable energy readings and comparable production/output records over an agreed baseline window.
- [ ] Record operating hours/states, product or process mix, material downtime, units, timezone, period boundaries, source references, and honest quality flags.
- [ ] Obtain effective-dated tariff, recoverable fraction, and intervention-cost evidence with source and approver.
- [ ] Validate equipment identity, calibration, and sensor coverage. Inventory metadata is not proof of measurement.
- [ ] Keep missing, invalid, stale, estimated, unverified, and measured-zero values distinct. Never fabricate or guess factory evidence.

Use the existing canonical observation, operating-context, and economic-context CSV intake templates. The local intake validator is preflight only; it does not upload or persist data. Synthetic fixtures must remain labelled as synthetic.

## 5. Controlled deployment and acceptance

- [ ] Review the full PR diff and current head SHA; do not rely on checks from an older commit.
- [ ] CI, GridMind Quality Gate, clean migration replay, database security assertions, and authenticated HTTP acceptance pass on the exact candidate commit.
- [ ] Refresh the read-only readiness diagnostic and resolve hard blockers.
- [ ] Review migration sequence, privileges, backup/rollback path, and expected impact.
- [ ] Obtain explicit project-owner approval before production migrations or Edge Function deployment.
- [ ] Deploy with JWT verification enabled and verify tenant isolation.
- [ ] Run analysis only against real, authorized canonical evidence.
- [ ] Reload/recompute and verify source IDs, period alignment, context, economic assumptions, algorithm version, refusal codes, and reproducibility.
- [ ] Obtain independent engineering review. Describe opportunities as estimates until post-intervention measurements verify realized outcomes.

## 6. Current release gate

At the latest inspection, the repository main commit was `f4b07cce152e8c3422f2ac948b4ea1edea40db32`. Its clean local migration replay workflow was still **in progress**; the local Supabase startup step had not yet completed, and the tenant-isolation / authenticated HTTP steps had not run. A green Vercel status does not replace these acceptance checks.

**NO-GO** while memberships, canonical evidence, required run-store migration/function deployment, security validation, or end-to-end acceptance remain missing. Never bypass a gate with synthetic data or weakened access controls.

This checklist does not authorize production changes.
