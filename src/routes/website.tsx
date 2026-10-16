import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/public-site/site";

export const Route = createFileRoute("/website")({
  head: () => ({
    meta: [
      { title: "GridMind — Evidence-led electricity reviews for factories" },
      { name: "description", content: "Everything is connected. What are we missing? GridMind reviews factory electricity bills and records, separates evidence from assumption, and sets out next checks." },
      { property: "og:title", content: "GridMind — Everything is connected. What are we missing?" },
      { property: "og:description", content: "Evidence-led electricity reviews for factories: understand the costs, investigate the questions, identify what deserves attention." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicSite,
});
