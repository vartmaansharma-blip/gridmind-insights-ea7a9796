import { z } from "zod";
import { resolveLaneSchema } from "./resolve-intake";

/**
 * Non-persistent internal GridMind 3.1 DEMONSTRATION contract.
 * No real data rights, qualified professional review or customer approval
 * can be established by a record from this module.
 */
const note = z.string().trim().min(1).max(500);
const sourceSchema = z.object({
  id: note,
  reference: note,
  permission: z.enum(["unknown", "fictional_permission"]),
  check: z.enum(["unknown", "fictionally_checked"]),
  conflict: z.string().max(500),
}).strict();
const actionSchema = z.object({
  ownerRole: note,
  nextStep: note,
  status: z.enum(["planned", "fictionally_completed"]),
  customerAuthorization: z.enum(["not_recorded", "fictionally_authorized"]),
}).strict();

export const syntheticResolveCaseSchema = z.object({
  origin: z.literal("synthetic"),
  lane: resolveLaneSchema,
  caseRevision: z.number().int().positive(),
  question: note,
  sources: z.array(sourceSchema).max(50),
  simulatedReview: z.object({
    revision: z.number().int().positive(),
    decision: z.enum(["revise", "reject", "accept"]),
    simulated: z.literal(true),
  }).strict().nullable(),
  actions: z.array(actionSchema).max(50),
  fictionalOutcome: z.object({
    baseline: z.number().finite().nullable(),
    observed: z.number().finite().nullable(),
    unit: note,
    limitation: note,
  }).strict().nullable(),
}).strict();

export type SyntheticResolveCase = z.infer<typeof syntheticResolveCaseSchema>;
export type SyntheticProcessStage =
  | "source_needed"
  | "source_permission_needed"
  | "source_check_needed"
  | "source_conflict"
  | "simulated_review_needed"
  | "revision_changed"
  | "simulated_revision_requested"
  | "simulated_review_rejected"
  | "customer_action_needed"
  | "action_followup_needed"
  | "measurement_missing"
  | "fictional_process_complete";

export function evaluateSyntheticResolveCase(input: unknown) {
  const example = syntheticResolveCaseSchema.parse(input);
  const reasons: string[] = [];
  let stage: SyntheticProcessStage = "fictional_process_complete";

  if (example.sources.length === 0) {
    stage = "source_needed";
    reasons.push("Fictional source references are missing.");
  } else if (new Set(example.sources.map((s) => s.id)).size !== example.sources.length) {
    stage = "source_conflict";
    reasons.push("Duplicate fictional source identifiers must be reconciled.");
  } else if (example.sources.some((s) => s.permission !== "fictional_permission")) {
    stage = "source_permission_needed";
    reasons.push("The scenario does not have source-use permission recorded.");
  } else if (example.sources.some((s) => s.conflict.trim() !== "")) {
    stage = "source_conflict";
    reasons.push("Conflicting fictional source records need reconciliation.");
  } else if (example.sources.some((s) => s.check !== "fictionally_checked")) {
    stage = "source_check_needed";
    reasons.push("Fictional records have not passed their simulated source checks.");
  } else if (!example.simulatedReview) {
    stage = "simulated_review_needed";
    reasons.push("No simulated reviewer decision recorded.");
  } else if (example.simulatedReview.revision !== example.caseRevision) {
    stage = "revision_changed";
    reasons.push("Prior simulated review is stale after a fictional case revision.");
  } else if (example.simulatedReview.decision === "revise") {
    stage = "simulated_revision_requested";
    reasons.push("Fictional reviewer requests changes before proceeding.");
  } else if (example.simulatedReview.decision === "reject") {
    stage = "simulated_review_rejected";
    reasons.push("Fictional reviewer rejected the working findings.");
  } else if (example.actions.length === 0 ||
    example.actions.some((a) => a.customerAuthorization !== "fictionally_authorized")) {
    stage = "customer_action_needed";
    reasons.push("No separately authorized fictional corrective action recorded.");
  } else if (example.actions.some((a) => a.status !== "fictionally_completed")) {
    stage = "action_followup_needed";
    reasons.push("A fictional corrective action remains unfinished.");
  } else if (!example.fictionalOutcome ||
    example.fictionalOutcome.baseline === null ||
    example.fictionalOutcome.observed === null) {
    stage = "measurement_missing";
    reasons.push("No comparable fictional baseline and follow-up measurement.");
  }

  return {
    origin: "synthetic" as const,
    lane: example.lane,
    stage,
    reasons,
    sourceCount: example.sources.length,
    actionCount: example.actions.length,
    approvedForCustomerUse: false as const,
    verifiedEconomicOutcome: false as const,
    realProfessionalReview: false as const,
  };
}

export function fictionalResolutionScenario(lane: "R1" | "R2" | "R3"): SyntheticResolveCase {
  return {
    origin: "synthetic",
    lane,
    caseRevision: 1,
    question: "Fictional example: which evidence would resolve this business exception?",
    sources: [
      {
        id: "DEMO-SOURCE-001",
        reference: "Imaginary documentary reference — no real factory record",
        permission: "fictional_permission",
        check: "fictionally_checked",
        conflict: "",
      },
    ],
    simulatedReview: null,
    actions: [],
    fictionalOutcome: null,
  };
}
