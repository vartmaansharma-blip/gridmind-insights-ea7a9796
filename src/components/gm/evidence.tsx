import { cn } from "@/lib/utils";

export const EVIDENCE = [
  { k: "observed", label: "Observed", desc: "Directly present in the supplied bill, meter or sensor record.", tone: "bg-steel-soft text-steel border-steel/40" },
  { k: "estimated", label: "Estimated", desc: "Calculated from bills, nameplate data or assumptions.", tone: "bg-warning-soft text-warning border-warning/40" },
  { k: "hypothesis", label: "Hypothesis", desc: "Possible cause inferred by rules; needs confirmation.", tone: "bg-muted text-muted-foreground border-border" },
  { k: "recommended", label: "Recommended", desc: "Suggested action; not yet carried out.", tone: "bg-cta/15 text-foreground border-cta/50" },
  { k: "verified", label: "Verified", desc: "Saving confirmed with before/after measured data.", tone: "bg-success text-background border-success" },
  { k: "unknown", label: "Unknown", desc: "Evidence is insufficient for a defensible conclusion.", tone: "bg-muted text-muted-foreground border-border" },
] as const;

export type EvidenceKind = (typeof EVIDENCE)[number]["k"];

export function EvidenceTag({ k, className }: { k: EvidenceKind; className?: string }) {
  const e = EVIDENCE.find((x) => x.k === k) ?? EVIDENCE[EVIDENCE.length - 1];
  return (
    <span title={e.desc} className={cn("inline-flex rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider", e.tone, className)}>
      {e.label}
    </span>
  );
}

export function EvidenceLegend() {
  return (
    <div className="panel p-4">
      <div className="eyebrow mb-3">Evidence hierarchy</div>
      <ol className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {EVIDENCE.map((e, i) => (
          <li key={e.k} className="text-xs">
            <div className="flex items-center gap-1.5"><span className="num text-muted-foreground">{i + 1}</span><EvidenceTag k={e.k} /></div>
            <p className="mt-1 text-muted-foreground">{e.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SyntheticBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-warning/40 bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
      Synthetic demo assets · no live hardware connected
    </span>
  );
}
