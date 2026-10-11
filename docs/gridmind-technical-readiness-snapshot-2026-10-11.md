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


## Fresh live recheck and cause refinement — 2026-10-11

A fresh read-only check reconfirmed project `bvqmvgbfqhgczwbvlqkk` is `ACTIVE_HEALTHY` on PostgreSQL 17.11 in `ap-south-1`. Current production migration inventory includes versions `20261011062242` and `20261011062256`; the two expected columns remain absent on a fresh information-schema query.

**Correction to the initial explanation:** because production contains later migration versions than repository migrations `20261010140000` and `20261010150000`, this is not merely a production migration head lag. Evidence supports an **out-of-order/missing migration-history or schema-drift discrepancy**. The precise mechanism is unknown and must not be guessed. Do not blindly run earlier migrations, manually insert migration-history rows, or bypass the normal migration runner. The runbook now requires an authorized operator and independent reviewer to reconcile the full migration directory/history and decide the approved path before any production DDL.

No production changes or outreach were performed. The production release gate remains **NO-GO**.


## Exact migration identity reconciliation — 2026-10-11

A read-only comparison found 33 SQL files under the current repository migration directory and 30 recorded live migrations. The issue is more specific than a simple head mismatch:

- `20261006030000_gridmind_rls_auto_enable_bootstrap.sql` has no live entry with that version prefix.
- The two migrations `20261010140000_add_intervention_implemented_at.sql` and `20261010150000_add_analysis_input_snapshot_sha256.sql` have no corresponding live version entries, and the expected columns remain absent.
- Seven migration files appear in live history under different version IDs, based on matching migration names: repository versions `20261009130000`, `20261010100000`, `20261010103000`, `20261010104000`, `20261010110000`, `20261010120000`, `20261010130000` correspond by name to live versions `20261010075630`, `20261010081740`, `20261010082541`, `20261010082706`, `20261010103936`, `20261010104457`, `20261010104942`, respectively.

The name correspondence does not prove SQL-body identity or explain how/why version IDs changed. The bootstrap's effects are also not established by migration inventory alone. Inspect those SQL bodies and compare live object/privilege/function definitions before planning a change. Do not blindly replay migrations or edit history manually. See the [Production Schema Alignment Runbook](gridmind-production-schema-alignment-runbook-2026-10-11.md) for the full reconciliation and stop conditions.

No production DDL, migration-history change, settings change, deployment or outreach was performed. Production remains **NO-GO** pending reviewed schema reconciliation and authenticated acceptance testing.


## Object-level preflight — 2026-10-11

Read-only catalog checks found the live `ensure_rls` event trigger enabled and `public.rls_auto_enable()` present, so the bootstrap migration's intended capability exists despite its missing version-prefix entry. Exact SQL-body equivalence is unproven; do not replay the bootstrap just to align history. The live catalog also contains `private.is_org_admin`, `private.is_factory_member_v2`, `private.reject_factory_analysis_run_mutation`, an append-only trigger on `factory_analysis_runs`, and relevant RLS policies. Existence does not prove safe authorization or cross-tenant isolation.

The live SECURITY DEFINER `create_factory_workspace` function requires an authenticated user and uses an empty search path. It selects the first active owner/admin organization by ID when the user belongs to multiple such organizations; test that deterministic selection and authorization behavior in an isolated environment with an independent reviewer. The Security Advisor warning remains open. Both expected schema columns remain absent.

Disposition: bootstrap capability present but migration identity unaligned; seven migration bodies likely represented under changed version IDs but not yet proven identical; two additive column migrations not evidenced as applied and columns absent. Reconcile per migration and live object, never bulk replay or hand-edit migration history. No production changes were made; production remains **NO-GO**.


## Read-only grants/policy spot-check — 2026-10-11

Current table grants and selected policy definitions broadly match the intent of the seven migration files recorded under changed live version IDs: expected authenticated CRUD grants are present for the listed factory workflow tables; factory and asset policies are member-read / owner-admin-write; organization membership policies are explicitly authenticated and admin-scoped; factory analysis runs allow service-role persistence and authenticated member reads/inserts with creator identity checks. This spot-check is not a complete migration semantic diff and does not prove tenant isolation.

The remaining technical sequence is a complete migration-by-migration disposition, then non-production tests for workspace RPC behavior with zero/one/multiple active owner/admin memberships, two-user cross-tenant reads/writes, and end-to-end persistence. The missing implemented_at and input_snapshot_sha256 columns remain unresolved. No production mutation occurred; production remains NO-GO.


## Per-migration disposition — read-only review, 2026-10-11

The runbook now contains a per-migration matrix. Current evidence supports: (1) bootstrap RLS capability exists but version identity is unresolved; (2) core factory-analysis table, constraints, append-only trigger, service-role grants and authenticated member policies exist; (3) the seven migrations recorded under different version IDs have current grants/policies broadly matching their intent in the inspected scope; and (4) the two additive column migrations are not represented in live schema, with both columns and the SHA-256 format constraint absent.

A catalog spot-check found no structural TRUNCATE/REFERENCES/TRIGGER grants to PUBLIC, anon, authenticated or service_role among the inspected public tables; final acceptance must repeat this over all public tables. This is not proof of tenant isolation. No production mutation occurred. Production remains **NO-GO** until the canonical migration-history strategy is tested on a restored/staging copy, full function/ACL comparison is complete, and authenticated cross-tenant/end-to-end tests pass.


## Follow-up catalog verification — 2026-10-11

