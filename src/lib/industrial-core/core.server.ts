import { createClient } from "@supabase/supabase-js";
import { ZodError, z } from "zod";
import { readBoundedJsonBody } from "../../../supabase/functions/_shared/request-body";
import { executeCoreCommand, commandSchema, type CoreStore } from "./service";
import { runScenario } from "./fixtures";
import { customerDemo } from "./customer-demo";
import { runPhysicalScenario, physicalScenarioIds } from "./physical";
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
export async function handleIndustrialCore(request: Request): Promise<Response> {
  if (request.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "CROSS_ORIGIN_DENIED" }, 403);
  const parsed = await readBoundedJsonBody(request, 2_000_000);
  if (!parsed.ok)
    return reply({ error: "INVALID_OR_OVERSIZED_BODY" }, parsed.reason === "too_large" ? 413 : 400);
  try {
    const physicalDemo = z.object({
      action: z.literal("physical_demo"),
      scenario: z.enum(physicalScenarioIds),
    }).strict().safeParse(parsed.value);
    if (physicalDemo.success)
      return reply(runPhysicalScenario(physicalDemo.data.scenario)); // Fixed fiction only, no customer input or providers.
    const demo = z
      .object({ action: z.enum(["demo", "customer_demo"]), scenario: z.enum(["A", "B", "C", "D"]) })
      .strict()
      .safeParse(parsed.value);
    if (demo.success)
      return reply(
        demo.data.action === "customer_demo"
          ? await customerDemo(demo.data.scenario)
          : runScenario(demo.data.scenario),
      ); // fixed public fiction, no intake/DB/network/provider execution
    const command = commandSchema.parse(parsed.value);
    if (process.env.GRIDMIND_CORE_ENABLED !== "synthetic-only")
      return reply({ error: "CORE_DISABLED" }, 503);
    const url = process.env.SUPABASE_URL,
      key = process.env.SUPABASE_PUBLISHABLE_KEY,
      serviceKey = process.env.GRIDMIND_CASES_SERVICE_ROLE_KEY;
    if (!url || !key || !serviceKey) return reply({ error: "CORE_NOT_CONFIGURED" }, 503);
    const endpoint = new URL(url);
    if (
      endpoint.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)
    )
      return reply({ error: "CORE_ISOLATED_DATABASE_REQUIRED" }, 503);
    const token = request.headers.get("Authorization")?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);
    const auth = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous)
      return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);
    // Parse only after Auth has verified this exact JWT. DB additionally binds the live session to user.
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const session = z.string().uuid().safeParse(payload.session_id);
    if (!session.success) return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);
    const db = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const store: CoreStore = {
      async call(args) {
        const result = await db.rpc("industrial_core_store", args);
        if (result.error) {
          const status =
            result.error.code === "42501"
              ? 403
              : result.error.code === "40001"
                ? 409
                : result.error.code?.startsWith("22") || result.error.code?.startsWith("23")
                  ? 400
                  : 503;
          // Stable categories only; never return SQL details, keys, grants or raw request payloads.
          throw Object.assign(
            new Error(
              status === 403
                ? "CORE_ACCESS_DENIED"
                : status === 409
                  ? "CORE_VERSION_OR_IDEMPOTENCY_CONFLICT"
                  : status === 400
                    ? "CORE_INVALID_COMMAND"
                    : "CORE_STORAGE_UNAVAILABLE",
            ),
            { status },
          );
        }
        return result.data;
      },
    };
    return reply(await executeCoreCommand(store, data.user.id, session.data, command));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError)
      return reply({ error: "CORE_INVALID_INPUT" }, 400);
    if (error instanceof Error && "status" in error)
      return reply({ error: error.message }, Number(error.status));
    if (
      error instanceof Error &&
      /^CORE_(AUTHORITY_DENIED|INDEPENDENT_APPROVER_REQUIRED|INDEPENDENT_REVIEWER_REQUIRED|APPROVAL_AUTHORITY_REVOKED)$/.test(
        error.message,
      )
    )
      return reply({ error: error.message }, 403);
    if (error instanceof Error && /^CORE_/.test(error.message))
      return reply({ error: error.message }, 409);
    return reply({ error: "CORE_OPERATION_FAILED" }, 500);
  }
}
