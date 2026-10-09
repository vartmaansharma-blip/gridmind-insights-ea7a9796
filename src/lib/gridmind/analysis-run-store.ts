import { supabase } from "@/integrations/supabase/client";
import {
  analyzeFactoryLoop,
  canonicalize,
  reproducibilityFingerprint,
  type AnalysisInput,
  type AnalysisResult,
} from "./analysis-loop";

type StoredAnalysisRun = {
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
  updated_at: string;
};
type TableResult<T> = { data: T | null; error: { message: string; code?: string } | null };
type AnalysisRunTable = {
  insert(values: Record<string, unknown>): {
    select(columns: string): { single(): Promise<TableResult<StoredAnalysisRun>> };
  };
  select(columns: string): {
    eq(column: string, value: string | number): {
      eq(column: string, value: string | number): {
        single(): Promise<TableResult<StoredAnalysisRun>>;
      };
    };
  };
};
const analysisRunTable = () =>
  (supabase as unknown as { from(table: "factory_analysis_runs"): AnalysisRunTable }).from("factory_analysis_runs");
const columns = "id,factory_id,idempotency_key,algorithm_version,input_snapshot,result,result_fingerprint,analysis_status,refusal_codes,created_by,created_at,updated_at";

function unwrap<T>(result: TableResult<T>, operation: string): T {
  if (result.error) throw new Error(`GridMind analysis run ${operation} failed: ${result.error.message}`);
  if (!result.data) throw new Error(`GridMind analysis run ${operation} returned no row`);
  return result.data;
}
function assertSameEvidence(stored: StoredAnalysisRun, input: AnalysisInput, result: AnalysisResult): void {
  if (
    stored.factory_id !== input.factoryId ||
    stored.input_snapshot.factoryId !== input.factoryId ||
    canonicalize(stored.input_snapshot) !== canonicalize(input) ||
    stored.algorithm_version !== result.algorithmVersion ||
    stored.analysis_status !== result.status ||
    canonicalize(stored.refusal_codes) !== canonicalize(result.reasonCodes) ||
    stored.result_fingerprint !== reproducibilityFingerprint(result) ||
    canonicalize(stored.result) !== canonicalize(result)
  ) throw new Error("Idempotency conflict: this key already belongs to different evidence or a different analysis result.");
}

/** Append-only persistence. RLS derives tenant access from the authenticated session. */
export async function persistFactoryAnalysisRun(input: AnalysisInput, idempotencyKey: string): Promise<StoredAnalysisRun> {
  const key = idempotencyKey.trim();
  if (!key || key.length > 200) throw new Error("A non-empty idempotency key of at most 200 characters is required.");
  if (!Number.isSafeInteger(input.factoryId) || input.factoryId <= 0) throw new Error("A valid positive factory ID is required.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Authentication is required to persist a factory analysis run.");

  const result = analyzeFactoryLoop(input);
  const fingerprint = reproducibilityFingerprint(result);
  const table = analysisRunTable();
  const existingResult = await table.select(columns).eq("factory_id", input.factoryId).eq("idempotency_key", key).single();
  if (!existingResult.error && existingResult.data) {
    assertSameEvidence(existingResult.data, input, result);
    return existingResult.data;
  }
  if (existingResult.error && existingResult.error.code !== "PGRST116") {
    throw new Error(`GridMind analysis run lookup failed: ${existingResult.error.message}`);
  }

  const inserted = await table.insert({
    factory_id: input.factoryId,
    idempotency_key: key,
    algorithm_version: result.algorithmVersion,
    input_snapshot: input,
    result,
    result_fingerprint: fingerprint,
    analysis_status: result.status,
    refusal_codes: result.reasonCodes,
    created_by: authData.user.id,
  }).select(columns).single();
  if (inserted.error) {
    // Concurrent retries can race on the unique key. Re-read and accept only
    // if the already-committed record has identical input and result.
    const raced = await table.select(columns).eq("factory_id", input.factoryId).eq("idempotency_key", key).single();
    if (!raced.error && raced.data) {
      assertSameEvidence(raced.data, input, result);
      return raced.data;
    }
    throw new Error(`GridMind analysis run persist failed: ${inserted.error.message}`);
  }
  return unwrap(inserted, "persist");
}

/** Reload the persisted input and independently recompute its canonical result. */
export async function reloadAndVerifyFactoryAnalysisRun(factoryId: number, idempotencyKey: string): Promise<{
  stored: StoredAnalysisRun;
  recomputed: AnalysisResult;
  reproducible: boolean;
  recomputedFingerprint: string;
}> {
  const key = idempotencyKey.trim();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Authentication is required to reload a factory analysis run.");

  const stored = unwrap(
    await analysisRunTable().select(columns).eq("factory_id", factoryId).eq("idempotency_key", key).single(),
    "reload",
  );
  const recomputed = analyzeFactoryLoop(stored.input_snapshot);
  const recomputedFingerprint = reproducibilityFingerprint(recomputed);
  return {
    stored,
    recomputed,
    recomputedFingerprint,
    reproducible:
      stored.factory_id === factoryId &&
      stored.input_snapshot.factoryId === factoryId &&
      stored.algorithm_version === recomputed.algorithmVersion &&
      stored.analysis_status === recomputed.status &&
      canonicalize(stored.refusal_codes) === canonicalize(recomputed.reasonCodes) &&
      stored.result_fingerprint === recomputedFingerprint &&
      canonicalize(stored.result) === canonicalize(recomputed),
  };
}
