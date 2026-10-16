import { createFileRoute } from "@tanstack/react-router";
import { DesignPreview } from "@/components/design-preview/design-preview";

export const Route = createFileRoute("/design-preview")({
  head: () => ({
    meta: [
      { title: "Internal design preview — GridMind" },
      { name: "description", content: "Internal design preview of GridMind hero compositions and keyframes. Illustrative, fictional data." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Internal design preview — GridMind" },
      { property: "og:description", content: "Internal design preview. Not a public page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DesignPreview,
});
