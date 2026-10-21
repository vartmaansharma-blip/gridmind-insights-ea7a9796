import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { runScenario } from "@/lib/industrial-core/fixtures";
import type { CoreState } from "@/lib/industrial-core/service";
type Demo = ReturnType<typeof runScenario>;
type Stored = { revision: number; snapshot: CoreState | null; audit: unknown[] };
const scenarios = {
  A: "Automotive order",
  B: "Cross-industry opportunity",
  C: "Industrial disruption",
  D: "Prohibited sourcing",
} as const;
export function IndustrialCoreWorkspace() {
  const [scenario, setScenario] = useState<keyof typeof scenarios>("A"),
    [demo, setDemo] = useState<Demo | null>(null),
    [stored, setStored] = useState<Stored | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [factory, setFactory] = useState(""),
    [workspace, setWorkspace] = useState("");
  const pending = useRef<{ body: Record<string, unknown>; key: string } | null>(null);
  const post = async (body: Record<string, unknown>, authenticated = false) => {
    const token = authenticated
      ? (await supabase.auth.getSession()).data.session?.access_token
      : null;
    if (authenticated && !token)
      throw new Error(
        "Sign in through the existing Auth page first. This does not grant decision authority.",
      );
    const response = await fetch("/api/industrial-core", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok)
      throw Object.assign(new Error(result.error ?? "Core request failed"), {
        status: response.status,
      });
    return result;
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };
  const mutate = (action: string, extra: Record<string, unknown> = {}) =>
    run(async () => {
      if (!Number.isSafeInteger(Number(factory)) || Number(factory) <= 0)
        throw new Error("Enter an existing authorized plant ID.");
      const workspaceId = workspace || crypto.randomUUID();
      setWorkspace(workspaceId);
      const body = pending.current?.body ?? {
        action,
        workspaceId,
        factoryId: Number(factory),
        expectedRevision: stored?.revision ?? 0,
        requestKey: crypto.randomUUID(),
        ...extra,
      };
      pending.current = { body, key: String(body.requestKey) };
      try {
        const result = await post(body, true);
        setStored(result);
        pending.current = null;
      } catch (e) {
        if (e instanceof Error && "status" in e && Number(e.status) < 500) pending.current = null;
        throw e;
      }
    });
  const evaluation = stored?.snapshot?.evaluation ?? demo?.decision;
  return (
    <section
      aria-labelledby="industrial-core-title"
      className="rounded-xl border border-border bg-card p-5 my-6 space-y-4"
    >
      {evaluation?.disruptionImpacts?.map((impact) => (
        <p key={impact.eventId} className="text-sm">
          Disruption {impact.eventId} affects:{" "}
          {impact.affected.map((e) => `${e.kind} ${e.id}`).join(", ")}. Delivery effects require
          review.
        </p>
      ))}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          GM-CORE-003 · Synthetic foundation
        </p>
        <h2 id="industrial-core-title" className="text-2xl font-semibold">
          Industrial decisions and constraints
        </h2>
        <p className="text-sm text-muted-foreground">
          Invented historical replay; no real company rule, optimization, professional approval or
          transaction. Connected storage requires an isolated database and explicit grants.
        </p>
      </div>
      <label className="block text-sm">
        Scenario{" "}
        <select
          aria-label="Industrial core scenario"
          className="mt-2 block w-full max-w-md rounded border bg-background p-2"
          value={scenario}
          disabled={busy}
          onChange={(e) => {
            setScenario(e.target.value as keyof typeof scenarios);
            setDemo(null);
          }}
        >
          {Object.entries(scenarios).map(([id, label]) => (
            <option key={id} value={id}>
              {id} — {label}
            </option>
          ))}
        </select>
      </label>
      <Button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            setStored(null);
            setDemo(await post({ action: "demo", scenario }));
          })
        }
      >
        Run synthetic scenario
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {evaluation && (
        <div aria-live="polite" className="space-y-3">
          <p className="text-sm font-medium">
            Decision: {evaluation.disposition} · Algorithm: {evaluation.algorithmVersion}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-muted-foreground">
                Alternatives evaluated against the preserved source and rule versions
              </caption>
              <thead>
                <tr>
                  <th className="p-2 text-left">Alternative</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Reasons / evidence</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.alternatives.map((a) => (
                  <tr key={a.actionId} className="border-t">
                    <td className="p-2">{a.label}</td>
                    <td className="p-2">{a.status}</td>
                    <td className="p-2">
                      {a.checks.map((c, i) => (
                        <div key={`${c.ruleId}-${i}`}>
                          {c.ruleId} v{c.version}: {c.reason} (
                          {c.evidenceIds.join(", ") || "missing"})
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Approval: {stored?.snapshot?.workflow?.phase ?? "awaiting_approval"}; execution:{" "}
            {stored?.snapshot?.workflow?.executionRef ?? "not_executed"}; outcome:{" "}
            {stored?.snapshot?.workflow?.result ?? "unverified"}. No verified savings.
          </p>
          {demo?.opportunity && (
            <pre
              className="overflow-x-auto text-xs p-3 bg-muted rounded"
              aria-label="Opportunity qualification"
            >
              {JSON.stringify(
                { opportunity: demo.opportunity, economics: demo.economics },
                null,
                2,
              )}
            </pre>
          )}
          <details>
            <summary className="cursor-pointer text-sm">
              Inspect companies, operating records, relationships and evidence
            </summary>
            <pre className="max-h-96 overflow-auto text-xs p-3">
              {JSON.stringify(evaluation.inputSnapshot, null, 2)}
            </pre>
          </details>
        </div>
      )}
      <details>
        <summary className="cursor-pointer font-medium">Isolated authenticated workspace</summary>
        <div className="space-y-3 pt-3">
          <p className="text-sm text-muted-foreground">
            Uses existing sign-in. Administrators receive no automatic commercial, quality or safety
            authority. A second explicitly authorized user must verify and approve. No production
            endpoint is accepted.
          </p>
          <label className="block text-sm">
            Existing plant ID{" "}
            <input
              aria-label="Core plant ID"
              inputMode="numeric"
              className="rounded border bg-background p-2"
              value={factory}
              disabled={busy || !!pending.current}
              onChange={(e) => {
                setFactory(e.target.value);
                setStored(null);
              }}
            />
          </label>
          <label className="block text-sm">
            Workspace UUID{" "}
            <input
              aria-label="Core workspace UUID"
              className="w-full rounded border bg-background p-2"
              value={workspace}
              disabled={busy || !!pending.current}
              onChange={(e) => {
                setWorkspace(e.target.value);
                setStored(null);
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !!pending.current}
              variant="outline"
              onClick={() =>
                void run(async () => {
                  setStored(
                    await post(
                      { action: "load", workspaceId: workspace, factoryId: Number(factory) },
                      true,
                    ),
                  );
                })
              }
            >
              Load saved workspace
            </Button>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => void mutate("create", { scenario })}
            >
              Create synthetic workspace
            </Button>
            <Button
              disabled={busy || !stored}
              variant="outline"
              onClick={() => void mutate("verify_input")}
            >
              Verify synthetic inputs
            </Button>
            <Button
              disabled={busy || !stored}
              variant="outline"
              onClick={() => void mutate("evaluate")}
            >
              Evaluate saved inputs
            </Button>
            <Button
              disabled={busy || !evaluation?.recommendation}
              variant="outline"
              onClick={() =>
                void mutate("request_approval", {
                  actionId: evaluation?.recommendation,
                  kind: "order_acceptance",
                })
              }
            >
              Request approval
            </Button>
            <Button
              disabled={busy || !stored?.snapshot?.workflow}
              variant="outline"
              onClick={() => void mutate("approve")}
            >
              Approve within my authority
            </Button>
            <Button
              disabled={busy || !stored?.snapshot?.workflow}
              variant="outline"
              onClick={() => void mutate("execute")}
            >
              Execute internal test step
            </Button>
          </div>
          {pending.current && (
            <p className="text-sm">
              An operation is awaiting a confirmed receipt. Use a mutation button to retry the
              identical request; inputs stay locked to preserve idempotency.
            </p>
          )}
          {stored && (
            <p className="text-sm">
              Saved revision {stored.revision}; retained audit entries: {stored.audit.length}.
              Export or inspection does not certify authenticity.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
