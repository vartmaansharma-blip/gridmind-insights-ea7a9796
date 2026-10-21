-- GridMind MVP: reference server-owned analysis runs from an existing synthetic case.
-- A link is NOT a validated technical finding, review, or customer publication.
-- Feature is disabled unless run inside the disposable local integration fixture.
begin;
create table public.synthetic_case_analysis_references (
  case_id uuid not null references public.investigation_cases(id) on delete restrict,
  run_id bigint not null references public.factory_analysis_runs(id) on delete restrict,
  factory_id bigint not null references public.factories(id) on delete restrict,
  asset_id bigint not null references public.factory_assets(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict,
  result_fingerprint text not null check(length(result_fingerprint) between 1 and 100),
  status text not null default 'synthetic_unreviewed_reference'
    check(status='synthetic_unreviewed_reference'),
  linked_at timestamptz not null default now(),
  primary key(case_id,run_id)
);
create index synthetic_case_analysis_references_factory_idx
  on public.synthetic_case_analysis_references(factory_id,case_id);
create index synthetic_case_analysis_references_run_idx
  on public.synthetic_case_analysis_references(run_id);

alter table public.synthetic_case_analysis_references enable row level security;
revoke all on public.synthetic_case_analysis_references from public,anon,authenticated,service_role;
grant select on public.synthetic_case_analysis_references to authenticated;
create policy "case investigators read their synthetic analysis references"
  on public.synthetic_case_analysis_references for select to authenticated
  using (
    private.investigation_access(case_id,(select auth.uid())) in ('manager','investigator')
  );
create trigger synthetic_case_analysis_references_immutable
  before update or delete on public.synthetic_case_analysis_references
  for each row execute function private.investigation_revision_immutable();

-- The edge-generated run and the case must belong to exactly the same factory.
-- Security-definer entry point resolves identity and authority on the server.
create function public.link_synthetic_case_analysis(_case uuid,_run bigint)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
  actor uuid := auth.uid();
  c public.investigation_cases%rowtype;
  run_record public.factory_analysis_runs%rowtype;
  role_name text;
  prior public.synthetic_case_analysis_references%rowtype;
begin
  if current_setting('app.gridmind_synthetic_analysis_link_mode',true)
       is distinct from 'isolated_fixture_only'
    then raise exception 'SYNTHETIC_ANALYSIS_LINK_DISABLED' using errcode='42501'; end if;
  if actor is null or _case is null or _run is null
    then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select * into c from public.investigation_cases where id=_case and origin='synthetic';
  select * into run_record from public.factory_analysis_runs where id=_run;
  if c.id is null or run_record.id is null or c.factory_id<>run_record.factory_id
    then raise exception 'CASE_ANALYSIS_FACTORY_MISMATCH' using errcode='42501'; end if;
  role_name:=private.investigation_access(_case,actor);
  if role_name is null or role_name not in ('manager','investigator')
    then raise exception 'CASE_ANALYSIS_LINK_DENIED' using errcode='42501'; end if;
  if run_record.asset_id is null or run_record.result_fingerprint is null
    then raise exception 'ANALYSIS_PROVENANCE_INCOMPLETE' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('synthetic-case-run:'||_case::text||':'||_run::text,0));
  select * into prior from public.synthetic_case_analysis_references
    where case_id=_case and run_id=_run;
  if found then
    if prior.factory_id<>run_record.factory_id or prior.asset_id<>run_record.asset_id
      or prior.result_fingerprint<>run_record.result_fingerprint
      then raise exception 'ANALYSIS_REFERENCE_INTEGRITY_CONFLICT' using errcode='40001'; end if;
    return jsonb_build_object('caseId',_case,'runId',_run,
      'status','synthetic_unreviewed_reference','replayed',true);
  end if;
  insert into public.synthetic_case_analysis_references
    (case_id,run_id,factory_id,asset_id,linked_by,result_fingerprint)
  values(_case,_run,run_record.factory_id,run_record.asset_id,actor,run_record.result_fingerprint);
  return jsonb_build_object('caseId',_case,'runId',_run,
    'status','synthetic_unreviewed_reference','replayed',false);
end;
$function$;

-- Read-only projection that intentionally excludes input snapshots, economic
-- assumptions, raw source data, other staff members' cases and all approvals.
create function public.synthetic_case_analysis_summary(_case uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
  actor uuid := auth.uid();
  role_name text;
  result jsonb;
begin
  if actor is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  role_name:=private.investigation_access(_case,actor);
  if role_name is null or role_name not in ('manager','investigator')
    then raise exception 'CASE_ANALYSIS_READ_DENIED' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'runId',r.run_id,'assetId',r.asset_id,'status',r.status,
    'fingerprint',r.result_fingerprint,'at',r.linked_at,
    'reviewStatus','not_reviewed','customerDeliveryApproved',false
  ) order by r.linked_at),'[]'::jsonb) into result
  from public.synthetic_case_analysis_references r where r.case_id=_case;
  return jsonb_build_object('caseId',_case,'references',result,
    'origin','synthetic','qualifiedReview',false);
end;
$function$;

revoke all on function public.link_synthetic_case_analysis(uuid,bigint)
  from public,anon,authenticated;
revoke all on function public.synthetic_case_analysis_summary(uuid)
  from public,anon,authenticated;
grant execute on function public.link_synthetic_case_analysis(uuid,bigint)
  to authenticated;
grant execute on function public.synthetic_case_analysis_summary(uuid)
  to authenticated;
commit;
