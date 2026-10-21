import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { CustomerDemo } from "@/lib/industrial-core/customer-demo";

const scenarios = {
  A: "Order readiness",
  B: "Surplus opportunity",
  C: "Press downtime",
  D: "Prohibited sourcing",
} as const;
const statusText: Record<string, string> = {
  eligible: "Eligible for human review",
  prohibited: "Blocked",
  requires_review: "More evidence or review needed",
  unknown: "Unknown",
  conditional: "Conditional",
};

export function CustomerDemoWorkspace() {
  const [ready, setReady] = useState(false);
  const [scenario, setScenario] = useState<keyof typeof scenarios>("A");
  const [sample, setSample] = useState<CustomerDemo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setReady(true), []);
  async function run() {
    setBusy(true);
    setError("");
    setSample(null);
    try {
      const response = await fetch("/api/industrial-core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "customer_demo", scenario }),
      });
      if (!response.ok) throw new Error("The sample could not be evaluated. Please try again.");
      setSample(await response.json());
    } catch {
      setError("The sample could not be evaluated. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!sample) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sample, null, 2) + "\n"], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gridmind-customer-demo-${sample.scenario}-SYNTHETIC.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const summary = sample?.operatingSummary;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          GridMind · Customer walkthrough
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold">
          From factory records to a decision you can inspect
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          See the information we need, the checks we run, the choices we exclude and the human
          approval needed before action.
        </p>
        <p className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
          <strong>Fictional sample.</strong> All companies, records and requirements are invented.
          The source review is simulated. This walkthrough does not represent your factory or a
          verified saving.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Sample scenario
            <select
              aria-label="Customer sample scenario"
              disabled={!ready || busy}
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value as keyof typeof scenarios);
                setSample(null);
                setError("");
              }}
              className="mt-2 block w-full rounded border bg-background p-2"
            >
              {Object.entries(scenarios).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="cta" disabled={!ready || busy} onClick={() => void run()}>
            {busy ? "Checking sample…" : "Run customer sample"}
          </Button>
          <Button variant="outline" disabled={!sample || busy} onClick={download}>
            Download sample data and decision
          </Button>
          <Link to="/investigations" className="text-sm underline underline-offset-4">
            Inspect the technical workspace
          </Link>
        </div>
      </header>
      {error && (
        <p role="alert" className="rounded border border-destructive p-4">
          {error}
        </p>
      )}
      {!sample && !error && (
        <p className="text-muted-foreground" role="status">
          Choose a scenario and run it to see an actual evaluation of the invented records.
        </p>
      )}
      {sample && summary && (
        <div aria-live="polite" className="space-y-8">
          <section aria-labelledby="customer-question" className="space-y-3">
            <h2 id="customer-question" className="text-2xl font-semibold">
              {sample.story.title}
            </h2>
            <p>{sample.story.question}</p>
            <p className="text-sm text-muted-foreground">
              Historical replay at {sample.replayAt}. Valid until {sample.validUntil}. Dates stay
              fixed for reproducibility.
            </p>
          </section>
          <section
            aria-labelledby="sample-records"
            className="rounded-xl border bg-card p-5 space-y-4"
          >
            <h2 id="sample-records" className="text-xl font-semibold">
              1. Start with the operating records
            </h2>
            <p>
              {summary.manufacturer} → {summary.customer}
            </p>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Customer order",
                  `${summary.orderQuantity} ${summary.orderUnit} · ${summary.productRevision}`,
                ],
                [
                  "Material requirement",
                  `${summary.requiredMaterial} ${summary.materialUnit} · ${summary.materialPerPart} ${summary.materialUnit} per part`,
                ],
                [
                  "Unreserved lot",
                  `${summary.unreservedQuantity} ${summary.materialUnit} = ${summary.lotQuantity} − ${summary.reservedQuantity} reserved`,
                ],
                [
                  "Press calendar",
                  `${summary.calendarMinutes} minutes recorded · ${summary.requiredMinutes} required`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded border p-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
            {!summary.resourceAvailable && (
              <p className="font-medium text-destructive">
                The press is unavailable. Recorded calendar minutes do not establish usable capacity
                during this outage.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="py-2 text-left font-medium">
                  What we would ask the customer to provide
                </caption>
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Record</th>
                    <th className="p-2">Fields</th>
                    <th className="p-2">Sample references</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.customerInputs.map((r) => (
                    <tr key={r.record} className="border-b">
                      <td className="p-2">{r.record}</td>
                      <td className="p-2">{r.fields}</td>
                      <td className="p-2">{r.sampleEntityIds.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section
            aria-labelledby="sample-checks"
            className="rounded-xl border bg-card p-5 space-y-4"
          >
            <h2 id="sample-checks" className="text-xl font-semibold">
              2. Check evidence, constraints and alternatives
            </h2>
            {sample.scenario === "B" && sample.opportunity ? (
              <div>
                <p>
                  Technical fields alone do not qualify a trade. Both sharing grants here are
                  simulated.
                </p>
                <ul className="list-disc pl-5 mt-3 space-y-2">
                  {sample.opportunity.explanations.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p className="mt-3">
                  Economics: retention value is missing, so a sell-versus-retain recommendation is
                  withheld.
                </p>
              </div>
            ) : (
              sample.checks.map((action) => (
                <article key={action.actionId} className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold">
                    {action.label} · {statusText[action.status]}
                  </h3>
                  <ul className="space-y-2">
                    {action.checks.map((check, i) => (
                      <li key={`${check.ruleId}-${i}`} className="text-sm">
                        <span className="font-medium">
                          {check.ruleId} v{check.version}:
                        </span>{" "}
                        {check.explanation}{" "}
                        {check.requirement && (
                          <span>
                            Requirement: {check.requirement.field} {check.requirement.op}{" "}
                            {JSON.stringify(check.requirement.value)} {check.requirement.unit}.
                          </span>
                        )}{" "}
                        <span className="text-muted-foreground">
                          Source: {check.evidenceIds.join(", ") || "missing"}.
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))
            )}
            {sample.decision.disruptionImpacts.map((impact) => (
              <p key={impact.eventId}>
                Affected records: {impact.affected.map((r) => `${r.kind} ${r.id}`).join(", ")}.
                Delivery effects need review.
              </p>
            ))}
          </section>
          <section
            aria-labelledby="sample-conclusion"
            className="rounded-xl border border-primary/40 bg-primary/5 p-5 space-y-3"
          >
            <h2 id="sample-conclusion" className="text-xl font-semibold">
              3. Explain the decision and the next step
            </h2>
            <p className="font-semibold">
              {statusText[sample.conclusion.status]}: {sample.conclusion.title}
            </p>
            <p>{sample.conclusion.next}</p>
            <p className="text-sm">
              These are supplied alternatives in a bounded method. A complete production or sourcing
              optimizer is not implemented.
            </p>
          </section>
          <section
            aria-labelledby="sample-approval"
            className="rounded-xl border bg-card p-5 space-y-3"
          >
            <h2 id="sample-approval" className="text-xl font-semibold">
              4. Keep approval, action and outcome separate
            </h2>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="font-medium">Approval</dt>
                <dd>Required from authorized people; none given in this walkthrough.</dd>
              </div>
              <div>
                <dt className="font-medium">Execution</dt>
                <dd>No order, purchase, dispatch or payment executed.</dd>
              </div>
              <div>
                <dt className="font-medium">Outcome</dt>
                <dd>Unverified. No measured improvement or verified savings.</dd>
              </div>
            </dl>
            <p className="text-sm text-muted-foreground">
              A permissioned pilot would first confirm the customer's actual decision, current
              process, data rights and reviewer authority, then agree a narrow comparison and
              success criteria.
            </p>
          </section>
          <details className="rounded-xl border p-5">
            <summary className="cursor-pointer font-medium">
              Inspect the sample data structure and evidence trail
            </summary>
            <p className="my-3 text-sm break-all">Input SHA-256: {sample.inputSha256}</p>
            <p className="text-sm break-all">
              Source: {sample.source.source} · SHA-256: {sample.source.digest}. Hashes establish
              content integrity, not authenticity.
            </p>
            <pre
              className="mt-4 max-h-96 overflow-auto text-xs"
              aria-label="Customer sample data structure"
            >
              {JSON.stringify(sample.input, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}
