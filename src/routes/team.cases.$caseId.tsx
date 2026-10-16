import { createFileRoute } from "@tanstack/react-router";
import { Portal } from "@/components/product/portal";
import { portalSearch } from "@/components/product/search";
export const Route = createFileRoute("/team/cases/$caseId")({
  validateSearch: portalSearch,
  head: () => ({ meta: [{ title: "Case delivery — GridMind team" }] }),
  component: Page,
});
function Page() {
  const { mode } = Route.useSearch();
  const { caseId } = Route.useParams();
  return <Portal team caseId={caseId} demo={mode === "demo"} />;
}
