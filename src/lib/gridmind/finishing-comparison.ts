import { z } from "zod";
import { fictionalResolutionScenario } from "./resolve-workflow";

const id = z.string().trim().min(1).max(120);
const count = z.number().int().nonnegative().max(10000000);
const minutes = z.number().finite().nonnegative().max(10000000);
export const finishingScopeSchema = z.object({ organizationId: id, factoryId: id }).strict();
const batchSchema = z
  .object({
    id,
    phase: z.enum(["baseline", "comparison"]),
    part: id,
    operation: id,
    drawingRevision: id,
    materialGrade: id,
    routeRevision: id,
    shift: id,
    started: count.positive(),
    accepted: count,
    rejected: count,
    held: count,
    requiredPersonMinutes: minutes,
    repeatPersonMinutes: minutes,
    unclassifiedPersonMinutes: minutes,
    classificationReference: id.nullable(),
  })
  .strict()
  .superRefine((b, ctx) => {
    if (b.accepted + b.rejected + b.held !== b.started)
      ctx.addIssue({
        code: "custom",
        message:
          "Final dispositions must reconcile with started parts; reworked parts are not additional output",
      });
    if (b.repeatPersonMinutes > 0 && !b.classificationReference)
      ctx.addIssue({
        code: "custom",
        message: "Repeat work needs a fictional classification reference",
      });
  });
const inputSchema = z
  .object({
    origin: z.literal("synthetic"),
    scope: finishingScopeSchema,
    timeBasis: z.literal("person_minutes"),
    batches: z.array(batchSchema).length(2),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (
      new Set(d.batches.map((b) => b.id)).size !== 2 ||
      new Set(d.batches.map((b) => b.phase)).size !== 2
    )
      ctx.addIssue({ code: "custom", message: "Use distinct batch IDs and one batch per phase" });
  });
export type FinishingInput = z.infer<typeof inputSchema>;

/** Offline synthetic evidence check. No auth, persistence, causal diagnosis or savings engine. */
export async function compareFinishing(sourceText: string, expectedScope: unknown) {
  if (sourceText.length > 100000) throw new Error("Oversized synthetic source");
  const expected = finishingScopeSchema.parse(expectedScope);
  const input = inputSchema.parse(JSON.parse(sourceText));
  if (
    input.scope.organizationId !== expected.organizationId ||
    input.scope.factoryId !== expected.factoryId
  )
    throw new Error("Synthetic scope mismatch");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sourceText));
  const sourceSha256 = Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  const before = input.batches.find((b) => b.phase === "baseline")!;
  const after = input.batches.find((b) => b.phase === "comparison")!;
  const fields = [
    "part",
    "operation",
    "drawingRevision",
    "materialGrade",
    "routeRevision",
    "shift",
  ] as const;
  const gaps = fields.filter((f) => before[f] !== after[f]).map((f) => `Unmatched ${f}`);
  if (input.batches.some((b) => b.unclassifiedPersonMinutes > 0))
    gaps.push("Unclassified finishing time");
  if (input.batches.some((b) => b.accepted === 0)) gaps.push("No accepted-part denominator");
  if (input.batches.some((b) => b.held > 0))
    gaps.push("Held parts have unresolved final disposition");
  const metrics = input.batches.map((b) => ({
    batchId: b.id,
    sourcePointer: `/batches/${input.batches.indexOf(b)}`,
    phase: b.phase,
    requiredPersonMinutes: b.requiredPersonMinutes,
    repeatPersonMinutes: b.repeatPersonMinutes,
    unclassifiedPersonMinutes: b.unclassifiedPersonMinutes,
    totalPersonMinutes:
      b.requiredPersonMinutes + b.repeatPersonMinutes + b.unclassifiedPersonMinutes,
    personMinutesPerAcceptedPart:
      b.accepted === 0
        ? null
        : (b.requiredPersonMinutes + b.repeatPersonMinutes + b.unclassifiedPersonMinutes) /
          b.accepted,
    finalRejectionFraction: b.rejected / b.started,
  }));
  const baseline = metrics.find((b) => b.phase === "baseline")!;
  const comparison = metrics.find((b) => b.phase === "comparison")!;
  const caseDraft = fictionalResolutionScenario("R1");
  caseDraft.question =
    "Does one part's finishing record justify a qualified process check beyond current Excel/QMS practice?";
  caseDraft.sources = [
    {
      id: "SYN-FINISHING-SOURCE",
      reference: `Original synthetic JSON SHA-256 ${sourceSha256}; /batches/0 and /batches/1`,
      permission: "fictional_permission",
      check: "fictionally_checked",
      conflict: gaps.join("; "),
    },
  ];
  return {
    origin: "synthetic" as const,
    sourceText,
    sourceSha256,
    scope: input.scope,
    metrics,
    gaps,
    comparisonState: gaps.length ? ("inconclusive" as const) : ("descriptive_only" as const),
    personMinutesPerAcceptedPartChange: gaps.length
      ? null
      : comparison.personMinutesPerAcceptedPart! - baseline.personMinutesPerAcceptedPart!,
    hypotheses: [
      "Required edge/surface specification may explain the labor.",
      "Upstream tooling, material or setup may produce repeat work; not established.",
      "Recording, inspection or batch mix may explain the difference.",
    ],
    nextCheck:
      "Qualified reviewer checks specification, classification and matched conditions before any proposed action.",
    caseDraft,
    rootCause: null,
    verifiedSavings: null,
    approvedForCustomerUse: false as const,
  };
}

/** Recompute from preserved bytes; never trust edited derived metrics or reviewer state. */
export async function reopenFinishing(
  sourceText: string,
  sourceSha256: string,
  expectedScope: unknown,
) {
  const report = await compareFinishing(sourceText, expectedScope);
  if (report.sourceSha256 !== sourceSha256) throw new Error("Source digest mismatch");
  return report;
}
