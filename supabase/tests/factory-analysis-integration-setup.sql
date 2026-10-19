-- Isolated local-only fixtures for HTTP integration tests. Never run against a shared or production database.
-- The measurements below are synthetic and exist only to prove the full calculation path.
begin;
update private.compressed_air_gate set enabled=true where singleton=true;
-- This fixture is executed ONLY in the isolated local stack. Production remains
-- deny-by-default, even if a user bypasses the HTTP feature flag via PostgREST.
update private.electricity_release_gate
set synthetic_acceptance_enabled=true where singleton=true;

insert into public.organizations (name)
values ('gridmind-http-org-a'), ('gridmind-http-org-b');

insert into public.organization_members (organization_id, user_id, role, status)
select o.id, u.id, 'owner', 'active'
from public.organizations o
join auth.users u on (o.name = 'gridmind-http-org-a' and u.email = 'gridmind-http-a@example.test')
                or (o.name = 'gridmind-http-org-b' and u.email = 'gridmind-http-b@example.test');

insert into public.factories (organization_id, name)
select o.id, 'gridmind-http-factory-a'
from public.organizations o where o.name = 'gridmind-http-org-a';
insert into public.factories (organization_id, name)
select o.id, 'gridmind-http-factory-b'
from public.organizations o where o.name = 'gridmind-http-org-b';

insert into public.factory_assets (factory_id, name)
select f.id, a.asset_name
from public.factories f
cross join (values ('gridmind-http-asset-a'), ('gridmind-http-asset-a2')) as a(asset_name)
where f.name = 'gridmind-http-factory-a';
insert into public.factory_assets (factory_id, name)
select f.id, 'gridmind-http-asset-b'
from public.factories f where f.name = 'gridmind-http-factory-b';

insert into public.factory_members (factory_id, user_id, organization_id, role)
select f.id, u.id, o.id, 'owner'
from public.factories f
join public.organizations o on o.id = f.organization_id
join auth.users u on (o.name = 'gridmind-http-org-a' and u.email = 'gridmind-http-a@example.test')
                or (o.name = 'gridmind-http-org-b' and u.email = 'gridmind-http-b@example.test')
where (f.name = 'gridmind-http-factory-a' and o.name = 'gridmind-http-org-a')
   or (f.name = 'gridmind-http-factory-b' and o.name = 'gridmind-http-org-b');

-- Four historical periods and one current period. Baseline specific energy is ~10 kWh/unit;
-- the current period is 14 kWh/unit, with explicit economic assumptions producing positive net value.
with target as (
  select f.id as factory_id, a.id as asset_id
  from public.factories f
  join public.factory_assets a on a.factory_id = f.id
  where f.name = 'gridmind-http-factory-a' and a.name = 'gridmind-http-asset-a'
), periods(period_start, period_end, energy_kwh, production_units, operating_hours) as (
  values
    ('2026-10-01T00:00:00+05:30'::timestamptz, '2026-10-02T00:00:00+05:30'::timestamptz, 1000::numeric, 100::numeric, 8::numeric),
    ('2026-10-02T00:00:00+05:30'::timestamptz, '2026-10-03T00:00:00+05:30'::timestamptz, 1020::numeric, 100::numeric, 8::numeric),
    ('2026-10-03T00:00:00+05:30'::timestamptz, '2026-10-04T00:00:00+05:30'::timestamptz, 980::numeric, 100::numeric, 8::numeric),
    ('2026-10-04T00:00:00+05:30'::timestamptz, '2026-10-05T00:00:00+05:30'::timestamptz, 1000::numeric, 100::numeric, 8::numeric),
    ('2026-10-08T00:00:00+05:30'::timestamptz, '2026-10-09T00:00:00+05:30'::timestamptz, 1400::numeric, 100::numeric, 8::numeric)
), metrics(metric, role, unit, value_column) as (
  values
    ('energy_consumption_kwh', 'energy', 'kWh', 'energy'),
    ('production_output', 'production', 'unit', 'production'),
    ('operating_hours', 'operating_hours', 'h', 'hours')
), expanded as (
  select target.factory_id, target.asset_id, periods.period_start, periods.period_end,
         metrics.metric, metrics.role, metrics.unit,
         case metrics.value_column
           when 'energy' then periods.energy_kwh
           when 'production' then periods.production_units
           else periods.operating_hours
         end as metric_value
  from target cross join periods cross join metrics
)
insert into public.observations
  (factory_id, subject_type, subject_id, metric, value_numeric, unit, observed_at, observed_until, quality_status, is_estimated, provenance, metadata)
select factory_id, 'asset', asset_id, metric, metric_value, unit, period_start, period_end, 'valid', false,
       jsonb_build_object('origin', 'synthetic_test_fixture'),
       jsonb_build_object(
         'analysis_role', role,
         'period_start', to_char(period_start at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '+00:00',
         'period_end', to_char(period_end at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '+00:00'
       )
from expanded;

insert into public.operating_contexts
  (factory_id, scope_type, scope_id, context_type, start_time, end_time, status, confidence, values, metadata)
select f.id, 'asset', a.id, 'production', '2026-10-01T00:00:00+05:30'::timestamptz, null,
       'validated', 0.95,
       jsonb_build_object('analysis_loop', jsonb_build_object('operatingState', 'running', 'productCode', 'SKU-A')),
       jsonb_build_object('origin', 'synthetic_test_fixture')
from public.factories f
join public.factory_assets a on a.factory_id = f.id
where f.name = 'gridmind-http-factory-a' and a.name = 'gridmind-http-asset-a';

insert into public.economic_contexts
  (factory_id, name, effective_from, effective_until, currency, status, source, metadata)
select f.id, 'gridmind-http-test-economics', '2026-09-01T00:00:00+05:30'::timestamptz, null,
       'INR', 'active', 'synthetic_test_fixture',
       jsonb_build_object('analysis_loop', jsonb_build_object(
         'tariffInrPerKwh', 10,
         'recoverableFraction', 0.5,
         'interventionCostInr', 500
       ))
from public.factories f where f.name = 'gridmind-http-factory-a';

commit;
