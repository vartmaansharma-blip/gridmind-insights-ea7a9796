import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

import { persistFactoryAnalysisRun, reloadAndVerifyFactoryAnalysisRun } from "./analysis-run-store";

const request = () => ({
  factoryId: 1,
  assetId: 7,
  asOf: "2026-10-09T12:00:00.000Z",
});

describe("analysis run client adapter", () => {
  beforeEach(() => invoke.mockReset());

  it("sends only canonical identifiers and the analysis timestamp, never client measurements", async () => {
    invoke.mockResolvedValue({ data: { run: { id: 42 } }, error: null });

    await persistFactoryAnalysisRun(request(), "  run-key  ");

    expect(invoke).toHaveBeenCalledOnce();
    const [functionName, options] = invoke.mock.calls[0];
    expect(functionName).toBe("persist-factory-analysis");
    expect(options.body).toEqual({
      action: "persist",
      factoryId: 1,
      assetId: 7,
      asOf: "2026-10-09T12:00:00.000Z",
      idempotencyKey: "run-key",
    });
    expect(options.body).not.toHaveProperty("input");
    expect(options.body).not.toHaveProperty("observations");
  });

  it("rejects malformed factory identifiers before making a network request", async () => {
    await expect(persistFactoryAnalysisRun({ ...request(), factoryId: 0 }, "run-key"))
      .rejects.toThrow("positive factory ID");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("rejects malformed asset identifiers before making a network request", async () => {
    await expect(persistFactoryAnalysisRun({ ...request(), assetId: -1 }, "run-key"))
      .rejects.toThrow("positive asset ID");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("rejects invalid analysis timestamps before making a network request", async () => {
    await expect(persistFactoryAnalysisRun({ ...request(), asOf: "not-a-date" }, "run-key"))
      .rejects.toThrow("valid analysis timestamp");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("requests server-side reload and reproducibility verification", async () => {
    const expected = {
      stored: { id: 42 },
      recomputed: { status: "insufficient_evidence" },
      reproducible: true,
      recomputedFingerprint: "fnv1a32:12345678",
    };
    invoke.mockResolvedValue({ data: expected, error: null });

    const result = await reloadAndVerifyFactoryAnalysisRun(1, "  run-key  ");

    expect(invoke).toHaveBeenCalledWith("persist-factory-analysis", {
      body: { action: "verify", factoryId: 1, idempotencyKey: "run-key" },
    });
    expect(result).toEqual(expected);
  });
});
