import { describe, expect, it } from "vitest";
import { analyze } from "./analysis";
import { createDemoFactory } from "./demo-data";

const now = new Date("2026-10-01T00:00:00Z");

describe("analysis evidence gates", () => {
  it("reports data-quality flags from submitted rows excluded by validation", () => {
    const factory = createDemoFactory();
    factory.months[0] = { ...factory.months[0], production: Number.NaN };

    const result = analyze(factory, now);

    expect(result.rows).toHaveLength(11);
    expect(result.quality.issues).toContain("1 entered month(s) have data-quality flags");
  });

  it("does not create a normalized-energy finding without operating-context reference data", () => {
    const factory = createDemoFactory();
    factory.months = factory.months.map((month) => ({ ...month, operatingHours: Number.NaN }));

    const result = analyze(factory, now);

    expect(result.baselineSec).toBe(0);
    expect(result.reference.sec).toBeNull();
    expect(result.opportunities.some((opportunity) => opportunity.id === "sec-drift")).toBe(false);
  });
});
