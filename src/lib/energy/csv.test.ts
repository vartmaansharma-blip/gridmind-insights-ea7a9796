import { describe, expect, it } from "vitest";
import { parseMonthlyCsv } from "./csv";

const header = "month,kwh,cost,peak_kva,production,operating_hours,power_factor";

describe("monthly CSV import contract", () => {
  it("rejects blank required cells instead of coercing them to zero", () => {
    const result = parseMonthlyCsv(`${header}\n2026-01,,720000,1200,20000,600,0.95`);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it("preserves explicitly entered zero values for downstream quality validation", () => {
    const result = parseMonthlyCsv(`${header}\n2026-01,0,0,0,0,0,`);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      kwh: 0,
      cost: 0,
      peakKva: 0,
      production: 0,
      operatingHours: 0,
    });
    expect(result.rows[0]?.powerFactor).toBeUndefined();
  });
});
