-- Assert the canonical analysis persistence contract after a clean migration replay.
-- Local/CI only. Catalog checks are read-only; electricity fixtures below roll back.
do $$
declare
  v_rls boolean;
  v_read_policy boolean;
  v_insert_policy boolean;
  v_append_only_trigger boolean;
  v_input_digest_nullable boolean;
  v_input_digest_constraint boolean;
begin
  if to_regclass('public.factory_analysis_runs') is null then
    raise exception 'MISSING_SCHEMA_CONTRACT: public.factory_analysis_runs';
  end if;

  select c.relrowsecurity into v_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'factory_analysis_runs';

  if coalesce(v_rls, false) is not true then
    raise exception 'MISSING_SCHEMA_CONTRACT: RLS must be enabled on factory_analysis_runs';
  end if;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'factory_analysis_runs'
      and policyname = 'active factory members read analysis runs'
      and cmd = 'SELECT'
  ) into v_read_policy;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'factory_analysis_runs'
      and policyname = 'active factory members insert analysis runs'
      and cmd = 'INSERT'
  ) into v_insert_policy;

  if not v_read_policy or not v_insert_policy then
    raise exception 'MISSING_SCHEMA_CONTRACT: expected member-scoped read and insert policies';
  end if;

  select exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'factory_analysis_runs'
      and t.tgname = 'factory_analysis_runs_append_only'
      and not t.tgisinternal
  ) into v_append_only_trigger;

  if not v_append_only_trigger then
    raise exception 'MISSING_SCHEMA_CONTRACT: append-only trigger is absent';
  end if;

  select is_nullable = 'YES' into v_input_digest_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'factory_analysis_runs'
    and column_name = 'input_snapshot_sha256';

  if coalesce(v_input_digest_nullable, false) is not true then
    raise exception 'MISSING_SCHEMA_CONTRACT: historical input snapshot digest must remain nullable';
  end if;

  select exists (
    select 1 from pg_constraint
    where conrelid = 'public.factory_analysis_runs'::regclass
      and conname = 'factory_analysis_runs_input_snapshot_sha256_format'
  ) into v_input_digest_constraint;

  if not v_input_digest_constraint then
    raise exception 'MISSING_SCHEMA_CONTRACT: SHA-256 digest format constraint is absent';
  end if;

  if has_table_privilege('anon', 'public.factory_analysis_runs', 'SELECT')
     or has_table_privilege('anon', 'public.factory_analysis_runs', 'INSERT')
     or has_table_privilege('authenticated', 'public.factory_analysis_runs', 'INSERT') then
    raise exception 'MISSING_SCHEMA_CONTRACT: browser roles must not directly read/insert analysis runs';
  end if;

  if not has_table_privilege('service_role', 'public.factory_analysis_runs', 'SELECT')
     or not has_table_privilege('service_role', 'public.factory_analysis_runs', 'INSERT') then
    raise exception 'MISSING_SCHEMA_CONTRACT: service_role must be able to select/insert analysis runs';
  end if;
end $$;

select 'factory_analysis_runs schema contract: PASS' as result;

-- The existing migration-replay CI entry point also protects the synthetic case
-- contract. This asserts permissions/catalog structure, not live Auth acceptance.
do $$
declare
  relation text;
  fn regprocedure := 'public.investigation_store(uuid,text,uuid,bigint,integer,text,text,jsonb,jsonb)'::regprocedure;
  internal_fn regprocedure := 'private.investigation_store(uuid,text,uuid,bigint,integer,text,text,jsonb,jsonb)'::regprocedure;
begin
  foreach relation in array array['investigation_cases','investigation_assignments','investigation_revisions'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || relation)::regclass) then
      raise exception 'CASE_SCHEMA_CONTRACT: RLS absent on %', relation;
    end if;
    if has_table_privilege('anon','public.' || relation,'SELECT')
       or has_table_privilege('authenticated','public.' || relation,'INSERT,UPDATE,DELETE,TRUNCATE')
       or has_table_privilege('service_role','public.' || relation,'INSERT,UPDATE,DELETE,TRUNCATE') then
      raise exception 'CASE_SCHEMA_CONTRACT: unexpected direct grants on %', relation;
    end if;
  end loop;
  if has_function_privilege('anon',fn,'EXECUTE')
     or has_function_privilege('authenticated',fn,'EXECUTE')
     or has_function_privilege('authenticated',internal_fn,'EXECUTE')
     or not has_function_privilege('service_role',fn,'EXECUTE') then
    raise exception 'CASE_SCHEMA_CONTRACT: actor-bearing RPC must be server-only';
  end if;
  if (select prosecdef from pg_proc where oid=fn)
     or not (select prosecdef from pg_proc where oid=internal_fn)
     or not (select proconfig @> array['search_path=""'] from pg_proc where oid=internal_fn) then
    raise exception 'CASE_SCHEMA_CONTRACT: invoker wrapper or pinned definer changed';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='public.investigation_revisions'::regclass
    and tgname='investigation_revisions_immutable' and not tgisinternal) then
    raise exception 'CASE_SCHEMA_CONTRACT: immutable revision trigger absent';
  end if;
