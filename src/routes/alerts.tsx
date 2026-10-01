import { createFileRoute } from "@tanstack/react-router";
import { useEnergy } from "@/lib/energy/store";
import { inrCompact, monthLabel } from "@/lib/energy/format";
import { EmptyState, PageHeader } from "@/components/gm/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — GridMind" },
      { name: "description", content: "Abnormal consumption, demand and power factor patterns in your factory." },
      { property: "og:title", content: "Alerts — GridMind" },
      { property: "og:description", content: "Abnormal energy patterns flagged automatically." },
    ],
  }),
  component: AlertsPage,
});

const tone = { critical: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning", info: "bg-muted text-muted-foreground" };

function AlertsPage() {
  const { analysis: a } = useEnergy();
  if (!a?.hasData) return <EmptyState />;
  return (
    <>
      <PageHeader eyebrow="Alerts" title={`${a.alerts.length} patterns flagged`} desc="Rule-based checks on demand, energy per unit, consumption spikes, tariff and power factor." />
      <div className="panel divide-y divide-border">
        {a.alerts.length === 0 && <p className="p-6 text-sm text-muted-foreground">No abnormal patterns detected.</p>}
        {a.alerts.map((al) => (
          <div key={al.id} className="flex flex-wrap items-start gap-3 p-4">
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tone[al.severity])}>{al.severity}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{al.title} <span className="num ml-1 text-xs font-normal text-muted-foreground">{monthLabel(al.month)}</span></div>
              <p className="text-xs text-muted-foreground">{al.detail}</p>
            </div>
            {al.impactInr ? <span className="num text-sm font-semibold">~{inrCompact(al.impactInr)}</span> : null}
          </div>
        ))}
      </div>
    </>
  );
}
