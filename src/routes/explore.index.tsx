import { createFileRoute } from "@tanstack/react-router";
// Parent owns this session; the index keeps /explore distinct from record splats.
export const Route = createFileRoute("/explore/")({ component: () => null });
