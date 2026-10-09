/**
 * Authoritative, deterministic factory-analysis loop.
 *
 * This module is deliberately pure: persistence adapters store its complete input
 * snapshot and output, then re-run it after reload to verify reproducibility.
 * It does not infer a machine cause or verified savings from a deviation.
 */
export const ANALYSIS_ALGORITHM_VERSION = "factory-loop-v1.3.0";

export type SampleQuality = "valid" | "suspect" | "invalid" | "missing" | "stale" | "conflicting" | "unverified" | "estimated" | "out_of_range";
export type EvidenceOrigin = "observed" | "synthetic" | "estimated";

export type OperatingSampleInput = {
  id: string;
  factoryId: number;
  assetId: string | null;
  energyValue: unknown;
  energyUnit: unknown;
  productionValue: unknown;
  productionUnit: unknown;
  operatingHours: unknown;
  operatingState: unknown;
  productCode: unknown;
  periodStart: unknown;
  periodEnd: unknown;
  quality: SampleQuality;
  origin: EvidenceOrigin;
  /** Canonical observation row IDs that contributed to this assembled period. */
  sourceObservationIds?: number[];
  /** Explicit mapping errors from the canonical-observation adapter. */
  mappingIssues?: string[];
};

export type EconomicInputs = {
  currency: string;
  /** Source context metadata is preserved for audit; it is not used as a hidden default. */
  sourceContextId?: number;
  sourceContextName?: string;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  tariffInrPerKwh: unknown;
  recoverableFraction: unknown;
  interventionCostInr: unknown;
};

export type AnalysisInput = {
  factoryId: number;
  current: OperatingSampleInput;
  baselineSamples: OperatingSampleInput[];
  economics: EconomicInputs;
  asOf: string;
  maxCurrentAgeDays?: number;
  maxBaselineAgeDays?: number;
};

export type ReasonCode =
  | "INVALID_FACTORY_ID"
  | "INVALID_SAMPLE_ID"
  | "INVALID_SAMPLE_ORIGIN"
  | "UNMAPPED_OBSERVATION_ROLE"
  | "INVALID_AGE_POLICY"
  | "NUMERIC_OVERFLOW"
  | "ASSET_CONTEXT_NOT_COMPARABLE"
  | "OPERATING_STATE_NOT_COMPARABLE"
  | "PRODUCT_NOT_COMPARABLE"
  | "PRODUCTION_UNIT_NOT_COMPARABLE"
  | "UNSUPPORTED_CURRENCY"
  | "NON_POSITIVE_NET_VALUE"
  | "FACTORY_MISMATCH"
  | "MISSING_ASSET_ID"
  | "MISSING_OPERATING_STATE"
  | "MISSING_PRODUCT_CONTEXT"
  | "OPERATING_CONTEXT_NOT_COMPARABLE"
  | "DUPLICATE_SAMPLE_ID"
  | "BASELINE_PERIOD_NOT_HISTORICAL"
  | "OVERLAPPING_BASELINE_PERIODS"
  | "INVALID_TIMESTAMP"
  | "FUTURE_TIMESTAMP"
  | "INVALID_PERIOD"
  | "STALE_CURRENT_OBSERVATION"
  | "STALE_BASELINE_OBSERVATION"
  | "MISSING_ENERGY_VALUE"
  | "INVALID_ENERGY_VALUE"
  | "MISSING_PRODUCTION_VALUE"
  | "INVALID_PRODUCTION_VALUE"
  | "MISSING_OPERATING_HOURS"
  | "INVALID_OPERATING_HOURS"
  | "UNSUPPORTED_ENERGY_UNIT"
  | "UNSUPPORTED_PRODUCTION_UNIT"
  | "NON_VALID_QUALITY_STATUS"
  | "ZERO_PRODUCTION"
  | "ZERO_ENERGY_WHILE_PRODUCING"
  | "INSUFFICIENT_COMPARABLE_BASELINE"
  | "MISSING_TARIFF"
  | "INVALID_TARIFF"
  | "MISSING_RECOVERY_FRACTION"
  | "INVALID_RECOVERY_FRACTION"
  | "MISSING_INTERVENTION_COST"
  | "INVALID_INTERVENTION_COST";

