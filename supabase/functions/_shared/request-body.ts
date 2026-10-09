export type BoundedJsonBodyResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      reason: "too_large" | "invalid_content_length" | "invalid_json" | "unreadable_body";
    };

/**
 * Parse a JSON request body without trusting Content-Length as the only size guard.
 * The streamed byte count is authoritative, including when the header is absent.
 */
export async function readBoundedJsonBody(
  request: Request,
  maxBytes: number,
): Promise<BoundedJsonBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer.");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const normalizedLength = contentLength.trim();
    if (!/^\d+$/.test(normalizedLength)) {
      return { ok: false, reason: "invalid_content_length" };
    }
    const declaredBytes = Number(normalizedLength);
    if (!Number.isSafeInteger(declaredBytes)) {
      return { ok: false, reason: "invalid_content_length" };
    }
    if (declaredBytes > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
  }

  if (!request.body) return { ok: false, reason: "invalid_json" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size limit is already decisive; cancellation is best-effort.
        }
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "unreadable_body" };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Releasing a locked or cancelled stream is best-effort after a read failure.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
