import { describe, expect, it } from "vitest";
import { parseMonthlyCsv } from "./csv";
import { validateMonths } from "./pipeline";

const header = "month,kwh,cost,peak_kva,production,operating_hours,power_factor";

describe("monthly CSV import contract", () => {
  it("retains a partial row and marks blank required cells as missing", () => {
    const result = parseMonthlyCsv(`${header}\n2026-01,,720000,1200,20000,600,0.95`);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(Number.isNaN(result.rows[0]?.kwh)).toBe(true);

    const quality = validateMonths(result.rows, new Date("2026-02-01T00:00:00Z"));
    expect(quality.checks[0]?.states).toContain("MISSING");
    expect(quality.usable).toHaveLength(0);
  });

  it("rejects malformed nonblank numeric cells", () => {
    const result = parseMonthlyCsv(`${header}\n2026-01,not-a-number,720000,1200,20000,600,0.95`);
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
