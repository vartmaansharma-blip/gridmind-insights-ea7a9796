alter table public.data_source_mappings drop constraint if exists data_source_mappings_asset_factory_fkey;
alter table public.data_source_mappings add constraint data_source_mappings_asset_factory_fkey foreign key (asset_id,factory_id) references public.factory_assets(id,factory_id) on delete restrict;

alter table public.opportunities drop constraint if exists opportunities_economic_context_factory_fkey;
alter table public.opportunities add constraint opportunities_economic_context_factory_fkey foreign key (economic_context_id,factory_id) references public.economic_contexts(id,factory_id) on delete restrict;

alter table public.asset_interventions drop constraint if exists asset_interventions_opportunity_factory_fkey;
alter table public.asset_interventions add constraint asset_interventions_opportunity_factory_fkey foreign key (opportunity_id,factory_id) references public.opportunities(id,factory_id) on delete restrict;

alter table public.asset_interventions drop constraint if exists asset_interventions_decision_factory_fkey;
alter table public.asset_interventions add constraint asset_interventions_decision_factory_fkey foreign key (decision_id,factory_id) references public.decisions(id,factory_id) on delete restrict;

alter table public.causal_hypotheses drop constraint if exists hypotheses_opportunity_factory_fkey;
alter table public.causal_hypotheses add constraint hypotheses_opportunity_factory_fkey foreign key (opportunity_id,factory_id) references public.opportunities(id,factory_id) on delete restrict;

alter table public.causal_tests drop constraint if exists causal_tests_evidence_factory_fkey;
alter table public.causal_tests add constraint causal_tests_evidence_factory_fkey foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete restrict;

alter table public.intervention_outcomes drop constraint if exists intervention_outcomes_evidence_factory_fkey;
alter table public.intervention_outcomes add constraint intervention_outcomes_evidence_factory_fkey foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete restrict;

alter table public.verification_runs drop constraint if exists verification_runs_evidence_factory_fkey;
alter table public.verification_runs add constraint verification_runs_evidence_factory_fkey foreign key (evidence_bundle_id,factory_id) references public.evidence_bundles(id,factory_id) on delete restrict;