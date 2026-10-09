import type { EconomicInputs, AnalysisInput, OperatingSampleInput, SampleQuality, EvidenceOrigin } from "./analysis-loop.ts";
type ObservationContract = {
  id: number;
  factoryId: number;
  subjectType: string;
  subjectId: number | null;
  metric: string;
  valueNumeric: number | null;
  valueText: string | null;
  unit: string | null;
  observedAt: string;
  observedUntil: string | null;
  qualityStatus: string;
  isEstimated: boolean;
  provenance: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
type OperatingContextContract = {
  id: number;
  factoryId: number;
  scopeType: string;
  scopeId: number | null;
  startTime: string;
  endTime: string | null;
  status: string;
  confidence: number | null;
  values: Record<string, unknown>;
};

export type AnalysisObservationRole = "energy" | "production" | "operating_hours" | "operating_state" | "product_code";
export type AnalysisEconomicContext = {
  id: number;
  name: string;
  currency: string;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  metadata: Record<string, unknown>;
};

type InputAdapterArgs = {
  factoryId: number;
  assetId: number;
  observations: ObservationContract[];
  operatingContexts: OperatingContextContract[];
  economicContext?: AnalysisEconomicContext | null;
  asOf: string;
};

const ROLES = new Set<AnalysisObservationRole>(["energy", "production", "operating_hours", "operating_state", "product_code"]);
const CANONICAL_METRIC_ROLES: Record<string, AnalysisObservationRole> = {
  energy_consumption_kwh: "energy",
  production_output: "production",
  operating_hours: "operating_hours",
  operating_state: "operating_state",
  product_code: "product_code",
};
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const roleOf = (observation: ObservationContract): { role: AnalysisObservationRole | null; issue: string | null } => {
  const metadata = record(observation.metadata);
  const provenance = record(observation.provenance);
  const raw = metadata.analysis_role ?? provenance.analysis_role;
  if (raw === undefined || raw === null || raw === "") {
    return { role: CANONICAL_METRIC_ROLES[observation.metric] ?? null, issue: null };
  }
  if (typeof raw !== "string" || !ROLES.has(raw as AnalysisObservationRole)) {
    return { role: null, issue: "Observation " + observation.id + " has an unsupported analysis_role." };
  }
  return { role: raw as AnalysisObservationRole, issue: null };
};
const periodStartOf = (observation: ObservationContract): string => {
  const metadataStart = record(observation.metadata).period_start;
  return typeof metadataStart === "string" ? metadataStart : observation.observedAt;
};
const periodEndOf = (observation: ObservationContract): string => {
  const metadataEnd = record(observation.metadata).period_end;
  return observation.observedUntil ?? (typeof metadataEnd === "string" ? metadataEnd : "");
};
const parsedTime = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};
const contextValues = (context: OperatingContextContract): Record<string, unknown> =>
  record(record(context.values).analysis_loop);
const nonEmptyText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

