import { describe, expect, it } from "vitest";
import { inspectSyntheticBillCoverage, syntheticBillFactsSchema } from "./synthetic-bill-facts";

const ref = (printedLabel: string) => ({
  documentId: "SYN-BILL-001",
  page: 1,
  printedLabel,
});
const fixture = () => ({
  contractVersion: "synthetic-bill-facts-v1",
  sourceType: "synthetic",
  reviewState: "unverified",
  documentId: "SYN-BILL-001",
  supplier: "TSUISL",
  billFrom: "2026-09-01",
  billTo: "2026-09-30",
  fields: [
    { kind: "number", name: "contract_demand", decimal: "500", unit: "kVA", source: ref("CD") },
    {
      kind: "number",
      name: "recorded_maximum_demand",
      decimal: "310.25",
      unit: "kVA",
      source: ref("Maximum demand"),
    },
    { kind: "number", name: "billed_demand", decimal: "400", unit: "kVA", source: ref("Billed demand") },
    { kind: "number", name: "power_factor", decimal: "0.92", unit: "ratio", source: ref("PF") },
    { kind: "text", name: "tariff_category", value: "FICTIONAL INDUSTRIAL", source: ref("Tariff") },
    { kind: "number", name: "demand_charge", decimal: "1234.50", unit: "INR", source: ref("Demand charge") },
  ],
});

describe("GM-3.1-002 synthetic bill observations", () => {
  it("keeps observed numbers with source and units; never auto-certifies a tariff", () => {
    const bill = syntheticBillFactsSchema.parse(fixture());
    expect(bill.fields[0]?.source.documentId).toBe("SYN-BILL-001");
    expect(inspectSyntheticBillCoverage(bill)).toEqual({
      issues: ["APPLICABLE_TARIFF_NOT_REVIEWED"],
      readyForTariffCalculation: false,
      reviewState: "unverified",
    });
  });

  it("shows gaps rather than guessing supplier, demand and power-factor charges", () => {
    const bill = { ...fixture(), supplier: "Unknown", fields: [fixture().fields[0]] };
    expect(inspectSyntheticBillCoverage(bill)).toEqual({
      issues: [
        "SUPPLIER_UNKNOWN",
        "TARIFF_CATEGORY_MISSING",
        "RECORDED_DEMAND_MISSING",
        "BILLED_DEMAND_MISSING",
        "POWER_FACTOR_NOT_OBSERVED",
        "APPLICABLE_TARIFF_NOT_REVIEWED",
      ],
      readyForTariffCalculation: false,
      reviewState: "unverified",
    });
  });

  it("detects kW/kVA differences but never silently converts them", () => {
    const bill = fixture();
    bill.fields[1]!.unit = "kW";
    expect(inspectSyntheticBillCoverage(bill).issues).toContain("DEMAND_UNITS_NOT_COMPARABLE");
    expect(inspectSyntheticBillCoverage(bill).readyForTariffCalculation).toBe(false);
  });

  it.each([
    ["invalid bill date", { billFrom: "2026-02-30" }],
    ["reverse period", { billTo: "2026-08-30" }],
    ["overlong period", { billTo: "2028-09-30" }],
    ["real or unrestricted source marker", { documentId: "CUSTOMER-REAL-123" }],
    ["invented review approval", { reviewState: "approved" }],
    ["hidden savings claim", { annualSavingsInr: "100000" }],
    ["unapproved formula", { tariffRateInrPerKwh: "9.00" }],
  ])("rejects %s", (_, update) => {
    expect(syntheticBillFactsSchema.safeParse({ ...fixture(), ...update }).success).toBe(false);
  });

  it.each([
    ["power factor above 1", { name: "power_factor", unit: "ratio", decimal: "1.01" }],
    ["incorrect power-factor unit", { name: "power_factor", unit: "kVA", decimal: "0.91" }],
    ["negative amount", { name: "total_amount", unit: "INR", decimal: "-200" }],
    ["incorrect charge unit", { name: "demand_charge", unit: "kWh", decimal: "900" }],
    ["excessively precise number", { name: "demand_charge", unit: "INR", decimal: "1.0000001" }],
  ])("rejects %s", (_, update) => {
    const bill = fixture();
    bill.fields[0] = {
      kind: "number", name: update.name, unit: update.unit,
      decimal: update.decimal, source: ref("Unverified printed field"),
    };
    expect(syntheticBillFactsSchema.safeParse(bill).success).toBe(false);
  });

  it("rejects cross-document citations, duplicate fields and invented output text", () => {
    const original = fixture();
    original.fields[0]!.source.documentId = "SYN-OTHER-001";
    expect(syntheticBillFactsSchema.safeParse(original).success).toBe(false);

    const repeated = fixture();
    repeated.fields.push({ ...repeated.fields[0]! });
    expect(syntheticBillFactsSchema.safeParse(repeated).success).toBe(false);

    const unchecked = fixture();
    unchecked.fields.push({
      kind: "text",
      name: "promised_savings",
      value: "Refund guaranteed",
      source: ref("not a bill field"),
    });
    expect(syntheticBillFactsSchema.safeParse(unchecked).success).toBe(false);
  });

  it("does not allow a claimed supplier to prove the applicable historical tariff", () => {
    for (const supplier of ["JBVNL", "TSL", "DVC", "Other", "TSUISL"]) {
      const answer = inspectSyntheticBillCoverage({ ...fixture(), supplier });
      expect(answer.issues).toContain("APPLICABLE_TARIFF_NOT_REVIEWED");
      expect(answer.readyForTariffCalculation).toBe(false);
    }
  });
});
