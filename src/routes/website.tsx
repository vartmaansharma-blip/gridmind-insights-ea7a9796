import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/public-site/site";

/** Released public marketing site; factory workspace remains at '/' until separately migrated. */
export const Route = createFileRoute("/website")({
  head: () => ({
    meta: [
      { title: "GridMind — Industrial Profit & Resolution Intelligence" },
      {
        name: "description",
        content: "Everything is connected. What are we missing? GridMind is developing evidence-led investigations for costly factory exceptions. Explore a fictional electricity example; customer services are not yet validated.",
      },
      { property: "og:title", content: "GridMind — Everything is connected. What are we missing?" },
      { property: "og:description", content: "Evidence-led industrial investigations. Explore a clearly fictional electricity case illustrating source traceability and qualified review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicSite,
});
