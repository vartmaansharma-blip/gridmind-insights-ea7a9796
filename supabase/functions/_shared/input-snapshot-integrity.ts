const SHA256_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/**
 * A persisted input snapshot is integrity-verified only when the stored value
 * is a well-formed SHA-256 digest and exactly matches the recomputed digest.
 * NULL/legacy rows and malformed or mismatched values must fail closed.
 */
export function inputSnapshotDigestMatches(storedDigest: unknown, recomputedDigest: string): boolean {
  return typeof storedDigest === "string" &&
    SHA256_DIGEST_PATTERN.test(storedDigest) &&
    SHA256_DIGEST_PATTERN.test(recomputedDigest) &&
    storedDigest === recomputedDigest;
}
