import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordForm, type Field } from "./record-form";
import { textField, recordFields, periodFields, eventFields, findingFields } from "./fields";
import { caseSchema, type Investigation } from "@/lib/investigation/schema";
import {
  caseCommandSchema,
  storedCaseSchema,
  type CaseCommand,
  type StoredCase,
} from "@/lib/investigation/connected-contract";
import { evaluateCase } from "@/lib/investigation/engine";
import { decisionBrief, internalEconomics, statementOfWork } from "@/lib/investigation/brief";

async function call(command: CaseCommand): Promise<unknown> {
  caseCommandSchema.parse(command);
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sign in before using connected cases.");
  const response = await fetch("/api/investigations", {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(command),
  });
  const body: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      typeof body === "object" && body && "error" in body
        ? String(body.error)
        : "Case request failed",
    );
  return body;
}
function exportText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const scopeFields: Field[] = [
  textField("question", "Decision question", "multiline"),
  textField("owner", "Decision owner"),
  textField("site", "Invented site"),
  textField("boundary", "Case boundary", "multiline"),
  textField("from", "Start date", "date"),
  textField("to", "End date", "date"),
  textField("exclusions", "Exclusions", "multiline"),
  textField("acceptance", "Acceptance criteria", "multiline"),
  textField("stopRules", "Stop conditions", "multiline"),
  textField("alternative", "Current alternative", "multiline"),
  textField("residualGap", "Unresolved gap", "multiline"),
];

