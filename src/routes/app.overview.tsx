import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact, num, pct } from "@/lib/energy/format";
import { Delta, DemoBadge, EmptyState, Kpi, PageHeader, Panel, ProcessRail, QualityPill } from "@/components/gm/bits";
import { FindingFlow, FindingHeader } from "@/components/gm/finding";
import { buildIntelligenceOpportunities, moneyAtRisk } from "@/lib/energy/intelligence";
import { EvidenceTag } from "@/components/gm/evidence";

export const Route = createFileRoute("/app/overview")({
  head: () => ({
    meta: [
      { title: "Factory overview — GridMind Staff Workspace" },
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
  if (!active || !a?.hasData || !a.latest) return <EmptyState />;
  const l = a.latest, p = a.prev;
  const opportunities = buildIntelligenceOpportunities(active, a);
  const risk = moneyAtRisk(opportunities);
  const d = (x: number, y?: number) => (y ? x / y - 1 : 0);
  return (
    <>
      <PageHeader eyebrow="Factory Performance Intelligence" title={active.name} desc={`${active.location} · Where value is exposed, what supports it, and what to do next.`}
        actions={<>{active.isDemo && <DemoBadge />}<QualityPill q={a.quality} /></>} />
      <ProcessRail active={5} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Money at risk" tone="accent" value={`${inrCompact(risk)}/yr`} sub="Estimated exposure · not verified loss" />
        <Kpi label="Potential saving" value={`${inrCompact(a.totalSavingAnnual)}/yr`} sub={`${opportunities.filter((o) => o.savingAnnual > 0).length} quantified opportunities`} />
        <Kpi label="Electricity cost (latest)" value={inrCompact(l.cost)} sub={<Delta v={d(l.cost, p?.cost)} />} />
        <Kpi label="Peak demand" value={`${num(l.peakKva)} kVA`} sub={`${pct(l.utilization)} of ${num(active.contractDemandKva)} kVA contract`} />
      </div>
      <Panel className="mt-6" title="Top findings" desc="Ranked by expected annual saving. All figures are engineering estimates."
        actions={<Button variant="outline" size="sm" asChild><Link to="/opportunities">All <ArrowRight /></Link></Button>}>
        <div className="grid gap-5">
          {opportunities.slice(0, 3).map((o, i) => (
            <div key={o.id}><FindingHeader o={o} rank={i + 1} /><FindingFlow o={o} /></div>
          ))}
        </div>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Energy & cost performance" desc="Production-normalized evidence, not a machine diagnosis."><div className="grid grid-cols-2 gap-4"><Kpi label="Consumption" value={`${num(l.kwh)} kWh`} sub={<Delta v={d(l.kwh, p?.kwh)} />} /><Kpi label={`Energy / ${active.productUnit}`} value={`${l.sec.toFixed(2)} kWh`} sub={`Reference ${a.baselineSec.toFixed(2)}`} tone={l.sec > a.baselineSec * 1.05 ? "bad" : "good"} /></div></Panel>
        <Panel title="Reliability evidence" desc="Monthly inputs cannot support a specific fault diagnosis."><p className="text-sm"><EvidenceTag k="unknown" /> Machine condition remains insufficiently evidenced.</p><p className="mt-3 text-xs text-muted-foreground">Use machine passports to see measurement coverage, blocked diagnostics and the next evidence needed.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link to="/machines">Review machines <ArrowRight /></Link></Button></Panel>
        <Panel title="Savings verification" desc="Potential and realized value are kept separate."><div className="num text-2xl font-semibold">₹0 verified</div><p className="mt-1 text-xs text-muted-foreground">No outcome is marked verified. The demo intervention remains a production-normalized comparison requiring acceptance.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link to="/savings">Open verification <ArrowRight /></Link></Button></Panel>
      </div>
    </>
  );
}