A refreshed migration inventory contains two additional migrations absent from the earlier snapshot:
- `20261011062242_harden_public_default_table_privileges` (recorded live under the same name/version): aims to revoke MAINTAIN/TRUNCATE/REFERENCES/TRIGGER on existing public tables and defaults for future public tables.
- `20261011062256_add_factory_analysis_run_fk_indexes` (recorded live under the same name/version): both indexes exist in the live catalog.

**New unresolved finding:** a read-only `pg_default_acl` inspection returned entries for MAINTAIN, TRUNCATE, REFERENCES, and TRIGGER for `anon`, `authenticated`, and `service_role` in the public schema's default table ACL. This conflicts with the intended least-privilege defaults in `harden_public_default_table_privileges`. Do not assume the migration achieved the desired state just because it appears in migration history. Re-query the raw default ACL, identify the creating role and grant source, and test the behavior on a fresh staging table before designing a narrowly scoped correction.

The two missing columns remain absent. The exact function-body comparison for `public.rls_auto_enable()` shows matching behavior in the inspected body (formatting differs), but full ACL/version reconciliation is still pending. Security Advisor still reports the authenticated SECURITY DEFINER RPC `public.create_factory_workspace(text,text,text)` and disabled leaked-password protection. Production remains **NO-GO**.


## ACL discrepancy clarification — 2026-10-11

The earlier catalog result was too broad to label a confirmed migration failure. A more precise `pg_default_acl` query identified the creator role for each default ACL:
- For creator role `postgres`, the public-schema default ACL contains only `postgres` as grantee for MAINTAIN, REFERENCES, TRIGGER, and TRUNCATE. No API-role grantees were returned for the `postgres` creator-role ACL.
- The entries for `anon`, `authenticated`, and `service_role` are associated with creator role `supabase_admin`, granted by `supabase_admin`.

The repository migration explicitly uses `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public`, so the `supabase_admin` entries do **not by themselves prove that migration failed**; default privileges are creator-role-specific. They do reveal a coverage question: if `supabase_admin` can create public tables in this environment, its defaults may not have the same least-privilege behavior. Next, verify which role actually creates application tables and whether `supabase_admin` is expected/able to create public tables; reproduce with a harmless staging table created by each relevant role. Do not change provider-managed role defaults blindly.

Therefore classify this as **default-privilege coverage to verify**, not a confirmed production exploit or confirmed migration failure. No production changes were made. Other NO-GO gates remain: missing nullable columns, incomplete authenticated two-tenant and end-to-end tests, and the two Security Advisor warnings.


## Fresh execution pass — 2026-10-11 (read-only)

### Results

- Fresh Supabase migration inventory: **32 entries**; latest observed migration versions `20261011062242` and `20261011062256`. The two expected repository migrations are still not evidenced in the live inventory.
- Fresh column check: **zero rows** for `public.asset_interventions.implemented_at` and `public.factory_analysis_runs.input_snapshot_sha256`. Schema contract remains mismatched.
- Supabase branch inventory: **no development branches**. Safe staging experiments and two-user tests cannot be truthfully marked complete. No branch/project or test users were created.
- Role/object ownership check: `supabase_admin` is superuser-capable; `postgres` is also a creator role; inspected public application objects are owned by `postgres`. This supports testing creator-role-specific default ACLs in isolation, not modifying provider-managed defaults in production.
- Across all inspected public tables/views, effective privilege checks were false for `TRUNCATE`, `REFERENCES`, and `TRIGGER` for `anon`, `authenticated`, and `service_role`. This closes that narrow catalog spot-check only; it is not an RLS/tenant-isolation pass.
- Security Advisor still reports authenticated execution of `public.create_factory_workspace(text,text,text)` as SECURITY DEFINER and disabled leaked-password protection.
- Workspace RPC definition requires authentication and uses an empty search path, but chooses the lowest-ID active owner/admin organization for users with multiple qualifying memberships. No isolated behavior tests were run; no bypass has been established by the read-only definition alone.

### Gate decisions

| Gate | Current status |
|---|---|
| Safe migration/role test | **BLOCKED** — no development branch available |
| Missing-column reconciliation | **OPEN** — prepared SQL reviewed; no migration applied |
| Two-user cross-tenant read/write | **NOT RUN** |
| Workspace RPC adversarial cases | **NOT RUN** |
| Leaked-password protection | **OPEN** |
| Full live authenticated workflow | **NOT RUN** |
| Production readiness | **NO-GO / HOLD** |

### Next action

Obtain an authorized isolated Supabase test environment, replay the current repository migration set there, and execute the test matrix before designing a production migration/history repair. Then resolve the RPC behavior and leaked-password setting through reviewed changes, and run end-to-end authenticated acceptance against the exact release candidate. Never use production as the scratch environment, invent historical hashes/timestamps, edit migration history manually, or treat a Vercel READY status as acceptance evidence.

No production mutation, deployment, settings change, or outreach was performed in this pass.


## Execution update — isolated test environment blocker (2026-10-11)

Attempted to create Supabase development branch `gridmind-readiness-test` after retrieving and confirming the displayed branch price of **$0.01344/hour**. Supabase rejected the request with: `Branching is supported only on the Pro plan or above`. No branch was created and no production database change occurred.

The immediate next step is to run the existing repository-local migration replay and integration tests, and capture their current-head result. This is a useful CI gate but **does not replace** a live isolated Supabase environment for testing provider-specific roles, two-user cross-tenant access, or authenticated production acceptance. Do not upgrade the plan or mutate production automatically; first use an already-authorized staging project if one exists, otherwise keep those checks explicitly blocked.

Issue #27 records this blocker and the execution pivot. Production remains **NO-GO / HOLD**.
