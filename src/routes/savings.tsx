import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getCanonicalMachineSnapshots, getCanonicalVerification, createCanonicalIntervention } from "@/lib/gridmind/repository";
import { useEnergy } from "@/lib/energy/store";
import { currencyAmount } from "@/lib/energy/format";
import { EmptyState, PageHeader, Panel } from "@/components/gm/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/savings")({
  head: () => ({ meta: [{ title: "Verification — GridMind" }] }),
  component: SavingsPage,
});

function SavingsPage() {
  const { active } = useEnergy();
  const queryClient = useQueryClient();
  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");

  const verification = useQuery({
    queryKey: ["canonical-verification", active?.id],
    queryFn: () => getCanonicalVerification(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });
  const assets = useQuery({
    queryKey: ["canonical-machines", active?.id],
    queryFn: () => getCanonicalMachineSnapshots(Number(active!.id)),
    enabled: Boolean(active && !active.isDemo),
  });

  if (!active || active.isDemo) return <EmptyState />;
  if (verification.isLoading || assets.isLoading) return <p className="text-sm text-muted-foreground">Loading verification records…</p>;
  if (verification.error) return <p className="text-sm text-danger">{verification.error.message}</p>;

  const v = verification.data!;
  return (
    <>
      <PageHeader eyebrow="Verification" title="Interventions and verified outcomes" desc="An intervention is not a verified saving. GridMind only marks value verified through a canonical verification run and outcome." />
      <div className="grid gap-4">
        <Panel title="Verified outcomes">
          {v.outcomes.length === 0 ? <p className="text-sm text-muted-foreground">No verified outcomes yet. Improvement after an intervention is not treated as a verified economic result.</p> : v.outcomes.map((o) => (
            <div key={o.id} className="border-b border-border py-3 last:border-0">
              <div className="flex flex-wrap justify-between gap-2"><b>Outcome #{o.id}</b><span className="text-xs uppercase">{o.verification_status}</span></div>
              <div className="mt-1 text-sm">Economic value: {o.economic_value == null ? "—" : currencyAmount(o.economic_value, o.currency, true)} · Net value: {o.net_value == null ? "—" : currencyAmount(o.net_value, o.currency, true)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Intervention #{o.intervention_id} · Verification run #{o.verification_run_id ?? "—"} · attribution {o.attribution_method ?? "—"}</div>
            </div>
          ))}
        </Panel>

        <Panel title="Verification runs">
          {v.runs.length === 0 ? <p className="text-sm text-muted-foreground">No verification runs yet.</p> : v.runs.map((r) => (
            <div key={r.id} className="border-b border-border py-3 last:border-0 text-sm">
              <b>Run #{r.id}</b> · {r.status}
              <div className="mt-1 text-xs text-muted-foreground">Baseline {r.baseline_value ?? "—"} · Counterfactual {r.counterfactual_value ?? "—"} · Observed {r.observed_value ?? "—"} · Attributed {r.attributed_effect ?? "—"}</div>
            </div>
          ))}
        </Panel>

        <Panel title="Log implemented intervention" desc="This records the physical intervention only. A verification plan/run must establish attribution before any value becomes verified.">
          <form className="grid gap-2 sm:grid-cols-[1.5fr_2fr_1fr_1fr_auto]" onSubmit={async (e) => {
            e.preventDefault();
            if (!assetId || !title.trim() || !date) return;
            try {
              await createCanonicalIntervention({ factoryId: Number(active.id), assetId: Number(assetId), title: title.trim().slice(0, 200), implementedAt: new Date(date).toISOString(), cost: Math.max(0, Number(cost) || 0) });
              await queryClient.invalidateQueries({ queryKey: ["canonical-verification", active.id] });
              setTitle(""); setDate(""); setCost("");
            } catch (error) {
              console.error("[GridMind] intervention creation failed", error);
            }
          }}>
            <select className="h-9 rounded-md border border-input bg-card px-2 text-sm" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">Target asset</option>
              {(assets.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <Input placeholder="What changed?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="number" min={0} placeholder="Cost ₹" value={cost} onChange={(e) => setCost(e.target.value)} />
            <Button type="submit">Record</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}