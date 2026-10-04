import { createFileRoute } from "@tanstack/react-router";
import { useEnergy } from "@/lib/energy/store";
import { inr, inrCompact } from "@/lib/energy/format";
import type { OpportunityStatus } from "@/lib/energy/types";
import { EmptyState, PageHeader } from "@/components/gm/bits";
import { FindingFlow, FindingHeader } from "@/components/gm/finding";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildIntelligenceOpportunities } from "@/lib/energy/intelligence";
import { EvidenceLegend, EvidenceTag } from "@/components/gm/evidence";
import { ProcessRail } from "@/components/gm/bits";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Savings opportunities — GridMind" },
      { name: "description", content: "Ranked, rupee-quantified electricity savings actions with confidence and payback." },
      { property: "og:title", content: "Savings opportunities — GridMind" },
      { property: "og:description", content: "Ranked actions to cut factory electricity cost." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Opps,
});

const STATUS: Record<OpportunityStatus, string> = { open: "Open", planned: "Planned", in_progress: "In progress", implemented: "Implemented" };

function Opps() {
  const { active, analysis: a, setOppStatus } = useEnergy();
  if (!active || !a?.hasData) return <EmptyState />;
  const opportunities = buildIntelligenceOpportunities(active, a);
  return (
    <>
      <PageHeader eyebrow="Opportunities" title={`${inrCompact(a.totalSavingAnnual)}/yr estimated open savings`}
        desc="Every figure is calculated from your entered data using the assumptions shown. Treat as estimates until verified." />
      <ProcessRail active={6} />
      <div className="mb-4"><EvidenceLegend /></div>
      <div className="grid gap-4">
        {opportunities.map((o, i) => (
          <article key={o.id} className="panel p-4 sm:p-5 rise">
            <FindingHeader o={o} rank={i + 1} />
            <FindingFlow o={o} />
            <div className="mt-4 grid gap-3 border-t border-border pt-4 text-xs md:grid-cols-2 xl:grid-cols-4">
              <div><div className="eyebrow">Evidence & reference</div><ul className="mt-2 space-y-1 text-muted-foreground">{o.evidence.map((x) => <li key={x}>• {x}</li>)}</ul><p className="mt-2"><EvidenceTag k="estimated" /> {o.reference}</p></div>
              <div><div className="eyebrow">Context & uncertainty</div><p className="mt-2 text-muted-foreground">{o.context}</p><p className="mt-2 text-muted-foreground">{o.uncertainty}</p></div>
              <div><div className="eyebrow">Possible explanations</div><ul className="mt-2 space-y-1 text-muted-foreground">{o.possibleExplanations.map((x) => <li key={x}>• {x}</li>)}</ul></div>
              <div><div className="eyebrow">Data needed next</div><ul className="mt-2 space-y-1 text-muted-foreground">{o.missingEvidence.map((x) => <li key={x}>• {x}</li>)}</ul></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>Investment <b className="num text-foreground">{o.investment ? inr(o.investment) : "Nil"}</b></span>
              <span>Payback <b className="num text-foreground">{o.paybackMonths === null ? "—" : o.paybackMonths < 1 ? "Immediate" : `${o.paybackMonths.toFixed(1)} months`}</b></span>
              <span>Financial state <b className="uppercase text-foreground">{o.financialState}</b></span>
              <span>Verification <b className="capitalize text-foreground">{o.verificationState}</b></span>
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
