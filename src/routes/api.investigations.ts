import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/investigations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleConnectedInvestigation } =
          await import("@/lib/investigation/connected.server");
        return handleConnectedInvestigation(request);
      },
    },
  },
});
