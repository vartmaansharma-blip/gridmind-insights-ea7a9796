import { supabase } from "@/integrations/supabase/client";
import type { AnalysisInput, AnalysisResult } from "./analysis-loop";

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

type JsonRecord = Record<string, unknown>;
type PersistResponse = { run: StoredAnalysisRun };
type VerifyResponse = {
  stored: StoredAnalysisRun;
  recomputed: AnalysisResult;
  reproducible: boolean;
  recomputedFingerprint: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Preserve invalid numeric states as strings rather than letting JSON turn NaN/Infinity into null. */
function jsonSafeSnapshot(value: unknown, ancestors = new WeakSet<object>()): unknown {
  if (value === undefined) return undefined;
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") return String(value);
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) throw new Error("Analysis input must not contain circular references.");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => {
        const snapshot = jsonSafeSnapshot(item, ancestors);
        return snapshot === undefined ? null : snapshot;
      });
    }
    const snapshot: JsonRecord = {};
    for (const [key, item] of Object.entries(value)) {
      const normalized = jsonSafeSnapshot(item, ancestors);
      if (normalized !== undefined) snapshot[key] = normalized;
    }
    return snapshot;
  } finally {
    ancestors.delete(value);
  }
}

function snapshotAnalysisInput(input: AnalysisInput): AnalysisInput {
  const snapshot: unknown = jsonSafeSnapshot(input);
  if (
    !isRecord(snapshot) ||
    !isRecord(snapshot.current) ||
    !Array.isArray(snapshot.baselineSamples) ||
    !snapshot.baselineSamples.every(isRecord) ||
    !isRecord(snapshot.economics)
  ) {
    throw new Error("A factory analysis input must include current evidence, a baseline sample array, and economic inputs.");
  }
  if (!Number.isSafeInteger(snapshot.factoryId) || Number(snapshot.factoryId) <= 0) {
    throw new Error("A valid positive factory ID is required.");
  }
  return snapshot as unknown as AnalysisInput;
}

/** The Edge Function is the only application write path; it recalculates before persisting. */
export async function persistFactoryAnalysisRun(input: AnalysisInput, idempotencyKey: string): Promise<StoredAnalysisRun> {
  const key = idempotencyKey.trim();
  if (!key || key.length > 200) throw new Error("A non-empty idempotency key of at most 200 characters is required.");
  const inputSnapshot = snapshotAnalysisInput(input);
  const { data, error } = await supabase.functions.invoke<PersistResponse>("persist-factory-analysis", {
    body: { action: "persist", input: inputSnapshot, idempotencyKey: key },
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
