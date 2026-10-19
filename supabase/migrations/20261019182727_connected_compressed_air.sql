-- Source-only; disabled until a disposable acceptance fixture enables this private gate.
-- Reuses existing cases, assignments, organization/factory membership and assets.
begin;
create table private.compressed_air_gate (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default false
);
insert into private.compressed_air_gate default values;
revoke all on private.compressed_air_gate from public,anon,authenticated,service_role;
create table public.compressed_air_revisions (
  case_id uuid not null references public.investigation_cases(id) on delete restrict,
  revision integer not null check(revision>0),
  asset_id bigint not null references public.factory_assets(id) on delete restrict,
  request_key text not null check(length(request_key) between 1 and 200),
  fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=8000000
    and snapshot->>'origin'='synthetic'),
  snapshot_sha256 text not null,
  report jsonb,
  report_sha256 text,
  check ((event='export' and report is not null and jsonb_typeof(report)='object'
    and octet_length(report::text)<=8000000 and report_sha256 is not null and report_sha256 ~ '^[a-f0-9]{64}$')
    or (event<>'export' and report is null and report_sha256 is null)),
  event text not null check(event in ('import','review','propose','approve','complete','verifyOutcome','export')),
  actor_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(case_id,revision), unique(case_id,request_key)
);
create index compressed_air_revisions_asset_idx on public.compressed_air_revisions(asset_id);
alter table public.compressed_air_revisions enable row level security;
revoke all on public.compressed_air_revisions from public,anon,authenticated,service_role;
create trigger compressed_air_revisions_immutable before update or delete on public.compressed_air_revisions
  for each row execute function private.investigation_revision_immutable();

