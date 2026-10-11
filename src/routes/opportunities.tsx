import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownRight, ArrowRight, Check, ChevronRight, CircleHelp, ClipboardCheck, FileSearch, FlaskConical, Gauge, Layers3, ShieldAlert, Target } from "lucide-react";
import { getCanonicalOpportunities } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { inr, inrCompact } from "@/lib/energy/format";
import { EmptyState, PageHeader, DemoBadge } from "@/components/gm/bits";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildIntelligenceOpportunities } from "@/lib/energy/intelligence";
import type { Factory } from "@/lib/energy/types";
import type { Analysis } from "@/lib/energy/analysis";

export const Route = createFileRoute("/opportunities")({
  head: () => ({ meta: [{ title: "Opportunity workspace — GridMind" }] }),
  component: Opps,
});

const STATUS = ["detected","quantified","investigating","diagnosed","recommended","accepted","in_progress","awaiting_verification","verified","closed","invalid","insufficient_evidence","not_economically_material","not_actionable","rejected","superseded","unverified"];

function Opps() {
  const { active, analysis, setOppStatus } = useEnergy();
  const query = useQuery({
    queryKey: ["canonical-opportunities", active?.id],
    queryFn: () => getCanonicalOpportunities(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });

  if (!active) return <EmptyState />;
  if (active.isDemo) {
    if (!analysis?.hasData || !analysis.latest) return <EmptyState />;
    return <OpportunityWorkspace factory={active} analysis={analysis} />;
  }
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading canonical opportunities…</p>;
  if (query.error) return <p className="text-sm text-danger">{query.error.message}</p>;

  const opportunities = query.data ?? [];
  return (
    <>
      <PageHeader eyebrow="Economic intelligence" title={opportunities.length ? opportunities.length + " canonical opportunities" : "No canonical opportunities yet"} desc="This view only shows opportunities persisted in the canonical intelligence model. Screening calculations are not presented as production opportunities." />
      <div className="grid gap-4">
        {opportunities.length === 0 && <div className="panel p-6 text-sm text-muted-foreground">No evidence-backed opportunity has been persisted yet. The next intelligence phase will populate this from observations, context, expected performance, deviations and evidence.</div>}
        {opportunities.map((o, i) => (
          <article key={o.id} className="panel p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1"><div className="eyebrow">Opportunity #{i + 1}</div><h2 className="mt-1 text-lg font-semibold">{o.title}</h2><p className="mt-1 text-sm text-muted-foreground">{o.scopeType} · {o.scopeId ?? "factory-wide"}</p></div>
              <Select value={o.status} onValueChange={(v) => setOppStatus(String(o.id), v as any)}>
                <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Recoverable opportunity" value={o.recoverableOpportunity} />
              <Metric label="Expected recovery" value={o.expectedRecovery} />
              <Metric label="Expected net value" value={o.expectedNetValue} />
              <Metric label="Payback" value={o.expectedPaybackMonths == null ? null : o.expectedPaybackMonths} suffix=" months" />
            </div>
            <div className="mt-4 grid gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-4">
              <span>Gross loss: {money(o.grossLoss)}</span><span>Avoidable: {money(o.avoidableLoss)}</span><span>Intervention: {money(o.interventionCost)}</span><span>Priority: {o.priorityScore ?? "—"}</span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Evidence bundle: {o.evidenceBundleId ?? "not linked"} · Deviation: {o.deviationId ?? "not linked"} · Confidence: measurement {o.measurementConfidence ?? "—"}, baseline {o.baselineConfidence ?? "—"}, causal {o.causalConfidence ?? "—"}, economic {o.economicConfidence ?? "—"}</div>
          </article>
        ))}
      </div>
    </>
  );
}

function OpportunityWorkspace({ factory, analysis }: { factory: Factory; analysis: Analysis }) {
  const opportunities = buildIntelligenceOpportunities(factory, analysis);
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id ?? "");
  const [layer, setLayer] = useState<"signal" | "economics" | "evidence">("signal");
  const [reviewed, setReviewed] = useState(false);
  const selected = opportunities.find((o) => o.id === selectedId) ?? opportunities[0];
  if (!selected) return <EmptyState />;

  const layers = [
    { id: "signal" as const, label: "Signal", detail: "What changed?" },
    { id: "economics" as const, label: "Economics", detail: "What might it mean?" },
    { id: "evidence" as const, label: "Evidence", detail: "What would prove it?" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Opportunity workspace · prototype"
        title="From signal to a defensible decision"
        desc="Inspect the operating context, challenge the estimate, and define what evidence is needed before anyone commits to an intervention."
        actions={<DemoBadge />}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1"><FlaskConical className="size-3.5" /> Synthetic screening</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground"><ShieldAlert className="size-3.5" /> No plant action authorized</span>
        <span className="ml-auto text-muted-foreground">Value state: <b className="text-foreground">Potential / estimated</b></span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><div className="eyebrow">Annual impact screened</div><div className="num mt-2 text-2xl font-semibold">{inrCompact(selected.impactAnnual)}<span className="text-sm font-medium text-muted-foreground">/yr</span></div><p className="mt-1 text-xs text-muted-foreground">Exposure estimate, not a realized loss.</p></div>
        <div className="panel p-4"><div className="eyebrow">Potential saving</div><div className="num mt-2 text-2xl font-semibold">{inrCompact(selected.savingAnnual)}<span className="text-sm font-medium text-muted-foreground">/yr</span></div><p className="mt-1 text-xs text-muted-foreground">Not committed, implemented, or verified.</p></div>
        <div className="panel p-4"><div className="eyebrow">Verified value</div><div className="num mt-2 text-2xl font-semibold">₹0</div><p className="mt-1 text-xs text-muted-foreground">No outcome evidence has been accepted.</p></div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(210px,0.78fr)_minmax(0,1.7fr)_minmax(250px,0.9fr)]">
        <aside className="panel p-4">
          <div className="eyebrow flex items-center gap-2"><Gauge className="size-3.5" /> Opportunity queue</div>
          <h2 className="mt-1 text-sm font-semibold">Screened findings</h2>
          <p className="mt-1 text-xs text-muted-foreground">Select a finding to inspect its reasoning.</p>
          <div className="mt-4 space-y-2">
            {opportunities.map((o, i) => (
              <button key={o.id} type="button" onClick={() => { setSelectedId(o.id); setReviewed(false); setLayer("signal"); }} aria-pressed={selected.id === o.id} className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected.id === o.id ? "border-foreground bg-muted/60" : "border-border hover:bg-muted/30"}`}>
                <span className="flex items-center justify-between gap-2"><span className="eyebrow !text-[10px]">Finding {String(i + 1).padStart(2, "0")}</span><ChevronRight className="size-3.5 text-muted-foreground" /></span>
                <span className="mt-1 block text-sm font-semibold leading-snug">{o.title}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{o.system}</span>
                <span className="num mt-2 block text-sm font-semibold">{inrCompact(o.savingAnnual)}<span className="font-normal text-muted-foreground">/yr potential</span></span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold"><Layers3 className="size-3.5" /> Operating context</div>
            <dl className="mt-2 space-y-2 text-xs">
              <div><dt className="text-muted-foreground">Factory</dt><dd className="mt-0.5 font-medium">{factory.name}</dd></div>
              <div><dt className="text-muted-foreground">Sector / location</dt><dd className="mt-0.5 font-medium">{factory.sector} · {factory.location}</dd></div>
              <div><dt className="text-muted-foreground">Data resolution</dt><dd className="mt-0.5 font-medium">Monthly · {analysis.rows.length} records</dd></div>
              <div><dt className="text-muted-foreground">Reference intensity</dt><dd className="mt-0.5 font-medium">{analysis.baselineSec.toFixed(3)} kWh/{factory.productUnit}</dd></div>
            </dl>
          </div>
        </aside>

        <main className="panel min-w-0 overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><div className="eyebrow">Selected opportunity · {selected.opportunityClass}</div><h2 className="mt-1 text-xl font-semibold leading-snug">{selected.title}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{selected.problem}</p></div>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize">{selected.evidenceState} evidence</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
              <div><div className="text-muted-foreground">Confidence</div><div className="mt-1 font-semibold capitalize">{selected.confidence}</div></div>
              <div><div className="text-muted-foreground">Payback</div><div className="mt-1 font-semibold">{selected.paybackMonths == null ? "Not estimated" : `${selected.paybackMonths.toFixed(1)} months`}</div></div>
              <div><div className="text-muted-foreground">Investment</div><div className="mt-1 font-semibold">{inr(selected.investment)}</div></div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-border bg-muted/20">
            {layers.map((item) => <button key={item.id} type="button" onClick={() => setLayer(item.id)} aria-pressed={layer === item.id} className={`border-b-2 px-2 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${layer === item.id ? "border-foreground bg-background" : "border-transparent text-muted-foreground hover:text-foreground"}`}><span className="block text-sm font-semibold">{item.label}</span><span className="mt-0.5 hidden text-[11px] sm:block">{item.detail}</span></button>)}
          </div>
          <div className="p-4 sm:p-5">
            {layer === "signal" && <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-border p-3"><div className="rounded-md bg-muted p-2"><ArrowDownRight className="size-4" /></div><div><h3 className="text-sm font-semibold">Observed pattern</h3><p className="mt-1 text-sm text-muted-foreground">{selected.context}. {selected.cause}</p><p className="mt-2 text-xs text-muted-foreground">This is a screening interpretation from supplied factory-level inputs, not a confirmed machine fault or causal diagnosis.</p></div></div>
              <div><h3 className="text-sm font-semibold">Evidence currently used</h3><ul className="mt-2 space-y-2">{selected.evidence.map((item) => <li key={item} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{item}</li>)}</ul></div>
              <div className="rounded-lg bg-muted/40 p-3"><div className="text-xs font-semibold">Reference used</div><p className="mt-1 text-sm">{selected.reference}</p></div>
            </div>}
            {layer === "economics" && <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-border p-3"><div className="eyebrow">Impact screened</div><div className="num mt-1 text-xl font-semibold">{inr(selected.impactAnnual)}/yr</div><p className="mt-1 text-xs text-muted-foreground">Potential exposure; not an accounting loss.</p></div><div className="rounded-lg border border-border p-3"><div className="eyebrow">Saving hypothesis</div><div className="num mt-1 text-xl font-semibold">{inr(selected.savingAnnual)}/yr</div><p className="mt-1 text-xs text-muted-foreground">A scenario, not a commitment.</p></div></div>
              <div><h3 className="text-sm font-semibold">Calculation trail</h3><ol className="mt-2 space-y-2">{selected.calc.map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="num flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs">{i + 1}</span><span>{step}</span></li>)}</ol></div>
              <div className="rounded-lg border border-border p-3"><div className="flex items-center gap-2 text-sm font-semibold"><CircleHelp className="size-4" /> What could change the estimate?</div><ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">{selected.possibleExplanations.map((item) => <li key={item}>• {item}</li>)}</ul></div>
            </div>}
            {layer === "evidence" && <div className="space-y-4">
              <div className="rounded-lg border border-warning/40 bg-warning-soft p-3"><div className="flex items-center gap-2 text-sm font-semibold"><FileSearch className="size-4" /> Evidence gap</div><p className="mt-1 text-sm">{selected.uncertainty}</p></div>
              <div><h3 className="text-sm font-semibold">Evidence required before a decision</h3><ol className="mt-2 space-y-2">{selected.missingEvidence.map((item, i) => <li key={item} className="flex gap-3 rounded-lg border border-border p-3 text-sm"><span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span><span>{item}</span></li>)}</ol></div>
              <p className="text-xs text-muted-foreground">Evidence must be time-aligned, attributable to the relevant system, and reviewed with the operator before the hypothesis is promoted.</p>
            </div>}
          </div>
        </main>

        <aside className="space-y-4">
          <section className="panel p-4 sm:p-5">
            <div className="eyebrow flex items-center gap-2"><Target className="size-3.5" /> Decision gate</div>
            <h2 className="mt-1 text-lg font-semibold">Is the evidence strong enough?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Do not jump from an estimated opportunity to an action. First record whether the reasoning has been reviewed and what remains unresolved.</p>
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Prototype review marker</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold">{reviewed ? <><Check className="size-4" /> Marked reviewed in this session</> : "Awaiting human review"}</div>
              <button type="button" onClick={() => setReviewed((v) => !v)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{reviewed ? "Undo session marker" : "Mark reviewed for prototype"}<ArrowRight className="size-4" /></button>
              <p className="mt-2 text-[11px] text-muted-foreground">Session-only interaction. Nothing is written to the database or represented as a canonical decision.</p>
            </div>
            <div className="mt-4"><h3 className="text-sm font-semibold">Before approving an intervention</h3><ul className="mt-2 space-y-2 text-xs text-muted-foreground"><li>• Confirm the operating baseline and data coverage.</li><li>• Compare credible alternative explanations.</li><li>• Agree an owner, scope, cost and safe test plan.</li><li>• Define a counterfactual and acceptance threshold.</li></ul></div>
          </section>
          <section className="panel p-4">
            <div className="eyebrow flex items-center gap-2"><ClipboardCheck className="size-3.5" /> Outcome contract</div>
            <h2 className="mt-1 text-base font-semibold">How value becomes verified</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {["Agree baseline and measurement window","Record a human-approved intervention","Compare observed results with the counterfactual","Review attribution, uncertainty and net value"].map((step, i) => <li key={step} className="flex gap-3"><span className="num flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs">{i + 1}</span><span>{step}</span></li>)}
            </ol>
            <div className="mt-4 border-t border-border pt-3"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Verification state</span><span className="font-semibold">Not started</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-1.5 w-0 rounded-full bg-foreground" /></div><p className="mt-2 text-xs text-muted-foreground">No intervention or outcome is being claimed.</p></div>
          </section>
        </aside>
      </div>
      <p className="text-xs text-muted-foreground">Prototype boundary: the finding, economic values and review marker shown here are synthetic/demo-only. This workspace does not control equipment, create canonical opportunities, or claim realized savings.</p>
    </div>
  );
}

function money(v: number | null) { return v == null ? "—" : inr(v); }
function Metric({ label, value, suffix = "" }: { label: string; value: number | null; suffix?: string }) {
  return <div className="rounded-lg bg-muted/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="num mt-1 text-base font-semibold">{value == null ? "—" : (suffix ? value.toFixed(1) + suffix : inrCompact(value))}</div></div>;
}