end $$;
select 'synthetic investigation schema/security contract: PASS' as result;

-- Customer workflow tables never grant broad operational/factory access.
do $$
declare relation text;
 fn regprocedure := 'public.portal_store(uuid,text,jsonb)'::regprocedure;
 internal_fn regprocedure := 'private.portal_store(uuid,text,jsonb)'::regprocedure;
begin
 foreach relation in array array['case_customers','case_intake','case_communications','case_publications'] loop
  if not (select relrowsecurity from pg_class where oid=('public.'||relation)::regclass)
   or has_table_privilege('anon','public.'||relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
   or has_table_privilege('authenticated','public.'||relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
   or has_table_privilege('service_role','public.'||relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') then
   raise exception 'PORTAL_SCHEMA_CONTRACT: unexpected direct access on %',relation;
  end if;
 end loop;
 if has_function_privilege('anon',fn,'EXECUTE') or has_function_privilege('authenticated',fn,'EXECUTE')
  or has_function_privilege('authenticated',internal_fn,'EXECUTE')
  or not has_function_privilege('service_role',fn,'EXECUTE')
  or (select prosecdef from pg_proc where oid=fn)
  or not (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid=internal_fn) then
  raise exception 'PORTAL_SCHEMA_CONTRACT: server-only wrapper or pinned definer changed';
 end if;
 foreach relation in array array['case_communications','case_publications'] loop
  if not exists(select 1 from pg_trigger where tgrelid=('public.'||relation)::regclass
   and tgfoid='private.investigation_revision_immutable()'::regprocedure and not tgisinternal) then
   raise exception 'PORTAL_SCHEMA_CONTRACT: immutable record trigger absent on %',relation;
  end if;
 end loop;
end $$;
select 'customer portal schema/security contract: PASS' as result;

-- Electricity case module must stand alone atop the canonical core membership model:
-- the optional synthetic case module is not present in production Supabase.
do $electricity_isolation_contract$
declare
  role_fn regprocedure := 'private.electricity_factory_role(bigint,uuid)'::regprocedure;
  immutable_fn regprocedure := 'private.electricity_event_immutable()'::regprocedure;
begin
  if position('private.investigation_factory_role' in pg_get_functiondef(role_fn)) > 0 then
    raise exception 'ELECTRICITY_SCHEMA_CONTRACT: undeployed case-role dependency';
  end if;
  if has_function_privilege('authenticated', role_fn, 'EXECUTE') or
     has_function_privilege('anon', role_fn, 'EXECUTE') then
    raise exception 'ELECTRICITY_SCHEMA_CONTRACT: role helper must remain private';
  end if;
  if not exists(
    select 1 from pg_trigger
    where tgrelid='public.electricity_events'::regclass
      and tgname='electricity_events_immutable'
      and tgfoid=immutable_fn::oid and not tgisinternal
  ) then
    raise exception 'ELECTRICITY_SCHEMA_CONTRACT: own append-only event guard missing';
  end if;
end $electricity_isolation_contract$;
select 'electricity independent migration contract: PASS' as result;

-- Disposable fixtures only; rolled back. Run after full migration replay.
begin;
create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'ASSERT: %',message; end if; end $$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement; exception when insufficient_privilege or check_violation or invalid_parameter_value or serialization_failure or not_null_violation then return; end;
 raise exception 'Unexpectedly accepted: %',statement;
end $$;
insert into auth.users(id,email) values
 ('a1000000-0000-4000-8000-000000000001','electricity-owner@example.test'),
 ('a1000000-0000-4000-8000-000000000002','electricity-analyst@example.test'),
 ('a1000000-0000-4000-8000-000000000003','electricity-viewer@example.test'),
 ('a1000000-0000-4000-8000-000000000004','electricity-other@example.test');
do $$ declare oa bigint; ob bigint; fa bigint; fb bigint; begin
 insert into public.organizations(name) values('SYNTHETIC Electricity A') returning id into oa;
 insert into public.organizations(name) values('SYNTHETIC Electricity B') returning id into ob;
 insert into public.factories(name,organization_id) values('SYNTHETIC Adityapur',oa) returning id into fa;
 insert into public.factories(name,organization_id) values('SYNTHETIC Other',ob) returning id into fb;
 insert into public.organization_members(organization_id,user_id,role,status) values
 (oa,'a1000000-0000-4000-8000-000000000001','owner','active'),
 (oa,'a1000000-0000-4000-8000-000000000002','analyst','active'),
 (oa,'a1000000-0000-4000-8000-000000000003','viewer','active'),
 (ob,'a1000000-0000-4000-8000-000000000004','owner','active');
 insert into public.factory_members(factory_id,organization_id,user_id,role) values
 (fa,oa,'a1000000-0000-4000-8000-000000000001','owner'),
 (fa,oa,'a1000000-0000-4000-8000-000000000002','analyst'),
 (fa,oa,'a1000000-0000-4000-8000-000000000003','viewer'),
 (fb,ob,'a1000000-0000-4000-8000-000000000004','owner');
 perform set_config('test.factory',fa::text,true);
 perform set_config('test.other_factory',fb::text,true);
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select public.electricity_command(jsonb_build_object('action','create','id','b1000000-0000-4000-8000-000000000001','factoryId',current_setting('test.factory')::bigint,'investigatorId','a1000000-0000-4000-8000-000000000002','utility','Unknown','from','2026-09-01','to','2026-09-30','issue','Synthetic demand charge question'));
select public.electricity_command(jsonb_build_object('action','create','id','b1000000-0000-4000-8000-000000000001','factoryId',current_setting('test.factory')::bigint,'investigatorId','a1000000-0000-4000-8000-000000000002','utility','Unknown','from','2026-09-01','to','2026-09-30','issue','Synthetic demand charge question'));
select pg_temp.assert_true((select count(*)=1 from public.electricity_events),'idempotent creation emits one audit');
select pg_temp.assert_true(jsonb_array_length(public.electricity_command('{"action":"list"}'))=1,'list returns persisted authorized case');
select pg_temp.assert_true(jsonb_array_length(public.electricity_command('{"action":"options"}')->'sites')=1,'options scope organization and investigators');
select pg_temp.denied($q$select public.electricity_command(jsonb_build_object('action','create','id','b1000000-0000-4000-8000-000000000002','factoryId',current_setting('test.factory')::bigint,'investigatorId','a1000000-0000-4000-8000-000000000004','utility','Unknown','from','2026-09-01','to','2026-09-30','issue','Cross tenant assignee'))$q$);
select pg_temp.denied($q$select public.electricity_command(jsonb_build_object('action','create','id','b1000000-0000-4000-8000-000000000002','factoryId',current_setting('test.factory')::bigint,'investigatorId','a1000000-0000-4000-8000-000000000002','utility','Unknown','from','2026-09-30','to','2026-09-01','issue','Reversed dates invalid'))$q$);
select pg_temp.denied($q$update public.electricity_cases set investigator_id='a1000000-0000-4000-8000-000000000004'$q$);
select pg_temp.denied($q$delete from public.electricity_events$q$);
select pg_temp.denied($q$select public.electricity_command('{"action":"status","caseId":"b1000000-0000-4000-8000-000000000001","status":"investigating"}')$q$);
select public.electricity_command('{"action":"status","caseId":"b1000000-0000-4000-8000-000000000001","revision":1,"status":"investigating"}');
select pg_temp.denied($q$select public.electricity_command('{"action":"status","caseId":"b1000000-0000-4000-8000-000000000001","revision":1,"status":"awaiting_expert"}')$q$);
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select pg_temp.assert_true((public.electricity_command('{"action":"load","caseId":"b1000000-0000-4000-8000-000000000001"}')->'case'->>'revision')::int=2,'assigned analyst can retrieve persisted revision');
select public.electricity_command('{"action":"reserve","caseId":"b1000000-0000-4000-8000-000000000001","id":"c1000000-0000-4000-8000-000000000001","filename":"synthetic.pdf","mime":"application/pdf","bytes":20}');
select pg_temp.denied($q$select public.electricity_command('{"action":"finalize","caseId":"b1000000-0000-4000-8000-000000000001","id":"c1000000-0000-4000-8000-000000000001"}')$q$);
insert into storage.objects(bucket_id,name,metadata) values('electricity-bills','b1000000-0000-4000-8000-000000000001/c1000000-0000-4000-8000-000000000001','{"size":20,"mimetype":"application/pdf"}');
select public.electricity_command('{"action":"finalize","caseId":"b1000000-0000-4000-8000-000000000001","id":"c1000000-0000-4000-8000-000000000001"}');
select public.electricity_command('{"action":"finalize","caseId":"b1000000-0000-4000-8000-000000000001","id":"c1000000-0000-4000-8000-000000000001"}');
select pg_temp.assert_true((select count(*)=1 from public.electricity_events where kind='evidence_uploaded'),'finalize retry emits one audit');
select pg_temp.assert_true((select count(*)=1 from storage.objects where bucket_id='electricity-bills'),'private evidence visible to assigned analyst');
with changed as (update storage.objects set name='overwrite' where bucket_id='electricity-bills' returning *) select pg_temp.assert_true((select count(*)=0 from changed),'object overwrite denied');
-- Local Supabase Storage may reject direct SQL deletion in its guard trigger before RLS
-- would return an empty result. Both are legitimate denial; actual deletion is not.
do $storage_delete_test$
declare deleted_count bigint;
begin
  begin
    with changed as (delete from storage.objects where bucket_id='electricity-bills' returning *)
    select count(*) into deleted_count from changed;
    if deleted_count <> 0 then
      raise exception 'Storage object deletion unexpectedly allowed';
    end if;
  exception when others then
    -- Supabase Storage may raise its deletion guard with a SQLSTATE other
    -- than P0001. Match the specific protection error; never swallow a
    -- different database failure (including our own assertion).
    if sqlerrm not like 'Direct deletion from storage tables is not allowed%' then
      raise;
    end if;
  end;
  perform pg_temp.assert_true(
    (select count(*) = 1 from storage.objects where bucket_id = 'electricity-bills'),
    'the denied SQL deletion must preserve the uploaded evidence'
  );
end $storage_delete_test$;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000003',true);
select pg_temp.assert_true((select count(*)=0 from public.electricity_cases),'viewer cannot read internal cases');
select pg_temp.denied($q$select public.electricity_command('{"action":"load","caseId":"b1000000-0000-4000-8000-000000000001"}')$q$);
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000004',true);
select pg_temp.assert_true((select count(*)=0 from public.electricity_cases),'foreign owner cannot enumerate');
select pg_temp.assert_true((select count(*)=0 from public.electricity_events),'foreign owner cannot read audit');
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='electricity-bills'),'foreign owner cannot download');
select pg_temp.denied($q$select public.electricity_command('{"action":"load","caseId":"b1000000-0000-4000-8000-000000000001"}')$q$);
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('electricity-bills','foreign/path')$q$);
reset role;
update public.organization_members set status='suspended' where user_id='a1000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select pg_temp.assert_true((select count(*)=0 from public.electricity_cases),'revoked analyst loses access');
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='electricity-bills'),'revoked analyst loses Storage access');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select public.electricity_command('{"action":"status","caseId":"b1000000-0000-4000-8000-000000000001","revision":2,"status":"closed_inconclusive"}');
select pg_temp.denied($q$select public.electricity_command('{"action":"status","caseId":"b1000000-0000-4000-8000-000000000001","revision":3,"status":"investigating"}')$q$);
-- An organization suspension must revoke even a valid owner's read/RPC access.
-- These fixtures exist only inside this rolled-back SQL test transaction.
reset role;
update public.organizations set status='suspended'
 where id=(select organization_id from public.factories
           where id=current_setting('test.factory')::bigint);
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select pg_temp.assert_true((select count(*)=0 from public.electricity_cases),
  'suspended organization cannot read electricity cases');
select pg_temp.denied($q$select public.electricity_command('{"action":"load","caseId":"b1000000-0000-4000-8000-000000000001"}')$q$);
reset role;
update public.organizations set status='active'
 where id=(select organization_id from public.factories
           where id=current_setting('test.factory')::bigint);
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"is_anonymous":true}',true);
select pg_temp.assert_true((select count(*)=0 from public.electricity_cases),'anonymous JWT cannot read');
select pg_temp.denied($q$select public.electricity_command('{"action":"list"}')$q$);
reset role;
select pg_temp.assert_true((select not public and file_size_limit=10485760 from storage.buckets where id='electricity-bills'),'private bounded bucket');
set local role anon;
select pg_temp.denied($q$select public.electricity_command('{"action":"list"}')$q$);
select pg_temp.denied($q$select * from public.electricity_cases$q$);
rollback;
