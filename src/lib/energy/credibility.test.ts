import { describe, expect, it } from "vitest";
import { analyze, ASSUMPTIONS, equipmentKwh } from "./analysis";
import { createDemoFactory } from "./demo-data";
import { validateMonths } from "./pipeline";

const now = new Date("2026-10-16T00:00:00Z");

describe("industrial demo credibility checks", () => {
  it("keeps the invented meter series and estimated equipment loads physically coherent", () => {
    const factory = createDemoFactory();
    const pipeline = validateMonths(factory.months, now);
    expect(pipeline.usable).toHaveLength(12);
    expect(pipeline.counts.INVALID).toBe(0);
    expect(pipeline.counts.SUSPECT).toBe(0);
    const estimatedEquipmentKwh = factory.equipment.reduce((sum, item) => sum + equipmentKwh(item), 0);
    const meanMeterKwh = factory.months.reduce((sum, row) => sum + row.kwh, 0) / factory.months.length;
    expect(estimatedEquipmentKwh / meanMeterKwh).toBeLessThanOrEqual(1);
  });

  it("never infers billed kVA, universal contract savings or a PF penalty from unverified tariffs", () => {
    const f = createDemoFactory();
    const result = analyze(f, now);
    expect(ASSUMPTIONS.minBillingDemandPct).toBeNull();
    expect(ASSUMPTIONS.pfPenaltyPerPoint).toBeNull();
    expect(result.rows.every((row) => Number.isNaN(row.billedKva))).toBe(true);
    expect(result.opportunities.find((o) => o.id === "contract-demand")).toBeUndefined();
    expect(result.opportunities.find((o) => o.id === "power-factor")).toBeUndefined();

    // Renaming the factory as real must not grant automatic billing-rule authority.
    const unauditedRealCase = analyze({ ...f, isDemo: false }, now);
    expect(unauditedRealCase.opportunities.find((o) => o.id === "contract-demand")).toBeUndefined();
    expect(unauditedRealCase.opportunities.find((o) => o.id === "power-factor")).toBeUndefined();
  });

  it("does not present synthetic input coverage as independently verified Good 100/100", () => {
    const result = analyze(createDemoFactory(), now);
    expect(result.quality.score).toBeLessThan(80);
    expect(result.quality.issues.join(" ")).toContain("Synthetic example");
  });
});
