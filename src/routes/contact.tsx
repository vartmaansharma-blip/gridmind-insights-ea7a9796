import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/public-site/page";
export const Route = createFileRoute("/contact")({
 head: () => ({ meta: [
  { title: "Contact — GridMind" },
  { name: "description", content: "Tell GridMind what your factory needs to understand before sharing confidential records." },
 ] }),
 component: () => <PublicPage page="contact" />,
});
