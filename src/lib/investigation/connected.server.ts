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
const permissionErrors = new Set([
  "AUTHENTICATION_REQUIRED",
  "CASE_ACCESS_DENIED",
  "CASE_CREATE_DENIED",
  "CASE_EDIT_DENIED",
  "CASE_ASSIGN_DENIED",
  "ASSIGNEE_NOT_FACTORY_MEMBER",
  "SOURCE_VERIFICATION_DENIED",
  "INDEPENDENT_REVIEWER_REQUIRED",
  "INTAKE_ACCESS_DENIED",
  "PUBLISH_DENIED",
  "STAFF_ACTION_REQUIRED",
  "CURRENT_PUBLICATION_REQUIRED",
]);
const transientStorageErrors = new Set([
  "08000",
  "08003",
  "08006",
  "53300",
  "57P01",
  "57014",
  "PGRST000",
  "PGRST001",
  "PGRST002",
]);

export async function handleConnectedInvestigation(request: Request): Promise<Response> {
  return handleAuthenticatedCaseRequest(request, "investigation_store", executeCaseCommand);
}
export async function handleAuthenticatedCaseRequest(
  request: Request,
  rpcName: "investigation_store" | "portal_store",
  execute: (store: CaseStore, actor: string, raw: unknown) => Promise<unknown>,
): Promise<Response> {
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
        const result = await admin.rpc(rpcName, args);
        if (result.error) {
          const code = result.error.code;
          // Codes and operation names only: never log SQL details, tokens or payloads.
          console.error("Case RPC failed", { rpc: rpcName, operation: args._op, code });
          const message = result.error.message;
          if (code === "42501")
            throw new CaseError(
              permissionErrors.has(message) ? message : "CASE_ACCESS_DENIED",
              403,
            );
          if (code === "40001")
            throw new CaseError(
              ["STALE_CASE_REVISION", "IDEMPOTENCY_CONFLICT"].includes(message)
                ? message
                : "CASE_CONFLICT",
              409,
            );
          if (transientStorageErrors.has(code))
            throw new CaseError("CASE_STORAGE_UNAVAILABLE", 503);
          if (code === "P0001" && message === "INTAKE_NOT_CONFIGURED")
            throw new CaseError(message, 503);
          if (code === "P0001" && message === "EVIDENCE_REQUEST_MISSING")
            throw new CaseError(message, 409);
          throw new CaseError("CASE_STORAGE_ERROR", 500);
        }
        return result.data;
      },
    };
    return reply(await execute(store, data.user.id, parsed.value));
  } catch (e) {
    if (e instanceof CaseError) return reply({ error: e.code }, e.status);
    if (e instanceof ZodError) return reply({ error: "INVALID_CASE_CONTRACT" }, 400);
    // Do not return database details, credentials or customer payloads in error responses.
    return reply({ error: "CASE_OPERATION_FAILED" }, 500);
  }
}
