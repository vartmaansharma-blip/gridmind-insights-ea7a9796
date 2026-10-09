import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanonicalMachineSnapshot } from "./repository";
import type { StoredAnalysisRun } from "./analysis-run-store";

const mocks = vi.hoisted(() => ({
  getCanonicalMachineSnapshots: vi.fn(),
  getCanonicalOperatingContexts: vi.fn(),
  getCanonicalAnalysisEconomicContext: vi.fn(),
  persistFactoryAnalysisRun: vi.fn(),
  reloadAndVerifyFactoryAnalysisRun: vi.fn(),
}));
vi.mock("./repository", () => ({
  getCanonicalMachineSnapshots: mocks.getCanonicalMachineSnapshots,
  getCanonicalOperatingContexts: mocks.getCanonicalOperatingContexts,
  getCanonicalAnalysisEconomicContext: mocks.getCanonicalAnalysisEconomicContext,
}));
vi.mock("./analysis-run-store", () => ({
  persistFactoryAnalysisRun: mocks.persistFactoryAnalysisRun,
  reloadAndVerifyFactoryAnalysisRun: mocks.reloadAndVerifyFactoryAnalysisRun,
}));

import { runCanonicalFactoryAnalysis } from "./analysis-runner";

const stored = { id: 42 } as unknown as StoredAnalysisRun;
const verification = {
  stored,
  recomputed: { status: "insufficient_evidence" },
  reproducible: true,
  recomputedFingerprint: "fnv1a32:12345678",
};

describe("canonical factory analysis runner", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getCanonicalMachineSnapshots.mockResolvedValue([
      { id: 7, observations: [] } as unknown as CanonicalMachineSnapshot,
    ]);
    mocks.getCanonicalOperatingContexts.mockResolvedValue([]);
    mocks.getCanonicalAnalysisEconomicContext.mockResolvedValue(null);
    mocks.persistFactoryAnalysisRun.mockResolvedValue(stored);
    mocks.reloadAndVerifyFactoryAnalysisRun.mockResolvedValue(verification);
  });

  it("assembles canonical evidence, persists it, then reloads and verifies the same run", async () => {
    const result = await runCanonicalFactoryAnalysis(3, 7, "run-key", "2026-10-09T12:00:00.000Z");

    expect(result.input.current.origin).toBe("synthetic");
    expect(result.input.current.energyValue).toBeNull();
    expect(mocks.persistFactoryAnalysisRun).toHaveBeenCalledWith(result.input, "run-key");
    expect(mocks.reloadAndVerifyFactoryAnalysisRun).toHaveBeenCalledWith(3, "run-key");
    expect(result.verification.reproducible).toBe(true);
  });

  it("refuses to persist when the asset is not available in the requested factory", async () => {
    mocks.getCanonicalMachineSnapshots.mockResolvedValue([]);

    await expect(runCanonicalFactoryAnalysis(3, 7, "run-key", "2026-10-09T12:00:00.000Z"))
      .rejects.toThrow("asset is not available");
    expect(mocks.persistFactoryAnalysisRun).not.toHaveBeenCalled();
  });
});
