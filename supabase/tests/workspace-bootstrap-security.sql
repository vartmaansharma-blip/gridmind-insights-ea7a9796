-- Local/CI-only workspace-bootstrap authorization contract.
-- Runs inside a transaction and rolls back all fixture users and records.
begin;

insert into auth.users (id, aud, role, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('c3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'gridmind-bootstrap-a@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('d4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'gridmind-bootstrap-b@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('e5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'gridmind-bootstrap-new@example.test', now(), now(), '{}'::jsonb, '{}'::jsonb);

insert into public.organizations (name) values ('gridmind-bootstrap-org-a');
insert into public.organizations (name) values ('gridmind-bootstrap-org-b');

insert into public.organization_members (organization_id, user_id, role, status)
select o.id, 'c3333333-3333-4333-8333-333333333333'::uuid, 'owner', 'active'
from public.organizations o where o.name = 'gridmind-bootstrap-org-a';

insert into public.organization_members (organization_id, user_id, role, status)
select o.id, 'd4444444-4444-4444-8444-444444444444'::uuid, 'owner', 'active'
from public.organizations o where o.name = 'gridmind-bootstrap-org-b';

-- Unauthenticated RPC invocation must fail closed.
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    perform public.create_factory_workspace('gridmind-bootstrap-unauthenticated', null, null);
    raise exception 'UNAUTHENTICATED_WORKSPACE_CREATION_WAS_ALLOWED';
  exception
    when others then
      if sqlerrm <> 'AUTHENTICATION_REQUIRED' then
        raise;
      end if;
  end;
end;
$$;

-- One active owner organization: create the factory in that organization.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claims', '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select public.create_factory_workspace('gridmind-bootstrap-single-org-a', null, 'manufacturing');
reset role;

do $$
declare
  expected_org_id bigint;
  actual_org_id bigint;
begin
  select id into strict expected_org_id
  from public.organizations where name = 'gridmind-bootstrap-org-a';

  select organization_id into strict actual_org_id
  from public.factories where name = 'gridmind-bootstrap-single-org-a';

  if actual_org_id <> expected_org_id then
    raise exception 'SINGLE_ORG_FACTORY_ATTACHED_TO_WRONG_ORGANIZATION';
  end if;
end;
$$;

-- Give user A a second active admin organization. The legacy implementation
-- silently selected the lowest ID; the hardened contract must reject ambiguity
-- and create no factory until an explicit organization-selection flow exists.
insert into public.organization_members (organization_id, user_id, role, status)
select o.id, 'c3333333-3333-4333-8333-333333333333'::uuid, 'admin', 'active'
from public.organizations o where o.name = 'gridmind-bootstrap-org-b';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claims', '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
do $$
declare
  v_rejected boolean := false;
begin
  begin
    perform public.create_factory_workspace('gridmind-bootstrap-ambiguous-a', null, null);
  exception
    when others then
      if sqlerrm = 'AMBIGUOUS_ORGANIZATION_CONTEXT' then
        v_rejected := true;
      else
        raise;
      end if;
  end;

  if not v_rejected then
    raise exception 'AMBIGUOUS_ORGANIZATION_CONTEXT_WAS_NOT_REJECTED';
  end if;
end;
$$;
reset role;

do $$
begin
  if exists (select 1 from public.factories where name = 'gridmind-bootstrap-ambiguous-a') then
    raise exception 'AMBIGUOUS_ORGANIZATION_ATTEMPT_CREATED_A_FACTORY';
  end if;
end;
$$;

-- A user with no active owner/admin organization may bootstrap a new organization.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e5555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claims', '{"sub":"e5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select public.create_factory_workspace('gridmind-bootstrap-new-org', null, 'manufacturing');
reset role;

do $$
declare
  v_factory_id bigint;
  v_org_id bigint;
  v_owner_count integer;
begin
  select id, organization_id into strict v_factory_id, v_org_id
  from public.factories where name = 'gridmind-bootstrap-new-org';

  select count(*) into v_owner_count
  from public.organization_members
  where organization_id = v_org_id
    and user_id = 'e5555555-5555-4555-8555-555555555555'
    and role = 'owner'
    and status = 'active';

  if v_owner_count <> 1 then
    raise exception 'NEW_WORKSPACE_OWNER_MEMBERSHIP_WAS_NOT_CREATED';
  end if;

  if not exists (
    select 1 from public.factory_members
    where factory_id = v_factory_id
      and organization_id = v_org_id
      and user_id = 'e5555555-5555-4555-8555-555555555555'
      and role = 'owner'
  ) then
    raise exception 'NEW_FACTORY_OWNER_MEMBERSHIP_WAS_NOT_CREATED';
  end if;
end;
$$;

rollback;
