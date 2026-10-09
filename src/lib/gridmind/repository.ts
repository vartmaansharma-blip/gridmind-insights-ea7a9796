import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  FactoryContext,
  GridMindFactorySnapshot,
  ObservationContract,
  OpportunityContract,
  InterventionContract,
  VerifiedOutcomeContract,
} from "./domain";

type FactoryRow = Database["public"]["Tables"]["factories"]["Row"];
type ObservationRow = Database["public"]["Tables"]["observations"]["Row"];

const jsonRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const observationToDomain = (row: ObservationRow): ObservationContract => ({
  id: row.id,
  factoryId: row.factory_id,
  subjectType: row.subject_type as ObservationContract["subjectType"],
  subjectId: row.subject_id,
  metric: row.metric,
  valueNumeric: row.value_numeric,
  valueText: row.value_text,
  unit: row.unit,
  observedAt: row.observed_at,
  observedUntil: row.observed_until,
  dataSourceId: row.data_source_id,
  qualityStatus: row.quality_status as ObservationContract["qualityStatus"],
  qualityScore: row.quality_score,
  isEstimated: row.is_estimated,
  provenance: jsonRecord(row.provenance),
  metadata: jsonRecord(row.metadata),
  createdAt: row.created_at,
});

const factoryContext = (row: FactoryRow): FactoryContext => {
  const metadata = jsonRecord(row.metadata);
  return {
    organizationId: row.organization_id,
    factoryId: row.id,
    name: row.name,
    location: row.location,
    industry: row.industry,
    timezone: typeof metadata.timezone === "string" ? metadata.timezone : "Asia/Kolkata",
    metadata,
  };
};

export type CanonicalMachineSnapshot = {
  id: number;
  factoryId: number;
  name: string;
  machineTypeId: number | null;
  manufacturer: string | null;
  model: string | null;
  ratedPowerKw: number | null;
  ratedCapacity: string | null;
  installationYear: number | null;
  processRole: string | null;
  connectivityMode: string | null;
  calibrationStatus: string | null;
  criticality: string | null;
  assetMetadata: Record<string, unknown>;
  machineType: { id: number; name: string; category: string | null; purpose: string | null } | null;
  dataSources: Array<{ id: number; name: string; sourceType: string; status: string; timezone: string }>;
  mappings: Array<{ id: number; sourceField: string; canonicalMetric: string; unit: string | null; status: string; confidence: number | null }>;
  observations: ObservationContract[];
};

export type CanonicalDeviation = {
  id: number;
  factoryId: number;
  scopeType: string;
  scopeId: number | null;
  metric: string;
  observationId: number;
  expectationId: number;
  actualValue: number | null;
  expectedValue: number | null;
  deviationValue: number | null;
  deviationPercentage: number | null;
  direction: string;
  persistence: string | null;
  statisticalSignificance: string | null;
  engineeringSignificance: string | null;
  economicMateriality: string | null;
  status: string;
};

export async function getAuthenticatedFactorySnapshots(): Promise<GridMindFactorySnapshot[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  const { data: factories, error: factoryError } = await supabase
    .from("factories")
    .select("id,name,location,industry,metadata,organization_id,created_at,operating_days_per_month,shifts_per_day")
    .order("id");
  if (factoryError) throw factoryError;
  if (!factories?.length) return [];

  const ids = factories.map((f) => f.id);
  const [assetsResult, observationsResult, opportunitiesResult, interventionsResult, outcomesResult] = await Promise.all([
    supabase.from("factory_assets").select("id,factory_id,name,machine_type_id,rated_power_kw,process_role,asset_metadata").in("factory_id", ids),
    supabase.from("observations").select("*").in("factory_id", ids).order("created_at", { ascending: false }),
    supabase.from("opportunities").select("*").in("factory_id", ids).order("priority_score", { ascending: false, nullsFirst: false }),
    supabase.from("asset_interventions").select("id,factory_id,opportunity_id,target_scope_type,target_scope_id,status,description,implementation_cost,expected_saving_inr,verification_method").in("factory_id", ids),
    supabase.from("verified_outcomes").select("*").in("factory_id", ids),
  ]);
  const firstError = [assetsResult, observationsResult, opportunitiesResult, interventionsResult, outcomesResult].find((r) => r.error)?.error;
  if (firstError) throw firstError;

  return factories.map((factory) => ({
    ...factoryContext(factory),
    assets: (assetsResult.data ?? []).filter((x) => x.factory_id === factory.id && jsonRecord(x.asset_metadata).lifecycle_status !== "retired").map((x) => ({
      id: x.id,
      name: x.name,
      machineTypeId: x.machine_type_id,
      ratedPowerKw: x.rated_power_kw,
      processRole: x.process_role,
    })),
    observations: (observationsResult.data ?? []).filter((x) => x.factory_id === factory.id).map(observationToDomain),
    opportunities: (opportunitiesResult.data ?? []).filter((x) => x.factory_id === factory.id).map((x) => x as unknown as OpportunityContract),
    interventions: (interventionsResult.data ?? []).filter((x) => x.factory_id === factory.id).map((x) => x as unknown as InterventionContract),
    verifiedOutcomes: (outcomesResult.data ?? []).filter((x) => x.factory_id === factory.id).map((x) => x as unknown as VerifiedOutcomeContract),
  }));
}

