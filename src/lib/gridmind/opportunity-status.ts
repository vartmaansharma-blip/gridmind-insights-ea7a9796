/** Persisted lifecycle values from the opportunities.status CHECK constraint. */
export const CANONICAL_OPPORTUNITY_STATUSES = [
  "detected",
  "quantified",
  "investigating",
  "diagnosed",
  "recommended",
  "accepted",
  "in_progress",
  "awaiting_verification",
  "verified",
  "closed",
  "invalid",
  "insufficient_evidence",
  "not_material",
  "not_actionable",
  "rejected",
  "superseded",
  "unverified",
] as const;

export type CanonicalOpportunityStatus = (typeof CANONICAL_OPPORTUNITY_STATUSES)[number];

export function isCanonicalOpportunityStatus(value: string): value is CanonicalOpportunityStatus {
  return CANONICAL_OPPORTUNITY_STATUSES.some((status) => status === value);
}
