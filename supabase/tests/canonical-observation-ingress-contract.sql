-- Isolated acceptance only. Runs after disposable Auth/factory fixtures, rolls back.
begin;
do $$
begin
  if not exists (select 1 from pg_trigger
     where tgrelid='public.observations'::regclass
       and tgname='guard_canonical_observation_ingress' and tgenabled='O')
    then raise exception 'CANONICAL_SOURCE_GUARD_MISSING'; end if;
  if has_table_privilege('authenticated','public.observations','update')
    or has_table_privilege('authenticated','public.observations','delete')
    or has_table_privilege('anon','public.observations','insert')
    then raise exception 'CANONICAL_MUTATION_PRIVILEGE_LEAK'; end if;
end $$;

select id::text as user_a from auth.users where email='gridmind-http-a@example.test' \gset
select id as factory_a from public.factories where name='gridmind-http-factory-a' \gset
select id as factory_b from public.factories where name='gridmind-http-factory-b' \gset
select id as asset_a from public.factory_assets where name='gridmind-http-asset-a' \gset
select id as asset_b from public.factory_assets where name='gridmind-http-asset-b' \gset

insert into public.data_sources(factory_id,name,source_type)
values (:'factory_a'::bigint,'ci-observation-guard-source-a','manual');
select id as source_a from public.data_sources where name='ci-observation-guard-source-a' \gset
insert into public.data_sources(factory_id,name,source_type)
values (:'factory_b'::bigint,'ci-observation-guard-source-b','manual');
select id as source_b from public.data_sources where name='ci-observation-guard-source-b' \gset

select set_config('app.ci_fact_a',:'factory_a',true);
select set_config('app.ci_fact_b',:'factory_b',true);
select set_config('app.ci_asset_a',:'asset_a',true);
select set_config('app.ci_asset_b',:'asset_b',true);
select set_config('app.ci_source_a',:'source_a',true);
select set_config('app.ci_source_b',:'source_b',true);
select set_config('request.jwt.claim.sub',:'user_a',true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',:'user_a','role','authenticated')::text,true);
set local role authenticated;

do $$
declare
  fa bigint := current_setting('app.ci_fact_a')::bigint;
  fb bigint := current_setting('app.ci_fact_b')::bigint;
  aa bigint := current_setting('app.ci_asset_a')::bigint;
  ab bigint := current_setting('app.ci_asset_b')::bigint;
  sa bigint := current_setting('app.ci_source_a')::bigint;
  sb bigint := current_setting('app.ci_source_b')::bigint;
begin
  -- Existing normal manual-entry workflow remains possible, but strictly unverified.
  insert into public.observations
   (factory_id,subject_type,subject_id,metric,value_numeric,unit,observed_at,quality_status,data_source_id)
  values(fa,'factory',fa,'ci_energy_kwh',0,'kWh','2026-10-01T00:00:00Z','unverified',sa);
  if (select count(*) from public.observations o
      where o.metric='ci_energy_kwh' and o.value_numeric=0 and o.quality_status='unverified')<>1
    then raise exception 'MANUAL_UNVERIFIED_OR_ZERO_READING_REJECTED'; end if;

  begin
    insert into public.observations
     (factory_id,subject_type,subject_id,metric,value_numeric,unit,observed_at,quality_status,data_source_id)
    values(fa,'asset',aa,'ci_unreviewed_valid',200,'kWh','2026-10-01T00:00:00Z','valid',sa);
    raise exception 'AUTHENTICATED_USER_SELF_VALIDATED_READING';
  exception when insufficient_privilege then
    if sqlerrm<>'CANONICAL_VALIDATION_REQUIRES_QUALIFIED_REVIEW' then raise; end if;
  end;

  begin
    insert into public.observations
     (factory_id,subject_type,subject_id,metric,value_numeric,unit,observed_at,quality_status,data_source_id)
    values(fa,'asset',aa,'ci_cross_source',200,'kWh','2026-10-01T00:00:00Z','unverified',sb);
    raise exception 'CROSS_FACTORY_SOURCE_SPOOFING_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'DATA_SOURCE_FACTORY_MISMATCH' then raise; end if;
  end;
  begin
    insert into public.observations
     (factory_id,subject_type,subject_id,metric,value_numeric,unit,observed_at,quality_status,data_source_id)
    values(fa,'asset',ab,'ci_cross_asset',200,'kWh','2026-10-01T00:00:00Z','unverified',sa);
    raise exception 'CROSS_FACTORY_ASSET_SPOOFING_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'ASSET_OBSERVATION_SCOPE_MISMATCH' then raise; end if;
  end;
  begin
    insert into public.observations
     (factory_id,subject_type,subject_id,metric,value_numeric,unit,observed_at,quality_status,data_source_id)
    values(fa,'factory',fb,'ci_cross_factory_subject',200,'kWh','2026-10-01T00:00:00Z','unverified',sa);
    raise exception 'FACTORY_SUBJECT_SCOPE_SPOOFING_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'FACTORY_OBSERVATION_SCOPE_MISMATCH' then raise; end if;
  end;

  begin
    update public.observations set quality_status='valid' where metric='ci_energy_kwh';
    raise exception 'CLIENT_ALTERED_CANONICAL_HISTORY';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
