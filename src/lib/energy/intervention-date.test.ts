import { describe, expect, it } from "vitest";
import { implementedMonthFromTimestamp } from "./intervention-date";

describe("implementedMonthFromTimestamp", () => {
  it("keeps an absent implementation timestamp unknown", () => {
    expect(implementedMonthFromTimestamp(null, "Asia/Kolkata")).toBe("");
    expect(implementedMonthFromTimestamp(undefined, "Asia/Kolkata")).toBe("");
  });

  it("returns the month in the factory timezone, not UTC", () => {
    // 31 Jan 20:00 UTC is already 1 Feb in India.
    expect(implementedMonthFromTimestamp("2026-01-31T20:00:00.000Z", "Asia/Kolkata")).toBe("2026-02");
    expect(implementedMonthFromTimestamp("2026-01-31T20:00:00.000Z", "UTC")).toBe("2026-01");
  });

  it("does not invent a month for an invalid timestamp or timezone", () => {
    expect(implementedMonthFromTimestamp("not-a-date", "Asia/Kolkata")).toBe("");
    expect(implementedMonthFromTimestamp("2026-01-01T00:00:00.000Z", "Not/AZone")).toBe("");
  });
});
