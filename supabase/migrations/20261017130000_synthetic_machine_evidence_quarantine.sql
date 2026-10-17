-- GridMind synthetic-only machinery evidence staging. Deliberately disabled in production.
-- No real customer data, canonical observation promotion or qualified diagnosis.
begin;

create table public.synthetic_machine_evidence_batches (
  id uuid primary key,
  factory_id bigint not null references public.factories(id) on delete restrict,
  asset_id bigint not null references public.factory_assets(id) on delete restrict,
  source_id bigint not null references public.data_sources(id) on delete restrict,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  origin text not null default 'synthetic' check (origin = 'synthetic'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 50000),
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'quarantined' check(status = 'quarantined'),
  created_at timestamptz not null default now()
);
create index synthetic_machine_evidence_batches_scope_idx
  on public.synthetic_machine_evidence_batches(factory_id,asset_id,created_at desc);
create table public.synthetic_machine_evidence_periods (
  batch_id uuid not null references public.synthetic_machine_evidence_batches(id) on delete restrict,
  position integer not null check(position between 1 and 100),
  period_start timestamptz not null,
  period_end timestamptz not null,
  energy_kwh numeric not null check(energy_kwh between 0 and 1000000000000),
  output_units numeric not null check(output_units between 0 and 1000000000000),
  operating_hours numeric not null check(operating_hours between 0 and 1000000000000),
  operating_state text not null,
  product_code text not null,
  source_reference text not null,
  comparable_numeric_candidate boolean generated always as
    (energy_kwh > 0 and output_units > 0 and operating_hours > 0) stored,
  quality_status text not null default 'unverified' check(quality_status='unverified'),
  primary key(batch_id,position),
  check(period_end > period_start)
);
create index synthetic_machine_evidence_periods_range_idx
  on public.synthetic_machine_evidence_periods(batch_id,period_start,period_end);

