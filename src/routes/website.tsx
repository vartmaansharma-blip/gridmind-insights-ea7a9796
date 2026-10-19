import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/public-site/site";

/** Released public marketing site; factory workspace remains at '/' until separately migrated. */
export const Route = createFileRoute("/website")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, follow" },
      { title: "GridMind — Evidence-led factory electricity reviews" },
      {
        name: "description",
        content: "Everything is connected. What are we missing? GridMind investigates factory electricity bills and operating evidence, with human review and source-linked next steps.",
      },
      { property: "og:title", content: "GridMind — Everything is connected. What are we missing?" },
      { property: "og:description", content: "Evidence-led factory electricity reviews. Trace each observation to its source and see what requires qualified review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicSite,
});
