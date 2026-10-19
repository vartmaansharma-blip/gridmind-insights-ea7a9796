-- GM-3.1-001 / #146. Source-only; production reconciliation and review remain required.
begin;
create table public.electricity_cases (
 id uuid primary key default gen_random_uuid(),
 factory_id bigint not null references public.factories(id) on delete restrict,
 utility text not null check (utility in ('JBVNL','TSUISL','TSL','DVC','Other','Unknown')),
 bill_from date not null, bill_to date not null,
 issue text not null check (length(btrim(issue)) between 10 and 4000),
 investigator_id uuid not null references auth.users(id) on delete restrict,
 status text not null default 'opened' check (status in ('opened','investigating','awaiting_expert','closed_inconclusive')),
 origin text not null default 'synthetic' check (origin='synthetic'),
 revision integer not null default 1 check (revision>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 check (bill_to>=bill_from and bill_to-bill_from<=366)
);
create index electricity_cases_factory on public.electricity_cases(factory_id);
create index electricity_cases_investigator on public.electricity_cases(investigator_id);
create index electricity_cases_creator on public.electricity_cases(created_by);
create table public.electricity_evidence (
 id uuid primary key,
 case_id uuid not null references public.electricity_cases(id) on delete restrict,
 object_path text not null unique,
 filename text not null check (length(filename) between 1 and 180 and filename !~ '[/\\]' and filename !~ '[[:cntrl:]]'),
 mime text not null check (mime in ('application/pdf','image/png','image/jpeg')),
 bytes integer not null check (bytes between 1 and 10485760),
 state text not null default 'pending' check (state in ('pending','uploaded')),
 uploaded_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 check(object_path=case_id::text || '/' || id::text)
);
create index electricity_evidence_case on public.electricity_evidence(case_id);
create index electricity_evidence_actor on public.electricity_evidence(uploaded_by);
create table public.electricity_events (
 id bigint generated always as identity primary key,
 case_id uuid not null references public.electricity_cases(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 kind text not null check (kind in ('case_created','status_changed','evidence_uploaded')),
 detail jsonb not null,
 created_at timestamptz not null default now()
);
create index electricity_events_case on public.electricity_events(case_id,id);
create index electricity_events_actor on public.electricity_events(actor_id);
alter table public.electricity_cases enable row level security;
alter table public.electricity_evidence enable row level security;
alter table public.electricity_events enable row level security;
revoke all on public.electricity_cases,public.electricity_evidence,public.electricity_events from public,anon,authenticated,service_role;
grant select on public.electricity_cases,public.electricity_evidence,public.electricity_events to authenticated;

-- Reuse membership semantics but additionally fail closed for suspended organizations.
create function private.electricity_factory_role(_factory bigint, _actor uuid) returns text
language sql stable security definer set search_path='' as $$
 select private.investigation_factory_role(_factory,_actor)
 from public.factories f join public.organizations o on o.id=f.organization_id
 where f.id=_factory and o.status='active'
$$;
revoke all on function private.electricity_factory_role(bigint,uuid) from public,anon,authenticated,service_role;

-- Deliberately not accepting an actor argument: identity comes exclusively from JWT.
create function private.electricity_access(_case uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'is_anonymous' is distinct from 'true' and exists (
 select 1 from public.electricity_cases c
 where c.id=_case and (
 private.electricity_factory_role(c.factory_id,auth.uid()) in ('owner','admin')
 or (c.investigator_id=auth.uid() and private.electricity_factory_role(c.factory_id,auth.uid())='analyst')))
$$;
revoke all on function private.electricity_access(uuid) from public,anon;
grant execute on function private.electricity_access(uuid) to authenticated;
create policy electricity_case_read on public.electricity_cases for select to authenticated using(private.electricity_access(id));
create policy electricity_evidence_read on public.electricity_evidence for select to authenticated using(private.electricity_access(case_id));
create policy electricity_event_read on public.electricity_events for select to authenticated using(private.electricity_access(case_id));
create trigger electricity_events_immutable before update or delete on public.electricity_events for each row execute function private.investigation_revision_immutable();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('electricity-bills','electricity-bills',false,10485760,array['application/pdf','image/png','image/jpeg']);
create policy electricity_bill_insert on storage.objects for insert to authenticated with check (
 bucket_id='electricity-bills' and exists(select 1 from public.electricity_evidence e
 where e.object_path=name and e.uploaded_by=auth.uid() and e.state='pending'
 and e.created_at>now()-interval '1 hour' and private.electricity_access(e.case_id)
 and exists(select 1 from public.electricity_cases c where c.id=e.case_id and c.status<>'closed_inconclusive')));
create policy electricity_bill_read on storage.objects for select to authenticated using (
 bucket_id='electricity-bills' and exists(select 1 from public.electricity_evidence e
 where e.object_path=name and e.state='uploaded' and private.electricity_access(e.case_id)));
-- No UPDATE/DELETE policies: a new document is a new evidence record, never replacement.

create function private.electricity_command(_command jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid(); op text:=_command->>'action'; c public.electricity_cases%rowtype;
 e public.electricity_evidence%rowtype; cid uuid; fid bigint; assignee uuid; next_status text;
 result jsonb;
begin
 if actor is null or coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb->>'is_anonymous'='true' then
 raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 if _command is null or jsonb_typeof(_command)<>'object' or octet_length(_command::text)>16000 then
 raise exception 'INVALID_COMMAND' using errcode='22023'; end if;
 if op='options' then
 select jsonb_build_object('sites',coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'organizationId',o.id,'organization',o.name,'investigators',(
 select coalesce(jsonb_agg(jsonb_build_object('id',fm.user_id,'role',fm.role)), '[]'::jsonb)
 from public.factory_members fm where fm.factory_id=f.id
 and private.electricity_factory_role(f.id,fm.user_id) in ('owner','admin','analyst')))), '[]'::jsonb)) into result
 from public.factories f join public.organizations o on o.id=f.organization_id
 where private.electricity_factory_role(f.id,actor) in ('owner','admin');
 return result;
 elsif op='list' then
 select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into result from (
 select ec.*,f.name site,o.name organization from public.electricity_cases ec
 join public.factories f on f.id=ec.factory_id join public.organizations o on o.id=f.organization_id
 where private.electricity_access(ec.id) order by ec.created_at desc limit 100) x;
 return result;
 elsif op='create' then
 cid:=(_command->>'id')::uuid; fid:=(_command->>'factoryId')::bigint; assignee:=(_command->>'investigatorId')::uuid;
 if coalesce(private.electricity_factory_role(fid,actor),'') not in ('owner','admin')
 or coalesce(private.electricity_factory_role(fid,assignee),'') not in ('owner','admin','analyst') then
 raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
 insert into public.electricity_cases(id,factory_id,utility,bill_from,bill_to,issue,investigator_id,created_by)
 values(cid,fid,_command->>'utility',(_command->>'from')::date,(_command->>'to')::date,btrim(_command->>'issue'),assignee,actor)
 on conflict(id) do nothing;
 select * into c from public.electricity_cases where id=cid for update;
 if c.created_by<>actor or c.factory_id<>fid or c.utility<>_command->>'utility'
 or c.bill_from<>(_command->>'from')::date or c.bill_to<>(_command->>'to')::date
 or c.issue<>btrim(_command->>'issue') or c.investigator_id<>assignee then
 raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
 if not exists(select 1 from public.electricity_events where case_id=cid and kind='case_created') then
 insert into public.electricity_events(case_id,actor_id,kind,detail) values(cid,actor,'case_created',jsonb_build_object('status','opened','investigatorId',assignee)); end if;
 return to_jsonb(c);
 end if;
 cid:=(_command->>'caseId')::uuid;
 if not private.electricity_access(cid) then raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
 select * into c from public.electricity_cases where id=cid for update;
 if op='load' then
 return jsonb_build_object('case',to_jsonb(c),'site',(select name from public.factories where id=c.factory_id),
 'organization',(select o.name from public.organizations o join public.factories f on f.organization_id=o.id where f.id=c.factory_id),
 'evidence',(select coalesce(jsonb_agg(to_jsonb(ev) order by ev.created_at),'[]'::jsonb) from public.electricity_evidence ev where ev.case_id=cid),
 'events',(select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]'::jsonb) from public.electricity_events a where a.case_id=cid));
 elsif op='status' then
 if c.revision is distinct from (_command->>'revision')::integer then raise exception 'STALE_REVISION' using errcode='40001'; end if;
 next_status:=_command->>'status';
 if not ((c.status='opened' and next_status in ('investigating','closed_inconclusive'))
 or(c.status='investigating' and next_status in ('awaiting_expert','closed_inconclusive'))
 or(c.status='awaiting_expert' and next_status in ('investigating','closed_inconclusive'))) then
 raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
 update public.electricity_cases set status=next_status,revision=revision+1 where id=cid returning * into c;
 insert into public.electricity_events(case_id,actor_id,kind,detail) values(cid,actor,'status_changed',jsonb_build_object('status',next_status,'revision',c.revision));
 return to_jsonb(c);
 elsif op='reserve' then
 if c.status='closed_inconclusive' then raise exception 'CASE_CLOSED' using errcode='22023'; end if;
 insert into public.electricity_evidence(id,case_id,object_path,filename,mime,bytes,uploaded_by)
 values((_command->>'id')::uuid,cid,cid::text||'/'||(_command->>'id')::uuid::text,_command->>'filename',_command->>'mime',(_command->>'bytes')::integer,actor)
 on conflict(id) do nothing;
 select * into e from public.electricity_evidence where id=(_command->>'id')::uuid;
 if e.case_id<>cid or e.uploaded_by<>actor or e.filename<>_command->>'filename' or e.mime<>_command->>'mime' or e.bytes<>(_command->>'bytes')::integer then
 raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
 return to_jsonb(e);
 elsif op='finalize' then
 if c.status='closed_inconclusive' then raise exception 'CASE_CLOSED' using errcode='22023'; end if;
 select * into e from public.electricity_evidence where id=(_command->>'id')::uuid and case_id=cid for update;
 if e.id is null or e.uploaded_by<>actor then raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='electricity-bills' and o.name=e.object_path
 and (o.metadata->>'size')::bigint=e.bytes and o.metadata->>'mimetype'=e.mime) then
 raise exception 'UPLOAD_INCOMPLETE' using errcode='22023'; end if;
 if e.state='pending' then
 update public.electricity_evidence set state='uploaded' where id=e.id returning * into e;
 insert into public.electricity_events(case_id,actor_id,kind,detail) values(cid,actor,'evidence_uploaded',jsonb_build_object('evidenceId',e.id,'verification','unverified'));
 end if;
 return to_jsonb(e);
 end if;
 raise exception 'INVALID_COMMAND' using errcode='22023';
end $$;
revoke all on function private.electricity_command(jsonb) from public,anon;
grant execute on function private.electricity_command(jsonb) to authenticated;
create function public.electricity_command(_command jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.electricity_command(_command) $$;
revoke all on function public.electricity_command(jsonb) from public,anon;
grant execute on function public.electricity_command(jsonb) to authenticated;
commit;
