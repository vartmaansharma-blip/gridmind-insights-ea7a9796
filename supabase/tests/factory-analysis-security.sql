-- Isolated acceptance test for the factory-analysis table and tenant boundary.
-- Run only against the ephemeral local Supabase database after a clean migration replay.
begin;

do $$
declare
  user_a constant uuid := 'a1111111-1111-4111-8111-111111111111';
  user_b constant uuid := 'b2222222-2222-4222-8222-222222222222';
  org_a bigint;
  org_b bigint;
  factory_a bigint;
  factory_b bigint;
  asset_a bigint;
begin
  insert into auth.users (id, aud, role, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    (user_a, 'authenticated', 'authenticated', 'gridmind-ci-a@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb),
    (user_b, 'authenticated', 'authenticated', 'gridmind-ci-b@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb);

  insert into public.organizations (name) values ('gridmind-ci-org-a') returning id into org_a;
  insert into public.organizations (name) values ('gridmind-ci-org-b') returning id into org_b;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (org_a, user_a, 'owner', 'active'), (org_b, user_b, 'owner', 'active');

  insert into public.factories (organization_id, name)
  values (org_a, 'gridmind-ci-factory-a') returning id into factory_a;
  insert into public.factories (organization_id, name)
  values (org_b, 'gridmind-ci-factory-b') returning id into factory_b;
  insert into public.factory_assets (factory_id, name)
  values (factory_a, 'gridmind-ci-asset-a') returning id into asset_a;

  insert into public.factory_members (factory_id, user_id, organization_id, role)
  values (factory_a, user_a, org_a, 'owner'), (factory_b, user_b, org_b, 'owner');
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

do $$
declare
  visible_factories integer;
begin
  select count(*) into visible_factories
  from public.factories
  where name like 'gridmind-ci-factory-%';

  if visible_factories <> 1 then
    raise exception 'TENANT_ISOLATION_FAILED: user A sees % test factories, expected exactly one', visible_factories;
  end if;

  if has_table_privilege(current_user, 'public.factory_analysis_runs', 'select')
    or has_table_privilege(current_user, 'public.factory_analysis_runs', 'insert')
    or has_table_privilege('anon', 'public.factory_analysis_runs', 'select')
    or has_table_privilege('anon', 'public.factory_analysis_runs', 'insert') then
    raise exception 'DIRECT_TABLE_ACCESS_NOT_REVOKED';
  end if;

  if not has_table_privilege('service_role', 'public.factory_analysis_runs', 'select')
    or not has_table_privilege('service_role', 'public.factory_analysis_runs', 'insert')
    or has_table_privilege('service_role', 'public.factory_analysis_runs', 'update')
    or has_table_privilege('service_role', 'public.factory_analysis_runs', 'delete')
    or has_table_privilege('service_role', 'public.factory_analysis_runs', 'truncate')
    or has_table_privilege('service_role', 'public.factory_analysis_runs', 'references')
    or has_table_privilege('service_role', 'public.factory_analysis_runs', 'trigger')
    or has_table_privilege('service_role', 'public.factory_analysis_runs', 'maintain') then
    raise exception 'SERVICE_ROLE_GRANTS_ARE_NOT_LEAST_PRIVILEGE';
  end if;

  if not has_sequence_privilege('service_role', 'public.factory_analysis_runs_id_seq', 'usage')
    or not has_sequence_privilege('service_role', 'public.factory_analysis_runs_id_seq', 'select')
    or has_sequence_privilege('service_role', 'public.factory_analysis_runs_id_seq', 'update') then
    raise exception 'ANALYSIS_RUN_SEQUENCE_GRANTS_ARE_NOT_LEAST_PRIVILEGE';
  end if;

  if not (select relrowsecurity from pg_class where oid = 'public.factory_analysis_runs'::regclass) then
    raise exception 'ANALYSIS_RUN_TABLE_RLS_IS_DISABLED';
  end if;

  begin
    execute 'select count(*) from public.factory_analysis_runs';
    raise exception 'DIRECT_SELECT_WAS_ALLOWED';
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute $statement$
      insert into public.factory_analysis_runs
        (factory_id, asset_id, idempotency_key, algorithm_version, input_snapshot, result,
         result_fingerprint, analysis_status, refusal_codes, created_by)
      values
        (1, 1, 'gridmind-ci-forbidden', 'test-v1', '{"factoryId":1}',
         '{"factoryId":1,"status":"insufficient_evidence","algorithmVersion":"test-v1","reasonCodes":[]}',
         'test-fingerprint', 'insufficient_evidence', '[]', 'a1111111-1111-4111-8111-111111111111')
    $statement$;
    raise exception 'DIRECT_INSERT_WAS_ALLOWED';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

do $$
declare
  factory_a bigint;
  factory_b bigint;
  asset_a bigint;
  run_id bigint;
  trigger_message text;
begin
  select id into strict factory_a from public.factories where name = 'gridmind-ci-factory-a';
  select id into strict factory_b from public.factories where name = 'gridmind-ci-factory-b';
  select id into strict asset_a from public.factory_assets where name = 'gridmind-ci-asset-a';

  insert into public.factory_analysis_runs
    (factory_id, asset_id, idempotency_key, algorithm_version, input_snapshot, result,
     result_fingerprint, analysis_status, refusal_codes, created_by)
  values
    (factory_a, asset_a, 'gridmind-ci-append-only', 'test-v1', jsonb_build_object('factoryId', factory_a, 'current', jsonb_build_object('assetId', asset_a::text)),
     jsonb_build_object('factoryId', factory_a, 'status', 'insufficient_evidence',
                        'algorithmVersion', 'test-v1', 'reasonCodes', '[]'::jsonb),
     'test-fingerprint', 'insufficient_evidence', '[]'::jsonb,
     'a1111111-1111-4111-8111-111111111111')
  returning id into run_id;

  begin
    insert into public.factory_analysis_runs
      (factory_id, asset_id, idempotency_key, algorithm_version, input_snapshot, result,
       result_fingerprint, analysis_status, refusal_codes, created_by)
    values
      (factory_b, asset_a, 'gridmind-ci-cross-factory', 'test-v1',
       jsonb_build_object('factoryId', factory_b, 'current', jsonb_build_object('assetId', asset_a::text)),
       jsonb_build_object('factoryId', factory_b, 'status', 'insufficient_evidence',
                          'algorithmVersion', 'test-v1', 'reasonCodes', '[]'::jsonb),
       'test-fingerprint', 'insufficient_evidence', '[]'::jsonb,
       'a1111111-1111-4111-8111-111111111111');
    raise exception 'CROSS_FACTORY_ASSET_BINDING_WAS_ALLOWED';
  exception
    when foreign_key_violation then null;
  end;

  begin
    insert into public.factory_analysis_runs
      (factory_id, asset_id, idempotency_key, algorithm_version, input_snapshot, result,
       result_fingerprint, analysis_status, refusal_codes, created_by)
    values
      (factory_a, asset_a, 'gridmind-ci-append-only', 'test-v1', jsonb_build_object('factoryId', factory_a, 'current', jsonb_build_object('assetId', asset_a::text)),
       jsonb_build_object('factoryId', factory_a, 'status', 'insufficient_evidence',
                          'algorithmVersion', 'test-v1', 'reasonCodes', '[]'::jsonb),
       'test-fingerprint', 'insufficient_evidence', '[]'::jsonb,
       'a1111111-1111-4111-8111-111111111111');
    raise exception 'IDEMPOTENCY_UNIQUE_CONSTRAINT_DID_NOT_BLOCK_DUPLICATE';
  exception
    when unique_violation then null;
  end;

  begin
    update public.factory_analysis_runs
      set result_fingerprint = 'mutated'
      where id = run_id;
    raise exception 'APPEND_ONLY_TRIGGER_DID_NOT_BLOCK_UPDATE';
  exception
    when raise_exception then
      get stacked diagnostics trigger_message = message_text;
      if trigger_message <> 'FACTORY_ANALYSIS_RUNS_ARE_APPEND_ONLY' then
        raise;
      end if;
  end;

  begin
    delete from public.factory_analysis_runs where id = run_id;
    raise exception 'APPEND_ONLY_TRIGGER_DID_NOT_BLOCK_DELETE';
  exception
    when raise_exception then
      get stacked diagnostics trigger_message = message_text;
      if trigger_message <> 'FACTORY_ANALYSIS_RUNS_ARE_APPEND_ONLY' then
        raise;
      end if;
  end;
end;
$$;

rollback;
