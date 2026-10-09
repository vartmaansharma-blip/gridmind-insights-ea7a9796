const baseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!anonKey) throw new Error("SUPABASE_ANON_KEY is required");

type Json = Record<string, unknown>;
type Session = { access_token: string; user: { id: string } };

async function requestJson(path: string, init: RequestInit = {}): Promise<{ response: Response; body: Json | Json[] | null }> {
  const response = await fetch(new URL(path, baseUrl), init);
  const text = await response.text();
  let body: Json | Json[] | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as Json | Json[];
    } catch {
      body = { raw: text };
    }
  }
  return { response, body };
}

async function signIn(email: string): Promise<Session> {
  const { response, body } = await requestJson("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey!, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "gridmind-ci-password" }),
  });
  if (!response.ok || !body || Array.isArray(body) || typeof body.access_token !== "string") {
    throw new Error(`Local test user sign-in failed for ${email}: ${response.status} ${JSON.stringify(body)}`);
  }
  return body as unknown as Session;
}

async function restRows<T>(table: string, token: string, filter: string): Promise<T[]> {
  const { response, body } = await requestJson(`/rest/v1/${table}?${filter}`, {
    headers: { apikey: anonKey!, Authorization: `Bearer ${token}` },
  });
  if (!response.ok || !Array.isArray(body)) {
    throw new Error(`Could not read fixture ${table}: ${response.status} ${JSON.stringify(body)}`);
  }
  return body as T[];
}

