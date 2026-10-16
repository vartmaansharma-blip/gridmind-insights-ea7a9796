import { createFileRoute } from "@tanstack/react-router";
import { Portal } from "@/components/product/portal";
import { portalSearch } from "@/components/product/search";
export const Route = createFileRoute("/team/intake")({
  validateSearch: portalSearch,
  head: () => ({ meta: [{ title: "Intake — GridMind team" }] }),
  component: Page,
});
function Page() {
  const { mode } = Route.useSearch();
  return <Portal team intake demo={mode === "demo"} />;
}
