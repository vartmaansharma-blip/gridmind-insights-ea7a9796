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
  };
};

export async function getAuthenticatedFactorySnapshots(): Promise<GridMindFactorySnapshot[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  const { data: factories, error: factoryError } = await supabase
    .from("factories")
    .select("id,name,location,industry,metadata,organization_id")
    .order("id");

  if (factoryError) throw factoryError;
  if (!factories?.length) return [];

  const ids = factories.map((f) => f.id);

  const [assetsResult, observationsResult, opportunitiesResult, interventionsResult, outcomesResult] =
    await Promise.all([
      supabase.from("factory_assets").select("id,factory_id,name,machine_type_id,rated_power_kw,process_role").in("factory_id", ids),
      supabase.from("observations").select("*").in("factory_id", ids).order("created_at", { ascending: false }),
      supabase.from("opportunities").select("*").in("factory_id", ids).order("priority_score", { ascending: false, nullsFirst: false }),
      supabase.from("asset_interventions").select("id,factory_id,opportunity_id,target_scope_type,target_scope_id,status,description,implementation_cost,expected_saving_inr,verification_method").in("factory_id", ids),
      supabase.from("verified_outcomes").select("*").in("factory_id", ids),
    ]);

  const firstError = [assetsResult, observationsResult, opportunitiesResult, interventionsResult, outcomesResult].find((r) => r.error)?.error;
  if (firstError) throw firstError;

  return factories.map((factory) => ({
    ...factoryContext(factory),
    assets: (assetsResult.data ?? []).filter((x) => x.factory_id === factory.id).map((x) => ({
      id: x.id,
      name: x.name,
      machineTypeId: x.machine_type_id,
      ratedPowerKw: x.rated_power_kw,
      processRole: x.process_role,
    })),
    observations: (observationsResult.data ?? [])
      .filter((x) => x.factory_id === factory.id)
      .map(observationToDomain),
    opportunities: (opportunitiesResult.data ?? [])
      .filter((x) => x.factory_id === factory.id)
      .map((x) => x as unknown as OpportunityContract),
    interventions: (interventionsResult.data ?? [])
      .filter((x) => x.factory_id === factory.id)
      .map((x) => x as unknown as InterventionContract),
    verifiedOutcomes: (outcomesResult.data ?? [])
      .filter((x) => x.factory_id === factory.id)
      .map((x) => x as unknown as VerifiedOutcomeContract),
  }));
}

export async function createFactoryWorkspace(input: {
  name: string;
  location?: string;
  industry?: string;
}): Promise<number> {
  const { data, error } = await (supabase as any).rpc("create_factory_workspace", {
    p_name: input.name,
    p_location: input.location ?? null,
    p_industry: input.industry ?? null,
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

  const { data, error } = await supabase
    .from("data_sources")
    .insert({
      factory_id: factoryId,
      name: "GridMind manual entry",
      source_type: "manual",
      connection_status: "connected",
      sampling_frequency: "monthly",
      metadata: { application: "gridmind", contract_version: 1 },
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function recordFactoryObservation(input: {
  factoryId: number;
  metric: string;
  value: number;
  unit: string;
  observedAt: string;
  observedUntil?: string;
  entryKey: string;
  estimated?: boolean;
}) {
  const sourceId = await getOrCreateManualSource(input.factoryId);
  const { error } = await supabase.from("observations").insert({
    factory_id: input.factoryId,
    subject_type: "factory",
    subject_id: input.factoryId,
    metric: input.metric,
    value_numeric: input.value,
    value_text: null,
    unit: input.unit,
    observed_at: input.observedAt,
    observed_until: input.observedUntil ?? null,
    data_source_id: sourceId,
    quality_status: input.estimated ? "estimated" : "unverified",
    quality_score: input.estimated ? 0.5 : null,
    is_estimated: Boolean(input.estimated),
    provenance: {
      source: "gridmind_manual_entry",
      entry_key: input.entryKey,
      application_contract_version: 1,
    },
    metadata: {
      entry_key: input.entryKey,
      supersession_policy: "latest_created_at_wins",
    },
  });
  if (error) throw error;
}

export async function updateFactoryProfile(factoryId: number, patch: {
  name?: string;
  location?: string;
  industry?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: current, error: readError } = await supabase
    .from("factories")
    .select("metadata")
    .eq("id", factoryId)
    .single();
  if (readError) throw readError;

  const metadata = { ...jsonRecord(current.metadata), ...patch.metadata };
  const { error } = await supabase
    .from("factories")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.industry !== undefined ? { industry: patch.industry } : {}),
      metadata,
    })
    .eq("id", factoryId);
  if (error) throw error;
}

export async function updateOpportunityStatus(opportunityId: number, status: string) {
  const { error } = await supabase
    .from("opportunities")
    .update({ status })
    .eq("id", opportunityId);
  if (error) throw error;
}
