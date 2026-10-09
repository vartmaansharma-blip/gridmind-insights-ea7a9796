-- GridMind Phase 13.2: authenticated factory workspace bootstrap
--
-- The application needs a safe way for an authenticated user to create the
-- first organization/factory because normal INSERT policies intentionally
-- require an existing membership. This function creates the complete owner
-- membership atomically, then normal RLS governs all subsequent access.
--
-- Security notes:
-- * SECURITY DEFINER is required only for this bootstrap transaction.
-- * The caller must be authenticated.
-- * search_path is pinned to the empty string.
-- * The function is not exposed to anon/public.
-- * It does not accept a user_id; identity always comes from auth.uid().

create or replace function private.create_factory_workspace(
  p_name text,
  p_location text default null,
  p_industry text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_org_id bigint;
  v_factory_id bigint;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'factory name is required';
  end if;

  insert into public.organizations (name, industry)
  values (trim(p_name), nullif(trim(p_industry), ''))
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org_id, v_user_id, 'owner', 'active');

  insert into public.factories (name, location, industry, organization_id)
  values (trim(p_name), nullif(trim(p_location), ''), nullif(trim(p_industry), ''), v_org_id)
  returning id into v_factory_id;

  insert into public.factory_members (factory_id, user_id, role, organization_id)
  values (v_factory_id, v_user_id, 'owner', v_org_id);

  return v_factory_id;
end;
$$;

revoke execute on function private.create_factory_workspace(text, text, text) from public;
revoke execute on function private.create_factory_workspace(text, text, text) from anon;
grant execute on function private.create_factory_workspace(text, text, text) to authenticated;