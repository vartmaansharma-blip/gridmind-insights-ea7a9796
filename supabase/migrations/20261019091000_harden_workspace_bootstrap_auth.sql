-- GM-3.1-001: forward-only security hardening of the existing onboarding RPC.
-- This is SOURCE ONLY until the production migration registry and backups are reconciled.
-- SECURITY DEFINER remains intentional because first-time users need an owned
-- organization/factory before organization-scoped RLS can authorize table writes.
-- Anonymous Supabase Auth users assume the 'authenticated' DB role: reject them.
begin;

create or replace function public.create_factory_workspace(
  p_name text,
  p_location text default null,
  p_industry text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $workspace$
declare
  v_user_id uuid;
  v_org_id bigint;
  v_factory_id bigint;
begin
  v_user_id := auth.uid();

  -- The authenticated Postgres role also includes anonymous Auth users.
  -- No factory or organization may be created from an anonymous session.
  if v_user_id is null
     or coalesce(auth.jwt()->>'is_anonymous','false') = 'true' then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  -- Bound caller-controlled inputs before any privileged insert. Existing
  -- organizations/factories are not modified by this forward-only migration.
  if nullif(btrim(coalesce(p_name,'')),'') is null then
    raise exception 'FACTORY_NAME_REQUIRED' using errcode = '22023';
  end if;
  if length(btrim(p_name)) > 180
     or length(coalesce(p_location,'')) > 255
     or length(coalesce(p_industry,'')) > 180 then
    raise exception 'INVALID_FACTORY_INPUT' using errcode = '22023';
  end if;

  select om.organization_id into v_org_id
  from public.organization_members om
  where om.user_id = v_user_id
    and om.status = 'active'
    and om.role in ('owner','admin')
  order by om.organization_id
  limit 1;

  if v_org_id is null then
    insert into public.organizations(name,industry,country,timezone,status)
    values (
      btrim(p_name),
      nullif(btrim(coalesce(p_industry,'')),''),
      'IN',
      'Asia/Kolkata',
      'active'
    )
    returning id into v_org_id;

    insert into public.organization_members(organization_id,user_id,role,status)
    values (v_org_id,v_user_id,'owner','active');
  end if;

  insert into public.factories(organization_id,name,location,industry,metadata)
  values (
    v_org_id,
    btrim(p_name),
    nullif(btrim(coalesce(p_location,'')),''),
    nullif(btrim(coalesce(p_industry,'')),''),
    jsonb_build_object(
      'created_via','gridmind_authenticated_workspace_bootstrap',
      'application_contract_version',2
    )
  )
  returning id into v_factory_id;

  insert into public.factory_members(factory_id,user_id,organization_id,role)
  values (v_factory_id,v_user_id,v_org_id,'owner');

  return v_factory_id;
end;
$workspace$;

revoke all on function public.create_factory_workspace(text,text,text)
  from public, anon;
grant execute on function public.create_factory_workspace(text,text,text)
  to authenticated;

comment on function public.create_factory_workspace(text,text,text) is
  'Onboarding RPC; SECURITY DEFINER is intentional. Non-anonymous authenticated caller only, with bounded input. Independent release review required.';

commit;
