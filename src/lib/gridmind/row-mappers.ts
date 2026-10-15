import type { Database } from "@/integrations/supabase/types";
import type { OpportunityContract, VerifiedOutcomeContract } from "./domain";

type OpportunityReadRow = Pick<
  Database["public"]["Tables"]["opportunities"]["Row"],
  | "id"
  | "factory_id"
  | "title"
  | "currency"
  | "status"
  | "scope_type"
  | "scope_id"
  | "deviation_id"
  | "evidence_bundle_id"
  | "gross_loss"
  | "avoidable_loss"
  | "recoverable_opportunity"
  | "expected_recovery"
  | "intervention_cost"
  | "expected_net_value"
  | "expected_roi"
  | "expected_payback_months"
  | "measurement_confidence"
  | "baseline_confidence"
  | "causal_confidence"
  | "economic_confidence"
  | "priority_score"
  | "urgency"
>;

/** Explicit storage boundary: a type assertion cannot rename database properties. */
export function opportunityToDomain(row: OpportunityReadRow): OpportunityContract {
  return {
    id: row.id,
    factoryId: row.factory_id,
    title: row.title,
    currency: row.currency,
    status: row.status,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    deviationId: row.deviation_id,
    evidenceBundleId: row.evidence_bundle_id,
    grossLoss: row.gross_loss,
    avoidableLoss: row.avoidable_loss,
    recoverableOpportunity: row.recoverable_opportunity,
    expectedRecovery: row.expected_recovery,
    interventionCost: row.intervention_cost,
    expectedNetValue: row.expected_net_value,
    expectedRoi: row.expected_roi,
    expectedPaybackMonths: row.expected_payback_months,
    measurementConfidence: row.measurement_confidence,
    baselineConfidence: row.baseline_confidence,
    causalConfidence: row.causal_confidence,
    economicConfidence: row.economic_confidence,
    priorityScore: row.priority_score,
    urgency: row.urgency,
  };
}

export function verifiedOutcomeToDomain(
  row: Database["public"]["Tables"]["verified_outcomes"]["Row"],
): VerifiedOutcomeContract {
  return {
    id: row.id,
    factoryId: row.factory_id,
    interventionId: row.intervention_id,
    verificationRunId: row.verification_run_id,
    verificationStatus: row.verification_status,
    physicalEffect: row.physical_effect,
    economicValue: row.economic_value,
    implementationCost: row.implementation_cost,
    netValue: row.net_value,
    currency: row.currency,
    attributionMethod: row.attribution_method,
    uncertaintyLower: row.uncertainty_lower,
    uncertaintyUpper: row.uncertainty_upper,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
  };
}
