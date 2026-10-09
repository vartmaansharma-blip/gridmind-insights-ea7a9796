import { describe, expect, it } from "vitest";
import { parseMonthlyCsv } from "./csv";
import { validateMonths } from "./pipeline";

const header = "month,kwh,cost,peak_kva,production,operating_hours,power_factor";
const now = new Date("2026-02-01T00:00:00Z");

describe("monthly CSV evidence semantics", () => {
  it("preserves partial rows and marks blank required values as missing", () => {
    const parsed = parseMonthlyCsv(`${header}\n2026-01,,720000,1200,20000,600,0.95`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.rows).toHaveLength(1);
    expect(Number.isNaN(parsed.rows[0]?.kwh)).toBe(true);

    const quality = validateMonths(parsed.rows, now);
    expect(quality.checks[0]?.states).toContain("INVALID");
    expect(quality.checks[0]?.notes.join(" ")).toContain("not a finite numeric value");
    expect(quality.usable).toHaveLength(0);
  });

  it("preserves an explicitly entered zero rather than treating it as missing", () => {
    const parsed = parseMonthlyCsv(`${header}\n2026-01,0,0,0,0,0,`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      kwh: 0,
      cost: 0,
      peakKva: 0,
      production: 0,
      operatingHours: 0,
    });
    expect(parsed.rows[0]?.powerFactor).toBeUndefined();

    const quality = validateMonths(parsed.rows, now);
    expect(quality.checks[0]?.states).toContain("INSUFFICIENT");
    expect(quality.checks[0]?.states).not.toContain("MISSING");
    expect(quality.usable).toHaveLength(0);
  });

  it("rejects malformed nonblank numeric cells instead of silently coercing them", () => {
    const parsed = parseMonthlyCsv(`${header}\n2026-01,not-a-number,720000,1200,20000,600,0.95`);

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]).toContain("kWh must be a number");
  });

  it("accepts a complete row and preserves valid numeric values", () => {
    const parsed = parseMonthlyCsv(`${header}\n2026-01,100000,720000,1200,20000,600,0.95`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      month: "2026-01",
      kwh: 100000,
      cost: 720000,
      peakKva: 1200,
      production: 20000,
      operatingHours: 600,
      powerFactor: 0.95,
    });
  });
});
