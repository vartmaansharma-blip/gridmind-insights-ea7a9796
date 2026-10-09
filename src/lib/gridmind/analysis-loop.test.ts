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
const samplePeriods: Record<string, { start: string; end: string }> = {
  current: { start: "2026-10-08T00:00:00.000Z", end: "2026-10-09T00:00:00.000Z" },
  b1: { start: "2026-10-05T00:00:00.000Z", end: "2026-10-06T00:00:00.000Z" },
  b2: { start: "2026-10-06T00:00:00.000Z", end: "2026-10-07T00:00:00.000Z" },
  b3: { start: "2026-10-07T00:00:00.000Z", end: "2026-10-08T00:00:00.000Z" },
};
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
  periodStart: samplePeriods[id]?.start ?? "2026-10-07T00:00:00.000Z",
  periodEnd: samplePeriods[id]?.end ?? "2026-10-08T00:00:00.000Z",
  quality: "valid",
  origin: "synthetic",
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
    const result = analyzeFactoryLoop(input(sample("current", 700), baseline, {
      currency: "INR", tariffInrPerKwh: 8, recoverableFraction: 0.6, interventionCostInr: 500,
    }));
    // b1=500 kWh, b2=510 kWh, b3=490 kWh; median=500, so 700/100=7 vs baseline 5.
    expect(result.reference.specificEnergyKwhPerUnit).toBe(5);
    expect(result.deviation.actualSpecificEnergyKwhPerUnit).toBe(7);
    expect(result.deviation.excessEnergyKwh).toBe(200);
    expect(result.economics.estimatedGrossValueInr).toBe(1600);
    expect(result.economics.estimatedRecoverableValueInr).toBe(960);
    expect(result.economics.estimatedNetValueInr).toBe(460);
    expect(result.status).toBe("opportunity");
  });

  it("does not label a quantified but non-positive net-value deviation as an opportunity", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700)));
    expect(result.deviation.detected).toBe(true);
    expect(result.economics.quantified).toBe(true);
    expect(result.economics.estimatedNetValueInr).toBe(-40);
    expect(result.status).toBe("deviation_no_opportunity");
    expect(result.reasonCodes).toContain("NON_POSITIVE_NET_VALUE");
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

  it("rejects unknown provenance labels instead of silently treating them as observed", () => {
    const baseline = [
      sample("b1", 500, { origin: "observed" }),
      sample("b2", 510, { origin: "observed" }),
      sample("b3", 490, { origin: "observed" }),
    ];
    const invalid = analyzeFactoryLoop(input(sample("current", 700, {
      origin: "real" as OperatingSampleInput["origin"],
    }), baseline));
    expect(invalid.reasonCodes).toContain("INVALID_SAMPLE_ORIGIN");
    expect(invalid.evidence.current).toBeNull();
    expect(invalid.provenance.origin).toBe("estimated");
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

  it("compares operating rates rather than raw totals across different period lengths", () => {
    const twoDayBaseline = [
      sample("b1", 1000, { productionValue: 200, operatingHours: 20, periodStart: "2026-10-02T00:00:00.000Z", periodEnd: "2026-10-04T00:00:00.000Z" }),
      sample("b2", 1020, { productionValue: 204, operatingHours: 20.4, periodStart: "2026-10-04T00:00:00.000Z", periodEnd: "2026-10-06T00:00:00.000Z" }),
      sample("b3", 980, { productionValue: 196, operatingHours: 19.6, periodStart: "2026-10-06T00:00:00.000Z", periodEnd: "2026-10-08T00:00:00.000Z" }),
    ];
    const result = analyzeFactoryLoop(input(sample("current", 700), twoDayBaseline));
    expect(result.reference.specificEnergyKwhPerUnit).toBe(5);
    expect(result.reference.sampleCount).toBe(3);
    expect(result.evidence.excludedBaseline).toHaveLength(0);
  });

  it("rejects operating hours exceeding the actual observation period", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700, {
      operatingHours: 2,
      periodStart: "2026-10-09T10:00:00.000Z",
      periodEnd: "2026-10-09T11:00:00.000Z",
    })));
    expect(result.reasonCodes).toContain("INVALID_OPERATING_HOURS");
    expect(result.evidence.current).toBeNull();
  });

  it("rejects timestamps that omit seconds and validates age-policy inputs", () => {
    const malformed = analyzeFactoryLoop(input(sample("current", 700, { periodStart: "2026-10-08T00:00Z" })));
    const impossibleDate = analyzeFactoryLoop(input(sample("current", 700, { periodStart: "2026-02-30T00:00:00.000Z" })));
    const offsetTimestamp = analyzeFactoryLoop(input(sample("current", 700, { periodStart: "2026-10-08T05:30:00.123456+05:30" })));
    const badPolicy = analyzeFactoryLoop({ ...input(), maxCurrentAgeDays: -1 });
    expect(malformed.reasonCodes).toContain("INVALID_TIMESTAMP");
    expect(impossibleDate.reasonCodes).toContain("INVALID_TIMESTAMP");
    expect(offsetTimestamp.reference.sampleCount).toBe(3);
    expect(badPolicy.reasonCodes).toContain("INVALID_AGE_POLICY");
    expect(badPolicy.evidence.current).toBeNull();
  });

  it("rejects missing sample identifiers without throwing", () => {
    const invalid = analyzeFactoryLoop(input(sample("current", 700, { id: "" })));
    expect(invalid.reasonCodes).toContain("INVALID_SAMPLE_ID");
    expect(invalid.evidence.current).toBeNull();
  });

  it("rejects unsupported production units and duplicate sample IDs", () => {
    const unsupported = analyzeFactoryLoop(input(sample("current", 700, { productionUnit: "bananas" })));
    const duplicate = analyzeFactoryLoop(input(sample("current", 700), [
      sample("b1", 500), sample("b1", 510), sample("b3", 490),
    ]));
    expect(unsupported.reasonCodes).toContain("UNSUPPORTED_PRODUCTION_UNIT");
    expect(duplicate.reference.sampleCount).toBe(1);
    expect(duplicate.evidence.excludedBaseline.find((x) => x.id === "b1")?.reasons).toContain("DUPLICATE_SAMPLE_ID");
  });

  it("reports a context-specific exclusion reason for mismatched assets", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700), [
      sample("b1", 500, { assetId: "compressor-2" }), sample("b2", 510), sample("b3", 490),
    ]));
    expect(result.evidence.excludedBaseline.find((x) => x.id === "b1")?.reasons).toContain("ASSET_CONTEXT_NOT_COMPARABLE");
    expect(result.reference.sampleCount).toBe(2);
  });

  it("requires three comparable valid baseline samples", () => {
    const result = analyzeFactoryLoop(input(sample("current", 700), [sample("b1", 500), sample("b2", 510)]));
    expect(result.reference.specificEnergyKwhPerUnit).toBeNull();
    expect(result.reasonCodes).toContain("INSUFFICIENT_COMPARABLE_BASELINE");
    expect(result.status).toBe("insufficient_evidence");
  });

  it("rejects baseline periods that overlap the current observation or another accepted baseline", () => {
    const overlapsCurrent = analyzeFactoryLoop(input(sample("current", 700), [
      sample("b1", 500, { periodStart: "2026-10-08T12:00:00.000Z", periodEnd: "2026-10-09T00:00:00.000Z" }),
      sample("b2", 510), sample("b3", 490),
    ]));
    expect(overlapsCurrent.evidence.excludedBaseline.find((x) => x.id === "b1")?.reasons).toContain("BASELINE_PERIOD_NOT_HISTORICAL");

    const overlappingBaselines = analyzeFactoryLoop(input(sample("current", 700), [
      sample("b1", 750, { productionValue: 150, operatingHours: 15, periodStart: "2026-10-05T00:00:00.000Z", periodEnd: "2026-10-06T12:00:00.000Z" }),
      sample("b2", 510, { periodStart: "2026-10-06T00:00:00.000Z", periodEnd: "2026-10-07T00:00:00.000Z" }),
      sample("b3", 490),
    ]));
    expect(overlappingBaselines.evidence.excludedBaseline.find((x) => x.id === "b2")?.reasons).toContain("OVERLAPPING_BASELINE_PERIODS");
    expect(overlappingBaselines.reference.sampleCount).toBe(2);
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

  it("refuses economic quantification when finite inputs overflow during calculation", () => {
    const result = analyzeFactoryLoop(input(sample("current", 1e308), [
      sample("b1", 1e307), sample("b2", 1e307), sample("b3", 1e307),
    ]));
    expect(result.deviation.detected).toBe(true);
    expect(result.economics.quantified).toBe(false);
    expect(result.economics.estimatedGrossValueInr).toBeNull();
    expect(result.reasonCodes).toContain("NUMERIC_OVERFLOW");
    expect(result.economics.refusalReasons).toContain("NUMERIC_OVERFLOW");
  });

  it("distinguishes missing currency from unsupported currency inputs", () => {
    const badCurrency = { ...input(), economics: { ...input().economics, currency: "USD" } } as unknown as AnalysisInput;
    const unsupported = analyzeFactoryLoop(badCurrency);
    const missingCurrency = { ...input(), economics: { ...input().economics, currency: null } } as unknown as AnalysisInput;
    const missing = analyzeFactoryLoop(missingCurrency);
    expect(unsupported.economics.quantified).toBe(false);
    expect(unsupported.economics.currency).toBe("USD");
    expect(unsupported.economics.refusalReasons).toContain("UNSUPPORTED_CURRENCY");
    expect(missing.economics.currency).toBe("UNSPECIFIED");
    expect(missing.economics.refusalReasons).toContain("MISSING_CURRENCY");
  });

  it("produces the same result when the same baseline evidence arrives in a different order", () => {
    const baseline = [sample("b1", 500), sample("b2", 510), sample("b3", 490)];
    const forward = analyzeFactoryLoop(input(sample("current", 700), baseline));
    const reversed = analyzeFactoryLoop(input(sample("current", 700), [...baseline].reverse()));
    expect(canonicalize(forward)).toBe(canonicalize(reversed));
    expect(reproducibilityFingerprint(forward)).toBe(reproducibilityFingerprint(reversed));
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
