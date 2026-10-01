import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact, num, pct } from "@/lib/energy/format";
import { Delta, DemoBadge, EmptyState, Kpi, PageHeader, Panel, QualityPill } from "@/components/gm/bits";
import { FindingFlow, FindingHeader } from "@/components/gm/finding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — GridMind Factory Energy Intelligence" },
      { name: "description", content: "Monthly electricity cost, demand, energy per unit and estimated savings for your factory." },
      { property: "og:title", content: "Overview — GridMind" },
      { property: "og:description", content: "See where your factory loses money on electricity." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { active, analysis: a } = useEnergy();
  if (!active || !a?.hasData || !a.latest) return <EmptyState />;
  const l = a.latest, p = a.prev;
  const d = (x: number, y?: number) => (y ? x / y - 1 : 0);
  return (
    <>
      <PageHeader eyebrow="Overview" title={active.name} desc={active.location}
        actions={<>{active.isDemo && <DemoBadge />}<QualityPill q={a.quality} /></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="Estimated savings opportunity" tone="accent" value={`${inrCompact(a.totalSavingAnnual)}/yr`} sub={`${a.opportunities.length} actions identified · estimated`} />
        <Kpi label="Electricity cost (latest)" value={inrCompact(l.cost)} sub={<Delta v={d(l.cost, p?.cost)} />} />
        <Kpi label="Consumption" value={`${num(l.kwh)} kWh`} sub={<Delta v={d(l.kwh, p?.kwh)} />} />
        <Kpi label="Peak demand" value={`${num(l.peakKva)} kVA`} sub={`${pct(l.utilization)} of ${num(active.contractDemandKva)} kVA contract`} />
        <Kpi label="Production" value={num(l.production)} sub={<Delta v={d(l.production, p?.production)} invert />} />
        <Kpi label={`Energy per ${active.productUnit}`} value={`${l.sec.toFixed(2)} kWh`} sub={`Benchmark ${a.baselineSec.toFixed(2)} (best months)`} tone={l.sec > a.baselineSec * 1.05 ? "bad" : "good"} />
      </div>
      <Panel className="mt-6" title="Top findings" desc="Ranked by expected annual saving. All figures are engineering estimates."
        actions={<Button variant="outline" size="sm" asChild><Link to="/opportunities">All <ArrowRight /></Link></Button>}>
        <div className="grid gap-5">
          {a.opportunities.slice(0, 3).map((o, i) => (
            <div key={o.id}><FindingHeader o={o} rank={i + 1} /><FindingFlow o={o} /></div>
          ))}
        </div>
      </Panel>
    </>
  );
}
