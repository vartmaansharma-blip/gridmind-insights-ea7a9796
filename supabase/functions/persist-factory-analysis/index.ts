import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { buildAnalysisInputFromCanonical, type AnalysisEconomicContext } from "../_shared/analysis-input-adapter.ts";
import { readBoundedJsonBody } from "../_shared/request-body.ts";
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
  asset_id: number;
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
type PageResult<T> = { rows: T[]; error: unknown | null; tooMany: boolean };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const columns = "id,factory_id,asset_id,idempotency_key,algorithm_version,input_snapshot,result,result_fingerprint,analysis_status,refusal_codes,created_by,created_at";
const MAX_REQUEST_BYTES = 4_000_000;
const MAX_BASELINE_SAMPLES = 5_000;
const MAX_CANONICAL_OBSERVATIONS = (MAX_BASELINE_SAMPLES + 1) * 5;
const MAX_OPERATING_CONTEXTS = 10_000;
const MAX_ECONOMIC_CONTEXTS = 1_000;
const PAGE_SIZE = 1_000;
const STRICT_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
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
function jsonRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}
function isPositiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function isIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 200;
}
async function readBoundedRows<T>(
  maxRows: number,
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown | null }>,
): Promise<PageResult<T>> {
  const rows: T[] = [];
  for (let from = 0; from <= maxRows; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE - 1, maxRows);
    const page = await fetchPage(from, to);
    if (page.error) return { rows: [], error: page.error, tooMany: false };
    const values = page.data ?? [];
    rows.push(...values);
    if (rows.length > maxRows) return { rows: [], error: null, tooMany: true };
    if (values.length < to - from + 1) return { rows, error: null, tooMany: false };
  }
  return { rows, error: null, tooMany: rows.length > maxRows };
}
function reproducible(stored: StoredAnalysisRun, factoryId: number, result: AnalysisResult): boolean {
  return stored.factory_id === factoryId &&
    stored.input_snapshot.factoryId === factoryId &&
    stored.input_snapshot.current.assetId === String(stored.asset_id) &&
    stored.algorithm_version === result.algorithmVersion &&
    stored.analysis_status === result.status &&
    canonicalize(stored.refusal_codes) === canonicalize(result.reasonCodes) &&
    stored.result_fingerprint === reproducibilityFingerprint(result) &&
    canonicalize(stored.result) === canonicalize(result);
}

