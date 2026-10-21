import { describe, it, expect } from "vitest";
import { resolveNavigation, GRIDMIND_AREAS, navigationArea } from "./navigation";
import { routeLayout } from "./route-layout";
import { sampleLocation, samplePath } from "./sample/navigation";
import { preferencesSchema, defaultPreferences, formatSampleTime } from "./preferences";
import { selectedFactory, rememberFactory } from "./workspace-selection";
describe("navigation and non-sensitive preferences", () => {
  it("has exactly five stable concepts with bounded account destinations", () => {
    expect(GRIDMIND_AREAS.map((a) => a.label)).toEqual([
      "Website",
      "Explore",
      "Workspace",
      "Investigations",
      "Profile",
    ]);
    const anonymous = { userId: null, factories: false, staff: false, customer: false };
    expect(resolveNavigation(anonymous, false).find((a) => a.label === "Profile")).toMatchObject({
      to: "/auth",
      search: { destination: "profile" },
    });
    expect(
      resolveNavigation({ ...anonymous, userId: "own-account" }, false).find(
        (a) => a.label === "Workspace",
      )?.to,
    ).toBe("/profile");
    expect(
      resolveNavigation({ ...anonymous, userId: "own-account", factories: true }, false).find(
        (a) => a.label === "Workspace",
      )?.to,
    ).toBe("/dashboard");
    expect(
      resolveNavigation(anonymous, true).find((a) => a.label === "Investigations"),
    ).toMatchObject({ to: "/explore/$", params: { _splat: "investigations" } });
  });
  it("separates sample, account, portal, operational and unknown shells", () => {
    for (const path of ["/explore", "/explore/machines/press", "/explore/investigations/case-1"])
      expect(routeLayout(path)).toBe("sample");
    expect(navigationArea("/explore/machines/press")).toBe("Explore");
    expect(navigationArea("/team/cases/123")).toBe("Investigations");
    expect(routeLayout("/profile")).toBe("account");
    expect(routeLayout("/team/cases/123")).toBe("portal");
    expect(routeLayout("/dashboard")).toBe("operational");
    for (const path of ["/api/portal", "/explore-evil", "/missing"])
      expect(routeLayout(path)).toBe("unknown");
  });
  it("parses exact bounded sample deep links and rejects unknown sections", () => {
    expect(sampleLocation("/explore/orders/order-03")).toMatchObject({
      valid: true,
      recordId: "order-03",
      section: "Production & Materials",
    });
    for (const path of [
      "/explore/private",
      "/explore/machines/press/extra",
      "/explore/machines/%2Fprivate",
    ])
      expect(sampleLocation(path).valid).toBe(false);
    expect(samplePath("investigations", "case-4")).toBe("investigations/case-4");
  });
  it("rejects permission-like or unbounded preferences and formats explicit timezones", () => {
    expect(preferencesSchema.safeParse({ role: "owner" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ landing: "https://evil.example" }).success).toBe(false);
    expect(formatSampleTime("2026-10-20T12:00:00Z", defaultPreferences)).toContain("Asia/Kolkata");
    expect(
      formatSampleTime("2026-10-20T12:00:00Z", { ...defaultPreferences, dateFormat: "iso" }),
    ).toBe("2026-10-20T12:00:00.000Z");
  });
  it("revalidates a selected factory against the current account and fresh allowed IDs", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    };
    rememberFactory("user-a", "factory-a", storage);
    expect(selectedFactory("user-a", ["factory-a"], storage)).toBe("factory-a");
    expect(selectedFactory("user-b", ["factory-a"], storage)).toBeNull();
    expect(data.size).toBe(0);
    rememberFactory("user-a", "factory-a", storage);
    expect(selectedFactory("user-a", [], storage)).toBeNull();
    expect(
      selectedFactory("user-a", [], {
        getItem: () => {
          throw Error("storage blocked");
        },
        removeItem: () => {
          throw Error("storage blocked");
        },
      }),
    ).toBeNull();
  });
});
