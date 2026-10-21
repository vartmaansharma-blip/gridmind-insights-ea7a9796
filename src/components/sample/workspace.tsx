import { AskGridMind } from "./ask-gridmind";
import { SampleDraftProvider } from "./form-drafts";
import { useSampleDrafts } from "@/lib/sample/draft-context";
import { usePreferences, formatSampleTime } from "@/lib/preferences";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { sampleLocation, samplePath, viewForSection } from "@/lib/sample/navigation";
import { SampleRecordDetail, RecordLink, EvidenceCard } from "./record-detail";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import { DashboardFrame } from "@/components/gm/dashboard-frame";
import { Button } from "@/components/ui/button";
import { OperationsPlanSummary } from "@/components/investigation/planning-workspace";
import {
  createSampleWorkspace,
  applySampleCommand,
  records,
  entity,
  sections,
  incidentKinds,
  linkedOrders,
  latestDecision,
  machineStopped,
  productProcess,
  samplePlan,
  exportSample,
  type SampleCommand,
  type SampleWorkspace,
  type SampleCase,
  type IncidentKind,
} from "@/lib/sample/workspace";
import type { PlanningResult } from "@/lib/industrial-core/planning";
const fieldClass =
  "mt-1 block w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm";
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel min-w-0 space-y-4 p-4 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function RecordList({ rows, s }: { rows: { id: string; label: string }[]; s: SampleWorkspace }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="py-2 text-sm">
          <RecordLink s={s} id={r.id} />
        </li>
      ))}
    </ul>
  );
}
function Form({
  name,
  onSubmit,
  children,
  busy,
  scope = "",
}: {
  scope?: string;
  name: string;
  onSubmit: (data: FormData) => Promise<boolean>;
  children: ReactNode;
  busy: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const drafts = useSampleDrafts();
  const draftName = `${scope}:${name}`;
  useEffect(() => {
    ref.current?.reset();
    for (const [key, value] of drafts?.get(draftName) ?? []) {
      const control = ref.current?.elements.namedItem(key);
      if (
        control instanceof HTMLInputElement ||
        control instanceof HTMLTextAreaElement ||
        control instanceof HTMLSelectElement
      ) {
        // Controlled selectors also retain their parent state; saved values restore unsubmitted plain fields.
        control.value = value;
      }
    }
  }, [drafts, draftName]);
  return (
    <form
      ref={ref}
      aria-label={name}
      className="space-y-3"
      onChange={() => {
        if (ref.current)
          drafts?.set(
            draftName,
            [...new FormData(ref.current)].filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          );
      }}
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (await onSubmit(data)) {
          drafts?.delete(draftName);
          ref.current?.reset();
        }
      }}
    >
      <fieldset disabled={busy} className="grid min-w-0 gap-3 sm:grid-cols-2">
        {children}
      </fieldset>
      <Button type="submit" variant="cta" disabled={busy}>
        {name}
      </Button>
    </form>
  );
}
const val = (f: FormData, k: string) => String(f.get(k) ?? "");
export function SampleOrganizationWorkspace() {
  return (
    <SampleDraftProvider>
      <SampleWorkspaceContent />
    </SampleDraftProvider>
  );
}
function SampleWorkspaceContent() {
  const drafts = useSampleDrafts();
  const { preferences, update: updatePreferences } = usePreferences();
  const routerNavigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const location = sampleLocation(pathname);
  const section = location.section;
  const setSection = (value: (typeof sections)[number]) => {
    void routerNavigate({
      to: "/explore/$",
      params: { _splat: samplePath(viewForSection(value)) },
    });
  };
  const [s, setState] = useState<SampleWorkspace>(() => createSampleWorkspace());
  const [ready, setReady] = useState(false),
    [entered, setEntered] = useState(() => pathname.replace(/\/$/, "") !== "/explore"),
    [setup, setSetup] = useState(false);
  const guided = preferences.guided;
  const setGuided = (value: boolean) => updatePreferences({ guided: value });
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [selectedCase, setSelectedCase] = useState<string>(""),
    [selectedMachine, setSelectedMachine] = useState("press"),
    [editMachine, setEditMachine] = useState<string | null>(null);
  const [product, setProduct] = useState("part"),
    [process, setProcess] = useState("stamping"),
    [kind, setKind] = useState<IncidentKind>("machine_stop"),
    [plan, setPlan] = useState<PlanningResult | null>(null);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    let cancelled = false;
    setPlan(null);
    void samplePlan(s)
      .then((p) => {
        if (!cancelled) setPlan(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [s]);
  async function dispatch(command: SampleCommand) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await applySampleCommand(s, command);
      setState(next);
      if (command.type === "incident") setSelectedCase(next.cases.at(-1)!.id);
      setNotice(`Sample ${command.type.replaceAll("_", " ")} saved in this session.`);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sample change failed.");
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const machines = records(s, "resource").filter((r) => r.attributes.resourceType === "machine"),
    lines = records(s, "resource").filter((r) => r.attributes.resourceType === "line");
  const requestedCaseId = ["investigations", "decisions"].includes(location.view)
    ? location.recordId
    : undefined;
  const c = requestedCaseId
    ? s.cases.find((c) => c.id === requestedCaseId)
    : (s.cases.find((c) => c.id === selectedCase) ?? s.cases.at(-1));
  const navigate = (next: (typeof sections)[number]) => {
    setSection(next);
    setError("");
  };
  const related = (id: string) => {
    setSelectedMachine(id);
    void routerNavigate({ to: "/explore/$", params: { _splat: `machines/${id}` } });
  };
  async function download() {
    const report = await exportSample(s);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2) + "\n"], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "gridmind-organization-SYNTHETIC.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const formBusy = busy || !ready;
  return (
    <DashboardFrame
      links={[{ to: "/explore", label: "Sample workspace", icon: LayoutDashboard }]}
      sidebarFooter={
        <>
          <p className="font-semibold text-cta">Sample Workspace</p>
          <p className="mt-2">
            Fictional organization. No real account, membership, machinery or customer data.
          </p>
          <p className="mt-3">Manually explore a connected manufacturing decision.</p>
        </>
      }
      header={
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="eyebrow">Sample Workspace · SYNTHETIC</p>
            <p className="font-semibold break-words">{s.profile.organization}</p>
            <p className="text-xs text-muted-foreground">
              {s.profile.factory} · Demo Operations Manager
            </p>
          </div>
          <Button
            disabled={formBusy}
            variant="outline"
            onClick={() => {
              drafts?.clear();
              setState(createSampleWorkspace());
              setPlan(null);
              setEntered(false);
              setSetup(false);
              setSelectedCase("");
              setEditMachine(null);
              setProduct("part");
              setProcess("stamping");
              setSelectedMachine("press");
              void routerNavigate({ to: "/explore" });
              setError("");
              setNotice("Original fictional workspace restored.");
            }}
          >
            Reset Sample Workspace
          </Button>
          <AskGridMind s={s} recordId={location.recordId} />
        </div>
      }
    >
      <div className="space-y-5 min-w-0">
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm">
          This is fictional, in-memory data. Refreshing or leaving this sample resets it. Reviews
          and outcomes are simulated; nothing operates equipment or creates real permissions. Replay
          clock: 20 October 2026, 12:00 UTC.
        </p>
        {error && (
          <p role="alert" className="rounded border border-danger bg-danger-soft p-3 text-sm">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-muted-foreground">
            {notice}
          </p>
        )}
        {!entered && <h1 className="text-3xl font-semibold">Explore GridMind</h1>}
        {!entered ? (
          <Panel title="Explore one connected manufacturing organization">
            <p className="max-w-2xl text-muted-foreground">
              Follow an order from a registered press to an interruption, evidence, alternatives and
              a simulated manager decision. Two presses, real calculation code, entirely fictional
              records.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="cta"
                disabled={!ready}
                onClick={() => {
                  setEntered(true);
                  setSetup(false);
                }}
              >
                Start Exploring
              </Button>
              <Button
                variant="outline"
                disabled={!ready}
                onClick={() => {
                  setEntered(true);
                  setSetup(true);
                  setSection("Organization & People");
                }}
              >
                Build a Sample Factory
              </Button>
            </div>
            <p className="text-sm">No sign-in, personal information or payment needed.</p>
          </Panel>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold">{section}</h1>
              <div className="flex gap-2">
                <Button variant={guided ? "cta" : "outline"} onClick={() => setGuided(true)}>
                  Guided mode
                </Button>
                <Button variant={!guided ? "cta" : "outline"} onClick={() => setGuided(false)}>
                  Explore mode
                </Button>
              </div>
            </div>
            <nav aria-label="Sample organization sections" className="flex flex-wrap gap-2">
              {sections.map((label, i) => (
                <Button
                  key={label}
                  variant={section === label ? "secondary" : "outline"}
                  aria-current={section === label ? "page" : undefined}
                  onClick={() => navigate(label)}
                >
                  <span aria-hidden="true" className="num text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  {label}
                </Button>
              ))}
            </nav>
            {guided && (
              <div className="rounded-lg border-l-4 border-cta bg-card p-4 text-sm">
                <p className="font-semibold">Your guided journey</p>
                <p className="mt-1">
                  Register Press 03 → create a compatible order → record its stoppage → open the
                  linked investigation → evaluate alternatives → simulate a review → inspect
                  history. Both modes share these same records.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("Machines & Resources")}
                  >
                    Register a machine
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("Production & Materials")}
                  >
                    Create an order
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("Investigations")}>
                    Investigate an interruption
                  </Button>
                </div>
              </div>
            )}
            <nav aria-label="Sample breadcrumbs" className="flex flex-wrap gap-2 text-sm">
              <Link to="/explore" className="underline">
                Explore
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/explore/$" params={{ _splat: "factories" }} className="underline">
                {s.profile.factory}
              </Link>
              <span aria-hidden="true">/</span>
              <span>{section}</span>
              {location.recordId && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="num">{location.recordId}</span>
                </>
              )}
            </nav>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.history.length > 1
                  ? window.history.back()
                  : void routerNavigate({ to: "/explore" })
              }
            >
              Back to previous view
            </Button>
            {!location.valid && (
              <p role="alert">This sample destination is unknown. Use the section links above.</p>
            )}
            {location.recordId && <SampleRecordDetail s={s} id={location.recordId} />}
            {setup && (
              <p className="rounded border border-cta bg-card p-3 text-sm">
                Fictional setup: name your organization and plant below, then register a machine and
                create an order. The existing two-press records remain available as examples. This
                creates no real organization.
              </p>
            )}
            {section === "Overview" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Registered machines", machines.length],
                    ["Available machines", machines.filter((m) => !machineStopped(s, m.id)).length],
                    ["Open work orders", records(s, "work_order").length],
                    ["Investigations", s.cases.length],
                    [
                      "Material lots held",
                      records(s, "lot").filter((l) => l.attributes.quality !== "released").length,
                    ],
                    [
                      "Draft jobs blocked",
                      plan?.jobs.filter((j) => j.status === "blocked").length ?? "Checking",
                    ],
                    [
                      "Decisions awaiting review",
                      s.cases.filter((c) => {
                        const d = latestDecision(s, c);
                        return d.evaluation && (!d.review || d.stale);
                      }).length,
                    ],
                  ].map(([title, n]) => (
                    <div className="panel p-4" key={title}>
                      <p className="eyebrow">{title}</p>
                      <p className="num mt-2 text-3xl">
                        {typeof n === "number"
                          ? new Intl.NumberFormat(preferences.numberLocale).format(n)
                          : n}
                      </p>
                    </div>
                  ))}
                </div>
                <Panel title="Recent organization activity">
                  <ol className="space-y-2 text-sm">
                    {s.timeline
                      .slice(-5)
                      .reverse()
                      .map((e) => (
                        <li key={e.revision}>
                          <span className="num">r{e.revision}</span> {e.detail}
                        </li>
                      ))}
                  </ol>
                  <Button variant="outline" onClick={() => navigate("Reports & History")}>
                    Inspect complete sample history
                  </Button>
                </Panel>
              </>
            )}
            {section === "Organization & People" && (
              <>
                <Panel title="Fictional organization and factory">
                  <Form
                    name="Save sample organization"
                    busy={formBusy}
                    onSubmit={async (f) => {
                      const ok = await dispatch({
                        type: "profile",
                        organization: val(f, "organization"),
                        factory: val(f, "factory"),
                        country: val(f, "country"),
                        location: val(f, "location"),
                      });
                      if (ok) setSetup(false);
                      return ok;
                    }}
                  >
                    <Field label="Organization name">
                      <input
                        name="organization"
                        required
                        maxLength={100}
                        defaultValue={s.profile.organization}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Factory name">
                      <input
                        name="factory"
                        required
                        maxLength={100}
                        defaultValue={s.profile.factory}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Country">
                      <input
                        name="country"
                        required
                        maxLength={100}
                        defaultValue={s.profile.country}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Sample location">
                      <input
                        name="location"
                        required
                        maxLength={100}
                        defaultValue={s.profile.location}
                        className={fieldClass}
                      />
                    </Field>
                  </Form>
                  <p className="text-sm">
                    Industry: {s.profile.industry}. Factory directory: {s.profile.factory}.
                  </p>
                </Panel>
                <Panel title="People and responsibilities">
                  <RecordList
                    s={s}
                    rows={[
                      {
                        id: s.persona.id,
                        label: s.persona.name + " — simulated operations coordination",
                      },
                      { id: "sample-owner", label: "Sample Plant Owner — fictional priorities" },
                      {
                        id: "operator",
                        label: "Sample Operator — explicitly qualified shared shift",
                      },
                      {
                        id: "sample-inspector",
                        label: "Sample Quality Reviewer — fictional inspection review",
                      },
                    ]}
                  />
                  <p className="text-sm text-muted-foreground">
                    These are sample personas, not Supabase users. Titles and simulated reviews
                    grant no real access. Your real personal account is separate in Personal
                    profile.
                  </p>
                  <RecordList s={s} rows={records(s, "company").filter((e) => e.id !== "seller")} />
                </Panel>
              </>
            )}
            {section === "Factories & Infrastructure" && (
              <Panel title={s.profile.factory}>
                <p className="text-sm">
                  Electrical paths describe declared relationships, not diagnosed causes. The shared
                  panel feeds both presses; a machine-specific stoppage affects only its routed
                  orders.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {s.physical.nodes.map((n) => (
                    <div key={n.id} className="rounded border p-3">
                      <p className="font-medium">
                        {n.label} <span className="text-xs text-muted-foreground">{n.kind}</span>
                      </p>
                      <p className="text-xs">
                        {s.physical.links
                          .filter((l) => l.from === n.id)
                          .map(
                            (l) =>
                              `${l.kind.replaceAll("_", " ")} → ${s.physical.nodes.find((n) => n.id === l.to)?.label}`,
                          )
                          .join("; ") || "No outgoing dependency"}
                      </p>
                      {n.kind === "machine" && (
                        <Button size="sm" variant="link" onClick={() => related(n.coreResourceId!)}>
                          Inspect connected machine
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
            {section === "Machines & Resources" && (
              <>
                <Panel
                  title={editMachine ? "Edit fictional machine" : "Register a fictional machine"}
                >
                  <Form
                    key={editMachine ?? "new"}
                    name={editMachine ? "Save machine" : "Register machine"}
                    busy={formBusy}
                    onSubmit={async (f) => {
                      const ok = await dispatch({
                        type: "machine",
                        id: val(f, "id"),
                        label: val(f, "label"),
                        lineId: val(f, "lineId"),
                        processId: val(f, "processId"),
                        editing: !!editMachine,
                      });
                      if (ok) {
                        setSelectedMachine(val(f, "id"));
                        setEditMachine(null);
                      }
                      return ok;
                    }}
                  >
                    <Field label="Machine identifier">
                      <input
                        name="id"
                        required
                        pattern="[A-Za-z][A-Za-z0-9-]*"
                        maxLength={60}
                        readOnly={!!editMachine}
                        defaultValue={editMachine ?? "press-03"}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Machine name">
                      <input
                        name="label"
                        required
                        maxLength={100}
                        defaultValue={editMachine ? entity(s, editMachine).label : "Press 03"}
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Declared process capability">
                      <select
                        name="processId"
                        className={fieldClass}
                        value={process}
                        onChange={(e) => setProcess(e.target.value)}
                      >
                        {records(s, "process").map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Production line">
                      <select name="lineId" required className={fieldClass}>
                        {lines
                          .filter((l) => (l.attributes.processIds as string[]).includes(process))
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.label}
                            </option>
                          ))}
                      </select>
                    </Field>
                  </Form>
                  {editMachine && (
                    <Button variant="outline" onClick={() => setEditMachine(null)}>
                      Cancel editing
                    </Button>
                  )}
                </Panel>
                <Panel title="Machine register">
                  <div className="grid gap-3 md:grid-cols-2">
                    {machines.map((m) => (
                      <article
                        key={m.id}
                        className={`rounded border p-4 ${selectedMachine === m.id ? "border-cta" : ""}`}
                      >
                        <h3 className="font-semibold">{m.label}</h3>
                        <RecordLink s={s} id={m.id} />
                        <p className="num text-xs">{m.id}</p>
                        <p className="my-2 text-sm">
                          {machineStopped(s, m.id)
                            ? "Unavailable — simulated stoppage"
                            : "Available within declared shift"}{" "}
                          · {(m.attributes.processIds as string[]).join(", ")}
                        </p>
                        <p className="text-sm">
                          Connected orders:{" "}
                          {linkedOrders(s, m.id).length
                            ? linkedOrders(s, m.id).map((id) => (
                                <span className="mr-2" key={id}>
                                  <RecordLink s={s} id={id} />
                                </span>
                              ))
                            : "None"}
                        </p>
                        <p className="text-sm">
                          Incidents: {s.cases.filter((c) => c.subjectId === m.id).length}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditMachine(m.id);
                              setProcess((m.attributes.processIds as string[])[0]);
                            }}
                          >
                            Edit machine
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={formBusy}
                            onClick={() =>
                              void dispatch({
                                type: "availability",
                                id: m.id,
                                available: machineStopped(s, m.id),
                              })
                            }
                          >
                            {machineStopped(s, m.id)
                              ? "Simulate available"
                              : "Simulate unavailable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={formBusy}
                            onClick={() => void dispatch({ type: "remove_machine", id: m.id })}
                          >
                            Remove machine
                          </Button>
                          <Button
                            size="sm"
                            variant="link"
                            onClick={() => {
                              setSelectedMachine(m.id);
                              setKind("machine_stop");
                              navigate("Investigations");
                            }}
                          >
                            Investigate this machine
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </Panel>
              </>
            )}
            {section === "Production & Materials" && (
              <>
                <Panel title="Create a fictional order">
                  <Form
                    name="Create sample order"
                    busy={formBusy}
                    onSubmit={(f) =>
                      dispatch({
                        type: "order",
                        id: val(f, "id"),
                        productId: product,
                        machineId: val(f, "machineId"),
                        lotId: val(f, "lotId"),
                        quantity: Number(f.get("quantity")),
                      })
                    }
                  >
                    <Field label="Order identifier">
                      <input
                        name="id"
                        defaultValue="order-03"
                        required
                        maxLength={60}
                        pattern="[A-Za-z][A-Za-z0-9-]*"
                        className={fieldClass}
                      />
                    </Field>
                    <Field label="Product">
                      <select
                        name="productId"
                        className={fieldClass}
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                      >
                        {records(s, "product").map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Compatible machine">
                      <select name="machineId" required className={fieldClass}>
                        {machines
                          .filter((m) =>
                            (m.attributes.processIds as string[]).includes(
                              productProcess(s, product),
                            ),
                          )
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Selected material lot">
                      <select name="lotId" required className={fieldClass}>
                        {records(s, "lot")
                          .filter((l) =>
                            (
                              records(s, "bom").find((b) => b.attributes.productId === product)
                                ?.attributes.materialIds as string[]
                            ).includes(String(l.attributes.materialId)),
                          )
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.label} · {l.attributes.quantity as number}{" "}
                              {l.attributes.unit as string}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Order quantity (parts)">
                      <input
                        name="quantity"
                        type="number"
                        min={1}
                        max={1000}
                        defaultValue={20}
                        required
                        className={fieldClass}
                      />
                    </Field>
                  </Form>
                </Panel>
                <Panel title="Orders and routing">
                  <ul className="space-y-3">
                    {records(s, "work_order").map((w) => {
                      const o = entity(s, String(w.attributes.orderId)),
                        r = entity(s, String(w.attributes.routingId));
                      return (
                        <li key={w.id} className="rounded border p-3 text-sm">
                          <strong>
                            <RecordLink s={s} id={o.id} />
                          </strong>{" "}
                          · {o.attributes.quantity as number} parts · product{" "}
                          {o.attributes.productId as string}
                          <p>
                            Work order {w.id} · routing {r.id} →{" "}
                            {(r.attributes.operationIds as string[])
                              .map((id) => `${id} on ${entity(s, id).attributes.resourceId}`)
                              .join(", ")}
                          </p>
                          <p>
                            Material:{" "}
                            {s.core.relationships.find(
                              (e) => e.from === w.id && e.type === "consumes",
                            )?.to ?? (o.id === "second-order" ? "second-lot" : "lot")}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
                <Panel title="Material lots and protected reservations">
                  <div className="space-y-3">
                    {records(s, "lot").map((l) => (
                      <form
                        key={l.id}
                        className="rounded border p-3 text-sm"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void dispatch({
                            type: "stock",
                            id: l.id,
                            quantity: Number(new FormData(e.currentTarget).get("quantity")),
                          });
                        }}
                      >
                        <strong>{l.label}</strong> · {l.id} · material{" "}
                        {l.attributes.materialId as string}
                        <p>
                          {l.attributes.quantity as number} {l.attributes.unit as string};{" "}
                          {l.attributes.reserved as number} reserved; quality{" "}
                          {l.attributes.quality as string}
                        </p>
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                          <Field label={`Stock quantity for ${l.id}`}>
                            <input
                              name="quantity"
                              type="number"
                              min={Number(l.attributes.reserved)}
                              max={10000}
                              defaultValue={Number(l.attributes.quantity)}
                              className={fieldClass}
                            />
                          </Field>
                          <Button type="submit" disabled={formBusy} variant="outline">
                            Update sample stock
                          </Button>
                        </div>
                      </form>
                    ))}
                  </div>
                  <Form
                    name="Reserve sample material"
                    busy={formBusy}
                    onSubmit={(f) =>
                      dispatch({
                        type: "reserve",
                        lotId: val(f, "lotId"),
                        orderId: val(f, "orderId"),
                        quantity: Number(f.get("quantity")),
                      })
                    }
                  >
                    <Field label="Reservation lot">
                      <select name="lotId" className={fieldClass}>
                        {records(s, "lot").map((l) => (
                          <option value={l.id} key={l.id}>
                            {l.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Reservation order">
                      <select name="orderId" className={fieldClass}>
                        {records(s, "order").map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Reservation quantity (kg)">
                      <input
                        name="quantity"
                        type="number"
                        min={1}
                        max={1000}
                        required
                        defaultValue={10}
                        className={fieldClass}
                      />
                    </Field>
                  </Form>
                </Panel>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Panel title="Create a product and BOM">
                    <Form
                      name="Create sample product"
                      busy={formBusy}
                      onSubmit={(f) =>
                        dispatch({
                          type: "product",
                          id: val(f, "id"),
                          label: val(f, "label"),
                          materialId: val(f, "materialId"),
                          processId: val(f, "processId"),
                          perPart: Number(f.get("perPart")),
                        })
                      }
                    >
                      <Field label="Product identifier">
                        <input name="id" required className={fieldClass} />
                      </Field>
                      <Field label="Product name">
                        <input name="label" required maxLength={100} className={fieldClass} />
                      </Field>
                      <Field label="BOM material">
                        <select name="materialId" className={fieldClass}>
                          {records(s, "material").map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.id}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Product process">
                        <select name="processId" className={fieldClass}>
                          {records(s, "process").map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.id}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Material kg per part">
                        <input
                          name="perPart"
                          type="number"
                          min={1}
                          max={1000}
                          defaultValue={1}
                          required
                          className={fieldClass}
                        />
                      </Field>
                    </Form>
                    <RecordList s={s} rows={records(s, "bom")} />
                  </Panel>
                  <Panel title="Create a raw-material lot">
                    <Form
                      name="Create sample lot"
                      busy={formBusy}
                      onSubmit={(f) =>
                        dispatch({
                          type: "lot",
                          id: val(f, "id"),
                          materialId: val(f, "materialId"),
                          quantity: Number(f.get("quantity")),
                        })
                      }
                    >
                      <Field label="Lot identifier">
                        <input name="id" required className={fieldClass} />
                      </Field>
                      <Field label="Lot material">
                        <select name="materialId" className={fieldClass}>
                          {records(s, "material").map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.id}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Lot quantity (kg)">
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          max={1000}
                          defaultValue={100}
                          required
                          className={fieldClass}
                        />
                      </Field>
                    </Form>
                    <p className="text-sm text-muted-foreground">
                      New lots receive an explicitly fictional release inspection. This does not
                      certify real material.
                    </p>
                  </Panel>
                </div>
                <Panel title="Finite-capacity draft">
                  {plan ? (
                    <OperationsPlanSummary result={plan} />
                  ) : (
                    <p role="status">Recomputing the existing finite planner…</p>
                  )}
                </Panel>
              </>
            )}
            {section === "Investigations" && (
              <>
                <Panel title="Register a disruption and open an investigation">
                  <Form
                    name="Open sample investigation"
                    busy={formBusy}
                    onSubmit={(f) =>
                      dispatch({
                        type: "incident",
                        kind,
                        subjectId: val(f, "subjectId"),
                        title: val(f, "title"),
                      })
                    }
                  >
                    <Field label="Scenario">
                      <select
                        name="kind"
                        className={fieldClass}
                        value={kind}
                        onChange={(e) => setKind(e.target.value as IncidentKind)}
                      >
                        {incidentKinds.map((k) => (
                          <option key={k} value={k}>
                            {k.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Affected record">
                      <select
                        key={`${kind}-${selectedMachine}`}
                        name="subjectId"
                        required
                        defaultValue={kind === "machine_stop" ? selectedMachine : undefined}
                        className={fieldClass}
                      >
                        {(kind === "machine_stop"
                          ? machines
                          : ["material_shortage", "quality_hold"].includes(kind)
                            ? records(s, "lot")
                            : kind === "electrical_uncertainty"
                              ? records(s, "facility")
                              : records(s, "order")
                        ).map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.label} · {e.id}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Investigation title">
                      <input
                        name="title"
                        required
                        maxLength={100}
                        defaultValue="Investigate a fictional interruption"
                        className={fieldClass}
                      />
                    </Field>
                  </Form>
                </Panel>
                <Panel title="Investigation register">
                  {!s.cases.length ? (
                    <p>No sample investigations yet. Record an incident above.</p>
                  ) : (
                    <div className="space-y-3">
                      {s.cases.map((item) => (
                        <article key={item.id} className="rounded border p-3">
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm">
                            {item.id} · subject {item.subjectId} · linked orders:{" "}
                            {item.orderIds.join(", ") || "None"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCase(item.id);
                              void routerNavigate({
                                to: "/explore/$",
                                params: { _splat: `investigations/${item.id}` },
                              });
                            }}
                          >
                            Open {item.id}
                          </Button>
                        </article>
                      ))}
                    </div>
                  )}
                </Panel>
                {c && (
                  <CaseDetail
                    s={s}
                    c={c}
                    busy={formBusy}
                    dispatch={dispatch}
                    onOrder={() => navigate("Production & Materials")}
                    onDecision={() => navigate("Decisions")}
                  />
                )}
              </>
            )}
            {section === "Decisions" && (
              <Panel title="Decisions and simulated human review">
                {!s.cases.length ? (
                  <>
                    <p>Open an investigation to evaluate connected records.</p>
                    <Button variant="outline" onClick={() => navigate("Investigations")}>
                      Open investigations
                    </Button>
                  </>
                ) : (
                  <>
                    <Field label="Decision investigation">
                      <select
                        className={fieldClass}
                        value={c?.id}
                        onChange={(e) => {
                          setSelectedCase(e.target.value);
                          void routerNavigate({
                            to: "/explore/$",
                            params: { _splat: `decisions/${e.target.value}` },
                          });
                        }}
                      >
                        {s.cases.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {c && (
                      <CaseDetail
                        s={s}
                        c={c}
                        busy={formBusy}
                        dispatch={dispatch}
                        onOrder={() => navigate("Production & Materials")}
                        onDecision={() => navigate("Reports & History")}
                      />
                    )}
                  </>
                )}
              </Panel>
            )}
            {section === "Reports & History" && (
              <>
                <Panel title="Download the connected synthetic record">
                  <p>
                    Includes canonical organization records, topology, evidence, frozen evaluation
                    inputs, blocked alternatives, simulated reviews and session history. There are
                    no actual observed industrial measurements or verified savings.
                  </p>
                  <Button variant="cta" disabled={formBusy} onClick={() => void download()}>
                    Download SYNTHETIC organization report
                  </Button>
                </Panel>
                <Panel title="Organization event timeline">
                  <ol className="space-y-3">
                    {s.timeline.map((e) => (
                      <li key={e.revision} className="rounded border p-3 text-sm">
                        <strong>
                          Revision {e.revision} · {e.action.replaceAll("_", " ")}
                        </strong>
                        <p>{e.detail}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSampleTime(e.at, preferences)}
                        </p>
                        <nav
                          aria-label={`History revision ${e.revision} records`}
                          className="flex flex-wrap gap-3 text-xs"
                        >
                          {e.recordIds.map((id) =>
                            s.core.entities.some((r) => r.id === id) ||
                            s.cases.some((c) => c.id === id) ? (
                              <RecordLink key={id} s={s} id={id} />
                            ) : (
                              <span key={id}>{id} (historical reference)</span>
                            ),
                          )}
                        </nav>
                      </li>
                    ))}
                  </ol>
                </Panel>
                {s.cases.map((c) => (
                  <Panel key={c.id} title={c.title}>
                    <RecordLink s={s} id={c.id} />
                    <p className="text-sm">
                      {latestDecision(s, c).status} · {c.evaluations.length} retained evaluations ·{" "}
                      {c.reviews.length} simulated reviews
                    </p>
                    <p className="text-sm">
                      Outcome:{" "}
                      {c.outcome
                        ? `${c.outcome.kind} — ${c.outcome.note}`
                        : "Unresolved; no real outcome measured."}
                    </p>
                    <p className="text-sm text-muted-foreground">{c.unresolved}</p>
                  </Panel>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </DashboardFrame>
  );
}
function CaseDetail({
  s,
  c,
  busy,
  dispatch,
  onOrder,
  onDecision,
}: {
  s: SampleWorkspace;
  c: SampleCase;
  busy: boolean;
  dispatch: (cmd: SampleCommand) => Promise<boolean>;
  onOrder: () => void;
  onDecision: () => void;
}) {
  const d = latestDecision(s, c),
    evaluation = d.evaluation;
  return (
    <section
      aria-label={`Investigation ${c.id}`}
      className="space-y-4 min-w-0 rounded-lg border border-border bg-card p-4"
    >
      <h3 className="text-lg font-semibold">{c.title}</h3>
      <p className="text-sm">
        <strong>Observation:</strong> {c.observation}
      </p>
      <p className="text-sm">
        <strong>Hypothesis:</strong> {c.hypothesis}
      </p>
      <p className="text-sm">
        <strong>Unresolved:</strong> {c.unresolved}
      </p>
      <p className="text-sm">
        Evidence: {c.evidenceIds.join(", ")}. Subject: {c.subjectId}. Orders:{" "}
        {c.orderIds.join(", ") || "None"}.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onOrder}>
          Inspect related orders and materials
        </Button>
        <Button variant="outline" onClick={onDecision}>
          Decision and history
        </Button>
        <Button
          variant="cta"
          disabled={busy}
          onClick={() => void dispatch({ type: "evaluate", caseId: c.id })}
        >
          Evaluate current alternatives
        </Button>
      </div>
      <p role="status" className="font-medium">
        Decision: {d.status}
      </p>
      <nav aria-label="Investigation related records" className="flex flex-wrap gap-3 text-sm">
        <RecordLink s={s} id={c.subjectId} />
        {c.orderIds.map((id) => (
          <RecordLink key={id} s={s} id={id} />
        ))}
      </nav>
      <div className="grid gap-3 lg:grid-cols-2">
        {c.evidenceIds.map((id) => (
          <EvidenceCard key={id} s={s} id={id} />
        ))}
      </div>
      {evaluation && (
        <>
          <p className="num break-all text-xs">
            Source {evaluation.sourceDigest} · input revision {evaluation.revision}
          </p>
          {d.stale && (
            <p className="rounded border border-warning p-3 text-sm">
              Source records changed. Historical results and reviews remain below; reevaluate before
              any new simulated review.
            </p>
          )}
          <ul className="space-y-2 text-sm">
            {evaluation.alternatives.map((a) => (
              <li key={a.resourceId} className="rounded border p-3">
                {entity(s, a.resourceId).label}:{" "}
                {a.eligible ? "Eligible for simulated review" : "Blocked or needs review"}
                <p>
                  {a.reasons.join(", ") ||
                    (a.eligible
                      ? "Shared planner checks passed within supplied fictional records."
                      : "Another job, due date or owner preference prevents accepting this plant draft.")}
                </p>
              </li>
            ))}
          </ul>
          {evaluation.uncertainty.map((t) => (
            <p key={t} className="text-sm">
              {t}
            </p>
          ))}
          <details>
            <summary className="cursor-pointer">
              Inspect applicable constraints and missing evidence
            </summary>
            <ul className="mt-2 space-y-1 text-sm">
              {evaluation.input.constraints.map((r) => (
                <li key={r.id}>
                  {r.id} · {r.category} · {r.condition.field} {r.condition.op}{" "}
                  {JSON.stringify(r.condition.value)} · simulated {r.authority} authority
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">{c.unresolved}</p>
            <p className="mt-2 text-sm">
              Owner preferences:{" "}
              {evaluation.plan.ownerIntentAssessment.summaries
                .map((i) => `${i.intentId}: ${i.state}`)
                .join(", ") || "None stated; no inferred preferences treated as facts."}
            </p>
          </details>
          <details>
            <summary className="cursor-pointer">
              Inspect frozen evaluation sources and timestamps
            </summary>
            <div className="mt-3 space-y-3">
              {evaluation.input.evidence.map((e) => (
                <EvidenceCard key={e.id} s={{ ...s, core: evaluation.input }} id={e.id} />
              ))}
            </div>
          </details>
          <Form
            scope={c.id}
            name="Record simulated review"
            busy={busy || d.stale}
            onSubmit={(f) =>
              dispatch({
                type: "review",
                caseId: c.id,
                decision: val(f, "decision") as "defer" | "approve_for_simulation" | "reject",
                note: val(f, "note"),
              })
            }
          >
            <Field label="Simulated manager decision">
              <select name="decision" className={fieldClass}>
                <option value="defer">Defer</option>
                <option value="approve_for_simulation" disabled={!evaluation.eligible}>
                  Approve for simulation
                </option>
                <option value="reject">Reject</option>
              </select>
            </Field>
            <Field label="Simulated review note">
              <input name="note" required maxLength={100} className={fieldClass} />
            </Field>
          </Form>
          <p className="text-xs text-muted-foreground">
            Demo Operations Manager is a fictional persona. No review creates a real permission,
            purchase or machine command.
          </p>
          {d.review && (
            <>
              <p className="text-sm">
                Latest simulated review: {d.review.decision} — {d.review.note}
              </p>
              <Form
                scope={c.id}
                name="Record sample outcome"
                busy={busy || d.stale}
                onSubmit={(f) =>
                  dispatch({
                    type: "outcome",
                    caseId: c.id,
                    kind: val(f, "kind") as "simulated" | "unresolved",
                    note: val(f, "note"),
                  })
                }
              >
                <Field label="Outcome classification">
                  <select name="kind" className={fieldClass}>
                    <option value="unresolved">Unresolved</option>
                    <option value="simulated">Simulated illustration</option>
                  </select>
                </Field>
                <Field label="Outcome note">
                  <input name="note" required maxLength={100} className={fieldClass} />
                </Field>
              </Form>
            </>
          )}
        </>
      )}
    </section>
  );
}
