import { useState } from "react";
import {
  exportInvoiceExperiment,
  importInvoiceCsv,
  startInvoiceExperiment,
  reviewInvoiceExperiment,
  recordInvoiceAction,
  recordInvoiceOutcome,
} from "@/lib/gridmind/invoice-exception";
import {
  INVOICE_DEMO_CSV,
  INVOICE_NEGATIVE_CSV,
  INVOICE_CONFLICT_CSV,
  INVOICE_DEMO_SCOPE,
  INVOICE_REVIEW_DEMO,
  INVOICE_ACTION_DEMO,
} from "@/lib/gridmind/invoice-fixtures";

type Report = Awaited<ReturnType<typeof exportInvoiceExperiment>>;

/** Bundled invented records only. No upload, network, authenticated tenant access or customer custody. */
export function InvoiceExceptionPreview() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<"accept" | "revise" | "reject">("accept");
  async function run(work: () => Promise<Report>) {
    setBusy(true);
    setError("");
    try {
      setReport(await work());
    } catch (e) {
      setError(e instanceof Error ? e.message : "The synthetic exercise could not continue.");
    } finally {
      setBusy(false);
    }
  }
  const inspect = (csv: string) =>
    run(async () =>
      exportInvoiceExperiment(
        startInvoiceExperiment(
          await importInvoiceCsv(csv, INVOICE_DEMO_SCOPE, "bundled-fiction.csv"),
        ),
        INVOICE_DEMO_SCOPE,
      ),
    );
  function download() {
    if (!report) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "gridmind-synthetic-invoice-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      aria-labelledby="invoice-experiment-title"
      className="mb-8 rounded-xl border bg-card p-5 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        R2 · Offline synthetic experiment
      </p>
      <h2 id="invoice-experiment-title" className="mt-2 text-2xl font-semibold">
        Reconcile one invoice exception.
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Compare invented order, dispatch, receipt, acceptance and invoice records. Review a
        discrepancy, record a fictional customer-owned action and retain an inconclusive follow-up.
        No customer records, authenticated permissions, professional approval or recovered money.
      </p>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Load invented invoice records"
      >
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => inspect(INVOICE_DEMO_CSV)}
        >
          Load quantity difference
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => inspect(INVOICE_NEGATIVE_CSV)}
        >
          Load no-gap example
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => inspect(INVOICE_CONFLICT_CSV)}
        >
          Load conflicting invoices
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm">
          {error}
        </p>
      )}
      {report && (
        <div className="mt-5 space-y-4 text-sm" aria-live="polite">
          <p>
            <strong>Assessment:</strong> {report.analysis.status.replaceAll("_", " ")}.{" "}
            <strong>Workflow:</strong> {report.workflow.stage.replaceAll("_", " ")}.
          </p>
          <p>
            Invoice face value:{" "}
            {report.analysis.invoiceFaceValuePaise === null
              ? "unknown"
              : `₹${(report.analysis.invoiceFaceValuePaise / 100).toFixed(2)}`}
            . This is not loss, overdue debt, recoverable money or savings.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="mb-2 text-left font-medium">
                Invented source records · original physical lines retained
              </caption>
              <thead>
                <tr>
                  {["Line", "Document", "Date", "Pieces", "Status"].map((t) => (
                    <th className="p-2" key={t} scope="col">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.state.dataset.records.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.sourceLine}</td>
                    <td className="p-2">{r.kind}</td>
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.quantityPieces ?? "unknown"}</td>
                    <td className="p-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold">Recorded differences and unknowns</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {report.analysis.issues.map((issue, i) => (
                <li key={i}>
                  {issue.statement} (source lines {issue.sourceLines.join(", ")}).
                </li>
              ))}
              {report.analysis.unknowns.map((unknown) => (
                <li key={unknown}>{unknown}.</li>
              ))}
            </ul>
            <p className="mt-2">
              Competing explanations remain unconfirmed: partial acceptance, record/specification
              mismatch, commercial/quality hold, or no actionable documentary gap.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <label className="grid gap-1">
              Simulated independent reviewer decision
              <select
                className="rounded-md border bg-background p-2"
                value={decision}
                onChange={(e) => setDecision(e.target.value as typeof decision)}
              >
                <option value="accept">Accept documentary check only</option>
                <option value="revise">Request revision</option>
                <option value="reject">Reject</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={busy || report.state.actions.length > 0}
              onClick={() =>
                run(async () =>
                  exportInvoiceExperiment(
                    await reviewInvoiceExperiment(report.state, INVOICE_DEMO_SCOPE, {
                      ...INVOICE_REVIEW_DEMO,
                      decision,
                    }),
                    INVOICE_DEMO_SCOPE,
                  ),
                )
              }
            >
              Record invoice simulated review
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={
                busy ||
                report.state.review?.decision !== "accept" ||
                report.state.actions.length > 0
              }
              onClick={() =>
                run(async () =>
                  exportInvoiceExperiment(
                    await recordInvoiceAction(
                      report.state,
                      INVOICE_DEMO_SCOPE,
                      INVOICE_ACTION_DEMO,
                    ),
                    INVOICE_DEMO_SCOPE,
                  ),
                )
              }
            >
              Record fictional authorised action
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={busy || report.state.actions.length === 0 || report.state.outcome !== null}
              onClick={() =>
                run(async () =>
                  exportInvoiceExperiment(
                    await recordInvoiceOutcome(report.state, INVOICE_DEMO_SCOPE, {
                      status: "inconclusive",
                      observation:
                        "Fictional owner compared records; buyer decision and payment not established",
                      confounders: "No buyer confirmation or counterfactual payment date",
                      sourceLines: [4, 5],
                    }),
                    INVOICE_DEMO_SCOPE,
                  ),
                )
              }
            >
              Record inconclusive follow-up
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={busy}
              onClick={download}
            >
              Export synthetic evidence report
            </button>
          </div>
          <p>
            Simulated review: {report.state.review?.decision ?? "not performed"} · prior decisions
            retained: {report.state.reviewHistory.length} · actions: {report.state.actions.length} ·
            follow-up: {report.state.outcome?.status ?? "not recorded"}.
          </p>
          <p className="font-medium">
            Customer approval: blocked · verified savings: not established · commercial value:
            unproven.
          </p>
        </div>
      )}
    </section>
  );
}
