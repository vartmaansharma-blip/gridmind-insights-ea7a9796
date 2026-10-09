# GridMind migration-history reconciliation

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

## Verification and limits

The repository now contains 21 version-aligned files for the migrations already recorded in Supabase, plus the new pending analysis-run migration. GitHub CI and the GridMind Quality Gate are running against this reconciliation commit.

This repairs source alignment, but it is not yet proof that a clean local database reset succeeds. The next database acceptance step is to run a clean Supabase migration replay in an isolated development database, then compare the resulting schema against the live schema before deploying the pending analysis migration. Production must not be reset or replayed.

## Next acceptance gate

1. Rebuild the schema from the 21 versioned migration files in an isolated database.
2. Confirm the replay completes without manual SQL intervention.
3. Compare key tables, constraints, RLS policies, grants, indexes, and security-definer functions against the live project.
4. Apply the pending analysis-run migration only in the isolated database.
5. Test authenticated factory access, cross-tenant denial, direct-table denial, concurrent idempotency, and reload/recompute integrity with controlled membership fixtures.
6. Deploy only after the isolated acceptance tests pass and the live membership/bootstrap path is understood.
