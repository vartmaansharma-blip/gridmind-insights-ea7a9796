import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/public-site/page";
export const Route = createFileRoute("/problem")({
 head: () => ({ meta: [
  { title: "The problem — GridMind" },
  { name: "description", content: "Demand charges, power factor and tariff category can raise questions that a single bill cannot settle." },
 ] }),
 component: () => <PublicPage page="problem" />,
});
