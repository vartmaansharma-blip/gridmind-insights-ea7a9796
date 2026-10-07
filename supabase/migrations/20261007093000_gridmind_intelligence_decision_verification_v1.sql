-- GridMind canonical intelligence, decision, verification and learning layer v1

create table if not exists public.evidence_bundles (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  claim_type text not null, claim_reference_id bigint,
  strength text not null default 'unknown' check (strength in ('unknown','weak','moderate','strong','very_strong')),
  confidence numeric, supporting_evidence jsonb not null default '[]'::jsonb,
  contradicting_evidence jsonb not null default '[]'::jsonb, assumptions jsonb not null default '[]'::jsonb,
  uncertainty jsonb not null default '{}'::jsonb, version integer not null default 1,
  created_at timestamptz not null default now(),
  check (confidence is null or (confidence>=0 and confidence<=1))
);

create table if not exists public.causal_hypotheses (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  opportunity_id bigint, observed_outcome text not null, candidate_cause text not null,
  mechanism text, expected_direction text, expected_magnitude numeric,
  supporting_evidence jsonb not null default '[]'::jsonb, contradicting_evidence jsonb not null default '[]'::jsonb,
  alternative_causes jsonb not null default '[]'::jsonb, causal_confidence numeric,
  status text not null default 'proposed' check (status in ('proposed','investigating','supported','weakly_supported','contradicted','rejected','verified','inconclusive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), resolved_at timestamptz,
  check (causal_confidence is null or (causal_confidence>=0 and causal_confidence<=1))
);

create table if not exists public.causal_tests (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  hypothesis_id bigint not null references public.causal_hypotheses(id) on delete restrict,
  test_type text not null, description text not null, expected_result text, actual_result text,
  test_start timestamptz, test_end timestamptz, result text,
  evidence_bundle_id bigint references public.evidence_bundles(id) on delete set null, confidence numeric,
  created_at timestamptz not null default now(),
  check (confidence is null or (confidence>=0 and confidence<=1)),
  check (test_end is null or test_start is null or test_end>=test_start)
);

create table if not exists public.economic_contexts (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  name text not null, effective_from timestamptz, effective_until timestamptz,
  currency text not null default 'INR', tariff_reference jsonb not null default '{}'::jsonb,
  production_value_reference jsonb not null default '{}'::jsonb, downtime_cost_reference jsonb not null default '{}'::jsonb,
  capacity_value_reference jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('draft','active','expired','superseded')),
  source text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (effective_until is null or effective_from is null or effective_until>=effective_from)
);

create table if not exists public.opportunities (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  scope_type text not null, scope_id bigint, deviation_id bigint references public.performance_deviations(id) on delete restrict,
  evidence_bundle_id bigint references public.evidence_bundles(id) on delete restrict,
  title text not null, description text, gross_loss numeric, avoidable_loss numeric, recoverable_opportunity numeric,
  expected_recovery numeric, currency text not null default 'INR', intervention_cost numeric, expected_net_value numeric,
  expected_roi numeric, expected_payback_months numeric, measurement_confidence numeric, baseline_confidence numeric,
  causal_confidence numeric, economic_confidence numeric, priority_score numeric, urgency text,
  status text not null default 'detected' check (status in ('detected','quantified','investigating','diagnosed','recommended','accepted','in_progress','awaiting_verification','verified','closed','invalid','insufficient_evidence','not_material','not_actionable','rejected','superseded','unverified')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (gross_loss is null or gross_loss>=0), check (avoidable_loss is null or avoidable_loss>=0),
  check (recoverable_opportunity is null or recoverable_opportunity>=0), check (expected_recovery is null or expected_recovery>=0),
  check (intervention_cost is null or intervention_cost>=0),
  check (measurement_confidence is null or (measurement_confidence>=0 and measurement_confidence<=1)),
  check (baseline_confidence is null or (baseline_confidence>=0 and baseline_confidence<=1)),
  check (causal_confidence is null or (causal_confidence>=0 and causal_confidence<=1)),
  check (economic_confidence is null or (economic_confidence>=0 and economic_confidence<=1))
);

alter table public.causal_hypotheses add constraint causal_hypotheses_opportunity_fk
  foreign key (opportunity_id) references public.opportunities(id) on delete set null;

create table if not exists public.decisions (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  opportunity_id bigint references public.opportunities(id) on delete restrict,
  objective text not null, selected_option text, alternatives jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '[]'::jsonb, expected_value numeric, risk jsonb not null default '{}'::jsonb,
  dependencies jsonb not null default '[]'::jsonb, decision_basis jsonb not null default '{}'::jsonb,
  decision_maker uuid references auth.users(id) on delete set null,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','conditional')),
  decided_at timestamptz, review_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.intervention_outcomes (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  intervention_id bigint not null references public.asset_interventions(id) on delete restrict,
  implementation_status text not null, implemented_at timestamptz,
  actual_change jsonb not null default '{}'::jsonb, implementation_cost numeric, implementation_notes text,
  observed_effect jsonb not null default '{}'::jsonb, evidence_bundle_id bigint references public.evidence_bundles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_plans (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  opportunity_id bigint references public.opportunities(id) on delete restrict,
  intervention_id bigint references public.asset_interventions(id) on delete restrict,
  baseline_id bigint references public.performance_baselines(id) on delete restrict,
  target_metric text not null, counterfactual_method text not null,
  baseline_period jsonb not null default '{}'::jsonb, verification_period jsonb not null default '{}'::jsonb,
  context_variables jsonb not null default '[]'::jsonb, confounders jsonb not null default '[]'::jsonb,
  attribution_method text, success_criteria jsonb not null default '{}'::jsonb, verification_window jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), approved_at timestamptz
);

create table if not exists public.verification_runs (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  verification_plan_id bigint not null references public.verification_plans(id) on delete restrict,
  run_start timestamptz, run_end timestamptz, baseline_value numeric, counterfactual_value numeric, observed_value numeric,
  attributed_effect numeric, measurement_confidence numeric, baseline_confidence numeric, attribution_confidence numeric, economic_confidence numeric,
  uncertainty_lower numeric, uncertainty_upper numeric,
  status text not null default 'not_started' check (status in ('not_started','baseline_established','intervention_implemented','monitoring','preliminary_result','verified','inconclusive','failed','insufficient_data','attribution_uncertain','confounded','reversed')),
  exceptions jsonb not null default '[]'::jsonb, evidence_bundle_id bigint references public.evidence_bundles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (run_end is null or run_start is null or run_end>=run_start),
  check (measurement_confidence is null or (measurement_confidence>=0 and measurement_confidence<=1)),
  check (baseline_confidence is null or (baseline_confidence>=0 and baseline_confidence<=1)),
  check (attribution_confidence is null or (attribution_confidence>=0 and attribution_confidence<=1)),
  check (economic_confidence is null or (economic_confidence>=0 and economic_confidence<=1))
);

create table if not exists public.verified_outcomes (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  intervention_id bigint references public.asset_interventions(id) on delete restrict,
  verification_run_id bigint not null references public.verification_runs(id) on delete restrict,
  physical_effect numeric, economic_value numeric, implementation_cost numeric, net_value numeric,
  currency text not null default 'INR', attribution_method text, uncertainty_lower numeric, uncertainty_upper numeric,
  verification_status text not null check (verification_status in ('verified','inconclusive','failed','insufficient_data','attribution_uncertain','confounded','reversed')),
  verified_at timestamptz, verified_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

create table if not exists public.learning_events (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  source_outcome_id bigint references public.verified_outcomes(id) on delete restrict,
  prediction_id bigint, prediction_error numeric, learning_type text not null,
  affected_knowledge jsonb not null default '{}'::jsonb, old_knowledge_version text, new_knowledge_version text,
  evidence_bundle_id bigint references public.evidence_bundles(id) on delete set null, scope jsonb not null default '{}'::jsonb,
  confidence numeric, generalization_level text,
  validation_status text not null default 'candidate' check (validation_status in ('candidate','validated','experimental','production','superseded','rejected')),
  created_at timestamptz not null default now(), check (confidence is null or (confidence>=0 and confidence<=1))
);

create index if not exists evidence_bundles_factory_idx on public.evidence_bundles(factory_id);
create index if not exists causal_hypotheses_factory_status_idx on public.causal_hypotheses(factory_id,status);
create index if not exists causal_hypotheses_opportunity_idx on public.causal_hypotheses(opportunity_id);
create index if not exists causal_tests_hypothesis_idx on public.causal_tests(hypothesis_id);
create index if not exists economic_contexts_factory_effective_idx on public.economic_contexts(factory_id,effective_from);
create index if not exists opportunities_factory_status_idx on public.opportunities(factory_id,status);
create index if not exists opportunities_factory_priority_idx on public.opportunities(factory_id,priority_score);
create index if not exists decisions_factory_idx on public.decisions(factory_id);
create index if not exists intervention_outcomes_factory_idx on public.intervention_outcomes(factory_id);
create index if not exists verification_plans_factory_idx on public.verification_plans(factory_id);
create index if not exists verification_runs_factory_status_idx on public.verification_runs(factory_id,status);
create index if not exists verified_outcomes_factory_idx on public.verified_outcomes(factory_id,verification_status);
create index if not exists learning_events_factory_idx on public.learning_events(factory_id,validation_status);

do $$
declare t text;
begin
  foreach t in array array['evidence_bundles','causal_hypotheses','causal_tests','economic_contexts','opportunities','decisions','intervention_outcomes','verification_plans','verification_runs','verified_outcomes','learning_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists "factory members read %I" on public.%I',t,t);
    execute format('create policy "factory members read %I" on public.%I for select to authenticated using ((select private.is_factory_member_v2(factory_id)))',t,t);
    execute format('drop policy if exists "factory members insert %I" on public.%I',t,t);
    execute format('create policy "factory members insert %I" on public.%I for insert to authenticated with check ((select private.is_factory_member_v2(factory_id)))',t,t);
    execute format('drop policy if exists "factory members update %I" on public.%I',t,t);
    execute format('create policy "factory members update %I" on public.%I for update to authenticated using ((select private.is_factory_member_v2(factory_id))) with check ((select private.is_factory_member_v2(factory_id)))',t,t);
  end loop;
end $$;
