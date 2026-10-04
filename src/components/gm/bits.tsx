import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight, Database, FlaskConical, Gauge, PlugZap, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEnergy } from "@/lib/energy/store";
import type { Confidence } from "@/lib/energy/types";
import type { DataQuality } from "@/lib/energy/analysis";

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between rise">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ProcessRail({ active = 0 }: { active?: number }) {
  const steps = ["Factory", "System", "Asset", "Sensor", "Measurement", "Finding", "Action", "Outcome"];
  return <ol className="mb-6 flex overflow-x-auto border-y border-border py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{steps.map((step, i) => <li key={step} className={cn("flex min-w-max items-center", i <= active && "text-foreground")}><span className={cn("mr-2 size-1.5 rounded-full bg-border", i <= active && "bg-cta")} />{step}{i < steps.length - 1 && <span className="mx-3 text-border">/</span>}</li>)}</ol>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning", className)}>
      <FlaskConical className="size-3" /> Demo data · fictional factory
    </span>
  );
}

export function EstimatedTag() {
  return <span className="rounded border border-border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Est.</span>;
}

export function QualityPill({ q }: { q: DataQuality }) {
  const tone = q.grade === "Good" ? "bg-success-soft text-success" : q.grade === "Fair" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger";
  return (
    <Link to="/factory" title={q.issues.join("\n") || "All key fields present"} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      <Database className="size-3.5" /> Data quality: {q.grade} <span className="num opacity-70">{q.score}/100</span>
    </Link>
  );
}

export function ConfidenceDots({ c }: { c: Confidence }) {
  const n = c === "high" ? 3 : c === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title={`${c} confidence`}>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-2.5 w-1 rounded-sm", i < n ? "bg-foreground" : "bg-border")} />
        ))}
      </span>
      <span className="capitalize">{c}</span>
    </span>
  );
}

export function Kpi({ label, value, sub, tone, hint }: { label: string; value: string; sub?: ReactNode; tone?: "good" | "bad" | "accent"; hint?: string }) {
  return (
    <div className={cn("panel p-4 sm:p-5 rise", tone === "accent" && "border-cta/60 bg-warning-soft")} title={hint}>
      <div className="eyebrow">{label}</div>
      <div className="num mt-2 text-2xl font-semibold sm:text-[1.7rem]">{value}</div>
      {sub && <div className={cn("mt-1 text-xs", tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-muted-foreground")}>{sub}</div>}
    </div>
  );
}

export function Delta({ v, invert = false, suffix = "vs prev. month" }: { v: number; invert?: boolean; suffix?: string }) {
  const bad = invert ? v < 0 : v > 0;
  return (
    <span className={bad ? "text-danger" : "text-success"}>
      {v > 0 ? "▲" : v < 0 ? "▼" : "•"} {Math.abs(v * 100).toFixed(1)}% <span className="text-muted-foreground">{suffix}</span>
    </span>
  );
}

export function EmptyState() {
  const { loadDemo } = useEnergy();
  const steps = [
    { icon: Gauge, t: "Factory profile", d: "Contract demand (kVA) and demand charge from your electricity bill." },
    { icon: Database, t: "12 months of bills", d: "kWh, total bill, peak kVA, power factor — plus production and operating hours." },
    { icon: Wrench, t: "Major equipment", d: "Compressors, furnaces, motors, HVAC, lighting — rated kW and hours." },
    { icon: PlugZap, t: "Run analysis", d: "Get ranked, rupee-quantified savings opportunities in seconds." },
  ];
  return (
    <div className="panel mx-auto max-w-3xl p-6 sm:p-10 rise">
      <div className="eyebrow">No data connected yet</div>
      <h2 className="mt-2 text-2xl font-semibold">Let's find where this factory is losing money on electricity.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Everything you need is on your monthly electricity bill and production register. Takes about 10 minutes.</p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3 rounded-lg border border-border bg-background p-4">
            <span className="num flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">{i + 1}</span>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold"><s.icon className="size-4 text-muted-foreground" />{s.t}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="cta" asChild><Link to="/factory">Enter factory data <ArrowRight /></Link></Button>
        <Button variant="outline" onClick={loadDemo}>Explore with demo factory</Button>
      </div>
    </div>
  );
}

export function Panel({ title, desc, children, actions, className }: { title: string; desc?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-4 sm:p-5 rise", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
