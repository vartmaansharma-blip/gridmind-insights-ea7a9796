-- GridMind Phase 12.5f: provenance-preserving delete semantics.
-- Composite factory-scoped references use RESTRICT so factory_id can never
-- be nulled as a side effect of deleting a referenced historical object.

ALTER TABLE public.data_source_mappings DROP CONSTRAINT IF EXISTS data_source_mappings_asset_factory_fkey;
ALTER TABLE public.data_source_mappings ADD CONSTRAINT data_source_mappings_asset_factory_fkey
  FOREIGN KEY (asset_id,factory_id) REFERENCES public.factory_assets(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_economic_context_factory_fkey;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_economic_context_factory_fkey
  FOREIGN KEY (economic_context_id,factory_id) REFERENCES public.economic_contexts(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.asset_interventions DROP CONSTRAINT IF EXISTS asset_interventions_opportunity_factory_fkey;
ALTER TABLE public.asset_interventions ADD CONSTRAINT asset_interventions_opportunity_factory_fkey
  FOREIGN KEY (opportunity_id,factory_id) REFERENCES public.opportunities(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.asset_interventions DROP CONSTRAINT IF EXISTS asset_interventions_decision_factory_fkey;
ALTER TABLE public.asset_interventions ADD CONSTRAINT asset_interventions_decision_factory_fkey
  FOREIGN KEY (decision_id,factory_id) REFERENCES public.decisions(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.causal_hypotheses DROP CONSTRAINT IF EXISTS hypotheses_opportunity_factory_fkey;
ALTER TABLE public.causal_hypotheses ADD CONSTRAINT hypotheses_opportunity_factory_fkey
  FOREIGN KEY (opportunity_id,factory_id) REFERENCES public.opportunities(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.causal_tests DROP CONSTRAINT IF EXISTS causal_tests_evidence_factory_fkey;
ALTER TABLE public.causal_tests ADD CONSTRAINT causal_tests_evidence_factory_fkey
  FOREIGN KEY (evidence_bundle_id,factory_id) REFERENCES public.evidence_bundles(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.intervention_outcomes DROP CONSTRAINT IF EXISTS intervention_outcomes_evidence_factory_fkey;
ALTER TABLE public.intervention_outcomes ADD CONSTRAINT intervention_outcomes_evidence_factory_fkey
  FOREIGN KEY (evidence_bundle_id,factory_id) REFERENCES public.evidence_bundles(id,factory_id) ON DELETE RESTRICT;

ALTER TABLE public.verification_runs DROP CONSTRAINT IF EXISTS verification_runs_evidence_factory_fkey;
ALTER TABLE public.verification_runs ADD CONSTRAINT verification_runs_evidence_factory_fkey
  FOREIGN KEY (evidence_bundle_id,factory_id) REFERENCES public.evidence_bundles(id,factory_id) ON DELETE RESTRICT;
