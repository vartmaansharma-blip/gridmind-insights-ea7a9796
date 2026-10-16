-- Source-only synthetic method backend. Do not apply to production without release authorization.
-- Existing organizations/factories/memberships remain authoritative. Three lifecycle tables,
-- rather than eight parallel domain tables: case, immutable revision, scoped assignment.
begin;
create table public.investigation_cases (
  id uuid primary key,
  factory_id bigint not null references public.factories(id) on delete restrict,
  origin text not null default 'synthetic' check (origin = 'synthetic'),
  revision integer not null default 0 check (revision >= 0),
  last_editor uuid not null references auth.users(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index investigation_cases_factory_idx on public.investigation_cases(factory_id);
create table public.investigation_assignments (
  case_id uuid not null references public.investigation_cases(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (role in ('investigator','reviewer')),
  active boolean not null default true,
  expires_at timestamptz,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  primary key(case_id,user_id)
);
create index investigation_assignments_user_idx on public.investigation_assignments(user_id,case_id);
create table public.investigation_revisions (
  case_id uuid not null references public.investigation_cases(id) on delete restrict,
  revision integer not null check (revision > 0),
  request_key text not null check (length(request_key) between 1 and 200),
  request_fingerprint text not null check (request_fingerprint ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and snapshot ?& array['id','origin','revision'] and snapshot->>'origin' = 'synthetic' and octet_length(snapshot::text) <= 4000000),
  snapshot_sha256 text not null,
  event jsonb not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(case_id,revision), unique(case_id,request_key),
  check (snapshot->>'id' = case_id::text),
  check ((snapshot->>'revision')::integer = revision)
);
alter table public.investigation_cases enable row level security;
alter table public.investigation_assignments enable row level security;
alter table public.investigation_revisions enable row level security;

-- Authenticated identity is resolved from the verified token at the server API. Actor
-- arguments below are accepted ONLY from service_role, never a browser RPC caller.
create function private.investigation_factory_role(_factory bigint, _actor uuid)
returns text language sql stable security definer set search_path = '' as $$
  select fm.role from public.factory_members fm
  join public.factories f on f.id=fm.factory_id and f.organization_id=fm.organization_id
  join public.organization_members om on om.organization_id=f.organization_id
    and om.user_id=fm.user_id and om.status='active'
  where fm.factory_id=_factory and fm.user_id=_actor
  limit 1
$$;
create function private.investigation_access(_case uuid, _actor uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when private.investigation_factory_role(c.factory_id,_actor) in ('owner','admin') then 'manager'
    else (select a.role from public.investigation_assignments a where a.case_id=c.id and a.user_id=_actor
      and a.active and (a.expires_at is null or a.expires_at>now())) end
  from public.investigation_cases c
  where c.id=_case and private.investigation_factory_role(c.factory_id,_actor) is not null
$$;
revoke all on function private.investigation_factory_role(bigint,uuid) from public,anon,authenticated;
revoke all on function private.investigation_access(uuid,uuid) from public,anon;
grant execute on function private.investigation_access(uuid,uuid) to authenticated;

-- Reviewer responses go through the server's redacted RPC. Direct table reads
-- never expose prices/expenses to reviewers or ordinary factory viewers.
grant select on public.investigation_cases,public.investigation_assignments,public.investigation_revisions to authenticated;
revoke all on public.investigation_cases,public.investigation_assignments,public.investigation_revisions from anon,service_role;
revoke insert,update,delete,truncate,references,trigger on public.investigation_cases,public.investigation_assignments,public.investigation_revisions from authenticated;
create policy "assigned case headers" on public.investigation_cases for select to authenticated
  using (private.investigation_access(id,(select auth.uid())) is not null);
create policy "operator revisions only" on public.investigation_revisions for select to authenticated
  using (private.investigation_access(case_id,(select auth.uid())) in ('manager','investigator'));
create policy "operator assignments only" on public.investigation_assignments for select to authenticated
  using (private.investigation_access(case_id,(select auth.uid())) in ('manager','investigator'));

create function private.investigation_revision_immutable()
returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'INVESTIGATION_REVISION_IMMUTABLE' using errcode='42501'; end $$;
revoke all on function private.investigation_revision_immutable() from public,anon,authenticated;
create trigger investigation_revisions_immutable before update or delete on public.investigation_revisions
  for each row execute function private.investigation_revision_immutable();

create function private.investigation_redact(_snapshot jsonb, _role text)
returns jsonb language sql immutable set search_path = '' as $$
  select case when _role='reviewer' then _snapshot || '{"labor":[],"expenses":[],"payments":[]}'::jsonb else _snapshot end
$$;
revoke all on function private.investigation_redact(jsonb,text) from public,anon,authenticated;

create function private.investigation_store(
  _actor uuid, _op text, _case uuid default null, _factory bigint default null,
  _expected integer default null, _key text default null, _fingerprint text default null,
  _snapshot jsonb default null, _event jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.investigation_cases%rowtype;
  previous public.investigation_revisions%rowtype;
  access_role text;
  factory_role text;
  rows_changed integer;
  target uuid;
  reviewer_grant boolean;
  result jsonb;
begin
  if _actor is null or not exists(select 1 from auth.users where id=_actor) then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501';
  end if;
  if _op='list' then
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'factoryId',x.factory_id,'revision',x.revision,'role',x.access_role)),'[]'::jsonb)
    into result from (select id,factory_id,revision,private.investigation_access(id,_actor) access_role
      from public.investigation_cases where (_factory is null or factory_id=_factory) and private.investigation_access(id,_actor) is not null order by created_at desc limit 100) x where x.access_role is not null;
    return jsonb_build_object('cases',result);
  end if;
  if _op='create' then
    factory_role:=private.investigation_factory_role(_factory,_actor);
    if factory_role is null or factory_role not in ('owner','admin','analyst') then
      raise exception 'CASE_CREATE_DENIED' using errcode='42501';
    end if;
    insert into public.investigation_cases(id,factory_id,last_editor,created_by)
      values(_case,_factory,_actor,_actor) on conflict do nothing;
    get diagnostics rows_changed=row_count;
    if rows_changed=1 then
      insert into public.investigation_assignments(case_id,user_id,role,assigned_by) values(_case,_actor,'investigator',_actor);
    end if;
  end if;
  select * into c from public.investigation_cases where id=_case for update;
  access_role:=private.investigation_access(_case,_actor);
  if c.id is null or access_role is null then raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
  if _op='receipt' then
    select * into previous from public.investigation_revisions where case_id=_case and request_key=_key;
    if previous.case_id is null then return jsonb_build_object('found',false); end if;
    if previous.request_fingerprint<>_fingerprint or previous.actor_id<>_actor then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
    return jsonb_build_object('caseId',c.id,'factoryId',c.factory_id,'role',access_role,'revision',previous.revision,'headRevision',c.revision,
      'snapshot',private.investigation_redact(previous.snapshot,access_role),'snapshotSha256',previous.snapshot_sha256,
      'integrityValid',previous.snapshot_sha256=encode(sha256(convert_to(previous.snapshot::text,'UTF8')),'hex'),'replayed',true,'lastEditor',c.last_editor);
  end if;
  if _op in ('create','append') then
    if _key is null or length(_key) not between 1 and 200 or _fingerprint is null then raise exception 'REQUEST_KEY_REQUIRED'; end if;
    select * into previous from public.investigation_revisions where case_id=_case and request_key=_key;
    if previous.case_id is not null then
      if previous.request_fingerprint<>_fingerprint or previous.actor_id<>_actor then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
      -- Return original committed response on lost-response retry, not today's head.
      return jsonb_build_object('caseId',c.id,'factoryId',c.factory_id,'role',access_role,'revision',previous.revision,'headRevision',c.revision,
        'snapshot',private.investigation_redact(previous.snapshot,access_role),'snapshotSha256',previous.snapshot_sha256,'integrityValid',previous.snapshot_sha256=encode(sha256(convert_to(previous.snapshot::text,'UTF8')),'hex'),'replayed',true,'lastEditor',c.last_editor);
    end if;
    if c.revision is distinct from _expected then raise exception 'STALE_CASE_REVISION' using errcode='40001'; end if;
    if _snapshot is null or _snapshot->>'origin'<>'synthetic' or _snapshot->>'id'<>_case::text
      or (_snapshot->>'revision')::integer<>c.revision+1 then raise exception 'INVALID_SYNTHETIC_REVISION'; end if;
    if _event->>'kind'='assign' then
      if access_role<>'manager' then raise exception 'CASE_ASSIGN_DENIED' using errcode='42501'; end if;
      target:=(_event->>'userId')::uuid;
      if private.investigation_factory_role(c.factory_id,target) is null then raise exception 'ASSIGNEE_NOT_FACTORY_MEMBER' using errcode='42501'; end if;
      insert into public.investigation_assignments(case_id,user_id,role,active,expires_at,assigned_by)
        values(_case,target,_event->>'role',(_event->>'active')::boolean,(_event->>'expiresAt')::timestamptz,_actor)
        on conflict(case_id,user_id) do update set role=excluded.role,active=excluded.active,expires_at=excluded.expires_at,assigned_by=excluded.assigned_by;
    elsif _event->>'kind'='review' then
      select exists(select 1 from public.investigation_assignments a where a.case_id=c.id and a.user_id=_actor and a.role='reviewer'
        and a.active and (a.expires_at is null or a.expires_at>now())) into reviewer_grant;
      if not reviewer_grant or c.last_editor=_actor then raise exception 'INDEPENDENT_REVIEWER_REQUIRED' using errcode='42501'; end if;
    elsif _event->>'kind'='verify' then
      if access_role not in ('manager','investigator','reviewer') then raise exception 'SOURCE_VERIFICATION_DENIED' using errcode='42501'; end if;
    elsif _event->>'kind'='edit' then
      if access_role not in ('manager','investigator') then raise exception 'CASE_EDIT_DENIED' using errcode='42501'; end if;
    else raise exception 'INVALID_CASE_COMMAND'; end if;
    insert into public.investigation_revisions(case_id,revision,request_key,request_fingerprint,snapshot,snapshot_sha256,event,actor_id)
      values(_case,c.revision+1,_key,_fingerprint,_snapshot,encode(sha256(convert_to(_snapshot::text,'UTF8')),'hex'),_event,_actor);
    update public.investigation_cases set revision=c.revision+1,
      last_editor=case when _event->>'kind'='edit' then _actor else last_editor end where id=_case;
  elsif _op not in ('read','read_internal') then raise exception 'INVALID_STORE_OPERATION'; end if;
  select * into c from public.investigation_cases where id=_case;
  select * into previous from public.investigation_revisions where case_id=_case and revision=case when _op in ('read','read_internal') then coalesce(_expected,c.revision) else c.revision end;
  if previous.case_id is null then raise exception 'CASE_REVISION_MISSING'; end if;
  return jsonb_build_object('caseId',c.id,'factoryId',c.factory_id,'role',access_role,'revision',previous.revision,'headRevision',c.revision,
    'snapshot',case when _op='read_internal' then previous.snapshot else private.investigation_redact(previous.snapshot,access_role) end,'snapshotSha256',previous.snapshot_sha256,
    'integrityValid',previous.snapshot_sha256=encode(sha256(convert_to(previous.snapshot::text,'UTF8')),'hex'),
    'lastEditor',c.last_editor,'history',(select coalesce(jsonb_agg(jsonb_build_object('revision',r.revision,
      'actorId',r.actor_id,'at',r.created_at,
      'event',case when access_role='reviewer' then r.event - 'reason' else r.event end,
      'integrityValid',r.snapshot_sha256=encode(sha256(convert_to(r.snapshot::text,'UTF8')),'hex')) order by r.revision),'[]'::jsonb)
      from (select * from public.investigation_revisions where case_id=_case order by revision desc limit 100) r));
end $$;
revoke all on function private.investigation_store(uuid,text,uuid,bigint,integer,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.investigation_store(uuid,text,uuid,bigint,integer,text,text,jsonb,jsonb) to service_role;
create function public.investigation_store(
  _actor uuid, _op text, _case uuid default null, _factory bigint default null,
  _expected integer default null, _key text default null, _fingerprint text default null,
  _snapshot jsonb default null, _event jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path = '' as $$
  select private.investigation_store(_actor,_op,_case,_factory,_expected,_key,_fingerprint,_snapshot,_event)
$$;
revoke all on function public.investigation_store(uuid,text,uuid,bigint,integer,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.investigation_store(uuid,text,uuid,bigint,integer,text,text,jsonb,jsonb) to service_role;
-- service_role needs private-schema usage for the invoker wrapper, not direct table grants.
grant usage on schema private to service_role;
comment on table public.investigation_cases is 'Synthetic internal method cases only; no customer-data release authorization.';
notify pgrst, 'reload schema';
commit;
