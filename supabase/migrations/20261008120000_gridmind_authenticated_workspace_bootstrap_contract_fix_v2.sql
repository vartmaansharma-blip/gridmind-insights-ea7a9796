-- GridMind authenticated workspace bootstrap contract fix.
-- The live database had the Phase 13.2 migration recorded but the RPC was absent.
-- Keep this definition in source control so the application/database contract is reproducible.

create or replace function public.create_factory_workspace(
  p_name text,
  p_location text default null,
  p_industry text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id bigint;
  v_factory_id bigint;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'FACTORY_NAME_REQUIRED';
  end if;

  insert into public.organizations (
    name, industry, country, timezone, status
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_industry, '')), ''),
    'IN',
    'Asia/Kolkata',
    'active'
  )
  returning id into v_org_id;

  insert into public.organization_members (
    organization_id, user_id, role, status
  )
  values (
    v_org_id, v_user_id, 'owner', 'active'
  );

  insert into public.factories (
    organization_id, name, location, industry, metadata
  )
  values (
    v_org_id,
    trim(p_name),
    nullif(trim(coalesce(p_location, '')), ''),
    nullif(trim(coalesce(p_industry, '')), ''),
    jsonb_build_object(
      'created_via', 'gridmind_authenticated_workspace_bootstrap',
      'application_contract_version', 1
    )
  )
  returning id into v_factory_id;

  insert into public.factory_members (
    factory_id, user_id, organization_id, role
  )
  values (
    v_factory_id, v_user_id, v_org_id, 'owner'
  );

  return v_factory_id;
end;
$$;

revoke all on function public.create_factory_workspace(text, text, text) from public;
grant execute on function public.create_factory_workspace(text, text, text) to authenticated;
