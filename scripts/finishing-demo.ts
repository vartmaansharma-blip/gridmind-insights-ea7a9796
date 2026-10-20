import { readFileSync } from "node:fs";
import { compareFinishing } from "../src/lib/gridmind/finishing-comparison";
import { evaluateSyntheticResolveCase } from "../src/lib/gridmind/resolve-workflow";

// Bundled invented example only. No customer file intake or network access.
const source = readFileSync(
  new URL("../data/synthetic-finishing/comparison.json", import.meta.url),
  "utf8",
);
const report = await compareFinishing(source, {
  organizationId: "SYN-ORG-A",
  factoryId: "SYN-FACTORY-A",
});
process.stdout.write(
  JSON.stringify({ ...report, workflow: evaluateSyntheticResolveCase(report.caseDraft) }, null, 2) +
    "\n",
);
