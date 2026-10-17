-- Runs only in disposable local Supabase AFTER the Edge Function has generated an
-- immutable persisted analysis run from synthetic canonical fixtures.
begin;
select id::text as a_user from auth.users where email='gridmind-http-a@example.test' \gset
select id::text as b_user from auth.users where email='gridmind-http-b@example.test' \gset
select id as a_factory from public.factories where name='gridmind-http-factory-a' \gset
select id as b_factory from public.factories where name='gridmind-http-factory-b' \gset
select id as test_run from public.factory_analysis_runs
  where factory_id=:'a_factory'::bigint and idempotency_key='integration-single-run' \gset

do $$
begin
  if not exists(select 1 from pg_class where oid='public.synthetic_case_analysis_references'::regclass and relrowsecurity)
    then raise exception 'CASE_ANALYSIS_LINK_RLS_OFF'; end if;
  if has_table_privilege('anon','public.synthetic_case_analysis_references','select')
     or has_table_privilege('authenticated','public.synthetic_case_analysis_references','insert')
     or has_table_privilege('authenticated','public.synthetic_case_analysis_references','update')
     or has_table_privilege('authenticated','public.synthetic_case_analysis_references','delete')
    then raise exception 'CASE_ANALYSIS_DIRECT_PERMISSION_LEAK'; end if;
  if has_function_privilege('anon','public.link_synthetic_case_analysis(uuid,bigint)','execute')
     or has_function_privilege('anon','public.synthetic_case_analysis_summary(uuid)','execute')
    then raise exception 'CASE_ANALYSIS_ANON_EXECUTE_LEAK'; end if;
end $$;
insert into public.investigation_cases(id,factory_id,last_editor,created_by)
values
 ('d0000000-0000-4000-8000-000000000071',:'a_factory'::bigint,:'a_user'::uuid,:'a_user'::uuid),
 ('d0000000-0000-4000-8000-000000000072',:'b_factory'::bigint,:'b_user'::uuid,:'b_user'::uuid);
select set_config('app.case_analysis_test_run',:'test_run',true);
select set_config('request.jwt.claim.sub',:'a_user',true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',:'a_user','role','authenticated')::text,true);
set local role authenticated;
do $$
declare
  run_id bigint := current_setting('app.case_analysis_test_run')::bigint;
  result jsonb;
  summary jsonb;
begin
  begin
    perform public.link_synthetic_case_analysis('d0000000-0000-4000-8000-000000000071',run_id);
    raise exception 'CASE_LINK_DEFAULT_GATE_BYPASSED';
  exception when insufficient_privilege then
    if sqlerrm <> 'SYNTHETIC_ANALYSIS_LINK_DISABLED' then raise; end if;
  end;
  perform set_config('app.gridmind_synthetic_analysis_link_mode','isolated_fixture_only',true);
  result:=public.link_synthetic_case_analysis('d0000000-0000-4000-8000-000000000071',run_id);
  if result->>'status'<>'synthetic_unreviewed_reference' or result->>'replayed'<>'false'
    then raise exception 'CASE_LINK_NOT_UNREVIEWED'; end if;
  result:=public.link_synthetic_case_analysis('d0000000-0000-4000-8000-000000000071',run_id);
  if result->>'replayed'<>'true' then raise exception 'CASE_ANALYSIS_RETRY_NOT_IDEMPOTENT'; end if;
  if (select count(*) from public.synthetic_case_analysis_references)<>1
    then raise exception 'CASE_ANALYSIS_LINK_DUPLICATED'; end if;
  summary:=public.synthetic_case_analysis_summary('d0000000-0000-4000-8000-000000000071');
  if jsonb_array_length(summary->'references')<>1
     or summary->>'qualifiedReview'<>'false'
     or summary->'references'->0->>'customerDeliveryApproved'<>'false'
     or summary->'references'->0 ? 'input_snapshot'
     or summary->'references'->0 ? 'economics'
    then raise exception 'SUMMARY_LEAKS_UNREVIEWED_ANALYSIS_OR_FALSE_APPROVAL'; end if;
  begin
    insert into public.synthetic_case_analysis_references
      (case_id,run_id,factory_id,asset_id,linked_by,result_fingerprint)
    select 'd0000000-0000-4000-8000-000000000072',id,factory_id,asset_id,
      auth.uid(),result_fingerprint
      from public.factory_analysis_runs where id=run_id;
    raise exception 'DIRECT_CASE_RUN_REFERENCE_WRITE_ALLOWED';
  exception when insufficient_privilege then null; end;
  begin
    perform public.link_synthetic_case_analysis('d0000000-0000-4000-8000-000000000072',run_id);
    raise exception 'CROSS_FACTORY_CASE_RUN_LINK_ACCEPTED';
  exception when insufficient_privilege then
    if sqlerrm<>'CASE_ANALYSIS_FACTORY_MISMATCH' then raise; end if;
  end;
  begin
    update public.synthetic_case_analysis_references as linked set status='synthetic_unreviewed_reference'
      where linked.run_id=run_id;
    raise exception 'IMMUTABLE_CASE_RUN_REFERENCE_WAS_UPDATED';
  exception when insufficient_privilege then null; end;
end $$;
-- Tenant B cannot read links, nor read the other factory's case summary.
select set_config('request.jwt.claim.sub',:'b_user',true);
select set_config('request.jwt.claims',
  jsonb_build_object('sub',:'b_user','role','authenticated')::text,true);
do $$
declare
  run_id bigint := current_setting('app.case_analysis_test_run')::bigint;
begin
  if (select count(*) from public.synthetic_case_analysis_references)<>0
    then raise exception 'CROSS_FACTORY_CASE_LINK_READ_ALLOWED'; end if;
  begin
    perform public.synthetic_case_analysis_summary('d0000000-0000-4000-8000-000000000071');
    raise exception 'CROSS_FACTORY_CASE_SUMMARY_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'CASE_ANALYSIS_READ_DENIED' then raise; end if;
  end;
  begin
    perform public.link_synthetic_case_analysis('d0000000-0000-4000-8000-000000000071',run_id);
    raise exception 'CROSS_FACTORY_LINK_ACTOR_ALLOWED';
  exception when insufficient_privilege then
    if sqlerrm<>'CASE_ANALYSIS_LINK_DENIED' then raise; end if;
  end;
end $$;
rollback;
