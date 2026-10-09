import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useEnergy, uid } from "@/lib/energy/store";
import { CSV_HEADER, parseMonthlyCsv } from "@/lib/energy/csv";
import { nextMonth } from "@/lib/energy/format";
import type { EquipmentCategory, Factory, MonthRecord } from "@/lib/energy/types";
import { DemoBadge, PageHeader, Panel, QualityPill } from "@/components/gm/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/factory")({
  head: () => ({
    meta: [
      { title: "Factory profile & data — GridMind" },
      { name: "description", content: "Enter or import monthly electricity bills, production and equipment for analysis." },
      { property: "og:title", content: "Factory data — GridMind" },
      { property: "og:description", content: "Enter bills, production and equipment data." },
    ],
  }),
  component: FactoryPage,
});

const n = (v: string) => v.trim() === "" ? Number.NaN : Math.max(0, Number(v));
const CATS: EquipmentCategory[] = ["compressor", "motor", "furnace", "hvac", "lighting", "other"];

function FactoryPage() {
  const { active, analysis, updateFactory, loadDemo } = useEnergy();
  const [csv, setCsv] = useState("");
  if (!active) return <div className="panel p-6"><Button variant="cta" onClick={loadDemo}>Load demo factory</Button></div>;
  const up = (fn: (f: Factory) => Factory) => updateFactory(active.id, fn);
  const setMonth = (i: number, k: keyof MonthRecord, v: string) =>
    up((f) => ({ ...f, months: f.months.map((m, j) => (j === i ? { ...m, [k]: k === "month" ? v : n(v) } : m)) }));
  const cols: [keyof MonthRecord, string][] = [["month", "Month"], ["kwh", "kWh"], ["cost", "Bill ₹"], ["peakKva", "Peak kVA"], ["production", "Production"], ["operatingHours", "Hours"], ["powerFactor", "PF"]];

  return (
    <>
      <PageHeader eyebrow="Factory data" title={active.name} actions={<>{active.isDemo && <DemoBadge />}{analysis && <QualityPill q={analysis.quality} />}</>} />
      <div className="grid gap-4">
        <Panel title="Profile" desc="From the electricity bill and plant records.">
          <div className="grid gap-3 sm:grid-cols-3">
            {([["name", "Name"], ["location", "Location"], ["sector", "Sector"], ["productUnit", "Production unit"]] as const).map(([k, l]) => (
              <div key={k} className="grid gap-1"><Label>{l}</Label><Input value={active[k]} maxLength={120} onChange={(e) => up((f) => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div className="grid gap-1"><Label>Contract demand (kVA)</Label><Input type="number" value={active.contractDemandKva} onChange={(e) => up((f) => ({ ...f, contractDemandKva: n(e.target.value) }))} /></div>
            <div className="grid gap-1"><Label>Demand charge (₹/kVA/month)</Label><Input type="number" value={active.demandChargePerKva} onChange={(e) => up((f) => ({ ...f, demandChargePerKva: n(e.target.value) }))} /></div>
          </div>
        </Panel>

        <Panel title="Monthly data" desc="One row per billing month."
          actions={<Button size="sm" variant="outline" onClick={() => up((f) => {
            const last = [...f.months].sort((x, y) => x.month.localeCompare(y.month)).at(-1)?.month;
            return { ...f, months: [...f.months, { month: last ? nextMonth(last) : new Date().toISOString().slice(0, 7), kwh: Number.NaN, cost: Number.NaN, peakKva: Number.NaN, production: Number.NaN, operatingHours: Number.NaN }] };
          })}>Add month</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr>{cols.map(([, l]) => <th key={l} className="eyebrow pb-2 text-left">{l}</th>)}<th /></tr></thead>
              <tbody>
                {active.months.map((m, i) => (
                  <tr key={i}>
                    {cols.map(([k]) => (
                      <td key={k} className="pr-1.5 pb-1.5"><Input className="num h-8" type={k === "month" ? "month" : "number"} step="any" value={k === "month" ? m.month : Number.isFinite(m[k] as number) ? m[k] : ""} onChange={(e) => setMonth(i, k, e.target.value)} /></td>
                    ))}
                    <td><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => up((f) => ({ ...f, months: f.months.filter((_, j) => j !== i) }))}><Trash2 /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">Import from CSV</summary>
            <p className="mt-2 text-xs text-muted-foreground num">Columns: {CSV_HEADER}</p>
            <Textarea className="num mt-2 text-xs" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={`${CSV_HEADER}\n2026-01,850000,6200000,1200,195000,580,0.93`} />
            <Button size="sm" className="mt-2" onClick={() => {
              const { rows, errors } = parseMonthlyCsv(csv);
              if (errors.length) toast.error(errors.slice(0, 3).join(" · "));
              if (rows.length) {
                up((f) => ({ ...f, months: [...f.months.filter((m) => !rows.some((r) => r.month === m.month)), ...rows] }));
                toast.success(`Imported ${rows.length} months`);
                setCsv("");
              }
            }}>Import</Button>
          </details>
        </Panel>

        <Panel title="Major equipment" desc="Used to estimate equipment-level opportunities and reconcile against billed kWh."
          actions={<Button size="sm" variant="outline" onClick={() => up((f) => ({ ...f, equipment: [...f.equipment, { id: uid(), name: "New equipment", category: "motor", ratedKw: 0, quantity: 1, hoursPerMonth: 500, loadFactor: 0.6 }] }))}>Add equipment</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr>{["Name", "Type", "kW each", "Qty", "Hours/mo", "Load factor"].map((h) => <th key={h} className="eyebrow pb-2 text-left">{h}</th>)}<th /></tr></thead>
              <tbody>
                {active.equipment.map((e) => {
                  const set = (patch: Partial<typeof e>) => up((f) => ({ ...f, equipment: f.equipment.map((x) => (x.id === e.id ? { ...x, ...patch } : x)) }));
                  return (
                    <tr key={e.id}>
                      <td className="pr-1.5 pb-1.5"><Input className="h-8" value={e.name} maxLength={80} onChange={(v) => set({ name: v.target.value })} /></td>
                      <td className="pr-1.5 pb-1.5">
                        <select className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm" value={e.category} onChange={(v) => set({ category: v.target.value as EquipmentCategory })}>
                          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="pr-1.5 pb-1.5"><Input className="num h-8" type="number" value={e.ratedKw} onChange={(v) => set({ ratedKw: n(v.target.value) })} /></td>
                      <td className="pr-1.5 pb-1.5"><Input className="num h-8" type="number" value={e.quantity} onChange={(v) => set({ quantity: n(v.target.value) })} /></td>
                      <td className="pr-1.5 pb-1.5"><Input className="num h-8" type="number" value={e.hoursPerMonth} onChange={(v) => set({ hoursPerMonth: Math.min(744, n(v.target.value)) })} /></td>
                      <td className="pr-1.5 pb-1.5"><Input className="num h-8" type="number" step="0.05" value={e.loadFactor} onChange={(v) => set({ loadFactor: Math.min(1, n(v.target.value)) })} /></td>
                      <td><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => up((f) => ({ ...f, equipment: f.equipment.filter((x) => x.id !== e.id) }))}><Trash2 /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        {active.isDemo && <Button variant="outline" className="justify-self-start" onClick={loadDemo}>Reset demo data</Button>}
      </div>
    </>
  );
}
