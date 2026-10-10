-- Local-only authorization acceptance test for the workspace bootstrap RPC.
-- Run after a clean migration replay in an isolated database. The whole test rolls back.
begin;

do $$
declare
  user_a constant uuid := 'a3333333-3333-4333-8333-333333333333';
  user_b constant uuid := 'b4444444-4444-4444-8444-444444444444';
  org_a bigint;
  org_b bigint;
  factory_id bigint;
  actual_org_id bigint;
begin
  if has_function_privilege('anon', 'public.create_factory_workspace(text,text,text)', 'execute') then
    raise exception 'ANON_CAN_EXECUTE_WORKSPACE_BOOTSTRAP';
  end if;

  insert into auth.users
    (id, aud, role, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    (user_a, 'authenticated', 'authenticated', 'gridmind-bootstrap-a@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb),
    (user_b, 'authenticated', 'authenticated', 'gridmind-bootstrap-b@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb);

  insert into public.organizations (name, status)
  values ('gridmind-bootstrap-org-a', 'active')
  returning id into org_a;
  insert into public.organizations (name, status)
  values ('gridmind-bootstrap-org-b', 'active')
  returning id into org_b;

  insert into public.organization_members (organization_id, user_id, role, status)
  values
    (org_a, user_a, 'owner', 'active'),
    (org_b, user_b, 'owner', 'active');

  -- The function must derive the caller from the JWT claim and refuse an empty identity.
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated"}', true);
  begin
    perform public.create_factory_workspace('gridmind-bootstrap-no-user', null, null);
    raise exception 'UNAUTHENTICATED_BOOTSTRAP_WAS_ALLOWED';
  exception
    when raise_exception then
      if sqlerrm = 'UNAUTHENTICATED_BOOTSTRAP_WAS_ALLOWED' then raise; end if;
      if sqlerrm not like '%AUTHENTICATION_REQUIRED%' and sqlerrm not like '%authentication required%' then
        raise exception 'UNEXPECTED_UNAUTHENTICATED_ERROR: %', sqlerrm;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', user_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', user_a, 'role', 'authenticated')::text, true);

  begin
    perform public.create_factory_workspace('   ', null, null);
    raise exception 'BLANK_FACTORY_NAME_WAS_ALLOWED';
  exception
    when raise_exception then
      if sqlerrm = 'BLANK_FACTORY_NAME_WAS_ALLOWED' then raise; end if;
      if sqlerrm not like '%FACTORY_NAME_REQUIRED%' and sqlerrm not like '%factory name is required%' then
        raise exception 'UNEXPECTED_BLANK_NAME_ERROR: %', sqlerrm;
      end if;
  end;

  factory_id := public.create_factory_workspace('gridmind-bootstrap-factory-a', 'test location', 'test industry');

  select f.organization_id into strict actual_org_id
  from public.factories f
  where f.id = factory_id;

  if actual_org_id <> org_a then
    raise exception 'WORKSPACE_ATTACHED_TO_UNAUTHORIZED_ORGANIZATION: expected %, got %', org_a, actual_org_id;
  end if;

  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = org_a and om.user_id = user_a
      and om.role = 'owner' and om.status = 'active'
  ) then
    raise exception 'AUTHORIZED_ORGANIZATION_MEMBERSHIP_MISSING';
  end if;

  if not exists (
    select 1 from public.factory_members fm
    where fm.factory_id = factory_id and fm.organization_id = org_a
      and fm.user_id = user_a and fm.role = 'owner'
  ) then
    raise exception 'FACTORY_OWNER_MEMBERSHIP_MISSING';
  end if;

  if exists (
    select 1 from public.factory_members fm
    where fm.factory_id = factory_id and fm.organization_id = org_b
  ) then
    raise exception 'CROSS_TENANT_FACTORY_MEMBERSHIP_CREATED';
  end if;
end;
$$;

rollback;