export type NormalizedSample = {
  id: string;
  factoryId: number;
  assetId: string;
  energyKwh: number;
  production: number;
  productionUnit: string;
  operatingHours: number;
  operatingState: string;
  productCode: string;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  origin: EvidenceOrigin;
  sourceQuality: SampleQuality;
};

export type AnalysisResult = {
  algorithmVersion: string;
  factoryId: number;
  status: "opportunity" | "deviation_no_opportunity" | "within_reference" | "insufficient_evidence";
  reasonCodes: ReasonCode[];
  evidence: {
    current: NormalizedSample | null;
    acceptedBaselineSampleIds: string[];
    excludedBaseline: Array<{ id: string; reasons: ReasonCode[] }>;
  };
  reference: {
    method: "median-comparable-specific-energy";
    sampleCount: number;
    specificEnergyKwhPerUnit: number | null;
    lowerBound: number | null;
    upperBound: number | null;
    confidence: "medium" | "low" | "none";
    limitations: string[];
  };
  deviation: {
    detected: boolean;
    direction: "higher_energy" | "lower_energy" | "none" | "unknown";
    actualSpecificEnergyKwhPerUnit: number | null;
    expectedSpecificEnergyKwhPerUnit: number | null;
    deltaKwhPerUnit: number | null;
    deltaPercent: number | null;
    excessEnergyKwh: number | null;
    explanation: string;
  };
  economics: {
    quantified: boolean;
    refusalReasons: ReasonCode[];
    currency: string;
    tariffInrPerKwh: number | null;
    recoverableFraction: number | null;
    interventionCostInr: number | null;
    estimatedGrossValueInr: number | null;
    estimatedRecoverableValueInr: number | null;
    estimatedNetValueInr: number | null;
    periodDays: number | null;
    annualizedRecoverableValueInr: number | null;
    label: "estimate" | "not_quantified";
  };
  provenance: {
    origin: EvidenceOrigin;
    synthetic: boolean;
    inputSampleIds: string[];
    inputObservationIds: number[];
    asOf: string;
    assumptions: string[];
  };
};

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const positive = (value: unknown): value is number => finite(value) && value > 0;
const nonNegative = (value: unknown): value is number => finite(value) && value >= 0;
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const evidenceId = (value: unknown): string => typeof value === "string" ? value : `[invalid-id:${typeof value}]`;
const timestamp = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|([+-])(\d{2}):(\d{2}))$/i);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return null;

  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  calendar.setUTCHours(hour, minute, second, 0);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 ||
      calendar.getUTCDate() !== day || calendar.getUTCHours() !== hour ||
      calendar.getUTCMinutes() !== minute || calendar.getUTCSeconds() !== second) return null;
  if (match[8] !== undefined && (Number(match[9]) > 23 || Number(match[10]) > 59)) return null;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ENERGY_TO_KWH: Record<string, number> = {
  kwh: 1, "kw·h": 1, "kw h": 1,
  wh: 0.001,
  mwh: 1000,
};
const normalizeEnergyUnit = (unit: unknown): number | null => {
  const key = text(unit)?.toLowerCase().replace(/\s+/g, " ") ?? "";
  return ENERGY_TO_KWH[key] ?? null;
};
const PRODUCTION_UNIT_ALIASES: Record<string, string> = {
  unit: "unit", units: "unit", piece: "unit", pieces: "unit", pcs: "unit", each: "unit",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  g: "g", gram: "g", grams: "g",
  t: "tonne", tonne: "tonne", tonnes: "tonne", "metric ton": "tonne", "metric tons": "tonne",
  l: "litre", liter: "litre", liters: "litre", litre: "litre", litres: "litre",
  m3: "m3", "m³": "m3", "cubic meter": "m3", "cubic meters": "m3",
};
const normalizeProductionUnit = (unit: unknown): string | null => {
  const normalized = text(unit)?.toLowerCase().replace(/\s+/g, " ") ?? "";
  return PRODUCTION_UNIT_ALIASES[normalized] ?? null;
};
const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : sorted[mid - 1] / 2 + sorted[mid] / 2;
};
const round = (value: number, digits = 8): number => {
  if (!Number.isFinite(value)) return value;
  const scale = 10 ** digits;
  if (!Number.isFinite(value * scale)) return value;
  return Math.round((value + Number.EPSILON) * scale) / scale;
};
const daysBetween = (start: number, end: number): number => (end - start) / 86_400_000;

