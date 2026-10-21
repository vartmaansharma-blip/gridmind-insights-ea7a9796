import { describe, expect, it } from "vitest";
import { auditMetroptPublicFaultWindows, publicMetroptFaultReports } from "./public-failure-windows";

describe("UCI MetroPT-3 public metadata inspection", () => {
  it("uses four sourced, local-time compressor fault intervals without suggesting sensor model performance", () => {
    const result = auditMetroptPublicFaultWindows();
    expect(result.processedPublicReportedWindows).toBe(4);
    expect(result.processedSensorRows).toBe(0);
    expect(result.intervals.map((x) => x.elapsedWallClockMinutes))
      .toEqual([1439, 390, 3150, 270]);
    expect(result.intervals.every((x) => x.sourceTimeConvention ===
      "original_wall_clock_timezone_unspecified")).toBe(true);
    expect(result.compressorFailurePredictionEvaluated).toBe(false);
  });
  it("does not infer factory order impacts, technical diagnosis or real customer outcomes", () => {
    const report = auditMetroptPublicFaultWindows();
    expect(report.verifiedManufacturingOrderImpact).toBeNull();
    expect(report.verifiedOwnerDecision).toBeNull();
    expect(report.relativeTimeToDetection).toBeNull();
    expect(report.customerValueEvaluated).toBe(false);
    expect(report.intervals.every((x) => x.machineToOrderLink === null &&
      x.alternativeRoutingEligibility === null)).toBe(true);
  });
  it("credits the public source rather than attributing its records to the GridMind demo factory", () => {
    const report = auditMetroptPublicFaultWindows();
    expect(report.sourceDoi).toBe("10.24432/C5VW3R");
    expect(report.sourceLicense).toBe("CC BY 4.0");
    expect(publicMetroptFaultReports).toHaveLength(4);
  });
});
