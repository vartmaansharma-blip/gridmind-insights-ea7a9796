import { createFileRoute } from "@tanstack/react-router";
// The parent owns one sample state across all detail destinations; children contain no duplicate model.
export const Route = createFileRoute("/explore/$")({ component: () => null });