export async function getCanonicalMachineSnapshots(factoryId?: number): Promise<CanonicalMachineSnapshot[]> {
  const assetQuery = supabase
    .from("factory_assets")
    .select("id,factory_id,name,machine_type_id,manufacturer,model,rated_power_kw,rated_capacity,installation_year,process_role,connectivity_mode,calibration_status,criticality,asset_metadata")
    .order("id");
  const { data: assets, error: assetError } = factoryId ? await assetQuery.eq("factory_id", factoryId) : await assetQuery;
  if (assetError) throw assetError;

  const activeAssets = (assets ?? []).filter((a) => jsonRecord(a.asset_metadata).lifecycle_status !== "retired");
  const ids = activeAssets.map((a) => a.id);
  const factories = [...new Set(activeAssets.map((a) => a.factory_id))];
  const [typesResult, mappingsResult, observationsResult, sourceResult] = await Promise.all([
    supabase.from("machine_types").select("id,machine_type,category,purpose").in("id", [...new Set((assets ?? []).map((a) => a.machine_type_id).filter((x): x is number => x !== null))]),
    ids.length ? supabase.from("data_source_mappings").select("id,data_source_id,factory_id,source_field,canonical_metric,asset_id,unit,mapping_status,confidence").in("asset_id", ids) : Promise.resolve({ data: [], error: null }),
    factories.length ? supabase.from("observations").select("*").in("factory_id", factories).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null } as any),
    factories.length ? supabase.from("data_sources").select("id,factory_id,name,source_type,connection_status,timezone").in("factory_id", factories) : Promise.resolve({ data: [], error: null } as any),
  ]);
  const err = [typesResult, mappingsResult, observationsResult, sourceResult].find((r) => r.error)?.error;
  if (err) throw err;

  const typeMap = new Map<number, { id: number; machine_type: string; category: string | null; purpose: string | null }>(
    (typesResult.data ?? []).map((x: { id: number; machine_type: string; category: string | null; purpose: string | null }) => [x.id, x] as const),
  );
  const sourceMap = new Map<number, { id: number; name: string; source_type: string; connection_status: string; timezone: string }>(
    (sourceResult.data ?? []).map((x: { id: number; name: string; source_type: string; connection_status: string; timezone: string }) => [x.id, x] as const),
  );
  return activeAssets.map((a) => ({
    id: a.id,
    factoryId: a.factory_id,
    name: a.name,
    machineTypeId: a.machine_type_id,
    manufacturer: a.manufacturer,
    model: a.model,
    ratedPowerKw: a.rated_power_kw,
    ratedCapacity: a.rated_capacity,
    installationYear: a.installation_year,
    processRole: a.process_role,
    connectivityMode: a.connectivity_mode,
    calibrationStatus: a.calibration_status,
    criticality: a.criticality,
    assetMetadata: jsonRecord(a.asset_metadata),
    machineType: a.machine_type_id && typeMap.has(a.machine_type_id) ? (() => {
      const t = typeMap.get(a.machine_type_id)!;
      return { id: t.id, name: t.machine_type, category: t.category, purpose: t.purpose };
    })() : null,
    dataSources: ((mappingsResult.data ?? []) as Array<{ id: number; data_source_id: number; factory_id: number; source_field: string; canonical_metric: string; asset_id: number | null; unit: string | null; mapping_status: string; confidence: number | null }>)
      .filter((m) => m.asset_id === a.id)
      .map((m) => sourceMap.get(m.data_source_id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ id: s.id, name: s.name, sourceType: s.source_type, status: s.connection_status, timezone: s.timezone })),
    mappings: (mappingsResult.data ?? []).filter((m) => m.asset_id === a.id).map((m) => ({
      id: m.id,
      sourceField: m.source_field,
      canonicalMetric: m.canonical_metric,
      unit: m.unit,
      status: m.mapping_status,
      confidence: m.confidence,
    })),
    observations: ((observationsResult.data ?? []) as ObservationRow[]).filter((o) => o.subject_type === "asset" && o.subject_id === a.id).map(observationToDomain),
  }));
}

