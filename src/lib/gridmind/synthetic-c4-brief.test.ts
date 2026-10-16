import { describe, expect, it } from "vitest";
import { buildSyntheticC4Brief, type SyntheticC4Case } from "./synthetic-c4-brief";

const base = (): SyntheticC4Case => ({
  caseId: "SYN-C4-01",
  decisionQuestion: "What does the synthetic monthly comparison establish?",
  decisionOwnerRole: "Plant manager",
  origin: "synthetic",
  records: [
    { evidenceId: "E01", invoiceId: "SYN-001", month: "2026-01", kwh: 100000, billedInr: 900000, productionUnits: 10000, sourceReference: "SYN-001", checkedAgainstSource: true },
    { evidenceId: "E02", invoiceId: "SYN-002", month: "2026-02", kwh: 110000, billedInr: 990000, productionUnits: 10000, sourceReference: "SYN-002", checkedAgainstSource: true },
    { evidenceId: "E03", invoiceId: "SYN-003", month: "2026-03", kwh: 120000, billedInr: 1080000, productionUnits: 9000, sourceReference: "SYN-003", checkedAgainstSource: true },
  ],
});

describe("synthetic-only C4 investigation brief", () => {
  it("reproduces the existing invented economic fixture without a savings claim", () => {
    const result = buildSyntheticC4Brief(base());
    expect(result.status).toBe("awaiting_qualified_review");
    expect(result.comparison?.intensityChangePercent).toBe(33.33);
    expect(result.comparison?.consumptionChangePercent).toBe(20);
    expect(result.comparison?.productionChangePercent).toBe(-10);
    expect(result.validPeriods[2].kwhPerUnit).toBeCloseTo(13.333333);
    expect(result.estimatedSavingsInr).toBeNull();
    expect(result.verifiedSavingsInr).toBeNull();
    expect(result.approvedForCustomerDelivery).toBe(false);
    expect(result.reviewerStatus).toBe("not_reviewed");
    expect(result.comparison?.supportingEvidenceIds).toEqual(["E01", "E02", "E03"]);
  });
  it("rejects accidental use with an unidentified origin", () => {
    expect(() => buildSyntheticC4Brief({ ...base(), origin: "customer" as "synthetic" })).toThrow(/prohibited/);
  });
  it("withholds comparison when a month is missing", () => {
    const sample = base();
    sample.records.splice(1, 1);
    const result = buildSyntheticC4Brief(sample);
    expect(result.status).toBe("blocked_on_evidence");
    expect(result.comparison).toBeNull();
  });
  it("rejects duplicate invoices and missing source checks", () => {
    const sample = base();
    sample.records[1].invoiceId = "SYN-001";
    sample.records[2].checkedAgainstSource = false;
    const result = buildSyntheticC4Brief(sample);
    expect(result.evidenceIssues.join(" ")).toMatch(/duplicated/);
    expect(result.evidenceIssues.join(" ")).toMatch(/not been checked/);
    expect(result.comparison).toBeNull();
  });
  it("does not treat zero production or invalid numbers as trustworthy", () => {
    const sample = base();
    sample.records[1].productionUnits = 0;
    sample.records[2].kwh = Number.NaN;
    const result = buildSyntheticC4Brief(sample);
    expect(result.comparison).toBeNull();
    expect(result.validPeriods).toHaveLength(1);
    expect(result.status).toBe("blocked_on_evidence");
  });
  it("rejects skipped periods even when three verified records remain", () => {
    const sample = base();
    sample.records[2].month = "2026-04";
    const result = buildSyntheticC4Brief(sample);
    expect(result.comparison).toBeNull();
    expect(result.evidenceIssues.join(" ")).toMatch(/nonconsecutive/);
  });
});
