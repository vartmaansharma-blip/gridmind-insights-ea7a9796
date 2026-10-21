import { createFileRoute } from "@tanstack/react-router";
import { SampleOrganizationWorkspace } from "@/components/sample/workspace";
export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore GridMind — Sample Organization" },
      {
        name: "description",
        content:
          "Explore one connected fictional manufacturing organization. No sign-in or real factory data.",
      },
    ],
  }),
  component: SampleOrganizationWorkspace,
});
