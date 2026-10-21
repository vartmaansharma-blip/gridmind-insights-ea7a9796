import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { runPhysicalScenario } from "@/lib/industrial-core/physical";

type Result = ReturnType<typeof runPhysicalScenario>;
const options = {
  normal: "No interruption",
  machine_stop: "Press 01 stopped",
  panel_alarm: "Panel P1 power interruption",
  suspected_fault: "Suspected electrical fault (not verified)",
  owner_machine_conflict: "Owner's preferred order but machine stopped",
  owner_avoid_feasible: "Owner avoids otherwise feasible order",
  owner_inferred: "Unconfirmed owner preference (cannot bind)",
} as const;
const textFor = {
  sample_evaluation_only: "Normal sample: review the existing decision checks before any action.",
  machine_unavailable_review: "Verified sample machine stop: impacted order decisions require review.",
  requires_fact_confirmation: "Potential exposure only: verify individual machine conditions before acting.",
  owner_conflict_requires_review: "Owner objective conflicts with the supported manufacturing choices; obtain a revised owner decision and fresh approval.",
  owner_goal_needs_confirmation: "A preference was inferred, not confirmed by the owner. It is not a binding business instruction.",
};
export function PhysicalInfrastructureWorkspace() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [scenario, setScenario] = useState<keyof typeof options>("machine_stop");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/industrial-core", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "physical_demo", scenario }),
      });
      if (!response.ok) throw new Error("Infrastructure sample unavailable.");
      setResult((await response.json()) as Result);
    } catch {
      setError("The infrastructure scenario could not be checked. No decision was made.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="my-6 rounded-xl border border-primary/30 bg-card p-5 space-y-5" aria-labelledby="physical-intelligence-title">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">GM-MVP-002 · Physical infrastructure intelligence · Synthetic only</p>
        <h2 id="physical-intelligence-title" className="text-2xl font-semibold">From an asset to a manufacturing decision</h2>
        <p className="text-sm text-muted-foreground max-w-4xl">
          A fictional automotive parts plant with two stamping lines, two presses, a traced electrical supply,
          and simulated owner objectives. Select an event or an owner preference to run both operational and
          strategic checks through the same existing industrial decision engine.
          No live equipment, factory data, confirmed fault diagnosis or external execution.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          Operating situation
          <select aria-label="Infrastructure scenario" disabled={!hydrated || loading}
            className="mt-2 block rounded border bg-background p-2" value={scenario}
            onChange={(e) => { setScenario(e.target.value as keyof typeof options); setResult(null); setError(""); }}>
            {Object.entries(options).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <Button disabled={!hydrated || loading} onClick={() => void run()}>
          {loading ? "Evaluating…" : "Evaluate connected factory"}
        </Button>
      </div>
      {error && <p role="alert" className="rounded border border-destructive p-3 text-sm">{error}</p>}
      {result && (
        <div className="space-y-5" aria-live="polite">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <h3 className="font-semibold">Operational conclusion</h3>
            <p className="text-sm">{textFor[result.decisionReadiness]}</p>
            <p className="text-sm"><strong>Decision status:</strong>{" "}
              {result.recommendedActionId
                ? `Candidate ${result.recommendedActionId} passes the synthetic core checks; human authorization still required.`
                : "No action recommended. The operating facts or options need review."}
            </p>
            <p className="text-xs text-muted-foreground">Cause not established by power topology. No verified savings. No machine-control authority.</p>
          </div>
          {result.decision.ownerIntentAssessment && (
            <section className="rounded-lg border border-primary/40 p-4 space-y-3" aria-label="Owner goals and conflicts">
              <h3 className="font-semibold">Owner objectives in the same decision</h3>
              <p className="text-xs text-muted-foreground">
                All objectives here are invented sample statements. A simulated owner confirmation is not
                legal or production authorization. Inferred preferences must be confirmed by an actual owner.
              </p>
              {result.decision.ownerIntentAssessment.summaries.map((intent) => (
                <article key={intent.intentId} className="rounded border p-3 space-y-1">
                  <p className="text-sm font-medium">{intent.statement}</p>
                  <p className="text-xs">Source: {intent.source.replaceAll("_", " ")} ·
                    Evidence state: {intent.state.replaceAll("_", " ")} ·
                    Preference: {intent.preference} · Action: {intent.relatedActionIds.join(", ") || "Not mapped"}</p>
                </article>
              ))}
              {result.decision.ownerIntentAssessment.conflicts.map((conflict) => (
                <p key={conflict.intentId + String(conflict.actionId)} className="text-sm font-medium">
                  Unresolved conflict: {conflict.reason.replaceAll("_", " ")}.
                  No approval or execution is permitted while it remains unresolved.
                </p>
              ))}
              {result.decision.ownerIntentAssessment.inferredGoalsRequireConfirmation.length > 0 && (
                <p className="text-sm">Owner confirmation is required before inferred intentions may become binding.</p>
              )}
            </section>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold">Physical plant and electrical connections</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.topology.map((node) => (
                  <div key={node.id} className="rounded border bg-background p-2">
                    <p className="font-medium text-sm">{node.label}</p>
                    <p className="text-xs text-muted-foreground">{node.kind} · {node.model ?? "Model not asserted"}</p>
                    <p className="text-xs text-muted-foreground">Synthetic source: {node.sourceIds.join(", ")}</p>
                  </div>
                ))}
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">View exact recorded connections</summary>
                <ul className="mt-2 space-y-1">
                  {result.connections.map((edge, i) => (
                    <li key={i} className="text-xs break-words">
                      {edge.from} → {edge.to} · {edge.kind.replaceAll("_", " ")} · {edge.verification}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold">Order and material consequences</h3>
              {!result.impacts.length && <p className="text-sm text-muted-foreground">No incident in this synthetic snapshot.</p>}
              {result.impacts.map((impact) => (
                <article key={impact.nodeId} className="rounded border p-3 space-y-2">
                  <h4 className="font-medium text-sm">{impact.machine}</h4>
                  <p className="text-xs">{impact.exposure === "confirmed_machine_unavailable"
                    ? "Verified sample machine stop"
                    : "Potential exposure — individual machine state unverified"}</p>
                  <p className="text-xs text-muted-foreground">Path: {impact.path.join(" → ")}</p>
                  <p className="text-xs text-muted-foreground">Evidence: {impact.evidenceIds.join(", ")}</p>
                  {impact.orders.map((order) => (
                    <p key={order.orderId} className="text-sm">
                      Order <strong>{order.orderId}</strong>, work order {order.workOrderIds.join(", ")},
                      operation {order.operationIds.join(", ")}, material {order.materialIds.join(", ")}
                    </p>
                  ))}
                  {!impact.orders.length && <p className="text-xs">No order can be traced with the supplied routing records.</p>}
                </article>
              ))}
            </div>
          </div>
          <section className="rounded-lg border p-4 space-y-3" aria-label="Industrial decision checks">
            <h3 className="font-semibold">Existing GridMind decision engine</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {result.decision.alternatives.map((alternative) => (
                <div key={alternative.actionId} className="rounded border p-3 space-y-2">
                  <p className="font-medium text-sm">{alternative.label}</p>
                  <p className="text-sm">Constraint outcome: <strong>{alternative.status.replaceAll("_", " ")}</strong></p>
                  <ul className="space-y-1">
                    {alternative.checks.filter((check) => check.status !== "eligible").map((check, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        {check.reason.replaceAll("_", " ")} (evidence: {check.evidenceIds.join(", ") || "unresolved"})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Fictional historical replay only. Operating readiness is not an optimized schedule or a real engineering certificate.
            </p>
          </section>
        </div>
      )}
    </section>
  );
}