create table public.synthetic_machine_case_links (
  case_id uuid not null references public.investigation_cases(id) on delete restrict,
  batch_id uuid not null references public.synthetic_machine_evidence_batches(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'context_only_unverified'
    check(status='context_only_unverified'),
  created_at timestamptz not null default now(),
  primary key (case_id,batch_id)
);
create index synthetic_machine_case_links_batch_idx on public.synthetic_machine_case_links(batch_id);

alter table public.synthetic_machine_evidence_batches enable row level security;
alter table public.synthetic_machine_evidence_periods enable row level security;
alter table public.synthetic_machine_case_links enable row level security;
revoke all on public.synthetic_machine_evidence_batches,public.synthetic_machine_evidence_periods,
  public.synthetic_machine_case_links from public,anon,authenticated,service_role;
grant select on public.synthetic_machine_evidence_batches,
  public.synthetic_machine_evidence_periods,public.synthetic_machine_case_links to authenticated;

-- Read only for authenticated, active factory staff, not case-only customers.
create policy "staff read own scoped synthetic intake" on public.synthetic_machine_evidence_batches
  for select to authenticated
  using (
    private.is_factory_member(factory_id,ARRAY['owner','admin','analyst'])
  );
create policy "staff read own synthetic intake rows" on public.synthetic_machine_evidence_periods
  for select to authenticated
  using (exists (
    select 1 from public.synthetic_machine_evidence_batches b
    where b.id=batch_id
  ));
create policy "case staff read own synthetic links" on public.synthetic_machine_case_links
  for select to authenticated
  using (private.investigation_access(case_id,(select auth.uid())) in ('manager','investigator')
    and exists (select 1 from public.synthetic_machine_evidence_batches b where b.id=batch_id));

-- No direct table mutation, even for service_role. These references are append-only.
create trigger synthetic_machine_batches_immutable before update or delete on public.synthetic_machine_evidence_batches
  for each row execute function private.investigation_revision_immutable();
create trigger synthetic_machine_periods_immutable before update or delete on public.synthetic_machine_evidence_periods
  for each row execute function private.investigation_revision_immutable();
create trigger synthetic_machine_case_links_immutable before update or delete on public.synthetic_machine_case_links
  for each row execute function private.investigation_revision_immutable();

create function public.stage_synthetic_machine_evidence(
  _factory bigint,_asset bigint,_source bigint,_id uuid,_payload jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  actor uuid := auth.uid();
  record_value jsonb;
  records jsonb;
  fingerprint text;
  existing public.synthetic_machine_evidence_batches%rowtype;
  n integer;
  period_from timestamptz;
  period_to timestamptz;
  value numeric;
  field text;
  value_text text;
  start_text text;
  end_text text;
  role_name text;
  scope_matches boolean;
begin
  -- Flag is set exclusively in a disposable local transaction.
  if current_setting('app.gridmind_synthetic_intake_mode',true) is distinct from 'isolated_fixture_only'
    then raise exception 'SYNTHETIC_INTAKE_DISABLED' using errcode='42501'; end if;
  if actor is null or _id is null or _factory is null or _asset is null or _source is null
    then raise exception 'AUTHENTICATION_OR_SCOPE_REQUIRED' using errcode='42501'; end if;
  role_name:=private.investigation_factory_role(_factory,actor);
  if role_name not in ('owner','admin','analyst') or role_name is null
    then raise exception 'STAFF_FACTORY_ACCESS_DENIED' using errcode='42501'; end if;
  select (exists (
    select 1 from public.factory_assets a
      join public.data_sources s on s.factory_id=a.factory_id and s.id=_source
      join public.data_source_mappings m on m.factory_id=a.factory_id
        and m.asset_id=a.id and m.data_source_id=s.id
    where a.factory_id=_factory and a.id=_asset
      and m.mapping_status <> 'rejected'
  )) into scope_matches;
  if not scope_matches then raise exception 'SOURCE_NOT_MAPPED_TO_ASSET' using errcode='42501'; end if;
  if _payload is null or jsonb_typeof(_payload)<>'object'
    or _payload->>'origin' <> 'synthetic'
    or jsonb_typeof(_payload->'periods')<>'array'
    or octet_length(_payload::text)>50000
    then raise exception 'INVALID_SYNTHETIC_PAYLOAD' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(_payload)) <> 2
    then raise exception 'UNKNOWN_PAYLOAD_FIELDS' using errcode='22023'; end if;
  records:=_payload->'periods';
  n:=jsonb_array_length(records);
  if n<1 or n>100 then raise exception 'PERIOD_COUNT_OUT_OF_RANGE' using errcode='22023'; end if;
  fingerprint:=encode(sha256(convert_to(_payload::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended('gm-synthetic-intake:'||_id::text,0));
  select * into existing from public.synthetic_machine_evidence_batches where id=_id;
  if found then
    if existing.factory_id<>_factory or existing.asset_id<>_asset
      or existing.source_id<>_source or existing.submitted_by<>actor
      or existing.payload_sha256<>fingerprint
      then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
    return jsonb_build_object('batchId',_id,'status','quarantined','replayed',true);
  end if;

  -- Exact field shape and primitive types; never promote a source claim to validated.
  for record_value in select value from jsonb_array_elements(records) loop
    if jsonb_typeof(record_value)<>'object'
      or (select count(*) from jsonb_object_keys(record_value))<>8
      or jsonb_typeof(record_value->'period_start')<>'string'
      or jsonb_typeof(record_value->'period_end')<>'string'
      or jsonb_typeof(record_value->'energy_kwh')<>'number'
      or jsonb_typeof(record_value->'output_units')<>'number'
      or jsonb_typeof(record_value->'operating_hours')<>'number'
      or jsonb_typeof(record_value->'operating_state')<>'string'
      or jsonb_typeof(record_value->'product_code')<>'string'
      or jsonb_typeof(record_value->'source_reference')<>'string'
      then raise exception 'INVALID_MEASUREMENT_FIELDS' using errcode='22023'; end if;
    if exists (select 1 from jsonb_object_keys(record_value) k
      where k not in ('period_start','period_end','energy_kwh','output_units',
        'operating_hours','operating_state','product_code','source_reference'))
      then raise exception 'UNKNOWN_MEASUREMENT_FIELDS' using errcode='22023'; end if;
    start_text:=record_value->>'period_start';
    end_text:=record_value->>'period_end';
    if start_text !~ ('^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})' || chr(36))
      or end_text !~ ('^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})' || chr(36))
      then raise exception 'TIMEZONE_REQUIRED' using errcode='22023'; end if;
    begin
      period_from:=start_text::timestamptz;
      period_to:=end_text::timestamptz;
    exception when others then
      raise exception 'INVALID_PERIOD_TIMESTAMP' using errcode='22023';
    end;
    if period_to<=period_from then raise exception 'PERIOD_END_BEFORE_START' using errcode='22023'; end if;
    foreach field in array array['energy_kwh','output_units','operating_hours'] loop
      value:=(record_value->>field)::numeric;
      if value<0 or value>1000000000000
        then raise exception 'MEASUREMENT_OUT_OF_BOUNDS' using errcode='22023'; end if;
    end loop;
    foreach field in array array['operating_state','product_code','source_reference'] loop
      value_text:=record_value->>field;
      if length(value_text)<1 or length(value_text)>80 or
        value_text !~ '^[A-Za-z0-9][A-Za-z0-9._:/ -]*$'
        then raise exception 'UNSAFE_MEASUREMENT_REFERENCE' using errcode='22023'; end if;
    end loop;
  end loop;

  insert into public.synthetic_machine_evidence_batches
    (id,factory_id,asset_id,source_id,submitted_by,payload,payload_sha256)
  values (_id,_factory,_asset,_source,actor,_payload,fingerprint);

  insert into public.synthetic_machine_evidence_periods
    (batch_id,position,period_start,period_end,energy_kwh,output_units,operating_hours,
      operating_state,product_code,source_reference)
  select _id,x.ordinality,
      (x.value->>'period_start')::timestamptz,(x.value->>'period_end')::timestamptz,
      (x.value->>'energy_kwh')::numeric,(x.value->>'output_units')::numeric,
      (x.value->>'operating_hours')::numeric,x.value->>'operating_state',
      x.value->>'product_code',x.value->>'source_reference'
  from jsonb_array_elements(records) with ordinality as x(value,ordinality);

  if exists (
    select 1 from public.synthetic_machine_evidence_periods a
    join public.synthetic_machine_evidence_periods b on b.batch_id=a.batch_id
      and b.position>a.position
      and a.period_start < b.period_end and b.period_start < a.period_end
    where a.batch_id=_id
  ) then raise exception 'OVERLAPPING_MEASUREMENT_PERIODS' using errcode='22023'; end if;

  return jsonb_build_object('batchId',_id,'status','quarantined',
    'replayed',false,'periods',n);
end;
$function$;

create function public.link_synthetic_evidence_case(_case uuid,_batch uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
  actor uuid := auth.uid();
  case_factory bigint;
  batch_factory bigint;
  role_name text;
begin
  if current_setting('app.gridmind_synthetic_intake_mode',true) is distinct from 'isolated_fixture_only'
    then raise exception 'SYNTHETIC_INTAKE_DISABLED' using errcode='42501'; end if;
  if actor is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select factory_id into case_factory from public.investigation_cases
    where id=_case and origin='synthetic';
  select factory_id into batch_factory from public.synthetic_machine_evidence_batches
    where id=_batch and origin='synthetic' and status='quarantined';
  if case_factory is null or batch_factory is null or case_factory<>batch_factory
    then raise exception 'CASE_EVIDENCE_SCOPE_MISMATCH' using errcode='42501'; end if;
  role_name:=private.investigation_access(_case,actor);
  if role_name not in ('manager','investigator') or role_name is null
    then raise exception 'CASE_LINK_ACCESS_DENIED' using errcode='42501'; end if;
  insert into public.synthetic_machine_case_links(case_id,batch_id,linked_by)
  values(_case,_batch,actor) on conflict(case_id,batch_id) do nothing;
  return jsonb_build_object('caseId',_case,'batchId',_batch,
    'status','context_only_unverified');
end;
$function$;

revoke all on function public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)
  from public,anon,authenticated;
revoke all on function public.link_synthetic_evidence_case(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)
  to authenticated;
grant execute on function public.link_synthetic_evidence_case(uuid,uuid)
  to authenticated;

commit;

      or end_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})
      then raise exception 'TIMEZONE_REQUIRED' using errcode='22023'; end if;
    begin
      period_from:=start_text::timestamptz;
      period_to:=end_text::timestamptz;
    exception when others then
      raise exception 'INVALID_PERIOD_TIMESTAMP' using errcode='22023';
    end;
    if period_to<=period_from then raise exception 'PERIOD_END_BEFORE_START' using errcode='22023'; end if;
    foreach field in array array['energy_kwh','output_units','operating_hours'] loop
      value:=(record_value->>field)::numeric;
      if value<0 or value>1000000000000
        then raise exception 'MEASUREMENT_OUT_OF_BOUNDS' using errcode='22023'; end if;
    end loop;
    foreach field in array array['operating_state','product_code','source_reference'] loop
      value_text:=record_value->>field;
      if length(value_text)<1 or length(value_text)>80 or
        value_text !~ '^[A-Za-z0-9][A-Za-z0-9._:/ -]*$'
        then raise exception 'UNSAFE_MEASUREMENT_REFERENCE' using errcode='22023'; end if;
    end loop;
  end loop;

  insert into public.synthetic_machine_evidence_batches
    (id,factory_id,asset_id,source_id,submitted_by,payload,payload_sha256)
  values (_id,_factory,_asset,_source,actor,_payload,fingerprint);

  insert into public.synthetic_machine_evidence_periods
    (batch_id,position,period_start,period_end,energy_kwh,output_units,operating_hours,
      operating_state,product_code,source_reference)
  select _id,x.ordinality,
      (x.value->>'period_start')::timestamptz,(x.value->>'period_end')::timestamptz,
      (x.value->>'energy_kwh')::numeric,(x.value->>'output_units')::numeric,
      (x.value->>'operating_hours')::numeric,x.value->>'operating_state',
      x.value->>'product_code',x.value->>'source_reference'
  from jsonb_array_elements(records) with ordinality as x(value,ordinality);

  if exists (
    select 1 from public.synthetic_machine_evidence_periods a
    join public.synthetic_machine_evidence_periods b on b.batch_id=a.batch_id
      and b.position>a.position
      and a.period_start < b.period_end and b.period_start < a.period_end
    where a.batch_id=_id
  ) then raise exception 'OVERLAPPING_MEASUREMENT_PERIODS' using errcode='22023'; end if;

  return jsonb_build_object('batchId',_id,'status','quarantined',
    'replayed',false,'periods',n);
end;
$function$;

create function public.link_synthetic_evidence_case(_case uuid,_batch uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
  actor uuid := auth.uid();
  case_factory bigint;
  batch_factory bigint;
  role_name text;
begin
  if current_setting('app.gridmind_synthetic_intake_mode',true) is distinct from 'isolated_fixture_only'
    then raise exception 'SYNTHETIC_INTAKE_DISABLED' using errcode='42501'; end if;
  if actor is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select factory_id into case_factory from public.investigation_cases
    where id=_case and origin='synthetic';
  select factory_id into batch_factory from public.synthetic_machine_evidence_batches
    where id=_batch and origin='synthetic' and status='quarantined';
  if case_factory is null or batch_factory is null or case_factory<>batch_factory
    then raise exception 'CASE_EVIDENCE_SCOPE_MISMATCH' using errcode='42501'; end if;
  role_name:=private.investigation_access(_case,actor);
  if role_name not in ('manager','investigator') or role_name is null
    then raise exception 'CASE_LINK_ACCESS_DENIED' using errcode='42501'; end if;
  insert into public.synthetic_machine_case_links(case_id,batch_id,linked_by)
  values(_case,_batch,actor) on conflict(case_id,batch_id) do nothing;
  return jsonb_build_object('caseId',_case,'batchId',_batch,
    'status','context_only_unverified');
end;
$function$;

revoke all on function public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)
  from public,anon,authenticated;
revoke all on function public.link_synthetic_evidence_case(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)
  to authenticated;
grant execute on function public.link_synthetic_evidence_case(uuid,uuid)
  to authenticated;

commit;

      then raise exception 'TIMEZONE_REQUIRED' using errcode='22023'; end if;
    begin
      period_from:=start_text::timestamptz;
      period_to:=end_text::timestamptz;
    exception when others then
      raise exception 'INVALID_PERIOD_TIMESTAMP' using errcode='22023';
    end;
    if period_to<=period_from then raise exception 'PERIOD_END_BEFORE_START' using errcode='22023'; end if;
    foreach field in array array['energy_kwh','output_units','operating_hours'] loop
      value:=(record_value->>field)::numeric;
      if value<0 or value>1000000000000
        then raise exception 'MEASUREMENT_OUT_OF_BOUNDS' using errcode='22023'; end if;
    end loop;
    foreach field in array array['operating_state','product_code','source_reference'] loop
      value_text:=record_value->>field;
      if length(value_text)<1 or length(value_text)>80 or
        value_text !~ '^[A-Za-z0-9][A-Za-z0-9._:/ -]*$'
        then raise exception 'UNSAFE_MEASUREMENT_REFERENCE' using errcode='22023'; end if;
    end loop;
  end loop;

  insert into public.synthetic_machine_evidence_batches
    (id,factory_id,asset_id,source_id,submitted_by,payload,payload_sha256)
  values (_id,_factory,_asset,_source,actor,_payload,fingerprint);

  insert into public.synthetic_machine_evidence_periods
    (batch_id,position,period_start,period_end,energy_kwh,output_units,operating_hours,
      operating_state,product_code,source_reference)
  select _id,x.ordinality,
      (x.value->>'period_start')::timestamptz,(x.value->>'period_end')::timestamptz,
      (x.value->>'energy_kwh')::numeric,(x.value->>'output_units')::numeric,
      (x.value->>'operating_hours')::numeric,x.value->>'operating_state',
      x.value->>'product_code',x.value->>'source_reference'
  from jsonb_array_elements(records) with ordinality as x(value,ordinality);

  if exists (
    select 1 from public.synthetic_machine_evidence_periods a
    join public.synthetic_machine_evidence_periods b on b.batch_id=a.batch_id
      and b.position>a.position
      and a.period_start < b.period_end and b.period_start < a.period_end
    where a.batch_id=_id
  ) then raise exception 'OVERLAPPING_MEASUREMENT_PERIODS' using errcode='22023'; end if;

  return jsonb_build_object('batchId',_id,'status','quarantined',
    'replayed',false,'periods',n);
end;
$function$;

create function public.link_synthetic_evidence_case(_case uuid,_batch uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
  actor uuid := auth.uid();
  case_factory bigint;
  batch_factory bigint;
  role_name text;
begin
  if current_setting('app.gridmind_synthetic_intake_mode',true) is distinct from 'isolated_fixture_only'
    then raise exception 'SYNTHETIC_INTAKE_DISABLED' using errcode='42501'; end if;
  if actor is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select factory_id into case_factory from public.investigation_cases
    where id=_case and origin='synthetic';
  select factory_id into batch_factory from public.synthetic_machine_evidence_batches
    where id=_batch and origin='synthetic' and status='quarantined';
  if case_factory is null or batch_factory is null or case_factory<>batch_factory
    then raise exception 'CASE_EVIDENCE_SCOPE_MISMATCH' using errcode='42501'; end if;
  role_name:=private.investigation_access(_case,actor);
  if role_name not in ('manager','investigator') or role_name is null
    then raise exception 'CASE_LINK_ACCESS_DENIED' using errcode='42501'; end if;
  insert into public.synthetic_machine_case_links(case_id,batch_id,linked_by)
  values(_case,_batch,actor) on conflict(case_id,batch_id) do nothing;
  return jsonb_build_object('caseId',_case,'batchId',_batch,
    'status','context_only_unverified');
end;
$function$;

revoke all on function public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)
  from public,anon,authenticated;
revoke all on function public.link_synthetic_evidence_case(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)
  to authenticated;
grant execute on function public.link_synthetic_evidence_case(uuid,uuid)
  to authenticated;

commit;
