import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));
import { handleElectricity } from "./server";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
function setup() {
  vi.stubEnv("GRIDMIND_ELECTRICITY_ENABLED", "synthetic-only");
  vi.stubEnv("SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "synthetic-key");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner", is_anonymous: false } } });
  mocks.rpc.mockResolvedValue({ data: [], error: null });
}
const request = (body: unknown = { action: "list" }, headers = {}) =>
  new Request("http://localhost/api/electricity", {
    method: "POST",
    headers: { Authorization: "Bearer synthetic", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
describe("electricity endpoint", () => {
  it("is disabled by default", async () => {
    expect((await handleElectricity(request())).status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects cross origin", async () => {
    setup();
    expect(
      (await handleElectricity(request(undefined, { Origin: "https://foreign.test" }))).status,
    ).toBe(403);
  });
  it("rejects invalid and anonymous sessions", async () => {
    setup();
    mocks.getUser.mockResolvedValue({ data: { user: { is_anonymous: true } } });
    expect((await handleElectricity(request())).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects actor spoofing", async () => {
    setup();
    expect((await handleElectricity(request({ action: "list", actor: "other" }))).status).toBe(400);
  });
  it("bounds body size", async () => {
    setup();
    expect((await handleElectricity(request({ x: "x".repeat(17000) }))).status).toBe(413);
  });
  it("passes only validated commands and disables caching", async () => {
    setup();
    const r = await handleElectricity(request());
    expect(r.status).toBe(200);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.rpc).toHaveBeenCalledWith("electricity_command", { _command: { action: "list" } });
  });
  it.each([
    ["42501", 403],
    ["40001", 409],
    ["22023", 400],
    ["XX000", 503],
  ])("sanitizes database error %s", async (code, status) => {
    setup();
    mocks.rpc.mockResolvedValue({ error: { code, message: "private database detail" } });
    const r = await handleElectricity(request());
    expect(r.status).toBe(status);
    expect(await r.text()).not.toContain("private database detail");
  });
});
