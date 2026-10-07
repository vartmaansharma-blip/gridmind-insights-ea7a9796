-- GridMind Phase 12.5: schema integrity hardening
-- Additive, tenant-safe, and designed to preserve the legacy transition layer.

alter table public.factories
  add constraint factories_id_organization_unique unique (id, organization_id);

alter table public.factory_members
  add column if not exists organization_id bigint;

update public.factory_members fm
set organization_id=f.organization_id
from public.factories f
where fm.factory_id=f.id and fm.organization_id is null;

alter table public.factory_members alter column organization_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='factory_members_factory_org_fkey') then
    alter table public.factory_members
      add constraint factory_members_factory_org_fkey
      foreign key (factory_id, organization_id)
      references public.factories(id, organization_id)
      on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='factory_members_org_user_fkey') then
    alter table public.factory_members
      add constraint factory_members_org_user_fkey
      foreign key (organization_id, user_id)
      references public.organization_members(organization_id, user_id)
      on delete cascade;
  end if;
end $$;

alter table public.asset_interventions
  add column if not exists factory_id bigint,
  add column if not exists opportunity_id bigint,
  add column if not exists decision_id bigint,
  add column if not exists target_scope_type text,
  add column if not exists target_scope_id bigint,
  add column if not exists causal_basis_evidence_id bigint,
  add column if not exists preconditions jsonb not null default '[]'::jsonb,
  add column if not exists operating_constraints jsonb not null default '[]'::jsonb,
  add column if not exists safety_constraints jsonb not null default '[]'::jsonb,
  add column if not exists required_resources jsonb not null default '[]'::jsonb,
  add column if not exists responsible_role text,
  add column if not exists implementation_steps jsonb not null default '[]'::jsonb,
  add column if not exists implementation_duration text,
  add column if not exists implementation_cost numeric,
  add column if not exists expected_effect_lower numeric,
  add column if not exists expected_effect_upper numeric,
  add column if not exists expected_effect_unit text,
  add column if not exists risk jsonb not null default '{}'::jsonb,
  add column if not exists reversibility text,
  add column if not exists dependencies jsonb not null default '[]'::jsonb,
  add column if not exists rollback_plan text,
  add column if not exists verification_method jsonb not null default '{}'::jsonb,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.asset_interventions ai
set factory_id=fa.factory_id
from public.factory_assets fa
where ai.asset_id=fa.id and ai.factory_id is null;

alter table public.asset_interventions alter column factory_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='asset_interventions_factory_id_fkey') then
    alter table public.asset_interventions
      add constraint asset_interventions_factory_id_fkey
      foreign key (factory_id) references public.factories(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='asset_interventions_id_factory_unique') then
    alter table public.asset_interventions
      add constraint asset_interventions_id_factory_unique unique (id, factory_id);
  end if;
  if not exists (select 1 from pg_constraint where conname='asset_interventions_opportunity_fkey') then
    alter table public.asset_interventions
      add constraint asset_interventions_opportunity_fkey
      foreign key (opportunity_id) references public.opportunities(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='asset_interventions_decision_fkey') then
    alter table public.asset_interventions
      add constraint asset_interventions_decision_fkey
      foreign key (decision_id) references public.decisions(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='asset_interventions_causal_evidence_fkey') then
    alter table public.asset_interventions
      add constraint asset_interventions_causal_evidence_fkey
      foreign key (causal_basis_evidence_id) references public.evidence_bundles(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='factory_assets_id_factory_unique') then
    alter table public.factory_assets
      add constraint factory_assets_id_factory_unique unique (id, factory_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='asset_interventions_asset_factory_fkey') then
    alter table public.asset_interventions
      add constraint asset_interventions_asset_factory_fkey
      foreign key (asset_id, factory_id)
      references public.factory_assets(id, factory_id)
      on delete restrict;
  end if;
end $$;

create table if not exists public.evidence_links (
  id bigint primary key generated always as identity,
  factory_id bigint not null references public.factories(id) on delete restrict,
  evidence_bundle_id bigint not null references public.evidence_bundles(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('observation','derived_fact','context','baseline','expectation','deviation','causal_hypothesis','causal_test','intervention','verification_run','verified_outcome','external')),
  source_id bigint,
  relationship text not null check (relationship in ('supports','contradicts','qualifies','derived_from','verifies','implements','references')),
  strength numeric,
  source_reference jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (strength is null or (strength>=0 and strength<=1))
);

