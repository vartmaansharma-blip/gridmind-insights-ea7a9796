import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCanonicalDeviations } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { EmptyState, PageHeader } from "@/components/gm/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — GridMind" }] }),
  component: AlertsPage,
});

const tone = { severe: "bg-danger-soft text-danger", material: "bg-warning-soft text-warning", normal: "bg-muted text-muted-foreground" };

function AlertsPage() {
  const { active } = useEnergy();
  const query = useQuery({
    queryKey: ["canonical-deviations", active?.id],
    queryFn: () => getCanonicalDeviations(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });

  if (!active || active.isDemo) return <EmptyState />;
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading canonical deviations…</p>;
  if (query.error) return <p className="text-sm text-danger">{query.error.message}</p>;

  const deviations = query.data ?? [];
  return (
    <>
      <PageHeader eyebrow="Alerts" title={deviations.length + " canonical deviations"} desc="Alerts are a presentation of persisted performance deviations. They are not a separate source of truth." />
      <div className="panel divide-y divide-border">
        {deviations.length === 0 && <p className="p-6 text-sm text-muted-foreground">No persisted deviations yet. Detection will populate this view from canonical observations, contexts, expectations and baselines.</p>}
        {deviations.map((d) => {
          const level = d.economicMateriality === "material" || d.economicMateriality === "high" ? "material" : d.economicMateriality === "severe" ? "severe" : "normal";
          return <div key={d.id} className="flex flex-wrap items-start gap-3 p-4">
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", tone[level])}>{level}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{d.metric} <span className="ml-1 text-xs font-normal text-muted-foreground">Deviation #{d.id}</span></div>
              <p className="text-xs text-muted-foreground">{d.direction} · actual {d.actualValue ?? "—"} vs expected {d.expectedValue ?? "—"} · persistence {d.persistence ?? "—"}</p>
            </div>
            <span className="num text-sm font-semibold">{d.deviationPercentage == null ? "—" : d.deviationPercentage.toFixed(1) + "%"}</span>
          </div>;
        })}
      </div>
    </>
  );
}