runtime.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
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

    const parsedBody = await readBoundedJsonBody(request, MAX_REQUEST_BYTES);
    if (!parsedBody.ok) {
      if (parsedBody.reason === "too_large") return reply({ error: "ANALYSIS_INPUT_TOO_LARGE" }, 413);
      if (parsedBody.reason === "invalid_content_length") return reply({ error: "INVALID_CONTENT_LENGTH" }, 400);
      if (parsedBody.reason === "unreadable_body") return reply({ error: "UNREADABLE_REQUEST_BODY" }, 400);
      return reply({ error: "INVALID_JSON_BODY" }, 400);
    }
    const body = parsedBody.value;
    if (!isRecord(body)) return reply({ error: "INVALID_REQUEST_BODY" }, 400);

    const action = body.action;
    let factoryId: number;
    let idempotencyKey: string;
    let assetId: number | null = null;
    if (action === "persist") {
      if ("input" in body || "observations" in body || "asOf" in body) {
        return reply({ error: "CLIENT_ANALYSIS_INPUT_NOT_ACCEPTED" }, 400);
      }
      if (!isPositiveId(body.factoryId) || !isPositiveId(body.assetId) || !isIdempotencyKey(body.idempotencyKey)) {
        return reply({ error: "INVALID_FACTORY_ASSET_OR_IDEMPOTENCY_KEY" }, 400);
      }
      factoryId = body.factoryId;
      assetId = body.assetId;
      idempotencyKey = body.idempotencyKey.trim();
    } else if (action === "verify") {
      if (!isPositiveId(body.factoryId) || !isIdempotencyKey(body.idempotencyKey)) {
        return reply({ error: "INVALID_FACTORY_ID_OR_IDEMPOTENCY_KEY" }, 400);
      }
      factoryId = body.factoryId;
      idempotencyKey = body.idempotencyKey.trim();
    } else {
      return reply({ error: "UNSUPPORTED_ACTION" }, 400);
    }

    // The caller-scoped query must pass factory RLS before any privileged evidence read/write.
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

    if (action === "persist" && assetId !== null) {
      // Idempotency is resolved before rereading live evidence: a retry returns the
      // original immutable snapshot, while reuse for a different asset is a conflict.
      const { data: existing, error: existingError } = await adminClient
        .from("factory_analysis_runs")
        .select(columns)
        .eq("factory_id", factoryId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existingError) return reply({ error: "ANALYSIS_RUN_LOOKUP_FAILED" }, 500);
      if (existing) {
        if (existing.asset_id !== assetId) return reply({ error: "IDEMPOTENCY_CONFLICT" }, 409);
        return reply({ run: existing as StoredAnalysisRun });
      }

      const { data: asset, error: assetError } = await adminClient
        .from("factory_assets")
        .select("id")
        .eq("factory_id", factoryId)
        .eq("id", assetId)
        .maybeSingle();
      if (assetError) return reply({ error: "CANONICAL_ASSET_LOOKUP_FAILED" }, 500);
      if (!asset) return reply({ error: "ASSET_NOT_FOUND_IN_FACTORY" }, 404);

      // Page explicitly because PostgREST's server row cap may be lower than the analysis cap.
      const asOf = new Date().toISOString();
      const observationPage = await readBoundedRows<JsonRecord>(MAX_CANONICAL_OBSERVATIONS, async (from, to) => {
        const { data, error } = await adminClient.from("observations")
          .select("id,factory_id,subject_type,subject_id,metric,value_numeric,value_text,unit,observed_at,observed_until,quality_status,is_estimated,provenance,metadata")
          .eq("factory_id", factoryId)
          .eq("subject_type", "asset")
          .eq("subject_id", assetId)
          .order("observed_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to);
        return { data: (data ?? []) as unknown as JsonRecord[], error };
      });
      if (observationPage.error) return reply({ error: "CANONICAL_OBSERVATION_READ_FAILED" }, 500);
      if (observationPage.tooMany) return reply({ error: "CANONICAL_OBSERVATION_SET_TOO_LARGE" }, 413);

      const contextPage = await readBoundedRows<JsonRecord>(MAX_OPERATING_CONTEXTS, async (from, to) => {
        const { data, error } = await adminClient.from("operating_contexts")
          .select("id,factory_id,scope_type,scope_id,start_time,end_time,status,confidence,values")
          .eq("factory_id", factoryId)
          .eq("scope_type", "asset")
          .eq("scope_id", assetId)
          .order("start_time", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to);
        return { data: (data ?? []) as unknown as JsonRecord[], error };
      });
      if (contextPage.error) return reply({ error: "CANONICAL_OPERATING_CONTEXT_READ_FAILED" }, 500);
      if (contextPage.tooMany) return reply({ error: "CANONICAL_OPERATING_CONTEXT_SET_TOO_LARGE" }, 413);

      const economicsPage = await readBoundedRows<JsonRecord>(MAX_ECONOMIC_CONTEXTS, async (from, to) => {
        const { data, error } = await adminClient.from("economic_contexts")
          .select("id,factory_id,name,effective_from,effective_until,currency,metadata,status")
          .eq("factory_id", factoryId)
          .eq("status", "active")
          .order("effective_from", { ascending: false, nullsFirst: false })
          .order("id", { ascending: true })
          .range(from, to);
        return { data: (data ?? []) as unknown as JsonRecord[], error };
      });
      if (economicsPage.error) return reply({ error: "CANONICAL_ECONOMIC_CONTEXT_READ_FAILED" }, 500);
      if (economicsPage.tooMany) return reply({ error: "CANONICAL_ECONOMIC_CONTEXT_SET_TOO_LARGE" }, 413);

      const observations = observationPage.rows.map((row) => ({
        id: row.id as number,
        factoryId: row.factory_id as number,
        subjectType: row.subject_type as string,
        subjectId: row.subject_id as number,
        metric: row.metric as string,
        valueNumeric: (row.value_numeric ?? null) as number | null,
        valueText: (row.value_text ?? null) as string | null,
        unit: (row.unit ?? null) as string | null,
        observedAt: row.observed_at as string,
        observedUntil: (row.observed_until ?? null) as string | null,
        qualityStatus: row.quality_status as string,
        isEstimated: Boolean(row.is_estimated),
        provenance: jsonRecord(row.provenance),
        metadata: jsonRecord(row.metadata),
      }));
      const operatingContexts = contextPage.rows.map((row) => ({
        id: row.id as number,
        factoryId: row.factory_id as number,
        scopeType: row.scope_type as string,
        scopeId: row.scope_id as number | null,
        startTime: row.start_time as string,
        endTime: (row.end_time ?? null) as string | null,
        status: row.status as string,
        confidence: (row.confidence ?? null) as number | null,
        values: jsonRecord(row.values),
      }));

      const asOfMs = Date.parse(asOf);
      const effectiveEconomics = economicsPage.rows.filter((row) => {
        const from = row.effective_from ? Date.parse(String(row.effective_from)) : Number.NEGATIVE_INFINITY;
        const until = row.effective_until ? Date.parse(String(row.effective_until)) : Number.POSITIVE_INFINITY;
        return from <= asOfMs && until >= asOfMs;
      });
      let economicContext: AnalysisEconomicContext | null = null;
      if (effectiveEconomics.length > 0) {
        const newestFrom = effectiveEconomics[0].effective_from ?? null;
        const newest = effectiveEconomics.filter((row) => (row.effective_from ?? null) === newestFrom);
        if (newest.length === 1) {
          const row = newest[0];
          economicContext = {
            id: row.id as number,
            name: row.name as string,
            currency: row.currency as string,
            effectiveFrom: (row.effective_from ?? null) as string | null,
            effectiveUntil: (row.effective_until ?? null) as string | null,
            metadata: jsonRecord(row.metadata),
          };
        }
      }

      const input = buildAnalysisInputFromCanonical({
        factoryId,
        assetId,
        observations,
        operatingContexts,
        economicContext,
        asOf,
      });
      if (input.baselineSamples.length > MAX_BASELINE_SAMPLES) {
        return reply({ error: "ANALYSIS_INPUT_TOO_LARGE" }, 413);
      }

      const result = analyzeFactoryLoop(input);
      const fingerprint = reproducibilityFingerprint(result);
      const { data: inserted, error: insertError } = await adminClient
        .from("factory_analysis_runs")
        .insert({
          factory_id: factoryId,
          asset_id: assetId,
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
        const { data: raced, error: raceError } = await adminClient
          .from("factory_analysis_runs")
          .select(columns)
          .eq("factory_id", factoryId)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (raceError) return reply({ error: "ANALYSIS_RUN_RELOAD_FAILED" }, 500);
        if (raced && raced.asset_id === assetId) return reply({ run: raced as StoredAnalysisRun });
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