type Normalization = { sample: NormalizedSample | null; reasons: ReasonCode[] };

function normalizeSample(
  input: OperatingSampleInput,
  factoryId: number,
  asOfMs: number,
  maxAgeDays: number,
  isCurrent: boolean,
): Normalization {
  const reasons: ReasonCode[] = [];
  if (typeof input.id !== "string" || input.id.trim().length === 0 || input.id.length > 200) reasons.push("INVALID_SAMPLE_ID");
  if (input.factoryId !== factoryId) reasons.push("FACTORY_MISMATCH");
  const assetId = text(input.assetId);
  if (!assetId) reasons.push("MISSING_ASSET_ID");
  const operatingState = text(input.operatingState);
  if (!operatingState) reasons.push("MISSING_OPERATING_STATE");
  const productCode = text(input.productCode);
  if (!productCode) reasons.push("MISSING_PRODUCT_CONTEXT");
  if (input.quality !== "valid") reasons.push("NON_VALID_QUALITY_STATUS");
  if (!["observed", "synthetic", "estimated"].includes(input.origin)) reasons.push("INVALID_SAMPLE_ORIGIN");
  if (input.mappingIssues?.length) reasons.push("UNMAPPED_OBSERVATION_ROLE");

  const startMs = timestamp(input.periodStart);
  const endMs = timestamp(input.periodEnd);
  if (startMs === null || endMs === null) reasons.push("INVALID_TIMESTAMP");
  if (startMs !== null && startMs > asOfMs || endMs !== null && endMs > asOfMs) reasons.push("FUTURE_TIMESTAMP");
  if (startMs !== null && endMs !== null && endMs <= startMs) reasons.push("INVALID_PERIOD");
  if (endMs !== null && endMs <= asOfMs && daysBetween(endMs, asOfMs) > maxAgeDays) {
    reasons.push(isCurrent ? "STALE_CURRENT_OBSERVATION" : "STALE_BASELINE_OBSERVATION");
  }

  if (input.energyValue === null || input.energyValue === undefined || input.energyValue === "") reasons.push("MISSING_ENERGY_VALUE");
  else if (!finite(input.energyValue) || input.energyValue < 0) reasons.push("INVALID_ENERGY_VALUE");
  const energyFactor = normalizeEnergyUnit(input.energyUnit);
  if (energyFactor === null) reasons.push("UNSUPPORTED_ENERGY_UNIT");
  if (input.productionValue === null || input.productionValue === undefined || input.productionValue === "") reasons.push("MISSING_PRODUCTION_VALUE");
  else if (!finite(input.productionValue) || input.productionValue < 0) reasons.push("INVALID_PRODUCTION_VALUE");
  const productionUnit = normalizeProductionUnit(input.productionUnit);
  if (productionUnit === null) reasons.push("UNSUPPORTED_PRODUCTION_UNIT");
  if (input.operatingHours === null || input.operatingHours === undefined || input.operatingHours === "") reasons.push("MISSING_OPERATING_HOURS");
  else if (!positive(input.operatingHours) || startMs === null || endMs === null || endMs <= startMs || input.operatingHours > 24 * daysBetween(startMs, endMs)) {
    reasons.push("INVALID_OPERATING_HOURS");
  }
  if (input.productionValue === 0) reasons.push("ZERO_PRODUCTION");
  if (input.energyValue === 0 && positive(input.productionValue)) reasons.push("ZERO_ENERGY_WHILE_PRODUCING");

  // A numeric zero is preserved and explicitly reason-coded; it is never converted to null.
  // Zero production and zero energy while producing cannot support an intensity conclusion.
  const normalizedEnergyKwh = finite(input.energyValue) && energyFactor !== null ? input.energyValue * energyFactor : Number.NaN;
  const specificEnergy = finite(input.productionValue) && input.productionValue > 0 ? normalizedEnergyKwh / input.productionValue : Number.NaN;
  if ((!Number.isFinite(normalizedEnergyKwh) || !Number.isFinite(specificEnergy)) &&
      finite(input.energyValue) && finite(input.productionValue) && input.productionValue > 0 && energyFactor !== null) {
    reasons.push("NUMERIC_OVERFLOW");
  }
  if (reasons.length > 0 || assetId === null || operatingState === null || productCode === null ||
      startMs === null || endMs === null || energyFactor === null || productionUnit === null ||
      !finite(input.energyValue) || !finite(input.productionValue) || !positive(input.operatingHours) ||
      !Number.isFinite(normalizedEnergyKwh) || !Number.isFinite(specificEnergy)) {
    return { sample: null, reasons: [...new Set(reasons)] };
  }

  return {
    sample: {
      id: input.id,
      factoryId: input.factoryId,
      assetId,
      energyKwh: round(normalizedEnergyKwh),
      production: input.productionValue,
      productionUnit,
      operatingHours: input.operatingHours,
      operatingState,
      productCode,
      periodStart: new Date(startMs).toISOString(),
      periodEnd: new Date(endMs).toISOString(),
      periodDays: round(daysBetween(startMs, endMs), 8),
      origin: input.origin,
      sourceQuality: input.quality,
    },
    reasons: [],
  };
}

