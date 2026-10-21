import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  authDestination,
  finishGoogleSignIn,
  googlePublicConfig,
  googleRedirect,
  googleReturn,
  requireGoogleProvider,
  workspaceDestination,
} from "./google";

const origin = "https://gridmind.example";
const team = { factories: [{ id: 1, name: "Invented site", role: "viewer" }], isCustomer: false };
describe("Google auth boundaries", () => {
  it("allows only fixed same-origin callback and enum destinations", () => {
    expect(googleRedirect(origin, "team")).toBe(`${origin}/auth?oauth=google&destination=team`);
    for (const input of ["https://evil.example", "//evil.example", "/team/cases", null, ["team"]]) {
      expect(authDestination(input)).toBeUndefined();
      expect(googleRedirect(origin, input as "team")).toBe(`${origin}/auth?oauth=google`);
    }
    for (const input of [
      "http://gridmind.example",
      `${origin}/evil`,
      `${origin}?next=evil`,
      "javascript:alert(1)",
    ]) {
      expect(() => googleRedirect(input, undefined)).toThrow();
    }
    expect(googleRedirect("http://127.0.0.1:4186", "customer")).toContain(
      "/auth?oauth=google&destination=customer",
    );
  });
  it("routes by actual access without granting a team role", () => {
    expect(authDestination("profile")).toBe("profile");
    expect(workspaceDestination({ factories: [], isCustomer: false }, "profile")).toBe("/profile");
    expect(googleRedirect(origin, "profile")).toBe(
      `${origin}/auth?oauth=google&destination=profile`,
    );
    expect(workspaceDestination(team, "team")).toBe("/team/cases");
    expect(workspaceDestination(team, "customer")).toBe("/cases");
    expect(workspaceDestination(team, undefined)).toBe("/dashboard");
    expect(workspaceDestination({ factories: [], isCustomer: true }, "team")).toBe("/cases");
    // A prospective customer may request an investigation, but has no case
    // or factory access: /cases must still apply all server-side permissions.
    expect(workspaceDestination({ factories: [], isCustomer: false }, "customer")).toBe("/cases");
    // Someone asking for staff access (or without a specific request intent)
    // cannot obtain a workspace just by authenticating.
    for (const destination of ["team", undefined] as const) {
      expect(workspaceDestination({ factories: [], isCustomer: false }, destination)).toBeNull();
    }
  });
  it("recognizes cancellation and sanitizes untrusted provider descriptions", () => {
    for (const fragment of ["?error=access_denied", "#error_code=access_denied"]) {
      const result = googleReturn(`${origin}/auth${fragment}&error_description=SECRET`);
      expect(result.active).toBe(true);
      expect(result.error).toContain("cancelled");
      expect(result.error).not.toContain("SECRET");
    }
    expect(googleReturn(`${origin}/auth#error_description=SECRET`).error).not.toContain("SECRET");
    expect(googleReturn(`${origin}/auth`).active).toBe(false);
  });
  it("waits for SDK initialization and validates the restored session", async () => {
    const calls: string[] = [];
    const auth = {
      initialize: vi.fn(async () => {
        calls.push("initialize");
        return { error: null };
      }),
      getSession: vi.fn(async () => {
        calls.push("session");
        return { data: { session: { user: { id: "synthetic" } } }, error: null };
      }),
      getUser: vi.fn(async () => {
        calls.push("verify");
        return { data: { user: { id: "synthetic" } }, error: null };
      }),
    };
    await finishGoogleSignIn(auth as unknown as SupabaseClient["auth"], {
      active: true,
      error: null,
    });
    expect(calls).toEqual(["initialize", "session", "verify"]);
    auth.getUser.mockResolvedValueOnce({ data: { user: { id: "other" } }, error: null });
    await expect(
      finishGoogleSignIn(auth as unknown as SupabaseClient["auth"], { active: true, error: null }),
    ).rejects.toThrow("could not be verified");
  });
  it("never treats cancellation, failed initialization or a missing session as success", async () => {
    const auth = {
      initialize: vi.fn().mockResolvedValue({ error: Error("private") }),
      getSession: vi.fn(),
    };
    const client = auth as unknown as SupabaseClient["auth"];
    await expect(finishGoogleSignIn(client, { active: true, error: "cancelled" })).rejects.toThrow(
      "cancelled",
    );
    expect(auth.initialize).not.toHaveBeenCalled();
    await expect(finishGoogleSignIn(client, { active: true, error: null })).rejects.toThrow(
      "could not be completed",
    );
    expect(auth.getSession).not.toHaveBeenCalled();
    auth.initialize.mockResolvedValue({ error: null });
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(finishGoogleSignIn(client, { active: true, error: null })).rejects.toThrow(
      "did not return a session",
    );
  });
  it("uses public fallbacks identical to the generated browser client and accepts Vite overrides", async () => {
    const fallback = googlePublicConfig({});
    const generatedSource = readFileSync(
      new URL("../../integrations/supabase/client.ts", import.meta.url),
      "utf8",
    );
    expect(generatedSource).toContain(`|| "${fallback.url}"`);
    expect(generatedSource).toContain(`|| "${fallback.key}"`);
    const config = googlePublicConfig({
      url: "https://configured-gridmind.supabase.co",
      key: "sb_publishable_fixture",
    });
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ external: { google: true } })));
    await requireGoogleProvider(config.url, config.key, fetcher);
    expect(String(fetcher.mock.calls[0][0])).toBe(
      "https://configured-gridmind.supabase.co/auth/v1/settings",
    );
    expect(fetcher.mock.calls[0][1].headers.apikey).toBe("sb_publishable_fixture");
    expect(fetcher.mock.calls[0][1].credentials).toBe("omit");
  });

  it("fails closed on disabled Google provider, invalid config and settings outages", async () => {
    const config = { url: origin, key: "sb_publishable_fixture" };
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ external: { google: true } })));
    await requireGoogleProvider(config.url, config.key, fetcher);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${origin}/auth/v1/settings`);
    fetcher.mockResolvedValueOnce(new Response('{"external":{"google":false}}'));
    await expect(requireGoogleProvider(config.url, config.key, fetcher)).rejects.toMatchObject({
      reason: "provider_disabled",
    });
    fetcher.mockResolvedValueOnce(new Response("error", { status: 500 }));
    await expect(requireGoogleProvider(config.url, config.key, fetcher)).rejects.toMatchObject({
      reason: "provider_check_failed",
    });
    fetcher.mockRejectedValueOnce(new Error("private network details"));
    await expect(requireGoogleProvider(config.url, config.key, fetcher)).rejects.toMatchObject({
      reason: "provider_check_failed",
    });
    await expect(
      requireGoogleProvider(config.url, "sb_secret_fixture", fetcher),
    ).rejects.toMatchObject({ reason: "configuration_missing" });
  });
});
