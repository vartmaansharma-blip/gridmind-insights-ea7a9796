/**
 * Source-document intake primitives for economic discovery.
 *
 * This module records provenance and flags potential invoice collisions. It does
 * not calculate savings, interpret tariffs, authenticate documents, or approve
 * financial claims. A duplicate/conflict is always a review state, never an
 * instruction to delete a source record.
 */

export type EnergyUnit = "kWh" | "kVAh" | "MWh" | "unknown";

export type EconomicSourceRecord = {
  sourceId: string;
  sourceType: "utility_invoice" | "monthly_export" | "manual_entry" | "other";
  sourceLabel: string;
  capturedAt: string;
  capturedByRole: string;
  siteId: string;
  meterId: string;
  utilityName: string;
  invoiceId?: string;
  billingPeriodStart: string; // ISO date YYYY-MM-DD
  billingPeriodEnd: string; // ISO date YYYY-MM-DD
  rawEnergyValue?: number;
  rawEnergyUnit: EnergyUnit;
  rawAmountInr?: number;
  evidenceReference: string; // controlled internal reference, not a public URL
  sourceHash?: string;
};

export type IntakeIssueCode =
  | "MISSING_PROVENANCE"
  | "MISSING_SITE_OR_METER"
  | "INVALID_BILLING_PERIOD"
  | "INVALID_ENERGY_VALUE"
  | "INVALID_AMOUNT"
  | "UNKNOWN_ENERGY_UNIT"
  | "MISSING_EVIDENCE_REFERENCE";

export type IntakeReviewState = "READY_FOR_REVIEW" | "INCOMPLETE" | "POTENTIAL_DUPLICATE" | "CONFLICTING_INVOICE";

export type IntakeAssessment = {
  sourceId: string;
  state: IntakeReviewState;
  issues: IntakeIssueCode[];
  relatedSourceIds: string[];
  note: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const finiteNonNegative = (value: number | undefined) =>
  value === undefined || (Number.isFinite(value) && value >= 0);

function validDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function invoiceIdentity(record: EconomicSourceRecord): string | undefined {
  if (!record.invoiceId) return undefined;
  return [
    record.siteId.trim().toLowerCase(),
    record.meterId.trim().toLowerCase(),
    record.utilityName.trim().toLowerCase(),
    record.invoiceId.trim().toLowerCase(),
    record.billingPeriodStart,
    record.billingPeriodEnd,
  ].join("|");
}

function exactInvoiceKey(record: EconomicSourceRecord): string | undefined {
  const identity = invoiceIdentity(record);
  if (!identity || record.rawAmountInr === undefined) return undefined;
  return `${identity}|${record.rawAmountInr}`;
}

export function assessSourceRecord(record: EconomicSourceRecord): IntakeAssessment {
  const issues: IntakeIssueCode[] = [];
  if (!record.sourceId.trim() || !record.sourceLabel.trim() || !record.capturedAt.trim() || !record.capturedByRole.trim()) {
    issues.push("MISSING_PROVENANCE");
  }
  if (!record.siteId.trim() || !record.meterId.trim() || !record.utilityName.trim()) {
    issues.push("MISSING_SITE_OR_METER");
  }
  if (
    !validDate(record.billingPeriodStart) ||
    !validDate(record.billingPeriodEnd) ||
    record.billingPeriodStart > record.billingPeriodEnd
  ) {
    issues.push("INVALID_BILLING_PERIOD");
  }
  if (!finiteNonNegative(record.rawEnergyValue)) issues.push("INVALID_ENERGY_VALUE");
  if (!finiteNonNegative(record.rawAmountInr)) issues.push("INVALID_AMOUNT");
  if (record.rawEnergyValue !== undefined && record.rawEnergyUnit === "unknown") issues.push("UNKNOWN_ENERGY_UNIT");
  if (!record.evidenceReference.trim()) issues.push("MISSING_EVIDENCE_REFERENCE");

  return {
    sourceId: record.sourceId,
    state: issues.length ? "INCOMPLETE" : "READY_FOR_REVIEW",
    issues,
    relatedSourceIds: [],
    note: issues.length
      ? "Intake is incomplete. Resolve issues or explicitly record limitations before analysis."
      : "Intake fields are present. This is not a document-authenticity, comparability, tariff, or financial-claim approval.",
  };
}

/**
 * Flags same-invoice identity collisions without deleting or selecting records.
 * Same identity + same amount => potential duplicate.
 * Same identity + different amount => conflicting invoice versions/records.
 */
export function assessInvoiceCollisions(records: EconomicSourceRecord[]): IntakeAssessment[] {
  const assessments = records.map(assessSourceRecord);
  return assessments.map((assessment, index) => {
    const record = records[index];
    const identity = invoiceIdentity(record);
    if (!identity || assessment.state === "INCOMPLETE") return assessment;

    const related = records.filter((candidate, candidateIndex) =>
      candidateIndex !== index &&
      invoiceIdentity(candidate) === identity &&
      assessSourceRecord(candidate).state !== "INCOMPLETE"
    );
    if (!related.length) return assessment;

    const exactKey = exactInvoiceKey(record);
    const allExact = exactKey !== undefined && related.every((candidate) => exactInvoiceKey(candidate) === exactKey);
    const allAmountsKnown = record.rawAmountInr !== undefined && related.every((candidate) => candidate.rawAmountInr !== undefined);
    const state: IntakeReviewState = allExact
      ? "POTENTIAL_DUPLICATE"
      : allAmountsKnown
        ? "CONFLICTING_INVOICE"
        : "POTENTIAL_DUPLICATE";

    return {
      ...assessment,
      state,
      relatedSourceIds: related.map((candidate) => candidate.sourceId),
      note: state === "CONFLICTING_INVOICE"
        ? "Same invoice identity has differing amounts. Preserve all records and reconcile against source evidence."
        : "Possible duplicate invoice identity. Preserve all records; verify source evidence before resolving.",
    };
  });
}
