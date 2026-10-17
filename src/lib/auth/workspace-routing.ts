import type { Principal } from "@/lib/investigation/portal-contract";

/** Never infer staff access from URL query, email domain or self-declared profile. */
const staffRoles = new Set(["owner", "admin", "analyst"]);
export function isStaffPrincipal(p: Principal): boolean {
  return p.factories.some((f) => staffRoles.has(f.role));
}
export function selectAuthorizedLanding(p: Principal, intent?: "customer" | "team") {
  if (intent === "customer" && p.isCustomer) return "/cases";
  if (isStaffPrincipal(p)) return "/team/cases";
  // Case reviewers can hold a factory viewer membership without edit rights.
  // Explicit team intent may open the case list; each case remains server-scoped.
  if (intent === "team" && p.factories.some((f) => f.role === "viewer")) return "/team/cases";
  if (p.isCustomer) return "/cases";
  if (intent === "team") return null; // no assigned factory means no team access
  return "/onboarding";
}
