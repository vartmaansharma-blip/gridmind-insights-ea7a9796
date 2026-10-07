import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCanonicalMachineSnapshots } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { PageHeader, EmptyState } from "@/components/gm/bits";

export const Route = createFileRoute("/machines/")({
  head: () => ({ meta: [{ title: "Machines — GridMind" }] }),
  component: MachinesPage,
});

function MachinesPage() {
  const { active } = useEnergy();
  const query = useQuery({
    queryKey: ["canonical-machines", active?.id],
    queryFn: () => getCanonicalMachineSnapshots(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });

  if (!active || active.isDemo) return <EmptyState />;
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading canonical assets…</p>;
  if (query.error) return <p className="text-sm text-danger">Could not load assets: {query.error.message}</p>;

  const assets = query.data ?? [];
  return (
    <>
      <PageHeader eyebrow="Physical world" title={assets.length + " assets"} desc="Canonical physical assets, their data sources, mappings and observations." />
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            {["Asset", "Type", "Role", "Connectivity", "Sources", "Observations"].map((h) => <th key={h} className="p-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="p-3"><Link to="/machines/$id" params={{ id: String(a.id) }} className="font-semibold hover:underline">{a.name}</Link></td>
                <td className="p-3 text-xs">{a.machineType?.name ?? "Unclassified"}</td>
                <td className="p-3 text-xs">{a.processRole ?? "—"}</td>
                <td className="p-3 text-xs">{a.connectivityMode ?? "unknown"}</td>
                <td className="p-3 num">{a.dataSources.length}</td>
                <td className="p-3 num">{a.observations.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}