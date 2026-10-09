import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import {
  analyzeFactoryLoop,
  canonicalize,
  reproducibilityFingerprint,
  type AnalysisInput,
  type AnalysisResult,
} from "../_shared/analysis-loop.ts";

type StoredAnalysisRun = {
  id: number;
  factory_id: number;
  idempotency_key: string;
  algorithm_version: string;
  input_snapshot: AnalysisInput;
  result: AnalysisResult;
  result_fingerprint: string;
  analysis_status: AnalysisResult["status"];
  refusal_codes: string[];
  created_by: string | null;
  created_at: string;
};
type JsonRecord = Record<string, unknown>;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const columns = "id,factory_id,idempotency_key,algorithm_version,input_snapshot,result,result_fingerprint,analysis_status,refusal_codes,created_by,created_at";
const MAX_REQUEST_BYTES = 4_000_000;
const MAX_BASELINE_SAMPLES = 5_000;
const runtime = (globalThis as typeof globalThis & {
  Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Promise<Response>): void;
  };
}).Deno;

function reply(body: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}
function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isAnalysisInput(value: unknown): value is AnalysisInput {
  return isRecord(value) &&
    Number.isSafeInteger(value.factoryId) &&
    Number(value.factoryId) > 0 &&
    isRecord(value.current) &&
    Array.isArray(value.baselineSamples) &&
    value.baselineSamples.every(isRecord) &&
    isRecord(value.economics) &&
    typeof value.asOf === "string";
}
function isIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 200;
}
function sameEvidence(stored: StoredAnalysisRun, input: AnalysisInput, result: AnalysisResult): boolean {
  return stored.factory_id === input.factoryId &&
    stored.input_snapshot.factoryId === input.factoryId &&
    canonicalize(stored.input_snapshot) === canonicalize(input) &&
    stored.algorithm_version === result.algorithmVersion &&
    stored.analysis_status === result.status &&
    canonicalize(stored.refusal_codes) === canonicalize(result.reasonCodes) &&
    stored.result_fingerprint === reproducibilityFingerprint(result) &&
    canonicalize(stored.result) === canonicalize(result);
}
function reproducible(stored: StoredAnalysisRun, factoryId: number, result: AnalysisResult): boolean {
  return stored.factory_id === factoryId &&
    stored.input_snapshot.factoryId === factoryId &&
    stored.algorithm_version === result.algorithmVersion &&
    stored.analysis_status === result.status &&
    canonicalize(stored.refusal_codes) === canonicalize(result.reasonCodes) &&
    stored.result_fingerprint === reproducibilityFingerprint(result) &&
    canonicalize(stored.result) === canonicalize(result);
}

