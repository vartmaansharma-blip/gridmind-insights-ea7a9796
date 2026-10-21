import { sections } from "./workspace";
export const sampleSections = {
  overview: "Overview",
  organization: "Organization & People",
  factories: "Factories & Infrastructure",
  machines: "Machines & Resources",
  production: "Production & Materials",
  orders: "Production & Materials",
  materials: "Production & Materials",
  investigations: "Investigations",
  decisions: "Decisions",
  history: "Reports & History",
} as const;
export type SampleView = keyof typeof sampleSections;
export function samplePath(view: SampleView, record?: string) {
  return [view, ...(record ? [record] : [])].join("/");
}
export function sampleLocation(pathname: string) {
  const parts = pathname
    .replace(/^\/explore\/?/, "")
    .split("/")
    .filter(Boolean);
  const view = (parts[0] || "overview") as SampleView;
  const valid =
    Object.hasOwn(sampleSections, view) &&
    parts.length <= 2 &&
    (!parts[1] || /^[A-Za-z][A-Za-z0-9-]{0,99}$/.test(parts[1]));
  return {
    view: valid ? view : ("overview" as SampleView),
    section: valid ? sampleSections[view] : sections[0],
    recordId: valid ? parts[1] : undefined,
    valid,
  };
}
export function viewForSection(section: (typeof sections)[number]): SampleView {
  return Object.entries(sampleSections).find(([, s]) => s === section)![0] as SampleView;
}
