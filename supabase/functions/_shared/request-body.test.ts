import { describe, expect, it } from "vitest";
import { readBoundedJsonBody } from "./request-body";

const request = (body: string, headers?: Record<string, string>) =>
  new Request("https://gridmind.test/analysis", {
    method: "POST",
    headers,
    body,
  });

describe("bounded JSON request parsing", () => {
  it("parses a valid JSON body when Content-Length is absent", async () => {
    const input = request('{"action":"verify"}');
    expect(input.headers.has("content-length")).toBe(false);
    await expect(readBoundedJsonBody(input, 100)).resolves.toEqual({
      ok: true,
      value: { action: "verify" },
    });
  });

  it("rejects a declared body larger than the limit before reading it", async () => {
    const input = request('{"a":1}', { "content-length": "101" });
    await expect(readBoundedJsonBody(input, 100)).resolves.toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("enforces the byte limit from the actual stream when the header is absent", async () => {
    const input = request(JSON.stringify({ payload: "x".repeat(64) }));
    expect(input.headers.has("content-length")).toBe(false);
    await expect(readBoundedJsonBody(input, 32)).resolves.toEqual({
      ok: false,
      reason: "too_large",
    });
  });

  it("accepts a body exactly at the byte limit", async () => {
    const body = '{"a":1}';
    await expect(readBoundedJsonBody(request(body), new TextEncoder().encode(body).byteLength)).resolves.toEqual({
      ok: true,
      value: { a: 1 },
    });
  });

  it("rejects malformed Content-Length instead of trusting it", async () => {
    const input = request('{"a":1}', { "content-length": "-1" });
    await expect(readBoundedJsonBody(input, 100)).resolves.toEqual({
      ok: false,
      reason: "invalid_content_length",
    });
  });

  it("rejects malformed JSON", async () => {
    await expect(readBoundedJsonBody(request("{invalid"), 100)).resolves.toEqual({
      ok: false,
      reason: "invalid_json",
    });
  });

  it("rejects an invalid configured byte limit", async () => {
    await expect(readBoundedJsonBody(request("{}"), 0)).rejects.toThrow(
      "maxBytes must be a positive safe integer.",
    );
  });
});
