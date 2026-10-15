-- Record the actual implementation timestamp separately from the planned/intervention date.
-- Existing records remain NULL: historical implementation dates must never be guessed.
alter table public.asset_interventions
  add column if not exists implemented_at timestamptz;

comment on column public.asset_interventions.implemented_at is
  'Actual implementation timestamp supported by recorded evidence; NULL means not recorded, not necessarily not implemented.';
