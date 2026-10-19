import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/public-site/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GridMind — Everything is connected. What are we missing?" },
      { name: "description", content: "GridMind helps factories investigate electricity bills and operating evidence, with source-linked findings and qualified human review." },
      { property: "og:title", content: "GridMind — Everything is connected. What are we missing?" },
      { property: "og:description", content: "Evidence-led electricity cost reviews for factories. Begin with a question, trace the sources, and determine the next qualified check." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: PublicSite,
});