runtime.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) return reply({ error: "ANALYSIS_INPUT_TOO_LARGE" }, 413);

  try {
    const supabaseUrl = runtime.env.get("SUPABASE_URL");
    const anonKey = runtime.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = runtime.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return reply({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);

    const accessToken = authorization.slice("Bearer ".length).trim();
    if (!accessToken) return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData.user) return reply({ error: "AUTHENTICATION_REQUIRED" }, 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "INVALID_JSON_BODY" }, 400);
    }
    if (!isRecord(body)) return reply({ error: "INVALID_REQUEST_BODY" }, 400);

    const action = body.action;
    let factoryId: number;
    let idempotencyKey: string;
    let input: AnalysisInput | null = null;
    if (action === "persist") {
      if (isRecord(body.input) && Array.isArray(body.input.baselineSamples) && body.input.baselineSamples.length > MAX_BASELINE_SAMPLES) {
        return reply({ error: "ANALYSIS_INPUT_TOO_LARGE" }, 413);
      }
      if (!isAnalysisInput(body.input) || !isIdempotencyKey(body.idempotencyKey)) {
        return reply({ error: "INVALID_ANALYSIS_INPUT_OR_IDEMPOTENCY_KEY" }, 400);
      }
      input = body.input;
      factoryId = input.factoryId;
      idempotencyKey = body.idempotencyKey.trim();
    } else if (action === "verify") {
      if (!Number.isSafeInteger(body.factoryId) || Number(body.factoryId) <= 0 || !isIdempotencyKey(body.idempotencyKey)) {
        return reply({ error: "INVALID_FACTORY_ID_OR_IDEMPOTENCY_KEY" }, 400);
      }
      factoryId = Number(body.factoryId);
      idempotencyKey = (body.idempotencyKey as string).trim();
    } else {
      return reply({ error: "UNSUPPORTED_ACTION" }, 400);
    }

    // The caller-scoped query must pass factory RLS before a service-role write/read is allowed.
    const { data: factory, error: accessError } = await userClient
      .from("factories")
      .select("id")
      .eq("id", factoryId)
      .maybeSingle();
    if (accessError) return reply({ error: "FACTORY_ACCESS_CHECK_FAILED" }, 500);
    if (!factory) return reply({ error: "FACTORY_ACCESS_DENIED" }, 403);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "persist" && input) {
      const result = analyzeFactoryLoop(input);
      const fingerprint = reproducibilityFingerprint(result);
      const { data: existing, error: existingError } = await adminClient
        .from("factory_analysis_runs")
        .select(columns)
        .eq("factory_id", factoryId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existingError) return reply({ error: "ANALYSIS_RUN_LOOKUP_FAILED" }, 500);
      if (existing) {
        if (!sameEvidence(existing as StoredAnalysisRun, input, result)) {
          return reply({ error: "IDEMPOTENCY_CONFLICT" }, 409);
        }
        return reply({ run: existing as StoredAnalysisRun });
      }

      const { data: inserted, error: insertError } = await adminClient
        .from("factory_analysis_runs")
        .insert({
          factory_id: factoryId,
          idempotency_key: idempotencyKey,
          algorithm_version: result.algorithmVersion,
          input_snapshot: input,
          result,
          result_fingerprint: fingerprint,
          analysis_status: result.status,
          refusal_codes: result.reasonCodes,
          created_by: authData.user.id,
        })
        .select(columns)
        .single();

      if (insertError) {
        // A concurrent retry may win the unique-key race; only identical evidence is idempotent.
        const { data: raced, error: raceError } = await adminClient
          .from("factory_analysis_runs")
          .select(columns)
          .eq("factory_id", factoryId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (raceError) return reply({ error: "ANALYSIS_RUN_RELOAD_FAILED" }, 500);
        if (raced && sameEvidence(raced as StoredAnalysisRun, input, result)) return reply({ run: raced as StoredAnalysisRun });
        if (raced) return reply({ error: "IDEMPOTENCY_CONFLICT" }, 409);
        return reply({ error: "ANALYSIS_RUN_PERSIST_FAILED" }, 500);
      }
      return reply({ run: inserted as StoredAnalysisRun }, 201);
    }

    const { data: stored, error: storedError } = await adminClient
      .from("factory_analysis_runs")
      .select(columns)
      .eq("factory_id", factoryId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (storedError) return reply({ error: "ANALYSIS_RUN_RELOAD_FAILED" }, 500);
    if (!stored) return reply({ error: "ANALYSIS_RUN_NOT_FOUND" }, 404);

    let recomputed: AnalysisResult;
    try {
      recomputed = analyzeFactoryLoop((stored as StoredAnalysisRun).input_snapshot);
    } catch {
      return reply({ error: "STORED_ANALYSIS_INPUT_INVALID", reproducible: false }, 409);
    }
    const recomputedFingerprint = reproducibilityFingerprint(recomputed);
    return reply({
      stored: stored as StoredAnalysisRun,
      recomputed,
      recomputedFingerprint,
      reproducible: reproducible(stored as StoredAnalysisRun, factoryId, recomputed),
    });
  } catch {
    return reply({ error: "INTERNAL_SERVER_ERROR" }, 500);
  }
});
