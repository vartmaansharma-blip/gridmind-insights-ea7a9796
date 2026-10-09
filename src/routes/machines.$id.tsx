import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getCanonicalMachineSnapshots } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { Button } from "@/components/ui/button";
import { runCanonicalFactoryAnalysis, type CanonicalFactoryAnalysisRun } from "@/lib/gridmind/analysis-runner";

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
  const [analysisRun, setAnalysisRun] = useState<CanonicalFactoryAnalysisRun | null>(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pendingAnalysisKey, setPendingAnalysisKey] = useState<string | null>(null);

  if (!active || active.isDemo) return null;
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading asset…</p>;
  if (query.error) return <p className="text-sm text-danger">{query.error.message}</p>;

  const asset = (query.data ?? []).find((x) => String(x.id) === id);
  if (!asset) return <p className="text-sm">Asset not found. <Link to="/machines" className="underline">Back to assets</Link></p>;

  const runAnalysis = async () => {
    setAnalysisBusy(true);
    setAnalysisError(null);
    const idempotencyKey = pendingAnalysisKey ?? crypto.randomUUID();
    setPendingAnalysisKey(idempotencyKey);
    try {
      const run = await runCanonicalFactoryAnalysis(Number(active.id), asset.id, idempotencyKey);
      setAnalysisRun(run);
      setPendingAnalysisKey(null);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Factory analysis could not be completed.");
    } finally {
      setAnalysisBusy(false);
    }
  };

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
        <section className="panel p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="mb-1 font-semibold">Authoritative factory analysis</h2>
              <p className="text-sm text-muted-foreground">Assembles explicitly mapped canonical observations, calculates on the server, then reloads and reproduces the stored result.</p>
            </div>
            <Button onClick={runAnalysis} disabled={analysisBusy}>
              {analysisBusy ? "Running and verifying…" : pendingAnalysisKey ? "Retry same analysis" : "Run and verify"}
            </Button>
          </div>
          {analysisError && <p role="alert" className="mt-3 text-sm text-danger">{analysisError}</p>}
          {analysisRun && (() => {
            const result = analysisRun.verification.recomputed;
            const verified = analysisRun.verification.reproducible;
            const verifiedOpportunity = verified && result.status === "opportunity" && result.economics.quantified;
            return (
              <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Conclusion: {result.status.replaceAll("_", " ")}</span>
                  <span className={verified ? "rounded bg-emerald-50 px-2 py-1 text-emerald-800" : "rounded bg-red-50 px-2 py-1 text-red-800"}>
                    {verified ? "Reload verified" : "REPRODUCIBILITY MISMATCH"}
                  </span>
                  <span className="text-xs text-muted-foreground">{result.algorithmVersion}</span>
                </div>
                <p>Reference: {result.reference.sampleCount} comparable historical periods · {result.reference.confidence} confidence</p>
                <p>Specific energy: actual {result.deviation.actualSpecificEnergyKwhPerUnit == null ? "—" : result.deviation.actualSpecificEnergyKwhPerUnit.toFixed(4) + " kWh/unit"} · reference {result.reference.specificEnergyKwhPerUnit == null ? "—" : result.reference.specificEnergyKwhPerUnit.toFixed(4) + " kWh/unit"}</p>
                <p>Deviation: {result.deviation.detected ? result.deviation.deltaPercent == null ? "detected; percentage unavailable" : result.deviation.deltaPercent.toFixed(2) + "%" : "not established"}</p>
                {verifiedOpportunity ? (
                  <p>Estimated net value: {result.economics.currency} {result.economics.estimatedNetValueInr?.toLocaleString("en-IN")}. This is an estimate, not verified savings.</p>
                ) : (
                  <p>No actionable opportunity claim is being presented. {result.economics.quantified && !verified ? "Stored and recomputed results differ." : "The evidence or economic inputs do not support a positive, reproducible opportunity."}</p>
                )}
                {result.reasonCodes.length > 0 && <p className="text-muted-foreground">Refusal / limitation codes: {result.reasonCodes.join(", ")}</p>}
                <p className="text-xs text-muted-foreground">Source observation IDs: {result.provenance.inputObservationIds.length ? result.provenance.inputObservationIds.join(", ") : "none"} · Run ID: {analysisRun.run.id}</p>
                {result.reference.limitations.map((limitation) => <p key={limitation} className="text-xs text-muted-foreground">{limitation}</p>)}
              </div>
            );
          })()}
        </section>
      </div>
    </>
  );
}