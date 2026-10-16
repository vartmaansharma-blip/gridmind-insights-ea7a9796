import { createFileRoute } from "@tanstack/react-router";
import { Portal } from "@/components/product/portal";
import { portalSearch } from "@/components/product/search";
export const Route = createFileRoute("/cases/$caseId")({
  validateSearch: portalSearch,
  head: () => ({ meta: [{ title: "Investigation — GridMind" }] }),
  component: Page,
});
function Page() {
  const { mode } = Route.useSearch();
  const { caseId } = Route.useParams();
  return <Portal caseId={caseId} demo={mode === "demo"} />;
}
