/**
 * Canonical GridMind application contracts.
 *
 * These are domain contracts, not database row mirrors. Database schemas can
 * evolve without forcing the UI to understand storage details.
 */

export type FactoryId = number;
export type AssetId = number;
export type ObservationId = number;
export type OpportunityId = number;
export type InterventionId = number;

export type EvidenceState =
  | "observed"
  | "validated"
  | "derived"
  | "inferred"
  | "hypothesized"
  | "recommended"
  | "implemented"
  | "verified"
  | "rejected";

export type ObservationQuality =
  | "valid"
  | "suspect"
  | "invalid"
  | "missing"
  | "estimated"
  | "stale"
  | "out_of_range"
  | "conflicting"
  | "unverified";

export type FactoryContext = {
  organizationId: number;
  factoryId: FactoryId;
  name: string;
  location: string | null;
  industry: string | null;
  timezone: string;
};

export type ObservationContract = {
  id: ObservationId;
  factoryId: FactoryId;
  subjectType: "factory" | "asset" | "process" | "product" | "utility_system";
  subjectId: number | null;
  metric: string;
  valueNumeric: number | null;
  valueText: string | null;
  unit: string | null;
  observedAt: string;
  observedUntil: string | null;
  dataSourceId: number | null;
  qualityStatus: ObservationQuality;
  qualityScore: number | null;
  isEstimated: boolean;
  provenance: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type OperatingContextContract = {
  id: number;
  factoryId: FactoryId;
  scopeType: string;
  scopeId: number | null;
  contextType: string;
  startTime: string;
  endTime: string | null;
  status: string;
  confidence: number | null;
  sourceId: number | null;
  values: Record<string, unknown>;
};

export type PerformanceContract = {
  baselineId?: number;
  expectationId?: number;
  deviationId?: number;
  metric: string;
  value: number | null;
  expectedValue: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  unit: string | null;
  confidence: number | null;
  status: string;
};

export type OpportunityContract = {
  id: OpportunityId;
  factoryId: FactoryId;
  title: string;
  status: string;
  scopeType: string;
  scopeId: number | null;
  deviationId: number | null;
  evidenceBundleId: number | null;
  grossLoss: number | null;
  avoidableLoss: number | null;
  recoverableOpportunity: number | null;
  expectedRecovery: number | null;
  interventionCost: number | null;
  expectedNetValue: number | null;
  expectedRoi: number | null;
  expectedPaybackMonths: number | null;
  measurementConfidence: number | null;
  baselineConfidence: number | null;
  causalConfidence: number | null;
  economicConfidence: number | null;
  priorityScore: number | null;
  urgency: string | null;
};

export type InterventionContract = {
  id: InterventionId;
  factoryId: FactoryId;
  opportunityId: OpportunityId | null;
  targetScopeType: string | null;
  targetScopeId: number | null;
  status: string | null;
  description: string | null;
  implementationCost: number | null;
  expectedSavingInr: number | null;
  verificationMethod: Record<string, unknown>;
};

export type VerifiedOutcomeContract = {
  id: number;
  factoryId: FactoryId;
  interventionId: number;
  verificationRunId: number | null;
  verificationStatus: string;
  attributedEffect: number | null;
  physicalValue: number | null;
  economicValue: number | null;
  netValue: number | null;
  uncertaintyLower: number | null;
  uncertaintyUpper: number | null;
  measurementConfidence: number | null;
  baselineConfidence: number | null;
  attributionConfidence: number | null;
  economicConfidence: number | null;
};

export type GridMindFactorySnapshot = FactoryContext & {
  assets: Array<{
    id: AssetId;
    name: string;
    machineTypeId: number | null;
    ratedPowerKw: number | null;
    processRole: string | null;
  }>;
  observations: ObservationContract[];
  opportunities: OpportunityContract[];
  interventions: InterventionContract[];
  verifiedOutcomes: VerifiedOutcomeContract[];
};
