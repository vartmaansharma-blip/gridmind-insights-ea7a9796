-- GridMind Phase 12.5c: FK index and trigger cleanup.
DROP TRIGGER IF EXISTS trg_validate_intervention_scope ON public.asset_interventions;

CREATE INDEX IF NOT EXISTS data_source_mappings_source_factory_idx ON public.data_source_mappings(data_source_id,factory_id);
CREATE INDEX IF NOT EXISTS observations_source_factory_idx ON public.observations(data_source_id,factory_id);
CREATE INDEX IF NOT EXISTS performance_expectations_context_factory_idx ON public.performance_expectations(context_id,factory_id);
CREATE INDEX IF NOT EXISTS performance_expectations_baseline_factory_idx ON public.performance_expectations(baseline_id,factory_id);
CREATE INDEX IF NOT EXISTS performance_deviations_observation_factory_idx ON public.performance_deviations(observation_id,factory_id);
CREATE INDEX IF NOT EXISTS performance_deviations_expectation_factory_idx ON public.performance_deviations(expectation_id,factory_id);
CREATE INDEX IF NOT EXISTS opportunities_deviation_factory_idx ON public.opportunities(deviation_id,factory_id);
CREATE INDEX IF NOT EXISTS opportunities_evidence_factory_idx ON public.opportunities(evidence_bundle_id,factory_id);
CREATE INDEX IF NOT EXISTS causal_hypotheses_opportunity_factory_idx ON public.causal_hypotheses(opportunity_id,factory_id);
CREATE INDEX IF NOT EXISTS causal_tests_hypothesis_factory_idx ON public.causal_tests(hypothesis_id,factory_id);
CREATE INDEX IF NOT EXISTS causal_tests_evidence_factory_idx ON public.causal_tests(evidence_bundle_id,factory_id);
CREATE INDEX IF NOT EXISTS decisions_opportunity_factory_idx ON public.decisions(opportunity_id,factory_id);
CREATE INDEX IF NOT EXISTS intervention_outcomes_intervention_factory_idx2 ON public.intervention_outcomes(intervention_id,factory_id);
CREATE INDEX IF NOT EXISTS intervention_outcomes_evidence_factory_idx ON public.intervention_outcomes(evidence_bundle_id,factory_id);
CREATE INDEX IF NOT EXISTS verification_plans_opportunity_factory_idx ON public.verification_plans(opportunity_id,factory_id);
CREATE INDEX IF NOT EXISTS verification_plans_intervention_factory_idx ON public.verification_plans(intervention_id,factory_id);
CREATE INDEX IF NOT EXISTS verification_plans_baseline_factory_idx ON public.verification_plans(baseline_id,factory_id);
CREATE INDEX IF NOT EXISTS verification_runs_plan_factory_idx2 ON public.verification_runs(verification_plan_id,factory_id);
CREATE INDEX IF NOT EXISTS verification_runs_evidence_factory_idx ON public.verification_runs(evidence_bundle_id,factory_id);
CREATE INDEX IF NOT EXISTS verified_outcomes_run_factory_idx2 ON public.verified_outcomes(verification_run_id,factory_id);
CREATE INDEX IF NOT EXISTS verified_outcomes_intervention_factory_idx ON public.verified_outcomes(intervention_id,factory_id);
