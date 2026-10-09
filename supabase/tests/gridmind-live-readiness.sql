-- READ-ONLY production readiness diagnostic for GridMind authoritative analysis.
-- Safe to run against a live project: this script performs SELECTs only and creates no data.
-- A "ready" result is not proof that the measurements are physically accurate; it only checks prerequisites.

with factory_readiness as (
  select
    f.id as factory_id,
    f.name as factory_name,
    f.organization_id,
    (select count(*) from public.factory_assets a where a.factory_id = f.id) as asset_count,
    (select count(*)
       from public.factory_members fm
       join public.organization_members om
         on om.organization_id = fm.organization_id
        and om.user_id = fm.user_id
        and om.status = 'active'
      where fm.factory_id = f.id
        and fm.organization_id = f.organization_id) as active_authorized_member_count,
    (select count(*) from public.observations o where o.factory_id = f.id) as observation_count,
    (select count(*) from public.operating_contexts c where c.factory_id = f.id) as operating_context_count,
    (select count(*) from public.economic_contexts e where e.factory_id = f.id and e.status = 'active'
       and (e.effective_from is null or e.effective_from <= now())
       and (e.effective_until is null or e.effective_until >= now())) as effective_economic_context_count,
    (select count(*) from public.data_sources s where s.factory_id = f.id) as data_source_count,
    (select count(*) from public.data_source_mappings m where m.factory_id = f.id) as mapping_count,
    to_regclass('public.factory_analysis_runs') is not null as analysis_runs_table_exists
  from public.factories f
)
select
  *,
  array_remove(array[
    case when active_authorized_member_count = 0 then 'NO_ACTIVE_FACTORY_AND_ORGANIZATION_MEMBERSHIP' end,
    case when asset_count = 0 then 'NO_ASSETS' end,
    case when observation_count = 0 then 'NO_CANONICAL_OBSERVATIONS' end,
    case when operating_context_count = 0 then 'NO_OPERATING_CONTEXTS' end,
    case when effective_economic_context_count = 0 then 'NO_EFFECTIVE_ECONOMIC_CONTEXT' end,
    case when data_source_count = 0 then 'NO_DATA_SOURCES' end,
    case when mapping_count = 0 then 'NO_DATA_SOURCE_MAPPINGS' end,
    case when not analysis_runs_table_exists then 'ANALYSIS_RUNS_MIGRATION_NOT_APPLIED' end
  ], null) as readiness_blockers
from factory_readiness
order by factory_id;

-- Asset-level evidence coverage. Role resolution follows the adapter's supported canonical
-- metric names or metadata.analysis_role / provenance.analysis_role.
select
  f.id as factory_id,
  a.id as asset_id,
  a.name as asset_name,
  a.calibration_status,
  count(o.id) as observation_count,
  count(o.id) filter (where coalesce(
    o.metadata->>'analysis_role',
    o.provenance->>'analysis_role',
    case o.metric
      when 'energy_consumption_kwh' then 'energy'
      when 'production_output' then 'production'
      when 'operating_hours' then 'operating_hours'
      when 'operating_state' then 'operating_state'
      when 'product_code' then 'product_code'
      else null
    end
  ) = 'energy') as energy_observation_count,
  count(o.id) filter (where coalesce(
    o.metadata->>'analysis_role',
    o.provenance->>'analysis_role',
    case o.metric when 'production_output' then 'production' else null end
  ) = 'production') as production_observation_count,
  count(o.id) filter (where coalesce(
    o.metadata->>'analysis_role',
    o.provenance->>'analysis_role',
    case o.metric when 'operating_hours' then 'operating_hours' else null end
  ) = 'operating_hours') as operating_hours_observation_count,
  count(distinct coalesce(o.metadata->>'period_start', o.observed_at::text) || '|' ||
    coalesce(o.observed_until::text, o.metadata->>'period_end', 'MISSING_END')) as period_key_count,
  (select count(*) from public.operating_contexts c
    where c.factory_id = f.id and c.scope_type = 'asset' and c.scope_id = a.id
      and lower(c.status) in ('active','valid','validated','observed','derived')) as usable_context_count,
  (select count(*) from public.data_source_mappings m where m.factory_id = f.id and m.asset_id = a.id) as mapping_count
from public.factories f
join public.factory_assets a on a.factory_id = f.id
left join public.observations o
  on o.factory_id = f.id and o.subject_type = 'asset' and o.subject_id = a.id
group by f.id, a.id, a.name, a.calibration_status
order by f.id, a.id;
