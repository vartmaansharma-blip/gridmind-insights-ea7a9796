import { describe, expect, it } from "vitest";
import { validateMonths } from "./pipeline";
import type { MonthRecord } from "./types";

const row = (month: string, overrides: Partial<MonthRecord> = {}): MonthRecord => ({
  month,
  kwh: 100_000,
  cost: 900_000,
  peakKva: 100,
  production: 10_000,
  operatingHours: 600,
  ...overrides,
});
const now = new Date("2026-04-01T00:00:00Z");

describe("economic-discovery synthetic readiness: controls currently enforced by the monthly pipeline", () => {
  it("T04 partial control: flags a repeated month and keeps only the first row", () => {
    const result = validateMonths([
      row("2026-01"),
      row("2026-01", { kwh: 120_000, cost: 1_080_000 }),
      row("2026-02"),
    ], now);

    expect(result.checks[1].states).toContain("DUPLICATE");
    expect(result.usable.map((item) => item.month)).toEqual(["2026-01", "2026-02"]);
    expect(result.usable[0].kwh).toBe(100_000);
  });

  it("T05 partial control: flags an extreme intensity but does not silently delete it", () => {
    const result = validateMonths([
      row("2026-01"),
      row("2026-02"),
      row("2026-03", { kwh: 12_000_000, cost: 900_000 }),
    ], now);

    expect(result.checks[2].states).toContain("SUSPECT");
    expect(result.usable.some((item) => item.month === "2026-03")).toBe(true);
  });

  it("T09 partial control: a missing production denominator prevents that row from being usable", () => {
    const missingProduction = row("2026-03", { production: undefined as unknown as number });
    const result = validateMonths([row("2026-01"), row("2026-02"), missingProduction], now);

    expect(result.checks[2].states).toContain("MISSING");
    expect(result.checks[2].usable).toBe(false);
    expect(result.usable.some((item) => item.month === "2026-03")).toBe(false);
  });

  it("T01 partial control: reports insufficient history when fewer than three usable months remain", () => {
    const result = validateMonths([row("2026-01"), row("2026-03")], now);

    expect(result.analysisPaused).toBe(true);
    expect(result.usable).toHaveLength(2);
  });

  it.todo("T01 full: detect missing calendar periods even when the remaining rows meet the minimum count");
  it.todo("T02: preserve source unit/value and perform only explicit, logged unit conversions");
  it.todo("T03: model tariff effective dates and separate quantity from rate effects");
  it.todo("T04 full: deduplicate invoices using site/meter, utility, invoice ID, period, and amount; do not rely on month alone");
  it.todo("T05 full: reconcile energy, bill components, billing unit, and tariff; pause financial interpretation on conflict");
  it.todo("T06: capture product mix, process, shift, and operating context and prevent invalid cross-context comparisons");
  it.todo("T07: maintain a provenance-backed causal-claim register and require discriminating evidence");
  it.todo("T08: block customer-facing financial claims until traceability, reviewer approval, and customer-approved wording exist");
  it.todo("T10: retain and reconcile conflicting invoice versions rather than treating one same-month row as a duplicate by default");
  it.todo("T11: report baseline sensitivity with comparable-period eligibility and no cherry-picking");
  it.todo("T12: represent a reviewed no-material-opportunity outcome without manufacturing follow-up work");
  it.todo("T13: model kWh/kVAh billing basis, fixed charges, demand charges, and power-factor effects separately");
});
