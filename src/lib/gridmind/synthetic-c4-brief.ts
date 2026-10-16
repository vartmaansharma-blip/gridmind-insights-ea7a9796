/**
 * Synthetic-only C4 investigation prototype.
 *
 * NO customer data, uploads, persistence, tariff diagnosis, causal diagnosis,
 * savings estimates, or customer-ready sign-off. This is a deterministic
 * evaluation helper for the discovery phase, NOT a commercial product.
 */
export type SyntheticC4Record = {
  evidenceId: string;
  invoiceId: string;
  month: string; // YYYY-MM
  kwh: number;
  billedInr: number;
  productionUnits: number;
  sourceReference: string;
  checkedAgainstSource: boolean;
};

export type SyntheticC4Case = {
  caseId: string;
  decisionQuestion: string;
  decisionOwnerRole: string;
  origin: "synthetic";
  records: SyntheticC4Record[];
};

export type SyntheticC4Period = {
  evidenceId: string;
  invoiceId: string;
  month: string;
  kwh: number;
  billedInr: number;
  productionUnits: number;
  kwhPerUnit: number;
  observedBillInrPerKwh: number;
  sourceReference: string;
};

export type SyntheticC4Comparison = {
  fromMonth: string;
  toMonth: string;
  supportingEvidenceIds: string[];
  intensityChangePercent: number;
  consumptionChangePercent: number;
  productionChangePercent: number;
};

export type SyntheticC4Brief = {
  caseId: string;
  decisionQuestion: string;
  decisionOwnerRole: string;
  origin: "synthetic";
  status: "blocked_on_evidence" | "awaiting_qualified_review";
  reviewerStatus: "not_reviewed";
  approvedForCustomerDelivery: false;
  validPeriods: SyntheticC4Period[];
  comparison: SyntheticC4Comparison | null;
  evidenceIssues: string[];
  findings: string[];
  nextChecks: string[];
  limitations: string[];
  estimatedSavingsInr: null;
  verifiedSavingsInr: null;
};

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const monthNumber = (month: string): number => {
  const match = MONTH_PATTERN.exec(month);
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : NaN;
};
const percentChange = (start: number, end: number): number =>
  Math.round(((end / start) - 1) * 10000) / 100;
const round = (value: number, places: number): number => Number(value.toFixed(places));

/**
 * Produce a source-linked, human-review-gated brief from an invented sample.
 * The input must be synthetically sourced even at runtime; accidental reuse
 * with a real factory dataset fails closed.
 */
