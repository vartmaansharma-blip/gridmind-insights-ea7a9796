import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  airCommandSchema,
  airStoredSchema,
  airHash,
  executeAirCommand,
  type AirSnapshot,
} from "./connected";
import { importCompressedAirCsv } from "./investigation";
import * as method from "./investigation";
afterEach(() => vi.restoreAllMocks());

const actor = "11111111-1111-4111-8111-111111111111";
const reviewer = "22222222-2222-4222-8222-222222222222";
const caseId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const csv = readFileSync(
  new URL("../../../data/compressed-air/synthetic.csv", import.meta.url),
  "utf8",
);
async function fixture() {
  const dataset = await importCompressedAirCsv(
    csv,
    { organizationId: "1", siteId: "2", assetId: "3" },
    "synthetic.csv",
  );
  const snapshot: AirSnapshot = {
    method: "compressed-air-context-envelope-v1",
    origin: "synthetic",
    dataset,
    csv,
    datasetHash: await airHash(dataset),
    importedBy: actor,
    importedAt: "2026-10-19T00:00:00Z",
    importRevision: 1,
    review: null,
    actions: [],
    verification: null,
  };
  return {
    caseId,
    revision: 1,
    headRevision: 1,
    role: "reviewer",
    snapshot,
    snapshotSha256: "a".repeat(64),
    actorId: actor,
    at: "2026-10-19T00:00:00Z",
  };
}
describe("compressed-air connected contract and source custody", () => {
  it("rejects forged scope, reviewer identity, origin and arbitrary snapshots", () => {
    const cmd = {
      action: "import",
      caseId,
      expectedRevision: 0,
      requestKey: "import",
      assetId: 3,
      sourceName: "synthetic.csv",
      csv,
    };
    for (const extra of [
      { actorId: actor },
      { organizationId: "foreign" },
      { origin: "customer" },
      { snapshot: {} },
    ])
      expect(airCommandSchema.safeParse({ ...cmd, ...extra }).success).toBe(false);
    expect(
      airCommandSchema.safeParse({ ...cmd, assetId: Number.MAX_SAFE_INTEGER + 1 }).success,
    ).toBe(false);
  });
  it("detects changed raw source, normalized values and source digest on load", async () => {
    for (const mutation of ["raw", "normalized", "digest"] as const) {
      const stored = await fixture();
      if (mutation === "raw") stored.snapshot.csv += "\n";
      else if (mutation === "normalized") stored.snapshot.dataset.samples[0].powerKw += 1;
      else stored.snapshot.dataset.sourceSha256 = "b".repeat(64);
      await expect(
        executeAirCommand({ call: vi.fn().mockResolvedValue(stored) }, reviewer, {
          action: "load",
          caseId,
        }),
      ).rejects.toThrow("AIR_SOURCE_INTEGRITY_FAILED");
    }
  });
  it("rejects an accepted review bound to a different normalized dataset", async () => {
    const stored = await fixture();
    stored.snapshot.review = {
      actorId: reviewer,
      at: "2026-10-19T00:00:00Z",
      simulated: true,
      datasetHash: "b".repeat(64),
      decision: "accept",
      competence: "Synthetic competence pending qualification",
      rationale: "Synthetic review rationale only",
      confounders: "Confounder assumptions unvalidated",
      findings: [],
    };
    await expect(
      executeAirCommand({ call: vi.fn().mockResolvedValue(stored) }, reviewer, {
        action: "load",
        caseId,
      }),
    ).rejects.toThrow("AIR_REVIEW_INTEGRITY_FAILED");
  });
  it("refuses stale review before writing and does not accept client-authored action history", async () => {
    const stored = await fixture();
    const call = vi.fn().mockResolvedValueOnce({ found: false }).mockResolvedValueOnce(stored);
    await expect(
      executeAirCommand({ call }, reviewer, {
        action: "review",
        caseId,
        expectedRevision: 1,
        requestKey: "review",
        datasetHash: "c".repeat(64),
        decision: "accept",
        competence: "Synthetic competence only",
        rationale: "Synthetic review rationale",
        confounders: "Synthetic unvalidated conditions",
        findings: [],
      }),
    ).rejects.toThrow("AIR_STALE_REVIEW");
    expect(call).toHaveBeenCalledTimes(2);
  });
  it("returns the frozen exported analysis on retry without re-running the current method", async () => {
    const stored = await fixture();
    const s = stored.snapshot;
    const receipt = {
      ...stored,
      reportSha256: "b".repeat(64),
      report: {
        caseId,
        revision: stored.revision,
        snapshotSha256: stored.snapshotSha256,
        exportedBy: stored.actorId,
        exportedAt: stored.at,
        dataset: s.dataset,
        originalCsv: s.csv,
        datasetHash: s.datasetHash,
        importRevision: s.importRevision,
        importedBy: s.importedBy,
        importedAt: s.importedAt,
        analysis: method.analyzeCompressedAir(s.dataset),
        engineerReview: s.review,
        actions: s.actions,
        outcomeVerification: s.verification,
        reviewStatus: "unreviewed",
        verifiedSavings: null,
        approvedForCustomerDelivery: false,
      },
    };
    const analyze = vi.spyOn(method, "analyzeCompressedAir").mockImplementation(() => {
      throw new Error("Current method must not replace a committed report");
    });
    const call = vi.fn().mockResolvedValue(receipt);
    const result = await executeAirCommand({ call }, actor, {
      action: "export",
      caseId,
      expectedRevision: 0,
      requestKey: "original-export",
    });
    expect(airStoredSchema.parse(result).report!.analysis).toEqual(receipt.report.analysis);
    expect(analyze).not.toHaveBeenCalled();
    expect(call).toHaveBeenCalledTimes(1);
    await expect(
      executeAirCommand(
        {
          call: vi.fn().mockResolvedValue({
            ...receipt,
            report: { ...receipt.report, originalCsv: "altered source" },
          }),
        },
        actor,
        { action: "load", caseId },
      ),
    ).rejects.toThrow("AIR_REPORT_INTEGRITY_FAILED");
  });
  it("rejects corrupt completion or outcome records instead of exporting them", async () => {
    const stored = await fixture();
    stored.snapshot.actions.push({
      id: crypto.randomUUID(),
      owner: "Invented action owner",
      description: "Invented task completed without authorization",
      proposedBy: actor,
      status: "completed",
    });
    await expect(
      executeAirCommand({ call: vi.fn().mockResolvedValue(stored) }, actor, {
        action: "load",
        caseId,
      }),
    ).rejects.toThrow("AIR_WORKFLOW_INTEGRITY_FAILED");
  });
  it("bounds the connected quadratic comparison workload before storing an import", async () => {
    const large = [
      csv.split("\n")[0],
      ...Array.from(
        { length: 1001 },
        (_, i) =>
          `${new Date(Date.UTC(2026, 0, 1, i)).toISOString()},${new Date(Date.UTC(2026, 0, 1, i + 1)).toISOString()},baseline,synthetic,7,10,60,2`,
      ),
    ].join("\n");
    const call = vi
      .fn()
      .mockResolvedValueOnce({ found: false })
      .mockResolvedValueOnce({
        ...(await fixture()),
        snapshot: null,
        revision: 0,
        headRevision: 0,
        role: "manager",
      })
      .mockResolvedValueOnce({
        organizationId: "1",
        siteId: "2",
        assets: [{ id: 3, name: "Synthetic asset" }],
      });
    await expect(
      executeAirCommand({ call }, actor, {
        action: "import",
        caseId,
        expectedRevision: 0,
        requestKey: "bounded",
        assetId: 3,
        sourceName: "synthetic.csv",
        csv: large,
      }),
    ).rejects.toThrow("AIR_INVALID_CSV");
    expect(call).toHaveBeenCalledTimes(3);
  });
});
