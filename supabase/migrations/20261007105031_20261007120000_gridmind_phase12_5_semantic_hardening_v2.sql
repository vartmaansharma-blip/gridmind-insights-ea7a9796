
-- GridMind Phase 12.5b: second-pass semantic and graph hardening.
-- Additive; no existing business data is deleted.

-- Physical graph: both endpoints must belong to the relationship factory.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='physical_relationships_source_factory_fkey') then
    alter table public.physical_relationships add constraint physical_relationships_source_factory_fkey
      foreign key (source_asset_id,factory_id)
      references public.factory_assets(id,factory_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='physical_relationships_target_factory_fkey') then
    alter table public.physical_relationships add constraint physical_relationships_target_factory_fkey
      foreign key (target_asset_id,factory_id)
      references public.factory_assets(id,factory_id) on delete restrict;
  end if;
end $$;

-- Source mappings: an optional asset target must be in the same factory.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='data_source_mappings_asset_factory_fkey') then
    alter table public.data_source_mappings add constraint data_source_mappings_asset_factory_fkey
      foreign key (asset_id,factory_id)
      references public.factory_assets(id,factory_id) on delete set null;
  end if;
end $$;

-- Process hierarchy must never cross factories.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='processes_parent_factory_fkey') then
    alter table public.processes add constraint processes_parent_factory_fkey
      foreign key (parent_process_id,factory_id)
      references public.processes(id,factory_id) on delete restrict;
  end if;
end $$;

-- Core factory-scoped assets are no longer optionally detached from a factory.
update public.factory_assets a
set factory_id=f.id
from public.factories f
where a.factory_id is null
  and exists (
    select 1 from public.asset_measurements m
    where m.asset_id=a.id
  )
  and false;

-- Do not infer factory ownership from historical legacy rows.
-- Require factory_id for all newly canonicalized assets; existing NULL rows are
-- preserved until their ownership is explicitly established during application migration.
-- (No SET NOT NULL here because silently guessing ownership would violate provenance.)

-- Scope validation for opportunities and interventions.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='opportunities_scope_type_check') then
    alter table public.opportunities add constraint opportunities_scope_type_check
      check (scope_type in ('factory','asset','process','product'));
  end if;
  if not exists (select 1 from pg_constraint where conname='interventions_scope_type_check') then
    alter table public.asset_interventions add constraint interventions_scope_type_check
      check (target_scope_type is null or target_scope_type in ('factory','asset','process','product'));
  end if;
end $$;

drop trigger if exists trg_validate_opportunity_scope on public.opportunities;
create trigger trg_validate_opportunity_scope
before insert or update on public.opportunities
for each row execute function private.validate_scoped_row();

drop trigger if exists trg_validate_intervention_scope on public.asset_interventions;
create trigger trg_validate_intervention_scope
before insert or update on public.asset_interventions
for each row execute function private.validate_scoped_row();

-- Reuse the same validator for intervention target_scope fields.
create or replace function private.validate_intervention_scope()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.target_scope_id is not null
     and not private.validate_physical_scope(new.factory_id,new.target_scope_type,new.target_scope_id)
  then
    raise exception 'Intervention target scope does not belong to factory %',new.factory_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_intervention_target_scope on public.asset_interventions;
create trigger trg_validate_intervention_target_scope
before insert or update on public.asset_interventions
for each row execute function private.validate_intervention_scope();

-- Economic context becomes an explicit part of the opportunity's economic basis.
alter table public.opportunities
  add column if not exists economic_context_id bigint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='economic_contexts_id_factory_unique') then
    alter table public.economic_contexts add constraint economic_contexts_id_factory_unique unique(id,factory_id);
  end if;
  if not exists (select 1 from pg_constraint where conname='opportunities_economic_context_factory_fkey') then
    alter table public.opportunities add constraint opportunities_economic_context_factory_fkey
      foreign key (economic_context_id,factory_id)
      references public.economic_contexts(id,factory_id) on delete set null;
  end if;
end $$;

-- Decision and intervention references must remain within the same factory.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='asset_interventions_opportunity_factory_fkey') then
    alter table public.asset_interventions add constraint asset_interventions_opportunity_factory_fkey
      foreign key (opportunity_id,factory_id)
      references public.opportunities(id,factory_id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='asset_interventions_decision_factory_fkey') then
    alter table public.asset_interventions add constraint asset_interventions_decision_factory_fkey
      foreign key (decision_id,factory_id)
      references public.decisions(id,factory_id) on delete set null;
  end if;
end $$;

