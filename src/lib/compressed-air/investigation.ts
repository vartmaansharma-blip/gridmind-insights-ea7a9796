import { z } from "zod";

const id = z.string().trim().min(1).max(120);
const time = z
  .string()
  .datetime({ offset: true })
  .refine((v) => {
    const date = v.slice(0, 10);
    const parsed = new Date(date);
    return (
      Number.isFinite(Date.parse(v)) &&
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    );
  }, "Invalid timestamp");
const positive = z.number().finite().positive();
export const scopeSchema = z.object({ organizationId: id, siteId: id, assetId: id }).strict();
export const sampleSchema = z
  .object({
    start: time,
    end: time,
    phase: z.enum(["baseline", "before", "after"]),
    context: id,
    pressureBar: positive.max(30),
    flowM3Min: positive.max(10000),
    powerKw: positive.max(100000),
    uncertaintyPct: positive.max(50),
    sourceLine: z.number().int().min(2),
  })
  .strict()
  .refine((s) => Date.parse(s.end) > Date.parse(s.start), "Interval must have positive duration");
export const datasetSchema = z
  .object({
    scope: scopeSchema,
    origin: z.literal("synthetic"),
    sourceName: id,
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    samples: z.array(sampleSchema).min(1).max(10000),
  })
  .strict()
  .superRefine((d, ctx) => {
    const sorted = [...d.samples].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    if (new Set(d.samples.map((s) => s.sourceLine)).size !== d.samples.length)
      ctx.addIssue({ code: "custom", message: "Duplicate source line" });
    const rank = { baseline: 0, before: 1, after: 2 };
    sorted.forEach((s, i) => {
      if (i && rank[s.phase] < rank[sorted[i - 1].phase])
        ctx.addIssue({
          code: "custom",
          message: "Baseline, before and after must follow chronological order",
        });
      if (i && Date.parse(s.start) < Date.parse(sorted[i - 1].end))
        ctx.addIssue({ code: "custom", message: "Overlapping or duplicate intervals" });
    });
  });
export type Dataset = z.infer<typeof datasetSchema>;
export const HEADER = "start,end,phase,context,pressure_bar,flow_m3_min,power_kw,uncertainty_pct";

