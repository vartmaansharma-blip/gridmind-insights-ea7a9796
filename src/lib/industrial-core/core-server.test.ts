import { it, expect, afterEach, vi } from "vitest";
const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser }, rpc }) }));
import { handleIndustrialCore } from "./core.server";
const actor = "11111111-1111-4111-8111-111111111111",
  session = "22222222-2222-4222-8222-222222222222",
  workspace = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const token = `header.${btoa(JSON.stringify({ session_id: session }))}.signature`;
const req = (body: unknown, extra: Record<string, string> = {}) =>
  new Request("http://localhost/api/industrial-core", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const configure = () => {
  vi.stubEnv("GRIDMIND_CORE_ENABLED", "synthetic-only");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "synthetic-key");
  vi.stubEnv("GRIDMIND_CASES_SERVICE_ROLE_KEY", "synthetic-secret");
  getUser.mockResolvedValue({ data: { user: { id: actor, is_anonymous: false } }, error: null });
  rpc.mockImplementation(async (_rpc: string, args: Record<string, unknown>) =>
    args._op === "context"
      ? {
          data: {
            organizationId: 1,
            factoryId: 1,
            actorId: actor,
            capabilities: ["read"],
            at: "2026-10-20T12:00:00.000Z",
            approverCapabilities: [],
          },
          error: null,
        }
      : {
          data: {
            revision: 0,
            snapshot: null,
            snapshotSha256: null,
            integrityValid: true,
            audit: [],
          },
          error: null,
        },
  );
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("fixed server-backed synthetic demonstrations need no Auth or database", async () => {
  for (const scenario of ["A", "B", "C", "D"]) {
    const r = await handleIndustrialCore(req({ action: "demo", scenario }));
    expect(r.status).toBe(200);
    expect((await r.json()).decision.algorithmVersion).toBe("gm-core-003/constraints-v1");
  }
  expect(getUser).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
it("rejects cross-origin, malformed, oversized and forged actor input", async () => {
  configure();
  expect((await handleIndustrialCore(req({}, { Origin: "https://attacker.test" }))).status).toBe(
    403,
  );
  expect((await handleIndustrialCore(req("bad"))).status).toBe(400);
  expect((await handleIndustrialCore(req("x".repeat(2_000_001)))).status).toBe(413);
  expect(
    (
      await handleIndustrialCore(
        req({ action: "load", factoryId: 1, workspaceId: workspace, actorId: actor }),
      )
    ).status,
  ).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});
it("persistent path is disabled by default and refuses remote databases even with a flag", async () => {
  vi.stubEnv("GRIDMIND_CORE_ENABLED", "");
  expect(
    (await handleIndustrialCore(req({ action: "load", factoryId: 1, workspaceId: workspace })))
      .status,
  ).toBe(503);
  configure();
  vi.stubEnv("SUPABASE_URL", "https://production.supabase.co");
  expect(
    (await handleIndustrialCore(req({ action: "load", factoryId: 1, workspaceId: workspace })))
      .status,
  ).toBe(503);
  expect(getUser).not.toHaveBeenCalled();
});
it("customer samples evaluate on the server without Auth, persistence or caller-supplied data", async () => {
  for (const scenario of ["A", "B", "C", "D"]) {
    const response = await handleIndustrialCore(req({ action: "customer_demo", scenario }));
    expect(response.status).toBe(200);
    const sample = await response.json();
    expect(sample.schemaVersion).toBe("gridmind/customer-demo/v1");
    expect(sample.scenario).toBe(scenario);
    expect(sample.input.origin).toBe("synthetic");
  }
  expect(
    (
      await handleIndustrialCore(
        req({ action: "customer_demo", scenario: "A", input: { origin: "customer" } }),
      )
    ).status,
  ).toBe(400);
  expect(
    (await handleIndustrialCore(req({ action: "customer_demo", scenario: "live" }))).status,
  ).toBe(400);
  expect(getUser).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
it("verifies the exact JWT and forwards only its bound actor/session to a gated RPC", async () => {
  configure();
  expect(
    (await handleIndustrialCore(req({ action: "load", factoryId: 1, workspaceId: workspace })))
      .status,
  ).toBe(200);
  expect(getUser).toHaveBeenCalledWith(token);
  expect(rpc).toHaveBeenCalledWith(
    "industrial_core_store",
    expect.objectContaining({ _actor: actor, _session: session, _factory: 1 }),
  );
});
it("denies anonymous/deleted users and tokens without a session before persistence", async () => {
  configure();
  getUser.mockResolvedValueOnce({ data: { user: { id: actor, is_anonymous: true } }, error: null });
  expect(
    (await handleIndustrialCore(req({ action: "load", factoryId: 1, workspaceId: workspace })))
      .status,
  ).toBe(401);
  getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "deleted" } });
  expect(
    (await handleIndustrialCore(req({ action: "load", factoryId: 1, workspaceId: workspace })))
      .status,
  ).toBe(401);
  expect(
    (
      await handleIndustrialCore(
        req(
          { action: "load", factoryId: 1, workspaceId: workspace },
          { Authorization: `Bearer header.${btoa("{}")}.signature` },
        ),
      )
    ).status,
  ).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});
it("redacts database details from denial, CAS conflict and outages", async () => {
  for (const [code, status] of [
    ["42501", 403],
    ["40001", 409],
    ["08006", 503],
  ] as const) {
    configure();
    rpc.mockResolvedValue({
      error: { code, message: "secret SQL and customer payload" },
      data: null,
    });
    const r = await handleIndustrialCore(
      req({ action: "load", factoryId: 1, workspaceId: workspace }),
    );
    expect(r.status).toBe(status);
    expect(await r.text()).not.toContain("secret");
  }
});
