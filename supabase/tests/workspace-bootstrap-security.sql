-- Isolated local/CI fixtures only. Never run this file against production.
begin;

do $$
declare
  org_a bigint;
  org_b bigint;
begin
  insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
  select ('c0000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
    'authenticated', 'authenticated', 'workspace-' || i || '@example.test', '{}',
    '{"role":"owner","organization_id":1}'::jsonb
  from generate_series(1,5) i;
  insert into public.organizations (name) values ('bootstrap-a') returning id into org_a;
  insert into public.organizations (name) values ('bootstrap-b') returning id into org_b;
  insert into public.organization_members (organization_id,user_id,role,status) values
    (org_a,'c0000000-0000-4000-8000-000000000002','owner','active'),
    (org_a,'c0000000-0000-4000-8000-000000000003','owner','active'),
    (org_b,'c0000000-0000-4000-8000-000000000003','admin','active'),
    (org_b,'c0000000-0000-4000-8000-000000000004','viewer','active'),
    (org_b,'c0000000-0000-4000-8000-000000000005','owner','suspended');
  perform set_config('gridmind.bootstrap_org_a',org_a::text,true);
  perform set_config('gridmind.bootstrap_org_b',org_b::text,true);
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
do $$
begin
  begin
    perform public.create_factory_workspace('unauthenticated');
    raise exception 'MISSING_IDENTITY_WAS_ACCEPTED';
  exception when raise_exception then
    if sqlerrm <> 'AUTHENTICATION_REQUIRED' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000001',true);
do $$
declare
  factory bigint;
begin
  begin
    perform public.create_factory_workspace('  ');
    raise exception 'EMPTY_NAME_WAS_ACCEPTED';
  exception when raise_exception then
    if sqlerrm <> 'FACTORY_NAME_REQUIRED' then raise; end if;
  end;
  factory := public.create_factory_workspace('  first workspace  ', ' Mumbai ', ' Industry ');
  if not exists (select 1 from public.factories f join public.factory_members fm on fm.factory_id=f.id
    join public.organization_members om on om.organization_id=f.organization_id and om.user_id=fm.user_id
    where f.id=factory and f.name='first workspace' and f.location='Mumbai'
      and fm.user_id=auth.uid() and fm.role='owner' and om.role='owner' and om.status='active'
      and f.organization_id not in (current_setting('gridmind.bootstrap_org_a')::bigint,current_setting('gridmind.bootstrap_org_b')::bigint)) then
    raise exception 'FIRST_WORKSPACE_NOT_OWNED_OR_METADATA_ESCALATION';
  end if;
end $$;

select set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000002',true);
do $$
declare factory bigint;
begin
  factory := public.create_factory_workspace('one eligible organization');
  if not exists (select 1 from public.factories where id=factory and organization_id=current_setting('gridmind.bootstrap_org_a')::bigint) then
    raise exception 'SINGLE_ELIGIBLE_ORGANIZATION_NOT_REUSED';
  end if;
end $$;

select set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000003',true);
do $$
begin
  begin
    perform public.create_factory_workspace('ambiguous must not exist');
    raise exception 'MULTIPLE_ORGANIZATIONS_SILENTLY_SELECTED';
  exception when raise_exception then
    if sqlerrm <> 'WORKSPACE_ORGANIZATION_AMBIGUOUS' then raise; end if;
  end;
end $$;

-- Viewer and suspended memberships must not authorize creation in that org.
select set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000004',true);
do $$
declare factory bigint;
begin
  factory := public.create_factory_workspace('viewer separate workspace');
  if exists (select 1 from public.factories where id=factory and organization_id=current_setting('gridmind.bootstrap_org_b')::bigint) then
    raise exception 'VIEWER_MEMBERSHIP_ESCALATED';
  end if;
end $$;
select set_config('request.jwt.claim.sub','c0000000-0000-4000-8000-000000000005',true);
do $$
declare factory bigint;
begin
  factory := public.create_factory_workspace('inactive separate workspace');
  if exists (select 1 from public.factories where id=factory and organization_id=current_setting('gridmind.bootstrap_org_b')::bigint) then
    raise exception 'INACTIVE_MEMBERSHIP_ESCALATED';
  end if;
end $$;

set local role anon;
do $$
begin
  begin
    perform public.create_factory_workspace('anon must not exist');
    raise exception 'ANONYMOUS_EXECUTE_WAS_ALLOWED';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
begin
  if exists (select 1 from public.factories where name in ('ambiguous must not exist','anon must not exist','unauthenticated')) then
    raise exception 'REJECTED_BOOTSTRAP_LEFT_PARTIAL_WRITES';
  end if;
end $$;
rollback;
select 'workspace bootstrap authorization: PASS' as result;
