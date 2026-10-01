import { createFileRoute } from "@tanstack/react-router";
import { useEnergy } from "@/lib/energy/store";
import { inr, inrCompact } from "@/lib/energy/format";
import type { OpportunityStatus } from "@/lib/energy/types";
import { EmptyState, PageHeader } from "@/components/gm/bits";
import { FindingFlow, FindingHeader } from "@/components/gm/finding";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Savings opportunities — GridMind" },
      { name: "description", content: "Ranked, rupee-quantified electricity savings actions with confidence and payback." },
      { property: "og:title", content: "Savings opportunities — GridMind" },
      { property: "og:description", content: "Ranked actions to cut factory electricity cost." },
    ],
  }),
  component: Opps,
});

const STATUS: Record<OpportunityStatus, string> = { open: "Open", planned: "Planned", in_progress: "In progress", implemented: "Implemented" };

function Opps() {
  const { active, analysis: a, setOppStatus } = useEnergy();
  if (!active || !a?.hasData) return <EmptyState />;
  return (
    <>
      <PageHeader eyebrow="Opportunities" title={`${inrCompact(a.totalSavingAnnual)}/yr estimated open savings`}
        desc="Every figure is calculated from your entered data using the assumptions shown. Treat as estimates until verified." />
      <div className="grid gap-4">
        {a.opportunities.map((o, i) => (
          <article key={o.id} className="panel p-4 sm:p-5 rise">
            <FindingHeader o={o} rank={i + 1} />
            <FindingFlow o={o} />
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>Investment <b className="num text-foreground">{o.investment ? inr(o.investment) : "Nil"}</b></span>
              <span>Payback <b className="num text-foreground">{o.paybackMonths === null ? "—" : o.paybackMonths < 1 ? "Immediate" : `${o.paybackMonths.toFixed(1)} months`}</b></span>
              <div className="ml-auto">
                <Select value={active.opportunityStatus[o.id] ?? "open"} onValueChange={(v) => setOppStatus(o.id, v as OpportunityStatus)}>
                  <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer font-medium">How this was calculated</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground num">{o.calc.map((c) => <li key={c}>{c}</li>)}</ol>
            </details>
          </article>
        ))}
      </div>
    </>
  );
}
