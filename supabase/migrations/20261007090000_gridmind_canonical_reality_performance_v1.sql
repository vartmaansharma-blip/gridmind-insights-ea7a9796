-- GridMind canonical reality and performance layer v1
-- Additive migration. Legacy tables remain intact.

create table if not exists public.organizations (
  id bigint primary key generated always as identity,
  name text not null,
  legal_name text,
  industry text,
  country text not null default 'IN',
  timezone text not null default 'Asia/Kolkata',
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id bigint primary key generated always as identity,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','plant_head','engineer','analyst','finance','viewer')),
  status text not null default 'active' check (status in ('active','suspended','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,user_id)
);

alter table public.factories add column if not exists organization_id bigint;

insert into public.organizations (name, legal_name, industry)
select f.name, f.name, f.industry
from public.factories f
where not exists (select 1 from public.organizations o where o.name = f.name);

update public.factories f
set organization_id = o.id
from public.organizations o
where f.organization_id is null and o.name = f.name;

alter table public.factories alter column organization_id set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'factories_organization_id_fkey') then
    alter table public.factories add constraint factories_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete restrict;
  end if;
end $$;

create table if not exists public.physical_relationships (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  source_asset_id bigint not null references public.factory_assets(id) on delete restrict,
  relationship_type text not null,
  target_asset_id bigint not null references public.factory_assets(id) on delete restrict,
  valid_from timestamptz,
  valid_to timestamptz,
  confidence numeric,
  source_id bigint,
  status text not null default 'active' check (status in ('active','inactive','unverified')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_asset_id <> target_asset_id),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists public.products (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  name text not null,
  code text,
  unit text,
  status text not null default 'active' check (status in ('active','inactive','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.processes (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  name text not null,
  code text,
  process_type text,
  parent_process_id bigint references public.processes(id) on delete restrict,
  status text not null default 'active' check (status in ('active','inactive','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.data_sources (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  name text not null,
  source_type text not null check (source_type in ('csv','excel','api','sql','scada','mes','erp','historian','opc_ua','mqtt','meter','sensor','manual','external')),
  connection_status text not null default 'not_configured' check (connection_status in ('not_configured','connected','degraded','disconnected','error')),
  sampling_frequency text,
  timezone text not null default 'Asia/Kolkata',
  last_ingested_at timestamptz,
  quality_status text not null default 'unverified' check (quality_status in ('valid','suspect','invalid','missing','stale','conflicting','unverified')),
  configuration_version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.data_source_mappings (
  id bigint primary key generated always as identity,
  data_source_id bigint not null references public.data_sources(id) on delete restrict,
  factory_id bigint not null references public.factories(id) on delete restrict,
  source_field text not null,
  canonical_metric text not null,
  asset_id bigint references public.factory_assets(id) on delete restrict,
  unit text,
  transformation text,
  mapping_status text not null default 'unverified' check (mapping_status in ('candidate','validated','rejected','unverified')),
  confidence numeric,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists public.observations (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  subject_type text not null,
  subject_id bigint,
  metric text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  observed_at timestamptz not null,
  observed_until timestamptz,
  data_source_id bigint references public.data_sources(id) on delete restrict,
  quality_status text not null default 'unverified' check (quality_status in ('valid','suspect','invalid','missing','estimated','stale','out_of_range','conflicting','unverified')),
  quality_score numeric,
  is_estimated boolean not null default false,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (value_numeric is not null or value_text is not null),
  check (observed_until is null or observed_until >= observed_at),
  check (quality_score is null or (quality_score >= 0 and quality_score <= 1))
);

create table if not exists public.operating_contexts (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  scope_type text not null,
  scope_id bigint,
  context_type text not null check (context_type in ('production','operating_state','load','temporal','environmental','configuration','maintenance','economic','other')),
  start_time timestamptz not null,
  end_time timestamptz,
  status text not null default 'validated' check (status in ('observed','derived','validated','estimated','invalid')),
  confidence numeric,
  source_id bigint references public.data_sources(id) on delete set null,
  values jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (end_time is null or end_time >= start_time),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists public.operating_regimes (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  scope_type text not null,
  scope_id bigint,
  name text not null,
  regime_type text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  confidence numeric,
  method text,
  version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (end_time is null or end_time >= start_time),
  check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists public.performance_baselines (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  scope_type text not null,
  scope_id bigint,
  metric text not null,
  method text not null check (method in ('physics','engineering_reference','historical_like_for_like','regression','peer','hybrid','counterfactual')),
  version integer not null default 1,
  training_start timestamptz,
  training_end timestamptz,
  valid_from timestamptz,
  valid_until timestamptz,
  model_reference text,
  context_variables jsonb not null default '[]'::jsonb,
  uncertainty_method text,
  confidence numeric,
  status text not null default 'candidate' check (status in ('candidate','validated','active','expired','invalidated','superseded')),
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confidence is null or (confidence >= 0 and confidence <= 1)),
  check (training_end is null or training_start is null or training_end >= training_start),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create table if not exists public.performance_expectations (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  baseline_id bigint not null references public.performance_baselines(id) on delete restrict,
  scope_type text not null,
  scope_id bigint,
  metric text not null,
  context_id bigint references public.operating_contexts(id) on delete set null,
  expected_value numeric not null,
  lower_bound numeric,
  upper_bound numeric,
  unit text,
  confidence numeric,
  generated_at timestamptz not null default now(),
  valid_for_start timestamptz,
  valid_for_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  check (lower_bound is null or upper_bound is null or lower_bound <= upper_bound),
  check (confidence is null or (confidence >= 0 and confidence <= 1)),
  check (valid_for_end is null or valid_for_start is null or valid_for_end >= valid_for_start)
);

create table if not exists public.performance_deviations (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  scope_type text not null,
  scope_id bigint,
  metric text not null,
  observation_id bigint not null references public.observations(id) on delete restrict,
  expectation_id bigint not null references public.performance_expectations(id) on delete restrict,
  actual_value numeric,
  expected_value numeric,
  deviation_value numeric,
  deviation_percentage numeric,
  direction text not null check (direction in ('favorable','unfavorable','neutral','unknown')),
  persistence text,
  statistical_significance text,
  engineering_significance text,
  economic_materiality text,
  status text not null default 'detected' check (status in ('detected','watch','material','severe','invalid','insufficient_context')),
  created_at timestamptz not null default now()
);

create table if not exists public.derived_facts (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  fact_type text not null,
  scope_type text not null,
  scope_id bigint,
  value_numeric numeric,
  unit text,
  formula text,
  formula_version text,
  input_references jsonb not null default '[]'::jsonb,
  uncertainty jsonb not null default '{}'::jsonb,
  assumptions jsonb not null default '{}'::jsonb,
  derived_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists organizations_name_idx on public.organizations(name);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organization_members_org_idx on public.organization_members(organization_id);
create index if not exists factories_organization_idx on public.factories(organization_id);
create index if not exists physical_relationships_factory_idx on public.physical_relationships(factory_id);
create index if not exists physical_relationships_source_idx on public.physical_relationships(source_asset_id);
create index if not exists physical_relationships_target_idx on public.physical_relationships(target_asset_id);
create index if not exists products_factory_idx on public.products(factory_id);
create index if not exists processes_factory_idx on public.processes(factory_id);
create index if not exists data_sources_factory_idx on public.data_sources(factory_id);
create index if not exists data_source_mappings_source_idx on public.data_source_mappings(data_source_id);
create index if not exists data_source_mappings_factory_idx on public.data_source_mappings(factory_id);
create index if not exists data_source_mappings_asset_idx on public.data_source_mappings(asset_id);
create index if not exists observations_factory_time_idx on public.observations(factory_id, observed_at);
create index if not exists observations_subject_time_idx on public.observations(factory_id, subject_id, observed_at);
create index if not exists observations_metric_time_idx on public.observations(factory_id, metric, observed_at);
create index if not exists operating_contexts_factory_time_idx on public.operating_contexts(factory_id, start_time);
create index if not exists operating_regimes_factory_time_idx on public.operating_regimes(factory_id, start_time);
create index if not exists performance_baselines_scope_idx on public.performance_baselines(factory_id, scope_id, metric, status);
create index if not exists performance_expectations_baseline_idx on public.performance_expectations(baseline_id, generated_at);
create index if not exists performance_deviations_factory_status_idx on public.performance_deviations(factory_id, status);
create index if not exists performance_deviations_observation_idx on public.performance_deviations(observation_id);
create index if not exists derived_facts_factory_time_idx on public.derived_facts(factory_id, derived_at);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "members read organizations" on public.organizations;
create policy "members read organizations" on public.organizations for select to authenticated
using ((select exists (select 1 from public.organization_members om where om.organization_id=organizations.id and om.user_id=(select auth.uid()) and om.status='active')));

drop policy if exists "members read organization_members" on public.organization_members;
create policy "members read organization_members" on public.organization_members for select to authenticated
using (user_id=(select auth.uid()) or (select exists (select 1 from public.organization_members om where om.organization_id=organization_members.organization_id and om.user_id=(select auth.uid()) and om.status='active' and om.role in ('owner','admin'))));

create or replace function private.is_factory_member_v2(_factory_id bigint)
returns boolean language sql stable security definer set search_path=''
as $function$
  select exists (select 1 from public.factory_members m where m.factory_id=_factory_id and m.user_id=(select auth.uid()));
$function$;

revoke execute on function private.is_factory_member_v2(bigint) from public;
grant execute on function private.is_factory_member_v2(bigint) to authenticated;

create or replace function private.is_org_member(_organization_id bigint)
returns boolean language sql stable security definer set search_path=''
as $function$
  select exists (select 1 from public.organization_members m where m.organization_id=_organization_id and m.user_id=(select auth.uid()) and m.status='active');
$function$;

revoke execute on function private.is_org_member(bigint) from public;
grant execute on function private.is_org_member(bigint) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['physical_relationships','products','processes','data_sources','data_source_mappings','observations','operating_contexts','operating_regimes','performance_baselines','performance_expectations','performance_deviations','derived_facts'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "factory members read %I" on public.%I',t,t);
    execute format('create policy "factory members read %I" on public.%I for select to authenticated using ((select private.is_factory_member_v2(factory_id)))',t,t);
    execute format('drop policy if exists "factory members insert %I" on public.%I',t,t);
    execute format('create policy "factory members insert %I" on public.%I for insert to authenticated with check ((select private.is_factory_member_v2(factory_id)))',t,t);
    execute format('drop policy if exists "factory members update %I" on public.%I',t,t);
    execute format('create policy "factory members update %I" on public.%I for update to authenticated using ((select private.is_factory_member_v2(factory_id))) with check ((select private.is_factory_member_v2(factory_id)))',t,t);
  end loop;
end $$;
