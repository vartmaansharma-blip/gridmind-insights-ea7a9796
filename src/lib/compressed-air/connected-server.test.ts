import { afterEach, describe, expect, it, vi } from "vitest";
const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser }, rpc }) }));
import { handleConnectedAir } from "./connected.server";
const actor = "11111111-1111-4111-8111-111111111111";
const caseId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function setup() {
  vi.stubEnv("GRIDMIND_COMPRESSED_AIR_ENABLED", "isolated-synthetic-only");
  vi.stubEnv("GRIDMIND_CONNECTED_CASES_ENABLED", "synthetic-only");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "synthetic-public-key");
  vi.stubEnv("GRIDMIND_CASES_SERVICE_ROLE_KEY", "synthetic-server-key");
  getUser.mockResolvedValue({ data: { user: { id: actor, is_anonymous: false } }, error: null });
  rpc.mockResolvedValue({ data: { organizationId: "1", siteId: "2", assets: [] }, error: null });
}
const req = (body: unknown = { action: "scope", caseId }, extra: Record<string, string> = {}) =>
  new Request("http://localhost/api/investigations?method=compressed-air", {
    method: "POST",
    headers: {
      Authorization: "Bearer synthetic-test",
      "Content-Type": "application/json",
      ...extra,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("isolated compressed-air API boundary", () => {
  it("is disabled by default and forbids every hosted backend even with feature flags", async () => {
    expect((await handleConnectedAir(req())).status).toBe(503);
    setup();
    for (const url of [
      "https://project.supabase.co",
      "http://127.0.0.1.attacker.example",
      "https://localhost",
      "http://user:password@host.example",
    ]) {
      vi.stubEnv("SUPABASE_URL", url);
      expect((await handleConnectedAir(req())).status).toBe(503);
    }
    expect(getUser).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses verified Auth actor for the dedicated RPC and prevents cache exposure", async () => {
    setup();
    const response = await handleConnectedAir(req());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(rpc).toHaveBeenCalledWith("compressed_air_store", {
      _actor: actor,
      _case: caseId,
      _op: "scope",
    });
    expect(
      (await handleConnectedAir(req({ action: "scope", caseId, actorId: actor }))).status,
    ).toBe(400);
  });
  it("denies anonymous/invalid tokens, cross-origin and oversized requests", async () => {
    setup();
    getUser.mockResolvedValueOnce({
      data: { user: { id: actor, is_anonymous: true } },
      error: null,
    });
    expect((await handleConnectedAir(req())).status).toBe(401);
    expect((await handleConnectedAir(req({}, { Origin: "https://foreign.example" }))).status).toBe(
      403,
    );
    expect((await handleConnectedAir(req("broken"))).status).toBe(400);
    expect((await handleConnectedAir(req("x".repeat(4_000_001)))).status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });
});
