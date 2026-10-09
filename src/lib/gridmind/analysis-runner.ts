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
 * Sends canonical entity identifiers only. The Edge Function owns the authoritative
 * observation/context reads, input assembly, calculation, and persistence.
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

  const key = idempotencyKey.trim();
  const run = await persistFactoryAnalysisRun({ factoryId, assetId, asOf }, key);
  const verification = await reloadAndVerifyFactoryAnalysisRun(factoryId, key);
  return { input: run.input_snapshot, run, verification };
}
