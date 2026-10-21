import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlanningResult } from "@/lib/industrial-core/planning";

const scenarios = {
  normal: "Two orders sharing a press, operator and tool",
  shortage: "Insufficient approved material",
  breakdown: "Press stopped; return to service unverified",
  quality_hold: "Inspection holds the material",
  outsourced_delay: "External processing returns late",
  calendar_unknown: "Operator breaks have no recorded times",
  owner_conflict: "Owner asks to hold an otherwise feasible action",
} as const;
const reason = (code: string) =>
  ({
    MATERIAL_SHORTAGE_OR_ALREADY_RESERVED:
      "Approved stock is insufficient after protecting other orders' reservations.",
    MATERIAL_NOT_QUALITY_RELEASED:
      "The material or its inspection is held, rejected or missing a release.",
    DOWNTIME_REQUIRES_VERIFIED_RETURN_TO_SERVICE:
      "The resource is stopped. A clock estimate cannot authorize its return to service.",
    CALENDAR_BREAKS_NOT_LOCATED:
      "Record the actual usable shift windows; a net-hours total cannot locate breaks.",
    NO_SHARED_CALENDAR_CAPACITY:
      "Machine, labor and tool have no common free interval long enough for this operation.",
    RESOURCE_QUALIFICATION_MISSING: "Verify the resource's process qualification before using it.",
    MANDATORY_REQUIREMENT_FAILED: "A binding supplied requirement rules out this job.",
    PLAN_EVIDENCE_NOT_VERIFIED_OR_CURRENT:
      "Source review or freshness is missing. Recheck the evidence.",
  })[code] ?? code.toLowerCase().replaceAll("_", " ");

export function OperationsPlanSummary({ result }: { result: PlanningResult }) {
  return (
    <div className="space-y-4" aria-live="polite">
      <p className="font-medium">
        Planning result:{" "}
        {result.status === "candidate_feasible"
          ? "Feasible draft within supplied records"
          : "Blocked or needs review"}
      </p>
      <p className="text-sm text-muted-foreground">
        Draft only. No work is assigned and no stock or machine time is reserved. Confirm the
        current operating records and approvals before assignment. This heuristic does not establish
        an optimal schedule.
      </p>
      <ul className="space-y-2 text-sm">
        {result.jobs.map((job) => (
          <li key={job.workOrderId} className="rounded border p-3">
            <strong>{job.workOrderId}</strong>:{" "}
            {job.status === "blocked"
              ? "Blocked"
              : job.late
                ? "Draft misses due date"
                : "Draft meets supplied due date"}
            {job.dueAt && <span className="block">Due: {job.dueAt}</span>}
            {job.issues.map((issue, index) => (
              <p key={`${issue.code}-${index}`}>
                {reason(issue.code)}{" "}
                <span className="text-muted-foreground">
                  Records: {issue.ids.join(", ") || "planning snapshot"}
                </span>
              </p>
            ))}
          </li>
        ))}
      </ul>
      {result.ownerIntentAssessment.conflicts.length > 0 && (
        <p className="text-sm">
          An owner preference conflicts with this draft. Resolve it explicitly; it does not override
          technical or contractual restrictions.
        </p>
      )}
      {result.ownerIntentAssessment.inferredGoalsRequireConfirmation.length > 0 && (
        <p className="text-sm">An inferred owner preference still needs confirmation.</p>
      )}
      {result.ownerIntentAssessment.summaries.some(
        (intent) => intent.state === "stale" || intent.state === "needs_confirmation",
      ) && (
        <p className="text-sm">
          An operating preference needs fresh confirmation before this draft can be accepted.
        </p>
      )}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <caption className="text-left text-muted-foreground">
            Planned sequence — times are shown in UTC; quantities use the product's source unit
          </caption>
          <thead>
            <tr>
              {[
                "Work order / step",
                "Resource",
                "Start",
                "Finish",
                "Quantity",
                "Setup / run (min)",
              ].map((label) => (
                <th key={label} scope="col" className="p-2 text-left">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.tasks.map((task) => (
              <tr key={`${task.workOrderId}:${task.operationId}`} className="border-t">
                <td className="p-2">
                  {task.workOrderId}
                  <br />
                  {task.operationId}
                </td>
                <td className="p-2">
                  {task.resourceId}
                  <span className="block text-muted-foreground">
                    Tools: {task.toolIds.join(", ") || "none specified"}; labor:{" "}
                    {task.laborIds.join(", ")}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap">{task.startsAt}</td>
                <td className="p-2 whitespace-nowrap">{task.endsAt}</td>
                <td className="p-2">
                  {task.quantity} {task.quantityUnit}
                </td>
                <td className="p-2">
                  {task.setupMinutes} / {task.runMinutes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result.tasks.length && (
          <p className="py-3 text-sm">
            No supplied job can be placed in this draft. Review the blockers above.
          </p>
        )}
      </div>
      <p className="text-sm">
        Uncommitted material after draft allocations:{" "}
        {result.inventoryRemaining
          .map(
            (lot) =>
              `${lot.lotId}: ${lot.uncommitted} ${lot.unit}; protected reservations: ${lot.reservedForOrders} ${lot.unit}`,
          )
          .join(" · ")}
        . These are calculated balances, not physical stock updates.
      </p>
      <details>
        <summary className="cursor-pointer text-sm">Source binding and method limits</summary>
        <p className="mt-2 break-all text-xs">
          Input SHA-256: {result.inputDigest}
          <br />
          Plan SHA-256: {result.planDigest}
          <br />
          Evaluated at: {result.evaluatedAt}
          <br />
          Method: {result.algorithmVersion}
        </p>
        <ul className="mt-2 text-xs space-y-1">
          {result.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function PlanningWorkspace() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [scenario, setScenario] = useState<keyof typeof scenarios>("normal");
  const [result, setResult] = useState<PlanningResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async () => {
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch("/api/industrial-core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "planning_demo", scenario }),
      });
      const body = await response.json();
      if (!response.ok || body.algorithmVersion !== "gm-operations/earliest-due-finite-v1")
        throw new Error(body.error ?? "The planning example could not be loaded.");
      setResult(body);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The planning example could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gridmind-plan-${scenario}-SYNTHETIC.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section
      aria-labelledby="finite-planning-title"
      className="my-6 min-w-0 rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Synthetic operating workflow
        </p>
        <h2 id="finite-planning-title" className="text-2xl font-semibold">
          Finite production planning
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Invented historical orders, material, shifts and qualifications. The calculation uses
          actual scheduling and reservation checks; it does not represent a customer's factory or
          the SECOM dataset.
        </p>
      </div>
      <label className="block text-sm">
        Planning scenario
        <select
          aria-label="Planning scenario"
          className="mt-2 block w-full max-w-lg rounded border bg-background p-2"
          value={scenario}
          disabled={!ready || busy}
          onChange={(event) => {
            setScenario(event.target.value as keyof typeof scenarios);
            setResult(null);
            setError("");
          }}
        >
          {Object.entries(scenarios).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!ready || busy} onClick={() => void run()}>
          {busy ? "Planning…" : "Plan invented orders"}
        </Button>
        <Button variant="outline" disabled={!ready || busy || !result} onClick={download}>
          Download planning draft
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} Try the same scenario again.
        </p>
      )}
      {result ? (
        <OperationsPlanSummary result={result} />
      ) : (
        !busy && (
          <p className="text-sm text-muted-foreground">
            Choose an example to inspect its feasible sequence or the records blocking it.
          </p>
        )
      )}
    </section>
  );
}
