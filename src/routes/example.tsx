import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/public-site/page";
export const Route = createFileRoute("/example")({
 head: () => ({ meta: [
  { title: "Example investigation — GridMind" },
  { name: "description", content: "An illustration of the evidence-first workflow, not a customer result." },
 ] }),
 component: () => <PublicPage page="example" />,
});
