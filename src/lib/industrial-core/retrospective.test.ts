import { describe, expect, it } from "vitest";
import {
  assessRetrospectiveCase,
  runRetrospectivePreparationSample,
  syntheticRetrospectiveFixture,
} from "./retrospective";

describe("GM-MVP-003 retrospective commercial hypothesis gates", () => {
  it("traces the existing machine stop but never calls an invented case paid validation", () => {
    const result = runRetrospectivePreparationSample();
    expect(result.physicalTrace.decisionAlgorithm).toBe("gm-core-003/constraints-v1");
    expect(result.physicalTrace.affectedOrderIds).toEqual(["order"]);
    expect(result.physicalTrace.resourceStopVerifiedInFiction).toBe(true);
    expect(result.physicalTrace.actionableCustomerBenefitVerified).toBe(false);
    expect(result.commercialWinnerSelected).toBe(false);
    expect(result.realCustomerDataProcessingAllowed).toBe(false);
    expect(result.verifiedIncrementalValue).toBeNull();
    expect(result.payingCustomer).toBe(false);
    expect(result.comparativeConclusion).toBe("insufficient_evidence_for_comparison");
  });

  it("exposes the difference between a downtime trace and actionable real buyer value", () => {
    const result = assessRetrospectiveCase(syntheticRetrospectiveFixture());
    const production = result.lanes.find((lane) => lane.lane === "production_interruption")!;
    const finishing = result.lanes.find((lane) => lane.lane === "finishing_quality")!;
    expect(production.missingOrUnverified).toContain("actual_decision_window");
    expect(production.missingOrUnverified).toContain("incumbent_excel_erp_or_staff_response");
    expect(production.missingOrUnverified).toContain("alternative_action_and_authority");
    expect(finishing.missingOrUnverified).toContain("finishing_required_vs_repeat");
    expect(finishing.missingOrUnverified).toContain("quality_disposition_and_rework");
    expect(result.actualCustomerPermission).toBe(false);
  });

  it("reports contradictions as blockers instead of choosing a winner", () => {
    const sample = syntheticRetrospectiveFixture();
    sample.records.find((r) => r.field === "event_chronology_and_source")!.state = "contradictory";
    const result = assessRetrospectiveCase(sample);
    expect(result.lanes.every((lane) => lane.contradictory.includes("event_chronology_and_source"))).toBe(true);
    expect(result.commercialWinnerSelected).toBe(false);
  });

  it("cannot confuse fully specified synthetic paperwork with a real pilot", () => {
    const sample = syntheticRetrospectiveFixture();
    for (const entry of sample.records) {
      entry.state = "source_linked";
      if (!entry.sourceRefs.length) entry.sourceRefs = ["fictional-test-record"];
    }
    const result = assessRetrospectiveCase(sample);
    expect(result.lanes.every((lane) => lane.sourceCompleteInFiction)).toBe(true);
    expect(result.comparativeConclusion).toBe("synthetic_specification_ready_for_method_review");
    expect(result.realCustomerDataProcessingAllowed).toBe(false);
    expect(result.commercialWinnerSelected).toBe(false);
    expect(result.verifiedSavings).toBeNull();
  });

  it("rejects real-customer origin, credential claims and raw-record improvisation", () => {
    const sample = syntheticRetrospectiveFixture();
    expect(() => assessRetrospectiveCase({ ...sample, origin: "customer" })).toThrow();
    expect(() => assessRetrospectiveCase({
      ...sample,
      commercial: { ...sample.commercial, secureStorageApproved: true },
    })).toThrow();
    expect(() => assessRetrospectiveCase({
      ...sample,
      commercial: { ...sample.commercial, customerPermission: "consented" },
    })).toThrow();
    expect(() => assessRetrospectiveCase({ ...sample, rawPurchaseOrder: { amount: 100000 } })).toThrow();
  });

  it("rejects duplicate or fabricated source IDs and missing provenance", () => {
    const sample = syntheticRetrospectiveFixture();
    expect(() => assessRetrospectiveCase({
      ...sample, records: [sample.records[0], sample.records[0]],
    })).toThrow();
    const absent = syntheticRetrospectiveFixture();
    absent.records[0].sourceRefs = [];
    expect(() => assessRetrospectiveCase(absent)).toThrow();
    const missing = syntheticRetrospectiveFixture();
    missing.records.find((r) => r.state === "missing")!.sourceRefs = ["invented"];
    expect(() => assessRetrospectiveCase(missing)).toThrow();
  });
});
