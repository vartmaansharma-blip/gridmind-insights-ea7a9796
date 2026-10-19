import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/electricity")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleElectricity } = await import("@/lib/electricity/server");
        return handleElectricity(request);
      },
    },
  },
});
