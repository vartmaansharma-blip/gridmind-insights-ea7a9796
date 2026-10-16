import { afterEach, describe, expect, it, vi } from "vitest";
import { sendCommand, type TransportOptions } from "./command-transport";
import { commandAndRefresh } from "./command-receipt";

const ok = () => Response.json({ id: "saved-receipt" });
function setup(overrides: Partial<TransportOptions> = {}) {
  const session = vi.fn(async () => ({ userId: "actor-a", token: "token-a" }));
  const fetcher = vi.fn<typeof fetch>();
  const sleep = vi.fn(async (_ms: number) => {});
  return {
    session,
    fetcher,
    sleep,
    options: { session, fetcher, sleep, random: () => 0, retrySafe: true, ...overrides },
  };
}
afterEach(() => vi.useRealTimers());
describe("receipt-safe command transport", () => {
  it("recovers a lost response with identical bytes and fresh same-account credentials", async () => {
    const command = { action: "message", id: "original-request", text: "Original text" };
    const s = setup();
    s.fetcher.mockRejectedValueOnce(new TypeError("Lost after commit")).mockResolvedValueOnce(ok());
    s.session
      .mockResolvedValueOnce({ userId: "actor-a", token: "first-token" })
      .mockResolvedValueOnce({ userId: "actor-a", token: "refreshed-token" });
    s.sleep.mockImplementation(async () => {
      command.id = "changed";
      command.text = "Changed locally";
    });
    expect(await sendCommand("/api/portal", command, s.options)).toEqual({ id: "saved-receipt" });
    const calls = s.fetcher.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][1]?.body).toBe(calls[1][1]?.body);
    expect(JSON.parse(String(calls[1][1]?.body)).id).toBe("original-request");
    expect(new Headers(calls[1][1]?.headers).get("Authorization")).toBe("Bearer refreshed-token");
  });
  it.each([400, 401, 403, 409, 500])(
    "does not mask permanent HTTP %s failures with retries",
    async (status) => {
      const s = setup();
      s.fetcher.mockResolvedValue(Response.json({ error: "PERMANENT_FAILURE" }, { status }));
      await expect(sendCommand("/api/portal", {}, s.options)).rejects.toMatchObject({
        code: "PERMANENT_FAILURE",
        status,
      });
      expect(s.fetcher).toHaveBeenCalledTimes(1);
      expect(s.sleep).not.toHaveBeenCalled();
    },
  );
  it.each(["CONNECTED_CASES_DISABLED", "CONNECTED_CASES_NOT_CONFIGURED", "INTAKE_NOT_CONFIGURED"])(
    "does not retry unavailable configuration %s",
    async (error) => {
      const s = setup();
      s.fetcher.mockResolvedValue(Response.json({ error }, { status: 503 }));
      await expect(sendCommand("/api/portal", {}, s.options)).rejects.toMatchObject({
        code: error,
      });
      expect(s.fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it("handles an HTML gateway failure and respects Retry-After without exposing its content", async () => {
    const s = setup();
    s.fetcher
      .mockResolvedValueOnce(new Response("<html>gateway failure</html>", { status: 502 }))
      .mockResolvedValueOnce(Response.json({}, { status: 429, headers: { "Retry-After": "2" } }))
      .mockResolvedValueOnce(ok());
    await sendCommand("/api/portal", {}, s.options);
    expect(s.sleep.mock.calls.map((c) => c[0])).toEqual([250, 2000]);
  });
  it("stops rather than retrying before a long server-requested wait", async () => {
    const s = setup();
    s.fetcher.mockResolvedValue(
      Response.json({}, { status: 429, headers: { "Retry-After": "60" } }),
    );
    await expect(sendCommand("/api/portal", {}, s.options)).rejects.toMatchObject({
      code: "RETRY_LATER",
    });
    expect(s.fetcher).toHaveBeenCalledTimes(1);
    expect(s.sleep).not.toHaveBeenCalled();
  });
  it("bounds network retries to three attempts", async () => {
    const s = setup();
    s.fetcher.mockRejectedValue(new TypeError("offline"));
    await expect(sendCommand("/api/portal", {}, s.options)).rejects.toMatchObject({
      code: "CONNECTION_INTERRUPTED",
    });
    expect(s.fetcher).toHaveBeenCalledTimes(3);
    expect(s.sleep.mock.calls.map((c) => c[0])).toEqual([250, 500]);
  });
  it("never replays a write lacking receipt guarantees", async () => {
    const s = setup({ retrySafe: false });
    s.fetcher.mockRejectedValue(new TypeError("lost response"));
    await expect(sendCommand("/api/portal", { action: "grant" }, s.options)).rejects.toMatchObject({
      code: "CONNECTION_INTERRUPTED",
    });
    expect(s.fetcher).toHaveBeenCalledTimes(1);
  });
  it("stops before sending a retry as another account", async () => {
    const s = setup();
    s.fetcher.mockRejectedValue(new TypeError("lost response"));
    s.session
      .mockResolvedValueOnce({ userId: "actor-a", token: "token-a" })
      .mockResolvedValueOnce({ userId: "actor-b", token: "token-b" });
    await expect(sendCommand("/api/portal", {}, s.options)).rejects.toMatchObject({
      code: "ACCOUNT_CHANGED",
    });
    expect(s.fetcher).toHaveBeenCalledTimes(1);
  });
  it("times out hung requests and clears all timers after bounded recovery", async () => {
    vi.useFakeTimers();
    const s = setup({ timeoutMs: 100 });
    s.fetcher.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Timed out", "AbortError")),
            { once: true },
          );
        }),
    );
    const result = sendCommand("/api/portal", {}, s.options).catch((e) => e);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await result).toMatchObject({ code: "CONNECTION_INTERRUPTED" });
    expect(s.fetcher).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels during backoff without sending another request", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const s = setup({ signal: controller.signal, sleep: undefined });
    s.fetcher.mockRejectedValue(new TypeError("offline"));
    const result = sendCommand("/api/portal", {}, s.options).catch((e) => e);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    expect(await result).toMatchObject({ code: "REQUEST_CANCELLED" });
    expect(s.fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects malformed successful responses without claiming a receipt", async () => {
    const s = setup();
    s.fetcher.mockResolvedValue(new Response("<html>sign in</html>"));
    await expect(sendCommand("/api/portal", {}, s.options)).rejects.toMatchObject({
      code: "INVALID_API_RESPONSE",
    });
    expect(s.fetcher).toHaveBeenCalledTimes(1);
  });
});
describe("acknowledged writes", () => {
  it("keeps a confirmed write acknowledged when the subsequent refresh fails", async () => {
    const send = vi.fn(async () => ({ id: "receipt" }));
    const acknowledge = vi.fn();
    const refresh = vi.fn(async () => {
      expect(acknowledge).toHaveBeenCalledTimes(1);
      throw new Error("read unavailable");
    });
    expect(await commandAndRefresh(send, refresh, acknowledge)).toEqual({
      result: { id: "receipt" },
      refreshFailed: true,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("does not acknowledge or refresh an ambiguous failed write", async () => {
    const refresh = vi.fn(),
      acknowledge = vi.fn();
    await expect(
      commandAndRefresh(
        async () => {
          throw new Error("unknown write status");
        },
        refresh,
        acknowledge,
      ),
    ).rejects.toThrow("unknown write status");
    expect(refresh).not.toHaveBeenCalled();
    expect(acknowledge).not.toHaveBeenCalled();
  });
});
