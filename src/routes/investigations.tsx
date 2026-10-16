import { createFileRoute } from "@tanstack/react-router";
import { InvestigationWorkbench } from "@/components/investigation/workbench";

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
  component: InvestigationWorkbench,
});