export function buildSyntheticC4Brief(input: SyntheticC4Case): SyntheticC4Brief {
  if (input.origin !== "synthetic") {
    throw new Error("Real or unidentified factory data is prohibited in the synthetic C4 prototype.");
  }

  const issues: string[] = [];
  if (!input.caseId.trim() || !input.decisionQuestion.trim() || !input.decisionOwnerRole.trim()) {
    issues.push("Investigation ID, question and decision-owner role are required.");
  }
  if (input.records.length < 3) {
    issues.push("At least three consecutive, verified monthly records are required for this comparison.");
  }

  const months = new Set<string>();
  const invoices = new Set<string>();
  const evidenceIds = new Set<string>();
  const validPeriods: SyntheticC4Period[] = [];

  for (const record of input.records) {
    const problems: string[] = [];
    if (!record.evidenceId.trim() || evidenceIds.has(record.evidenceId)) {
      problems.push("evidence ID is missing or duplicated");
    }
    if (!record.invoiceId.trim() || invoices.has(record.invoiceId)) {
      problems.push("invoice ID is missing or duplicated");
    }
    if (!MONTH_PATTERN.test(record.month) || months.has(record.month)) {
      problems.push("month is invalid or duplicated");
    }
    if (!record.sourceReference.trim()) problems.push("source reference is missing");
    if (!record.checkedAgainstSource) problems.push("source values have not been checked");
    if (!Number.isFinite(record.kwh) || record.kwh <= 0) problems.push("kWh must be positive and finite");
    if (!Number.isFinite(record.billedInr) || record.billedInr < 0) {
      problems.push("bill amount must be non-negative and finite");
    }
    if (!Number.isFinite(record.productionUnits) || record.productionUnits <= 0) {
      problems.push("production must be positive and finite to calculate intensity");
    }
    evidenceIds.add(record.evidenceId);
    invoices.add(record.invoiceId);
    months.add(record.month);
    if (problems.length) {
      issues.push("Evidence " + (record.evidenceId || "(missing ID)") + ": " + problems.join("; ") + ".");
      continue;
    }
    validPeriods.push({
      evidenceId: record.evidenceId,
      invoiceId: record.invoiceId,
      month: record.month,
      kwh: record.kwh,
      billedInr: record.billedInr,
      productionUnits: record.productionUnits,
      kwhPerUnit: round(record.kwh / record.productionUnits, 6),
      observedBillInrPerKwh: round(record.billedInr / record.kwh, 6),
      sourceReference: record.sourceReference,
    });
  }

  validPeriods.sort((a, b) => a.month.localeCompare(b.month));
  for (let i = 1; i < validPeriods.length; i += 1) {
    if (monthNumber(validPeriods[i].month) !== monthNumber(validPeriods[i - 1].month) + 1) {
      issues.push(
        "Missing or nonconsecutive billing period between " +
          validPeriods[i - 1].month + " and " + validPeriods[i].month + ".",
      );
    }
  }
  const safeToCompare = issues.length === 0 && validPeriods.length >= 3;
  const first = validPeriods[0];
  const last = validPeriods[validPeriods.length - 1];
  const comparison: SyntheticC4Comparison | null = safeToCompare
    ? {
        fromMonth: first.month,
        toMonth: last.month,
        supportingEvidenceIds: validPeriods.map((period) => period.evidenceId),
        intensityChangePercent: percentChange(first.kwh / first.productionUnits, last.kwh / last.productionUnits),
        consumptionChangePercent: percentChange(first.kwh, last.kwh),
        productionChangePercent: percentChange(first.productionUnits, last.productionUnits),
      }
    : null;

  const findings: string[] = comparison
    ? [
        "Synthetic monthly energy intensity changed by " + comparison.intensityChangePercent +
          "% between " + first.month + " and " + last.month +
          " (evidence " + comparison.supportingEvidenceIds.join(", ") + ").",
        "Synthetic energy consumption changed by " + comparison.consumptionChangePercent +
          "% while recorded output changed by " + comparison.productionChangePercent + "%.",
      ]
    : ["A period-to-period comparison is withheld until the listed evidence issues are resolved."];

  return {
    caseId: input.caseId,
    decisionQuestion: input.decisionQuestion,
    decisionOwnerRole: input.decisionOwnerRole,
    origin: "synthetic",
    status: comparison ? "awaiting_qualified_review" : "blocked_on_evidence",
    reviewerStatus: "not_reviewed",
    approvedForCustomerDelivery: false,
    validPeriods,
    comparison,
    evidenceIssues: issues,
    findings,
    nextChecks: [
      "Confirm the original source, billing boundary, tariff components and measurement units.",
      "Establish whether production mix, utilization and operating conditions are comparable.",
      "Have an appropriately qualified professional evaluate any technical or financial interpretation.",
    ],
    limitations: [
      "All inputs are invented and are not evidence from a manufacturer.",
      "An observed change in energy intensity does not establish its cause or avoidable loss.",
      "Bill amount divided by kWh is descriptive only: fixed charges, demand charges and taxes may apply.",
      "No tariff validity, billing error, intervention, recovery or verified savings has been established.",
      "No qualified reviewer has approved this case for customer delivery.",
    ],
    estimatedSavingsInr: null,
    verifiedSavingsInr: null,
  };
}
