import {
  analyzeFactoryLoop,
  canonicalize,
  reproducibilityFingerprint,
  type AnalysisInput,
  type AnalysisResult,
} from "./analysis-loop.ts";

export type StoredAnalysisEvidence = {
  factory_id: number;
  asset_id: number;
  algorithm_version: string;
  input_snapshot: AnalysisInput;
  input_snapshot_sha256: string | null;
  result: AnalysisResult;
  result_fingerprint: string;
  analysis_status: AnalysisResult["status"];
  refusal_codes: string[];
};

export async function inputSnapshotSha256(input: AnalysisInput): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(input));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
  return `sha256:${hex}`;
}

function reproducible(
  stored: StoredAnalysisEvidence,
  factoryId: number,
  result: AnalysisResult,
): boolean {
  return (
    stored.factory_id === factoryId &&
    stored.input_snapshot.factoryId === factoryId &&
    stored.input_snapshot.current.assetId === String(stored.asset_id) &&
    stored.algorithm_version === result.algorithmVersion &&
    stored.analysis_status === result.status &&
    canonicalize(stored.refusal_codes) === canonicalize(result.reasonCodes) &&
    stored.result_fingerprint === reproducibilityFingerprint(result) &&
    canonicalize(stored.result) === canonicalize(result)
  );
}

export async function verifyStoredAnalysis(stored: StoredAnalysisEvidence, factoryId: number) {
  const recomputed = analyzeFactoryLoop(stored.input_snapshot);
  const recomputedFingerprint = reproducibilityFingerprint(recomputed);
  const recomputedInputSnapshotFingerprint = await inputSnapshotSha256(stored.input_snapshot);
  const inputSnapshotIntegrity =
    typeof stored.input_snapshot_sha256 === "string" &&
    stored.input_snapshot_sha256 === recomputedInputSnapshotFingerprint;
  return {
    recomputed,
    recomputedFingerprint,
    recomputedInputSnapshotFingerprint,
    inputSnapshotIntegrity,
    reproducible: inputSnapshotIntegrity && reproducible(stored, factoryId, recomputed),
  };
}
