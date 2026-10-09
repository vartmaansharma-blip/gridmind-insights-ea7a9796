import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisInput } from "./analysis-loop";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

import { persistFactoryAnalysisRun, reloadAndVerifyFactoryAnalysisRun } from "./analysis-run-store";

const validShape = (): AnalysisInput => ({
  factoryId: 1,
  current: {
    id: "current",
    factoryId: 1,
    assetId: "compressor-1",
    energyValue: 0,
    energyUnit: "kWh",
    productionValue: 100,
    productionUnit: "units",
    operatingHours: 10,
    operatingState: "loaded",
    productCode: "product-A",
    periodStart: "2026-10-08T00:00:00.000Z",
    periodEnd: "2026-10-09T00:00:00.000Z",
    quality: "valid",
    origin: "observed",
  },
  baselineSamples: [],
  economics: {
    currency: "INR",
    tariffInrPerKwh: null,
    recoverableFraction: 0.6,
    interventionCostInr: 1000,
  },
  asOf: "2026-10-09T12:00:00.000Z",
});

describe("analysis run client adapter", () => {
  beforeEach(() => invoke.mockReset());

  it("uses the server function and preserves zero while representing non-finite values as invalid", async () => {
    const input = validShape();
    input.current.energyValue = Number.NaN;
    input.current.productionValue = 0;
    invoke.mockResolvedValue({ data: { run: { id: 42 } }, error: null });

    await persistFactoryAnalysisRun(input, "  run-key  ");

    expect(invoke).toHaveBeenCalledOnce();
    const [functionName, request] = invoke.mock.calls[0];
    expect(functionName).toBe("persist-factory-analysis");
    expect(request.body.action).toBe("persist");
    expect(request.body.idempotencyKey).toBe("run-key");
    expect(request.body.input.current.energyValue).toBe("NaN");
    expect(request.body.input.current.productionValue).toBe(0);
  });

  it("rejects malformed object graphs before making a network request", async () => {
    const input = validShape();
    (input.current as unknown as Record<string, unknown>).circular = input.current;

    await expect(persistFactoryAnalysisRun(input, "run-key")).rejects.toThrow("circular references");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("refuses invalid factory identifiers before invoking the server", async () => {
    const input = validShape();
    input.factoryId = 0;

    await expect(persistFactoryAnalysisRun(input, "run-key")).rejects.toThrow("positive factory ID");
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
