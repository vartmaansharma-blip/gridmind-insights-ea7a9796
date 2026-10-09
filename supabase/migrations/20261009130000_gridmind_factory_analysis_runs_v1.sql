-- Authoritative, reproducible factory-analysis runs.
-- Access is derived from active authenticated factory membership, never from client-supplied org claims.

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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint factory_analysis_runs_idempotency_key_nonempty check (length(trim(idempotency_key)) between 1 and 200),
  constraint factory_analysis_runs_algorithm_nonempty check (length(trim(algorithm_version)) between 1 and 100),
  constraint factory_analysis_runs_fingerprint_nonempty check (length(trim(result_fingerprint)) between 1 and 100),
  constraint factory_analysis_runs_idempotency_unique unique (factory_id, idempotency_key)
);

create index if not exists factory_analysis_runs_factory_created_idx
  on public.factory_analysis_runs(factory_id, created_at desc);

create index if not exists factory_analysis_runs_factory_status_idx
  on public.factory_analysis_runs(factory_id, analysis_status, created_at desc);

alter table public.factory_analysis_runs enable row level security;

drop policy if exists "active factory members read analysis runs" on public.factory_analysis_runs;
create policy "active factory members read analysis runs"
  on public.factory_analysis_runs for select to authenticated
  using ((select private.is_factory_member_v2(factory_id)));

drop policy if exists "active factory members insert analysis runs" on public.factory_analysis_runs;
create policy "active factory members insert analysis runs"
  on public.factory_analysis_runs for insert to authenticated
  with check (
    (select private.is_factory_member_v2(factory_id))
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists "active factory members update analysis runs" on public.factory_analysis_runs;
create policy "active factory members update analysis runs"
  on public.factory_analysis_runs for update to authenticated
  using ((select private.is_factory_member_v2(factory_id)))
  with check (
    (select private.is_factory_member_v2(factory_id))
    and (created_by is null or created_by = (select auth.uid()))
  );

revoke all on public.factory_analysis_runs from anon;
grant select, insert, update on public.factory_analysis_runs to authenticated;
grant usage, select on sequence public.factory_analysis_runs_id_seq to authenticated;

create or replace function public.touch_factory_analysis_run_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists factory_analysis_runs_touch_updated_at on public.factory_analysis_runs;
create trigger factory_analysis_runs_touch_updated_at
before update on public.factory_analysis_runs
for each row execute function public.touch_factory_analysis_run_updated_at();
