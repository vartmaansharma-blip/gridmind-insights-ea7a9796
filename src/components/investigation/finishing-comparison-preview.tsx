import { useState } from "react";
import sourceText from "../../../data/synthetic-finishing/comparison.json?raw";
import type { compareFinishing, FinishingInput } from "@/lib/gridmind/finishing-comparison";

type Report = Awaited<ReturnType<typeof compareFinishing>>;
type Example = "recorded_repeat" | "unclassified" | "required_only";

/** Bundled invented records only; no private intake, server writes or technical approval. */
export function FinishingComparisonPreview() {
  const [report, setReport] = useState<Report | null>(null);
  const [example, setExample] = useState<Example | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function inspect(next: Example) {
    setBusy(true);
    setError("");
    setReport(null);
    setExample(next);
    try {
      const input = JSON.parse(sourceText) as FinishingInput;
      if (next === "unclassified") {
        input.batches[1].unclassifiedPersonMinutes = input.batches[1].repeatPersonMinutes;
        input.batches[1].repeatPersonMinutes = 0;
        input.batches[1].classificationReference = null;
      }
      if (next === "required_only") {
        for (const batch of input.batches) {
          batch.requiredPersonMinutes += batch.repeatPersonMinutes;
          batch.repeatPersonMinutes = 0;
          batch.classificationReference = null;
        }
      }
      const { compareFinishing } = await import("@/lib/gridmind/finishing-comparison");
      setReport(
        await compareFinishing(next === "recorded_repeat" ? sourceText : JSON.stringify(input), {
          organizationId: "SYN-ORG-A",
          factoryId: "SYN-FACTORY-A",
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The invented comparison could not run.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!report) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "synthetic-finishing-review-draft.json";
    link.click();
    // Keep the object URL alive long enough for the browser to start the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section
      aria-labelledby="finishing-preview-title"
      className="mb-8 rounded-xl border bg-card p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Internal synthetic finishing comparison
      </p>
      <h2 id="finishing-preview-title" className="mt-2 text-2xl font-semibold">
        Which finishing work needs a closer look?
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Compare two invented lots for one part and operation. Separate required work, recorded
        repeat work and unknown time before deciding what a qualified process reviewer should
        inspect. These examples do not establish avoidable waste, a cause or a saving.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Invented finishing examples">
        {(
          [
            ["recorded_repeat", "Compare invented lots"],
            ["unclassified", "Show unclassified time"],
            ["required_only", "Show required work only"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            disabled={busy}
            aria-pressed={example === id}
            onClick={() => void inspect(id)}
            className="rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm" aria-live="polite" aria-busy={busy}>
        {busy ? <p>Checking the invented records…</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {report ? (
          <>
            <p className="font-semibold">
              Comparison:{" "}
              {report.comparisonState === "inconclusive" ? "Inconclusive" : "Descriptive only"}
            </p>
            <p className="mt-2">
              Paid person-minutes count every person's time. Accepted parts count final output once.
              Two invented lots are not a trial or a validated baseline.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Invented finishing time by lot in person-minutes
                </caption>
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="p-2">
                      Lot
                    </th>
                    <th scope="col" className="p-2">
                      Required
                    </th>
                    <th scope="col" className="p-2">
                      Repeat
                    </th>
                    <th scope="col" className="p-2">
                      Unknown
                    </th>
                    <th scope="col" className="p-2">
                      Total
                    </th>
                    <th scope="col" className="p-2">
                      Per accepted part
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.metrics.map((metric) => (
                    <tr key={metric.batchId} className="border-b">
                      <th scope="row" className="p-2">
                        {metric.batchId}
                      </th>
                      <td className="p-2">{metric.requiredPersonMinutes}</td>
                      <td className="p-2">{metric.repeatPersonMinutes}</td>
                      <td className="p-2">{metric.unclassifiedPersonMinutes}</td>
                      <td className="p-2">{metric.totalPersonMinutes}</td>
                      <td className="p-2">
                        {metric.personMinutesPerAcceptedPart?.toFixed(3) ?? "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="mt-4 font-semibold">Next decision for the owner and reviewer</h3>
            <p className="mt-2">
              {report.gaps.length
                ? "Classify the missing time and resolve comparability gaps before interpreting a difference."
                : report.metrics.every((metric) => metric.repeatPersonMinutes === 0)
                  ? "No repeat work is recorded. High labor alone does not justify a rework investigation or a paid software intervention."
                  : "Check whether the recorded repeated passes were required by the specification and whether existing time-study or QMS practice already explains them."}
            </p>
            {report.gaps.length ? (
              <ul className="mt-2 list-disc pl-5">
                {report.gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2">{report.nextCheck}</p>
            <details className="mt-4">
              <summary className="cursor-pointer">Source and review boundary</summary>
              <p className="mt-2 break-all">
                Original invented JSON SHA-256: {report.sourceSha256}
              </p>
              <p className="mt-2">
                Pointers: /batches/0 and /batches/1. The download preserves the source bytes and a
                pending-review R1 case draft. A hash proves content integrity, not authentic
                measurement.
              </p>
              <p className="mt-2">
                No approved process change, customer release, verified cause or verified savings.
                Freed time is not cash saved.
              </p>
            </details>
            <button
              type="button"
              onClick={download}
              className="mt-4 rounded-md border px-3 py-2 font-medium"
            >
              Download synthetic review draft
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
