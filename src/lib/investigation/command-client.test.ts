import { afterEach, expect, it, vi } from "vitest";
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession } } }));
import { authenticatedCommand } from "./command-client";
afterEach(() => vi.unstubAllGlobals());
it("customer grant updates are not automatically replayed by the actual adapter", async () => {
  getSession.mockResolvedValue({
    data: { session: { user: { id: "actor" }, access_token: "fixture-token" } },
  });
  const fetcher = vi.fn().mockRejectedValue(new TypeError("Lost grant response"));
  vi.stubGlobal("fetch", fetcher);
  await expect(
    authenticatedCommand("/api/portal", {
      action: "grant",
      caseId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      active: true,
      expiresAt: null,
    }),
  ).rejects.toMatchObject({ code: "CONNECTION_INTERRUPTED" });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("rejects an HTTP success carrying a different mutation receipt", async () => {
  getSession.mockResolvedValue({
    data: { session: { user: { id: "actor" }, access_token: "fixture-token" } },
  });
  const fetcher = vi.fn().mockResolvedValue(Response.json({ id: "wrong-receipt" }));
  vi.stubGlobal("fetch", fetcher);
  await expect(
    authenticatedCommand("/api/portal", {
      action: "message",
      id: "11111111-1111-4111-8111-111111111111",
      caseId: "22222222-2222-4222-8222-222222222222",
      text: "Fixture message",
    }),
  ).rejects.toMatchObject({ code: "INVALID_API_RESPONSE" });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
