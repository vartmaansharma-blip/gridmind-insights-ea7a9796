import { handleAuthenticatedCaseRequest } from "../investigation/connected.server";
import { executeAirCommand } from "./connected";

export async function handleConnectedAir(request: Request) {
  // This continuation is deliberately local-only. Even an accidentally enabled preview
  // cannot send evidence or a service key to a hosted/production Supabase project.
  let local = false;
  try {
    const url = new URL(process.env.SUPABASE_URL ?? "");
    local = url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch {
    /* Missing configuration is disabled. */
  }
  if (!local || process.env.GRIDMIND_COMPRESSED_AIR_ENABLED !== "isolated-synthetic-only")
    return new Response(JSON.stringify({ error: "COMPRESSED_AIR_DISABLED" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  return handleAuthenticatedCaseRequest(request, "compressed_air_store", executeAirCommand);
}
