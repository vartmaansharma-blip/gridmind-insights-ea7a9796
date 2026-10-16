import { createFileRoute } from "@tanstack/react-router";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact, monthLabel } from "@/lib/energy/format";
import { EmptyState, PageHeader, Panel } from "@/components/gm/bits";

export const Route = createFileRoute("/energy")({
  head: () => ({
    meta: [
      { title: "Energy trends — GridMind" },
      { name: "description", content: "Monthly consumption, cost and demand trends normalised to production." },
      { property: "og:title", content: "Energy trends — GridMind" },
      { property: "og:description", content: "Consumption, cost and demand trends for your factory." },
    ],
  }),
  component: EnergyPage,
});

const ax = { fontSize: 11, fill: "var(--muted-foreground)" };

function EnergyPage() {
  const { active, analysis: a } = useEnergy();
  if (!active || !a?.hasData) return <EmptyState />;
  const data = a.rows.map((r) => ({ ...r, m: monthLabel(r.month), sec: +r.sec.toFixed(3), rate: +r.costPerKwh.toFixed(2) }));

  return (
    <>
      <PageHeader eyebrow="Energy" title="Consumption, cost & demand" desc="Each chart pairs usage with what drives money: production efficiency, effective tariff and billed demand." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Consumption vs energy per unit" desc="Bars: kWh. Line: kWh per unit — rising line means efficiency loss, not just more output.">
          <div className="h-64"><ResponsiveContainer>
            <ComposedChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" tick={ax} /><YAxis yAxisId="l" tick={ax} tickFormatter={(v) => `${v / 1000}k`} /><YAxis yAxisId="r" orientation="right" tick={ax} domain={["auto", "auto"]} />
              <Tooltip /><Bar yAxisId="l" dataKey="kwh" name="kWh" fill="var(--chart-4)" radius={[3, 3, 0, 0]} />
              <Line yAxisId="r" dataKey="sec" name="kWh/unit" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
            </ComposedChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Bill vs effective ₹/kWh" desc="Rate rise without usage rise points to tariff or demand charges.">
          <div className="h-64"><ResponsiveContainer>
            <ComposedChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" tick={ax} /><YAxis yAxisId="l" tick={ax} tickFormatter={(v) => inrCompact(v)} /><YAxis yAxisId="r" orientation="right" tick={ax} domain={["auto", "auto"]} />
              <Tooltip /><Bar yAxisId="l" dataKey="cost" name="Bill ₹" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Line yAxisId="r" dataKey="rate" name="₹/kWh" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
            </ComposedChart></ResponsiveContainer></div>
        </Panel>
        <Panel className="lg:col-span-2" title="Peak demand vs contract" desc="Recorded peaks against contract demand. Billed demand and any minimum floor must be reconciled to the actual bill, utility, tariff class and effective period.">
          <div className="h-64"><ResponsiveContainer>
            <ComposedChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" tick={ax} /><YAxis tick={ax} domain={[0, Math.ceil(active.contractDemandKva * 1.1)]} /><Tooltip />
              <Bar dataKey="peakKva" name="Peak kVA" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <ReferenceLine y={active.contractDemandKva} stroke="var(--danger)" strokeDasharray="4 4" label={{ value: "Contract", fontSize: 11, fill: "var(--danger)" }} />

            </ComposedChart></ResponsiveContainer></div>
        </Panel>
      </div>
    </>
  );
}
