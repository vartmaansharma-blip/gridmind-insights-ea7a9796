import { z } from "zod";
import { latestDecision, type SampleWorkspace } from "@/lib/sample/workspace";
export const assistantModes = ["Explain", "Investigate", "Explore"] as const;
export type AssistantMode = (typeof assistantModes)[number];
export const explanationSchema = z
  .object({
    classification: z.literal("SYNTHETIC"),
    answer: z.string().min(1).max(3000),
    evidenceIds: z.array(z.string().max(100)).max(20),
    recordIds: z.array(z.string().max(100)).max(20),
    assumptions: z.array(z.string().max(500)).min(1).max(10),
    uncertainty: z.array(z.string().max(500)).min(1).max(10),
    nextStep: z.string().min(1).max(500),
    reviewRequired: z.literal(true),
    verifiedSavings: z.null(),
  })
  .strict();
export type Explanation = z.infer<typeof explanationSchema>;
/** Deterministic read-only presentation of existing calculations; never executes a question as a command. */
export function explainSample(
  s: SampleWorkspace,
  recordId: string | undefined,
  mode: AssistantMode,
  question: string,
): Explanation {
  if (!question.trim() || question.length > 600)
    throw new Error("Enter a question of 1–600 characters.");
  const c =
    s.cases.find(
      (c) => c.id === recordId || c.subjectId === recordId || c.orderIds.includes(recordId ?? ""),
    ) ?? (!recordId ? s.cases.at(-1) : undefined);
  const record = s.core.entities.find((e) => e.id === recordId);
  const d = c ? latestDecision(s, c) : undefined;
  const evidenceIds = [
    ...new Set([...(record?.evidenceIds ?? []), ...(c?.evidenceIds ?? []), "sample-template"]),
  ];
  let answer = c
    ? `${c.title}: ${c.observation} Hypothesis: ${c.hypothesis} Unresolved: ${c.unresolved}`
    : record
      ? `${record.label} is a fictional ${record.kind.replaceAll("_", " ")} in ${s.profile.factory}. Its connected records and source cards describe the same session input.`
      : `${s.profile.organization} is a fictional organization with two presses, production orders, material lots and shared resources. It demonstrates traceable calculations and simulated review.`;
  if (d?.evaluation) {
    answer += d.stale
      ? " The saved evaluation is stale because source records changed. It cannot support a current review."
      : ` The current finite planner returned ${d.evaluation.plan.status}. Machine alternatives: ${d.evaluation.alternatives.map((a) => `${a.resourceId}: ${a.eligible ? "eligible for simulated review" : "blocked or needs review"}${a.reasons.length ? ` (${a.reasons.join(", ")})` : ""}`).join("; ") || "none evaluated"}.`;
  }
  if (mode === "Investigate")
    answer +=
      " Establish the affected order and exact source record before comparing alternatives; an observation is not a diagnosed cause.";
  if (mode === "Explore")
    answer +=
      " Follow a related order, machine or investigation below; this explanation does not edit records or authorize an action.";
  return validateExplanation(
    explanationSchema.parse({
      classification: "SYNTHETIC",
      answer,
      evidenceIds,
      recordIds: [
        ...new Set([
          ...(record ? [record.id] : []),
          ...(c ? [c.id, c.subjectId, ...c.orderIds] : []),
        ]),
      ],
      assumptions: [
        "All inputs are fictional. Replay time is fixed at 20 October 2026, 12:00 UTC.",
        "Illustrative cycle/setup times and capacities are not plant measurements.",
      ],
      uncertainty: [
        ...(d?.evaluation?.uncertainty ?? []),
        "No actual production outcome, root cause, customer value or savings has been verified.",
      ],
      nextStep: c
        ? !d?.evaluation || d.stale
          ? "Evaluate the current investigation records before recording a simulated decision."
          : "Inspect each alternative and its source cards, then defer, reject or record a simulated human review."
        : "Open Machines & Resources, register Press 03, then create a compatible production order.",
      reviewRequired: true,
      verifiedSavings: null,
    }),
    s,
  );
}
export function validateExplanation(value: unknown, s: SampleWorkspace): Explanation {
  const parsed = explanationSchema.parse(value);
  if (
    parsed.evidenceIds.some((id) => !s.core.evidence.some((e) => e.id === id)) ||
    parsed.recordIds.some(
      (id) => !s.core.entities.some((e) => e.id === id) && !s.cases.some((c) => c.id === id),
    )
  )
    throw new Error("Explanation referenced an unavailable source or record.");
  return parsed;
}
