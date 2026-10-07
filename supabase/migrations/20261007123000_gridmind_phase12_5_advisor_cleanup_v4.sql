-- GridMind Phase 12.5d: advisor cleanup.
-- Removes duplicate indexes and adds exact-order indexes for remaining FK paths.
DROP INDEX IF EXISTS public.intervention_outcomes_intervention_factory_idx2;
DROP INDEX IF EXISTS public.verification_runs_plan_factory_idx2;
DROP INDEX IF EXISTS public.verified_outcomes_run_factory_idx2;

CREATE INDEX IF NOT EXISTS asset_interventions_approved_by_idx ON public.asset_interventions(approved_by);
CREATE INDEX IF NOT EXISTS asset_interventions_asset_factory_fk_idx ON public.asset_interventions(asset_id,factory_id);
CREATE INDEX IF NOT EXISTS asset_interventions_causal_evidence_idx ON public.asset_interventions(causal_basis_evidence_id);
CREATE INDEX IF NOT EXISTS asset_interventions_decision_factory_fk_idx ON public.asset_interventions(decision_id,factory_id);
CREATE INDEX IF NOT EXISTS asset_interventions_decision_idx ON public.asset_interventions(decision_id);
CREATE INDEX IF NOT EXISTS asset_interventions_opportunity_factory_fk_idx ON public.asset_interventions(opportunity_id,factory_id);
CREATE INDEX IF NOT EXISTS causal_tests_factory_idx ON public.causal_tests(factory_id);
CREATE INDEX IF NOT EXISTS data_source_mappings_asset_factory_fk_idx ON public.data_source_mappings(asset_id,factory_id);
CREATE INDEX IF NOT EXISTS data_source_mappings_validated_by_idx ON public.data_source_mappings(validated_by);
CREATE INDEX IF NOT EXISTS decisions_decision_maker_idx ON public.decisions(decision_maker);
CREATE INDEX IF NOT EXISTS evidence_links_bundle_factory_fk_idx ON public.evidence_links(evidence_bundle_id,factory_id);
CREATE INDEX IF NOT EXISTS factory_members_factory_org_fk_idx ON public.factory_members(factory_id,organization_id);
CREATE INDEX IF NOT EXISTS learning_events_evidence_bundle_idx ON public.learning_events(evidence_bundle_id);
CREATE INDEX IF NOT EXISTS learning_events_source_outcome_idx ON public.learning_events(source_outcome_id);
CREATE INDEX IF NOT EXISTS operating_contexts_source_idx ON public.operating_contexts(source_id);
CREATE INDEX IF NOT EXISTS opportunities_economic_context_factory_fk_idx ON public.opportunities(economic_context_id,factory_id);
CREATE INDEX IF NOT EXISTS performance_expectations_factory_idx ON public.performance_expectations(factory_id);
CREATE INDEX IF NOT EXISTS physical_relationships_source_factory_fk_idx ON public.physical_relationships(source_asset_id,factory_id);
CREATE INDEX IF NOT EXISTS physical_relationships_target_factory_fk_idx ON public.physical_relationships(target_asset_id,factory_id);
CREATE INDEX IF NOT EXISTS processes_parent_process_idx ON public.processes(parent_process_id);
CREATE INDEX IF NOT EXISTS verified_outcomes_verified_by_idx ON public.verified_outcomes(verified_by);
