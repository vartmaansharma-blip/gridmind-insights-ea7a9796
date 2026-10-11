import { inputSnapshotDigestMatches } from "./input-snapshot-integrity.ts";

const validDigest = `sha256:${"a".repeat(64)}`;
const otherDigest = `sha256:${"b".repeat(64)}`;

function assertEqual(actual: boolean, expected: boolean, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

Deno.test("legacy NULL input snapshot digest is never integrity-verified", () => {
  assertEqual(inputSnapshotDigestMatches(null, validDigest), false, "NULL digest");
  assertEqual(inputSnapshotDigestMatches(undefined, validDigest), false, "undefined digest");
});

Deno.test("malformed input snapshot digests fail closed", () => {
  assertEqual(inputSnapshotDigestMatches("fnv1a32:12345678", validDigest), false, "wrong algorithm");
  assertEqual(inputSnapshotDigestMatches("sha256:abc", validDigest), false, "short digest");
  assertEqual(inputSnapshotDigestMatches(`sha256:${"A".repeat(64)}`, validDigest), false, "uppercase digest");
  assertEqual(inputSnapshotDigestMatches(validDigest, "not-a-sha256-digest"), false, "invalid recomputed digest");
});

Deno.test("mismatched input snapshot digest is not integrity-verified", () => {
  assertEqual(inputSnapshotDigestMatches(otherDigest, validDigest), false, "mismatched digest");
});

Deno.test("exact well-formed input snapshot digest matches", () => {
  assertEqual(inputSnapshotDigestMatches(validDigest, validDigest), true, "matching digest");
});