export async function getCanonicalOpportunities(factoryId: number): Promise<OpportunityContract[]> {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id,factory_id,title,status,scope_type,scope_id,deviation_id,evidence_bundle_id,gross_loss,avoidable_loss,recoverable_opportunity,expected_recovery,intervention_cost,expected_net_value,expected_roi,expected_payback_months,measurement_confidence,baseline_confidence,causal_confidence,economic_confidence,priority_score,urgency")
    .eq("factory_id", factoryId)
    .order("priority_score", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((x) => x as unknown as OpportunityContract);
}

export async function getCanonicalDeviations(factoryId: number): Promise<CanonicalDeviation[]> {
  const { data, error } = await supabase
    .from("performance_deviations")
    .select("id,factory_id,scope_type,scope_id,metric,observation_id,expectation_id,actual_value,expected_value,deviation_value,deviation_percentage,direction,persistence,statistical_significance,engineering_significance,economic_materiality,status")
    .eq("factory_id", factoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    factoryId: row.factory_id,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    metric: row.metric,
    observationId: row.observation_id,
    expectationId: row.expectation_id,
    actualValue: row.actual_value,
    expectedValue: row.expected_value,
    deviationValue: row.deviation_value,
    deviationPercentage: row.deviation_percentage,
    direction: row.direction,
    persistence: row.persistence,
    statisticalSignificance: row.statistical_significance,
    engineeringSignificance: row.engineering_significance,
    economicMateriality: row.economic_materiality,
    status: row.status,
  }));
}

export async function getCanonicalVerification(factoryId: number) {
  const [plans, runs, outcomes] = await Promise.all([
    supabase.from("verification_plans").select("*").eq("factory_id", factoryId).order("created_at", { ascending: false }),
    supabase.from("verification_runs").select("*").eq("factory_id", factoryId).order("created_at", { ascending: false }),
    supabase.from("verified_outcomes").select("*").eq("factory_id", factoryId).order("created_at", { ascending: false }),
  ]);
  const err = [plans, runs, outcomes].find((r) => r.error)?.error;
  if (err) throw err;
  return { plans: plans.data ?? [], runs: runs.data ?? [], outcomes: outcomes.data ?? [] };
}

