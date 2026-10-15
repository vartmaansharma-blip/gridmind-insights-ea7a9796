import { describe, expect, it } from "vitest";
import { buildAnalysisInputFromCanonical } from "./analysis-input-adapter";
import { analyzeFactoryLoop, reproducibilityFingerprint } from "./analysis-loop";
import {
  inputSnapshotSha256,
  verifyStoredAnalysis,
  type StoredAnalysisEvidence,
} from "../../../supabase/functions/_shared/analysis-verification";

async function fixture(): Promise<StoredAnalysisEvidence> {
  const input = buildAnalysisInputFromCanonical({
    factoryId: 1,
    assetId: 7,
    observations: [],
    operatingContexts: [],
    economicContext: null,
    asOf: "2026-10-15T00:00:00Z",
  });
  const result = analyzeFactoryLoop(input);
  return {
    factory_id: 1,
    asset_id: 7,
    algorithm_version: result.algorithmVersion,
    input_snapshot: input,
    input_snapshot_sha256: await inputSnapshotSha256(input),
    result,
    result_fingerprint: reproducibilityFingerprint(result),
    analysis_status: result.status,
    refusal_codes: result.reasonCodes,
  };
}

describe("authoritative stored analysis verification", () => {
  it("verifies a complete server snapshot even when analysis refuses insufficient evidence", async () => {
    const stored = await fixture();
    expect(await verifyStoredAnalysis(stored, 1)).toMatchObject({
      inputSnapshotIntegrity: true,
      reproducible: true,
    });
  });
  it.each([null, "", `sha256:${"0".repeat(64)}`])(
    "does not call a missing or mismatched digest reproducible (%s)",
    async (digest) => {
      const stored = await fixture();
      stored.input_snapshot_sha256 = digest;
      expect(await verifyStoredAnalysis(stored, 1)).toMatchObject({
        inputSnapshotIntegrity: false,
        reproducible: false,
      });
    },
  );
  it("detects changed input even if the resulting refusal is unchanged", async () => {
    const stored = await fixture();
    stored.input_snapshot.asOf = "2026-10-16T00:00:00Z";
    expect(await verifyStoredAnalysis(stored, 1)).toMatchObject({
      inputSnapshotIntegrity: false,
      reproducible: false,
    });
  });
  it.each([
    "factory_id",
    "asset_id",
    "algorithm_version",
    "analysis_status",
    "refusal_codes",
    "result_fingerprint",
    "result",
  ] as const)("detects changed %s independently of the input digest", async (field) => {
    const stored = await fixture();
    const changed = {
      ...stored,
      [field]:
        field === "factory_id" || field === "asset_id"
          ? 999
          : field === "refusal_codes"
            ? []
            : field === "result"
              ? { ...stored.result, reasonCodes: [] }
              : "tampered",
    } as StoredAnalysisEvidence;
    expect(await verifyStoredAnalysis(changed, 1)).toMatchObject({
      inputSnapshotIntegrity: true,
      reproducible: false,
    });
  });
  it("rejects a different requested factory", async () => {
    expect((await verifyStoredAnalysis(await fixture(), 2)).reproducible).toBe(false);
  });
  it("canonicalizes key order before hashing", async () => {
    const stored = await fixture();
    const reordered = Object.fromEntries(Object.entries(stored.input_snapshot).reverse());
    expect(await inputSnapshotSha256(reordered as typeof stored.input_snapshot)).toBe(
      stored.input_snapshot_sha256,
    );
  });
});
