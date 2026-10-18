import { z } from "zod";

/**
 * GridMind 3.1 commercial discovery triage, NOT the connected investigation engine.
 * Every accepted record is fictional. This module cannot approve customer actions,
 * calculate recoverable losses, establish technical conclusions, or accept live data.
 */
export const resolveLaneSchema = z.enum(["R1", "R2", "R3"]);
export type ResolveLane = z.infer<typeof resolveLaneSchema>;

const note = z.string().trim().min(3).max(1200);
export const syntheticExceptionSchema = z
  .object({
    origin: z.literal("synthetic"),
    lane: resolveLaneSchema,
    problem: note,
    existingAlternative: note,
    decisionOwnerRole: note,
    consequence: note,
    evidenceReferences: z.array(z.string().trim().min(3).max(150)).max(20),
    qualifiedReviewerConfirmed: z.boolean(),
    actualBuyerNextStepConfirmed: z.boolean(),
  })
  .strict();

export type SyntheticException = z.infer<typeof syntheticExceptionSchema>;

export const RESOLVE_LANES = {
  R1: {
    title: "Quality & production exceptions",
    investigation: "Customer rejection, repeat defect, or directly related incident",
    reviewer: "Qualified manufacturing-quality or plant specialist",
    promise: "Evidence and corrective-action decision support, not autonomous root cause",
  },
  R2: {
    title: "Acceptance & invoice disputes",
    investigation: "Documented acceptance, delivery or invoice disagreement",
    reviewer: "Appropriate commercial/accounting specialist",
    promise: "Reconcile evidence and ownership, not collection or lending",
  },
  R3: {
    title: "Electricity exposure",
    investigation: "Defined bill, tariff or contract decision",
    reviewer: "Qualified electricity/tariff specialist",
    promise: "Sourced decision brief, not guaranteed savings or energy certification",
  },
} as const;

export function assessSyntheticException(input: unknown) {
  const item = syntheticExceptionSchema.parse(input);
  const gaps: string[] = [];
  if (!item.evidenceReferences.length)
    gaps.push("Source records and permission would need separate authorization.");
  if (!item.qualifiedReviewerConfirmed)
    gaps.push(`No confirmed reviewer: ${RESOLVE_LANES[item.lane].reviewer}.`);
  if (!item.actualBuyerNextStepConfirmed)
    gaps.push("No real buyer authorization or commercial next step.");
  // A complete fictional form is *never* equivalent to a live, professionally reviewed case.
  return {
    lane: item.lane,
    title: RESOLVE_LANES[item.lane].title,
    recordedQuestion: item.problem,
    currentAlternative: item.existingAlternative,
    decisionOwnerRole: item.decisionOwnerRole,
    unverifiedConsequence: item.consequence,
    evidenceReferenceCount: item.evidenceReferences.length,
    nextQuestions: gaps,
    readiness: "synthetic_discovery_only" as const,
    approvedForCustomerUse: false as const,
    verifiedEconomicOutcome: false as const,
  };
}

export const SYNTHETIC_EXCEPTION_EXAMPLES: Record<ResolveLane, SyntheticException> = {
  R1: {
    origin: "synthetic",
    lane: "R1",
    problem: "A fictional supplier receives a repeat component-rejection complaint.",
    existingAlternative: "Its fictional quality team already uses an 8D spreadsheet.",
    decisionOwnerRole: "Quality head / plant owner",
    consequence: "Possible additional rework and delayed acceptance; no figures verified.",
    evidenceReferences: [],
    qualifiedReviewerConfirmed: false,
    actualBuyerNextStepConfirmed: false,
  },
  R2: {
    origin: "synthetic",
    lane: "R2",
    problem: "A fictional buyer disputes acceptance of delivered components.",
    existingAlternative: "The fictional accounts team follows up using email and ERP notes.",
    decisionOwnerRole: "Finance head / commercial owner",
    consequence: "An invoice remains disputed in this fictional scenario; no amount verified.",
    evidenceReferences: [],
    qualifiedReviewerConfirmed: false,
    actualBuyerNextStepConfirmed: false,
  },
  R3: {
    origin: "synthetic",
    lane: "R3",
    problem: "A fictional factory wants to understand an electricity billing change.",
    existingAlternative: "Its fictional electrician and accountant already check bills.",
    decisionOwnerRole: "Owner / energy and finance lead",
    consequence: "A question about expenditure, not a documented billing error or saving.",
    evidenceReferences: [],
    qualifiedReviewerConfirmed: false,
    actualBuyerNextStepConfirmed: false,
  },
};
