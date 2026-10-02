import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { machineQuery, label, Status } from "./machines";
import { EvidenceTag, SyntheticBadge } from "@/components/gm/evidence";
import { inrCompact } from "@/lib/energy/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/machines/$id")({
  head: () => ({
    meta: [
      { title: "Machine passport — GridMind" },
      { name: "description", content: "Machine passport: integration, sensor mapping, retrofit economics and calibration." },
      { property: "og:title", content: "Machine passport — GridMind" },
      { property: "og:description", content: "Legacy machine passport and diagnostics readiness." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(machineQuery);
    if (!d.assets.some((a) => String(a.id) === params.id)) throw notFound();
  },
  errorComponent: ({ error }) => <p className="text-sm text-danger">Could not load machine: {error.message}</p>,
  notFoundComponent: () => <p className="text-sm">Machine not found. <Link to="/machines" className="underline">Back to machines</Link></p>,
  component: Passport,
});

function Section({ title, tag, children }: { title: string; tag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center gap-2"><h2 className="font-semibold">{title}</h2>{tag}</div>
      {children}
    </section>
  );
}
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>
);
const yn = (b?: boolean | null) => (b ? "Yes" : "No");

function Passport() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(machineQuery);
  const a = data.assets.find((x) => String(x.id) === id)!;
  const t = data.types.find((x) => x.id === a.machine_type_id);
  const p = data.profiles.find((x) => x.asset_id === a.id);
  const sensors = data.sensors.filter((x) => x.asset_id === a.id);
  const r = data.retrofit.find((x) => x.asset_id === a.id);
  const cal = data.calibration.find((x) => x.asset_id === a.id);
  const events = data.events.filter((x) => x.asset_id === a.id);
  const rules = data.rules.filter((x) => x.machine_type_id === a.machine_type_id);
  const req = sensors.filter((s) => s.required);
  const ready = rules.filter((ru) => (ru.required_metrics as string[]).every((m) => sensors.some((s) => s.metric_name === m && s.available)));
  const ranges = cal?.expected_ranges && Object.keys(cal.expected_ranges).length ? cal.expected_ranges : null;
  const hasFin = r && (Number(r.estimated_opportunity_inr) > 0 || Number(r.instrumentation_cost_inr) > 0);

  return (
    <>
      <Link to="/machines" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> All machines</Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Machine passport</div>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{a.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t?.machine_type} · {a.process_role}</p>
        </div>
        <SyntheticBadge />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Identity" tag={<EvidenceTag k="estimated" />}>
          <Row k="Manufacturer / model" v={`${a.manufacturer} ${a.model}`} />
          <Row k="Installed" v={<span className="num">{a.installation_year}</span>} />
          <Row k="Rated power" v={<span className="num">{a.rated_power_kw} kW</span>} />
          <Row k="Rated capacity" v={a.rated_capacity} />
          <Row k="Criticality" v={<span className="capitalize">{a.criticality}</span>} />
          <Row k="Category" v={t?.category} />
        </Section>

        <Section title="Legacy integration mode">
          <Row k="Mode" v={label(p?.integration_mode)} />
          <Row k="Controller / PLC available" v={`${yn(p?.controller_available)} / ${yn(p?.plc_available)}`} />
          <Row k="Communication interface" v={p?.communication_interface ?? "None (legacy)"} />
          <Row k="Gateway required" v={yn(p?.gateway_required)} />
          <Row k="Retrofit required" v={yn(p?.retrofit_required)} />
          <Row k="Manual data / indirect inference" v={`${yn(p?.manual_data_allowed)} / ${yn(p?.indirect_inference_allowed)}`} />
          {p?.notes && <p className="mt-2 text-xs text-muted-foreground">{p.notes}</p>}
        </Section>

        <Section title="Sensor & measurement mapping" tag={<span className="num text-xs text-muted-foreground">{req.filter((s) => s.available).length}/{req.length} required available</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground"><tr>{["Metric", "Class", "Unit", "Req.", "Source", "Status"].map((h) => <th key={h} className="pb-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {sensors.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-1.5 font-mono">{s.metric_name}</td>
                    <td className="capitalize">{s.measurement_class}</td>
                    <td>{s.unit}</td>
                    <td>{s.required ? "Yes" : "—"}</td>
                    <td className="capitalize">{s.source_type}</td>
                    <td><span className={cn("rounded px-1.5 py-px text-[10px] font-semibold uppercase", s.available ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>{s.available ? "Live" : s.installation_status?.replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Retrofit economics" tag={<EvidenceTag k="estimated" />}>
          {r ? (
            <>
              <Row k="Annual energy cost" v={hasFin ? inrCompact(Number(r.annual_energy_cost_inr)) : "Needs data"} />
              <Row k="Annual downtime cost" v={hasFin ? inrCompact(Number(r.annual_downtime_cost_inr)) : "Needs data"} />
              <Row k="Estimated opportunity" v={hasFin ? inrCompact(Number(r.estimated_opportunity_inr)) : "Needs data"} />
              <Row k="Instrumentation cost" v={hasFin ? inrCompact(Number(r.instrumentation_cost_inr)) : "Needs quote"} />
              <Row k="Expected payback" v={r.expected_payback_months ? `${r.expected_payback_months} months` : "—"} />
              <Row k="Criticality / diagnostic value" v={<span className="num">{r.criticality_score} / {r.diagnostic_value_score}</span>} />
              <Row k="Priority · decision" v={<span className="capitalize">{r.retrofit_priority} · {r.decision}</span>} />
              {r.rationale && <p className="mt-2 text-xs text-muted-foreground">{r.rationale}</p>}
            </>
          ) : <p className="text-sm text-muted-foreground">No assessment yet.</p>}
        </Section>

        <Section title="Calibration & fingerprint">
          <Row k="Status" v={<Status s={cal?.calibrated_at ? "calibrated" : a.calibration_status} />} />
          <Row k="Baseline window" v={`${cal?.baseline_window_days ?? 30} days`} />
          <Row k="Model" v={<span className="font-mono text-xs">{cal?.model_version}</span>} />
          <Row k="Calibrated at" v={cal?.calibrated_at ? new Date(cal.calibrated_at).toLocaleDateString() : "Not yet"} />
          {ranges ? (
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-[11px]">{JSON.stringify(ranges, null, 2)}</pre>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No fingerprint yet. A normal-operating baseline needs {cal?.baseline_window_days ?? 30} days of measured data from the required sensors above.</p>
          )}
        </Section>

        <Section title="Diagnostics readiness" tag={<EvidenceTag k="hypothesis" />}>
          <p className="mb-2 text-xs text-muted-foreground"><span className="num">{ready.length}/{rules.length}</span> diagnostic rules can run with current measurements.</p>
          <ul className="space-y-1 text-xs">
            {rules.map((ru) => {
              const ok = ready.includes(ru);
              return (
                <li key={ru.id} className="flex items-start justify-between gap-3 border-b border-border py-1 last:border-0">
                  <span>{ru.problem_name} <span className="text-muted-foreground">· needs {(ru.required_metrics as string[]).join(", ")}</span></span>
                  <span className={ok ? "text-success" : "text-muted-foreground"}>{ok ? "Ready" : "Blocked"}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <div className="mt-4">
        <Section title="Intelligence findings">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings yet. Findings appear only after measured data arrives — nothing is shown as <EvidenceTag k="observed" /> or <EvidenceTag k="verified" /> without real measurements.</p>
          ) : events.map((e) => (
            <div key={e.id} className="border-b border-border py-2 text-sm last:border-0">
              <div className="flex gap-2"><EvidenceTag k={e.status === "verified" ? "verified" : "hypothesis"} /><b>{e.event_type}</b><span className="ml-auto num">{e.estimated_impact_inr ? inrCompact(Number(e.estimated_impact_inr)) : ""}</span></div>
              {e.recommended_action && <p className="mt-1 text-xs"><EvidenceTag k="recommended" /> {e.recommended_action}</p>}
            </div>
          ))}
        </Section>
      </div>
    </>
  );
}
