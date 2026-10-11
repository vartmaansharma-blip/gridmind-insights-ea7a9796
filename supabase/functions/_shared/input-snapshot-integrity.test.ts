import { assertEquals } from "jsr:@std/assert";
import { inputSnapshotDigestMatches } from "./input-snapshot-integrity.ts";

const validDigest = `sha256:${"a".repeat(64)}`;
const otherDigest = `sha256:${"b".repeat(64)}`;

Deno.test("legacy NULL input snapshot digest is never integrity-verified", () => {
  assertEquals(inputSnapshotDigestMatches(null, validDigest), false);
  assertEquals(inputSnapshotDigestMatches(undefined, validDigest), false);
});

Deno.test("malformed input snapshot digests fail closed", () => {
  assertEquals(inputSnapshotDigestMatches("fnv1a32:12345678", validDigest), false);
  assertEquals(inputSnapshotDigestMatches("sha256:abc", validDigest), false);
  assertEquals(inputSnapshotDigestMatches(`sha256:${"A".repeat(64)}`, validDigest), false);
  assertEquals(inputSnapshotDigestMatches(validDigest, "not-a-sha256-digest"), false);
});

Deno.test("mismatched input snapshot digest is not integrity-verified", () => {
  assertEquals(inputSnapshotDigestMatches(otherDigest, validDigest), false);
});

Deno.test("exact well-formed input snapshot digest matches", () => {
  assertEquals(inputSnapshotDigestMatches(validDigest, validDigest), true);
});
