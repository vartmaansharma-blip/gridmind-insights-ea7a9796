-- Cryptographic digest of the exact canonical input snapshot used by an analysis run.
-- Nullable for historical runs; never invent hashes for old snapshots.
alter table public.factory_analysis_runs
  add column if not exists input_snapshot_sha256 text;

alter table public.factory_analysis_runs
  drop constraint if exists factory_analysis_runs_input_snapshot_sha256_format;

alter table public.factory_analysis_runs
  add constraint factory_analysis_runs_input_snapshot_sha256_format
  check (
    input_snapshot_sha256 is null
    or input_snapshot_sha256 ~ '^sha256:[0-9a-f]{64}$'
  );

comment on column public.factory_analysis_runs.input_snapshot_sha256 is
  'SHA-256 digest of canonicalized input_snapshot at persistence time; NULL means historical digest not recorded. Detects accidental divergence, not malicious DB-owner tampering.';
