import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useEnergy, uid } from "@/lib/energy/store";
import { verifyIntervention } from "@/lib/energy/analysis";
import { inr, inrCompact, monthLabel, num } from "@/lib/energy/format";
import { EmptyState, Kpi, PageHeader, Panel } from "@/components/gm/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings verification — GridMind" },
      { name: "description", content: "Production-normalised before/after verification of energy savings interventions." },
      { property: "og:title", content: "Savings verification — GridMind" },
      { property: "og:description", content: "Baseline vs post-intervention savings, transparently calculated." },
    ],
  }),
  component: SavingsPage,
});

function SavingsPage() {
  const { active, analysis: a, updateFactory } = useEnergy();
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState("");
  const [cost, setCost] = useState("");
  if (!active || !a?.hasData) return <EmptyState />;
  const label = active.isDemo ? "Estimated · demo data" : "Calculated from entered bills · not meter-verified";
  return (
    <>
      <PageHeader eyebrow="Savings" title="Before / after verification" desc="Baseline = energy per unit in up to 6 months before the intervention. Expected kWh = baseline × post production. Savings = expected − actual." />
      <div className="grid gap-4">
        {active.interventions.map((iv) => {
          const v = verifyIntervention(a.rows, iv);
          return (
            <Panel key={iv.id} title={iv.title} desc={`Implemented ${monthLabel(iv.implementedMonth)} · ${label}`}>
              {!v.ok ? <p className="text-sm text-muted-foreground">{v.reason}</p> : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Kpi label="Baseline" value={`${v.baselineSec.toFixed(3)} kWh/u`} sub={`${v.preMonths.length} months pre`} />
                  <Kpi label="Post-intervention" value={`${v.postSec.toFixed(3)} kWh/u`} sub={`${v.postMonths.length} months post`} />
                  <Kpi label="Energy saved" value={`${num(v.savedKwh)} kWh`} sub={`${num(v.expectedKwh)} expected vs ${num(v.actualKwh)} actual`} />
                  <Kpi label="Savings to date" tone="accent" value={inrCompact(v.savedInr)} sub={`${inrCompact(v.annualisedInr)}/yr · payback ${v.paybackMonths ? v.paybackMonths.toFixed(1) + " mo" : "—"} on ${inr(iv.cost)}`} />
                </div>
              )}
            </Panel>
          );
        })}
        <Panel title="Log an intervention" desc="Record what was changed and when; verification updates as new months are entered.">
          <form className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]" onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !/^\d{4}-\d{2}$/.test(month)) return;
            updateFactory(active.id, (f) => ({ ...f, interventions: [...f.interventions, { id: uid(), title: title.trim().slice(0, 120), implementedMonth: month, cost: Math.max(0, Number(cost) || 0) }] }));
            setTitle(""); setMonth(""); setCost("");
          }}>
            <Input placeholder="e.g. VFD on cooling tower fans" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <Input type="number" min={0} placeholder="Cost ₹" value={cost} onChange={(e) => setCost(e.target.value)} />
            <Button type="submit">Add</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
