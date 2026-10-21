import { createFileRoute } from "@tanstack/react-router";
import { CustomerDemoWorkspace } from "@/components/investigation/customer-demo";

export const Route = createFileRoute("/customer-demo")({
  head: () => ({
    meta: [
      { title: "Customer sample walkthrough — GridMind" },
      {
        name: "description",
        content:
          "A fictional industrial order: inspect sample records, actual constraint checks, review requirements and a downloadable evidence trail.",
      },
    ],
  }),
  component: CustomerDemoWorkspace,
});
