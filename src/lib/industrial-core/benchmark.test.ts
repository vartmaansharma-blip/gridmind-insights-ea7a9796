import { describe, expect, it } from "vitest";
import { benchmarkScenarioIds, publicDatasetCandidates, runSyntheticParityBenchmark, spreadsheetBaseline } from "./benchmark";
import { physicalFixture } from "./physical";

describe("GM-MVP-004 non-commercial reproducible parity benchmark", () => {
  it("compares all seven fixed scenarios against the same truth sheet and conservative spreadsheet method", () => {
    const report = runSyntheticParityBenchmark();
    expect(report.metrics.cases).toBe(benchmarkScenarioIds.length);
    expect(report.metrics.gridmindLockedFixturePass).toBe(7);
    expect(report.metrics.spreadsheetLockedFixturePass).toBe(7);
    expect(report.metrics.agreementCount).toBe(7);
    expect(report.verdict).toBe("synthetic_parity_only");
    expect(report.cases.every((r) => r.unsafeAutonomousActions === 0)).toBe(true);
  });
  it("reports no incremental value, customer performance, real baseline time or payments", () => {
    const report = runSyntheticParityBenchmark();
    expect(report.metrics.accuracyOnRealFactoryCases).toBeNull();
    expect(report.metrics.actualBaselineTimeMinutes).toBeNull();
    expect(report.metrics.actualGridMindTimeMinutes).toBeNull();
    expect(report.metrics.economicLiftRupees).toBeNull();
    expect(report.metrics.realCustomerValidation).toBe(false);
    expect(report.metrics.superiorToIncumbent).toBe("not_established");
  });
  it("the spreadsheet baseline uses exact work-order routing, not a shared-material shortcut", () => {
    const { core, snapshot } = physicalFixture("machine_stop");
    const r = spreadsheetBaseline(core, snapshot);
    expect(r.affectedOrders).toEqual(["order"]);
    expect(r.affectedOrders).not.toContain("second-order");
    expect(r.exposure).toBe("confirmed_stop");
    expect(r.decision).toBe("hold_for_review");
  });
  it("never treats an upstream electrical fault report as a confirmed machine stop", () => {
    for (const id of ["panel_alarm", "suspected_fault"] as const) {
      const { core, snapshot } = physicalFixture(id);
      const r = spreadsheetBaseline(core, snapshot);
      expect(r.affectedOrders).toEqual(["order", "second-order"]);
      expect(r.exposure).toBe("possible_exposure");
      expect(r.decision).toBe("hold_for_review");
    }
  });
  it("requires review for documented owner conflicts and distinguishes inferred preferences", () => {
    const avoided = physicalFixture("owner_avoid_feasible");
    expect(spreadsheetBaseline(avoided.core, avoided.snapshot).owner).toBe("confirmed_conflict");
    const inferred = physicalFixture("owner_inferred");
    expect(spreadsheetBaseline(inferred.core, inferred.snapshot).owner).toBe("unconfirmed");
    expect(spreadsheetBaseline(inferred.core, inferred.snapshot).decision).toBe("candidate_requires_review");
  });
  it("does not silently turn public compressor/yield data into factory orders or validation", () => {
    expect(publicDatasetCandidates).toHaveLength(2);
    for (const ds of publicDatasetCandidates) {
      expect(ds.license).toBe("CC BY 4.0");
      expect(ds.processedRowsHere).toBe(0);
      expect(ds.containsManufacturingOrders).toBe(false);
      expect(ds.containsApprovedAlternativeRouting).toBe(false);
      expect(ds.permitsCustomerDecisionClaims).toBe(false);
    }
  });
  it("same code and fixed inputs give reproducible identical results", () => {
    const a = runSyntheticParityBenchmark();
    const b = runSyntheticParityBenchmark();
    expect(b).toEqual(a);
  });
});
