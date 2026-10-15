import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CANONICAL_OPPORTUNITY_STATUSES, isCanonicalOpportunityStatus } from "@/lib/gridmind/opportunity-status";
import { getCanonicalOpportunities } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { inr, inrCompact } from "@/lib/energy/format";
import { EmptyState, PageHeader } from "@/components/gm/bits";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — GridMind" }] }),
  component: Opps,
});


function Opps() {
  const { active, setOppStatus } = useEnergy();
  const query = useQuery({
    queryKey: ["canonical-opportunities", active?.id],
    queryFn: () => getCanonicalOpportunities(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });

  if (!active || active.isDemo) return <EmptyState />;
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
              <Select value={o.status} onValueChange={(v) => { if (isCanonicalOpportunityStatus(v)) setOppStatus(String(o.id), v); }}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent>{CANONICAL_OPPORTUNITY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
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