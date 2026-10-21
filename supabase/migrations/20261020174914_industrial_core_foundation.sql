-- GM-CORE-003: source-only, synthetic-only; no authorization to apply to shared/production DB.
-- Existing organization/factory/Auth identities remain authoritative. No alternate tenant model.
begin;
create table private.industrial_core_gate(singleton boolean primary key default true check(singleton),enabled boolean not null default false);
insert into private.industrial_core_gate values(true,false);
create table private.industrial_core_authorities(
 organization_id bigint not null references public.organizations(id),
 factory_id bigint not null references public.factories(id),
 user_id uuid not null references auth.users(id),
 capability text not null check(capability in('read','edit','commercial','quality','safety','finance','sharing')),
 expires_at timestamptz not null, granted_by uuid not null references auth.users(id),
 basis text not null check(length(basis) between 10 and 1000),
 primary key(factory_id,user_id,capability)
);
-- Provision only through separately reviewed operator change control, never by an admin UI toggle.
create table private.industrial_core_sharing(
 from_organization_id bigint not null references public.organizations(id),
 to_organization_id bigint not null references public.organizations(id),
 record_id text not null check(length(record_id) between 1 and 100),
 approved_by uuid not null references auth.users(id),expires_at timestamptz not null,
 basis text not null check(length(basis) between 10 and 1000),
 primary key(from_organization_id,to_organization_id,record_id),
 check(from_organization_id<>to_organization_id)
);
alter table private.industrial_core_gate enable row level security;
alter table private.industrial_core_authorities enable row level security;
alter table private.industrial_core_sharing enable row level security;
revoke all on private.industrial_core_gate,private.industrial_core_authorities,private.industrial_core_sharing from public,anon,authenticated,service_role;
create table public.industrial_core_workspaces(
 id uuid primary key,organization_id bigint not null references public.organizations(id),
 factory_id bigint not null references public.factories(id),origin text not null default 'synthetic' check(origin='synthetic'),
 revision integer not null default 0 check(revision between 0 and 200),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 unique(id,factory_id,organization_id)
);
create index industrial_core_factory_idx on public.industrial_core_workspaces(factory_id,organization_id);
create table public.industrial_core_revisions(
 workspace_id uuid not null references public.industrial_core_workspaces(id),
 revision integer not null check(revision between 1 and 200),
 request_key text not null check(length(request_key) between 1 and 100),
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and snapshot->>'origin'='synthetic' and snapshot#>>'{input,origin}'='synthetic' and octet_length(snapshot::text)<=2000000),
 snapshot_sha256 text not null check(snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 event jsonb not null check(jsonb_typeof(event)='object' and octet_length(event::text)<=2000),
 actor_id uuid not null references auth.users(id),created_at timestamptz not null default now(),
 previous_sha256 text not null,entry_sha256 text not null,
 primary key(workspace_id,revision),unique(workspace_id,request_key)
);
alter table public.industrial_core_workspaces enable row level security;
alter table public.industrial_core_revisions enable row level security;
revoke all on public.industrial_core_workspaces,public.industrial_core_revisions from public,anon,authenticated,service_role;
grant select on public.industrial_core_workspaces,public.industrial_core_revisions to authenticated;

create function private.industrial_core_capabilities(_factory bigint,_actor uuid) returns text[]
language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(a.capability order by a.capability),'{}'::text[])
 from private.industrial_core_authorities a
 join public.factories f on f.id=a.factory_id and f.organization_id=a.organization_id
 join public.organizations o on o.id=f.organization_id and o.status='active'
 join public.organization_members om on om.organization_id=o.id and om.user_id=a.user_id and om.status='active'
 join public.factory_members fm on fm.factory_id=f.id and fm.organization_id=o.id and fm.user_id=a.user_id
 join auth.users u on u.id=a.user_id
 where a.factory_id=_factory and a.user_id=_actor and a.expires_at>now()
 and coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)=false
 and (select enabled from private.industrial_core_gate where singleton) is true
$$;
create function private.industrial_core_session(_actor uuid,_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
 where s.id=_session and s.user_id=_actor and coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)=false
 and (to_jsonb(s)->>'not_after' is null or (to_jsonb(s)->>'not_after')::timestamptz>now()))
