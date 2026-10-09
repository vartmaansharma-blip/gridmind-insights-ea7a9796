import { supabase } from "@/integrations/supabase/client";
import type { AnalysisInput, AnalysisResult } from "./analysis-loop";

export type FactoryAnalysisRequest = {
  factoryId: number;
  assetId: number;
  asOf: string;
};

export type StoredAnalysisRun = {
  id: number;
  factory_id: number;
  idempotency_key: string;
  algorithm_version: string;
  input_snapshot: AnalysisInput;
  result: AnalysisResult;
  result_fingerprint: string;
  analysis_status: AnalysisResult["status"];
  refusal_codes: string[];
  created_by: string | null;
  created_at: string;
};

type PersistResponse = { run: StoredAnalysisRun };
type VerifyResponse = {
  stored: StoredAnalysisRun;
  recomputed: AnalysisResult;
  reproducible: boolean;
  recomputedFingerprint: string;
};

/**
 * The browser sends only canonical entity identifiers and an as-of timestamp.
 * The Edge Function loads observations/contexts itself; client-supplied measurements
 * are never accepted as authoritative input.
 */
export async function persistFactoryAnalysisRun(
  request: FactoryAnalysisRequest,
  idempotencyKey: string,
): Promise<StoredAnalysisRun> {
  const key = idempotencyKey.trim();
  if (!Number.isSafeInteger(request.factoryId) || request.factoryId <= 0) {
    throw new Error("A valid positive factory ID is required.");
  }
  if (!Number.isSafeInteger(request.assetId) || request.assetId <= 0) {
    throw new Error("A valid positive asset ID is required.");
  }
  if (typeof request.asOf !== "string" || !Number.isFinite(Date.parse(request.asOf))) {
    throw new Error("A valid analysis timestamp is required.");
  }
  if (!key || key.length > 200) {
    throw new Error("A non-empty idempotency key of at most 200 characters is required.");
  }

  const { data, error } = await supabase.functions.invoke<PersistResponse>("persist-factory-analysis", {
    body: {
      action: "persist",
      factoryId: request.factoryId,
      assetId: request.assetId,
      asOf: request.asOf,
      idempotencyKey: key,
    },
  });
  if (error) throw new Error(`GridMind analysis run persist failed: ${error.message}`);
  if (!data?.run) throw new Error("GridMind analysis run persist returned no row.");
  return data.run;
}

/** Reload and recompute on the server, comparing the result and its persisted summary fields. */
export async function reloadAndVerifyFactoryAnalysisRun(factoryId: number, idempotencyKey: string): Promise<VerifyResponse> {
  const key = idempotencyKey.trim();
  if (!Number.isSafeInteger(factoryId) || factoryId <= 0) throw new Error("A valid positive factory ID is required.");
  if (!key || key.length > 200) throw new Error("A non-empty idempotency key of at most 200 characters is required.");

  const { data, error } = await supabase.functions.invoke<VerifyResponse>("persist-factory-analysis", {
    body: { action: "verify", factoryId, idempotencyKey: key },
  });
  if (error) throw new Error(`GridMind analysis run reload failed: ${error.message}`);
  if (!data?.stored || !data.recomputed) throw new Error("GridMind analysis run reload returned incomplete verification data.");
  return data;
}
