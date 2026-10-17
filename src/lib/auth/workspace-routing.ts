import type { Principal } from "@/lib/investigation/portal-contract";

/** Never infer staff access from URL query, email domain or self-declared profile. */
const staffRoles = new Set(["owner", "admin", "analyst"]);
export function isStaffPrincipal(p: Principal): boolean {
  return p.factories.some((f) => staffRoles.has(f.role));
}
export function selectAuthorizedLanding(p: Principal, intent?: "customer" | "team") {
  if (intent === "customer" && p.isCustomer) return "/cases";
  if (isStaffPrincipal(p)) return "/team/cases";
  if (p.isCustomer) return "/cases";
  if (intent === "team") return null; // staff invitation needed, never self-upgrade
  return "/onboarding";
}
