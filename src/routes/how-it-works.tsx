import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/public-site/page";
export const Route = createFileRoute("/how-it-works")({
 head: () => ({ meta: [
  { title: "How it works — GridMind" },
  { name: "description", content: "An assisted investigation, not automated machine diagnosis." },
 ] }),
 component: () => <PublicPage page="how-it-works" />,
});
