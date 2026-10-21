import { createFileRoute, Link } from "@tanstack/react-router";
import { InvestigationWorkbench } from "@/components/investigation/workbench";

import { IndustrialCoreWorkspace } from "@/components/investigation/industrial-core-workspace";
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
        <IndustrialCoreWorkspace />

        <InvoiceExceptionPreview />
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