$$;
create function private.industrial_core_read(_factory bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select 'read'=any(private.industrial_core_capabilities(_factory,auth.uid()))
 and private.industrial_core_session(auth.uid(),(coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'session_id')::uuid)
 and coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'is_anonymous' is distinct from 'true'
$$;
revoke all on function private.industrial_core_capabilities(bigint,uuid),private.industrial_core_session(uuid,uuid),private.industrial_core_read(bigint) from public,anon,authenticated,service_role;
grant execute on function private.industrial_core_read(bigint) to authenticated;
create policy industrial_core_workspace_read on public.industrial_core_workspaces for select to authenticated using(private.industrial_core_read(factory_id));
create policy industrial_core_revision_read on public.industrial_core_revisions for select to authenticated using(exists(select 1 from public.industrial_core_workspaces w where w.id=workspace_id and private.industrial_core_read(w.factory_id)));
create function private.industrial_core_immutable() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'CORE_HISTORY_IMMUTABLE' using errcode='42501'; end $$;
revoke all on function private.industrial_core_immutable() from public,anon,authenticated,service_role;
create trigger industrial_core_immutable before update or delete on public.industrial_core_revisions for each row execute function private.industrial_core_immutable();
create function private.industrial_core_digest(_snapshot jsonb,_event jsonb,_actor uuid,_at timestamptz,_previous text) returns text
language sql immutable set search_path='' as $$ select encode(sha256(convert_to(jsonb_build_object('snapshot',_snapshot,'event',_event,'actor',_actor,'epoch',extract(epoch from _at),'previous',_previous)::text,'UTF8')),'hex') $$;
revoke all on function private.industrial_core_digest(jsonb,jsonb,uuid,timestamptz,text) from public,anon,authenticated,service_role;

create function private.industrial_core_store(
 _op text,_actor uuid,_session uuid,_factory bigint,_workspace uuid,
 _expected integer default null,_key text default null,_fingerprint text default null,
 _snapshot jsonb default null,_event jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare org bigint; caps text[]; approver_caps text[]; head integer; found_row public.industrial_core_revisions%rowtype;
 previous_hash text; event_value jsonb; at_time timestamptz:=now(); required text[];
begin
 if (select enabled from private.industrial_core_gate where singleton) is distinct from true then raise exception 'CORE_DISABLED' using errcode='42501'; end if;
 if _actor is null or _session is null or not private.industrial_core_session(_actor,_session) then raise exception 'CORE_SESSION_DENIED' using errcode='42501'; end if;
 caps:=private.industrial_core_capabilities(_factory,_actor);
 if not ('read'=any(caps)) then raise exception 'CORE_ACCESS_DENIED' using errcode='42501'; end if;
 select organization_id into org from public.factories where id=_factory;
 if exists(select 1 from public.industrial_core_workspaces where id=_workspace and (factory_id<>_factory or organization_id<>org)) then raise exception 'CORE_ACCESS_DENIED' using errcode='42501'; end if;
 -- Serialize all operations for one workspace, including first creation. No check-then-insert race.
 perform pg_advisory_xact_lock(hashtextextended(_workspace::text,0));
 select revision into head from public.industrial_core_workspaces where id=_workspace;
 head:=coalesce(head,0);
 select * into found_row from public.industrial_core_revisions where workspace_id=_workspace and revision=head;
 if _op='context' then
  approver_caps:=private.industrial_core_capabilities(_factory,(found_row.snapshot#>>'{workflow,approvedBy}')::uuid);
  return jsonb_build_object('organizationId',org,'factoryId',_factory,'actorId',_actor,'capabilities',caps,'at',now(),'approverCapabilities',approver_caps);
 end if;
 if _op='receipt' then
  select * into found_row from public.industrial_core_revisions where workspace_id=_workspace and request_key=_key;
  if not found then return null; end if;
  if found_row.fingerprint is distinct from _fingerprint then raise exception 'CORE_IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
 elsif _op='append' then
  if _expected is null or _expected<0 or _key is null or length(_key) not between 1 and 100 or _fingerprint is null or _fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'CORE_INVALID_COMMAND' using errcode='22023'; end if;
  -- Rights checked again in the append transaction, not only during earlier context lookup.
  if _event->>'kind'='approve' then
   select array_agg(value) into required from jsonb_array_elements_text(_snapshot#>'{workflow,requiredAuthorities}');
   if required is null or not caps @> required or _snapshot#>>'{workflow,approvedBy}'<>_actor::text
    or _snapshot#>>'{workflow,proposedBy}'=_actor::text then raise exception 'CORE_APPROVAL_DENIED' using errcode='42501'; end if;
  elsif not ('edit'=any(caps)) then raise exception 'CORE_EDIT_DENIED' using errcode='42501'; end if;
  if _event->>'kind'='verify_input' and (not caps @> array['quality','commercial','safety'] or _snapshot->>'inputEditor'=_actor::text) then raise exception 'CORE_REVIEW_DENIED' using errcode='42501'; end if;
  select * into found_row from public.industrial_core_revisions where workspace_id=_workspace and request_key=_key;
  if found then
   if found_row.fingerprint is distinct from _fingerprint then raise exception 'CORE_IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
  else
   if _event->>'kind'='replace_input' and exists(select 1 from public.industrial_core_revisions where workspace_id=_workspace and event->>'kind'='replace_input' and event->>'sourceId'=_event->>'sourceId') then raise exception 'CORE_DUPLICATE_SOURCE' using errcode='40001'; end if;
   if _event->>'kind'='disruption' and exists(select 1 from public.industrial_core_revisions where workspace_id=_workspace and event->>'kind'='disruption' and event->>'eventId'=_event->>'eventId') then raise exception 'CORE_DUPLICATE_EVENT' using errcode='40001'; end if;
   if head<>_expected then raise exception 'CORE_VERSION_CONFLICT' using errcode='40001'; end if;
   if head>=200 then raise exception 'CORE_HISTORY_FULL' using errcode='22023'; end if;
   if _snapshot is null or jsonb_typeof(_snapshot) is distinct from 'object'
    or (_snapshot#>>'{input,organizationId}')::bigint is distinct from org or (_snapshot#>>'{input,factoryId}')::bigint is distinct from _factory
    or _snapshot->>'origin' is distinct from 'synthetic' or _snapshot#>>'{input,origin}' is distinct from 'synthetic'
    or exists(select 1 from jsonb_array_elements(_snapshot#>'{input,entities}') e where (e->>'ownerOrganizationId')::bigint is distinct from org)
    or exists(select 1 from jsonb_array_elements(_snapshot#>'{input,constraints}') r where (r->>'ownerOrganizationId')::bigint is distinct from org)
    then raise exception 'CORE_SCOPE_INVALID' using errcode='22023'; end if;
   if head=0 then insert into public.industrial_core_workspaces(id,organization_id,factory_id,created_by) values(_workspace,org,_factory,_actor); end if;
   previous_hash:=coalesce((select entry_sha256 from public.industrial_core_revisions where workspace_id=_workspace and revision=head),'GENESIS');
   event_value:=_event||jsonb_build_object('requestKey',_key,'fingerprint',_fingerprint,'revision',head+1);
   insert into public.industrial_core_revisions(workspace_id,revision,request_key,fingerprint,snapshot,snapshot_sha256,event,actor_id,created_at,previous_sha256,entry_sha256)
   values(_workspace,head+1,_key,_fingerprint,_snapshot,encode(sha256(convert_to(_snapshot::text,'UTF8')),'hex'),event_value,_actor,at_time,previous_hash,private.industrial_core_digest(_snapshot,event_value,_actor,at_time,previous_hash)) returning * into found_row;
   update public.industrial_core_workspaces set revision=head+1 where id=_workspace;
  end if;
 elsif _op<>'load' then raise exception 'CORE_UNKNOWN_OPERATION' using errcode='22023'; end if;
 -- Validate every retained link and critical payload, not only the newest snapshot.
 if exists(select 1 from (select r.*,lag(entry_sha256) over(order by revision) prior from public.industrial_core_revisions r where workspace_id=_workspace) chain
 where previous_sha256 is distinct from coalesce(prior,'GENESIS')
 or entry_sha256 is distinct from private.industrial_core_digest(snapshot,event,actor_id,created_at,previous_sha256)
 or snapshot_sha256 is distinct from encode(sha256(convert_to(snapshot::text,'UTF8')),'hex')) then raise exception 'CORE_AUDIT_INTEGRITY_FAILED' using errcode='22023'; end if;
 return jsonb_build_object('revision',coalesce(found_row.revision,0),'snapshot',found_row.snapshot,'snapshotSha256',found_row.snapshot_sha256,'integrityValid',true,
 'replayed',_op='receipt','audit',coalesce((select jsonb_agg(jsonb_build_object('revision',r.revision,'actorId',r.actor_id,'at',r.created_at,'event',r.event,'snapshotSha256',r.snapshot_sha256) order by r.revision) from public.industrial_core_revisions r where r.workspace_id=_workspace and r.revision<=coalesce(found_row.revision,0)),'[]'::jsonb));
end $$;
create function public.industrial_core_store(
 _op text,_actor uuid,_session uuid,_factory bigint,_workspace uuid,
 _expected integer default null,_key text default null,_fingerprint text default null,_snapshot jsonb default null,_event jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path='' as $$ select private.industrial_core_store(_op,_actor,_session,_factory,_workspace,_expected,_key,_fingerprint,_snapshot,_event) $$;
revoke all on function private.industrial_core_store(text,uuid,uuid,bigint,uuid,integer,text,text,jsonb,jsonb),public.industrial_core_store(text,uuid,uuid,bigint,uuid,integer,text,text,jsonb,jsonb) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.industrial_core_store(text,uuid,uuid,bigint,uuid,integer,text,text,jsonb,jsonb),public.industrial_core_store(text,uuid,uuid,bigint,uuid,integer,text,text,jsonb,jsonb) to service_role;
commit;