export function analyzeFactoryLoop(input: AnalysisInput): AnalysisResult {
  const asOfMs = timestamp(input.asOf);
  const invalidFactory = !Number.isSafeInteger(input.factoryId) || input.factoryId <= 0;
  const maxCurrentAgeDays = input.maxCurrentAgeDays ?? 90;
  const maxBaselineAgeDays = input.maxBaselineAgeDays ?? 365;
  const invalidAgePolicy = !positive(maxCurrentAgeDays) || !positive(maxBaselineAgeDays);
  const duplicateCurrentId = input.baselineSamples.some((sampleInput) => sampleInput.id === input.current.id);
  const currentNorm = asOfMs === null || invalidFactory || invalidAgePolicy || duplicateCurrentId
    ? { sample: null, reasons: [...(invalidFactory ? ["INVALID_FACTORY_ID" as const] : []), ...(asOfMs === null ? ["INVALID_TIMESTAMP" as const] : []), ...(invalidAgePolicy ? ["INVALID_AGE_POLICY" as const] : []), ...(duplicateCurrentId ? ["DUPLICATE_SAMPLE_ID" as const] : [])] }
    : normalizeSample(input.current, input.factoryId, asOfMs, maxCurrentAgeDays, true);
  const current = currentNorm.sample;
  const excludedBaseline: Array<{ id: string; reasons: ReasonCode[] }> = [];
  const accepted: NormalizedSample[] = [];

  if (asOfMs !== null && !invalidFactory && !invalidAgePolicy) {
    const baselineIdCounts = new Map<string, number>();
    for (const sampleInput of input.baselineSamples) baselineIdCounts.set(sampleInput.id, (baselineIdCounts.get(sampleInput.id) ?? 0) + 1);
    const orderedBaselineSamples = [...input.baselineSamples].sort((a, b) => {
      const startA = timestamp(a.periodStart) ?? Number.POSITIVE_INFINITY;
      const startB = timestamp(b.periodStart) ?? Number.POSITIVE_INFINITY;
      return startA - startB || evidenceId(a.id).localeCompare(evidenceId(b.id)) || canonicalize(a).localeCompare(canonicalize(b));
    });
    for (const sampleInput of orderedBaselineSamples) {
      if (sampleInput.id === input.current.id || (baselineIdCounts.get(sampleInput.id) ?? 0) > 1) {
        excludedBaseline.push({ id: evidenceId(sampleInput.id), reasons: ["DUPLICATE_SAMPLE_ID"] });
        continue;
      }
      const normalized = normalizeSample(sampleInput, input.factoryId, asOfMs, maxBaselineAgeDays, false);
      if (!normalized.sample) {
        excludedBaseline.push({ id: sampleInput.id, reasons: normalized.reasons });
        continue;
      }
      if (current) {
        const baselineStart = timestamp(normalized.sample.periodStart);
        const baselineEnd = timestamp(normalized.sample.periodEnd);
        const currentStart = timestamp(current.periodStart);
        if (baselineStart === null || baselineEnd === null || currentStart === null || baselineEnd > currentStart) {
          excludedBaseline.push({ id: sampleInput.id, reasons: ["BASELINE_PERIOD_NOT_HISTORICAL"] });
          continue;
        }
        // Baselines are processed by ascending start time and accepted periods never overlap.
        // Therefore only the last accepted period can overlap this candidate (O(n), not O(n²)).
        const previousAccepted = accepted[accepted.length - 1];
        const previousStart = previousAccepted ? timestamp(previousAccepted.periodStart) : null;
        const previousEnd = previousAccepted ? timestamp(previousAccepted.periodEnd) : null;
        const overlapsAcceptedBaseline = previousStart !== null && previousEnd !== null &&
          baselineStart < previousEnd && baselineEnd > previousStart;
        if (overlapsAcceptedBaseline) {
          excludedBaseline.push({ id: sampleInput.id, reasons: ["OVERLAPPING_BASELINE_PERIODS"] });
          continue;
        }
      }
      if (current && normalized.sample.assetId !== current.assetId) {
        excludedBaseline.push({ id: sampleInput.id, reasons: ["ASSET_CONTEXT_NOT_COMPARABLE"] });
        continue;
      }
      if (current && normalized.sample.operatingState !== current.operatingState) {
        excludedBaseline.push({ id: sampleInput.id, reasons: ["OPERATING_STATE_NOT_COMPARABLE"] });
        continue;
      }
      if (current && normalized.sample.productCode !== current.productCode) {
        excludedBaseline.push({ id: sampleInput.id, reasons: ["PRODUCT_NOT_COMPARABLE"] });
        continue;
      }
      if (current && normalized.sample.productionUnit !== current.productionUnit) {
        excludedBaseline.push({ id: sampleInput.id, reasons: ["PRODUCTION_UNIT_NOT_COMPARABLE"] });
        continue;
      }
      if (current && (
        Math.abs((normalized.sample.operatingHours / normalized.sample.periodDays) / (current.operatingHours / current.periodDays) - 1) > 0.15 ||
        Math.abs((normalized.sample.production / normalized.sample.operatingHours) / (current.production / current.operatingHours) - 1) > 0.25
      )) {
        excludedBaseline.push({ id: sampleInput.id, reasons: ["OPERATING_CONTEXT_NOT_COMPARABLE"] });
        continue;
      }
      accepted.push(normalized.sample);
    }
  }

  const reasons = [...currentNorm.reasons];
  const secSamples = accepted
    .filter((sample) => sample.production > 0 && sample.energyKwh > 0)
    .map((sample) => ({ sample, sec: sample.energyKwh / sample.production }));
  if (secSamples.length < 3) reasons.push("INSUFFICIENT_COMPARABLE_BASELINE");

  const baselineSecs = secSamples.map((x) => x.sec);
  const baselineSecCandidate = baselineSecs.length >= 3 ? median(baselineSecs) : null;
  const madCandidate = baselineSecCandidate === null ? null : median(baselineSecs.map((sec) => Math.abs(sec - baselineSecCandidate)));
  const halfWidthCandidate = baselineSecCandidate === null || madCandidate === null
    ? null
    : Math.max(1.5 * madCandidate, baselineSecCandidate * 0.03);
  const lowerCandidate = baselineSecCandidate !== null && halfWidthCandidate !== null
    ? Math.max(0, baselineSecCandidate - halfWidthCandidate)
    : null;
  const upperCandidate = baselineSecCandidate !== null && halfWidthCandidate !== null
    ? baselineSecCandidate + halfWidthCandidate
    : null;
  const referenceCalculationOverflow = [baselineSecCandidate, madCandidate, halfWidthCandidate, lowerCandidate, upperCandidate]
    .some((value) => value !== null && !Number.isFinite(value));
  if (referenceCalculationOverflow) reasons.push("NUMERIC_OVERFLOW");
  const baselineSec = referenceCalculationOverflow ? null : baselineSecCandidate;
  const lower = referenceCalculationOverflow ? null : lowerCandidate;
  const upper = referenceCalculationOverflow ? null : upperCandidate;
  const confidence: AnalysisResult["reference"]["confidence"] = baselineSecs.length >= 9 ? "medium" : baselineSecs.length >= 3 ? "low" : "none";

  const actualSecRaw = current && current.production > 0 ? current.energyKwh / current.production : null;
  const actualSec = actualSecRaw !== null && Number.isFinite(actualSecRaw) ? actualSecRaw : null;
  if (actualSecRaw !== null && !Number.isFinite(actualSecRaw)) reasons.push("NUMERIC_OVERFLOW");
  const delta = actualSec !== null && baselineSec !== null ? actualSec - baselineSec : null;
  const deltaPercentRaw = delta !== null && baselineSec !== null && baselineSec > 0 ? delta / baselineSec * 100 : null;
  const deltaPercent = deltaPercentRaw !== null && Number.isFinite(deltaPercentRaw) ? deltaPercentRaw : null;
  if (deltaPercentRaw !== null && !Number.isFinite(deltaPercentRaw)) reasons.push("NUMERIC_OVERFLOW");
  const expectedEnergyRaw = current && baselineSec !== null ? baselineSec * current.production : null;
  const excessEnergyRaw = current && baselineSec !== null && expectedEnergyRaw !== null ? current.energyKwh - expectedEnergyRaw : null;
  const physicalCalculationOverflow = (expectedEnergyRaw !== null && !Number.isFinite(expectedEnergyRaw)) ||
    (excessEnergyRaw !== null && !Number.isFinite(excessEnergyRaw));
  if (physicalCalculationOverflow) reasons.push("NUMERIC_OVERFLOW");
  const excessEnergy = excessEnergyRaw !== null && Number.isFinite(excessEnergyRaw) ? excessEnergyRaw : null;
  const detected = actualSec !== null && upper !== null && actualSec > upper;
  const lowerDeviation = actualSec !== null && lower !== null && actualSec < lower;
  const direction: AnalysisResult["deviation"]["direction"] =
    detected ? "higher_energy" : lowerDeviation ? "lower_energy" : actualSec === null || baselineSec === null ? "unknown" : "none";

  const economicReasons: ReasonCode[] = [];
  const tariff = input.economics.tariffInrPerKwh;
  const recovery = input.economics.recoverableFraction;
  const capex = input.economics.interventionCostInr;
  if (input.economics.currency !== "INR") economicReasons.push("UNSUPPORTED_CURRENCY");
  if (!positive(tariff)) economicReasons.push(tariff === null || tariff === undefined || tariff === "" ? "MISSING_TARIFF" : "INVALID_TARIFF");
  if (!finite(recovery)) economicReasons.push(recovery === null || recovery === undefined || recovery === "" ? "MISSING_RECOVERY_FRACTION" : "INVALID_RECOVERY_FRACTION");
  else if (recovery < 0 || recovery > 1) economicReasons.push("INVALID_RECOVERY_FRACTION");
  if (!nonNegative(capex)) economicReasons.push(capex === null || capex === undefined || capex === "" ? "MISSING_INTERVENTION_COST" : "INVALID_INTERVENTION_COST");
  const validEconomics = input.economics.currency === "INR" && positive(tariff) && finite(recovery) && recovery >= 0 && recovery <= 1 && nonNegative(capex);
  const eligibleForOpportunity = detected && current !== null && excessEnergy !== null && excessEnergy > 0 &&
    !referenceCalculationOverflow && actualSec !== null && (deltaPercentRaw === null || Number.isFinite(deltaPercentRaw));
  const grossRaw = eligibleForOpportunity && positive(tariff) ? excessEnergy! * tariff : null;
  const recoverableRaw = grossRaw !== null && finite(recovery) ? grossRaw * recovery : null;
  const netRaw = recoverableRaw !== null && nonNegative(capex) ? recoverableRaw - capex : null;
  const annualizedRaw = recoverableRaw !== null && current !== null && current.periodDays > 0
    ? recoverableRaw * 365 / current.periodDays
    : null;
  const economicCalculationOverflow = eligibleForOpportunity && validEconomics &&
    [grossRaw, recoverableRaw, netRaw, annualizedRaw].some((value) => value === null || !Number.isFinite(value));
  if (economicCalculationOverflow) economicReasons.push("NUMERIC_OVERFLOW");
  const quantified = eligibleForOpportunity && validEconomics && !economicCalculationOverflow && current !== null && current.periodDays > 0;
  const grossValue = quantified ? round(grossRaw!) : null;
  const recoverableValue = quantified ? round(recoverableRaw!) : null;
  const netValue = quantified ? round(netRaw!) : null;
  const annualized = quantified ? round(annualizedRaw!) : null;
  const resultReasons = [...new Set(reasons)];
  if (eligibleForOpportunity && (!validEconomics || economicCalculationOverflow)) resultReasons.push(...economicReasons);
  if (quantified && netValue !== null && netValue <= 0) resultReasons.push("NON_POSITIVE_NET_VALUE");

  let status: AnalysisResult["status"] = "insufficient_evidence";
  if (current && baselineSec !== null && !reasons.includes("NUMERIC_OVERFLOW")) {
    status = quantified ? (netValue !== null && netValue > 0 ? "opportunity" : "deviation_no_opportunity") : detected ? "insufficient_evidence" : "within_reference";
    if (!detected && lowerDeviation) status = "deviation_no_opportunity";
  }

  const allOrigins = [input.current, ...input.baselineSamples].map((x) => x.origin);
  const synthetic = allOrigins.includes("synthetic");
  const hasEstimatedOrUnknownOrigin = allOrigins.some((value) => value === "estimated" || !["observed", "synthetic", "estimated"].includes(value));
  const origin: EvidenceOrigin = synthetic ? "synthetic" : hasEstimatedOrUnknownOrigin ? "estimated" : "observed";
  const limitations = [
    "Historical median is a reference, not proof of healthy or optimal operation.",
    "A deviation identifies a measurable difference; it does not establish root cause or causal attribution.",
    "Any monetary result is an estimate, not verified savings.",
    ...(synthetic ? ["At least one input is synthetic; this result must never be represented as a real-factory finding."] : []),
  ];
  if (confidence === "low") limitations.push("Only 3–8 comparable samples are available; reference confidence is low.");
  if (confidence === "medium") limitations.push("At least 9 comparable samples are available; sample count improves coverage but does not establish statistical confidence.");
  if (baselineSecs.length >= 3) limitations.push("Confidence labels are heuristic; sample count alone does not establish statistical confidence.");

  return {
    algorithmVersion: ANALYSIS_ALGORITHM_VERSION,
    factoryId: input.factoryId,
    status,
    reasonCodes: [...new Set(resultReasons)],
    evidence: {
      current,
      acceptedBaselineSampleIds: secSamples.map((x) => x.sample.id),
      excludedBaseline,
    },
    reference: {
      method: "median-comparable-specific-energy",
      sampleCount: secSamples.length,
      specificEnergyKwhPerUnit: baselineSec === null ? null : round(baselineSec),
      lowerBound: lower === null ? null : round(lower),
      upperBound: upper === null ? null : round(upper),
      confidence,
      limitations,
    },
    deviation: {
      detected,
      direction,
      actualSpecificEnergyKwhPerUnit: actualSec === null ? null : round(actualSec),
      expectedSpecificEnergyKwhPerUnit: baselineSec === null ? null : round(baselineSec),
      deltaKwhPerUnit: delta === null ? null : round(delta),
      deltaPercent: deltaPercent === null ? null : round(deltaPercent, 6),
      excessEnergyKwh: excessEnergy === null ? null : round(excessEnergy),
      explanation: current === null || baselineSec === null
        ? "No physical conclusion: current observation or comparable baseline failed evidence validation."
        : detected
          ? `Measured specific energy is ${round(actualSec!, 4)} kWh/${current.productionUnit}, above the reference upper bound ${round(upper!, 4)}. This is a deviation, not a root-cause diagnosis.`
          : lowerDeviation
            ? "Measured specific energy is below the reference envelope; investigate metering and operating context before interpreting it."
            : "Measured specific energy is inside the defensible reference envelope.",
    },
    economics: {
      quantified,
      refusalReasons: quantified ? [] : eligibleForOpportunity ? [...new Set(economicReasons)] : detected ? ["INSUFFICIENT_COMPARABLE_BASELINE"] : [],
      currency: input.economics.currency,
      tariffInrPerKwh: positive(tariff) ? tariff : null,
      recoverableFraction: finite(recovery) && recovery >= 0 && recovery <= 1 ? recovery : null,
      interventionCostInr: nonNegative(capex) ? capex : null,
      estimatedGrossValueInr: grossValue,
      estimatedRecoverableValueInr: recoverableValue,
      estimatedNetValueInr: netValue,
      periodDays: current?.periodDays ?? null,
      annualizedRecoverableValueInr: annualized,
      label: quantified ? "estimate" : "not_quantified",
    },
    provenance: {
      origin,
      synthetic,
      inputSampleIds: [evidenceId(input.current.id), ...input.baselineSamples.map((x) => evidenceId(x.id)).sort()],
      inputObservationIds: [...new Set([...(input.current.sourceObservationIds ?? []), ...input.baselineSamples.flatMap((sample) => sample.sourceObservationIds ?? [])])]
        .filter((id) => Number.isSafeInteger(id) && id > 0)
        .sort((a, b) => a - b),
      asOf: asOfMs === null ? input.asOf : new Date(asOfMs).toISOString(),
      assumptions: [
        "Energy normalized to kWh; accepted energy units are Wh, kWh, and MWh.",
        "Baseline uses the median specific-energy ratio of at least three comparable valid samples.",
        "Comparability requires the same asset, operating state, product code, and production unit; operating hours/day must be within 15% and production/operating-hour within 25%.",
        "Reference band is max(1.5 × median absolute deviation, 3% of median).",
        "Economic estimate uses positive excess kWh × supplied INR tariff × supplied recoverable fraction; an opportunity status additionally requires positive estimated net value after intervention cost.",
        "Annualization assumes the current period is representative of a 365-day year; it is an extrapolation, not verified savings.",
      ],
    },
  };
}

/** Canonical JSON for equality checks; object key order cannot alter the fingerprint. */
export function canonicalize(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => item === undefined ? "null" : canonicalize(item)).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).filter((key) => object[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",")}}`;
}

/** Non-cryptographic reproducibility fingerprint, not a security/signature primitive. */
export function reproducibilityFingerprint(value: unknown): string {
  const input = canonicalize(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
