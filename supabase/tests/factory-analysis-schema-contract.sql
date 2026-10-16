-- Assert the canonical analysis persistence contract after a clean migration replay.
-- This test is local/CI-only and performs no writes.
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
