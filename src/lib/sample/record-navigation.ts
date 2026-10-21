import type { SampleWorkspace } from "./workspace";
export function recordPath(s: SampleWorkspace, id: string) {
  if (s.cases.some((c) => c.id === id)) return `investigations/${id}`;
  const e = s.core.entities.find((e) => e.id === id);
  return `${e?.kind === "resource" ? (e.attributes.resourceType === "machine" ? "machines" : "factories") : e?.kind === "order" || e?.kind === "work_order" ? "orders" : e?.kind === "facility" || e?.kind === "company" ? "factories" : e?.kind === "lot" || e?.kind === "material" ? "materials" : "production"}/${id}`;
}
