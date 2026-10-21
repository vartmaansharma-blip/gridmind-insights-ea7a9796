import type { NavigationAccess } from "./navigation-context";
/** Five shared concepts; destinations are navigation, never authorization grants. */
export const GRIDMIND_AREAS = [
  { to: "/", label: "Website", context: "Public information" },
  { to: "/explore", label: "Explore", context: "Fictional organization" },
  { to: "/dashboard", label: "Workspace", context: "Authorized workspace" },
  { to: "/cases", label: "Investigations", context: "Contextual investigations" },
  { to: "/profile", label: "Profile", context: "Personal account" },
] as const;
export const area = (to: (typeof GRIDMIND_AREAS)[number]["to"]) =>
  GRIDMIND_AREAS.find((a) => a.to === to)!;
export function resolveNavigation(access: NavigationAccess, sample: boolean) {
  return GRIDMIND_AREAS.map((a) => {
    if (a.label === "Workspace")
      return {
        ...a,
        to: access.factories
          ? ("/dashboard" as const)
          : access.userId
            ? ("/profile" as const)
            : ("/auth" as const),
        search: access.userId ? undefined : { destination: "team" as const },
      };
    if (a.label === "Investigations")
      return {
        ...a,
        to: sample
          ? ("/explore/$" as const)
          : access.staff
            ? ("/team/cases" as const)
            : access.userId
              ? ("/cases" as const)
              : ("/explore" as const),
        params: sample ? { _splat: "investigations" } : undefined,
      };
    if (a.label === "Profile")
      return {
        ...a,
        to: access.userId ? ("/profile" as const) : ("/auth" as const),
        search: access.userId ? undefined : { destination: "profile" as const },
      };
    return a;
  });
}
