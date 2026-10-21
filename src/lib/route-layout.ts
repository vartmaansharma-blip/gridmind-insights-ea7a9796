export type RouteLayout = "public" | "sample" | "account" | "portal" | "operational" | "unknown";
const under = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");
/** Central shell contract. API routes and unknown URLs never initialize the energy workspace. */
export function routeLayout(path: string): RouteLayout {
  if (under(path, "/explore")) return "sample";
  if (["/auth", "/profile"].includes(path)) return "account";
  if (under(path, "/cases") || under(path, "/team")) return "portal";
  if (
    [
      "/",
      "/website",
      "/design-preview",
      "/electricity-demo",
      "/customer-demo",
      "/investigations",
      "/investigations-connected",
    ].includes(path)
  )
    return "public";
  if (
    [
      "/dashboard",
      "/factory",
      "/machines",
      "/energy",
      "/opportunities",
      "/alerts",
      "/savings",
      "/verification",
    ].some((p) => under(path, p))
  )
    return "operational";
  return "unknown";
}
