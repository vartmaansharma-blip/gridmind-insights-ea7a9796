import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/investigations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (new URL(request.url).searchParams.get("method") === "compressed-air") {
          const { handleConnectedAir } = await import("@/lib/compressed-air/connected.server");
          return handleConnectedAir(request);
        }
        const { handleConnectedInvestigation } =
          await import("@/lib/investigation/connected.server");
        return handleConnectedInvestigation(request);
      },
    },
  },
});