/** Strict, bounded simple CSV dialect. Reject quoted/multiline cells rather than misparse evidence. */
export async function importCompressedAirCsv(
  text: string,
  scope: unknown,
  sourceName: string,
): Promise<Dataset> {
  if (text.length > 2000000 || text.includes('"')) throw new Error("Unsupported or oversized CSV");
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (lines.shift() !== HEADER) throw new Error("Use the exact header and canonical units");
  const samples = lines.map((line, i) => {
    const c = line.split(",").map((v) => v.trim());
    if (c.length !== 8 || c.some((v) => v === ""))
      throw new Error(`Line ${i + 2}: missing or extra cells`);
    return {
      start: c[0],
      end: c[1],
      phase: c[2],
      context: c[3],
      pressureBar: Number(c[4]),
      flowM3Min: Number(c[5]),
      powerKw: Number(c[6]),
      uncertaintyPct: Number(c[7]),
      sourceLine: i + 2,
    };
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return datasetSchema.parse({
    scope,
    origin: "synthetic",
    sourceName,
    sourceSha256: Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join(
      "",
    ),
    samples,
  });
}

export function analyzeCompressedAir(input: unknown) {
  const d = datasetSchema.parse(input);
  const baseline = d.samples.filter((s) => s.phase === "baseline");
  const comparisons = d.samples
    .filter((s) => s.phase !== "baseline")
    .map((s) => {
      // Match declared production/operating context and demand envelope; never extrapolate.
      const peers = baseline.filter(
        (b) =>
          Date.parse(b.end) <= Date.parse(s.start) &&
          b.context === s.context &&
          Math.abs(b.pressureBar - s.pressureBar) <= 0.2 &&
          Math.abs(b.flowM3Min / s.flowM3Min - 1) <= 0.1,
      );
      const ref = { sha256: d.sourceSha256, source: d.sourceName, line: s.sourceLine };
      if (peers.length < 3)
        return {
          phase: s.phase,
          ref,
          state: "inconclusive" as const,
          reason: "At least three comparable baseline intervals required",
          baselineLines: peers.map((b) => b.sourceLine),
        };
      const specific = peers.map((b) => b.powerKw / b.flowM3Min);
      const low =
        Math.min(
          ...specific.map(
            (v, i) =>
              (v * (1 - peers[i].uncertaintyPct / 100)) / (1 + peers[i].uncertaintyPct / 100),
          ),
        ) *
        s.flowM3Min *
        (1 - s.uncertaintyPct / 100);
      const high =
        Math.max(
          ...specific.map(
            (v, i) =>
              (v * (1 + peers[i].uncertaintyPct / 100)) / (1 - peers[i].uncertaintyPct / 100),
          ),
        ) *
        s.flowM3Min *
        (1 + s.uncertaintyPct / 100);
      const observedLow = s.powerKw * (1 - s.uncertaintyPct / 100);
      const observedHigh = s.powerKw * (1 + s.uncertaintyPct / 100);
      return {
        phase: s.phase,
        ref,
        baselineLines: peers.map((b) => b.sourceLine),
        state:
          observedLow > high
            ? ("above_baseline_envelope" as const)
            : ("no_resolved_excess" as const),
        residualKw: [observedLow - high, observedHigh - low],
        reason:
          "Descriptive matched baseline range plus declared measurement uncertainty; not a confidence interval or causal finding",
      };
    });
  const before = comparisons.filter((c) => c.phase === "before");
  const after = comparisons.filter((c) => c.phase === "after");
  // Descriptive paired comparison only. No aggregation across unmatched regimes or causal attribution.
  const verificationPairs = after.map((a) => {
    const afterSample = d.samples.find((s) => s.sourceLine === a.ref.line)!;
    const b = before.find((c) => {
      const sample = d.samples.find((s) => s.sourceLine === c.ref.line)!;
      return (
        c.residualKw &&
        sample.context === afterSample.context &&
        Math.abs(sample.pressureBar - afterSample.pressureBar) <= 0.2 &&
        Math.abs(sample.flowM3Min / afterSample.flowM3Min - 1) <= 0.1
      );
    });
    if (!b?.residualKw || !a.residualKw)
      return { afterLine: a.ref.line, state: "inconclusive_unmatched_periods" };
    const beforeSample = d.samples.find((s) => s.sourceLine === b.ref.line)!;
    return {
      beforeLine: b.ref.line,
      afterLine: a.ref.line,
      state: "descriptive_only",
      residualIntensityChangeKwPerM3Min: [
        a.residualKw[0] / afterSample.flowM3Min - b.residualKw[1] / beforeSample.flowM3Min,
        a.residualKw[1] / afterSample.flowM3Min - b.residualKw[0] / beforeSample.flowM3Min,
      ],
      limitation:
        "After minus before baseline-adjusted residual intensity; not attributable savings. Pairing uses first comparable before interval.",
    };
  });
  return {
    method: "compressed-air-context-envelope-v1",
    scope: d.scope,
    origin: d.origin,
    sourceSha256: d.sourceSha256,
    comparisons,
    verificationPairs,
    outcome:
      before.length && after.length
        ? "requires_engineer_review_and_confounder_assessment"
        : "inconclusive_missing_before_or_after",
    hypotheses: comparisons.some((c) => c.state === "above_baseline_envelope")
      ? [
          {
            type: "hypothesis",
            statement: "Higher input power relative to comparable baseline; cause unknown",
            nextCheck: "Qualified reviewer to assess context, metering and competing explanations",
          },
        ]
      : [],
    limitations: [
      "Synthetic software demonstration only",
      "No real savings, fault diagnosis or machine control",
      "Declared uncertainty and context require independent validation",
      "No causal before/after claim; serial correlation and unmeasured confounders remain",
    ],
  };
}

const note = z.string().trim().min(1).max(4000);
export const reviewRecordSchema = z
  .object({
    datasetSha256: z.string().regex(/^[a-f0-9]{64}$/),
    datasetSnapshot: z.string().min(1).max(4000000),
    reviewer: id,
    competence: note,
    at: time,
    simulated: z.literal(true),
    findings: z.array(
      z
        .object({
          statement: note,
          sourceLines: z.array(z.number().int().min(2)).min(1),
          uncertainty: note,
        })
        .strict(),
    ),
    actions: z.array(
      z
        .object({
          id,
          owner: id,
          description: note,
          status: z.enum(["proposed", "approved", "completed"]),
          customerApproval: note.optional(),
          completionEvidence: note.optional(),
        })
        .strict(),
    ),
    confounders: note,
    outcome: z.literal("inconclusive"),
  })
  .strict()
  .superRefine((r, ctx) =>
    r.actions.forEach((a) => {
      if (a.status !== "proposed" && !a.customerApproval)
        ctx.addIssue({ code: "custom", message: "Action requires customer approval record" });
      if (a.status === "completed" && !a.completionEvidence)
        ctx.addIssue({ code: "custom", message: "Completion requires evidence" });
    }),
  );

export function exportCompressedAirReport(input: unknown, review?: unknown) {
  const dataset = datasetSchema.parse(input);
  const record = review === undefined ? null : reviewRecordSchema.parse(review);
  if (
    record &&
    (record.datasetSnapshot !== JSON.stringify(dataset) ||
      record.datasetSha256 !== dataset.sourceSha256 ||
      record.findings.some((f) =>
        f.sourceLines.some((line) => !dataset.samples.some((s) => s.sourceLine === line)),
      ))
  )
    throw new Error("Stale review or unresolved evidence reference");
  return JSON.stringify(
    {
      dataset,
      analysis: analyzeCompressedAir(dataset),
      engineerReview: record,
      reviewStatus: record ? "simulated_review_only" : "unreviewed",
      verifiedSavings: null,
    },
    null,
    2,
  );
}
