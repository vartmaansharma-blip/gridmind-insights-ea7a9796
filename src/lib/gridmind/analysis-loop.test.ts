import { describe, expect, it } from "vitest";
import {
  analyzeFactoryLoop,
  canonicalize,
  reproducibilityFingerprint,
  type AnalysisInput,
  type EconomicInputs,
  type OperatingSampleInput,
} from "./analysis-loop";

const asOf = "2026-10-09T12:00:00.000Z";
const sample = (id: string, energyValue: unknown, overrides: Partial<OperatingSampleInput> = {}): OperatingSampleInput => ({
  id,
  factoryId: 1,
  assetId: "compressor-1",
  energyValue,
  energyUnit: "kWh",
  productionValue: 100,
  productionUnit: "units",
  operatingHours: 10,
  operatingState: "loaded",
  productCode: "product-A",
  periodStart: "2026-10-08T00:00:00.000Z",
  periodEnd: "2026-10-09T00:00:00.000Z",
  quality: "valid",
  origin: "observed",
  ...overrides,
});
const input = (
  current = sample("current", 700),
  baselineSamples = [sample("b1", 500), sample("b2", 510), sample("b3", 490)],
  economics: EconomicInputs = {
    currency: "INR",
    tariffInrPerKwh: 8,
    recoverableFraction: 0.6,
    interventionCostInr: 1000,
  },
): AnalysisInput => ({ factoryId: 1, current, baselineSamples, economics, asOf });

