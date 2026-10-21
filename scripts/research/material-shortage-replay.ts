/** Offline research adapter. Invented fixtures only; no I/O, routes or persisted cases. */
import { createHash } from "node:crypto";
import { z } from "zod";
import { syntheticCase } from "../../src/lib/investigation/fixtures";
import {
  caseSchema,
  evidenceSchema,
  eventSchema,
  findingSchema,
} from "../../src/lib/investigation/schema";

const timestamp = z.string().datetime({ offset: true });
const anchor = z.enum([
  "signal",
  "discovered",
  "notified",
  "escalated",
  "acknowledged",
  "dispatched",
  "arrived",
  "stopped",
  "restarted",
]);
const inputSchema = z
  .object({
    origin: z.literal("synthetic"),
    records: z
      .array(
        z
          .object({
            anchor,
            reference: z.string().min(1).max(500),
            at: timestamp.nullable(),
            recordedAt: timestamp.nullable(),
            permitted: z.boolean(),
            clockVerified: z.boolean(),
            conflict: z.string().max(1000),
          })
          .strict(),
      )
      .max(30),
  })
  .strict();
export type ReplayInput = z.infer<typeof inputSchema>;

/** Computes only descriptive intervals. Counterfactual authority stays with a human. */
export function replayMaterialShortage(raw: unknown) {
  const input = inputSchema.parse(raw);
  if (new Set(input.records.map((r) => r.anchor)).size !== input.records.length) {
    throw new Error("Conflicting/duplicate anchors require reconciliation, not overwrite");
  }
  const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const issues: string[] = [];
  const records = new Map(input.records.map((r) => [r.anchor, r]));
  for (const r of input.records) {
    if (!r.permitted || !r.clockVerified || r.conflict || !r.at || !r.recordedAt) {
      issues.push(`${r.anchor}: permission, clock, conflict or time unresolved`);
    } else if (Date.parse(r.recordedAt) < Date.parse(r.at)) {
      issues.push(`${r.anchor}: record predates claimed event; reconcile time meaning`);
    }
  }
  const pairs = {
    warningOpportunity: ["signal", "discovered"],
    internalHandoff: ["discovered", "notified"],
    externalEscalation: ["notified", "escalated"],
    acknowledgment: ["escalated", "acknowledged"],
    fulfillment: ["dispatched", "arrived"],
    stopped: ["stopped", "restarted"],
  } as const;
  const elapsed: Record<keyof typeof pairs, number | null> = {
    warningOpportunity: null,
    internalHandoff: null,
    externalEscalation: null,
    acknowledgment: null,
    fulfillment: null,
    stopped: null,
  };
  for (const [name, [a, b]] of Object.entries(pairs)) {
    const left = records.get(a);
    const right = records.get(b);
    if (!left?.at || !right?.at) {
      issues.push(`${name}: missing anchor`);
      continue;
    }
    // A retrospectively backfilled signal cannot establish earlier knowledge.
    const start = a === "signal" ? left.recordedAt : left.at;
    if (!start || Date.parse(right.at) < Date.parse(start)) {
      issues.push(`${name}: chronology conflict or hindsight-only signal`);
      continue;
    }
    elapsed[name as keyof typeof pairs] = (Date.parse(right.at) - Date.parse(start)) / 60000;
  }
  // Block all precise intervals if any required evidence/clock/chronology is unresolved.
  if (issues.length)
    for (const key of Object.keys(elapsed)) elapsed[key as keyof typeof pairs] = null;
  const c = syntheticCase("C1", `SYN-MATERIAL-${digest.slice(0, 12)}`);
  const times = input.records
    .flatMap((r) => (r.at ? [r.at] : []))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  c.title = "Invented material-shortage chronology; research only";
  c.scope.question = "What does this invented chronology establish, and what is missing?";
  c.scope.site = "SYNTHETIC-MATERIAL-REPLAY";
  c.scope.boundary = "One invented material/order incident; no forecast or causal conclusion";
  c.scope.from = times[0]?.slice(0, 10) ?? "2026-01-01";
  c.scope.to = times.at(-1)?.slice(0, 10) ?? c.scope.from;
  c.evidence = input.records.map((r, i) =>
    evidenceSchema.parse({
      id: `E${i + 1}`,
      reference: r.reference,
      owner: "Invented fixture custodian",
      origin: "synthetic",
      permitted: r.permitted,
      checked: false,
      conflict: r.conflict,
      receivedAt: r.recordedAt ?? "2026-01-01T00:00:00Z",
      retention: "Invented in-memory exercise only",
      limitation: "Not independently authenticated or reviewed. Input digest is integrity only.",
    }),
  );
  c.events = input.records.map((r, i) =>
    eventSchema.parse({
      id: `T${i + 1}`,
      evidenceId: `E${i + 1}`,
      rawTime: r.at ?? "unknown",
      reconciledTime: "",
      clock: "Invented source clock",
      clockVerified: r.clockVerified,
      kind: r.anchor === "stopped" ? "stop" : r.anchor === "restarted" ? "restart" : "observation",
      description: `Invented ${r.anchor}; record creation: ${r.recordedAt ?? "unknown"}`,
    }),
  );
  c.findings = [
    findingSchema.parse({
      id: "F-REPLAY",
      type: "next_check",
      disposition: "open",
      evidenceIds: c.evidence.map((e) => e.id),
      statement:
        "Counterfactual mechanism and feasible response window require independent review.",
      counterEvidence:
        "Routine restock, cash, allocation, transport or changed demand may explain the outcome.",
      uncertainty:
        issues.join("; ") || "Complete timestamps do not establish actionability or causality.",
      nextCheck:
        "Confirm actual mechanism, contemporaneous knowledge, feasible supply and decision authority.",
    }),
  ];
  c.periods = [];
  c.reviews = [];
  c.labor = [];
  c.expenses = [];
  c.payments = [];
  c.outcome.confounders = "Historical replay cannot verify avoided stoppage or financial benefit.";
  return {
    inputSha256: digest,
    origin: "synthetic" as const,
    elapsedMinutes: elapsed,
    issues,
    conclusion: "inconclusive" as const,
    verifiedSavings: null,
    investigation: caseSchema.parse(c),
  };
}
