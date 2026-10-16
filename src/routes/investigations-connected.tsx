import { createFileRoute } from "@tanstack/react-router";
import { ConnectedInvestigationWorkbench } from "@/components/investigation/connected-workbench";
export const Route = createFileRoute("/investigations-connected")({
  head: () => ({ meta: [{ title: "Connected synthetic investigations — GridMind" }] }),
  component: ConnectedInvestigationWorkbench,
});