describe("authoritative factory-analysis loop", () => {
  it("normalizes MWh and Wh to kWh and calculates an independently verifiable opportunity", () => {
    const baseline = [
      sample("b1", 0.5, { energyUnit: "MWh" }),
      sample("b2", 510000, { energyUnit: "Wh" }),
      sample("b3", 490),
    ];
    const result = analyzeFactoryLoop(input(sample("current", 700), baseline));
    // b1=500 kWh, b2=510 kWh, b3=490 kWh; median=500, so 700/100=7 vs baseline 5.
    expect(result.reference.specificEnergyKwhPerUnit).toBe(5);
    expect(result.deviation.actualSpecificEnergyKwhPerUnit).toBe(7);
    expect(result.deviation.excessEnergyKwh).toBe(200);
    expect(result.economics.estimatedGrossValueInr).toBe(1600);
    expect(result.economics.estimatedRecoverableValueInr).toBe(960);
    expect(result.economics.estimatedNetValueInr).toBe(-40);
    expect(result.status).toBe("opportunity");
  });

  it("preserves a genuine numeric zero and refuses to call zero energy while producing a valid performance result", () => {
    const result = analyzeFactoryLoop(input(sample("current", 0)));
    expect(result.evidence.current).toBeNull();
    expect(result.reasonCodes).toContain("ZERO_ENERGY_WHILE_PRODUCING");
    expect(result.status).toBe("insufficient_evidence");
  });

  it("distinguishes zero production from missing production", () => {
    const zero = analyzeFactoryLoop(input(sample("current", 700, { productionValue: 0 })));
    const missing = analyzeFactoryLoop(input(sample("current", 700, { productionValue: null })));
    expect(zero.reasonCodes).toContain("ZERO_PRODUCTION");
    expect(missing.reasonCodes).toContain("MISSING_PRODUCTION_VALUE");
  });

  it("distinguishes a missing measurement from an invalid measurement", () => {
    const missing = analyzeFactoryLoop(input(sample("current", null)));
    const invalid = analyzeFactoryLoop(input(sample("current", Number.NaN)));
    expect(missing.reasonCodes).toContain("MISSING_ENERGY_VALUE");
    expect(invalid.reasonCodes).toContain("INVALID_ENERGY_VALUE");
    expect(missing.evidence.current).toBeNull();
    expect(invalid.evidence.current).toBeNull();
  });

  it("rejects unsupported units, invalid timestamps, future timestamps, stale data, and non-valid quality", () => {
    const unit = analyzeFactoryLoop(input(sample("current", 700, { energyUnit: "widgets" })));
    const timestamp = analyzeFactoryLoop(input(sample("current", 700, { periodStart: "not-a-date" })));
    const future = analyzeFactoryLoop(input(sample("current", 700, { periodEnd: "2026-10-10T00:00:00.000Z" })));
    const stale = analyzeFactoryLoop(input(sample("current", 700, { periodEnd: "2025-01-01T00:00:00.000Z" })));
    const quality = analyzeFactoryLoop(input(sample("current", 700, { quality: "unverified" })));
    expect(unit.reasonCodes).toContain("UNSUPPORTED_ENERGY_UNIT");
    expect(timestamp.reasonCodes).toContain("INVALID_TIMESTAMP");
    expect(future.reasonCodes).toContain("FUTURE_TIMESTAMP");
    expect(stale.reasonCodes).toContain("STALE_CURRENT_OBSERVATION");
    expect(quality.reasonCodes).toContain("NON_VALID_QUALITY_STATUS");
  });

  it("refuses financial quantification when economic inputs are missing", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700), undefined, {
      currency: "INR", tariffInrPerKwh: null, recoverableFraction: 0.6, interventionCostInr: 1000,
    }));
    expect(result.deviation.detected).toBe(true);
    expect(result.economics.quantified).toBe(false);
    expect(result.economics.estimatedGrossValueInr).toBeNull();
    expect(result.economics.refusalReasons).toContain("MISSING_TARIFF");
    expect(result.status).toBe("insufficient_evidence");
  });

  it("rejects unsupported production units and duplicate sample IDs", () => {
    const unsupported = analyzeFactoryLoop(input(sample("current", 700, { productionUnit: "bananas" })));
    const duplicate = analyzeFactoryLoop(input(sample("current", 700), [
      sample("b1", 500), sample("b1", 510), sample("b3", 490),
    ]));
    expect(unsupported.reasonCodes).toContain("UNSUPPORTED_PRODUCTION_UNIT");
    expect(duplicate.reference.sampleCount).toBe(2);
    expect(duplicate.evidence.excludedBaseline.find((x) => x.id === "b1")?.reasons).toContain("DUPLICATE_SAMPLE_ID");
  });

  it("requires three comparable valid baseline samples", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700), [sample("b1", 500), sample("b2", 510)]));
    expect(result.reference.specificEnergyKwhPerUnit).toBeNull();
    expect(result.reasonCodes).toContain("INSUFFICIENT_COMPARABLE_BASELINE");
    expect(result.status).toBe("insufficient_evidence");
  });

  it("rejects cross-factory evidence in the baseline", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700), [
      sample("b1", 500), sample("b2", 510), sample("b3", 490, { factoryId: 2 }),
    ]));
    expect(result.evidence.excludedBaseline.find((x) => x.id === "b3")?.reasons).toContain("FACTORY_MISMATCH");
    expect(result.reference.sampleCount).toBe(2);
  });

  it("marks synthetic inputs and never labels their results as verified", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700, { origin: "synthetic" })));
    expect(result.provenance.synthetic).toBe(true);
    expect(result.provenance.origin).toBe("synthetic");
    expect(result.reference.limitations.some((x) => x.includes("synthetic"))).toBe(true);
    expect(result.economics.label).toBe("estimate");
  });

  it("reproduces the same canonical result and fingerprint after JSON persistence/reload", () => {
    const first = analyzeFactoryLoop(input());
    const persisted = JSON.stringify(first);
    const reloaded = JSON.parse(persisted) as typeof first;
    const second = analyzeFactoryLoop(input());
    expect(canonicalize(reloaded)).toBe(canonicalize(second));
    expect(reproducibilityFingerprint(reloaded)).toBe(reproducibilityFingerprint(second));
    expect(reproducibilityFingerprint({ b: 2, a: 1 })).toBe(reproducibilityFingerprint({ a: 1, b: 2 }));
  });
});
