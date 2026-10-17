# GridMind MVP — controlled machine-evidence staging and case linkage
**Date:** 2026-10-17. **Status:** Synthetic-only engineering candidate. Does NOT authorize live customer ingestion.

## Critical audit
On 2026-10-17 the connected GridMind Supabase project did not contain `public.investigation_cases`. Migration `20261016075004_investigation_case_persistence.sql` exists in source, but its application to live production was unverified/not observed. **Do not apply new migrations or turn on customer case operations until environment drift is reconciled**. The product is not yet operational for real factory investigations.

## Added functionality (isolated test only)
- Migration `20261017130000_synthetic_machine_evidence_quarantine.sql` introduces **append-only** evidence batches, bounded measurement periods, and case↔batch links. No contact with physical sensors or site records.
- Authenticated SQL entry point `public.stage_synthetic_machine_evidence(factory,asset,source,uuid,payload)` enforces active factory **staff** role, checks that the registered source belongs to the same factory and has an existing non-rejected asset mapping, validates exact source fields with timestamps/units and preserves zero-valued observations.
- Every row and batch is **quarantined/unverified**. No pathway writes to `public.observations` or `public.factory_analysis_runs`, and nothing is labeled accepted, calibrated, reviewed, or analysis-ready.
- The call is **disabled by default**, requiring `app.gridmind_synthetic_intake_mode=isolated_fixture_only` inside the disposable SQL test transaction. Never set this flag in deployed production services or browser code.
- Retry of an identical UUID+payload+actor+scope is idempotent; changed body or caller with the same UUID fails. Rows are append-only.
- `public.link_synthetic_evidence_case(case,batch)` checks same-factory scope and manager/investigator case access and saves only an **unverified context link**; it is not an independent reviewer approval or a published customer brief.
- Browser roles have read-only RLS access scoped to active factory staff; anonymous users and case-only customers receive no access; authenticated direct writes denied.
- SQL test `supabase/tests/synthetic-machine-intake-contract.sql` runs only after disposable local fixture setup. It asserts fail-closed production gate, scope/auth, bad mapping, zero-valued readings, time overlaps, idempotency, direct-write refusal, and case-link tenant boundary; rolls back all changes.
- Clean local migration replay must pass before merge. Do not deploy this migration independently to hosted production.

## Work still required before a real industrial MVP
1. **Reconcile live Supabase migration history** against `main`, especially missing case tables; do not run SQL ad hoc against customers' data.
2. Introduce tenant/role-scoped **real-data custody and consent**, source upload retention/deletion and reviewer approval, separated from fictional staging. Add attachment protection, provenance and immutable corrections.
3. Implement human-reviewed promotion to canonical `observations` with verified source identity, operating context, calibrated units, and a server-owned analysis run. Existing direct observation edit permissions need a separate security assessment before launch.
4. Link **verified** machine analysis snapshots to a case as traceable evidence, get independent engineering signoff, and publish a bounded brief. Today's synthetic case backend is not a verified real customer delivery system.
5. Test exactly one source→machine→review→brief workflow using authorized local fixtures, real cross-tenant denial, idempotent response recovery, then independently approve operational field pilot.
6. Park scooter POC data intact; preserve approved Lovable green public site at `/website`.

The database quarantine can help prove secure boundaries, but it does not by itself close Issue #123's entire operational workflow.
