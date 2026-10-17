-- SQL integration contract; run AFTER local Auth + factory-analysis-integration-setup fixtures.
-- Entire transaction rolls back; never execute this test against production.
begin;
-- Check least-privilege table and function security before creating fixtures.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'synthetic_machine_evidence_batches','synthetic_machine_evidence_periods','synthetic_machine_case_links'
  ] loop
    if not exists(select 1 from pg_class where oid=('public.'||table_name)::regclass and relrowsecurity)
      then raise exception 'RLS_OFF_%',table_name; end if;
    if has_table_privilege('anon','public.'||table_name,'select')
      or has_table_privilege('authenticated','public.'||table_name,'insert')
      or has_table_privilege('authenticated','public.'||table_name,'update')
      or has_table_privilege('authenticated','public.'||table_name,'delete')
      or not has_table_privilege('authenticated','public.'||table_name,'select')
      then raise exception 'MACHINE_INTAKE_PERMISSION_DRIFT_%',table_name; end if;
  end loop;
  if has_function_privilege('anon','public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)','execute')
    or not has_function_privilege('authenticated','public.stage_synthetic_machine_evidence(bigint,bigint,bigint,uuid,jsonb)','execute')
    then raise exception 'MACHINE_INTAKE_FUNCTION_GRANTS_INVALID'; end if;
end $$;
-- The users and assets are disposable local fixtures already created by the existing suite.
select id::text as a_user from auth.users where email='gridmind-http-a@example.test' \gset
select id::text as b_user from auth.users where email='gridmind-http-b@example.test' \gset
select f.id as a_factory from public.factories f where f.name='gridmind-http-factory-a' \gset
select f.id as b_factory from public.factories f where f.name='gridmind-http-factory-b' \gset
select a.id as a_asset from public.factory_assets a where a.name='gridmind-http-asset-a' \gset
select a.id as b_asset from public.factory_assets a where a.name='gridmind-http-asset-b' \gset

insert into public.data_sources(factory_id,name,source_type)
values (:'a_factory'::bigint,'synthetic-ci-meter-a','manual');
select id as a_source from public.data_sources where name='synthetic-ci-meter-a' \gset
insert into public.data_source_mappings(data_source_id,factory_id,asset_id,source_field,canonical_metric,mapping_status,unit)
values (:'a_source'::bigint,:'a_factory'::bigint,:'a_asset'::bigint,'energy_kwh','energy_consumption_kwh','candidate','kWh');

insert into public.data_sources(factory_id,name,source_type)
values (:'b_factory'::bigint,'synthetic-ci-meter-b','manual');
select id as b_source from public.data_sources where name='synthetic-ci-meter-b' \gset
insert into public.data_source_mappings(data_source_id,factory_id,asset_id,source_field,canonical_metric,mapping_status,unit)
values (:'b_source'::bigint,:'b_factory'::bigint,:'b_asset'::bigint,'energy_kwh','energy_consumption_kwh','candidate','kWh');

insert into public.investigation_cases(id,factory_id,last_editor,created_by)
values
 ('d0000000-0000-4000-8000-000000000001',:'a_factory'::bigint,:'a_user'::uuid,:'a_user'::uuid),
 ('d0000000-0000-4000-8000-000000000002',:'b_factory'::bigint,:'b_user'::uuid,:'b_user'::uuid);

