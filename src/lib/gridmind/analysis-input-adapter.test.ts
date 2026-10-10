import { describe, expect, it } from "vitest";
import type { ObservationContract, OperatingContextContract } from "./domain";
import { buildAnalysisInputFromCanonical } from "./analysis-input-adapter";
import { analyzeFactoryLoop } from "./analysis-loop";

const factoryId = 3;
const assetId = 7;
const periods = [
  { start: "2026-10-05T00:00:00.000Z", end: "2026-10-06T00:00:00.000Z", energy: 500 },
  { start: "2026-10-06T00:00:00.000Z", end: "2026-10-07T00:00:00.000Z", energy: 510 },
  { start: "2026-10-07T00:00:00.000Z", end: "2026-10-08T00:00:00.000Z", energy: 490 },
  { start: "2026-10-08T00:00:00.000Z", end: "2026-10-09T00:00:00.000Z", energy: 700 },
];
const observations = (currentEnergy = 700): ObservationContract[] => {
  let id = 1;
  return periods.flatMap((period, periodIndex) => {
    const energy = periodIndex === 3 ? currentEnergy : period.energy;
    return [
      { role: "energy", value: energy, unit: "kWh" },
      { role: "production", value: 100, unit: "units" },
      { role: "operating_hours", value: 10, unit: "h" },
    ].map((row) => ({
      id: id++,
      factoryId,
      subjectType: "asset" as const,
      subjectId: assetId,
      metric: row.role === "energy" ? "energy_consumption_kwh" : row.role === "production" ? "production_output" : row.role,
      valueNumeric: row.value,
      valueText: null,
      unit: row.unit,
      observedAt: period.start,
      observedUntil: period.end,
      dataSourceId: 2,
      qualityStatus: "valid" as const,
      qualityScore: 1,
      isEstimated: false,
      provenance: {},
      metadata: { analysis_role: row.role, period_start: period.start, period_end: period.end },
      createdAt: period.end,
    }));
  });
};
const contexts: OperatingContextContract[] = [{
  id: 12,
  factoryId,
  scopeType: "asset",
  scopeId: assetId,
  contextType: "analysis",
  startTime: "2026-10-01T00:00:00.000Z",
  endTime: null,
  status: "validated",
  confidence: 1,
  sourceId: 2,
  values: { analysis_loop: { operatingState: "loaded", productCode: "P1" } },
}];
const economics = {
  id: 5,
  name: "Plant tariff",
  currency: "INR",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  effectiveUntil: null,
  metadata: { analysis_loop: { tariffInrPerKwh: 8, recoverableFraction: 0.6, interventionCostInr: 500 } },
};

describe("canonical analysis input adapter", () => {
  it("assembles historical periods, preserves source IDs and produces a reproducible opportunity only with economic inputs", () => {
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: observations(),
      operatingContexts: contexts,
      economicContext: economics,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);

    expect(input.current.energyValue).toBe(700);
    expect(input.baselineSamples).toHaveLength(3);
    expect(input.current.sourceObservationIds).toEqual([10, 11, 12]);
    expect(result.provenance.inputObservationIds).toHaveLength(12);
    expect(result.deviation.detected).toBe(true);
    expect(result.economics.estimatedNetValueInr).toBe(460);
    expect(result.status).toBe("opportunity");
  });

  it("uses only the declared canonical metric names when role metadata is absent", () => {
    const source = observations().map((observation) => {
      const metadata = { ...observation.metadata };
      delete metadata.analysis_role;
      return { ...observation, metadata };
    });
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: source,
      operatingContexts: contexts,
      economicContext: economics,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);
    expect(input.current.energyValue).toBe(700);
    expect(input.current.productionValue).toBe(100);
    expect(result.status).toBe("opportunity");
  });

  it("preserves a genuine zero from canonical observations instead of converting it to missing", () => {
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: observations(0),
      operatingContexts: contexts,
      economicContext: economics,
      asOf: "2026-10-09T12:00:00.000Z",
    });

    expect(input.current.energyValue).toBe(0);
    expect(input.current.quality).toBe("valid");
    expect(input.current.sourceObservationIds).toEqual([10, 11, 12]);
    expect(analyzeFactoryLoop(input).reasonCodes).toContain("ZERO_ENERGY_WHILE_PRODUCING");
  });

  it("refuses to invent an operating context or economic inputs", () => {
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: observations(),
      operatingContexts: [],
      economicContext: null,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);

    expect(input.current.productCode).toBe("");
    expect(input.current.operatingState).toBe("");
    expect(input.economics.currency).toBeNull();
    expect(result.economics.currency).toBe("UNSPECIFIED");
    expect(result.economics.quantified).toBe(false);
    expect(result.reasonCodes).toContain("MISSING_PRODUCT_CONTEXT");
  });

  it("refuses economic quantification when physical evidence is sufficient but economics are absent", () => {
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: observations(),
      operatingContexts: contexts,
      economicContext: null,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);

    expect(result.deviation.detected).toBe(true);
    expect(result.economics.quantified).toBe(false);
    expect(result.economics.refusalReasons).toContain("MISSING_TARIFF");
    expect(result.economics.refusalReasons).toContain("MISSING_RECOVERY_FRACTION");
  });

  it("preserves malformed economic inputs as invalid instead of reclassifying them as missing", () => {
    const malformedEconomics = {
      ...economics,
      metadata: { analysis_loop: { tariffInrPerKwh: "8", recoverableFraction: 0.6, interventionCostInr: 500 } },
    };
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: observations(),
      operatingContexts: contexts,
      economicContext: malformedEconomics,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);
    expect(result.economics.quantified).toBe(false);
    expect(result.economics.refusalReasons).toContain("INVALID_TARIFF");
    expect(result.economics.refusalReasons).not.toContain("MISSING_TARIFF");
  });

  it("refuses equally ranked conflicting operating contexts", () => {
    const conflictingContexts = [
      ...contexts,
      { ...contexts[0], id: 13, values: { analysis_loop: { operatingState: "unloaded", productCode: "P2" } } },
    ];
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: observations(),
      operatingContexts: conflictingContexts,
      economicContext: economics,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);
    expect(result.reasonCodes).toContain("AMBIGUOUS_OPERATING_CONTEXT");
    expect(result.economics.quantified).toBe(false);
  });

  it("refuses unknown analysis-role mappings and still retains the source observation ID", () => {
    const source = observations();
    source[9] = { ...source[9], metadata: { ...source[9].metadata, analysis_role: "energy_guess" } };
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: source,
      operatingContexts: contexts,
      economicContext: economics,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);

    expect(input.current.sourceObservationIds).toContain(10);
    expect(result.reasonCodes).toContain("UNMAPPED_OBSERVATION_ROLE");
    expect(result.economics.quantified).toBe(false);
  });

  it("returns an explicit synthetic insufficient-evidence sample when no observations exist", () => {
    const input = buildAnalysisInputFromCanonical({
      factoryId,
      assetId,
      observations: [],
      operatingContexts: [],
      economicContext: null,
      asOf: "2026-10-09T12:00:00.000Z",
    });
    const result = analyzeFactoryLoop(input);

    expect(input.current.energyValue).toBeNull();
    expect(input.current.origin).toBe("synthetic");
    expect(result.status).toBe("insufficient_evidence");
    expect(result.provenance.synthetic).toBe(true);
  });
});
