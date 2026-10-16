import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePortal } = await import("@/lib/investigation/portal.server");
        return handlePortal(request);
      },
    },
  },
});
