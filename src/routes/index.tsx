import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/public-site/site";

/** Canonical, anonymous GridMind homepage. Authenticated workspaces live on separate routes. */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GridMind — Evidence-led factory electricity reviews" },
      { name: "description", content: "Everything is connected. What are we missing? Evidence-led industrial investigation and qualified review." },
      { property: "og:title", content: "GridMind — Everything is connected. What are we missing?" },
      { property: "og:description", content: "Factory energy questions. Source-linked findings. Human-reviewed next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicSite,
});
