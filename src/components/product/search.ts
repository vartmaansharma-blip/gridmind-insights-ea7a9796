export const portalSearch = (search: Record<string, unknown>): { mode?: "demo" } =>
  search.mode === "demo" ? { mode: "demo" } : {};
