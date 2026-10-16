import { createFileRoute } from "@tanstack/react-router";
import { Portal } from "@/components/product/portal";
import { portalSearch } from "@/components/product/search";
export const Route = createFileRoute("/cases/")({
  validateSearch: portalSearch,
  head: () => ({ meta: [{ title: "Your investigations — GridMind" }] }),
  component: Page,
});
function Page() {
  const { mode } = Route.useSearch();
  return <Portal demo={mode === "demo"} />;
}
