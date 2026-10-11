# GridMind Technical Readiness Snapshot — 2026-10-11

**Status: NO-GO for production readiness.** This is a fresh read-only snapshot through connected Supabase, Vercel and GitHub tools. It does not replace browser-based authenticated acceptance testing. No production migration, setting change, deployment promotion, customer contact, or data mutation was performed in this pass.

## Executive result

- Supabase control plane: **PASS** — project `bvqmvgbfqhgczwbvlqkk` reports `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `ap-south-1`.
- Migration inventory: **PARTIAL** — the two security hardening migrations are recorded, but the application-required Phase 3 columns remain absent in live schema inspection.
- Row-level security: **PARTIAL** — current table inventory reports RLS enabled on all 42 listed public tables. This does not prove policy correctness or end-to-end tenant isolation.
- Edge Function deployment: **PARTIAL** — `persist-factory-analysis` is ACTIVE and JWT verification is enabled.
- Security Advisor: **FAIL / OPEN WARNINGS** — authenticated `SECURITY DEFINER` workspace-bootstrap RPC warning and leaked-password protection disabled.
- Vercel production deployment: **PARTIAL** — latest deployment inspected is READY, but it serves application commit `50c57c89e48b80162ddb33599467ab61a973aeab`, not the current documentation head. READY is not proof of the live authenticated workflow.
- Real customer/value validation: **NOT STARTED / NOT EVIDENCED** — no interviews, permissioned customer records, measured savings or paid commitments are claimed.

## Fresh read-only checks

| Check | Observed result | Interpretation |
|---|---|---|
| Supabase project health | `ACTIVE_HEALTHY` | Admin/control-plane reachability only |
| Database engine | PostgreSQL 17.11 | Informational |
| Migration inventory tail | `20261011062242`, `20261011062256` recorded | Recent privilege hardening and FK-index migrations are registered |
| Public table inventory | 42 tables; each listed with RLS enabled | Policy behavior still requires adversarial tests |
| `asset_interventions.implemented_at` | No matching column returned | Release blocker remains unless a current migration/contract changes this requirement |
| `factory_analysis_runs.input_snapshot_sha256` | No matching column returned | Release blocker remains for code paths that expect this field |
| Live counts | 1 Auth user, 4 factories, 8 assets, 0 observations, 0 analysis runs | Too little populated evidence for two-real-user isolation and analysis persistence tests |
| Edge Function | `persist-factory-analysis` ACTIVE; `verify_jwt=true` | Function exists; does not prove its authorization logic is correct |
| Security Advisor | 1 authenticated SECURITY DEFINER RPC warning; leaked-password protection disabled | Both remain open; do not suppress warnings by broadening permissions |
| Performance Advisor | 86 unused-index notices | Low-traffic signal only; do not drop indexes without workload/query-plan evidence |
| Latest production deployment | READY; deployment `dpl_72GwVVgx9JvDYHhYS5XTbFVeE9LP` | Built from app commit `50c57c89e48b80162ddb33599467ab61a973aeab`; not current docs head |
| Authenticated UI journey | Not run in this pass | Requires controlled browser session/test identity and live acceptance |
| Two-user cross-tenant HTTP/RPC test | Not run in this pass | Requires two distinct test identities and populated, isolated fixtures |
| Migration replay on current head | Not run in this pass | Earlier successful replay is not proof for current head |

### Schema query details

Read-only query checked `information_schema.columns` for the two named columns and returned an empty result. The first combined count query referenced a non-existent relation (`public.asset_observations`) and failed without mutation; it was corrected to the current table name `public.observations`. Corrected counts are reported above.

## Release blockers — ordered

### Blocker 1: Production/repository schema alignment
1. Re-read the two repository migration files and current production schema metadata.
2. Verify migration preconditions, constraints, indexes, triggers, policies, grants and current migration history.
3. Arrange an authorized operator and second-person review, backup/recovery point, low-risk window and written stop conditions.
4. Apply additive DDL only through the approved migration process after explicit production-change authorization.
5. Verify exact definitions, migration history, old-row integrity and application compatibility afterward.
6. Do not hand-edit the schema, disable RLS, guess/backfill historical timestamps or hashes, or treat a clean local replay as a production migration.

Runbook: [Production Schema Alignment Runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md).

### Blocker 2: Workspace bootstrap RPC authorization
Test `public.create_factory_workspace(text,text,text)` with separate authorized and unauthorized identities in an isolated environment. Specifically test whether a caller can attach themselves to an organization they do not control, whether organization selection is deterministic, and whether unauthenticated calls fail. Keep the intended onboarding path working. Review with a qualified Supabase/security practitioner before changing grants or function security.

### Blocker 3: Leaked-password protection
Review current sign-in, password reset and recovery behavior; then enable Supabase leaked-password protection through the authorized project settings owner and test those flows. Not changed in this pass.

### Blocker 4: True tenant-isolation acceptance
Create two dedicated test users and at least two explicitly owned factory fixtures in a non-production environment. Prove both positive owner access and negative cross-tenant access for reads and writes, including REST, RPC, Edge Functions, views, and storage if used. Empty-table zero-row results do not count as isolation proof.

### Blocker 5: End-to-end authenticated persistence
On a release candidate with schema alignment verified, test:
1. Normal sign-in.
2. Workspace/factory creation or selection.
3. Authorized asset selection.
4. Analysis request and server-side membership validation.
5. Exactly one durable record via the intended Edge Function path.
6. Reload/new-session retrieval through an authorized read path.
7. Idempotent retry and conflicting-input rejection.
8. Unauthorized/cross-factory access denial.
9. Logs that exclude tokens, secrets and customer data.
10. Clean build, typecheck, lint, unit/integration tests, migration replay and Vercel deployment for the exact candidate SHA.

### Blocker 6: Current-head release verification
The READY deployment inspected was built from application commit `50c57c89e48b80162ddb33599467ab61a973aeab`. Verify the current application commit, deployment result and live domain after any application changes. Documentation-only commits are not application fixes; a READY deployment on an older SHA is not current-head acceptance.

## Safe checks completed in this pass
- Read-only project health and migration inventory.
- Read-only security/performance advisors.
- Read-only public table/RLS inventory.
- Read-only inspection of the two required schema columns.
- Read-only live record counts.
- Read-only Edge Function status/JWT flag.
- Read-only Vercel deployment inspection.
- No production changes.

## Next engineering action

**Resolve the live schema mismatch through the documented, authorized migration process, then run the full acceptance matrix on an isolated test setup before claiming production readiness.** Because this changes production schema, do not execute it without an authorized operator, explicit approval, a backup/recovery point and second-person review. In parallel, the first customer discovery conversation can proceed without factory data or any claim that the product is production-ready.

## Source documents
- [Supabase Connection & Security Audit](gridmind-supabase-connection-security-audit-2026-10-11.md)
- [Secure Operation & Factory Value Milestone](gridmind-secure-operation-and-factory-value-milestone-2026-10-11.md)
- [Production Schema Alignment Runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md)
- [Live Acceptance Runbook](gridmind-live-acceptance-runbook.md)


## Read-only root-cause update — 2026-10-11

The repository contains the two additive migrations named in the schema-alignment runbook:
- `20261010140000_add_intervention_implemented_at.sql` adds nullable `public.asset_interventions.implemented_at timestamptz` with no default.
- `20261010150000_add_analysis_input_snapshot_sha256.sql` adds nullable `public.factory_analysis_runs.input_snapshot_sha256 text` and a check allowing NULL or `sha256:` followed by 64 lowercase hexadecimal characters.

The recorded production migration inventory ends at `20261010104942 scope_membership_update_policy`, before both repository migration versions. The earlier read-only live column query returned no rows for either field. Therefore the supported explanation is **migration-history/version lag: these repository migrations are not evidenced as applied to the inspected production database**. The reason they are absent is not established. Recheck live state before any change because this snapshot may become stale.

The Edge Function `persist-factory-analysis` declares `input_snapshot_sha256` in its stored-run type and selected column list, so the missing column is a credible persistence compatibility risk. This does not prove which live user path fails; a controlled test is still required. The intervention migration intentionally leaves historical timestamps NULL; do not synthesize dates. The safe remediation and stop conditions are recorded in the [Production Schema Alignment Runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md).

**Discovery route:** the existing execution kit identifies ACMA Eastern Region's public contact page as a potential route to ask for an appropriate event/research networking channel: https://acma.in/contact.php. This is a documented public route, not a verified personal introduction, endorsement, or evidence of buyer access. No contact has been sent. First choice remains a trusted adult/professional introduction, but no named person is yet verified in the project record. Do not claim an introduction until an actual consenting contact and route are confirmed.

No production mutation, deployment, or outreach was performed during this pass. Production remains **NO-GO** pending authorized migration and verified acceptance tests.
