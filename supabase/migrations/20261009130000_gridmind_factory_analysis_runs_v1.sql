-- Append-only persisted factory analysis. Tenant scope comes from active factory membership.
create table if not exists public.factory_analysis_runs (
  id bigint generated always as identity primary key,
  factory_id bigint not null references public.factories(id) on delete restrict,
  idempotency_key text not null,
  algorithm_version text not null,
  input_snapshot jsonb not null,
  result jsonb not null,
  result_fingerprint text not null,
  analysis_status text not null check (analysis_status in ('opportunity','deviation_no_opportunity','within_reference','insufficient_evidence')),
  refusal_codes jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint factory_analysis_runs_input_is_object check (jsonb_typeof(input_snapshot) = 'object'),
  constraint factory_analysis_runs_result_is_object check (jsonb_typeof(result) = 'object'),
  constraint factory_analysis_runs_refusals_are_array check (jsonb_typeof(refusal_codes) = 'array'),
  constraint factory_analysis_runs_input_factory_matches check (input_snapshot ? 'factoryId' and input_snapshot->>'factoryId' = factory_id::text),
  constraint factory_analysis_runs_result_factory_matches check (result ? 'factoryId' and result->>'factoryId' = factory_id::text),
  constraint factory_analysis_runs_status_matches check (result ? 'status' and result->>'status' = analysis_status),
  constraint factory_analysis_runs_algorithm_matches check (result ? 'algorithmVersion' and result->>'algorithmVersion' = algorithm_version),
  constraint factory_analysis_runs_refusals_match check (result ? 'reasonCodes' and refusal_codes = result->'reasonCodes'),
  constraint factory_analysis_runs_idempotency_key_nonempty check (length(trim(idempotency_key)) between 1 and 200),
  constraint factory_analysis_runs_algorithm_nonempty check (length(trim(algorithm_version)) between 1 and 100),
  constraint factory_analysis_runs_fingerprint_nonempty check (length(trim(result_fingerprint)) between 1 and 100),
  constraint factory_analysis_runs_idempotency_unique unique (factory_id, idempotency_key)
);
create index if not exists factory_analysis_runs_factory_created_idx on public.factory_analysis_runs(factory_id, created_at desc);
create index if not exists factory_analysis_runs_factory_status_idx on public.factory_analysis_runs(factory_id, analysis_status, created_at desc);
alter table public.factory_analysis_runs enable row level security;
drop policy if exists "active factory members read analysis runs" on public.factory_analysis_runs;
create policy "active factory members read analysis runs" on public.factory_analysis_runs
  for select to authenticated using ((select private.is_factory_member_v2(factory_id)));
drop policy if exists "active factory members insert analysis runs" on public.factory_analysis_runs;
create policy "active factory members insert analysis runs" on public.factory_analysis_runs
  for insert to authenticated with check (
    (select private.is_factory_member_v2(factory_id))
    and created_by = (select auth.uid())
  );
drop policy if exists "active factory members update analysis runs" on public.factory_analysis_runs;
revoke all on public.factory_analysis_runs from anon, authenticated, service_role;
revoke all on sequence public.factory_analysis_runs_id_seq from anon, authenticated, service_role;
grant select, insert on public.factory_analysis_runs to service_role;
grant usage, select on sequence public.factory_analysis_runs_id_seq to service_role;
-- Browser clients cannot write claimed results directly. The authenticated Edge Function
-- verifies factory membership, runs the shared engine, and writes using the service role.

-- Enforce append-only semantics at the database layer, including privileged application clients.
create or replace function private.reject_factory_analysis_run_mutation()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  raise exception 'FACTORY_ANALYSIS_RUNS_ARE_APPEND_ONLY';
end;
$function$;
revoke all on function private.reject_factory_analysis_run_mutation() from public, anon, authenticated;
drop trigger if exists factory_analysis_runs_append_only on public.factory_analysis_runs;
create trigger factory_analysis_runs_append_only
  before update or delete on public.factory_analysis_runs
  for each row execute function private.reject_factory_analysis_run_mutation();
