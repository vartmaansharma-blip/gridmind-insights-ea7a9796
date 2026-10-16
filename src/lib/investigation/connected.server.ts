import { createClient } from "@supabase/supabase-js";
import { readBoundedJsonBody } from "../../../supabase/functions/_shared/request-body";
import { executeCaseCommand, CaseError } from "./connected-service";
import type { CaseStore } from "./connected-contract";
import { ZodError } from "zod";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

export async function handleConnectedInvestigation(request: Request): Promise<Response> {
  if (request.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (process.env.GRIDMIND_CONNECTED_CASES_ENABLED !== "synthetic-only")
    return reply({ error: "CONNECTED_CASES_DISABLED" }, 503);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: "CROSS_ORIGIN_DENIED" }, 403);
  const token = request.headers.get("Authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.GRIDMIND_CASES_SERVICE_ROLE_KEY;
  if (!url || !key || !serviceKey) return reply({ error: "CONNECTED_CASES_NOT_CONFIGURED" }, 503);
  try {
    const auth = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous)
      return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);
    const parsed = await readBoundedJsonBody(request, 4_000_000);
    if (!parsed.ok)
      return reply(
        { error: "INVALID_OR_OVERSIZED_BODY" },
        parsed.reason === "too_large" ? 413 : 400,
      );
    // Server-only key never enters a VITE variable or the browser client bundle.
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const store: CaseStore = {
      async call(args) {
        const result = await admin.rpc("investigation_store", args);
        if (result.error) {
          const code = result.error.code;
          const message = result.error.message;
          if (code === "42501") throw new CaseError(message, 403);
          if (code === "40001") throw new CaseError(message, 409);
          throw new CaseError("CASE_STORAGE_ERROR", 500);
        }
        return result.data;
      },
    };
    return reply(await executeCaseCommand(store, data.user.id, parsed.value));
  } catch (e) {
    if (e instanceof CaseError) return reply({ error: e.code }, e.status);
    if (e instanceof ZodError) return reply({ error: "INVALID_CASE_CONTRACT" }, 400);
    // Do not return database details, credentials or customer payloads in error responses.
    return reply({ error: "CASE_OPERATION_FAILED" }, 500);
  }
}
