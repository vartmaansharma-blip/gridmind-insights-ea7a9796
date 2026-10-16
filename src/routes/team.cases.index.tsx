import { createFileRoute } from "@tanstack/react-router";
import { Portal } from "@/components/product/portal";
import { portalSearch } from "@/components/product/search";
export const Route = createFileRoute("/team/cases/")({
  validateSearch: portalSearch,
  head: () => ({ meta: [{ title: "Investigations — GridMind team" }] }),
  component: Page,
});
function Page() {
  const { mode } = Route.useSearch();
  return <Portal team demo={mode === "demo"} />;
}
