
create table if not exists public.factories (
  id bigserial primary key,
  name text not null,
  location text,
  industry text,
  operating_days_per_month numeric,
  shifts_per_day numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.machine_types (
  id bigserial primary key,
  category text not null,
  machine_type text not null,
  purpose text not null,
  required_metrics jsonb not null,
  optional_metrics jsonb not null,
  detection_targets jsonb not null,
  created_at timestamptz default now(),
  constraint machine_types_category_machine_type_key unique (category, machine_type)
);

create table if not exists public.factory_assets (
  id bigserial primary key,
  name text not null,
  machine_type_id bigint references public.machine_types(id),
  manufacturer text,
  model text,
  rated_power_kw numeric,
  rated_capacity text,
  installation_year integer,
  asset_metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  factory_id bigint references public.factories(id),
  process_role text,
  connectivity_mode text,
  calibration_status text,
  criticality text,
  retrofit_priority text,
  sensor_coverage_pct numeric
);

create table if not exists public.machine_type_knowledge (
  id bigserial primary key,
  machine_type_id bigint not null unique references public.machine_types(id),
  schema_version text not null default '1.0',
  knowledge_status text not null default 'candidate',
  validation_status text not null default 'not_yet_validated',
  operating_principle text,
  inputs jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '[]'::jsonb,
  operating_states jsonb not null default '[]'::jsonb,
  components jsonb not null default '[]'::jsonb,
  failure_modes jsonb not null default '[]'::jsonb,
  measurement_requirements jsonb not null default '{}'::jsonb,
  data_sources jsonb not null default '[]'::jsonb,
  industrial_protocols jsonb not null default '[]'::jsonb,
  calibration jsonb not null default '{}'::jsonb,
  performance_reference jsonb not null default '{}'::jsonb,
  diagnostic_scope jsonb not null default '[]'::jsonb,
  intervention_types jsonb not null default '[]'::jsonb,
  economics jsonb not null default '{}'::jsonb,
  safety jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.machine_measurement_definitions (
  id bigserial primary key,
  machine_type_id bigint not null references public.machine_types(id),
  signal_key text not null,
  display_name text not null,
  category text not null,
  physical_meaning text not null,
  canonical_unit text,
  requiredness text not null,
  preferred_sources jsonb not null default '[]'::jsonb,
  quality_rules jsonb not null default '[]'::jsonb,
  diagnostic_uses jsonb not null default '[]'::jsonb,
  economic_relevance text,
  why_it_matters text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint machine_measurement_definitions_machine_type_id_signal_key_key unique (machine_type_id, signal_key)
);

create table if not exists public.diagnostic_rules (
  id bigserial primary key,
  machine_type_id bigint references public.machine_types(id),
  problem_code text not null,
  problem_name text not null,
  severity text not null default 'medium',
  required_metrics jsonb not null,
  logic jsonb not null,
  evidence_text text not null,
  possible_causes jsonb not null,
  recommended_checks jsonb not null,
  financial_method text,
  confidence_method text,
  created_at timestamptz default now(),
  constraint diagnostic_rules_machine_type_id_problem_code_key unique (machine_type_id, problem_code)
);

create table if not exists public.asset_calibration_profiles (
  id bigserial primary key,
  asset_id bigint unique references public.factory_assets(id),
  baseline_window_days integer default 30,
  expected_ranges jsonb not null,
  model_version text default 'v1',
  calibrated_at timestamptz default now()
);

create table if not exists public.asset_integration_profiles (
  id bigserial primary key,
  asset_id bigint not null unique references public.factory_assets(id),
  integration_mode text not null,
  controller_available boolean default false,
  plc_available boolean default false,
  communication_interface text,
  gateway_required boolean default false,
  retrofit_required boolean default false,
  manual_data_allowed boolean default true,
  indirect_inference_allowed boolean default true,
  coverage_score numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.asset_sensor_mappings (
  id bigserial primary key,
  asset_id bigint not null references public.factory_assets(id),
  metric_name text not null,
  measurement_class text not null,
  required boolean default false,
  available boolean default false,
  source_type text,
  sensor_type text,
  unit text,
  installation_status text default 'not_installed',
  diagnostic_value text,
  created_at timestamptz default now(),
  constraint asset_sensor_mappings_asset_id_metric_name_key unique (asset_id, metric_name)
);

create table if not exists public.asset_measurements (
  id bigserial primary key,
  asset_id bigint references public.factory_assets(id),
  measured_at timestamptz not null,
  metrics jsonb not null,
  source text not null default 'manual',
  created_at timestamptz default now()
);

create table if not exists public.intelligence_events (
  id bigserial primary key,
  asset_id bigint references public.factory_assets(id),
  event_type text not null,
  severity text not null,
  status text not null default 'open',
  confidence numeric,
  estimated_impact_inr numeric,
  evidence jsonb not null,
  recommended_action text,
  created_at timestamptz default now()
);

create table if not exists public.asset_interventions (
  id bigserial primary key,
  asset_id bigint not null references public.factory_assets(id),
  event_id bigint references public.intelligence_events(id),
  intervention_date timestamptz,
  intervention_type text,
  description text,
  expected_saving_inr numeric default 0,
  status text default 'planned',
  created_at timestamptz default now()
);

create table if not exists public.retrofit_assessments (
  id bigserial primary key,
  asset_id bigint not null unique references public.factory_assets(id),
  annual_energy_cost_inr numeric default 0,
  annual_downtime_cost_inr numeric default 0,
  estimated_opportunity_inr numeric default 0,
  instrumentation_cost_inr numeric default 0,
  expected_payback_months numeric,
  criticality_score numeric default 0,
  diagnostic_value_score numeric default 0,
  retrofit_priority text default 'unassessed',
  decision text default 'pending',
  rationale text,
  created_at timestamptz default now()
);

create table if not exists public.savings_verifications (
  id bigserial primary key,
  asset_id bigint references public.factory_assets(id),
  intervention_id bigint references public.asset_interventions(id),
  baseline_start timestamptz,
  baseline_end timestamptz,
  post_start timestamptz,
  post_end timestamptz,
  baseline_intensity numeric,
  post_intensity numeric,
  production_normalized_saving numeric,
  verified_saving_inr numeric default 0,
  confidence text,
  status text default 'insufficient_data',
  methodology jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create or replace view public.machine_type_catalog as
select
  mt.id, mt.category, mt.machine_type, mt.purpose, mt.required_metrics, mt.optional_metrics,
  mt.detection_targets, mk.schema_version, mk.knowledge_status, mk.validation_status,
  mk.operating_principle, mk.inputs, mk.outputs, mk.operating_states, mk.components,
  mk.failure_modes, mk.measurement_requirements, mk.data_sources, mk.industrial_protocols,
  mk.calibration, mk.performance_reference, mk.diagnostic_scope, mk.intervention_types,
  mk.economics, mk.safety, mk.provenance
from public.machine_types mt
left join public.machine_type_knowledge mk on mk.machine_type_id = mt.id;

create or replace view public.machine_measurement_catalog as
select
  md.id, md.machine_type_id, mt.machine_type, md.signal_key, md.display_name,
  md.category, md.physical_meaning, md.canonical_unit, md.requiredness,
  md.preferred_sources, md.quality_rules, md.diagnostic_uses,
  md.economic_relevance, md.why_it_matters
from public.machine_measurement_definitions md
join public.machine_types mt on mt.id = md.machine_type_id;

alter table public.factories enable row level security;
alter table public.machine_types enable row level security;
alter table public.factory_assets enable row level security;
alter table public.machine_type_knowledge enable row level security;
alter table public.machine_measurement_definitions enable row level security;
alter table public.diagnostic_rules enable row level security;
alter table public.asset_calibration_profiles enable row level security;
alter table public.asset_integration_profiles enable row level security;
alter table public.asset_sensor_mappings enable row level security;
alter table public.asset_measurements enable row level security;
alter table public.intelligence_events enable row level security;
alter table public.asset_interventions enable row level security;
alter table public.retrofit_assessments enable row level security;
alter table public.savings_verifications enable row level security;
