import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/public-site/page";
export const Route = createFileRoute("/about")({
 head: () => ({ meta: [
  { title: "About GridMind — GridMind" },
  { name: "description", content: "GridMind begins with human-reviewed electricity-cost investigations for factories." },
 ] }),
 component: () => <PublicPage page="about" />,
});
