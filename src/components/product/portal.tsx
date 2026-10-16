import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock3,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardFrame, DashboardBrand } from "@/components/gm/dashboard-frame";
import { ConnectedInvestigationWorkbench } from "@/components/investigation/connected-workbench";
import { STAFF_NAV, CUSTOMER_NAV } from "@/components/gm/dashboard-nav";
import { portalCall, resetPortalDemo } from "@/lib/investigation/portal-client";
import {
  intakeSchema,
  type PortalCase,
  type PortalCommand,
} from "@/lib/investigation/portal-contract";
import { usePortal } from "./use-portal";

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium">
      <span className="size-1.5 rounded-full bg-cta" />
      {children}
    </span>
  );
}
function Card({
  title,
  children,
  description,
}: {
  title: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <section className="panel min-w-0 p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
function ActionForm({
  children,
  onSubmit,
  label,
  busy = false,
}: {
  children: ReactNode;
  onSubmit: (fd: FormData) => Promise<unknown>;
  label: string;
  busy?: boolean;
}) {
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    try {
      await onSubmit(fd);
      setError("");
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form method="post" onSubmit={submit} className="grid min-w-0 gap-4">
      {children}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button className="justify-self-start" disabled={busy || saving}>
        {saving ? "Saving…" : label}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
function Field({
  label,
  name,
  area = false,
  type = "text",
  required = true,
  max = 4000,
}: {
  label: string;
  name: string;
  area?: boolean;
  type?: string;
  required?: boolean;
  max?: number;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      {area ? (
        <Textarea name={name} required={required} maxLength={max} rows={3} />
      ) : (
        <Input name={name} type={type} required={required} maxLength={max} />
      )}
    </label>
  );
}
export function Portal({
  team = false,
  intake = false,
  caseId,
  demo = false,
}: {
  team?: boolean;
  intake?: boolean;
  caseId?: string;
  demo?: boolean;
}) {
  const p = usePortal(demo),
    [search, setSearch] = useState(""),
    [newRequest, setNewRequest] = useState(false),
    [detail, setDetail] = useState<PortalCase | null>(null),
    [tab, setTab] = useState("Summary");
  const staff = demo || p.principal.factories.length > 0;
  const { ready, signedIn, version, setError, refresh, busy } = p;
  useEffect(() => {
    if (!caseId || !signedIn || !ready) return;
    let active = true;
    void portalCall<PortalCase>({ action: "load", caseId }, demo)
      .then((c) => {
        if (active) setDetail(team && demo ? { ...c, role: "manager" } : c);
      })
      .catch((e) => {
        if (active) {
          setDetail(null);
          setError(e.message);
        }
      });
    return () => {
      active = false;
    };
  }, [caseId, demo, team, version, signedIn, ready, setError]);
  useEffect(() => {
    if (!ready || !signedIn || demo) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !busy) void refresh().catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, [ready, signedIn, demo, refresh, busy]);
  const execute = (cmd: PortalCommand) => p.run(cmd);
  const signOut = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    window.location.assign("/website");
  };
  const header = (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="lg:hidden">
        <DashboardBrand />
      </div>
      <div className="hidden text-sm font-medium lg:block">
        {team ? "Delivery workspace" : "Customer workspace"}
        <span className="mx-3 text-border">/</span>
        <span className="text-muted-foreground">
          {intake ? "Intake" : caseId ? "Investigation" : "Overview"}
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {demo ? <Tag>Sample workspace</Tag> : <Tag>Private workspace</Tag>}
        {p.signedIn && !demo && (
          <Button variant="outline" size="sm" onClick={() => void p.safe(signOut)}>
            Sign out
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link to="/website">
            Website <ArrowUpRight className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
  const filtered = p.cases.filter((c) =>
    (c.title + " " + c.site).toLowerCase().includes(search.toLowerCase()),
  );
  const sampleSearch = demo ? { mode: "demo" as const } : {};
  return (
    <DashboardFrame links={team ? STAFF_NAV : CUSTOMER_NAV} header={header}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-xs leading-5 text-muted-foreground">
        <span>
          <strong className="text-foreground">
            {demo ? "Interactive sample" : "Isolated beta"}
          </strong>{" "}
          · Invented records only. Reviews here are simulated; no customer result or professional
          sign-off.
        </span>
        {demo ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "Reset the sample workspace? Sample requests and messages will be removed.",
                )
              ) {
                resetPortalDemo();
                window.location.reload();
              }
            }}
          >
            Reset sample
          </Button>
        ) : (
          <Link to={team ? "/team/cases" : "/cases"} search={{ mode: "demo" }}>
            Explore sample <ArrowRight className="inline size-3" />
          </Link>
        )}
      </div>
      {p.error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
        >
          {p.error}
          {p.retry.current && (
            <Button
              variant="outline"
              className="ml-3"
              size="sm"
              onClick={() => void p.safe(() => execute(p.retry.current!))}
            >
              Retry same request
            </Button>
          )}
        </div>
      )}
      {!p.ready ? (
        <p role="status" className="py-16 text-center text-sm text-muted-foreground">
          Loading your workspace…
        </p>
      ) : !p.signedIn ? (
        <div className="mx-auto max-w-xl py-16">
          <Card
            title="Your investigation, in one place"
            description="Follow the evidence, keep the conversation together and read the brief that supports your next decision."
          >
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/auth" search={{ destination: team ? "team" : "customer" }}>
                  Sign in to your workspace <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={team ? "/team/cases" : "/cases"} search={{ mode: "demo" }}>
                  Explore the sample
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      ) : team && !staff ? (
        <Card
          title="Team access is required"
          description="This account can access only its assigned customer cases."
        >
          <Button asChild>
            <Link to="/cases">Open your cases</Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">
                {team ? "Investigation delivery" : "Your decision workspace"}
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {intake
                  ? "Incoming requests"
                  : detail && caseId
                    ? detail.title
                    : team
                      ? "Investigations"
                      : "Your investigations"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {intake
                  ? "Agree the question and scope. The case and customer access are created together."
                  : caseId
                    ? "One question. A traceable evidence chain. A clear next step."
                    : team
                      ? "Keep cases moving from evidence to review and delivery."
                      : "See what is happening, what is needed from you, and what the evidence supports."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={p.busy}
                onClick={() => void p.safe(p.refresh)}
              >
                <RefreshCw className="size-4" /> Refresh
              </Button>
              {!team && !caseId && (
                <Button size="sm" onClick={() => setNewRequest((v) => !v)}>
                  <Plus className="size-4" />
                  {newRequest ? "Close request" : "New investigation"}
                </Button>
              )}
            </div>
          </div>
          {newRequest && (
            <div className="mb-6">
              <Card
                title="Start with your decision"
                description="Describe one bounded question. Submitting a request does not agree a scope, fee or technical engagement."
              >
                <ActionForm
                  label="Submit investigation request"
                  busy={p.busy}
                  onSubmit={async (fd) => {
                    const payload = intakeSchema.parse(Object.fromEntries(fd));
                    await execute({ action: "submit", id: crypto.randomUUID(), payload });
                    setNewRequest(false);
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Investigation title" name="title" max={160} />
                    <Field label="Site or process" name="site" max={160} />
                  </div>
                  <Field label="What decision do you need to make?" name="question" area />
                  <label className="grid gap-1.5 text-sm font-medium">
                    Investigation type
                    <select name="candidate" className="rounded-md border border-input bg-card p-2">
                      <option value="C4">Energy / resource evidence</option>
                      <option value="C1">Downtime / interruption evidence</option>
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Period start" name="from" type="date" />
                    <Field label="Period end" name="to" type="date" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use invented information in this beta. No confidential files or equipment
                    instructions.
                  </p>
                </ActionForm>
              </Card>
            </div>
          )}
          {intake ? (
            <div className="grid gap-4">
              {p.requests.length === 0 ? (
                <Card
                  title="No incoming requests"
                  description="New requests appear here once submitted through the customer workspace."
                >
                  <Button asChild variant="outline">
                    <Link to="/cases" search={sampleSearch}>
                      Open customer workspace
                    </Link>
                  </Button>
                </Card>
              ) : (
                p.requests.map((r) => (
                  <Card
                    key={r.id}
                    title={r.payload.title}
                    description={r.payload.site + " · " + r.payload.from + " — " + r.payload.to}
                  >
                    <p className="mb-4 text-sm leading-6">{r.payload.question}</p>
                    {r.caseId ? (
                      <Button variant="outline" asChild>
                        <Link
                          to="/team/cases/$caseId"
                          params={{ caseId: r.caseId }}
                          search={sampleSearch}
                        >
                          Open accepted case <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    ) : (
                      <ActionForm
                        label="Accept scope and open case"
                        busy={p.busy}
                        onSubmit={(fd) =>
                          execute({
                            action: "accept",
                            id: r.id,
                            factoryId: Number(fd.get("factory")),
                            caseId: crypto.randomUUID(),
                            autoPublish: fd.has("autoPublish"),
                          })
                        }
                      >
                        <label className="grid gap-1.5 text-sm font-medium">
                          Authorized factory
                          <select
                            name="factory"
                            required
                            className="rounded-md border border-input bg-card p-2"
                          >
                            {p.principal.factories
                              .filter((f) => ["owner", "admin"].includes(f.role))
                              .map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            name="autoPublish"
                            type="checkbox"
                            defaultChecked
                            className="mt-1"
                          />
                          Publish the customer-safe brief automatically after current independent
                          review passes.
                        </label>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Accepting creates one case and grants this requester case-only access.
                          Source reconciliation and independent review remain required.
                        </p>
                      </ActionForm>
                    )}
                  </Card>
                ))
              )}
            </div>
          ) : caseId ? (
            detail ? (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                  <Tag>{detail.stage}</Tag>
                  <span className="text-muted-foreground">
                    {detail.site} · {detail.from} — {detail.to}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Version {detail.revision}
                  </span>
                </div>
                <nav
                  aria-label="Case sections"
                  className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
                >
                  {[
                    ...(team && detail.role !== "customer" ? ["Work"] : []),
                    "Summary",
                    "Evidence",
                    "Messages",
                    "Brief",
                    "Decision",
                    ...(team && detail.role === "manager" ? ["Delivery"] : []),
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      aria-current={tab === t ? "page" : undefined}
                      className={
                        "shrink-0 border-b-2 px-4 py-3 text-sm font-medium " +
                        (tab === t
                          ? "border-cta text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground")
                      }
                    >
                      {t}
                    </button>
                  ))}
                </nav>
                {tab === "Work" &&
                  (demo ? (
                    <Card
                      title="Existing investigation tools"
                      description="The working method exercises remain available. Connected cases use the same engine and controls inside this dashboard."
                    >
                      <Button asChild>
                        <Link to="/investigations">
                          Open method exercise <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </Card>
                  ) : (
                    <ConnectedInvestigationWorkbench caseId={caseId} embedded />
                  ))}
                {tab === "Summary" && (
                  <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                    <Card title="The decision" description={detail.question}>
                      <div className="rounded-lg bg-muted/40 p-4 text-sm leading-6">
                        <div className="eyebrow mb-2">Agreed boundary</div>
                        {detail.boundary}
                      </div>
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {[
                          [ClipboardList, "Scope recorded"],
                          [
                            ShieldCheck,
                            detail.stage === "Brief available"
                              ? "Sample brief released"
                              : "Evidence and review",
                          ],
                          [FileText, detail.publication ? "Brief available" : "Brief pending"],
                        ].map(([Icon, label], i) => {
                          const I = Icon as typeof FileText;
                          return (
                            <div key={i} className="rounded-lg border border-border p-4">
                              <I className="mb-3 size-5 text-muted-foreground" />
                              <p className="text-xs font-medium">{String(label)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                    <Card
                      title="Your next step"
                      description={
                        detail.publication
                          ? "Read the brief, then record your decision or ask a question."
                          : "Respond to evidence requests. The team will reconcile your response before using it."
                      }
                    >
                      <Button
                        variant="outline"
                        onClick={() => setTab(detail.publication ? "Brief" : "Evidence")}
                      >
                        {detail.publication ? "Read your brief" : "View evidence requests"}
                        <ArrowRight className="size-4" />
                      </Button>
                      <p className="mt-5 text-xs leading-5 text-muted-foreground">
                        A source submission is not a verified observation. A comparison is not a
                        physical cause or verified saving.
                      </p>
                    </Card>
                  </div>
                )}
                {tab === "Evidence" && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card
                      title="Evidence requests"
                      description="Keep source references and clarifications attached to the case."
                    >
                      {detail.communications.filter((v) => v.kind === "evidence_request").length ===
                        0 && (
                        <p className="text-sm text-muted-foreground">
                          No evidence requests have been shared yet.
                        </p>
                      )}
                      {detail.communications
                        .filter((v) => v.kind === "evidence_request")
                        .map((r) => (
                          <div key={r.id} className="mb-5 rounded-lg border border-border p-4">
                            <p className="text-sm font-medium leading-6">{r.payload.text}</p>
                            <p className="mb-4 mt-1 text-xs text-muted-foreground">
                              Source {r.payload.evidenceId}
                            </p>
                            {detail.communications
                              .filter(
                                (v) => v.kind === "evidence_reply" && v.payload.requestId === r.id,
                              )
                              .map((v) => (
                                <div key={v.id} className="mb-3 rounded bg-muted/40 p-3 text-sm">
                                  <b>Response received · awaiting reconciliation</b>
                                  <p className="mt-2">{v.payload.reference}</p>
                                  <p>{v.payload.text}</p>
                                </div>
                              ))}
                            <ActionForm
                              label="Send evidence response"
                              busy={p.busy}
                              onSubmit={(fd) =>
                                execute({
                                  action: "evidence_reply",
                                  id: crypto.randomUUID(),
                                  caseId,
                                  requestId: r.id,
                                  reference: String(fd.get("reference")),
                                  text: String(fd.get("text")),
                                })
                              }
                            >
                              <Field
                                label="Source reference or handover reference"
                                name="reference"
                                max={400}
                              />
                              <Field label="Response and limitations" name="text" area />
                            </ActionForm>
                          </div>
                        ))}
                      {team && (
                        <ActionForm
                          label="Request evidence"
                          busy={p.busy}
                          onSubmit={(fd) =>
                            execute({
                              action: "evidence_request",
                              id: crypto.randomUUID(),
                              caseId,
                              evidenceId: String(fd.get("evidenceId")),
                              text: String(fd.get("text")),
                            })
                          }
                        >
                          <Field label="Source ID" name="evidenceId" max={100} />
                          <Field label="What is needed and why?" name="text" area />
                        </ActionForm>
                      )}
                      <p className="mt-4 text-xs leading-5 text-muted-foreground">
                        References and responses only. Confidential file uploads require approved
                        private custody and are not enabled here.
                      </p>
                    </Card>
                    <Card
                      title="Source register"
                      description="Verification stays separate from customer submission."
                    >
                      {detail.evidence.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-start justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-0"
                        >
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">{e.id}</div>
                            <p className="mt-1 text-sm leading-6">{e.name}</p>
                          </div>
                          {e.verified ? (
                            <CheckCircle2
                              aria-label="Verified in sample method"
                              className="mt-1 size-4 shrink-0 text-cta"
                            />
                          ) : (
                            <Clock3
                              aria-label="Awaiting verification"
                              className="mt-1 size-4 shrink-0 text-muted-foreground"
                            />
                          )}
                        </div>
                      ))}
                    </Card>
                  </div>
                )}
                {tab === "Messages" && (
                  <Card
                    title="Shared case conversation"
                    description="Messages in this channel are visible to the customer and assigned team."
                  >
                    <div className="mb-6 grid gap-3">
                      {detail.communications
                        .filter((v) => v.kind === "message")
                        .map((v) => (
                          <div key={v.id} className="rounded-lg bg-muted/40 p-4">
                            <div className="mb-2 text-xs font-medium text-muted-foreground">
                              {v.role === "customer" ? "Customer" : "GridMind team"} ·{" "}
                              {new Date(v.at).toLocaleDateString()}
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {v.payload.text}
                            </p>
                          </div>
                        ))}
                    </div>
                    <ActionForm
                      label="Send message"
                      busy={p.busy}
                      onSubmit={(fd) =>
                        execute({
                          action: "message",
                          id: crypto.randomUUID(),
                          caseId,
                          text: String(fd.get("text")),
                        })
                      }
                    >
                      <Field label="Your message" name="text" area />
                    </ActionForm>
                  </Card>
                )}
                {tab === "Brief" && (
                  <Card
                    title={
                      detail.publication ? "Your decision brief" : "Your brief is being prepared"
                    }
                    description={
                      detail.publication
                        ? "Released sample version " +
                          detail.publication.revision +
                          " · " +
                          new Date(detail.publication.at).toLocaleDateString()
                        : "The brief appears here after review and release. Draft analysis and internal review notes remain private."
                    }
                  >
                    {detail.publication ? (
                      <>
                        <Button variant="outline" onClick={() => downloadBrief(detail)}>
                          <FileText className="size-4" /> Download brief
                        </Button>
                        <pre className="mt-6 whitespace-pre-wrap break-words rounded-lg bg-muted/30 p-5 font-sans text-sm leading-7">
                          {detail.publication.brief}
                        </pre>
                      </>
                    ) : (
                      <div className="flex gap-3 rounded-lg bg-muted/40 p-4">
                        <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />
                        <p className="text-sm leading-6">
                          Current stage: {detail.stage}. The team is responsible for resolving
                          evidence and review requirements before release.
                        </p>
                      </div>
                    )}
                  </Card>
                )}
                {tab === "Decision" && (
                  <Card
                    title="Record your decision"
                    description="Your response is tied to the brief version you read. It does not mark an action implemented or an outcome verified."
                  >
                    {detail.communications
                      .filter((v) => v.kind === "decision")
                      .map((v) => (
                        <div key={v.id} className="mb-4 rounded-lg bg-muted/40 p-4 text-sm">
                          <b>{v.payload.decision}</b>
                          <p className="mt-2">{v.payload.text}</p>
                        </div>
                      ))}
                    {detail.publication && (!team || demo) ? (
                      <ActionForm
                        label="Record decision"
                        busy={p.busy}
                        onSubmit={(fd) =>
                          execute({
                            action: "decision",
                            id: crypto.randomUUID(),
                            caseId,
                            publicationId: detail.publication!.id,
                            decision: String(fd.get("decision")) as
                              "accepted" | "declined" | "deferred",
                            text: String(fd.get("text")),
                          })
                        }
                      >
                        <label className="grid gap-1.5 text-sm font-medium">
                          Decision
                          <select
                            name="decision"
                            className="rounded-md border border-input bg-card p-2"
                          >
                            <option value="accepted">Accept the proposed next step</option>
                            <option value="deferred">Defer pending further information</option>
                            <option value="declined">Decline the proposed next step</option>
                          </select>
                        </label>
                        <Field label="Decision rationale and next action" name="text" area />
                      </ActionForm>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {team
                          ? "The customer records their response after publication."
                          : "A released brief is required before recording a decision."}
                      </p>
                    )}
                  </Card>
                )}
                {tab === "Delivery" && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card
                      title="Brief release"
                      description="Current independent review is required. Publication is bound to this revision and becomes unavailable after a correction."
                    >
                      <p className="mb-5 text-sm">
                        {detail.publication
                          ? "A current sample brief is available to the customer."
                          : "No current brief has been published."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={p.busy || demo}
                          onClick={() =>
                            void p.safe(() =>
                              execute({
                                action: "publish",
                                caseId,
                                id: crypto.randomUUID(),
                                expectedRevision: detail.revision,
                              }),
                            )
                          }
                        >
                          Publish reviewed sample brief
                        </Button>
                        {detail.publication && (
                          <Button
                            variant="outline"
                            disabled={p.busy}
                            onClick={() =>
                              void p.safe(() =>
                                execute({
                                  action: "withdraw",
                                  caseId,
                                  id: crypto.randomUUID(),
                                  text: "The team withdrew this publication for further review.",
                                }),
                              )
                            }
                          >
                            Withdraw brief
                          </Button>
                        )}
                      </div>
                      <p className="mt-4 text-xs leading-5 text-muted-foreground">
                        For accepted intakes, the manager can authorize automatic publication after
                        independent review. Synthetic review never authorizes real-world delivery.
                      </p>
                    </Card>
                    <Card
                      title="Customer access"
                      description="Grant only case access. This does not add the customer to the factory's operational membership."
                    >
                      <ActionForm
                        label="Save customer access"
                        busy={p.busy || demo}
                        onSubmit={(fd) =>
                          execute({
                            action: "grant",
                            caseId,
                            userId: String(fd.get("userId")),
                            active: fd.has("active"),
                            expiresAt: fd.get("expiresAt") ? String(fd.get("expiresAt")) : null,
                          })
                        }
                      >
                        <Field label="Existing customer account ID" name="userId" max={100} />
                        <Field
                          label="Expiry timestamp (optional, ISO format)"
                          name="expiresAt"
                          required={false}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input name="active" type="checkbox" defaultChecked /> Active case access
                        </label>
                      </ActionForm>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <p role="status" className="text-sm text-muted-foreground">
                Loading investigation…
              </p>
            )
          ) : (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                  [ClipboardList, p.cases.length, "Investigations"],
                  [
                    Inbox,
                    p.requests.filter((r) => !r.caseId).length,
                    team ? "Awaiting triage" : "Requests awaiting scope",
                  ],
                  [ShieldCheck, "Source-linked", "Evidence and review"],
                ].map(([Icon, value, label], i) => {
                  const I = Icon as typeof FileText;
                  return (
                    <section key={i} className="panel flex items-start justify-between p-5">
                      <div>
                        <p className="text-xs text-muted-foreground">{String(label)}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight">
                          {String(value)}
                        </p>
                      </div>
                      <I className="size-5 text-muted-foreground" />
                    </section>
                  );
                })}
              </div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">{team ? "Case portfolio" : "Your cases"}</h2>
                <Input
                  aria-label="Search investigations"
                  placeholder="Search cases or sites"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              {filtered.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filtered.map((c) => (
                    <article key={c.id} className="panel flex flex-col p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="eyebrow">
                          {c.candidate === "C1" ? "Operational chronology" : "Energy evidence"}
                        </div>
                        <span className="text-xs text-muted-foreground">v{c.revision}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight">{c.title}</h3>
                      <p className="mb-6 mt-2 text-sm text-muted-foreground">{c.site}</p>
                      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                        <span className="text-xs text-muted-foreground">
                          Case {c.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to={team ? "/team/cases/$caseId" : "/cases/$caseId"}
                            params={{ caseId: c.id }}
                            search={sampleSearch}
                          >
                            Open investigation <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Card
                  title={search ? "No matching investigations" : "Your next decision starts here"}
                  description={
                    search
                      ? "Try another case title or site."
                      : team
                        ? "Accept a request from intake, or continue with the existing connected investigation tools."
                        : "Submit one question. Your case appears here after the team agrees its scope."
                  }
                >
                  {team ? (
                    <div className="flex flex-wrap gap-3">
                      <Button asChild>
                        <Link to="/team/intake" search={sampleSearch}>
                          Open intake
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/investigations-connected">Existing case tools</Link>
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setNewRequest(true)}>
                      Request an investigation <Plus className="size-4" />
                    </Button>
                  )}
                </Card>
              )}
              {!team && p.requests.length > 0 && (
                <div className="mt-6">
                  <Card title="Your requests">
                    <div className="grid gap-4">
                      {p.requests.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium">{r.payload.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {r.caseId
                                ? "Scope accepted · case opened"
                                : "Submitted · awaiting team scope review"}
                            </p>
                          </div>
                          {r.caseId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                to="/cases/$caseId"
                                params={{ caseId: r.caseId }}
                                search={sampleSearch}
                              >
                                Open case
                              </Link>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}
    </DashboardFrame>
  );
}
function downloadBrief(c: PortalCase) {
  if (!c.publication) return;
  const url = URL.createObjectURL(new Blob([c.publication.brief], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `GridMind-${c.id}-v${c.publication.revision}-SAMPLE.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
