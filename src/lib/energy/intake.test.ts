import { describe, expect, it } from "vitest";
import {
  assessInvoiceCollisions,
  assessSourceRecord,
  type EconomicSourceRecord,
} from "./intake";

const source = (sourceId: string, overrides: Partial<EconomicSourceRecord> = {}): EconomicSourceRecord => ({
  sourceId,
  sourceType: "utility_invoice",
  sourceLabel: `synthetic-${sourceId}.pdf`,
  capturedAt: "2026-10-13T10:00:00Z",
  capturedByRole: "synthetic test fixture",
  siteId: "site-01",
  meterId: "meter-01",
  utilityName: "Example Utility",
  invoiceId: "INV-100",
  billingPeriodStart: "2026-01-01",
  billingPeriodEnd: "2026-01-31",
  rawEnergyValue: 100_000,
  rawEnergyUnit: "kWh",
  rawAmountInr: 900_000,
  evidenceReference: `fixture://${sourceId}`,
  ...overrides,
});

describe("economic source intake", () => {
  it("accepts complete metadata for review but does not approve financial use", () => {
    const result = assessSourceRecord(source("A"));
    expect(result.state).toBe("READY_FOR_REVIEW");
    expect(result.note).toContain("not a document-authenticity");
  });

  it("blocks incomplete provenance, scope, dates, units, and evidence reference", () => {
    const result = assessSourceRecord(source("A", {
      sourceLabel: "",
      capturedByRole: "",
      siteId: "",
      meterId: "",
      billingPeriodStart: "2026-02-30",
      rawEnergyUnit: "unknown",
      evidenceReference: "",
    }));
    expect(result.state).toBe("INCOMPLETE");
    expect(result.issues).toContain("MISSING_PROVENANCE");
    expect(result.issues).toContain("MISSING_SITE_OR_METER");
    expect(result.issues).toContain("INVALID_BILLING_PERIOD");
    expect(result.issues).toContain("UNKNOWN_ENERGY_UNIT");
    expect(result.issues).toContain("MISSING_EVIDENCE_REFERENCE");
  });

  it("rejects reversed billing periods and negative or non-finite amounts", () => {
    const result = assessSourceRecord(source("A", {
      billingPeriodStart: "2026-02-01",
      billingPeriodEnd: "2026-01-31",
      rawAmountInr: Number.POSITIVE_INFINITY,
      rawEnergyValue: -1,
    }));
    expect(result.state).toBe("INCOMPLETE");
    expect(result.issues).toContain("INVALID_BILLING_PERIOD");
    expect(result.issues).toContain("INVALID_AMOUNT");
    expect(result.issues).toContain("INVALID_ENERGY_VALUE");
  });

  it("flags same identity and same amount as a potential duplicate without deleting either record", () => {
    const result = assessInvoiceCollisions([source("A"), source("B")]);
    expect(result.map((item) => item.state)).toEqual(["POTENTIAL_DUPLICATE", "POTENTIAL_DUPLICATE"]);
    expect(result[0].relatedSourceIds).toEqual(["B"]);
    expect(result[1].relatedSourceIds).toEqual(["A"]);
  });

  it("flags same invoice identity with different amounts as a conflict and preserves both", () => {
    const result = assessInvoiceCollisions([
      source("A"),
      source("B", { rawAmountInr: 925_000 }),
    ]);
    expect(result.map((item) => item.state)).toEqual(["CONFLICTING_INVOICE", "CONFLICTING_INVOICE"]);
    expect(result[0].relatedSourceIds).toEqual(["B"]);
    expect(result[1].relatedSourceIds).toEqual(["A"]);
  });

  it("does not use invoice ID alone to match records from different meters or periods", () => {
    const result = assessInvoiceCollisions([
      source("A"),
      source("B", { meterId: "meter-02" }),
      source("C", { billingPeriodStart: "2026-02-01", billingPeriodEnd: "2026-02-28" }),
    ]);
    expect(result.every((item) => item.state === "READY_FOR_REVIEW")).toBe(true);
  });

  it("does not auto-resolve invoice collisions when the amount is missing", () => {
    const result = assessInvoiceCollisions([
      source("A", { rawAmountInr: undefined }),
      source("B", { rawAmountInr: undefined }),
    ]);
    expect(result.map((item) => item.state)).toEqual(["POTENTIAL_DUPLICATE", "POTENTIAL_DUPLICATE"]);
  });
});
