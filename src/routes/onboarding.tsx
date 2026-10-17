import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Factory, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { portalCall } from "@/lib/investigation/portal-client";
import { intakeSchema, type Intake, type Principal } from "@/lib/investigation/portal-contract";
import { isStaffPrincipal } from "@/lib/auth/workspace-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Connect your factory — GridMind" },
    { name: "description", content: "Request a private, assisted factory onboarding review with GridMind." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: Onboarding,
});

type PageState = "loading" | "signed_out" | "new" | "pending" | "customer" | "staff" | "unavailable" | "submitted";

function Onboarding() {
  const [state, setState] = useState<PageState>("loading");
  const [pending, setPending] = useState<Intake[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const requestId = useRef<string | null>(null);

  const refresh = async () => {
    setError("");
    setState("loading");
    try {
      const user = await supabase.auth.getUser();
      if (user.error || !user.data.user) { setState("signed_out"); return; }
      const [principal, result] = await Promise.all([
        portalCall<Principal>({ action: "principal" }),
        portalCall<{ requests: Intake[] }>({ action: "intakeList" }),
      ]);
      if (isStaffPrincipal(principal)) { setState("staff"); return; }
      if (principal.isCustomer) { setState("customer"); return; }
      const ownPending = result.requests.filter((r) => !r.caseId);
      setPending(ownPending);
      setState(ownPending.length > 0 ? "pending" : "new");
    } catch {
      setError("We couldn't verify your connection status. No factory data has been connected or changed.");
      setState("unavailable");
    }
  };
  useEffect(() => { void refresh(); }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const factory = String(form.get("factory") ?? "").trim();
      const city = String(form.get("city") ?? "").trim();
      const process = String(form.get("process") ?? "").trim();
      const question = String(form.get("question") ?? "").trim();
      if (!factory || !city || !process || !question) throw new Error("Please complete the factory and review details.");
      const payload = intakeSchema.parse({
        title: `Factory introduction — ${factory}`,
        site: `${factory}, ${city}`,
        question: `Process: ${process}. Decision/question: ${question}`,
        candidate: form.get("candidate") === "C1" ? "C1" : "C4",
        from: String(form.get("from") ?? ""),
        to: String(form.get("to") ?? ""),
      });
      if (payload.from > payload.to) throw new Error("The review period end must not precede its start.");
      // Reuse the same request id after a connection interruption, never create duplicates.
      requestId.current ??= crypto.randomUUID();
      await portalCall({ action: "submit", id: requestId.current, payload });
      setState("submitted");
      requestId.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request could not be saved. Please retry.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-14">
      <main className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold text-foreground">← GridMind</Link>
          <Link to="/auth" search={{ destination: "customer" }} className="text-sm text-muted-foreground underline">Account / sign in</Link>
        </div>
        <div className="mt-12">
          <p className="eyebrow">GridMind · Factory connection</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Start with your factory, not a sensor.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            GridMind begins with a conversation and a bounded operational question. We review your request
            and confirm authorization before creating a working investigation. Logging in does not connect
            your machines, access electricity records, or approve any technical intervention.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Connection process">
          {[
            ["01", "Introduce your factory", "Site and question; no confidential files."],
            ["02", "GridMind reviews", "We agree scope, permission and the appropriate evidence."],
            ["03", "Private dashboard", "See authorized investigations and reviewed findings."],
          ].map(([n, title, desc]) => (
            <div key={n} className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm font-semibold text-cta">{n}</span>
              <h2 className="mt-2 font-semibold">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {error && <p role="alert" className="mt-6 rounded-lg border border-border p-4 text-sm text-danger">{error}</p>}

        <section className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8" aria-live="polite">
          {state === "loading" && <p role="status" className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Checking your account…</p>}

          {state === "signed_out" && <>
            <h2 className="text-xl font-semibold">Sign in or create an account</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">We need a verified account before we can save an onboarding request or show a private dashboard.</p>
            <Button asChild className="mt-5"><Link to="/auth" search={{ destination: "customer" }}>Continue securely <ArrowRight className="size-4" /></Link></Button>
          </>}

          {state === "unavailable" && <>
            <h2 className="text-xl font-semibold">Connection status unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please retry later. We won't mark a request as submitted unless the secure service confirms it.</p>
            <Button onClick={() => void refresh()} className="mt-5" variant="outline">Check again</Button>
          </>}

          {state === "pending" && <>
            <h2 className="text-xl font-semibold">Your introduction is awaiting GridMind review</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">We received an earlier request associated with your account. A factory connection is not active yet.</p>
            <div className="mt-5 space-y-3">
              {pending.map((request) => (
                <div key={request.id} className="rounded-lg border border-border p-4 text-sm">
                  <p className="font-semibold">{request.payload.site}</p>
                  <p className="mt-1 text-muted-foreground">{request.payload.question}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Status: submitted for review</p>
                </div>
              ))}
            </div>
            <Button className="mt-5" variant="outline" onClick={() => void refresh()}>Refresh request status</Button>
          </>}

          {state === "submitted" && <>
            <CheckCircle2 className="size-9 text-cta" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Introduction request submitted</h2>
            <p className="mt-3 text-sm text-muted-foreground">Your request was saved. GridMind must review and scope it before assigning private investigation access. No factory data has been connected.</p>
            <Button variant="outline" className="mt-5" onClick={() => void refresh()}>See request status</Button>
          </>}

          {state === "customer" && <>
            <h2 className="text-xl font-semibold">Your investigation workspace is available</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">You can view cases and evidence shared with your account. This does not imply access to other factories or raw operational data.</p>
            <Button asChild className="mt-5"><Link to="/cases">Open your dashboard <ArrowRight className="size-4" /></Link></Button>
          </>}

          {state === "staff" && <>
            <h2 className="text-xl font-semibold">Your team workspace is available</h2>
            <p className="mt-3 text-sm text-muted-foreground">Your active organization permissions determine which factory investigations you can review.</p>
            <Button asChild className="mt-5"><Link to="/team/cases">Open team dashboard <ArrowRight className="size-4" /></Link></Button>
          </>}

          {state === "new" && <>
            <div className="flex items-center gap-3">
              <Factory className="size-6 text-cta" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Request a factory introduction</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This is a request for an assisted review, not automatic factory registration or remote machine access.
              Provide only non-confidential information. GridMind will confirm your role and required permissions.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={(e) => void submit(e)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5"><Label htmlFor="intro-factory">Factory or business name</Label><Input id="intro-factory" name="factory" required maxLength={90} /></div>
                <div className="grid gap-1.5"><Label htmlFor="intro-city">City or industrial area</Label><Input id="intro-city" name="city" required maxLength={60} /></div>
              </div>
              <div className="grid gap-1.5"><Label htmlFor="intro-process">Primary process or equipment type</Label><Input id="intro-process" name="process" required maxLength={120} placeholder="For example, compressors or machining" /></div>
              <div className="grid gap-1.5"><Label htmlFor="intro-question">What would you like GridMind to investigate?</Label><Textarea id="intro-question" name="question" required maxLength={1500} rows={3} placeholder="Describe an operational or electricity question without sharing private records." /></div>
              <div className="grid gap-1.5 text-sm"><Label htmlFor="intro-type">Review focus</Label>
                <select id="intro-type" name="candidate" className="h-10 rounded-md border border-input bg-background px-3">
                  <option value="C4">Electricity consumption or billing</option>
                  <option value="C1">Downtime or rework evidence</option>
                </select>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Approximate period you want examined (required for a bounded request). You can refine the dates with GridMind later.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5"><Label htmlFor="intro-start">Period start</Label><Input id="intro-start" name="from" type="date" required /></div>
                <div className="grid gap-1.5"><Label htmlFor="intro-end">Period end</Label><Input id="intro-end" name="to" type="date" required /></div>
              </div>
              <p className="text-xs text-muted-foreground">No files, registration details, billing account numbers or proprietary operational records at this stage.</p>
              <Button className="mt-2" type="submit" disabled={sending}>{sending ? "Submitting…" : "Submit connection request"} <ArrowRight className="size-4" /></Button>
            </form>
          </>}
        </section>
      </main>
    </div>
  );
}
