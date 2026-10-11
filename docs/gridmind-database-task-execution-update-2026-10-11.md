# GridMind database task execution update — 2026-10-11

**Status: implementation proposed on a feature branch; automated validation pending. Production database and Auth settings were not changed.**

## Live read-only observations

Project: Supabase project ID bvqmvgbfqhgczwbvlqkk (GridMind projects), PostgreSQL 17.11, ap-south-1.

- public.asset_interventions.implemented_at is still absent from information_schema.columns.
- public.factory_analysis_runs.input_snapshot_sha256 is still absent from information_schema.columns.
- The recorded live migration inventory includes 20261011062242_harden_public_default_table_privileges and 20261011062256_add_factory_analysis_run_fk_indexes, but neither of the two column migrations is evidenced as applied.
- The Security Advisor still reports the authenticated SECURITY DEFINER function public.create_factory_workspace(text,text,text) and disabled leaked-password protection.
- The workspace RPC currently has search_path pinned to empty and checks auth.uid(). However, its organization-selection query orders active owner/admin memberships by organization ID and chooses the first. With multiple such memberships, that silently chooses a context instead of asking for an explicit choice.

These checks were read-only. They do not prove production tenant isolation or the authenticated end-to-end workflow.

## Change proposed in this branch

Branch: fix/workspace-bootstrap-org-ambiguity

- Added migration supabase/migrations/20261011073000_harden_workspace_bootstrap_org_selection_v1.sql.
- The workspace bootstrap now fails closed with AMBIGUOUS_ORGANIZATION_CONTEXT if a caller has more than one active owner/admin organization. It retains the existing authenticated-user check, pinned empty search path, schema-qualified object references, and authenticated-only EXECUTE grant.
- Added supabase/tests/workspace-bootstrap-security.sql covering unauthenticated rejection, single-organization selection, ambiguous multi-organization rejection without creating a factory, and first-workspace owner membership creation.
- Wired that SQL contract into the clean local migration replay workflow.

This is intentionally a narrow behavior fix. It does not clear the Security Advisor's SECURITY DEFINER warning; the RPC remains privileged code exposed for the intended authenticated onboarding path. That design still requires qualified security review and a complete grants/function-body audit. The new multi-organization rejection is a safe interim behavior until an explicit organization-selection contract exists.

## Validation state — exact PR head 023767f0efd108d2a07d466976711a5549a3b33d

- [x] Clean migration replay on this branch — [run 38149176365](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38149176365) passed.
- [x] Workspace bootstrap SQL contract passed within that clean replay.
- [x] Existing schema/security contract and HTTP two-user Edge Function suite passed within the same exact-head replay.
- [x] Repository CI passed — [run 38149176347](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38149176347).
- [x] GridMind Quality Gate passed — [run 38149176361](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/actions/runs/38149176361).
- [x] Self-review of migration semantics and preserved function grants completed; this is not a substitute for independent security review.
- [ ] Review the UI's handling of AMBIGUOUS_ORGANIZATION_CONTEXT so the user receives a clear selection/recovery path.
- [ ] Qualified independent security review of the SECURITY DEFINER RPC.
- [ ] Authorized Auth settings owner enables leaked-password protection and tests sign-in/reset/recovery.
- [ ] Production schema alignment: reconcile migration history and object definitions; secure recovery point, named operator and independent reviewer; obtain explicit production-change authorization; apply only through approved migration workflow; verify columns and old-row integrity.
- [ ] Two-user production acceptance and authenticated sign-in → workspace → analysis → reload verification on the exact deployed SHA.

The automated checks above passed on the exact PR head. Production schema/Auth changes and independent security review remain open.

## Production boundary

No production DDL, migration-history edits, data writes, Auth configuration changes, permission broadening, or deployment promotion occurred. Do not apply the two missing-column migrations blindly: live migration history has version/name discrepancies, so the approved sequence is full reconciliation and reviewed change control, not manual schema edits or migration-history repair.

## Relevant records

- [Production Schema Alignment Runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md)
- [Technical Readiness Snapshot](gridmind-technical-readiness-snapshot-2026-10-11.md)
- [Supabase Connection & Security Audit](gridmind-supabase-connection-security-audit-2026-10-11.md)
- [Issue #29 — Immediate priorities and release gates](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29)
