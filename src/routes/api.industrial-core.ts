import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/industrial-core")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleIndustrialCore } = await import("@/lib/industrial-core/core.server");
        return handleIndustrialCore(request);
      },
    },
  },
});
