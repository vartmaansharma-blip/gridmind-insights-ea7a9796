import { describe, expect, it } from "vitest";
import { replayMaterialShortage, type ReplayInput } from "./material-shortage-replay";

function fixture(): ReplayInput {
  return {
    origin: "synthetic",
    records: [
      "signal",
      "discovered",
      "notified",
      "escalated",
      "acknowledged",
      "dispatched",
      "arrived",
      "stopped",
      "restarted",
    ].map((anchor, i) => ({
      anchor: anchor as ReplayInput["records"][number]["anchor"],
      reference: `Invented fixture row ${i + 1}`,
      at: `2026-01-01T${String(i + 1).padStart(2, "0")}:00:00+05:30`,
      recordedAt: `2026-01-01T${String(i + 1).padStart(2, "0")}:00:00+05:30`,
      permitted: true,
      clockVerified: true,
      conflict: "",
    })),
  };
}

describe("offline material-shortage research replay", () => {
  it("reuses a C1 case and computes descriptive time without asserting prevention or approval", () => {
    const report = replayMaterialShortage(fixture());
    expect(report.elapsedMinutes.warningOpportunity).toBe(60);
    expect(report.investigation.candidate).toBe("C1");
    expect(report.investigation.reviews).toEqual([]);
    expect(report.investigation.decision.status).toBe("pending");
    expect(report.investigation.outcome.status).toBe("not_measured");
    expect(report.investigation.evidence.every((e) => !e.checked)).toBe(true);
    expect(report.conclusion).toBe("inconclusive");
    expect(report.verifiedSavings).toBeNull();
  });
  it.each([
    "missing time",
    "unverified clock",
    "revoked permission",
    "contradiction",
    "backfilled signal",
    "reversed stop",
  ])("fails closed for %s", (mode) => {
    const data = fixture();
    if (mode === "missing time") data.records[0].at = null;
    if (mode === "unverified clock") data.records[0].clockVerified = false;
    if (mode === "revoked permission") data.records[0].permitted = false;
    if (mode === "contradiction") data.records[0].conflict = "Disputed stock date";
    if (mode === "backfilled signal") data.records[0].recordedAt = "2026-01-02T01:00:00+05:30";
    if (mode === "reversed stop") data.records[8].at = "2026-01-01T07:00:00+05:30";
    const report = replayMaterialShortage(data);
    expect(Object.values(report.elapsedMinutes).every((v) => v === null)).toBe(true);
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.conclusion).toBe("inconclusive");
  });
  it("rejects real origin, timezone-free dates, duplicate anchors and unsupported fields", () => {
    expect(() => replayMaterialShortage({ ...fixture(), origin: "customer" })).toThrow();
    const data = fixture();
    data.records[0].at = "2026-01-01T00:00:00";
    expect(() => replayMaterialShortage(data)).toThrow();
    const duplicate = fixture();
    duplicate.records.push(duplicate.records[0]);
    expect(() => replayMaterialShortage(duplicate)).toThrow();
    expect(() => replayMaterialShortage({ ...fixture(), recoveredSales: 4000000 })).toThrow();
  });
  it("binds input changes and handles mixed offsets without local-time assumptions", () => {
    const before = replayMaterialShortage(fixture());
    const data = fixture();
    data.records[1].at = "2025-12-31T20:30:00Z";
    expect(replayMaterialShortage(data).elapsedMinutes.warningOpportunity).toBe(60);
    expect(replayMaterialShortage(data).inputSha256).not.toBe(before.inputSha256);
  });
  it("returns explicit unknowns for no records", () => {
    const report = replayMaterialShortage({ origin: "synthetic", records: [] });
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.investigation.events).toEqual([]);
    expect(report.verifiedSavings).toBeNull();
  });
});
