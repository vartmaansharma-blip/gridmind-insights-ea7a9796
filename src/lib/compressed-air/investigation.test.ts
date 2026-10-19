import { describe, it, expect } from "vitest";
import {
  HEADER,
  importCompressedAirCsv,
  analyzeCompressedAir,
  exportCompressedAirReport,
} from "./investigation";
const scope = {
  organizationId: "fictional-org",
  siteId: "fictional-site",
  assetId: "fictional-compressor",
};
const csv = [
  HEADER,
  ...[0, 1, 2, 3, 4].map(
    (n) =>
      `2026-01-01T0${n}:00:00Z,2026-01-01T0${n + 1}:00:00Z,${n < 3 ? "baseline" : n === 3 ? "before" : "after"},product-a-loaded,7,10,${n === 3 ? 90 : 60},2`,
  ),
].join("\n");
describe("compressed-air source-linked investigation", () => {
  it("imports exact bytes, flags excess and never certifies savings", async () => {
    const d = await importCompressedAirCsv(csv, scope, "fiction.csv");
    const a = analyzeCompressedAir(d);
    expect(a.comparisons[0].state).toBe("above_baseline_envelope");
    expect(a.comparisons[1].state).toBe("no_resolved_excess");
    expect(a.verificationPairs[0].state).toBe("descriptive_only");
    expect(a.verificationPairs[0].residualIntensityChangeKwPerM3Min?.[1]).toBeLessThan(0);
    expect(a.comparisons[0].baselineLines).toEqual([2, 3, 4]);
    expect(a.comparisons[0].residualKw?.[0]).toBeGreaterThan(20);
    expect(JSON.parse(exportCompressedAirReport(d)).verifiedSavings).toBeNull();
  });
  it("fails closed on changed context, pressure or flow", async () => {
    for (const row of ["other,7,10,90", "product-a-loaded,8,10,90", "product-a-loaded,7,20,90"]) {
      const d = await importCompressedAirCsv(
        csv.replace("product-a-loaded,7,10,90", row),
        scope,
        "fiction.csv",
      );
      expect(analyzeCompressedAir(d).comparisons[0].state).toBe("inconclusive");
    }
  });
  it("rejects missing units/cells, unknown phases, quotes, timezone, duplicate intervals and nonfinite values", async () => {
    for (const bad of [
      csv.replace("pressure_bar", "pressure_psi"),
      csv.replace(",90,", ",,"),
      csv.replace("before", "unknown"),
      csv + '"',
      csv.replace("00:00:00Z", "00:00:00"),
      csv.replace("T01:00:00Z,2026-01-01T02", "T00:00:00Z,2026-01-01T02"),
      csv.replace(",90,", ",Infinity,"),
    ])
      await expect(importCompressedAirCsv(bad, scope, "fiction.csv")).rejects.toThrow();
  });
  it("rejects real origin and stale reviews", async () => {
    const d = await importCompressedAirCsv(csv, scope, "fiction.csv");
    expect(() => analyzeCompressedAir({ ...d, origin: "real" })).toThrow();
    expect(() =>
      exportCompressedAirReport(d, {
        datasetSha256: "0".repeat(64),
        datasetSnapshot: JSON.stringify(d),
        reviewer: "demo",
        competence: "simulated",
        at: "2026-01-02T00:00:00Z",
        simulated: true,
        findings: [],
        actions: [],
        confounders: "unknown",
        outcome: "inconclusive",
      }),
    ).toThrow();
  });
  it("requires approval and completion evidence for action status", async () => {
    const d = await importCompressedAirCsv(csv, scope, "fiction.csv");
    const r = {
      datasetSha256: d.sourceSha256,
      datasetSnapshot: JSON.stringify(d),
      reviewer: "demo",
      competence: "simulated",
      at: "2026-01-02T00:00:00Z",
      simulated: true,
      findings: [],
      actions: [{ id: "a", owner: "o", description: "review meter records", status: "completed" }],
      confounders: "unknown",
      outcome: "inconclusive",
    };
    expect(() => exportCompressedAirReport(d, r)).toThrow();
  });
  it("binds review to identity and normalized values as well as source digest", async () => {
    const d = await importCompressedAirCsv(csv, scope, "fiction.csv");
    const review = {
      datasetSha256: d.sourceSha256,
      datasetSnapshot: JSON.stringify(d),
      reviewer: "demo",
      competence: "simulated",
      at: "2026-01-02T00:00:00Z",
      simulated: true,
      findings: [
        { statement: "Power observation", sourceLines: [5], uncertainty: "unvalidated context" },
      ],
      actions: [],
      confounders: "unknown",
      outcome: "inconclusive",
    };
    expect(JSON.parse(exportCompressedAirReport(d, review)).reviewStatus).toBe(
      "simulated_review_only",
    );
    expect(() =>
      exportCompressedAirReport({ ...d, scope: { ...scope, assetId: "different" } }, review),
    ).toThrow();
    expect(() =>
      exportCompressedAirReport(d, {
        ...review,
        findings: [{ ...review.findings[0], sourceLines: [999] }],
      }),
    ).toThrow();
  });
  it("rejects impossible dates and reversed phase chronology", async () => {
    await expect(
      importCompressedAirCsv(csv.replaceAll("2026-01-01", "2026-02-30"), scope, "fiction.csv"),
    ).rejects.toThrow();
    await expect(
      importCompressedAirCsv(
        csv.replace("before", "after").replace(/after([^]*?)after/, "after$1before"),
        scope,
        "fiction.csv",
      ),
    ).rejects.toThrow();
  });
});
