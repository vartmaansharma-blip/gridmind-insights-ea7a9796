import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getCanonicalMachineSnapshots } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";

export const Route = createFileRoute("/machines/$id")({
  head: () => ({ meta: [{ title: "Asset — GridMind" }] }),
  component: AssetPage,
});

function AssetPage() {
  const { id } = Route.useParams();
  const { active } = useEnergy();
  const query = useQuery({
    queryKey: ["canonical-machines", active?.id],
    queryFn: () => getCanonicalMachineSnapshots(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });

  if (!active || active.isDemo) return null;
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading asset…</p>;
  if (query.error) return <p className="text-sm text-danger">{query.error.message}</p>;

  const asset = (query.data ?? []).find((x) => String(x.id) === id);
  if (!asset) return <p className="text-sm">Asset not found. <Link to="/machines" className="underline">Back to assets</Link></p>;

  return (
    <>
      <Link to="/machines" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> All assets</Link>
      <div className="mb-6"><div className="eyebrow">Canonical physical asset</div><h1 className="mt-1 text-2xl font-semibold">{asset.name}</h1><p className="mt-1 text-sm text-muted-foreground">{asset.machineType?.name ?? "Unclassified"} · {asset.processRole ?? "Role unknown"}</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Physical identity</h2>
          <div className="space-y-2 text-sm">
            <p>Manufacturer / model: {asset.manufacturer ?? "—"} {asset.model ?? ""}</p>
            <p>Rated power: {asset.ratedPowerKw == null ? "—" : asset.ratedPowerKw + " kW"}</p>
            <p>Rated capacity: {asset.ratedCapacity ?? "—"}</p>
            <p>Installed: {asset.installationYear ?? "—"}</p>
            <p>Criticality: {asset.criticality ?? "—"}</p>
            <p>Connectivity: {asset.connectivityMode ?? "—"}</p>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 font-semibold">Canonical data sources</h2>
          {asset.dataSources.length === 0 ? <p className="text-sm text-muted-foreground">No source mapped.</p> : asset.dataSources.map((s) => <div key={s.id} className="mb-2 rounded border border-border p-2 text-sm"><b>{s.name}</b><div className="text-xs text-muted-foreground">{s.sourceType} · {s.status} · {s.timezone}</div></div>)}
          <h3 className="mb-2 mt-4 text-sm font-semibold">Mappings</h3>
          {asset.mappings.map((m) => <p key={m.id} className="text-xs text-muted-foreground">{m.sourceField} → {m.canonicalMetric} · {m.unit ?? "—"} · {m.status}</p>)}
        </section>
        <section className="panel p-5 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Canonical observations</h2>
          {asset.observations.length === 0 ? <p className="text-sm text-muted-foreground">No observations yet.</p> : asset.observations.slice(0, 100).map((o) => <div key={o.id} className="flex flex-wrap gap-3 border-b border-border py-2 text-sm last:border-0"><span className="font-mono text-xs">{o.metric}</span><span className="num">{o.valueNumeric ?? o.valueText ?? "—"} {o.unit ?? ""}</span><span className="text-xs text-muted-foreground">{new Date(o.observedAt).toLocaleString()}</span><span className="text-xs">{o.qualityStatus}</span></div>)}
        </section>
      </div>
    </>
  );
}