select set_config('app.gridmind_test_a_factory',:'a_factory',true);
select set_config('app.gridmind_test_b_factory',:'b_factory',true);
select set_config('app.gridmind_test_a_asset',:'a_asset',true);
select set_config('app.gridmind_test_b_asset',:'b_asset',true);
select set_config('app.gridmind_test_a_source',:'a_source',true);
select set_config('app.gridmind_test_b_source',:'b_source',true);
select set_config('request.jwt.claim.sub',:'a_user',true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',:'a_user','role','authenticated')::text,true);

set local role authenticated;

do $$
declare
  f_a bigint := current_setting('app.gridmind_test_a_factory')::bigint;
  a_a bigint := current_setting('app.gridmind_test_a_asset')::bigint;
  src_a bigint := current_setting('app.gridmind_test_a_source')::bigint;
  f_b bigint := current_setting('app.gridmind_test_b_factory')::bigint;
  a_b bigint := current_setting('app.gridmind_test_b_asset')::bigint;
  src_b bigint := current_setting('app.gridmind_test_b_source')::bigint;
  sample jsonb;
  response jsonb;
  original_count integer;
begin
  sample:=jsonb_build_object('origin','synthetic','periods',jsonb_build_array(
    jsonb_build_object(
      'period_start','2026-09-01T00:00:00+05:30','period_end','2026-09-02T00:00:00+05:30',
      'energy_kwh',900,'output_units',0,'operating_hours',8,
      'operating_state','stopped','product_code','SKU-DEMO','source_reference','TEST-ROW-01'
    ),
    jsonb_build_object(
      'period_start','2026-09-02T00:00:00+05:30','period_end','2026-09-03T00:00:00+05:30',
      'energy_kwh',910,'output_units',100,'operating_hours',8,
      'operating_state','running','product_code','SKU-DEMO','source_reference','TEST-ROW-02'
    )
  ));
  -- Feature is off without an explicitly isolated/local transaction flag.
  begin
    perform public.stage_synthetic_machine_evidence(
      f_a,a_a,src_a,'c0000000-0000-4000-8000-000000000001',sample);
    raise exception 'INTAKE_SHOULD_BE_DISABLED_BY_DEFAULT';
  exception when insufficient_privilege then
    if sqlerrm <> 'SYNTHETIC_INTAKE_DISABLED' then raise; end if;
  end;

  perform set_config('app.gridmind_synthetic_intake_mode','isolated_fixture_only',true);
  response:=public.stage_synthetic_machine_evidence(f_a,a_a,src_a,
    'c0000000-0000-4000-8000-000000000001',sample);
  if response->>'status'<>'quarantined' or response->>'replayed'<>'false'
    then raise exception 'INTAKE_NOT_QUARANTINED'; end if;
  response:=public.stage_synthetic_machine_evidence(f_a,a_a,src_a,
    'c0000000-0000-4000-8000-000000000001',sample);
  if response->>'replayed'<>'true' then raise exception 'RETRY_NOT_IDEMPOTENT'; end if;
  select count(*) into original_count from public.synthetic_machine_evidence_periods
    where batch_id='c0000000-0000-4000-8000-000000000001';
  if original_count<>2 then raise exception 'DUPLICATED_MEASUREMENT_ROWS_%',original_count; end if;
  if (select output_units from public.synthetic_machine_evidence_periods
    where batch_id='c0000000-0000-4000-8000-000000000001' and position=1)<>0
    then raise exception 'REAL_ZERO_WAS_DISCARDED'; end if;
  if (select comparable_numeric_candidate from public.synthetic_machine_evidence_periods
    where batch_id='c0000000-0000-4000-8000-000000000001' and position=1)
    then raise exception 'ZERO_OUTPUT_FALSELY_MARKED_COMPARABLE'; end if;
  if (select count(*) from public.observations o
    where o.data_source_id=src_a)>0 then raise exception 'STAGING_WROTE_CANONICAL_OBSERVATIONS'; end if;

  begin
    perform public.stage_synthetic_machine_evidence(f_a,a_a,src_a,
      'c0000000-0000-4000-8000-000000000001',jsonb_set(sample,'{periods,0,energy_kwh}','901'::jsonb));
    raise exception 'CONFLICTING_RETRY_WAS_ACCEPTED';
  exception when serialization_failure then
    if sqlerrm<>'IDEMPOTENCY_CONFLICT' then raise; end if;
  end;

  begin
    perform public.stage_synthetic_machine_evidence(f_b,a_b,src_b,
      'c0000000-0000-4000-8000-000000000003',sample);
    raise exception 'CROSS_TENANT_STAGING_WAS_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'STAFF_FACTORY_ACCESS_DENIED' then raise; end if;
  end;
  begin
    perform public.stage_synthetic_machine_evidence(f_a,a_b,src_a,
      'c0000000-0000-4000-8000-000000000004',sample);
    raise exception 'CROSS_ASSET_MAPPING_WAS_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'SOURCE_NOT_MAPPED_TO_ASSET' then raise; end if;
  end;
  begin
    perform public.stage_synthetic_machine_evidence(f_a,a_a,src_a,
      'c0000000-0000-4000-8000-000000000005',
       jsonb_set(sample,'{periods,1,period_start}','"2026-09-01T08:00:00+05:30"'::jsonb));
    raise exception 'OVERLAPPING_PERIODS_WERE_ACCEPTED';
  exception when invalid_parameter_value then
    if sqlerrm<>'OVERLAPPING_MEASUREMENT_PERIODS' then raise; end if;
  end;

  begin
    insert into public.synthetic_machine_evidence_batches
      (id,factory_id,asset_id,source_id,submitted_by,payload,payload_sha256)
    values ('c0000000-0000-4000-8000-000000000011',f_a,a_a,src_a,auth.uid(),sample,
            repeat('0',64));
    raise exception 'DIRECT_SYNTHETIC_TABLE_INSERT_ALLOWED';
  exception when insufficient_privilege then null;
  end;

  -- Link to same-tenant synthetic investigation as **unverified context only**.
  response:=public.link_synthetic_evidence_case(
    'd0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001');
  if response->>'status'<>'context_only_unverified'
    then raise exception 'CASE_LINK_WRONGLY_VERIFIED'; end if;
  response:=public.link_synthetic_evidence_case(
    'd0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001');
  if (select count(*) from public.synthetic_machine_case_links)=0
    then raise exception 'EXPECTED_SYNTHETIC_CASE_LINK'; end if;
  if (select count(*) from public.synthetic_machine_case_links)<>1
    then raise exception 'CASE_LINK_RETRY_DUPLICATED'; end if;
  begin
    perform public.link_synthetic_evidence_case(
      'd0000000-0000-4000-8000-000000000002',
      'c0000000-0000-4000-8000-000000000001');
    raise exception 'CROSS_TENANT_CASE_LINK_WAS_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'CASE_EVIDENCE_SCOPE_MISMATCH' then raise; end if;
  end;
end;
$$;

rollback;
