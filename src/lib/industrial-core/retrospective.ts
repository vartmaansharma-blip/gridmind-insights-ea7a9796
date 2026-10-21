import { z } from "zod";
import { id, instant } from "./model";
import { runPhysicalScenario } from "./physical";

/**
 * GM-MVP-003: preparation gate for one permissioned historical experiment.
 *
 * This module only accepts invented public-safe templates, NOT customer records.
 * It does not create a second manufacturing rule engine, consent ledger,
 * professional credential verifier, production endpoint or paid-pilot claim.
 */
const field = z.enum([
  "process_and_part_revision",
  "event_chronology_and_source",
  "actual_decision_window",
  "incumbent_excel_erp_or_staff_response",
  "customer_order_and_due_date",
  "material_tooling_machine_eligibility",
  "alternative_action_and_authority",
  "verified_actual_outcome",
  "finishing_required_vs_repeat",
  "quality_disposition_and_rework",
  "finishing_engineering_qualification",
]);
export type RetrospectiveField = z.infer<typeof field>;
export const retrospectiveCaseSchema = z.object({
  schemaVersion: z.literal("gm-retrospective-001/v1"),
  origin: z.literal("synthetic"),
  caseId: id,
  factory: z.literal("FICTIONAL metal-component supplier"),
  decisionAt: instant,
  records: z.array(z.object({
    field,
    state: z.enum(["missing", "reported", "source_linked", "contradictory"]),
    // IDs here refer only to fictional or potential source labels, not raw documents.
    sourceRefs: z.array(id).max(5),
  }).strict()).max(30),
  commercial: z.object({
    customerPermission: z.literal("not_obtained"),
    secureStorageApproved: z.literal(false),
    qualifiedIndependentReviewerEngaged: z.literal(false),
    buyerConfirmed: z.literal(false),
    paymentReceived: z.literal(false),
  }).strict(),
}).strict().superRefine((s, ctx) => {
  if (new Set(s.records.map((r) => r.field)).size !== s.records.length)
    ctx.addIssue({ code: "custom", message: "Duplicate retrospective fields" });
  for (const record of s.records)
    if (
      (record.state === "source_linked" && !record.sourceRefs.length) ||
      (record.state === "missing" && record.sourceRefs.length)
    ) ctx.addIssue({ code: "custom", message: "Invalid field provenance" });
});
export type RetrospectiveCase = z.infer<typeof retrospectiveCaseSchema>;

const commonFields = [
  "process_and_part_revision", "event_chronology_and_source", "actual_decision_window",
  "incumbent_excel_erp_or_staff_response", "alternative_action_and_authority",
  "verified_actual_outcome",
] as const satisfies readonly RetrospectiveField[];
const laneFields = {
  production_interruption: [
    ...commonFields,
    "customer_order_and_due_date", "material_tooling_machine_eligibility",
  ],
  finishing_quality: [
    ...commonFields,
    "finishing_required_vs_repeat", "quality_disposition_and_rework",
    "finishing_engineering_qualification",
  ],
} as const satisfies Record<string, readonly RetrospectiveField[]>;
export type RetrospectiveLane = keyof typeof laneFields;

/** Completeness is documentary, never a claim that a factory problem is worth solving. */
export function assessRetrospectiveCase(value: unknown) {
  const input = retrospectiveCaseSchema.parse(value);
  const byField = new Map(input.records.map((r) => [r.field, r]));
  const lanes = (Object.keys(laneFields) as RetrospectiveLane[]).map((lane) => {
    const missing = laneFields[lane].filter((name) => {
      const record = byField.get(name);
      return !record || record.state !== "source_linked";
    });
    const conflicting = missing.filter((name) => byField.get(name)?.state === "contradictory");
    return {
      lane,
      sourceCompleteInFiction: missing.length === 0,
      missingOrUnverified: missing,
      contradictory: conflicting,
      permissionedHistoricalComparisonAllowed: false as const,
    };
  });
  const bothTestable = lanes.every((lane) => lane.sourceCompleteInFiction);
  return {
    schemaVersion: "gm-retrospective-assessment/v1" as const,
    origin: "synthetic" as const,
    caseId: input.caseId,
    lanes,
    commercialWinnerSelected: false as const,
    comparativeConclusion: bothTestable
      ? "synthetic_specification_ready_for_method_review" as const
      : "insufficient_evidence_for_comparison" as const,
    actualCustomerPermission: false as const,
    actualReviewerEngaged: false as const,
    realCustomerDataProcessingAllowed: false as const,
    verifiedIncrementalValue: null,
    verifiedSavings: null,
    payingCustomer: false as const,
    nextHumanDependency:
      "Confirm the incident/process with the owner; obtain scoped permission and a qualified reviewer; compare with the factory's actual Excel/ERP/staff work.",
  };
}

/**
 * The sample is an incomplete case by design: an investigated machine stop
 * establishes neither the actual decision window nor a factory's baseline.
 */
export function syntheticRetrospectiveFixture() {
  const sample: RetrospectiveCase = {
    schemaVersion: "gm-retrospective-001/v1",
    origin: "synthetic",
    caseId: "SYN-RETRO-01",
    factory: "FICTIONAL metal-component supplier",
    decisionAt: "2026-10-20T12:00:00.000Z",
    records: [
      { field: "process_and_part_revision", state: "source_linked", sourceRefs: ["fictional-part"] },
      { field: "event_chronology_and_source", state: "source_linked", sourceRefs: ["fictional-stop"] },
      { field: "actual_decision_window", state: "missing", sourceRefs: [] },
      { field: "incumbent_excel_erp_or_staff_response", state: "missing", sourceRefs: [] },
      { field: "customer_order_and_due_date", state: "source_linked", sourceRefs: ["fictional-order"] },
      { field: "material_tooling_machine_eligibility", state: "reported", sourceRefs: ["fictional-routing"] },
      { field: "alternative_action_and_authority", state: "missing", sourceRefs: [] },
      { field: "verified_actual_outcome", state: "missing", sourceRefs: [] },
      { field: "finishing_required_vs_repeat", state: "missing", sourceRefs: [] },
      { field: "quality_disposition_and_rework", state: "missing", sourceRefs: [] },
      { field: "finishing_engineering_qualification", state: "missing", sourceRefs: [] },
    ],
    commercial: {
      customerPermission: "not_obtained",
      secureStorageApproved: false,
      qualifiedIndependentReviewerEngaged: false,
      buyerConfirmed: false,
      paymentReceived: false,
    },
  };
  return retrospectiveCaseSchema.parse(sample);
}

/**
 * Reuse the merged physical/owner factory evaluation, not a fabricated pilot
 * observation. This sample is a reproducible demonstration of what we can
 * reconstruct and, crucially, which evidence a real pilot is missing.
 */
export function runRetrospectivePreparationSample() {
  const packet = syntheticRetrospectiveFixture();
  const assessment = assessRetrospectiveCase(packet);
  const physical = runPhysicalScenario("machine_stop");
  return {
    ...assessment,
    physicalTrace: {
      origin: "synthetic" as const,
      decisionAlgorithm: physical.decision.algorithmVersion,
      affectedOrderIds: [...new Set(physical.impacts.flatMap((i) => i.orders.map((o) => o.orderId)))],
      resourceStopVerifiedInFiction: physical.impacts.some((i) => i.exposure === "confirmed_machine_unavailable"),
      actionableCustomerBenefitVerified: false as const,
    },
  };
}