/** Functional server-backed controls; Lovable owns their final visual treatment. */
export function ConnectedInvestigationWorkbench() {
  const [signedIn, setSignedIn] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [factories, setFactories] = useState<{ id: number; name: string }[]>([]);
  const [cases, setCases] = useState<
    { id: string; factoryId: number; revision: number; role: string }[]
  >([]);
  const [stored, setStored] = useState<StoredCase | null>(null);
  const [step, setStep] = useState("Scope");
  const [reason, setReason] = useState("");
  const retry = useRef<CaseCommand | null>(null);
  useEffect(() => {
    let active = true;
    try {
      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (active) {
            setSignedIn(!!data.session);
            setSessionReady(true);
          }
        })
        .catch(() => {
          if (active) {
            setError("Connect an isolated development backend before signing in.");
            setSessionReady(true);
          }
        });
    } catch {
      setError("Connect an isolated development backend before signing in.");
      setSessionReady(true);
    }
    return () => {
      active = false;
    };
  }, []);
  const refresh = async () => {
    const [f, list] = await Promise.all([
      supabase.from("factories").select("id,name"),
      call({ action: "list" }),
    ]);
    if (f.error) throw new Error("Factory membership could not be loaded.");
    setFactories((f.data ?? []).map((v) => ({ id: v.id, name: v.name })));
    if (typeof list !== "object" || !list || !("cases" in list) || !Array.isArray(list.cases))
      throw new Error("Invalid case list");
    setCases(list.cases);
  };
  const safe = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  };
  const run = async (command: CaseCommand) => {
    retry.current = command;
    const result = await call(command);
    if (typeof result === "object" && result && "snapshot" in result) {
      const parsed = storedCaseSchema.parse(result);
      setStored(parsed);
      setCases((previous) =>
        previous.map((row) =>
          row.id === parsed.caseId
            ? { ...row, revision: parsed.headRevision ?? parsed.revision, role: parsed.role }
            : row,
        ),
      );
    }
  };
  const c = stored?.snapshot;
  const current = !!stored && (stored.headRevision ?? stored.revision) === stored.revision;
  const editor = current && stored?.role !== "reviewer";
  const save = async (snapshot: Investigation) => {
    if (!stored) throw new Error("Select a case");
    if (!reason.trim()) throw new Error("Explain the correction before saving.");
    await run({
      action: "save",
      caseId: stored.caseId,
      expectedRevision: stored.revision,
      requestKey: crypto.randomUUID(),
      snapshot: caseSchema.parse(snapshot),
      reason,
    });
  };
  const replace = async (
    key: "evidence" | "periods" | "events" | "findings" | "labor" | "expenses" | "payments",
    i: number,
    value: unknown,
  ) => {
    if (!c) return;
    await save(
      caseSchema.parse({ ...c, [key]: c[key].map((v, index) => (i === index ? value : v)) }),
    );
  };
  const record = (title: string, content: ReactNode) => (
    <section className="panel min-w-0 p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {content}
    </section>
  );
  const evaluation = c ? evaluateCase(c) : null;
  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-5 p-4 sm:p-8">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <div className="eyebrow">GridMind / Connected method workspace</div>
          <h1 className="text-2xl font-semibold">Persisted investigations</h1>
        </div>
        <Button variant="outline" asChild>
          <Link to="/investigations">Offline synthetic workspace</Link>
        </Button>
      </header>
      <p className="rounded-md border border-warning bg-warning-soft p-4 text-sm">
        <strong>SYNTHETIC ONLY.</strong> Server-backed storage and authenticated actors. Reviews are
        simulated; customer release stays BLOCKED. No factory-file upload or real-data use.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {!signedIn ? (
        record(
          "Sign in to the isolated workspace",
          <form
            method="post"
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void safe(async () => {
                const { error } = await supabase.auth.signInWithPassword({
                  email: String(fd.get("email")),
                  password: String(fd.get("password")),
                });
                if (error) throw new Error("Sign-in failed");
                setSignedIn(true);
                await refresh();
              });
            }}
          >
            <label>
              Email
              <Input
                name="email"
                type="email"
                disabled={!sessionReady}
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <Input
                name="password"
                type="password"
                disabled={!sessionReady}
                required
                autoComplete="current-password"
              />
            </label>
            <Button disabled={busy || !sessionReady}>
              {sessionReady ? "Sign in" : "Preparing sign-in…"}
            </Button>
          </form>,
        )
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={() => void safe(refresh)}>
              Load my cases
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void safe(async () => {
                  await supabase.auth.signOut();
                  setSignedIn(false);
                  setStored(null);
                  setCases([]);
                  setFactories([]);
                  retry.current = null;
                })
              }
            >
              Sign out
            </Button>
            {retry.current && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void safe(() => run(retry.current!))}
              >
                Retry last request
              </Button>
            )}
          </div>
          {record(
            "Create an invented case",
            <form
              className="flex flex-wrap gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void safe(async () => {
                  await run({
                    action: "create",
                    caseId: crypto.randomUUID(),
                    factoryId: Number(fd.get("factory")),
                    candidate: String(fd.get("candidate")) as "C1" | "C4",
                    requestKey: crypto.randomUUID(),
                  });
                  await refresh();
                });
              }}
            >
              <label>
                Authorized factory
                <select
                  name="factory"
                  aria-label="Authorized factory"
                  className="ml-2 border p-2"
                  required
                >
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Method
                <select name="candidate" aria-label="Method" className="ml-2 border p-2">
                  <option value="C4">C4 synthetic period comparison</option>
                  <option value="C1">C1 synthetic chronology</option>
                </select>
              </label>
              <Button disabled={busy || !factories.length}>Create synthetic case</Button>
            </form>,
          )}
          <div className="flex flex-wrap gap-2">
            {cases.map((v) => (
              <Button
                key={v.id}
                variant="outline"
                disabled={busy}
                onClick={() => void safe(() => run({ action: "load", caseId: v.id }))}
              >
                {v.id.slice(0, 8)} · v{v.revision} · {v.role}
              </Button>
            ))}
          </div>
          {c && stored && evaluation && (
            <>
              <section className="panel p-4 text-sm">
                <strong>Revision {stored.revision}</strong> · {stored.role} ·{" "}
                {evaluation.status.replaceAll("_", " ")}
                <p className="break-all text-xs">Snapshot SHA-256: {stored.snapshotSha256}</p>
                <p>Customer release: BLOCKED · {evaluation.issues.length} method blockers</p>
                {!current && (
                  <p>Historical revision — editing disabled. Load the latest case to continue.</p>
                )}
                <Button
                  variant="outline"
                  onClick={() => void safe(() => run({ action: "load", caseId: stored.caseId }))}
                >
                  Reload latest revision
                </Button>
              </section>
              <nav aria-label="Connected case workflow" className="flex flex-wrap gap-2">
                {[
                  "Scope",
                  "Evidence",
                  "Analysis",
                  "Findings",
                  "Review",
                  "Brief",
                  "Outcome",
                  "Economics",
                  "Access",
                  "History",
                ]
                  .filter((v) => stored.role !== "reviewer" || !["Economics", "Access"].includes(v))
                  .map((v) => (
                    <Button
                      key={v}
                      variant={step === v ? "default" : "outline"}
                      onClick={() => setStep(v)}
                    >
                      {v}
                    </Button>
                  ))}
              </nav>
              {editor && (
                <label>
                  Correction reason
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain the edit or correction"
                  />
                </label>
              )}
              <div
                key={`${stored.caseId}-${stored.revision}-${step}`}
                className="grid min-w-0 grid-cols-1 gap-4"
              >
                {step === "Scope" &&
                  record(
                    "Bounded scope",
                    editor ? (
                      <RecordForm
                        value={c.scope}
                        fields={scopeFields}
                        onSave={(v) => save(caseSchema.parse({ ...c, scope: v }))}
                      />
                    ) : (
                      <p className="text-sm">
                        {c.scope.question} · {c.scope.boundary}
                      </p>
                    ),
                  )}
                {step === "Evidence" &&
                  c.evidence.map((e, i) => (
                    <section key={e.id} className="panel p-5">
                      <h2 className="font-semibold">
                        {e.id} · {e.reference}
                      </h2>
                      <p className="my-3 text-sm">
                        {e.checked
                          ? `Verified for this synthetic method by ${e.verification?.actorId} at ${e.verification?.at}`
                          : "Source verification required"}
                      </p>
                      {editor && (
                        <RecordForm
                          value={e}
                          fields={recordFields.filter((f) => f.key !== "checked")}
                          onSave={(v) => replace("evidence", i, v)}
                        />
                      )}
                      <p className="my-3 text-sm">{e.verification?.basis ?? e.limitation}</p>
                      {current && (
                        <RecordForm
                          value={{ basis: "" }}
                          fields={[
                            textField("basis", "Source checks and verification basis", "multiline"),
                          ]}
                          label="Record source verification"
                          onSave={(v) =>
                            run({
                              action: "verify",
                              caseId: stored.caseId,
                              expectedRevision: stored.revision,
                              requestKey: crypto.randomUUID(),
                              evidenceId: e.id,
                              basis: String(v.basis),
                            })
                          }
                        />
                      )}
                    </section>
                  ))}
                {step === "Analysis" && (
                  <>
                    {record(
                      "Method blockers",
                      <ul className="list-disc pl-5 text-sm">
                        {evaluation.issues.map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                      </ul>,
                    )}
                    {record(
                      "Reproducible calculations",
                      <div className="text-sm">
                        {evaluation.calculations.map((v) => (
                          <p key={v.label}>
                            {v.label}: {v.result} {v.unit} · {v.formula} ·{" "}
                            {v.evidenceIds.join(", ")}
                          </p>
                        ))}
                      </div>,
                    )}
                    {c.candidate === "C4"
                      ? c.periods.map((v, i) => (
                          <div key={v.id}>
                            {record(
                              v.id,
                              editor ? (
                                <RecordForm
                                  value={v}
                                  fields={periodFields}
                                  onSave={(next) => replace("periods", i, next)}
                                />
                              ) : (
                                <p>
                                  {v.month} · {v.kwh} kWh · {v.production} {v.unit}
                                </p>
                              ),
                            )}
                          </div>
                        ))
                      : c.events.map((v, i) => (
                          <div key={v.id}>
                            {record(
                              v.id,
                              editor ? (
                                <RecordForm
                                  value={v}
                                  fields={eventFields}
                                  onSave={(next) => replace("events", i, next)}
                                />
                              ) : (
                                <p>
                                  {v.rawTime} · {v.description}
                                </p>
                              ),
                            )}
                          </div>
                        ))}
                  </>
                )}
                {step === "Findings" &&
                  c.findings.map((v, i) => (
                    <div key={v.id}>
                      {record(
                        v.id,
                        editor ? (
                          <RecordForm
                            value={v}
                            fields={findingFields}
                            onSave={(next) => replace("findings", i, next)}
                          />
                        ) : (
                          <p>
                            {v.type} · {v.statement} · {v.uncertainty}
                          </p>
                        ),
                      )}
                    </div>
                  ))}
                {step === "Review" && (
                  <>
                    {record(
                      "Review gate",
                      <p className="text-sm">
                        An explicitly assigned reviewer must be independent of the last editor. All
                        method blockers must be resolved before simulated acceptance. Material
                        changes invalidate the prior review.
                      </p>,
                    )}
                    {current &&
                      record(
                        "Simulated reviewer decision",
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
                            textField("reviewer", "Declared reviewer name"),
                            textField("competence", "Relevant competence"),
                            textField("scope", "Reviewed sources and claims", "multiline"),
                            {
                              key: "decision",
                              label: "Decision",
                              options: ["accept", "revise", "reject"],
                            },
                            textField("rationale", "Rationale and checks", "multiline"),
                            textField("dissent", "Unresolved dissent", "multiline"),
                          ]}
                          label="Record simulated review"
                          onSave={(v) =>
                            run({
                              action: "review",
                              caseId: stored.caseId,
                              expectedRevision: stored.revision,
                              requestKey: crypto.randomUUID(),
                              reviewer: String(v.reviewer),
                              competence: String(v.competence),
                              scope: String(v.scope),
                              decision: String(v.decision) as "accept" | "revise" | "reject",
                              rationale: String(v.rationale),
                              dissent: String(v.dissent),
                            })
                          }
                        />,
                      )}
                  </>
                )}
                {step === "Brief" && (
                  <>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          exportText(`${c.id}-v${c.revision}-SYNTHETIC.md`, decisionBrief(c))
                        }
                      >
                        Export persisted Decision Brief
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportText(`${c.id}-SOW.md`, statementOfWork(c))}
                      >
                        Export draft SOW
                      </Button>
                    </div>
                    {record(
                      "Persisted revision brief",
                      <pre className="whitespace-pre-wrap break-words font-sans text-sm">
                        {decisionBrief(c)}
                      </pre>,
                    )}
                  </>
                )}
                {step === "Outcome" && (
                  <>
                    {record(
                      "Customer decision",
                      editor ? (
                        <RecordForm
                          value={c.decision}
                          fields={[
                            {
                              key: "status",
                              label: "Decision status",
                              options: ["pending", "accepted", "declined", "deferred"],
                            },
                            textField("owner", "Decision owner"),
                            textField("rationale", "Decision rationale", "multiline"),
                            textField("at", "Decision date", "date"),
                          ]}
                          onSave={(v) => save(caseSchema.parse({ ...c, decision: v }))}
                        />
                      ) : (
                        <p>
                          {c.decision.status} · {c.decision.rationale}
                        </p>
                      ),
                    )}
                    {record(
                      "Outcome measurement",
                      editor ? (
                        <RecordForm
                          value={c.outcome}
                          fields={[
                            {
                              key: "status",
                              label: "Outcome status",
                              options: ["not_measured", "planned", "observed"],
                            },
                            textField("metric", "Metric"),
                            { key: "baseline", label: "Baseline", kind: "number", nullable: true },
                            {
                              key: "observed",
                              label: "Observed value",
                              kind: "number",
                              nullable: true,
                            },
                            textField("unit", "Unit"),
                            textField("from", "Start", "date"),
                            textField("to", "End", "date"),
                            textField("evidenceIds", "Source IDs", "ids"),
                            textField("confounders", "Confounders", "multiline"),
                          ]}
                          onSave={(v) => save(caseSchema.parse({ ...c, outcome: v }))}
                        />
                      ) : (
                        <p>
                          {c.outcome.status} · {c.outcome.confounders}
                        </p>
                      ),
                    )}
                  </>
                )}
                {step === "Economics" && editor && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportText(`${c.id}-INTERNAL-economics.md`, internalEconomics(c))
                      }
                    >
                      Export internal economics
                    </Button>
                    {c.labor.map((v, i) => (
                      <div key={v.id}>
                        {record(
                          "Effort",
                          <RecordForm
                            value={v}
                            fields={[
                              {
                                key: "role",
                                label: "Role",
                                options: ["founder", "analyst", "reviewer", "site"],
                              },
                              textField("task", "Task"),
                              textField("hours", "Hours", "number"),
                              textField("shadowRate", "Shadow INR/hour", "number"),
                            ]}
                            onSave={(next) => replace("labor", i, next)}
                          />,
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        void safe(() =>
                          save({
                            ...c,
                            labor: [
                              ...c.labor,
                              {
                                id: crypto.randomUUID(),
                                role: "founder",
                                task: "",
                                hours: 0,
                                shadowRate: 0,
                              },
                            ],
                          }),
                        )
                      }
                    >
                      Add effort
                    </Button>
                    {c.expenses.map((v, i) => (
                      <div key={v.id}>
                        {record(
                          "Direct cash cost",
                          <RecordForm
                            value={v}
                            fields={[
                              {
                                key: "category",
                                label: "Category",
                                options: ["reviewer", "travel", "tools", "rework", "other"],
                              },
                              textField("reference", "Expense reference"),
                              textField("amount", "INR", "number"),
                            ]}
                            onSave={(next) => replace("expenses", i, next)}
                          />,
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        void safe(() =>
                          save({
                            ...c,
                            expenses: [
                              ...c.expenses,
                              {
                                id: crypto.randomUUID(),
                                category: "reviewer",
                                reference: "",
                                amount: 0,
                              },
                            ],
                          }),
                        )
                      }
                    >
                      Add expense
                    </Button>
                    {c.payments.map((v, i) => (
                      <div key={v.id}>
                        {record(
                          "Commercial event",
                          <RecordForm
                            value={v}
                            fields={[
                              {
                                key: "stage",
                                label: "Stage",
                                options: ["quoted", "contracted", "invoiced", "collected"],
                              },
                              textField("at", "Date", "date"),
                              textField("reference", "Commercial reference"),
                              textField("amount", "INR", "number"),
                            ]}
                            onSave={(next) => replace("payments", i, next)}
                          />,
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        void safe(() =>
                          save({
                            ...c,
                            payments: [
                              ...c.payments,
                              {
                                id: crypto.randomUUID(),
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
                  </>
                )}
                {step === "Access" &&
                  stored.role === "manager" &&
                  current &&
                  record(
                    "Grant, revoke or expire a case assignment",
                    <RecordForm
                      value={{ userId: "", role: "reviewer", active: true, expiresAt: "" }}
                      fields={[
                        textField("userId", "Existing factory member user ID"),
                        { key: "role", label: "Assignment", options: ["investigator", "reviewer"] },
                        textField("active", "Active assignment", "checkbox"),
                        textField("expiresAt", "Expiry ISO timestamp (blank = no expiry)"),
                      ]}
                      label="Save scoped assignment"
                      onSave={(v) =>
                        run({
                          action: "assign",
                          caseId: stored.caseId,
                          expectedRevision: stored.revision,
                          requestKey: crypto.randomUUID(),
                          userId: String(v.userId),
                          role: String(v.role) as "investigator" | "reviewer",
                          active: v.active === true,
                          expiresAt: v.expiresAt ? String(v.expiresAt) : null,
                        })
                      }
                    />,
                  )}
                {step === "History" &&
                  record(
                    "Immutable case revisions (latest 100)",
                    <div className="grid gap-3">
                      {stored.history?.map((h) => (
                        <div key={h.revision} className="text-sm">
                          <p>
                            v{h.revision} · {h.at} · {h.actorId} · {String(h.event.kind)}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() =>
                              void safe(() =>
                                run({
                                  action: "load",
                                  caseId: stored.caseId,
                                  revision: h.revision,
                                }),
                              )
                            }
                          >
                            Open revision {h.revision}
                          </Button>
                        </div>
                      ))}
                    </div>,
                  )}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
