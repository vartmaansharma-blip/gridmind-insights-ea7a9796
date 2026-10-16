import { caseSchema, workspaceSchema, type Investigation, type Workspace } from "./schema";

export const STORAGE_KEY = "gridmind:synthetic-investigations:v1";
export const MAX_BACKUP_BYTES = 4_000_000;

export function parseWorkspace(raw: string): Workspace {
  if (raw.length > MAX_BACKUP_BYTES) throw new Error("Synthetic backup exceeds the 4 MB limit.");
  return workspaceSchema.parse(JSON.parse(raw));
}
export function serializeWorkspace(workspace: Workspace): string {
  const raw = JSON.stringify(workspaceSchema.parse(workspace));
  if (raw.length > MAX_BACKUP_BYTES)
    throw new Error("Workspace exceeds the 4 MB limit; export a backup before continuing.");
  return raw;
}
/** Immutable revision with complete previous source values retained, not silently overwritten. */
export function reviseCase(
  workspace: Workspace,
  next: Investigation,
  reason: string,
  at = new Date().toISOString(),
): Workspace {
  const current = workspace.cases.find((c) => c.id === next.id);
  if (!current) throw new Error("Case not found.");
  if (current.revision !== next.revision)
    throw new Error("Stale revision; reload the current case before saving.");
  if (!reason.trim()) throw new Error("A correction/change reason is required.");
  if (workspace.history.length >= 100)
    throw new Error(
      "Revision history is full. Export your backup and start a new synthetic workspace; history is never silently discarded.",
    );
  const updated = caseSchema.parse({ ...next, revision: current.revision + 1 });
  const result = workspaceSchema.parse({
    ...workspace,
    cases: workspace.cases.map((c) => (c.id === next.id ? updated : c)),
    history: [
      ...workspace.history,
      { caseId: next.id, revision: current.revision, at, reason, before: current },
    ],
  });
  serializeWorkspace(result);
  return result;
}
export function addCase(workspace: Workspace, c: Investigation): Workspace {
  const result = workspaceSchema.parse({
    ...workspace,
    cases: [...workspace.cases, caseSchema.parse(c)],
  });
  serializeWorkspace(result);
  return result;
}
export interface SyntheticStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function saveWorkspace(storage: SyntheticStorage, workspace: Workspace): void {
  // No authentication, network, customer persistence or tenant-security claim is made here.
  storage.setItem(STORAGE_KEY, serializeWorkspace(workspace));
}
export function loadWorkspace(storage: SyntheticStorage): Workspace | null {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? null : parseWorkspace(raw);
}
