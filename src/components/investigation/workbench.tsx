import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RecordForm, type Field } from "./record-form";
import { caseSchema, type Investigation, type Workspace } from "@/lib/investigation/schema";
import { initialWorkspace, syntheticCase } from "@/lib/investigation/fixtures";
import {
  addCase,
  parseWorkspace,
  reviseCase,
  saveWorkspace,
  serializeWorkspace,
  STORAGE_KEY,
} from "@/lib/investigation/workspace";
import { addReview, caseEconomics, evaluateCase, outcomeIssues } from "@/lib/investigation/engine";
import { decisionBrief, internalEconomics, statementOfWork } from "@/lib/investigation/brief";

const steps = [
  "Scope",
  "Evidence",
  "Analysis",
  "Findings",
  "Review",
  "Brief",
  "Outcome",
  "Economics",
  "History",
] as const;
type Step = (typeof steps)[number];
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const textField = (key: string, label: string, kind?: Field["kind"]): Field => ({
  key,
  label,
  kind,
});
const recordFields: Field[] = [
  textField("reference", "Original source reference"),
  textField("owner", "Source owner"),
  textField("permitted", "Permitted for this synthetic exercise", "checkbox"),
  textField("checked", "Checked against the invented source", "checkbox"),
  textField("conflict", "Unresolved contradictions (blank only when resolved)", "multiline"),
  textField("limitation", "Source limitations", "multiline"),
  textField("retention", "Custody / retention / deletion rule"),
];
const periodFields: Field[] = [
  textField("evidenceId", "Source ID"),
  textField("invoiceId", "Invoice reference"),
  textField("month", "Period YYYY-MM"),
  textField("kwh", "Consumption (kWh)", "number"),
  textField("billedInr", "Documented bill amount (INR)", "number"),
  textField("production", "Conforming output", "number"),
  textField("unit", "Production basis (conforming units)"),
];
const eventFields: Field[] = [
  textField("evidenceId", "Source ID"),
  textField("rawTime", "Raw timestamp with timezone"),
  textField("clock", "Source clock"),
  textField("reconciledTime", "Reconciled timestamp with timezone"),
  textField("clockVerified", "Clock reconciliation verified in this exercise", "checkbox"),
  { key: "kind", label: "Boundary classification", options: ["observation", "stop", "restart"] },
  textField("description", "Observed event", "multiline"),
];
const findingFields: Field[] = [
  { key: "type", label: "Evidence class", options: ["observation", "hypothesis", "next_check"] },
  textField("statement", "Statement", "multiline"),
  textField("evidenceIds", "Supporting source IDs (comma separated)", "ids"),
  textField("counterEvidence", "Counter-evidence / alternative explanation", "multiline"),
  textField("uncertainty", "Limitations and uncertainty", "multiline"),
  textField("nextCheck", "Next discriminating evidence check", "multiline"),
  { key: "disposition", label: "Challenge state", options: ["open", "included", "rejected"] },
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel min-w-0 p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Messages({ items }: { items: string[] }) {
  return items.length ? (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((v, i) => (
        <li key={`${i}-${v}`}>{v}</li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">
      No method blockers in this synthetic revision. Real customer release remains blocked.
    </p>
  );
}
function download(name: string, content: string, type = "text/markdown") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function InvestigationWorkbench() {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [selected, setSelected] = useState("SYN-C4-01");
  const [step, setStep] = useState<Step>("Scope");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [backup, setBackup] = useState("");
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [reason, setReason] = useState("Synthetic exercise edit");
  const lastRaw = useRef<string | null>(null);

  useEffect(() => {
    try {
      lastRaw.current = localStorage.getItem(STORAGE_KEY);
      const current = lastRaw.current === null ? null : parseWorkspace(lastRaw.current);
      if (current) {
        setWorkspace(current);
        setSelected(current.cases[0]?.id ?? "");
      }
      setLoaded(true);
      setSaved(current ? "Loaded from this browser" : "Invented examples · not yet saved");
    } catch (e) {
      setError(
        `Saved workspace could not be loaded. Export/recover it before resetting. ${e instanceof Error ? e.message : "Storage unavailable"}`,
      );
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY)
        setError("Workspace changed in another tab. Reload before saving to avoid overwriting it.");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const c = workspace.cases.find((v) => v.id === selected) ?? workspace.cases[0];
  const evaluation = c ? evaluateCase(c) : null;
  const economics = c ? caseEconomics(c) : null;
  const persist = (next: Workspace, recovering = false) => {
    if (!loaded && !recovering) throw new Error("Recover or reset storage before editing.");
    if (localStorage.getItem(STORAGE_KEY) !== lastRaw.current)
      throw new Error("Another tab changed this workspace. Reload before saving.");
    saveWorkspace(localStorage, next);
    lastRaw.current = serializeWorkspace(next);
    setWorkspace(next);
    setLoaded(true);
    setError("");
    setSaved("Saved on this browser only");
  };
  const change = (next: Investigation, why = reason) => persist(reviseCase(workspace, next, why));
  const safe = (action: () => void) => {
    try {
      action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };
  const replace = <
    K extends "evidence" | "periods" | "events" | "findings" | "labor" | "expenses" | "payments",
  >(
    key: K,
    index: number,
    value: Investigation[K][number],
  ) => {
    if (!c) return;
    change(caseSchema.parse({ ...c, [key]: c[key].map((v, i) => (i === index ? value : v)) }));
  };

  const remove = (
    key: "evidence" | "periods" | "events" | "findings" | "labor" | "expenses" | "payments",
    index: number,
  ) =>
    safe(() => {
      if (!c || !reason.trim()) throw new Error("A correction/change reason is required.");
      if (
        !window.confirm(
          "Remove this record from the current revision? The original remains in History and unresolved source links will block analysis.",
        )
      )
        return;
      const record = c[key][index];
      change(
        caseSchema.parse({ ...c, [key]: c[key].filter((_, i) => i !== index) }),
        `Removed ${key}/${record.id}: ${reason}`,
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="eyebrow">GridMind / Internal investigation</div>
            <h1 className="mt-1 text-2xl font-semibold">Evidence to decision</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">Existing workspace</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto grid grid-cols-1 max-w-6xl gap-5 px-4 py-6 sm:px-8">
        <div className="rounded-md border border-warning bg-warning-soft p-4 text-sm">
          <strong>SYNTHETIC METHOD WORKSPACE</strong> · Invented records only. Browser storage is
          local to this device. No customer files, real reviewer sign-off, production release or
          verified savings.
        </div>
        {error && (
          <div role="alert" className="rounded-md border border-danger p-4 text-sm text-danger">
            {error}
            <Button className="ml-3" variant="outline" onClick={() => window.location.reload()}>
              Reload saved workspace
            </Button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="grid min-w-0 max-w-full gap-1 text-sm">
            Investigation
            <select
              aria-label="Investigation"
              value={c?.id ?? ""}
              onChange={(e) => setSelected(e.target.value)}
              className="min-w-0 max-w-full rounded-md border border-input bg-card p-2"
            >
              {workspace.cases.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} · {v.title}
                </option>
              ))}
            </select>
          </label>
          {(["C1", "C4"] as const).map((candidate) => (
            <Button
              key={candidate}
              variant="outline"
              disabled={!loaded}
              onClick={() =>
                safe(() => {
                  const next = syntheticCase(candidate, uid(`SYN-${candidate}`));
                  persist(addCase(workspace, next));
                  setSelected(next.id);
                  setStep("Scope");
                })
              }
            >
              New {candidate} exercise
            </Button>
          ))}
          <span className="text-xs text-muted-foreground" role="status">
            {saved || "Preparing local workspace…"}
          </span>
        </div>
        {c && evaluation && economics && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Panel title="Current case">
                <p className="text-sm">
                  {c.candidate} · Revision {c.revision}
                </p>
                <p className="text-sm text-muted-foreground">{c.scope.question}</p>
              </Panel>
              <Panel title="Method status">
                <p className="font-mono text-sm">{evaluation.status.replaceAll("_", " ")}</p>
                <p className="text-sm">
                  {evaluation.issues.length} blockers · {c.evidence.length} sources
                </p>
              </Panel>
              <Panel title="Customer release">
                <p className="font-semibold text-danger">BLOCKED — synthetic only</p>
                <p className="text-sm">Qualified review and customer gates remain outstanding.</p>
              </Panel>
            </div>
            <nav aria-label="Case workflow" className="flex flex-wrap gap-2">
              {steps.map((name, index) => (
                <Button
                  key={name}
                  variant={step === name ? "default" : "outline"}
                  aria-current={step === name ? "step" : undefined}
                  onClick={() => setStep(name)}
                >
                  {index + 1}. {name}
                </Button>
              ))}
            </nav>
            <label className="grid gap-1 text-sm">
              Reason recorded for each saved correction
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={4000}
                className="min-w-0 max-w-full rounded-md border border-input bg-card p-2"
              />
            </label>
            <div key={`${c.id}-${c.revision}-${step}`} className="grid gap-4">
              {step === "Scope" && (
                <>
                  <Panel title="Bound the decision">
                    <RecordForm
                      value={c.scope}
                      fields={[
                        textField("question", "Decision question", "multiline"),
                        textField("owner", "Decision owner / buyer"),
                        textField("site", "Fictional site"),
                        textField(
                          "boundary",
                          "Asset, meter and investigation boundary",
                          "multiline",
                        ),
                        textField("from", "Start date", "date"),
                        textField("to", "End date", "date"),
                        textField(
                          "alternative",
                          "Buyer’s current alternative (hypothesis until interviewed)",
                          "multiline",
                        ),
                        textField("residualGap", "Residual decision gap", "multiline"),
                        textField("exclusions", "Excluded activities", "multiline"),
                        textField("acceptance", "Deliverable acceptance criteria", "multiline"),
                        textField(
                          "stopRules",
                          "Evidence insufficiency / review / stop conditions",
                          "multiline",
                        ),
                      ]}
                      onSave={(scope) => change(caseSchema.parse({ ...c, scope }))}
                    />
                  </Panel>
                  <Panel title="Pause or stop the investigation">
                    <RecordForm
                      value={{ stopped: c.stopped, stopReason: c.stopReason }}
                      fields={[
                        textField("stopped", "Stop case", "checkbox"),
                        textField("stopReason", "Reason / required resolution", "multiline"),
                      ]}
                      onSave={(v) => change(caseSchema.parse({ ...c, ...v }))}
                    />
                  </Panel>
                  <Button
                    variant="outline"
                    className="justify-self-start"
                    onClick={() => download(`${c.id}-sow-draft.md`, statementOfWork(c))}
                  >
                    Download draft SOW
                  </Button>
                </>
              )}
              {step === "Evidence" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Record invented source references and verification. Corrections preserve the
                    complete previous version in History. No source files are uploaded.
                  </p>
                  {c.evidence.map((v, i) => (
                    <Panel key={v.id} title={`${v.id} · Source register`}>
                      <RecordForm
                        value={v}
                        fields={recordFields}
                        onSave={(next) => replace("evidence", i, next as typeof v)}
                      />
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => remove("evidence", i)}
                      >
                        Remove record (retained in History)
                      </Button>
                    </Panel>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      safe(() =>
                        change({
                          ...c,
                          evidence: [
                            ...c.evidence,
                            {
                              id: uid("E"),
                              reference: "",
                              owner: "",
                              origin: "synthetic",
                              permitted: false,
                              checked: false,
                              conflict: "",
                              receivedAt: new Date().toISOString(),
                              retention: "",
                              limitation: "",
                            },
                          ],
                        }),
                      )
                    }
                  >
                    Add invented source
                  </Button>
                </>
              )}
              {step === "Analysis" && (
                <>
                  <Panel title="Evidence and method blockers">
                    <Messages items={evaluation.issues} />
                  </Panel>
                  <Panel title="Reproducible results">
                    {evaluation.calculations.length ? (
                      evaluation.calculations.map((v) => (
                        <div key={v.label} className="mb-4 text-sm">
                          <strong>
                            {v.label}: {v.result} {v.unit}
                          </strong>
                          <p className="font-mono text-xs">{v.formula}</p>
                          <p>Sources: {v.evidenceIds.join(", ")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm">
                        Calculations withheld until material blockers are resolved.
                      </p>
                    )}
                  </Panel>
                  {c.candidate === "C4" ? (
                    <>
                      {c.periods.map((v, i) => (
                        <Panel key={v.id} title={`${v.id} · Billing / production period`}>
                          <RecordForm
                            value={v}
                            fields={periodFields}
                            onSave={(next) => replace("periods", i, next as typeof v)}
                          />
                          <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => remove("periods", i)}
                          >
                            Remove record (retained in History)
                          </Button>
                        </Panel>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() =>
                          safe(() =>
                            change({
                              ...c,
                              periods: [
                                ...c.periods,
                                {
                                  id: uid("P"),
                                  evidenceId: c.evidence[0]?.id ?? "E",
                                  invoiceId: "",
                                  month: "",
                                  kwh: 0,
                                  billedInr: 0,
                                  production: 0,
                                  unit: "conforming units",
                                },
                              ],
                            }),
                          )
                        }
                      >
                        Add synthetic period
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">
                        Raw clocks remain unchanged unless explicitly corrected. Enter reconciled
                        ISO timestamps with timezone and record the reason before calculating stop
                        duration. No recurrence rate, lost output or root cause is inferred.
                      </p>
                      {c.events.map((v, i) => (
                        <Panel key={v.id} title={`${v.id} · Timeline event`}>
                          <RecordForm
                            value={v}
                            fields={eventFields}
                            onSave={(next) => replace("events", i, next as typeof v)}
                          />
                          <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => remove("events", i)}
                          >
                            Remove record (retained in History)
                          </Button>
                        </Panel>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() =>
                          safe(() =>
                            change({
                              ...c,
                              events: [
                                ...c.events,
                                {
                                  id: uid("T"),
                                  evidenceId: c.evidence[0]?.id ?? "E",
                                  rawTime: "",
                                  reconciledTime: "",
                                  clock: "",
                                  clockVerified: false,
                                  kind: "observation",
                                  description: "",
                                },
                              ],
                            }),
                          )
                        }
                      >
                        Add synthetic event
                      </Button>
                    </>
                  )}
                </>
              )}
              {step === "Findings" && (
                <>
                  <Panel title="Method observations">
                    <Messages items={evaluation.observations} />
                  </Panel>
                  <p className="text-sm">
                    Keep hypotheses and next checks distinct. Open challenges block review
                    acceptance; rejected findings remain in history and are excluded from the
                    executive findings.
                  </p>
                  {c.findings.map((v, i) => (
                    <Panel key={v.id} title={`${v.id} · Finding / challenge`}>
                      <RecordForm
                        value={v}
                        fields={findingFields}
                        onSave={(next) => replace("findings", i, next as typeof v)}
                      />
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => remove("findings", i)}
                      >
                        Remove record (retained in History)
                      </Button>
                    </Panel>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      safe(() =>
                        change({
                          ...c,
                          findings: [
                            ...c.findings,
                            {
                              id: uid("F"),
                              type: "hypothesis",
                              statement: "",
                              evidenceIds: [],
                              counterEvidence: "",
                              uncertainty: "",
                              nextCheck: "",
                              disposition: "open",
                            },
                          ],
                        }),
                      )
                    }
                  >
                    Add finding / challenge
                  </Button>
                </>
              )}
              {step === "Review" && (
                <>
                  <Panel title="Review gate">
                    <Messages items={evaluation.issues} />
                    <p className="mt-3 text-sm">
                      All review actions here are simulated. Acceptance binds to the exact technical
                      content; later evidence or scope edits require review again.
                    </p>
                    {evaluation.review && (
                      <p className="mt-2 text-sm">
                        Latest: {evaluation.review.decision} · {evaluation.review.reviewer} ·{" "}
                        {evaluation.reviewCurrent
                          ? "current content"
                          : "STALE — re-review required"}
                      </p>
                    )}
                  </Panel>
                  <Panel title="Record a simulated review">
                    <RecordForm
                      value={{
                        reviewer: "",
                        competence: "",
                        scope: "",
                        decision: "revise",
                        rationale: "",
                        dissent: "",
                      }}
                      fields={[
                        textField("reviewer", "Reviewer identity (fictional exercise)"),
                        textField("competence", "Relevant qualification and competence"),
                        textField(
                          "scope",
                          "Sources, calculations and claims reviewed",
                          "multiline",
                        ),
                        {
                          key: "decision",
                          label: "Review decision",
                          options: ["revise", "reject", "accept"],
                        },
                        textField(
                          "rationale",
                          "Feedback, corrections and decision rationale",
                          "multiline",
                        ),
                        textField("dissent", "Unresolved dissent / limitations", "multiline"),
                      ]}
                      label="Record simulated review"
                      onSave={(v) =>
                        change(
                          addReview(c, {
                            ...v,
                            id: uid("R"),
                            at: new Date().toISOString(),
                          } as Parameters<typeof addReview>[1]),
                          "Recorded simulated review",
                        )
                      }
                    />
                  </Panel>
                </>
              )}
              {step === "Brief" && (
                <>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        download(`${c.id}-v${c.revision}-SYNTHETIC-brief.md`, decisionBrief(c))
                      }
                    >
                      Download synthetic Decision Brief
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => download(`${c.id}-sow-draft.md`, statementOfWork(c))}
                    >
                      Download draft SOW
                    </Button>
                  </div>
                  <Panel title="Versioned brief preview">
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
                      {decisionBrief(c)}
                    </pre>
                  </Panel>
                </>
              )}
              {step === "Outcome" && (
                <>
                  <Panel title="Customer-owned decision (simulated)">
                    <RecordForm
                      value={c.decision}
                      fields={[
                        {
                          key: "status",
                          label: "Decision",
                          options: ["pending", "accepted", "declined", "deferred"],
                        },
                        textField("owner", "Decision owner"),
                        textField("rationale", "Reason / chosen next step", "multiline"),
                        textField("at", "Decision date", "date"),
                      ]}
                      onSave={(v) => change(caseSchema.parse({ ...c, decision: v }))}
                    />
                  </Panel>
                  <Panel title="Follow-up measurement">
                    <Messages items={outcomeIssues(c)} />
                    <div className="mt-4">
                      <RecordForm
                        value={c.outcome}
                        fields={[
                          {
                            key: "status",
                            label: "Measurement state",
                            options: ["not_measured", "planned", "observed"],
                          },
                          textField("metric", "Metric"),
                          {
                            key: "baseline",
                            label: "Baseline (blank = unknown)",
                            kind: "number",
                            nullable: true,
                          },
                          {
                            key: "observed",
                            label: "Observed value (blank = unknown)",
                            kind: "number",
                            nullable: true,
                          },
                          textField("unit", "Unit"),
                          textField("from", "Window start", "date"),
                          textField("to", "Window end", "date"),
                          textField("evidenceIds", "Source IDs", "ids"),
                          textField("confounders", "Confounders / attribution limits", "multiline"),
                        ]}
                        onSave={(v) => change(caseSchema.parse({ ...c, outcome: v }))}
                      />
                    </div>
                    <p className="mt-3 text-sm">
                      An observed change is not attributable verified savings. Customer acceptance
                      never marks implementation or success automatically.
                    </p>
                  </Panel>
                </>
              )}
              {step === "Economics" && (
                <>
                  <Panel title="Internal case economics">
                    <Messages items={economics.issues} />
                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      {Object.entries({
                        "Total hours": economics.hours,
                        "Direct cash cost (INR)": economics.cashCost,
                        "Founder/analyst shadow labor (INR)": economics.shadowLabor,
                        "Break-even before overhead/contingency (INR)":
                          economics.breakEvenBeforeOverhead,
                        "Quoted (INR)": economics.sums.quoted,
                        "Contracted (INR)": economics.sums.contracted,
                        "Invoiced (INR)": economics.sums.invoiced,
                        "Collected (INR)": economics.sums.collected,
                        "Cash contribution (INR)": economics.cashContribution,
                        "Adjusted contribution (INR)": economics.adjustedContribution,
                      }).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-muted-foreground">{key}</dt>
                          <dd className="font-mono">
                            {value === null ? "Not established" : value.toLocaleString("en-IN")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Reviewer invoices belong in cash expenses. Only founder/analyst hours use
                      shadow rates; avoid also recording those hours as cash labor. Acquisition,
                      overhead and contingency are additional pricing considerations. Every entry is
                      synthetic.
                    </p>
                  </Panel>
                  {c.labor.map((v, i) => (
                    <Panel key={v.id} title="Effort record">
                      <RecordForm
                        value={v}
                        fields={[
                          {
                            key: "role",
                            label: "Role",
                            options: ["founder", "analyst", "reviewer", "site"],
                          },
                          textField("task", "Activity / rework"),
                          textField("hours", "Actual exercise hours", "number"),
                          textField("shadowRate", "Founder/analyst shadow INR per hour", "number"),
                        ]}
                        onSave={(next) => replace("labor", i, next as typeof v)}
                      />
                      <Button variant="outline" className="mt-3" onClick={() => remove("labor", i)}>
                        Remove record (retained in History)
                      </Button>
                    </Panel>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      safe(() =>
                        change({
                          ...c,
                          labor: [
                            ...c.labor,
                            { id: uid("L"), role: "founder", task: "", hours: 0, shadowRate: 0 },
                          ],
                        }),
                      )
                    }
                  >
                    Add effort record
                  </Button>
                  {c.expenses.map((v, i) => (
                    <Panel key={v.id} title="Direct cash expense">
                      <RecordForm
                        value={v}
                        fields={[
                          {
                            key: "category",
                            label: "Category",
                            options: ["reviewer", "travel", "tools", "rework", "other"],
                          },
                          textField("reference", "Unique receipt / expense reference"),
                          textField("amount", "INR", "number"),
                        ]}
                        onSave={(next) => replace("expenses", i, next as typeof v)}
                      />
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => remove("expenses", i)}
                      >
                        Remove record (retained in History)
                      </Button>
                    </Panel>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      safe(() =>
                        change({
                          ...c,
                          expenses: [
                            ...c.expenses,
                            { id: uid("X"), category: "reviewer", reference: "", amount: 0 },
                          ],
                        }),
                      )
                    }
                  >
                    Add cash expense
                  </Button>
                  {c.payments.map((v, i) => (
                    <Panel key={v.id} title="Commercial event — simulated">
                      <RecordForm
                        value={v}
                        fields={[
                          {
                            key: "stage",
                            label: "Actual stage of this exercise",
                            options: ["quoted", "contracted", "invoiced", "collected"],
                          },
                          textField("at", "Date", "date"),
                          textField("reference", "Quote / agreement / invoice / receipt reference"),
                          textField("amount", "INR", "number"),
                        ]}
                        onSave={(next) => replace("payments", i, next as typeof v)}
                      />
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => remove("payments", i)}
                      >
                        Remove record (retained in History)
                      </Button>
                    </Panel>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      safe(() =>
                        change({
                          ...c,
                          payments: [
                            ...c.payments,
                            {
                              id: uid("PAY"),
                              stage: "quoted",
                              at: new Date().toISOString().slice(0, 10),
                              reference: "",
                              amount: 0,
                            },
                          ],
                        }),
                      )
                    }
                  >
                    Add commercial event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => download(`${c.id}-INTERNAL-economics.md`, internalEconomics(c))}
                  >
                    Download internal economics
                  </Button>
                </>
              )}
              {step === "History" && (
                <>
                  <Panel title="Retained revisions">
                    <p className="mb-3 text-sm">
                      Every saved correction retains its previous full case snapshot. Export any
                      earlier draft with its original sources and review state.
                    </p>
                    {workspace.history
                      .filter((h) => h.caseId === c.id)
                      .slice()
                      .reverse()
                      .map((h) => (
                        <div
                          key={h.revision}
                          className="mb-3 flex flex-wrap items-center gap-3 border-b pb-3 text-sm"
                        >
                          <span>
                            Revision {h.revision} · {h.at} · {h.reason}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() =>
                              download(
                                `${c.id}-v${h.revision}-historical-SYNTHETIC.md`,
                                decisionBrief(h.before),
                              )
                            }
                          >
                            Export historical brief
                          </Button>
                        </div>
                      ))}
                  </Panel>
                </>
              )}
            </div>
          </>
        )}
        <Panel title="Synthetic workspace backup and recovery">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                safe(() =>
                  download(
                    "gridmind-synthetic-workspace.json",
                    serializeWorkspace(workspace),
                    "application/json",
                  ),
                )
              }
            >
              Export workspace backup
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                safe(() =>
                  download(
                    "gridmind-saved-raw-backup.txt",
                    localStorage.getItem(STORAGE_KEY) ?? "No saved workspace",
                    "text/plain",
                  ),
                )
              }
            >
              Export raw saved data
            </Button>
            <Button variant="outline" onClick={() => setRestoreOpen(!restoreOpen)}>
              Restore synthetic backup
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                safe(() => {
                  if (
                    !window.confirm(
                      "Delete this browser’s synthetic workspace and history? Export a backup first.",
                    )
                  )
                    return;
                  const next = initialWorkspace();
                  saveWorkspace(localStorage, next);
                  lastRaw.current = serializeWorkspace(next);
                  setWorkspace(next);
                  setSelected(next.cases[0].id);
                  setLoaded(true);
                  setError("");
                  setSaved("Reset to invented examples");
                })
              }
            >
              Reset synthetic examples
            </Button>
          </div>
          {restoreOpen && (
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm">
                Paste an exported synthetic workspace JSON. Real customer records are prohibited.
                <Textarea
                  aria-label="Synthetic backup JSON"
                  value={backup}
                  onChange={(e) => setBackup(e.target.value)}
                  maxLength={4_000_000}
                  rows={6}
                />
              </label>
              <Button
                variant="outline"
                onClick={() =>
                  safe(() => {
                    const next = parseWorkspace(backup);
                    if (
                      !window.confirm(
                        "Replace the current synthetic workspace with this validated backup?",
                      )
                    )
                      return;
                    persist(next, true);
                    setSelected(next.cases[0]?.id ?? "");
                    setBackup("");
                    setRestoreOpen(false);
                  })
                }
              >
                Validate and restore backup
              </Button>
            </div>
          )}
        </Panel>
      </main>
    </div>
  );
}
