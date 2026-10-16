import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decisionBrief, internalEconomics, statementOfWork } from "../src/lib/investigation/brief";
import { initialWorkspace } from "../src/lib/investigation/fixtures";
import { serializeWorkspace } from "../src/lib/investigation/workspace";

// Invented fixtures only. No network, environment secrets or customer records.
const directory = join(process.cwd(), "data/synthetic-investigation");
mkdirSync(directory, { recursive: true });
const workspace = initialWorkspace();
for (const c of workspace.cases) {
  writeFileSync(join(directory, `${c.id}-brief.md`), decisionBrief(c));
  writeFileSync(join(directory, `${c.id}-sow-draft.md`), statementOfWork(c));
  writeFileSync(join(directory, `${c.id}-INTERNAL-economics.md`), internalEconomics(c));
}
writeFileSync(join(directory, "workspace.json"), serializeWorkspace(workspace) + "\n");
console.log("Exported invented C1/C4 briefs, draft SOWs, blank economics and synthetic backup.");
