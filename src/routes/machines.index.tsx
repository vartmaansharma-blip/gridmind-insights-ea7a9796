import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getMachineData } from "@/lib/machines.functions";
import { PageHeader } from "@/components/gm/bits";
import { EvidenceLegend, EvidenceTag, SyntheticBadge } from "@/components/gm/evidence";
import { cn } from "@/lib/utils";

export const machineQuery = queryOptions({ queryKey: ["machines"], queryFn: () => getMachineData() });

export const MODE_LABEL: Record<string, string> = {
  native_digital: "Native digital (PLC/controller)",
  electrical_retrofit: "Electrical retrofit (clamp-on meter)",
  sensor_retrofit: "Sensor retrofit (process sensors)",
  manual_entry: "Manual entry / logbook",
  indirect_inference: "Indirect inference",
  retrofit_electrical: "Electrical retrofit",
  retrofit_sensors: "Sensor retrofit",
};
export const label = (s?: string | null) => (s ? MODE_LABEL[s] ?? s.replace(/_/g, " ") : "—");

export const Route = createFileRoute("/machines/")({
  head: () => ({
    meta: [
      { title: "Machines — GridMind" },
      { name: "description", content: "Legacy machine passports, integration modes, sensor coverage and retrofit priority." },
      { property: "og:title", content: "Machines — GridMind" },
      { property: "og:description", content: "Machine intelligence for legacy factory equipment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(machineQuery),
  errorComponent: ({ error }) => <p className="text-sm text-danger">Could not load machines: {error.message}</p>,
  notFoundComponent: () => <p>Not found</p>,
  component: MachinesPage,
});

function MachinesPage() {
  const { data } = useSuspenseQuery(machineQuery);
  const typeOf = (id: number) => data.types.find((t) => t.id === id);
  return (
    <>
      <PageHeader eyebrow="Machine intelligence" title={`${data.assets.length} machines registered`}
        desc="Legacy machines are integrated without assuming native connectivity. Each passport shows how data can be obtained, what is measured, and whether instrumentation pays back."
        actions={<SyntheticBadge />} />
      <div className="mb-6"><EvidenceLegend /></div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              {["Machine", "Type", "Integration mode", "Sensor coverage", "Calibration", "Criticality", "Retrofit"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.assets.map((a) => {
              const p = data.profiles.find((x) => x.asset_id === a.id);
              const s = data.sensors.filter((x) => x.asset_id === a.id);
              const req = s.filter((x) => x.required);
              const avail = req.filter((x) => x.available).length;
              const cal = data.calibration.find((x) => x.asset_id === a.id);
              const r = data.retrofit.find((x) => x.asset_id === a.id);
              return (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="p-3"><Link to="/machines/$id" params={{ id: String(a.id) }} className="font-semibold underline-offset-2 hover:underline">{a.name}</Link>
                    <div className="num text-xs text-muted-foreground">{a.model} · {a.installation_year}</div></td>
                  <td className="p-3 text-xs">{typeOf(a.machine_type_id)?.machine_type}</td>
                  <td className="p-3 text-xs">{label(p?.integration_mode ?? a.connectivity_mode)}</td>
                  <td className="p-3"><span className="num">{avail}/{req.length}</span> <span className="text-xs text-muted-foreground">required</span></td>
                  <td className="p-3"><Status s={cal?.calibrated_at ? "calibrated" : a.calibration_status} /></td>
                  <td className="p-3 text-xs capitalize">{a.criticality}</td>
                  <td className="p-3 text-xs capitalize">{r?.retrofit_priority ?? a.retrofit_priority} · {r?.decision}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><EvidenceTag k="estimated" /> Coverage and retrofit values are screening estimates until real meters are installed.</p>
    </>
  );
}

export function Status({ s }: { s?: string | null }) {
  const ok = s === "calibrated";
  return <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{(s ?? "unknown").replace(/_/g, " ")}</span>;
}
