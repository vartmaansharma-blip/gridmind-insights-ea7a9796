import { afterEach, describe, expect, it, vi } from "vitest";

const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser }, rpc }) }));
import { handleConnectedInvestigation } from "./connected.server";
const actor = "11111111-1111-4111-8111-111111111111";
const req = (body: unknown = { action: "list" }, extra: Record<string, string> = {}) =>
  new Request("https://gridmind.example/api/investigations", {
    method: "POST",
    headers: { Authorization: "Bearer test-token", "Content-Type": "application/json", ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
function configured() {
  vi.stubEnv("GRIDMIND_CONNECTED_CASES_ENABLED", "synthetic-only");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "synthetic-public-key");
  vi.stubEnv("GRIDMIND_CASES_SERVICE_ROLE_KEY", "synthetic-server-secret");
  getUser.mockResolvedValue({ data: { user: { id: actor, is_anonymous: false } }, error: null });
  rpc.mockResolvedValue({ data: { cases: [] }, error: null });
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("connected case API authentication boundary", () => {
  it("is disabled by default, without authenticating or touching storage", async () => {
    vi.stubEnv("GRIDMIND_CONNECTED_CASES_ENABLED", "disabled");
    expect((await handleConnectedInvestigation(req())).status).toBe(503);
    expect(getUser).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("requires a bearer token and refuses cross-origin requests", async () => {
    configured();
    const noAuth = new Request("https://gridmind.example/api/investigations", {
      method: "POST",
      body: "{}",
    });
    expect((await handleConnectedInvestigation(noAuth)).status).toBe(401);
    expect(
      (await handleConnectedInvestigation(req({}, { Origin: "https://attacker.example" }))).status,
    ).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("checks user identity against Auth rather than trusting an asserted actor", async () => {
    configured();
    const response = await handleConnectedInvestigation(req());
    expect(response.status).toBe(200);
    expect(getUser).toHaveBeenCalledWith("test-token");
    expect(rpc).toHaveBeenCalledWith("investigation_store", {
      _actor: actor,
      _op: "list",
      _factory: null,
    });
    const forged = await handleConnectedInvestigation(req({ action: "list", actorId: "forged" }));
    expect(forged.status).toBe(400);
  });
  it("rejects invalid and anonymous sessions before any storage operation", async () => {
    configured();
    getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "bad" } });
    expect((await handleConnectedInvestigation(req())).status).toBe(401);
    getUser.mockResolvedValueOnce({
      data: { user: { id: actor, is_anonymous: true } },
      error: null,
    });
    expect((await handleConnectedInvestigation(req())).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects malformed, oversized and customer-origin payloads", async () => {
    configured();
    expect((await handleConnectedInvestigation(req("broken"))).status).toBe(400);
    expect((await handleConnectedInvestigation(req("x".repeat(4_000_001)))).status).toBe(413);
    expect(
      (
        await handleConnectedInvestigation(
          req({
            action: "create",
            caseId: crypto.randomUUID(),
            factoryId: 1,
            candidate: "C4",
            requestKey: "k",
            origin: "customer",
          }),
        )
      ).status,
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("propagates permission and revision conflicts, and keeps responses uncached", async () => {
    configured();
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "42501", message: "CASE_ACCESS_DENIED" },
    });
    const denied = await handleConnectedInvestigation(req());
    expect(denied.status).toBe(403);
    expect(denied.headers.get("Cache-Control")).toBe("no-store");
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "40001", message: "STALE_CASE_REVISION" },
    });
    expect((await handleConnectedInvestigation(req())).status).toBe(409);
  });
  it("does not expose database details or the service key", async () => {
    configured();
    rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "XX000", message: "private SQL and synthetic-server-secret" },
    });
    const response = await handleConnectedInvestigation(req());
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('{"error":"CASE_STORAGE_ERROR"}');
  });
  it.each(["08006", "53300", "57P01", "57014", "PGRST002"])(
    "classifies temporary storage %s as recoverable without exposing SQL",
    async (code) => {
      configured();
      rpc.mockResolvedValueOnce({
        data: null,
        error: { code, message: "private SQL and synthetic-server-secret" },
      });
      const response = await handleConnectedInvestigation(req());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "CASE_STORAGE_UNAVAILABLE" });
    },
  );
  it.each(["42501", "40001"])(
    "does not echo unexpected database details in %s errors",
    async (code) => {
      configured();
      rpc.mockResolvedValueOnce({
        data: null,
        error: { code, message: "private SQL and synthetic-server-secret" },
      });
      const response = await handleConnectedInvestigation(req());
      expect(response.status).toBe(code === "42501" ? 403 : 409);
      expect(await response.text()).not.toContain("private");
    },
  );
});
