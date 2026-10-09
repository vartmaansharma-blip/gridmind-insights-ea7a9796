import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact, num, pct } from "@/lib/energy/format";
import { Delta, DemoBadge, EmptyState, Kpi, PageHeader, Panel, ProcessRail, QualityPill } from "@/components/gm/bits";
import { FindingFlow, FindingHeader } from "@/components/gm/finding";
import { buildIntelligenceOpportunities } from "@/lib/energy/intelligence";
import { EvidenceTag } from "@/components/gm/evidence";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — GridMind Factory Energy Intelligence" },
      { name: "description", content: "Monthly electricity cost, demand, energy per unit and estimated savings for your factory." },
      { property: "og:title", content: "Overview — GridMind" },
      { property: "og:description", content: "See where your factory loses money on electricity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { active, analysis: a } = useEnergy();
  if (!active || !a) return <EmptyState />;
  if (!a.hasData || !a.latest) {
    return (
      <>
        <PageHeader eyebrow="Factory Performance Intelligence" title={active.name} desc={`${active.location} · Economic conclusions remain blocked until usable measurements are available.`} actions={<>{active.isDemo && <DemoBadge />}<QualityPill q={a.quality} /></>} />
        <Panel className="mt-4" title="No usable monthly evidence" desc={a.pipeline.pauseReason ?? "No valid monthly records are available for screening."}>
          <p className="text-sm text-muted-foreground">This does not mean the factory has zero losses or zero savings. Missing, invalid, or incomplete measurements prevent a defensible calculation.</p>
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/factory">Review factory data <ArrowRight /></Link></Button>
        </Panel>
      </>
    );
  }
  const l = a.latest, p = a.prev;
  const opportunities = buildIntelligenceOpportunities(active, a);
  const d = (x: number, y?: number) => (y ? x / y - 1 : 0);
  const quantified = !a.paused;
  const peakValue = Number.isFinite(l.peakKva) ? `${num(l.peakKva)} kVA` : "Insufficient data";
  const intensityValue = a.baselineSec > 0 ? `${l.sec.toFixed(2)} kWh` : "No valid reference";
  return (
    <>
      <PageHeader eyebrow="Factory Performance Intelligence" title={active.name} desc={`${active.location} · Where value is exposed, what supports it, and what to do next.`}
        actions={<>{active.isDemo && <DemoBadge />}<QualityPill q={a.quality} /></>} />
      <ProcessRail active={5} />
      {a.paused && (
        <Panel className="mt-4" title="Economic conclusions paused" desc={a.pipeline.pauseReason ?? "There is not enough usable evidence to quantify opportunity or savings."}>
          <p className="text-sm text-muted-foreground">This is not evidence of zero loss or zero savings. Add or correct monthly observations before treating financial figures as decision-ready.</p>
        </Panel>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Money at risk" tone="accent" value={quantified ? "Not aggregated" : "Not quantified"} sub={quantified ? "Potential findings may overlap; no portfolio total claimed" : "Insufficient evidence · not zero loss"} />
        <Kpi label="Potential saving" value={quantified ? "Not aggregated" : "Not quantified"} sub={quantified ? `${opportunities.filter((o) => o.savingAnnual > 0).length} screening findings; overlap and causation are not resolved` : "Analysis paused until data is sufficient"} />
        <Kpi label="Electricity cost (latest)" value={Number.isFinite(l.cost) ? inrCompact(l.cost) : "Missing"} sub={<Delta v={d(l.cost, p?.cost)} />} />
        <Kpi label="Peak demand" value={peakValue} sub={Number.isFinite(l.peakKva) ? `${pct(l.utilization)} of ${num(active.contractDemandKva)} kVA contract` : "Peak-demand input is missing"} />
      </div>
      <Panel className="mt-6" title="Top screening findings" desc="Hypotheses ranked by indicative savings. These are not persisted canonical opportunities; overlap and causation are not yet established."
        actions={<Button variant="outline" size="sm" asChild><Link to="/opportunities">All <ArrowRight /></Link></Button>}>
        <div className="grid gap-5">
          {opportunities.slice(0, 3).map((o, i) => (
            <div key={o.id}><FindingHeader o={o} rank={i + 1} /><FindingFlow o={o} /></div>
          ))}
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Energy & cost performance" desc="Production-normalized evidence, not a machine diagnosis."><div className="grid grid-cols-2 gap-4"><Kpi label="Consumption" value={Number.isFinite(l.kwh) ? `${num(l.kwh)} kWh` : "Missing"} sub={<Delta v={d(l.kwh, p?.kwh)} />} /><Kpi label={`Energy / ${active.productUnit}`} value={intensityValue} sub={a.baselineSec > 0 ? `Reference ${a.baselineSec.toFixed(2)}` : "Reference not established"} tone={a.baselineSec > 0 ? (l.sec > a.baselineSec * 1.05 ? "bad" : "good") : undefined} /></div></Panel>
        <Panel title="Reliability evidence" desc="Monthly inputs cannot support a specific fault diagnosis."><p className="text-sm"><EvidenceTag k="unknown" /> Machine condition remains insufficiently evidenced.</p><p className="mt-3 text-xs text-muted-foreground">Use machine passports to see measurement coverage, blocked diagnostics and the next evidence needed.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link to="/machines">Review machines <ArrowRight /></Link></Button></Panel>
        <Panel title="Savings verification" desc="Potential and realized value are kept separate."><div className="num text-2xl font-semibold">₹0 verified</div><p className="mt-1 text-xs text-muted-foreground">No outcome is marked verified. The demo intervention remains a production-normalized comparison requiring acceptance.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link to="/savings">Open verification <ArrowRight /></Link></Button></Panel>
      </div>
    </>
  );
}
