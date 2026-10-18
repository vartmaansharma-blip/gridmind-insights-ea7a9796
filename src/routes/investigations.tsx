import { createFileRoute } from "@tanstack/react-router";
import { InvestigationWorkbench } from "@/components/investigation/workbench";

import { ResolveTriagePreview } from "@/components/investigation/resolve-triage-preview";

function SyntheticInvestigations() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <ResolveTriagePreview />
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
