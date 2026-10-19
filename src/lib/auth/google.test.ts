import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  authDestination,
  finishGoogleSignIn,
  googleRedirect,
  googleReturn,
  requireGoogleProvider,
  workspaceDestination,
} from "./google";

const origin = "https://gridmind.example";
const team = { factories: [{ id: 1, name: "Invented site", role: "analyst" }], isCustomer: false };
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
  it("routes by verified access rather than a requested URL role", () => {
    expect(workspaceDestination(team, "team")).toBe("/team/cases");
    expect(workspaceDestination(team, "customer")).toBe("/team/cases");
    expect(workspaceDestination(team, undefined)).toBe("/team/cases");
    expect(workspaceDestination({ factories: [], isCustomer: true }, "team")).toBe("/cases");
    expect(workspaceDestination({ factories: [], isCustomer: false }, "customer")).toBe("/onboarding");
    expect(workspaceDestination({ factories: [], isCustomer: false }, undefined)).toBe("/onboarding");
    // A user without a staff grant cannot self-promote by requesting team.
    expect(workspaceDestination({ factories: [], isCustomer: false }, "team")).toBeNull();
    expect(workspaceDestination({ factories: [{ id: 9, name: "Sample", role: "viewer" }], isCustomer: false }, "team")).toBe("/team/cases");
    expect(workspaceDestination({ factories: [{ id: 9, name: "Sample", role: "viewer" }], isCustomer: false }, undefined)).toBe("/onboarding");
    expect(workspaceDestination({ factories: [{ id: 9, name: "Sample", role: "owner" }], isCustomer: true }, "customer")).toBe("/cases");
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
  it("fails closed on disabled provider and settings failures", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ external: { google: true } })));
    await requireGoogleProvider(origin, "sb_publishable_fixture", fetcher);
    expect(String(fetcher.mock.calls[0][0])).toBe(`${origin}/auth/v1/settings`);
    for (const response of [
      new Response('{"external":{"google":false}}'),
      new Response("error", { status: 500 }),
    ]) {
      fetcher.mockResolvedValueOnce(response);
      await expect(
        requireGoogleProvider(origin, "sb_publishable_fixture", fetcher),
      ).rejects.toThrow("unavailable");
    }
    await expect(requireGoogleProvider(origin, "sb_secret_fixture", fetcher)).rejects.toThrow(
      "unavailable",
    );
  });
});