do $$
declare t text;
begin
  foreach t in array array[
    'data_sources','observations','operating_contexts','performance_baselines',
    'performance_expectations','performance_deviations','derived_facts',
    'evidence_bundles','opportunities','decisions','causal_hypotheses',
    'causal_tests','verification_plans','verification_runs','verified_outcomes'
  ] loop
    execute format('do $inner$ begin if not exists (select 1 from pg_constraint where conname=%L) then alter table public.%I add constraint %I unique (id,factory_id); end if; end $inner$', t||'_id_factory_unique',t,t||'_id_factory_unique');
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='data_source_mappings_source_factory_fkey') then
    alter table public.data_source_mappings add constraint data_source_mappings_source_factory_fkey
      foreign key (data_source_id,factory_id) references public.data_sources(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='observations_source_factory_fkey') then
    alter table public.observations add constraint observations_source_factory_fkey
      foreign key (data_source_id,factory_id) references public.data_sources(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='expectations_baseline_factory_fkey') then
    alter table public.performance_expectations add constraint expectations_baseline_factory_fkey
      foreign key (baseline_id,factory_id) references public.performance_baselines(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='expectations_context_factory_fkey') then
    alter table public.performance_expectations add constraint expectations_context_factory_fkey
      foreign key (context_id,factory_id) references public.operating_contexts(id,factory_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='deviations_observation_factory_fkey') then
    alter table public.performance_deviations add constraint deviations_observation_factory_fkey
      foreign key (observation_id,factory_id) references public.observations(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='deviations_expectation_factory_fkey') then
    alter table public.performance_deviations add constraint deviations_expectation_factory_fkey
      foreign key (expectation_id,factory_id) references public.performance_expectations(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='opportunities_deviation_factory_fkey') then
    alter table public.opportunities add constraint opportunities_deviation_factory_fkey
      foreign key (deviation_id,factory_id) references public.performance_deviations(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='opportunities_evidence_factory_fkey') then
    alter table public.opportunities add constraint opportunities_evidence_factory_fkey
      foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='hypotheses_opportunity_factory_fkey') then
    alter table public.causal_hypotheses add constraint hypotheses_opportunity_factory_fkey
      foreign key (opportunity_id,factory_id) references public.opportunities(id,factory_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='causal_tests_hypothesis_factory_fkey') then
    alter table public.causal_tests add constraint causal_tests_hypothesis_factory_fkey
      foreign key (hypothesis_id,factory_id) references public.causal_hypotheses(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='causal_tests_evidence_factory_fkey') then
    alter table public.causal_tests add constraint causal_tests_evidence_factory_fkey
      foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='decisions_opportunity_factory_fkey') then
    alter table public.decisions add constraint decisions_opportunity_factory_fkey
      foreign key (opportunity_id,factory_id) references public.opportunities(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='intervention_outcomes_intervention_factory_fkey') then
    alter table public.intervention_outcomes add constraint intervention_outcomes_intervention_factory_fkey
      foreign key (intervention_id,factory_id) references public.asset_interventions(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='intervention_outcomes_evidence_factory_fkey') then
    alter table public.intervention_outcomes add constraint intervention_outcomes_evidence_factory_fkey
      foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_plans_opportunity_factory_fkey') then
    alter table public.verification_plans add constraint verification_plans_opportunity_factory_fkey
      foreign key (opportunity_id,factory_id) references public.opportunities(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_plans_intervention_factory_fkey') then
    alter table public.verification_plans add constraint verification_plans_intervention_factory_fkey
      foreign key (intervention_id,factory_id) references public.asset_interventions(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_plans_baseline_factory_fkey') then
    alter table public.verification_plans add constraint verification_plans_baseline_factory_fkey
      foreign key (baseline_id,factory_id) references public.performance_baselines(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_runs_plan_factory_fkey') then
    alter table public.verification_runs add constraint verification_runs_plan_factory_fkey
      foreign key (verification_plan_id,factory_id) references public.verification_plans(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_runs_evidence_factory_fkey') then
    alter table public.verification_runs add constraint verification_runs_evidence_factory_fkey
      foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='verified_outcomes_run_factory_fkey') then
    alter table public.verified_outcomes add constraint verified_outcomes_run_factory_fkey
      foreign key (verification_run_id,factory_id) references public.verification_runs(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='verified_outcomes_intervention_factory_fkey') then
    alter table public.verified_outcomes add constraint verified_outcomes_intervention_factory_fkey
      foreign key (intervention_id,factory_id) references public.asset_interventions(id,factory_id) on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='processes_factory_parent_unique') then
    alter table public.processes add constraint processes_factory_parent_unique unique (id,factory_id);
  end if;
  if not exists (select 1 from pg_constraint where conname='products_factory_unique') then
    alter table public.products add constraint products_factory_unique unique (id,factory_id);
  end if;
end $$;

create or replace function private.validate_physical_scope(p_factory_id bigint,p_scope_type text,p_scope_id bigint)
returns boolean language plpgsql stable security definer set search_path=''
as $$
begin
  if p_scope_id is null then return true; end if;
  if p_scope_type='factory' then
    return p_scope_id=p_factory_id and exists(select 1 from public.factories f where f.id=p_scope_id);
  elsif p_scope_type='asset' then
    return exists(select 1 from public.factory_assets a where a.id=p_scope_id and a.factory_id=p_factory_id);
  elsif p_scope_type='process' then
    return exists(select 1 from public.processes p where p.id=p_scope_id and p.factory_id=p_factory_id);
  elsif p_scope_type='product' then
    return exists(select 1 from public.products p where p.id=p_scope_id and p.factory_id=p_factory_id);
  end if;
  return false;
end;
$$;

revoke execute on function private.validate_physical_scope(bigint,text,bigint) from public;
grant execute on function private.validate_physical_scope(bigint,text,bigint) to authenticated;

alter table public.observations add constraint observations_subject_type_check check(subject_type in ('factory','asset','process','product'));
alter table public.performance_baselines add constraint baselines_scope_type_check check(scope_type in ('factory','asset','process','product'));
alter table public.performance_expectations add constraint expectations_scope_type_check check(scope_type in ('factory','asset','process','product'));
alter table public.performance_deviations add constraint deviations_scope_type_check check(scope_type in ('factory','asset','process','product'));
alter table public.operating_contexts add constraint contexts_scope_type_check check(scope_type in ('factory','asset','process','product'));
alter table public.operating_regimes add constraint regimes_scope_type_check check(scope_type in ('factory','asset','process','product'));
alter table public.derived_facts add constraint derived_facts_scope_type_check check(scope_type in ('factory','asset','process','product'));

create or replace function private.validate_observation_subject()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.subject_id is not null and not private.validate_physical_scope(new.factory_id,new.subject_type,new.subject_id)
  then raise exception 'Observation subject does not belong to factory %',new.factory_id; end if;
  return new;
end;
$$;

create or replace function private.validate_scoped_row()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.scope_id is not null and not private.validate_physical_scope(new.factory_id,new.scope_type,new.scope_id)
  then raise exception 'Scope does not belong to factory %',new.factory_id; end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_observation_subject on public.observations;
create trigger trg_validate_observation_subject before insert or update on public.observations for each row execute function private.validate_observation_subject();

drop trigger if exists trg_validate_operating_context_scope on public.operating_contexts;
create trigger trg_validate_operating_context_scope before insert or update on public.operating_contexts for each row execute function private.validate_scoped_row();

drop trigger if exists trg_validate_operating_regime_scope on public.operating_regimes;
create trigger trg_validate_operating_regime_scope before insert or update on public.operating_regimes for each row execute function private.validate_scoped_row();

drop trigger if exists trg_validate_baseline_scope on public.performance_baselines;
create trigger trg_validate_baseline_scope before insert or update on public.performance_baselines for each row execute function private.validate_scoped_row();

drop trigger if exists trg_validate_expectation_scope on public.performance_expectations;
create trigger trg_validate_expectation_scope before insert or update on public.performance_expectations for each row execute function private.validate_scoped_row();

drop trigger if exists trg_validate_deviation_scope on public.performance_deviations;
create trigger trg_validate_deviation_scope before insert or update on public.performance_deviations for each row execute function private.validate_scoped_row();

drop trigger if exists trg_validate_derived_fact_scope on public.derived_facts;
create trigger trg_validate_derived_fact_scope before insert or update on public.derived_facts for each row execute function private.validate_scoped_row();

alter table public.evidence_links enable row level security;

drop policy if exists "factory members read evidence_links" on public.evidence_links;
create policy "factory members read evidence_links" on public.evidence_links for select to authenticated using((select private.is_factory_member_v2(factory_id)));

drop policy if exists "factory members insert evidence_links" on public.evidence_links;
create policy "factory members insert evidence_links" on public.evidence_links for insert to authenticated with check((select private.is_factory_member_v2(factory_id)));

drop policy if exists "factory members update evidence_links" on public.evidence_links;
create policy "factory members update evidence_links" on public.evidence_links for update to authenticated using((select private.is_factory_member_v2(factory_id))) with check((select private.is_factory_member_v2(factory_id)));

do $$
begin
  if not exists (select 1 from pg_constraint where conname='evidence_links_bundle_factory_fkey') then
    alter table public.evidence_links add constraint evidence_links_bundle_factory_fkey
      foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete cascade;
  end if;
end $$;

drop policy if exists "canonical factory members read asset_interventions" on public.asset_interventions;
drop policy if exists "canonical factory members insert asset_interventions" on public.asset_interventions;
drop policy if exists "canonical factory members update asset_interventions" on public.asset_interventions;


create index if not exists asset_interventions_factory_idx on public.asset_interventions(factory_id);
create index if not exists asset_interventions_opportunity_idx on public.asset_interventions(opportunity_id);
create index if not exists intervention_outcomes_intervention_factory_idx on public.intervention_outcomes(intervention_id,factory_id);
create index if not exists verification_runs_plan_factory_idx on public.verification_runs(verification_plan_id,factory_id);
create index if not exists verified_outcomes_run_factory_idx on public.verified_outcomes(verification_run_id,factory_id);
create index if not exists evidence_links_bundle_idx on public.evidence_links(evidence_bundle_id);
create index if not exists evidence_links_factory_idx on public.evidence_links(factory_id);
create index if not exists evidence_links_source_idx on public.evidence_links(factory_id,evidence_type,source_id);
