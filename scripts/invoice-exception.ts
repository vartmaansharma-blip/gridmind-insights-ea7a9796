import { readFile, writeFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import {
  importInvoiceCsv,
  startInvoiceExperiment,
  exportInvoiceExperiment,
  reviewInvoiceExperiment,
  recordInvoiceAction,
  recordInvoiceOutcome,
} from "../src/lib/gridmind/invoice-exception";

async function boundedRead(path: string) {
  if ((await stat(path)).size > 4_000_000) throw new Error("Input exceeds 4 MB");
  return readFile(path, "utf8");
}
async function main() {
  const [command, input, decision, output] = process.argv.slice(2);
  if (
    !["inspect", "review", "action", "outcome", "reopen"].includes(command) ||
    !input ||
    !decision ||
    (command !== "reopen" && !output)
  )
    throw new Error(
      "Usage: bun scripts/invoice-exception.ts inspect CSV SCOPE_JSON NEW_REPORT_JSON | review/action/outcome REPORT_JSON INPUT_JSON NEW_REPORT_JSON | reopen REPORT_JSON EXPECTED_SCOPE_JSON",
    );
  if (command === "inspect") {
    const scope: unknown = JSON.parse(await boundedRead(decision));
    const d = await importInvoiceCsv(await boundedRead(input), scope, basename(input));
    const report = await exportInvoiceExperiment(startInvoiceExperiment(d), scope);
    await writeFile(output, JSON.stringify(report, null, 2), { flag: "wx" });
    console.log("Synthetic unreviewed report saved; no customer result or payment recovery.");
    return;
  }
  const report: unknown = JSON.parse(await boundedRead(input));
  if (!report || typeof report !== "object" || !("state" in report))
    throw new Error("Expected a synthetic report");
  const state = report.state;
  const decisionInput: unknown = JSON.parse(await boundedRead(decision));
  if (command === "reopen") {
    const checked = await exportInvoiceExperiment(state, decisionInput);
    console.log(
      JSON.stringify({
        status: checked.analysis.status,
        workflow: checked.workflow.stage,
        customerValidated: false,
      }),
    );
    return;
  }
  // No CLI identity is an authenticated actor. These are fictional simulation inputs only.
  const checked = await exportInvoiceExperiment(
    state,
    (state as { dataset?: { scope?: unknown } })?.dataset?.scope,
  );
  const scope = checked.state.dataset.scope;
  const next =
    command === "review"
      ? await reviewInvoiceExperiment(state, scope, decisionInput)
      : command === "action"
        ? await recordInvoiceAction(state, scope, decisionInput)
        : await recordInvoiceOutcome(state, scope, decisionInput);
  const result = await exportInvoiceExperiment(next, scope);
  await writeFile(output, JSON.stringify(result, null, 2), { flag: "wx" });
  console.log(
    "New synthetic revision saved; previous report file preserved. Outcome remains unproven.",
  );
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Synthetic experiment failed");
  process.exitCode = 1;
});
