-- SELECT-only metadata preflight. Safe for the GridMind live project.
-- Compare with the same query after isolated replay; never repairs history.
select jsonb_build_object(
  'database_version', current_setting('server_version'),
  'migration_inventory', (select jsonb_agg(jsonb_build_object('version', version, 'name', name) order by version)
    from supabase_migrations.schema_migrations),
  'expected_columns', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from (
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns where table_schema='public'
      and ((table_name='asset_interventions' and column_name='implemented_at')
        or (table_name='factory_analysis_runs' and column_name='input_snapshot_sha256'))
    order by table_name, column_name) c),
  'public_tables_without_rls', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity),
  'api_structural_grants', (select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) from (
    select c.relname as table_name, r.role_name, p.privilege
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    cross join (values ('anon'),('authenticated'),('service_role')) r(role_name)
    cross join (values ('TRUNCATE'),('REFERENCES'),('TRIGGER'),('MAINTAIN')) p(privilege)
    where n.nspname='public' and c.relkind in ('r','p') and has_table_privilege(r.role_name,c.oid,p.privilege)
    order by c.relname,r.role_name,p.privilege) g),
  'analysis_constraints', (select jsonb_agg(jsonb_build_object('name',conname,'validated',convalidated,'definition',pg_get_constraintdef(oid)) order by conname)
    from pg_constraint where conrelid=to_regclass('public.factory_analysis_runs')),
  'analysis_triggers', (select jsonb_agg(jsonb_build_object('name',tgname,'enabled',tgenabled,'definition',pg_get_triggerdef(oid)) order by tgname)
    from pg_trigger where tgrelid=to_regclass('public.factory_analysis_runs') and not tgisinternal),
  'analysis_acl', (select jsonb_agg(jsonb_build_object('role',r.role_name,'select',has_table_privilege(r.role_name,'public.factory_analysis_runs','SELECT'),
      'insert',has_table_privilege(r.role_name,'public.factory_analysis_runs','INSERT'),'update',has_table_privilege(r.role_name,'public.factory_analysis_runs','UPDATE'),
      'delete',has_table_privilege(r.role_name,'public.factory_analysis_runs','DELETE')))
    from (values ('anon'),('authenticated'),('service_role')) r(role_name)),
  'tenant_policies', (select jsonb_agg(to_jsonb(p)) from (
    select tablename,policyname,roles,cmd,qual,with_check from pg_policies
    where schemaname='public' and tablename in ('factories','factory_assets','factory_members','organization_members','factory_analysis_runs','observations','asset_interventions','verified_outcomes')
    order by tablename,policyname) p),
  'bootstrap', (select jsonb_build_object('security_definer',prosecdef,'configuration',proconfig,
    'anon_execute',has_function_privilege('anon',oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',oid,'EXECUTE'),
    'definition',pg_get_functiondef(oid)) from pg_proc where oid='public.create_factory_workspace(text,text,text)'::regprocedure)
) as schema_preflight;
