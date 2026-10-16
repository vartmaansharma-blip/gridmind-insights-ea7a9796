-- Additive source-only integration. Customer grants never grant factory membership.
begin;
alter table public.investigation_cases add column auto_publish boolean not null default false;
create table public.case_customers (
 case_id uuid not null references public.investigation_cases(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 active boolean not null default true, expires_at timestamptz,
 granted_by uuid not null references auth.users(id), primary key(case_id,user_id)
);
create index case_customers_user_idx on public.case_customers(user_id,case_id);
create table public.case_intake (
 id uuid primary key, requester uuid not null references auth.users(id),
 organization_id bigint not null references public.organizations(id),
 payload jsonb not null check(octet_length(payload::text)<=20000),
 fingerprint text not null, case_id uuid references public.investigation_cases(id),
 created_at timestamptz not null default now()
);
create index case_intake_org_idx on public.case_intake(organization_id,created_at);
create table public.case_communications (
 id uuid primary key, case_id uuid not null references public.investigation_cases(id),
 actor uuid not null references auth.users(id), actor_role text not null,
 kind text not null check(kind in ('message','evidence_request','evidence_reply','decision','withdraw')),
 payload jsonb not null check(octet_length(payload::text)<=20000), fingerprint text not null,
 created_at timestamptz not null default now()
);
create index case_communications_case_idx on public.case_communications(case_id,created_at);
create table public.case_publications (
 id uuid primary key, case_id uuid not null references public.investigation_cases(id),
 revision integer not null, projection jsonb not null check(octet_length(projection::text)<=1000000),
 snapshot_sha256 text not null, method_version text not null, reviewer_id uuid not null references auth.users(id),
 published_by uuid not null references auth.users(id), fingerprint text not null,
 created_at timestamptz not null default now()
);
create index case_publications_case_idx on public.case_publications(case_id,created_at);
alter table public.case_customers enable row level security;
alter table public.case_intake enable row level security;
alter table public.case_communications enable row level security;
alter table public.case_publications enable row level security;
revoke all on public.case_customers,public.case_intake,public.case_communications,public.case_publications from public,anon,authenticated,service_role;
create trigger case_communications_immutable before update or delete on public.case_communications for each row execute function private.investigation_revision_immutable();
create trigger case_publications_immutable before update or delete on public.case_publications for each row execute function private.investigation_revision_immutable();

create function private.portal_access(_case uuid,_actor uuid) returns text
language sql stable security definer set search_path='' as $$
 select coalesce(private.investigation_access(_case,_actor),
   (select 'customer' from public.case_customers cc where cc.case_id=_case and cc.user_id=_actor
    and cc.active and (cc.expires_at is null or cc.expires_at>now())))
$$;
revoke all on function private.portal_access(uuid,uuid) from public,anon,authenticated;
create function private.portal_store(_actor uuid,_op text,_args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare cid uuid; rid uuid; role_name text; c public.investigation_cases%rowtype;
 r public.investigation_revisions%rowtype; intake public.case_intake%rowtype;
 pub public.case_publications%rowtype; result jsonb; existing_fp text; existing_actor uuid;
 org bigint; target uuid; event_kind text; rec record;
begin
 if not exists(select 1 from auth.users where id=_actor) then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 if _op='principal' then
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'role',private.investigation_factory_role(f.id,_actor))),'[]'::jsonb)
   into result from public.factories f where private.investigation_factory_role(f.id,_actor) is not null;
  return jsonb_build_object('factories',result,'isCustomer',exists(select 1 from public.case_customers where user_id=_actor and active and (expires_at is null or expires_at>now())));
 end if;
 if _op='intake_submit' then
  org:=(_args->>'organizationId')::bigint; rid:=(_args->>'id')::uuid;
  if not exists(select 1 from public.organizations where id=org) then raise exception 'INTAKE_NOT_CONFIGURED'; end if;
  -- Serialize duplicate UUIDs before checking the receipt, including concurrent retries.
  perform pg_advisory_xact_lock(hashtextextended('portal-intake:'||rid::text,0));
  select fingerprint,requester into existing_fp,existing_actor from public.case_intake where id=rid;
  if found then
   if existing_fp<>_args->>'fingerprint' or existing_actor<>_actor then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
  else insert into public.case_intake(id,requester,organization_id,payload,fingerprint)
   values(rid,_actor,org,_args->'payload',_args->>'fingerprint'); end if;
  return jsonb_build_object('id',rid);
 end if;
 if _op='intake_list' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select i.id,i.requester,i.payload,i.case_id as "caseId",i.created_at as "at"
   from public.case_intake i where i.requester=_actor or exists(
    select 1 from public.organization_members om where om.organization_id=i.organization_id and om.user_id=_actor and om.status='active' and om.role in ('owner','admin','analyst'))
   order by i.created_at desc limit 100) x;
  return jsonb_build_object('requests',result);
 end if;
 if _op='intake_read' then
  select * into intake from public.case_intake where id=(_args->>'id')::uuid;
  if intake.id is null or not exists(select 1 from public.organization_members where organization_id=intake.organization_id and user_id=_actor and status='active' and role in ('owner','admin')) then raise exception 'INTAKE_ACCESS_DENIED' using errcode='42501'; end if;
  return to_jsonb(intake);
 end if;
 if _op='accept' then
  select * into intake from public.case_intake where id=(_args->>'id')::uuid for update;
  if intake.id is null or not exists(select 1 from public.factories f where f.id=(_args->>'factoryId')::bigint and f.organization_id=intake.organization_id and private.investigation_factory_role(f.id,_actor) in ('owner','admin')) then raise exception 'INTAKE_ACCESS_DENIED' using errcode='42501'; end if;
  if intake.case_id is not null then return jsonb_build_object('caseId',intake.case_id); end if;
  cid:=(_args->>'caseId')::uuid;
  perform private.investigation_store(_actor,'create',cid,(_args->>'factoryId')::bigint,0,'intake:'||intake.id::text,_args->>'fingerprint',_args->'snapshot','{"kind":"edit","reason":"Accepted scoped intake"}');
  update public.investigation_cases set auto_publish=coalesce((_args->>'autoPublish')::boolean,false) where id=cid;
  insert into public.case_customers(case_id,user_id,granted_by) values(cid,intake.requester,_actor);
  update public.case_intake set case_id=cid where id=intake.id;
  return jsonb_build_object('caseId',cid);
 end if;
 if _op='list' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select c.id,c.factory_id as "factoryId",c.revision,private.portal_access(c.id,_actor) as role,
    r.snapshot->>'title' as title,r.snapshot#>>'{scope,site}' as site,r.snapshot->>'candidate' as candidate
   from public.investigation_cases c join public.investigation_revisions r on r.case_id=c.id and r.revision=c.revision
   where private.portal_access(c.id,_actor) is not null order by c.created_at desc limit 100) x;
  return jsonb_build_object('cases',result);
 end if;
 cid:=(_args->>'caseId')::uuid;
 select * into c from public.investigation_cases where id=cid for update;
 role_name:=private.portal_access(cid,_actor);
 if c.id is null or role_name is null then raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
 select * into r from public.investigation_revisions where case_id=cid and revision=c.revision;
 if _op='bundle' then
  -- Full snapshot stays server-only. The HTTP adapter emits an allowlisted DTO.
  select * into pub from public.case_publications where case_id=cid order by created_at desc,id desc limit 1;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (
   select id,actor_role as role,kind,payload,created_at as "at" from public.case_communications where case_id=cid order by created_at desc,id desc limit 200) x;
  return jsonb_build_object('snapshot',r.snapshot,'role',role_name,'lastEditor',c.last_editor,'snapshotSha256',r.snapshot_sha256,
   'integrityValid',r.snapshot_sha256=encode(sha256(convert_to(r.snapshot::text,'UTF8')),'hex'),
   'publication',case when pub.id is not null and pub.revision=c.revision and pub.snapshot_sha256=r.snapshot_sha256 and not exists(select 1 from public.case_communications where case_id=cid and kind='withdraw' and created_at>=pub.created_at) then to_jsonb(pub) else null end,
   'communications',result);
 end if;
 if _op='grant' then
  if role_name<>'manager' then raise exception 'CASE_ASSIGN_DENIED' using errcode='42501'; end if;
  target:=(_args->>'userId')::uuid;
  insert into public.case_customers(case_id,user_id,active,expires_at,granted_by)
   values(cid,target,(_args->>'active')::boolean,(_args->>'expiresAt')::timestamptz,_actor)
   on conflict(case_id,user_id) do update set active=excluded.active,expires_at=excluded.expires_at,granted_by=excluded.granted_by;
  return jsonb_build_object('ok',true);
 end if;
 rid:=(_args->>'id')::uuid;
 if _op='publish' then
  if role_name<>'manager' then raise exception 'PUBLISH_DENIED' using errcode='42501'; end if;
  select fingerprint,published_by into existing_fp,existing_actor from public.case_publications where id=rid;
  if found then
   if existing_fp<>_args->>'fingerprint' or existing_actor<>_actor then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
   return jsonb_build_object('id',rid);
  end if;
  if c.revision<>(_args->>'expectedRevision')::integer or r.snapshot_sha256<>_args->>'snapshotSha256' then raise exception 'STALE_CASE_REVISION' using errcode='40001'; end if;
  target:=(_args->>'reviewerId')::uuid;
  if target=c.last_editor or not exists(select 1 from public.investigation_assignments where case_id=cid and user_id=target and role='reviewer' and active and (expires_at is null or expires_at>now())) or private.investigation_factory_role(c.factory_id,target) is null then raise exception 'INDEPENDENT_REVIEWER_REQUIRED' using errcode='42501'; end if;
  insert into public.case_publications(id,case_id,revision,projection,snapshot_sha256,method_version,reviewer_id,published_by,fingerprint)
   values(rid,cid,c.revision,_args->'projection',r.snapshot_sha256,_args->>'methodVersion',target,_actor,_args->>'fingerprint');
  return jsonb_build_object('id',rid);
 end if;
 if _op='communicate' then
  -- Authorized retries return their original receipt even after the case advances.
  perform pg_advisory_xact_lock(hashtextextended('portal-message:'||rid::text,0));
  select fingerprint,actor into existing_fp,existing_actor from public.case_communications where id=rid;
  if found then
   if existing_fp<>_args->>'fingerprint' or existing_actor<>_actor then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
   return jsonb_build_object('id',rid);
  end if;
  event_kind:=_args->>'kind';
  if event_kind in ('evidence_request','withdraw') and role_name not in ('manager','investigator') then raise exception 'STAFF_ACTION_REQUIRED' using errcode='42501'; end if;
  if event_kind='decision' then
   if role_name<>'customer' or not exists(select 1 from public.case_publications p where p.id=(_args#>>'{payload,publicationId}')::uuid and p.case_id=cid and p.revision=c.revision and p.snapshot_sha256=r.snapshot_sha256 and not exists(select 1 from public.case_communications w where w.case_id=cid and w.kind='withdraw' and w.created_at>=p.created_at)) then raise exception 'CURRENT_PUBLICATION_REQUIRED' using errcode='42501'; end if;
  end if;
  if event_kind='evidence_reply' and not exists(select 1 from public.case_communications where id=(_args#>>'{payload,requestId}')::uuid and case_id=cid and kind='evidence_request') then raise exception 'EVIDENCE_REQUEST_MISSING'; end if;
  insert into public.case_communications(id,case_id,actor,actor_role,kind,payload,fingerprint)
   values(rid,cid,_actor,role_name,event_kind,_args->'payload',_args->>'fingerprint');
  return jsonb_build_object('id',rid);
 end if;
 raise exception 'INVALID_PORTAL_OPERATION';
end $$;
revoke all on function private.portal_store(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function private.portal_store(uuid,text,jsonb) to service_role;
create function public.portal_store(_actor uuid,_op text,_args jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select private.portal_store(_actor,_op,_args) $$;
revoke all on function public.portal_store(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.portal_store(uuid,text,jsonb) to service_role;
create or replace function private.investigation_store(
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
    -- The manager authorizes this policy on intake acceptance. Publication and
    -- independent review commit in the same transaction and share retry identity.
    if c.auto_publish and _event->>'kind'='review' and _event->>'decision'='accept' then
      if jsonb_typeof(_event->'customerPublication') <> 'object' or _event->>'publicationId' is null then
        raise exception 'CUSTOMER_PROJECTION_REQUIRED';
      end if;
      insert into public.case_publications(id,case_id,revision,projection,snapshot_sha256,method_version,reviewer_id,published_by,fingerprint)
       values((_event->>'publicationId')::uuid,_case,c.revision+1,_event->'customerPublication',
        encode(sha256(convert_to(_snapshot::text,'UTF8')),'hex'),_event->>'methodVersion',_actor,_actor,_fingerprint);
    end if;
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
notify pgrst,'reload schema';
commit;