export async function createCanonicalIntervention(input: {
  factoryId: number;
  assetId: number;
  opportunityId?: number | null;
  title: string;
  implementedAt: string;
  cost: number;
}) {
  const { data, error } = await supabase.from("asset_interventions").insert({
    factory_id: input.factoryId,
    asset_id: input.assetId,
    opportunity_id: input.opportunityId ?? null,
    intervention_date: input.implementedAt,
    intervention_type: "operational_change",
    description: input.title,
    expected_saving_inr: null,
    status: "implemented",
    implementation_cost: input.cost,
    preconditions: {},
    operating_constraints: {},
    safety_constraints: {},
    required_resources: {},
    implementation_steps: [],
    risk: {},
    dependencies: [],
    verification_method: { status: "verification_plan_required", source: "phase_13_2" },
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function createFactoryWorkspace(input: { name: string; location?: string; industry?: string }): Promise<number> {
  const { data, error } = await supabase.rpc("create_factory_workspace", {
    p_name: input.name, p_location: input.location, p_industry: input.industry,
  });
  if (error) throw error;
  return Number(data);
}

async function getOrCreateManualSource(factoryId: number): Promise<number> {
  const { data: existing, error: readError } = await supabase
    .from("data_sources")
    .select("id")
    .eq("factory_id", factoryId)
    .eq("source_type", "manual")
    .eq("name", "GridMind manual entry")
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return existing.id;

  const { data, error } = await supabase.from("data_sources").insert({
    factory_id: factoryId,
    name: "GridMind manual entry",
    source_type: "manual",
    connection_status: "connected",
    sampling_frequency: "monthly",
    timezone: "Asia/Kolkata",
    quality_status: "unverified",
    configuration_version: 1,
    metadata: { application: "gridmind", contract_version: 1 },
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function recordFactoryObservation(input: {
  factoryId: number;
  metric: string;
  value: number | null;
  unit: string;
  observedAt: string;
  observedUntil?: string;
  entryKey: string;
  estimated?: boolean;
}) {
  const sourceId = await getOrCreateManualSource(input.factoryId);
  const { data: existing, error: lookupError } = await supabase
    .from("observations")
    .select("id,value_numeric,created_at")
    .eq("factory_id", input.factoryId)
    .eq("data_source_id", sourceId)
    .eq("observed_at", input.observedAt)
    .eq("metric", input.metric)
    .eq("metadata->>entry_key", input.entryKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing && (
    input.value === null ? existing.value_numeric === null :
      existing.value_numeric !== null && Number(existing.value_numeric) === input.value
  )) return;

  const isMissing = input.value === null;
  const { error } = await supabase.from("observations").insert({
    factory_id: input.factoryId,
    subject_type: "factory",
    subject_id: input.factoryId,
    metric: input.metric,
    value_numeric: input.value,
    value_text: isMissing ? "MISSING" : null,
    unit: input.unit,
    observed_at: input.observedAt,
    observed_until: input.observedUntil ?? null,
    data_source_id: sourceId,
    quality_status: isMissing ? "missing" : input.estimated ? "estimated" : "unverified",
    quality_score: input.estimated ? 0.5 : null,
    is_estimated: Boolean(input.estimated),
    provenance: { source: "gridmind_manual_entry", entry_key: input.entryKey, application_contract_version: 1 },
    metadata: { entry_key: input.entryKey, supersession_policy: "append_only" },
  });
  if (error) throw error;
}

export async function syncFactoryAssets(factoryId: number, equipment: Array<{
  id: string; name: string; category: string; ratedKw: number; quantity: number; hoursPerMonth: number; loadFactor: number;
}>) {
  const { data: existing, error: readError } = await supabase.from("factory_assets")
    .select("id,asset_metadata").eq("factory_id", factoryId);
  if (readError) throw readError;
  const incomingIds = new Set<number>();
  const existingMap = new Map((existing ?? []).map((x) => [x.id, x]));

  for (const e of equipment) {
    const numericId = Number(e.id);
    const baseMetadata = Number.isInteger(numericId) ? jsonRecord(existingMap.get(numericId)?.asset_metadata) : {};
    const metadata = {
      ...baseMetadata,
      category: e.category,
      quantity: e.quantity,
      hoursPerMonth: e.hoursPerMonth,
      loadFactor: e.loadFactor,
      lifecycle_status: "active",
      application_contract_version: 2,
    };
    if (Number.isInteger(numericId) && existingMap.has(numericId)) {
      incomingIds.add(numericId);
      const { error } = await supabase.from("factory_assets").update({
        name: e.name,
        rated_power_kw: e.ratedKw,
        asset_metadata: metadata,
      }).eq("id", numericId).eq("factory_id", factoryId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("factory_assets").insert({
        factory_id: factoryId,
        name: e.name,
        rated_power_kw: e.ratedKw,
        asset_metadata: metadata,
      }).select("id").single();
      if (error) throw error;
      incomingIds.add(data.id);
    }
  }

  for (const e of existing ?? []) {
    if (!incomingIds.has(e.id) && jsonRecord(e.asset_metadata).lifecycle_status !== "retired") {
      const { error } = await supabase.from("factory_assets").update({
        asset_metadata: { ...jsonRecord(e.asset_metadata), lifecycle_status: "retired", retired_at: new Date().toISOString() },
      }).eq("id", e.id).eq("factory_id", factoryId);
      if (error) throw error;
    }
  }
}

export async function updateFactoryProfile(factoryId: number, patch: {
  name?: string; location?: string; industry?: string; metadata?: Record<string, unknown>;
}) {
  const { data: current, error: readError } = await supabase.from("factories").select("metadata").eq("id", factoryId).single();
  if (readError) throw readError;
  const metadata = { ...jsonRecord(current.metadata), ...patch.metadata };
  const { error } = await supabase.from("factories").update({
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.location !== undefined ? { location: patch.location } : {}),
    ...(patch.industry !== undefined ? { industry: patch.industry } : {}),
    metadata: metadata as Database["public"]["Tables"]["factories"]["Update"]["metadata"],
  }).eq("id", factoryId);
  if (error) throw error;
}

export async function updateOpportunityStatus(opportunityId: number, status: string) {
  const { error } = await supabase.from("opportunities").update({ status }).eq("id", opportunityId);
  if (error) throw error;
}