create function private.compressed_air_store(
  _actor uuid,_op text,_case uuid,_expected integer default null,
  _key text default null,_fingerprint text default null,_snapshot jsonb default null,
  _event jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  c public.investigation_cases%rowtype;
  previous public.compressed_air_revisions%rowtype;
  result public.compressed_air_revisions%rowtype;
  access_role text;
  head integer;
  asset bigint;
  organization bigint;
  kind text := _event->>'kind';
  replay boolean := false;
  report_value jsonb;
begin
  if (select enabled from private.compressed_air_gate where singleton) is distinct from true then
    raise exception 'COMPRESSED_AIR_DISABLED' using errcode='42501'; end if;
  if _actor is null or not exists(select 1 from auth.users u where id=_actor
    and coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)=false) then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  -- Parent lock serializes append/retry and assignment revocation with existing case commands.
  select * into c from public.investigation_cases where id=_case for update;
  access_role:=private.investigation_access(_case,_actor);
  if c.id is null or access_role is null or not exists (
    select 1 from public.factories f join public.organizations o on o.id=f.organization_id
    where f.id=c.factory_id and o.status='active'
  ) then raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
  select organization_id into organization from public.factories where id=c.factory_id;
  if _op='scope' then
    return jsonb_build_object('organizationId',organization::text,'siteId',c.factory_id::text,
      'assets',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) order by id),'[]'::jsonb)
        from public.factory_assets where factory_id=c.factory_id));
  end if;
  select * into previous from public.compressed_air_revisions where case_id=_case order by revision desc limit 1;
  head:=coalesce(previous.revision,0);
  if _op in ('receipt','append') then
    select * into result from public.compressed_air_revisions where case_id=_case and request_key=_key;
    if found then
      if result.fingerprint is distinct from _fingerprint or result.actor_id<>_actor then
        raise exception 'IDEMPOTENCY_CONFLICT' using errcode='40001'; end if;
      replay:=true;
    elsif _op='receipt' then return jsonb_build_object('found',false);
    else
      if _expected is distinct from head then raise exception 'STALE_CASE_REVISION' using errcode='40001'; end if;
      if _snapshot is null or _snapshot->>'origin' is distinct from 'synthetic'
        or _snapshot->>'method' is distinct from 'compressed-air-context-envelope-v1'
        or _snapshot->'dataset'->>'origin' is distinct from 'synthetic'
        or _snapshot->'dataset'->'scope'->>'organizationId' is distinct from organization::text
        or _snapshot->'dataset'->'scope'->>'siteId' is distinct from c.factory_id::text
        then raise exception 'INVALID_AIR_SCOPE' using errcode='22023'; end if;
      asset:=(_snapshot->'dataset'->'scope'->>'assetId')::bigint;
      if not exists(select 1 from public.factory_assets where id=asset and factory_id=c.factory_id)
        then raise exception 'CASE_ACCESS_DENIED' using errcode='42501'; end if;
      if _snapshot->'dataset'->>'sourceSha256' is distinct from encode(sha256(convert_to(_snapshot->>'csv','UTF8')),'hex')
        then raise exception 'AIR_SOURCE_INTEGRITY_FAILED' using errcode='22023'; end if;
      if kind='import' then
        if access_role not in ('manager','investigator') then raise exception 'CASE_EDIT_DENIED' using errcode='42501'; end if;
        if _snapshot->>'importedBy' is distinct from _actor::text or
          (_snapshot->>'importRevision')::integer is distinct from head+1 or
          _snapshot->'review' is distinct from 'null'::jsonb or _snapshot->'actions' is distinct from '[]'::jsonb or _snapshot->'verification' is distinct from 'null'::jsonb
          then raise exception 'INVALID_AIR_IMPORT' using errcode='22023'; end if;
      else
        if head=0 then raise exception 'AIR_IMPORT_REQUIRED' using errcode='22023'; end if;
        if (_snapshot - array['review','actions','verification']) is distinct from (previous.snapshot - array['review','actions','verification'])
          then raise exception 'AIR_SOURCE_IMMUTABLE' using errcode='22023'; end if;
        if kind='review' then
          if not exists(select 1 from public.investigation_assignments where case_id=_case and user_id=_actor
            and role='reviewer' and active and (expires_at is null or expires_at>now()))
            or previous.snapshot->>'importedBy'=_actor::text then
            raise exception 'INDEPENDENT_REVIEWER_REQUIRED' using errcode='42501'; end if;
          if _snapshot->'review'->>'actorId' is distinct from _actor::text
            or _snapshot->'review'->>'datasetHash' is distinct from previous.snapshot->>'datasetHash'
            or _snapshot->'review'->>'simulated' is distinct from 'true'
            or _snapshot->'actions' is distinct from '[]'::jsonb or _snapshot->'verification' is distinct from 'null'::jsonb
            then raise exception 'INVALID_AIR_REVIEW' using errcode='22023'; end if;
        elsif kind='verifyOutcome' then
          if access_role not in ('manager','investigator') then raise exception 'CASE_EDIT_DENIED' using errcode='42501'; end if;
          if _snapshot->'review' is distinct from previous.snapshot->'review'
            or _snapshot->'actions' is distinct from previous.snapshot->'actions'
            or _snapshot->'review'->>'decision' is distinct from 'accept'
            or not exists(select 1 from jsonb_array_elements(_snapshot->'actions') a where a->>'status'='completed')
            or _snapshot->'verification'->>'actorId' is distinct from _actor::text
            or _snapshot->'verification'->>'datasetHash' is distinct from _snapshot->>'datasetHash'
            or _snapshot->'verification'->>'outcome' is distinct from 'inconclusive'
            then raise exception 'INVALID_AIR_VERIFICATION' using errcode='22023'; end if;
        elsif kind='export' then
          if _snapshot is distinct from previous.snapshot then raise exception 'AIR_EXPORT_IMMUTABLE' using errcode='22023'; end if;
        elsif kind in ('propose','approve','complete') then
          if access_role not in ('manager','investigator') then raise exception 'CASE_EDIT_DENIED' using errcode='42501'; end if;
          if kind='approve' and access_role<>'manager' then raise exception 'CASE_ASSIGN_DENIED' using errcode='42501'; end if;
          if _snapshot->'verification' is distinct from 'null'::jsonb
            or _snapshot->'review' is distinct from previous.snapshot->'review'
            or _snapshot->'review'->>'decision' is distinct from 'accept'
            then raise exception 'AIR_ACCEPTED_REVIEW_REQUIRED' using errcode='22023'; end if;
        else raise exception 'INVALID_CASE_COMMAND' using errcode='22023'; end if;
      end if;
      if kind='export' then
        report_value:=_event->'report';
        if jsonb_typeof(report_value) is distinct from 'object'
          or report_value->'dataset' is distinct from _snapshot->'dataset'
          or report_value->>'originalCsv' is distinct from _snapshot->>'csv'
          or report_value->>'datasetHash' is distinct from _snapshot->>'datasetHash'
          or report_value->'engineerReview' is distinct from _snapshot->'review'
          or report_value->'actions' is distinct from _snapshot->'actions'
          or report_value->'outcomeVerification' is distinct from _snapshot->'verification'
          then raise exception 'INVALID_AIR_REPORT' using errcode='22023'; end if;
        report_value:=report_value || jsonb_build_object('caseId',_case,'revision',head+1,
          'snapshotSha256',encode(sha256(convert_to(_snapshot::text,'UTF8')),'hex'),
          'exportedBy',_actor,'exportedAt',now());
      end if;
      insert into public.compressed_air_revisions(case_id,revision,asset_id,request_key,fingerprint,
        snapshot,snapshot_sha256,event,actor_id,report,report_sha256)
      values(_case,head+1,asset,_key,_fingerprint,_snapshot,
        encode(sha256(convert_to(_snapshot::text,'UTF8')),'hex'),kind,_actor,report_value,
        case when report_value is not null then encode(sha256(convert_to(report_value::text,'UTF8')),'hex') end) returning * into result;
      head:=result.revision;
    end if;
  elsif _op='read' then
    if _expected is null then result:=previous;
    else select * into result from public.compressed_air_revisions where case_id=_case and revision=_expected;
      if not found then raise exception 'AIR_REVISION_MISSING' using errcode='22023'; end if;
    end if;
  else raise exception 'INVALID_STORE_OPERATION' using errcode='22023'; end if;
  if result.revision is not null and result.snapshot_sha256<>encode(sha256(convert_to(result.snapshot::text,'UTF8')),'hex')
    then raise exception 'AIR_SOURCE_INTEGRITY_FAILED' using errcode='22023'; end if;
  if result.report is not null and result.report_sha256 is distinct from encode(sha256(convert_to(result.report::text,'UTF8')),'hex')
    then raise exception 'AIR_REPORT_INTEGRITY_FAILED' using errcode='22023'; end if;
  return jsonb_build_object('caseId',_case,'revision',coalesce(result.revision,0),'headRevision',head,
    'role',access_role,'snapshot',result.snapshot,'snapshotSha256',result.snapshot_sha256,
    'actorId',result.actor_id,'at',result.created_at,'replayed',replay,
    'report',result.report,'reportSha256',result.report_sha256);
end $$;
revoke all on function private.compressed_air_store(uuid,text,uuid,integer,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.compressed_air_store(uuid,text,uuid,integer,text,text,jsonb,jsonb) to service_role;
create function public.compressed_air_store(
  _actor uuid,_op text,_case uuid,_expected integer default null,
  _key text default null,_fingerprint text default null,_snapshot jsonb default null,
  _event jsonb default '{}'::jsonb
) returns jsonb language sql security invoker set search_path='' as $$
  select private.compressed_air_store(_actor,_op,_case,_expected,_key,_fingerprint,_snapshot,_event)
$$;
revoke all on function public.compressed_air_store(uuid,text,uuid,integer,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.compressed_air_store(uuid,text,uuid,integer,text,text,jsonb,jsonb) to service_role;
comment on table public.compressed_air_revisions is 'Isolated synthetic method attachments; no industrial validation or customer release.';
notify pgrst,'reload schema';
commit;
