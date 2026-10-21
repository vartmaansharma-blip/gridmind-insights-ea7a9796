import type { SampleWorkspace } from "./workspace";
import { recordPath } from "./record-navigation";
export function sampleRecordIndex(s: SampleWorkspace) {
  return [
    ...s.core.entities.map((e) => ({
      id: e.id,
      label: e.label,
      kind: e.kind,
      path: recordPath(s, e.id),
    })),
    ...s.cases.map((c) => ({
      id: c.id,
      label: c.title,
      kind: "investigation",
      path: recordPath(s, c.id),
    })),
  ];
}
export function searchSampleRecords(s: SampleWorkspace, query: string, kind = "all") {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return sampleRecordIndex(s).filter(
    (r) =>
      (kind === "all" || r.kind === kind) &&
      terms.every((t) =>
        `${r.id} ${r.label} ${r.kind.replaceAll("_", " ")}`.toLowerCase().includes(t),
      ),
  );
}
export function rememberRecord(previous: string[], id: string, allowed: Set<string>) {
  return [id, ...previous.filter((v) => v !== id)].filter((v) => allowed.has(v)).slice(0, 8);
}
