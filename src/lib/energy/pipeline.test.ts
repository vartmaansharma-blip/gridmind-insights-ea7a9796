import { describe, expect, it } from "vitest";
import { validateMonths } from "./pipeline";
import { buildReference, envelopeState } from "./reference";

const m = (month: string, o: Partial<{ kwh: number; cost: number; production: number }> = {}) => ({
  month, kwh: o.kwh ?? 100000, cost: o.cost ?? 720000, peakKva: 1200, production: o.production ?? 20000, operatingHours: 600,
});
const now = new Date("2026-10-01T00:00:00Z");

describe("pipeline", () => {
  it("keeps first duplicate and flags the second", () => {
    const r = validateMonths([m("2026-01"), m("2026-01", { kwh: 1 })], now);
    expect(r.checks[1].states).toContain("DUPLICATE");
    expect(r.usable).toHaveLength(1);
    expect(r.usable[0].kwh).toBe(100000);
  });
  it("preserves zero production as an insufficient recorded value, not missing", () => {
    const r = validateMonths([m("2026-01", { production: 0 })], now);
    expect(r.checks[0].states).toContain("INSUFFICIENT");
    expect(r.usable).toHaveLength(0);
    expect(r.analysisPaused).toBe(true);
  });
  it("flags invalid numbers and out-of-order months", () => {
    const r = validateMonths([m("2026-03"), m("2026-01", { cost: -1 })], now);
    expect(r.checks[1].states).toContain("INVALID");
    expect(r.checks[1].states).toContain("OUT_OF_ORDER");
  });
  it("marks stale data", () => {
    expect(validateMonths([m("2025-01"), m("2025-02"), m("2025-03")], now).stale).toBe(true);
  });
});

describe("reference", () => {
  it("returns insufficient with fewer than 3 months", () => {
    const ref = buildReference([{ month: "2026-01", sec: 5, production: 1, operatingHours: 1 }]);
    expect(ref.confidence).toBe("none");
    expect(envelopeState(5, ref)).toBe("insufficient");
  });
  it("computes median reference deterministically", () => {
    const rows = [5, 5.1, 4.9, 5, 5.05, 4.95, 5, 5.02, 4.98].map((sec, i) => ({ month: `2026-0${i + 1}`, sec, production: 100, operatingHours: 600 }));
    const ref = buildReference(rows);
    expect(ref.sec).toBe(5);
    expect(envelopeState(6, ref)).toBe("outside");
    expect(envelopeState(5.01, ref)).toBe("within");
  });
});
