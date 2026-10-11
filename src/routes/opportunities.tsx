import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCanonicalOpportunities } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { inr, inrCompact } from "@/lib/energy/format";
import { DemoBadge, EmptyState, PageHeader, Panel, ProcessRail } from "@/components/gm/bits";
import { FindingFlow, FindingHeader } from "@/components/gm/finding";
import { buildIntelligenceOpportunities } from "@/lib/energy/intelligence";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — GridMind" }] }),
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

  // Demo screening calculations are intentionally not written to the canonical
  // opportunity model. Show them as a distinct, synthetic state rather than
  // making the user's demo findings disappear into the generic no-data flow.
  if (active.isDemo) {
    if (!analysis?.hasData || !analysis.latest) {
      return (
        <>
          <PageHeader eyebrow="Demo screening" title="Demo analysis unavailable" actions={<DemoBadge />} />
          <Panel title="No screening result available" desc="This fictional factory has no usable screening result in the current session. Return to Overview or reload the demo example; no customer or persisted opportunity data is implied." />
          <Button asChild variant="outline" className="mt-4"><Link to="/">Back to overview</Link></Button>
        </>
      );
    }
    const screeningOpportunities = buildIntelligenceOpportunities(active, analysis);
    return (
      <>
        <PageHeader
          eyebrow="Economic intelligence · demo"
          title="Demo screening opportunities"
          desc="These findings are calculated from a fictional factory dataset. They are screening estimates—not canonical persisted opportunities, customer evidence, or verified savings."
          actions={<DemoBadge />}
        />
        <ProcessRail active={5} />
        <Panel title="How to interpret this view" desc="The example is designed to demonstrate how a signal can lead to an investigation. Equipment assumptions, likely causes and financial values require site evidence and human review. Nothing here is marked as realized or verified value." />
        <div className="mt-4 grid gap-5">
          {screeningOpportunities.map((o, i) => (
            <article key={o.id} className="panel p-4 sm:p-5">
              <FindingHeader o={o} rank={i + 1} />
              <FindingFlow o={o} />
              <div className="mt-3 text-xs text-muted-foreground">
                Screening estimate: {inrCompact(o.savingAnnual)}/yr potential · Evidence state: {o.evidenceState} · Verification: {o.verificationState}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to="/">Return to overview</Link></Button>
          <Button asChild variant="outline"><Link to="/savings">View verification state</Link></Button>
        </div>
      </>
    );
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
              <Select value={o.status} onValueChange={(v) => setOppStatus(String(o.id), v as any)}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
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

function money(v: number | null) { return v == null ? "—" : inr(v); }
function Metric({ label, value, suffix = "" }: { label: string; value: number | null; suffix?: string }) {
  return <div className="rounded-lg bg-muted/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="num mt-1 text-base font-semibold">{value == null ? "—" : (suffix ? value.toFixed(1) + suffix : inrCompact(value))}</div></div>;
}
