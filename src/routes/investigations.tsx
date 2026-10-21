import { createFileRoute, Link } from "@tanstack/react-router";
import { PlanningWorkspace } from "@/components/investigation/planning-workspace";
import { InvestigationWorkbench } from "@/components/investigation/workbench";

import { IndustrialCoreWorkspace } from "@/components/investigation/industrial-core-workspace";
import { FinishingComparisonPreview } from "@/components/investigation/finishing-comparison-preview";
import { PhysicalInfrastructureWorkspace } from "@/components/investigation/physical-workspace";
import { ResolveTriagePreview } from "@/components/investigation/resolve-triage-preview";
import { InvoiceExceptionPreview } from "@/components/investigation/invoice-exception-preview";

function SyntheticInvestigations() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Link
          to="/customer-demo"
          className="inline-block mb-4 text-primary underline underline-offset-4"
        >
          Open the customer sample walkthrough
        </Link>
        <ResolveTriagePreview />
        <PhysicalInfrastructureWorkspace />
        <IndustrialCoreWorkspace />
        <PlanningWorkspace />

        <section aria-labelledby="record-comparisons-title" className="mt-8">
          <h2 id="record-comparisons-title" className="text-2xl font-semibold">
            Compare current records
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fictional invoice and finishing comparisons. Review the source and unresolved questions
            before considering an action.
          </p>
          <InvoiceExceptionPreview />
          <FinishingComparisonPreview />
        </section>
      </div>
      <InvestigationWorkbench />
    </>
  );
}

export const Route = createFileRoute("/investigations")({
  head: () => ({
    meta: [
      { title: "Synthetic investigation workspace — GridMind" },
      {
        name: "description",
        content:
          "Internal synthetic evidence-to-decision method workspace. No customer data or technical approval.",
      },
    ],
  }),
  component: SyntheticInvestigations,
});
