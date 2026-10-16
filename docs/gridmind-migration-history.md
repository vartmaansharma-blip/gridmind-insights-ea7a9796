# GridMind migration-history reconciliation

## Current reconciliation tool — 2026-10-15

For the current implementation and verification evidence, see the [Supabase checkpoint](gridmind-supabase-connection-security-audit-2026-10-11.md#supabase-implementation-checkpoint-2026-10-15). The sections below describe the earlier reconciliation and are historical evidence.

Export `SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version` as a JSON array (or use the management migration-list result as `{ "migrations": [...] }`), then run:

```sh
node scripts/check-supabase-migration-drift.mjs /path/to/inventory.json
bun run test -- scripts/check-supabase-migration-drift.test.mjs
```

Exit 0 means identities align, 1 means review findings exist, and 2 means invalid input. Name aliases require SQL/object review and never automatically count as applied. No SQL is executed by this tool. Use `supabase/tests/gridmind-schema-preflight.sql` for SELECT-only live metadata before any approved change. Do not apply production migrations until the existing recovery, independent-review, isolated acceptance, and explicit authorization gates pass.

## Why this was required

A read-only comparison found that the live Supabase migration registry and the repository did not describe the same migration history. The live registry contained 21 applied migrations, while the repository contained 14 earlier migration files before this reconciliation. Several filenames used the original planned timestamps rather than the timestamps recorded by Supabase; three files also differed from the SQL stored in the live migration registry.

A fresh database could therefore replay a different history from the schema currently in use.

## What changed

- Reconstructed the 21 already-applied migration source files from the corresponding `supabase_migrations.schema_migrations` records in the live project.
- Named each reconstructed file with the exact recorded migration version, followed by the recorded migration name.
- Removed the 12 superseded local migration filenames whose contents were replaced by the version-aligned sources.
- Preserved the pending `20261009130000_gridmind_factory_analysis_runs_v1.sql` migration after the reconciled history.
- Did not apply a migration, mutate operational rows, or deploy an Edge Function as part of this reconciliation.

The migration source rows reported one SQL statement per recorded migration. The restored files preserve the SQL text stored in those records; they are not a newly designed schema or an attempt to rewrite production history.

A clean replay then exposed one additional source-history gap: `20261006043042_harden_rls_auto_enable_function.sql` revokes privileges on `public.rls_auto_enable()` but does not create it. Read-only inspection confirmed that the live schema has both this function and the `ensure_rls` DDL event trigger, neither of which appears in the 21 recorded migration statements. Without that pre-existing bootstrap, a clean replay fails on the second migration and also misses the live behavior that automatically enables RLS on new public tables. A compatibility bootstrap migration, `20261006030000_gridmind_rls_auto_enable_bootstrap.sql`, now reconstructs the function and creates the event trigger only when absent. The function body matches the live definition; the migration is ordered before the core schema migration.

## Verification and limits

The repository contains the 21 version-aligned sources from the live migration registry, the recovered pre-registry RLS bootstrap, and the pending analysis-run migration. A dedicated GitHub Actions workflow now starts an ephemeral local Supabase stack, resets the database from zero, runs SQL assertions for tenant isolation/direct-table denial/append-only behavior, and checks migration history. The first run correctly failed at the missing bootstrap; the recovered migration was then added and the workflow is being rerun.

A successful replay will prove the source history can initialize a clean local database. It does not by itself prove the complete live schema is identical; the next comparison must cover key tables, constraints, RLS policies, grants, indexes, and security-definer functions. Production has not been reset or replayed.

## Next acceptance gate

1. Confirm the new clean replay and SQL security assertions pass in GitHub Actions.
2. Compare key tables, constraints, RLS policies, grants, indexes, event triggers, and security-definer functions against the live project.
3. Extend integration coverage to the Edge Function's authenticated request path and concurrent idempotent retries.
4. Apply/deploy to a separately provisioned Supabase branch only after explicit cost approval and passing local replay.
5. Deploy to the live project only after isolated tenant tests pass and the membership/bootstrap path is understood.