async function runAnalysis(token: string, payload: Json): Promise<{ response: Response; body: Json }> {
  const { response, body } = await requestJson("/functions/v1/persist-factory-analysis", {
    method: "POST",
    headers: { apikey: anonKey!, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { response, body: body && !Array.isArray(body) ? body : {} };
}

Deno.test("persist-factory-analysis enforces auth, tenant scope, server-owned inputs, idempotency, and verification", async () => {
  const [userA, userB] = await Promise.all([
    signIn("gridmind-http-a@example.test"),
    signIn("gridmind-http-b@example.test"),
  ]);
  const [factoriesA, factoriesB] = await Promise.all([
    restRows<{ id: number }>("factories", userA.access_token, "name=eq.gridmind-http-factory-a&select=id"),
    restRows<{ id: number }>("factories", userB.access_token, "name=eq.gridmind-http-factory-b&select=id"),
  ]);
  if (factoriesA.length !== 1 || factoriesB.length !== 1) throw new Error("Fixture factories were not isolated by RLS");
  const factoryA = factoriesA[0].id;
  const factoryB = factoriesB[0].id;
  const assetsA = await restRows<{ id: number; name: string }>(
    "factory_assets",
    userA.access_token,
    `factory_id=eq.${factoryA}&name=eq.gridmind-http-asset-a&select=id,name`,
  );
  const assetsA2 = await restRows<{ id: number; name: string }>(
    "factory_assets",
    userA.access_token,
    `factory_id=eq.${factoryA}&name=eq.gridmind-http-asset-a2&select=id,name`,
  );
  if (assetsA.length !== 1 || assetsA2.length !== 1) throw new Error("Fixture assets were not visible to their authorized user");
  const assetA = assetsA[0].id;
  const assetA2 = assetsA2[0].id;

  const noAuth = await requestJson("/functions/v1/persist-factory-analysis", {
    method: "POST",
    headers: { apikey: anonKey!, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: "no-auth" }),
  });
  if (noAuth.response.status < 400) throw new Error("Unauthenticated request unexpectedly succeeded");

  const crossTenant = await runAnalysis(userB.access_token, {
    action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: "cross-tenant",
  });
  if (crossTenant.response.status !== 403) {
    throw new Error(`Cross-tenant factory access should be 403, got ${crossTenant.response.status}: ${JSON.stringify(crossTenant.body)}`);
  }

  const injectedInput = await runAnalysis(userA.access_token, {
    action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: "client-input",
    observations: [{ metric: "energy_consumption_kwh", value: 999999 }],
  });
  if (injectedInput.response.status !== 400 || injectedInput.body.error !== "CLIENT_ANALYSIS_INPUT_NOT_ACCEPTED") {
    throw new Error("Client-supplied measurements were not rejected");
  }

  const injectedEconomics = await runAnalysis(userA.access_token, {
    action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: "client-economics",
    economics: { tariffInrPerKwh: 0.01, recoverableFraction: 1, interventionCostInr: 0 },
  });
  if (injectedEconomics.response.status !== 400 || injectedEconomics.body.error !== "CLIENT_ANALYSIS_INPUT_NOT_ACCEPTED") {
    throw new Error("Client-supplied economic assumptions or unknown fields were not rejected");
  }

  const key = "integration-single-run";
  const first = await runAnalysis(userA.access_token, {
    action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: key,
  });
  if (![200, 201].includes(first.response.status) || !first.body.run || typeof first.body.run !== "object") {
    throw new Error(`Authorized persist failed: ${first.response.status} ${JSON.stringify(first.body)}`);
  }
  const run = first.body.run as Json;
  if (typeof run.id !== "number" || run.asset_id !== assetA || run.factory_id !== factoryA) {
    throw new Error("Persisted run is not bound to the expected factory and asset");
  }

  // The fixture has four comparable historical periods and a current high-energy period.
  // Assert the end-to-end financial calculation, not merely a reproducible refusal result.
  const result = run.result as Json;
  const reference = result.reference as Json | undefined;
  const deviation = result.deviation as Json | undefined;
  const economics = result.economics as Json | undefined;
  const provenance = result.provenance as Json | undefined;
  if (result.status !== "opportunity" || deviation?.detected !== true) {
    throw new Error(`Expected a detected positive-net opportunity, got: ${JSON.stringify({ status: result.status, deviation })}`);
  }
  if (reference?.sampleCount !== 4 || economics?.quantified !== true ||
      economics.estimatedGrossValueInr !== 4000 ||
      economics.estimatedRecoverableValueInr !== 2000 ||
      economics.estimatedNetValueInr !== 1500) {
    throw new Error(`Unexpected financial calculation or baseline: ${JSON.stringify({ reference, economics })}`);
  }
  if (!Array.isArray(provenance?.inputObservationIds) || provenance.inputObservationIds.length !== 15) {
    throw new Error(`Persisted provenance should identify all 15 source observations: ${JSON.stringify(provenance)}`);
  }
  if ((run.input_snapshot as unknown as Json).factoryId !== factoryA) {
    throw new Error("Persisted canonical snapshot is not bound to the authorized factory");
  }

  const retry = await runAnalysis(userA.access_token, {
    action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: key,
  });
  if (retry.response.status !== 200 || (retry.body.run as Json | undefined)?.id !== run.id) {
    throw new Error("Idempotent retry did not return the original run");
  }

  const conflictingAsset = await runAnalysis(userA.access_token, {
    action: "persist", factoryId: factoryA, assetId: assetA2, idempotencyKey: key,
  });
  if (conflictingAsset.response.status !== 409 || conflictingAsset.body.error !== "IDEMPOTENCY_CONFLICT") {
    throw new Error("Reusing an idempotency key for another asset was not rejected");
  }

  const concurrentKey = "integration-concurrent-run";
  const concurrent = await Promise.all([
    runAnalysis(userA.access_token, { action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: concurrentKey }),
    runAnalysis(userA.access_token, { action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: concurrentKey }),
  ]);
  if (concurrent.some((item) => ![200, 201].includes(item.response.status))) {
    throw new Error(`Concurrent idempotent calls failed: ${concurrent.map((x) => x.response.status).join(",")}`);
  }
  const concurrentIds = concurrent.map((item) => (item.body.run as Json | undefined)?.id);
  if (!concurrentIds[0] || concurrentIds[0] !== concurrentIds[1]) {
    throw new Error(`Concurrent retries created different runs: ${JSON.stringify(concurrentIds)}`);
  }

  const verification = await runAnalysis(userA.access_token, {
    action: "verify", factoryId: factoryA, idempotencyKey: key,
  });
  if (verification.response.status !== 200 || verification.body.reproducible !== true) {
    throw new Error(`Reload/recompute verification failed: ${verification.response.status} ${JSON.stringify(verification.body)}`);
  }

  const foreignAsset = await runAnalysis(userA.access_token, {
    action: "persist", factoryId: factoryB, assetId: assetA, idempotencyKey: "foreign-factory",
  });
  if (foreignAsset.response.status !== 403) throw new Error("Cross-tenant factory identifier was not denied");

  const directRead = await requestJson("/rest/v1/factory_analysis_runs?select=id", {
    headers: { apikey: anonKey!, Authorization: `Bearer ${userA.access_token}` },
  });
  if (directRead.response.ok) throw new Error("Direct table read unexpectedly succeeded");

  const directInsert = await requestJson("/rest/v1/factory_analysis_runs", {
    method: "POST",
    headers: { apikey: anonKey!, Authorization: `Bearer ${userA.access_token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ factory_id: factoryA, asset_id: assetA, idempotency_key: "direct-insert", algorithm_version: "fake", input_snapshot: {}, result: {}, result_fingerprint: "fake", analysis_status: "insufficient_evidence", refusal_codes: [] }),
  });
  if (directInsert.response.ok) throw new Error("Direct table insert unexpectedly succeeded");

  const tooLarge = await fetch(new URL("/functions/v1/persist-factory-analysis", baseUrl), {
    method: "POST",
    headers: { apikey: anonKey!, Authorization: `Bearer ${userA.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "persist", factoryId: factoryA, assetId: assetA, idempotencyKey: "oversized", filler: "x".repeat(4_000_100) }),
  });
  if (tooLarge.status !== 413) throw new Error(`Oversized request should be 413, got ${tooLarge.status}`);
});
