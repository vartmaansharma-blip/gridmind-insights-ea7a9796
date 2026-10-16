import { buildSyntheticC4Brief, type SyntheticC4Brief } from "../gridmind/synthetic-c4-brief";
import { caseSchema, type Investigation, type Review } from "./schema";

export const METHOD_VERSION = "investigation-method-v1";

export type Calculation = {
  label: string;
  formula: string;
  result: number;
  unit: string;
  evidenceIds: string[];
};
export type Evaluation = {
  issues: string[];
  observations: string[];
  calculations: Calculation[];
  c4: SyntheticC4Brief | null;
  timeline: Investigation["events"];
  review: Review | null;
  reviewCurrent: boolean;
  status:
    "stopped" | "blocked" | "awaiting_review" | "revise" | "rejected" | "synthetic_review_complete";
  approvedForCustomerDelivery: false;
};
const duplicateIds = (rows: { id: string }[]) =>
  new Set(rows.map((r) => r.id)).size !== rows.length;
const present = (v: string) => v.trim().length > 0;
const day = (time: string) => time.slice(0, 10);
const validInstant = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  (() => {
    const date = value.slice(0, 10);
    const parsed = new Date(`${date}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  })();

/** Exact content binding, not a signature/authentication mechanism. Reviews are always simulated. */
export function technicalSnapshot(c: Investigation): string {
  return JSON.stringify({
    methodVersion: METHOD_VERSION,
    id: c.id,
    origin: c.origin,
    candidate: c.candidate,
    scope: c.scope,
    stopped: c.stopped,
    stopReason: c.stopReason,
    evidence: c.evidence,
    periods: c.periods,
    events: c.events,
    findings: c.findings,
  });
}

export function evaluateCase(value: Investigation): Evaluation {
  const c = caseSchema.parse(value);
  const issues: string[] = [];
  const observations: string[] = [];
  const calculations: Calculation[] = [];
  let c4: SyntheticC4Brief | null = null;
  if (c.stopped) issues.push(`Case stopped: ${c.stopReason || "reason required"}`);
  for (const key of [
    "question",
    "owner",
    "site",
    "boundary",
    "exclusions",
    "acceptance",
    "stopRules",
    "alternative",
    "residualGap",
  ] as const) {
    if (!present(c.scope[key])) issues.push(`Scope: ${key} is required.`);
  }
  if (c.scope.from > c.scope.to) issues.push("Scope dates are reversed.");
  if (!c.evidence.length) issues.push("At least one source is required.");
  if ([c.evidence, c.periods, c.events, c.findings].some(duplicateIds))
    issues.push("Record IDs must be unique within each register.");
  const references = c.evidence.map((e) => e.reference.trim().toLowerCase());
  if (new Set(references).size !== references.length)
    issues.push("Duplicate source reference: reconcile rather than count twice.");
  const sources = new Map(c.evidence.map((e) => [e.id, e]));
  for (const e of c.evidence) {
    if (!present(e.reference) || !present(e.owner) || !present(e.retention))
      issues.push(`${e.id}: source reference, owner and retention are required.`);
    if (!e.permitted) issues.push(`${e.id}: use permission is missing.`);
    if (!e.checked) issues.push(`${e.id}: source verification is incomplete.`);
    if (present(e.conflict)) issues.push(`${e.id}: unresolved conflict — ${e.conflict}`);
  }
  const checkSource = (id: string, record: string) => {
    if (!sources.has(id)) issues.push(`${record}: source ${id} does not resolve.`);
  };
  if (c.candidate === "C4") {
    for (const p of c.periods) {
      checkSource(p.evidenceId, p.id);
      if (p.unit !== "conforming units")
        issues.push(`${p.id}: expected a consistent production basis: conforming units.`);
      if (p.month < c.scope.from.slice(0, 7) || p.month > c.scope.to.slice(0, 7))
        issues.push(`${p.id}: billing period outside case scope.`);
    }
    c4 = buildSyntheticC4Brief({
      caseId: c.id,
      decisionQuestion: c.scope.question,
      decisionOwnerRole: c.scope.owner,
      origin: c.origin,
      records: c.periods.map((p) => ({
        evidenceId: p.evidenceId,
        invoiceId: p.invoiceId,
        month: p.month,
        kwh: p.kwh,
        billedInr: p.billedInr,
        productionUnits: p.production,
        sourceReference: sources.get(p.evidenceId)?.reference ?? "",
        checkedAgainstSource: sources.get(p.evidenceId)?.checked ?? false,
      })),
    });
    issues.push(...c4.evidenceIssues);
    if (!issues.length && c4.comparison) {
      observations.push(...c4.findings);
      for (const p of c4.validPeriods)
        calculations.push({
          label: `${p.month} energy intensity`,
          formula: `${p.kwh} kWh / ${p.productionUnits} conforming units`,
          result: p.kwhPerUnit,
          unit: "kWh/conforming unit",
          evidenceIds: [p.evidenceId],
        });
      calculations.push({
        label: "First-to-last intensity change",
        formula: "((last kWh / last output) / (first kWh / first output) − 1) × 100",
        result: c4.comparison.intensityChangePercent,
        unit: "%",
        evidenceIds: c4.comparison.supportingEvidenceIds,
      });
    }
  } else {
    if (!c.events.length) issues.push("Timeline events are required.");
    for (const e of c.events) {
      checkSource(e.evidenceId, e.id);
      if (!present(e.description) || !present(e.clock) || !validInstant(e.rawTime))
        issues.push(
          `${e.id}: description, source clock and valid raw timestamp with timezone are required.`,
        );
      if (!e.clockVerified || !validInstant(e.reconciledTime))
        issues.push(
          `${e.id}: reconcile the clock and preserve the raw timestamp before calculating duration.`,
        );
      if (
        validInstant(e.reconciledTime) &&
        (day(e.reconciledTime) < c.scope.from || day(e.reconciledTime) > c.scope.to)
      )
        issues.push(`${e.id}: reconciled timestamp outside scope.`);
    }
    const stops = c.events.filter((e) => e.kind === "stop");
    const restarts = c.events.filter((e) => e.kind === "restart");
    if (stops.length !== 1 || restarts.length !== 1)
      issues.push(
        "Duration requires exactly one bounded stop and restart; overlapping/repeated stops need explicit allocation.",
      );
    if (
      stops.length === 1 &&
      restarts.length === 1 &&
      validInstant(stops[0].reconciledTime) &&
      validInstant(restarts[0].reconciledTime)
    ) {
      const minutes =
        (Date.parse(restarts[0].reconciledTime) - Date.parse(stops[0].reconciledTime)) / 60000;
      if (minutes <= 0) issues.push("Restart must follow stop on reconciled clocks.");
      else if (!issues.length) {
        calculations.push({
          label: "Recorded stop duration",
          formula: `(${restarts[0].reconciledTime} − ${stops[0].reconciledTime}) / 60 seconds`,
          result: minutes,
          unit: "minutes",
          evidenceIds: [stops[0].evidenceId, restarts[0].evidenceId],
        });
        observations.push(
          `The reconciled synthetic stop spans ${minutes} minutes. Alarm recurrence does not establish a physical cause.`,
        );
      }
    }
  }
  for (const f of c.findings.filter((f) => f.disposition !== "rejected")) {
    if (!present(f.statement) || !f.evidenceIds.length)
      issues.push(`${f.id}: finding text and supporting source IDs are required.`);
    f.evidenceIds.forEach((id) => checkSource(id, f.id));
    if (
      f.type !== "hypothesis" &&
      /\b(root cause|caused by|verified (?:savings|loss)|guaranteed (?:savings|prevention))\b/i.test(
        f.statement,
      )
    )
      issues.push(
        `${f.id}: causal or verified-financial wording is not supported by these methods.`,
      );
    if (f.disposition === "open") issues.push(`${f.id}: challenge remains open.`);
    if (!present(f.uncertainty)) issues.push(`${f.id}: limitations must be stated.`);
    if (f.type === "hypothesis" && (!present(f.counterEvidence) || !present(f.nextCheck)))
      issues.push(`${f.id}: hypotheses require counter-evidence and a discriminating check.`);
  }
  // Gate ALL calculated/observed outputs if any material evidence or challenge is unresolved.
  if (issues.length) {
    observations.length = 0;
    calculations.length = 0;
  }
  const review = c.reviews.at(-1) ?? null;
  const reviewCurrent =
    !!review &&
    review.snapshot === technicalSnapshot(c) &&
    review.revision <= c.revision &&
    (review.decision !== "accept" || !review.dissent.trim()) &&
    [review.reviewer, review.competence, review.scope, review.rationale].every(present);
  const status = c.stopped
    ? "stopped"
    : issues.length
      ? "blocked"
      : !reviewCurrent
        ? "awaiting_review"
        : review?.decision === "reject"
          ? "rejected"
          : review?.decision === "revise"
            ? "revise"
            : "synthetic_review_complete";
  return {
    issues: [...new Set(issues)],
    observations,
    calculations,
    c4: issues.length ? null : c4,
    timeline: [...c.events].sort(
      (a, b) => Date.parse(a.reconciledTime) - Date.parse(b.reconciledTime),
    ),
    review,
    reviewCurrent,
    status,
    approvedForCustomerDelivery: false,
  };
}

export function addReview(
  c: Investigation,
  input: Omit<Review, "revision" | "snapshot" | "simulated">,
): Investigation {
  if (![input.reviewer, input.competence, input.scope, input.rationale].every(present))
    throw new Error("Reviewer identity, competence, scope and rationale are required.");
  if (input.decision === "accept" && input.dissent.trim())
    throw new Error("Unresolved dissent requires revision or rejection, not simulated acceptance.");
  if (input.decision === "accept" && evaluateCase(c).issues.length)
    throw new Error("Resolve scope, evidence and challenge blockers before simulated acceptance.");
  return caseSchema.parse({
    ...c,
    reviews: [
      ...c.reviews,
      { ...input, revision: c.revision, snapshot: technicalSnapshot(c), simulated: true },
    ],
  });
}

export function caseEconomics(value: Investigation) {
  const c = caseSchema.parse(value);
  const issues: string[] = [];
  for (const rows of [c.labor, c.expenses, c.payments])
    if (duplicateIds(rows)) issues.push("Duplicate economics record IDs.");
  const refs = c.expenses.map((e) => e.reference.trim());
  if (refs.some((r) => !r) || new Set(refs).size !== refs.length)
    issues.push(
      "Cash expense references must be present and unique; do not count an invoice twice.",
    );
  const sums = { quoted: 0, contracted: 0, invoiced: 0, collected: 0 };
  const stages = ["quoted", "contracted", "invoiced", "collected"] as const;
  const paymentRefs = c.payments.map((p) => `${p.stage}:${p.reference.trim()}`);
  if (new Set(paymentRefs).size !== paymentRefs.length)
    issues.push(
      "Duplicate commercial reference within a stage; reconcile before reporting contribution.",
    );
  for (const payment of c.payments) {
    sums[payment.stage] += payment.amount;
    if (!payment.reference.trim()) issues.push(`${payment.id}: payment reference required.`);
  }
  for (let i = 1; i < stages.length; i++) {
    if (sums[stages[i]] > sums[stages[i - 1]])
      issues.push(`${stages[i]} exceeds ${stages[i - 1]}; reconcile the commercial record.`);
    for (const entry of c.payments.filter((p) => p.stage === stages[i])) {
      if (!c.payments.some((p) => p.stage === stages[i - 1] && p.at <= entry.at))
        issues.push(`${entry.id}: preceding commercial stage missing or dated later.`);
    }
  }
  const cashCost = c.expenses.reduce((sum, e) => sum + e.amount, 0);
  // Reviewer invoices live in expenses; only uncompensated founder/analyst time gets a shadow valuation.
  const shadowLabor = c.labor
    .filter((e) => e.role === "founder" || e.role === "analyst")
    .reduce((sum, e) => sum + e.hours * e.shadowRate, 0);
  const hours = c.labor.reduce((sum, e) => sum + e.hours, 0);
  const finite = [cashCost, shadowLabor, hours, ...Object.values(sums)].every(Number.isFinite);
  if (!finite) issues.push("Economics overflow: narrow the values.");
  const collected = c.payments.some((p) => p.stage === "collected");
  return {
    issues,
    sums,
    cashCost,
    shadowLabor,
    hours,
    breakEvenBeforeOverhead: finite ? cashCost + shadowLabor : null,
    cashContribution: collected && !issues.length ? sums.collected - cashCost : null,
    adjustedContribution:
      collected && !issues.length ? sums.collected - cashCost - shadowLabor : null,
  };
}

export function outcomeIssues(value: Investigation): string[] {
  const c = caseSchema.parse(value);
  const o = c.outcome;
  if (o.status === "not_measured") return [];
  const issues: string[] = [];
  if (
    !o.metric.trim() ||
    !o.unit.trim() ||
    o.baseline === null ||
    !o.from ||
    !o.to ||
    o.from > o.to
  )
    issues.push("Outcome requires a metric, unit, baseline and ordered observation window.");
  if (
    o.status === "observed" &&
    (o.observed === null || !o.evidenceIds.length || !o.confounders.trim())
  )
    issues.push(
      "Observed results require a measurement, sources and disclosed confounders (including 'none known').",
    );
  for (const id of o.evidenceIds)
    if (!c.evidence.some((e) => e.id === id && e.checked && e.permitted && !e.conflict.trim()))
      issues.push(`Outcome source ${id} is unresolved or unverified.`);
  return issues;
}
