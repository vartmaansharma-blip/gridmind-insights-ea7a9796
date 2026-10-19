import { createFileRoute } from "@tanstack/react-router";
import { PublicSite } from "@/components/public-site/site";

/**
 * Canonical public homepage. The approved /design-preview renders PublicSite
 * with an internal review banner; the actual homepage uses the same design
 * without that banner. Do not substitute a previous draft or dashboard UI.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GridMind — Everything is connected. What are we missing?" },
      {
        name: "description",
        content: "GridMind investigates industrial operating questions through permissioned evidence, human review and accountable next steps. Electricity billing is the first field-research direction.",
      },
      { property: "og:title", content: "GridMind — Everything is connected. What are we missing?" },
      { property: "og:description", content: "Evidence-led industrial problem resolution. One question, traceable sources, qualified review and clear next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicSite,
});
