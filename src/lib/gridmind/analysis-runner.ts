import { buildAnalysisInputFromCanonical } from "./analysis-input-adapter";
import {
  getCanonicalAnalysisEconomicContext,
  getCanonicalMachineSnapshots,
  getCanonicalOperatingContexts,
} from "./repository";
import {
  persistFactoryAnalysisRun,
  reloadAndVerifyFactoryAnalysisRun,
  type StoredAnalysisRun,
} from "./analysis-run-store";
import type { AnalysisInput } from "./analysis-loop";

export type CanonicalFactoryAnalysisRun = {
  input: AnalysisInput;
  run: StoredAnalysisRun;
  verification: Awaited<ReturnType<typeof reloadAndVerifyFactoryAnalysisRun>>;
};

/**
 * End-to-end application service: canonical observations -> explicit context mapping
 * -> server-side calculation/persistence -> server-side reload/recalculation.
 */
export async function runCanonicalFactoryAnalysis(
  factoryId: number,
  assetId: number,
  idempotencyKey: string,
  asOf = new Date().toISOString(),
): Promise<CanonicalFactoryAnalysisRun> {
  if (!Number.isSafeInteger(factoryId) || factoryId <= 0) throw new Error("A valid positive factory ID is required.");
  if (!Number.isSafeInteger(assetId) || assetId <= 0) throw new Error("A valid positive asset ID is required.");
  if (!idempotencyKey.trim() || idempotencyKey.trim().length > 200) {
    throw new Error("A non-empty idempotency key of at most 200 characters is required.");
  }

  const [assets, operatingContexts, economicContext] = await Promise.all([
    getCanonicalMachineSnapshots(factoryId),
    getCanonicalOperatingContexts(factoryId, assetId),
    getCanonicalAnalysisEconomicContext(factoryId, asOf),
  ]);
  const asset = assets.find((candidate) => candidate.id === assetId);
  if (!asset) throw new Error("The asset is not available in this factory or the caller lacks access.");

  const input = buildAnalysisInputFromCanonical({
    factoryId,
    assetId,
    observations: asset.observations,
    operatingContexts,
    economicContext,
    asOf,
  });
  const run = await persistFactoryAnalysisRun(input, idempotencyKey);
  const verification = await reloadAndVerifyFactoryAnalysisRun(factoryId, idempotencyKey.trim());
  return { input, run, verification };
}
