import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisInput } from "./analysis-loop";
import type { StoredAnalysisRun } from "./analysis-run-store";

const mocks = vi.hoisted(() => ({
  persistFactoryAnalysisRun: vi.fn(),
  reloadAndVerifyFactoryAnalysisRun: vi.fn(),
}));
vi.mock("./analysis-run-store", () => ({
  persistFactoryAnalysisRun: mocks.persistFactoryAnalysisRun,
  reloadAndVerifyFactoryAnalysisRun: mocks.reloadAndVerifyFactoryAnalysisRun,
}));

import { runCanonicalFactoryAnalysis } from "./analysis-runner";

const serverInput: AnalysisInput = {
  factoryId: 3,
  current: {
    id: "asset-7:no-observations",
    factoryId: 3,
    assetId: "7",
    energyValue: null,
    energyUnit: null,
    productionValue: null,
    productionUnit: null,
    operatingHours: null,
    operatingState: "",
    productCode: "",
    periodStart: "",
    periodEnd: "",
    quality: "missing",
    origin: "synthetic",
    sourceObservationIds: [],
    mappingIssues: [],
  },
  baselineSamples: [],
  economics: {
    currency: "INR",
    tariffInrPerKwh: null,
    recoverableFraction: null,
    interventionCostInr: null,
  },
  asOf: "2026-10-09T12:00:00.000Z",
};
const stored = { id: 42, input_snapshot: serverInput } as unknown as StoredAnalysisRun;
const verification = {
  stored,
  recomputed: { status: "insufficient_evidence" },
  reproducible: true,
  recomputedFingerprint: "fnv1a32:12345678",
};

describe("canonical factory analysis runner", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.persistFactoryAnalysisRun.mockResolvedValue(stored);
    mocks.reloadAndVerifyFactoryAnalysisRun.mockResolvedValue(verification);
  });

  it("sends only canonical identifiers and returns the server-assembled evidence snapshot", async () => {
    const asOf = "2026-10-09T12:00:00.000Z";
    const result = await runCanonicalFactoryAnalysis(3, 7, "run-key", asOf);

    expect(mocks.persistFactoryAnalysisRun).toHaveBeenCalledWith(
      { factoryId: 3, assetId: 7, asOf },
      "run-key",
    );
    expect(result.input).toBe(serverInput);
    expect(result.input.current.origin).toBe("synthetic");
    expect(result.input.current.energyValue).toBeNull();
    expect(mocks.reloadAndVerifyFactoryAnalysisRun).toHaveBeenCalledWith(3, "run-key");
    expect(result.verification.reproducible).toBe(true);
  });

  it("rejects invalid entity identifiers before invoking persistence", async () => {
    await expect(runCanonicalFactoryAnalysis(3, 0, "run-key", "2026-10-09T12:00:00.000Z"))
      .rejects.toThrow("positive asset ID");
    expect(mocks.persistFactoryAnalysisRun).not.toHaveBeenCalled();
  });
});