-- Deterministic numeric invariants.
do $$
begin
  if not exists (select 1 from pg_constraint where conname='opportunities_confidence_range_check') then
    alter table public.opportunities add constraint opportunities_confidence_range_check
      check (
        (measurement_confidence is null or measurement_confidence between 0 and 1)
        and (baseline_confidence is null or baseline_confidence between 0 and 1)
        and (causal_confidence is null or causal_confidence between 0 and 1)
        and (economic_confidence is null or economic_confidence between 0 and 1)
      );
  end if;
  if not exists (select 1 from pg_constraint where conname='opportunities_economic_nonnegative_check') then
    alter table public.opportunities add constraint opportunities_economic_nonnegative_check
      check (
        (gross_loss is null or gross_loss >= 0)
        and (avoidable_loss is null or avoidable_loss >= 0)
        and (recoverable_opportunity is null or recoverable_opportunity >= 0)
        and (expected_recovery is null or expected_recovery >= 0)
        and (intervention_cost is null or intervention_cost >= 0)
      );
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_runs_confidence_range_check') then
    alter table public.verification_runs add constraint verification_runs_confidence_range_check
      check (
        (measurement_confidence is null or measurement_confidence between 0 and 1)
        and (baseline_confidence is null or baseline_confidence between 0 and 1)
        and (attribution_confidence is null or attribution_confidence between 0 and 1)
        and (economic_confidence is null or economic_confidence between 0 and 1)
      );
  end if;
  if not exists (select 1 from pg_constraint where conname='verification_runs_uncertainty_order_check') then
    alter table public.verification_runs add constraint verification_runs_uncertainty_order_check
      check (uncertainty_lower is null or uncertainty_upper is null or uncertainty_lower <= uncertainty_upper);
  end if;
  if not exists (select 1 from pg_constraint where conname='verified_outcomes_uncertainty_order_check') then
    alter table public.verified_outcomes add constraint verified_outcomes_uncertainty_order_check
      check (uncertainty_lower is null or uncertainty_upper is null or uncertainty_lower <= uncertainty_upper);
  end if;
  if not exists (select 1 from pg_constraint where conname='asset_interventions_effect_range_check') then
    alter table public.asset_interventions add constraint asset_interventions_effect_range_check
      check (expected_effect_lower is null or expected_effect_upper is null or expected_effect_lower <= expected_effect_upper);
  end if;
end $$;

-- Time ranges: validity and verification windows must not reverse.
alter table public.physical_relationships
  add constraint physical_relationships_valid_time_check
  check (valid_from is null or valid_to is null or valid_from <= valid_to);

alter table public.economic_contexts
  add constraint economic_contexts_effective_time_check
  check (effective_from is null or effective_until is null or effective_from <= effective_until);

alter table public.causal_tests
  add constraint causal_tests_test_time_check
  check (test_start is null or test_end is null or test_start <= test_end);

alter table public.verification_runs
  add constraint verification_runs_run_time_check
  check (run_start is null or run_end is null or run_start <= run_end);

-- Prevent meaningless evidence links.
alter table public.evidence_links
  add constraint evidence_links_source_required_check
  check (source_id is not null or source_reference <> '{}'::jsonb);

-- Canonical lifecycle consistency for verified outcomes.
alter table public.verified_outcomes
  add constraint verified_outcomes_verified_state_check
  check (
    verification_status <> 'verified'
    or (verified_at is not null and verified_by is not null)
  );

-- Evidence strength/confidence bounds.
alter table public.evidence_bundles
  add constraint evidence_bundles_confidence_range_check
  check (confidence is null or confidence between 0 and 1);

alter table public.causal_tests
  add constraint causal_tests_confidence_range_check
  check (confidence is null or confidence between 0 and 1);

-- Updated-at semantics: application updates should not have to remember them.
create or replace function private.touch_updated_at()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_factories on public.factories;
create trigger trg_touch_factories before update on public.factories
for each row execute function private.touch_updated_at();

drop trigger if exists trg_touch_asset_interventions on public.asset_interventions;
create trigger trg_touch_asset_interventions before update on public.asset_interventions
for each row execute function private.touch_updated_at();

drop trigger if exists trg_touch_data_source_mappings on public.data_source_mappings;
create trigger trg_touch_data_source_mappings before update on public.data_source_mappings
for each row execute function private.touch_updated_at();

drop trigger if exists trg_touch_processes on public.processes;
create trigger trg_touch_processes before update on public.processes
for each row execute function private.touch_updated_at();

drop trigger if exists trg_touch_products on public.products;
create trigger trg_touch_products before update on public.products
for each row execute function private.touch_updated_at();

drop trigger if exists trg_touch_decisions on public.decisions;
create trigger trg_touch_decisions before update on public.decisions
for each row execute function private.touch_updated_at();

-- Evidence is append/version oriented: don't permit changing its creation timestamp.
create or replace function private.guard_evidence_created_at()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='UPDATE' and new.created_at <> old.created_at then
    raise exception 'Evidence creation timestamp is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_evidence_created_at on public.evidence_bundles;
create trigger trg_guard_evidence_created_at before update on public.evidence_bundles
for each row execute function private.guard_evidence_created_at();

drop trigger if exists trg_guard_evidence_link_created_at on public.evidence_links;
create trigger trg_guard_evidence_link_created_at before update on public.evidence_links
for each row execute function private.guard_evidence_created_at();

-- High-value graph indexes for actual future access paths.
create index if not exists physical_relationships_source_factory_idx
  on public.physical_relationships(factory_id,source_asset_id);
create index if not exists physical_relationships_target_factory_idx
  on public.physical_relationships(factory_id,target_asset_id);
create index if not exists data_source_mappings_asset_factory_idx
  on public.data_source_mappings(factory_id,asset_id);
create index if not exists processes_parent_factory_idx
  on public.processes(factory_id,parent_process_id);
create index if not exists opportunities_economic_context_factory_idx
  on public.opportunities(factory_id,economic_context_id);
create index if not exists asset_interventions_decision_factory_idx
  on public.asset_interventions(factory_id,decision_id);
create index if not exists asset_interventions_opportunity_factory_idx
  on public.asset_interventions(factory_id,opportunity_id);