function contextForPeriod(
  contexts: OperatingContextContract[],
  assetId: number,
  periodStart: string,
  periodEnd: string,
 ): { context: OperatingContextContract | null; ambiguous: boolean } {
  const start = parsedTime(periodStart);
  const end = parsedTime(periodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { context: null, ambiguous: false };

  const applicable = contexts.filter((context) => {
    if (context.scopeType !== "asset" || context.scopeId !== assetId || !["active", "valid", "validated", "observed", "derived"].includes(context.status.toLowerCase())) return false;
    const contextStart = parsedTime(context.startTime);
    const contextEnd = context.endTime ? parsedTime(context.endTime) : Number.POSITIVE_INFINITY;
    return contextStart <= start && contextEnd >= end;
  }).sort((a, b) =>
    (b.confidence ?? -1) - (a.confidence ?? -1) || parsedTime(b.startTime) - parsedTime(a.startTime) || a.id - b.id,
  );
  if (!applicable.length) return { context: null, ambiguous: false };

  const bestConfidence = applicable[0].confidence ?? -1;
  const bestStart = parsedTime(applicable[0].startTime);
  const equallyRanked = applicable.filter((candidate) =>
    (candidate.confidence ?? -1) === bestConfidence && parsedTime(candidate.startTime) === bestStart,
  );
  const signatures = new Set(equallyRanked.map((candidate) => JSON.stringify(contextValues(candidate), Object.keys(contextValues(candidate)).sort())));
  return signatures.size === 1 ? { context: applicable[0], ambiguous: false } : { context: null, ambiguous: true };
}

function qualityFor(observations: ObservationContract[], hasDuplicateRole: boolean, requiredRolesComplete: boolean): SampleQuality {
  if (hasDuplicateRole) return "conflicting";
  const invalid = observations.find((observation) => observation.qualityStatus !== "valid");
  if (!invalid) return requiredRolesComplete ? "valid" : "missing";
  const allowed: SampleQuality[] = ["valid", "suspect", "invalid", "missing", "stale", "conflicting", "unverified", "estimated", "out_of_range"];
  return allowed.includes(invalid.qualityStatus as SampleQuality) ? invalid.qualityStatus as SampleQuality : "invalid";
}

function originFor(observations: ObservationContract[]): EvidenceOrigin {
  if (observations.some((observation) => record(observation.provenance).origin === "synthetic")) return "synthetic";
  if (observations.some((observation) => observation.isEstimated || observation.qualityStatus === "estimated")) return "estimated";
  return "observed";
}

function sampleForPeriod(
  factoryId: number,
  assetId: number,
  observations: ObservationContract[],
  contexts: OperatingContextContract[],
): OperatingSampleInput {
  const periodStart = observations.map(periodStartOf).sort((a, b) => parsedTime(a) - parsedTime(b))[0] ?? "";
  const periodEnd = observations.map(periodEndOf).sort((a, b) => parsedTime(b) - parsedTime(a))[0] ?? "";
  const byRole = new Map<AnalysisObservationRole, ObservationContract[]>();
  const mappingIssues: string[] = [];
  const contextIssues: string[] = [];
  for (const observation of observations) {
    const { role, issue } = roleOf(observation);
    if (issue) mappingIssues.push(issue);
    if (!role) continue;
    const roleRows = byRole.get(role) ?? [];
    roleRows.push(observation);
    byRole.set(role, roleRows);
  }
  const hasDuplicateRole = [...byRole.values()].some((rows) => rows.length > 1);
  const unique = (role: AnalysisObservationRole): ObservationContract | null => {
    const rows = byRole.get(role) ?? [];
    return rows.length === 1 ? rows[0] : null;
  };
  const energy = unique("energy");
  const production = unique("production");
  const hours = unique("operating_hours");
  const stateObservation = unique("operating_state");
  const productObservation = unique("product_code");
  const contextSelection = contextForPeriod(contexts, assetId, periodStart, periodEnd);
  const context = contextSelection.context;
  if (contextSelection.ambiguous) contextIssues.push("Equally ranked operating contexts conflict for this period.");
  const values = context ? contextValues(context) : {};
  const contextState = nonEmptyText(values.operatingState);
  const contextProduct = nonEmptyText(values.productCode);
  const observedState = stateObservation ? nonEmptyText(stateObservation.valueText) : null;
  const observedProduct = productObservation ? nonEmptyText(productObservation.valueText) : null;
  if (observedState && contextState && observedState !== contextState) mappingIssues.push("Operating-state observation conflicts with operating context.");
  if (observedProduct && contextProduct && observedProduct !== contextProduct) mappingIssues.push("Product-code observation conflicts with operating context.");

  const requiredRolesComplete = Boolean(energy && production && hours);
  const allIds = observations.map((observation) => observation.id).filter((id) => Number.isSafeInteger(id) && id > 0).sort((a, b) => a - b);
  const idStart = periodStart || "missing-start";
  const idEnd = periodEnd || "missing-end";
  return {
    id: "asset-" + assetId + ":" + idStart + ":" + idEnd,
    factoryId,
    assetId: String(assetId),
    energyValue: energy?.valueNumeric ?? null,
    energyUnit: energy?.unit ?? null,
    productionValue: production?.valueNumeric ?? null,
    productionUnit: production?.unit ?? null,
    operatingHours: hours?.valueNumeric ?? null,
    operatingState: observedState && contextState && observedState !== contextState ? "" : observedState ?? contextState ?? "",
    productCode: observedProduct && contextProduct && observedProduct !== contextProduct ? "" : observedProduct ?? contextProduct ?? "",
    periodStart,
    periodEnd,
    quality: qualityFor(observations, hasDuplicateRole, requiredRolesComplete),
    origin: originFor(observations),
    sourceObservationIds: allIds,
    mappingIssues,
    contextIssues,
  };
}

/**
 * Converts canonical observations only when explicit metadata.analysis_role mappings exist.
 * No metric-name guesses, missing-unit substitutions, or context defaults are permitted.
 */
export function buildAnalysisInputFromCanonical(args: InputAdapterArgs): AnalysisInput {
  const relevant = args.observations.filter((observation) =>
    observation.factoryId === args.factoryId && observation.subjectType === "asset" && observation.subjectId === args.assetId,
  );
  const groups = new Map<string, ObservationContract[]>();
  for (const observation of relevant) {
    const start = periodStartOf(observation);
    const end = periodEndOf(observation);
    const key = start + "\u0000" + end;
    const periodRows = groups.get(key) ?? [];
    periodRows.push(observation);
    groups.set(key, periodRows);
  }

  const samples = [...groups.values()].map((rows) => sampleForPeriod(args.factoryId, args.assetId, rows, args.operatingContexts));
  const recency = (sample: OperatingSampleInput): number => {
    const end = parsedTime(String(sample.periodEnd));
    return Number.isFinite(end) ? end : parsedTime(String(sample.periodStart));
  };
  samples.sort((a, b) => recency(a) - recency(b) || a.id.localeCompare(b.id));

  const current = samples.at(-1) ?? {
    id: "asset-" + args.assetId + ":no-observations",
    factoryId: args.factoryId,
    assetId: String(args.assetId),
    energyValue: null,
    energyUnit: null,
    productionValue: null,
    productionUnit: null,
    operatingHours: null,
    operatingState: "",
    productCode: "",
    periodStart: "",
    periodEnd: "",
    quality: "missing" as const,
    origin: "synthetic" as const,
    sourceObservationIds: [],
    mappingIssues: [],
  };

  const economicMetadata = record(record(args.economicContext?.metadata).analysis_loop);
  const economics: EconomicInputs = {
    currency: args.economicContext?.currency ?? "INR",
    tariffInrPerKwh: economicMetadata.tariffInrPerKwh ?? null,
    recoverableFraction: economicMetadata.recoverableFraction ?? null,
    interventionCostInr: economicMetadata.interventionCostInr ?? null,
    ...(args.economicContext ? {
      sourceContextId: args.economicContext.id,
      sourceContextName: args.economicContext.name,
      effectiveFrom: args.economicContext.effectiveFrom,
      effectiveUntil: args.economicContext.effectiveUntil,
    } : {}),
  };

  return {
    factoryId: args.factoryId,
    current,
    baselineSamples: samples.filter((sample) => sample.id !== current.id),
    economics,
    asOf: args.asOf,
  };
}
