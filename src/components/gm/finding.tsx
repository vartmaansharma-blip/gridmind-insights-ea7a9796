import type { Opportunity } from "@/lib/energy/types";
import { inrCompact } from "@/lib/energy/format";
import { ConfidenceDots, EstimatedTag } from "./bits";

export function FindingFlow({ o }: { o: Opportunity }) {
  const cells = [
    { k: "Problem", v: o.problem },
    { k: "Likely cause", v: o.cause },
    { k: "Est. ₹ impact", v: `${inrCompact(o.impactAnnual)}/yr`, num: true },
    { k: "Recommended action", v: o.action },
    { k: "Expected saving", v: `${inrCompact(o.savingAnnual)}/yr`, num: true, good: true },
  ];
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-[1.2fr_1.2fr_0.7fr_1.4fr_0.7fr]">
      {cells.map((c) => (
        <div key={c.k} className="bg-card p-3">
          <div className="eyebrow !text-[10px]">{c.k}</div>
          <div className={c.num ? `num mt-1 text-lg font-semibold ${c.good ? "text-success" : ""}` : "mt-1 text-sm leading-snug"}>{c.v}</div>
        </div>
      ))}
    </div>
  );
}

export function FindingHeader({ o, rank }: { o: Opportunity; rank: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="num text-xs text-muted-foreground">#{String(rank).padStart(2, "0")}</span>
      <h3 className="font-semibold">{o.title}</h3>
      <EstimatedTag />
      <span className="ml-auto"><ConfidenceDots c={o.confidence} /></span>
    </div>
  );
}
