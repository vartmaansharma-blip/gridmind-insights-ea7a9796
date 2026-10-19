import { createClient } from "@supabase/supabase-js";
import { readBoundedJsonBody } from "../../../supabase/functions/_shared/request-body";
import { commandSchema } from "./contract";
export async function handleElectricity(request: Request) {
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  if (process.env.GRIDMIND_ELECTRICITY_ENABLED !== "synthetic-only")
    return reply({ error: "Electricity intake is disabled pending release review." }, 503);
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "Origin denied" }, 403);
  const token = request.headers.get("Authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return reply({ error: "Sign in required" }, 401);
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return reply({ error: "Intake is not configured" }, 503);
  try {
    // User-scoped JWT throughout: no service-role bypass of database/Storage policies.
    const db = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous)
      return reply({ error: "Sign in required" }, 401);
    const body = await readBoundedJsonBody(request, 16000);
    if (!body.ok)
      return reply(
        { error: "Invalid or oversized request" },
        body.reason === "too_large" ? 413 : 400,
      );
    const parsed = commandSchema.safeParse(body.value);
    if (!parsed.success) return reply({ error: "Check the case fields and bill dates" }, 400);
    const result = await db.rpc("electricity_command", { _command: parsed.data });
    if (result.error) {
      const code = result.error.code;
      if (code === "42501") return reply({ error: "Case access denied" }, 403);
      if (code === "40001") return reply({ error: "Case changed. Reload before retrying." }, 409);
      if (code.startsWith("22") || code.startsWith("23"))
        return reply({ error: "Invalid case operation or incomplete upload" }, 400);
      return reply({ error: "Case storage unavailable" }, 503);
    }
    return reply(result.data);
  } catch {
    return reply({ error: "Case service unavailable" }, 503);
  }
}
