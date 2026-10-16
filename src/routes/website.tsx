import { createFileRoute } from "@tanstack/react-router";
import { Website } from "@/components/product/website";
export const Route = createFileRoute("/website")({
  head: () => ({
    meta: [
      { title: "GridMind — Evidence to decision" },
      {
        name: "description",
        content:
          "A shared workspace for evidence-led industrial investigations, independent review and source-linked decision briefs. Private beta.",
      },
    ],
  }),
  component: Website,
});
