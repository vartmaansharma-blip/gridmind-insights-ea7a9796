import { createFileRoute } from "@tanstack/react-router";
import { ElectricityWorkbench } from "@/components/investigation/electricity-workbench";
import { z } from "zod";
export const Route = createFileRoute("/team/electricity")({
  validateSearch: z.object({ caseId: z.string().uuid().optional() }),
  head: () => ({ meta: [{ title: "Electricity investigations — GridMind team" }] }),
  component: Page,
});
function Page() {
  const { caseId } = Route.useSearch();
  return <ElectricityWorkbench key={caseId ?? "list"} caseId={caseId} />;
}
