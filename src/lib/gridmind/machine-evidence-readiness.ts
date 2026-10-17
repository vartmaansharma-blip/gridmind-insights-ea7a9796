import type { ObservationContract } from "./domain";
import type { CanonicalMachineSnapshot } from "./repository";

/**
 * Advisory coverage report for the FIRST industrial MVP workflow.
 *
 * This is intentionally not an authorization to run a diagnosis or a
 * substitute for the server's canonical input adapter and analysis gates.
 * It counts quality-eligible asset-level source records in complete periods;
 * it cannot establish operating comparability, calibration, causes or savings.
 */
const ROLES = ["energy", "production", "operating_hours"] as const;
type RequiredRole = (typeof ROLES)[number];
type ObservationRole = RequiredRole | "operating_state" | "product_code";

const canonicalRoles: Record<string, ObservationRole> = {
  energy_consumption_kwh: "energy",
  production_output: "production",
  operating_hours: "operating_hours",
  operating_state: "operating_state",
  product_code: "product_code",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function roleOf(o: ObservationContract): ObservationRole | null {
  const metadata = isRecord(o.metadata) ? o.metadata : {};
  const provenance = isRecord(o.provenance) ? o.provenance : {};
  const declared = metadata.analysis_role ?? provenance.analysis_role;
  if (declared !== undefined && declared !== null && declared !== "") {
    return typeof declared === "string" &&
      [...ROLES, "operating_state", "product_code"].includes(declared)
      ? (declared as ObservationRole)
      : null;
  }
  return canonicalRoles[o.metric] ?? null;
}

function periodOf(o: ObservationContract): string | null {
  const start = o.metadata.period_start ?? o.observedAt;
  const end = o.observedUntil ?? o.metadata.period_end;
  if (typeof start !== "string" || typeof end !== "string") return null;
  const explicitZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i;
  if (!explicitZone.test(start) || !explicitZone.test(end)) return null;
  const from = Date.parse(start), to = Date.parse(end);
  return Number.isFinite(from) && Number.isFinite(to) && to > from
    ? `${from}:${to}`
    : null;
}

function usable(o: ObservationContract): boolean {
  return o.qualityStatus === "valid" &&
    !o.isEstimated &&
    typeof o.valueNumeric === "number" &&
    Number.isFinite(o.valueNumeric) &&
    o.valueNumeric > 0 &&
    typeof o.unit === "string" &&
    o.unit.trim().length > 0;
}

export type MachineEvidenceReadiness = {
  state: "no_records" | "incomplete" | "basic_coverage";
  observationCount: number;
  qualityEligibleCount: number;
  candidatePeriods: number;
  incompletePeriods: number;
  rejectedRecords: number;
  distinctDocumentedSources: number;
  mappedSources: number;
  roles: Record<RequiredRole, number>;
  nextSteps: string[];
};

/**
 * Counts only asset-scoped observations for the selected asset/factory.
 * Four candidate periods means coverage for current + 3 possible historical
 * periods, NOT comparable baseline validation or machine-level diagnosis.
 */
export function assessMachineEvidence(
  asset: Pick<CanonicalMachineSnapshot,
    "id" | "factoryId" | "observations" | "dataSources" | "machineType">,
): MachineEvidenceReadiness {
  const observations = asset.observations.filter(
    (o) =>
      o.factoryId === asset.factoryId &&
      o.subjectType === "asset" &&
      o.subjectId === asset.id,
  );
  const roles: Record<RequiredRole, number> = {
    energy: 0,
    production: 0,
    operating_hours: 0,
  };
  const groups = new Map<string, Map<RequiredRole, number>>();
  let qualityEligibleCount = 0;
  let rejectedRecords = 0;
  const sourceIds = new Set<number>();

  for (const observation of observations) {
    const role = roleOf(observation);
    if (!role) {
      rejectedRecords += 1;
      continue;
    }
    // Operating state and product code can be valid text context. They are not
    // energy/output/hours measurements and must not inflate rejection counts.
    if (!ROLES.includes(role as RequiredRole)) continue;
    const period = periodOf(observation);
    if (!period || !usable(observation)) {
      rejectedRecords += 1;
      continue;
    }
    qualityEligibleCount += 1;
    if (observation.dataSourceId !== null) sourceIds.add(observation.dataSourceId);
    const typedRole = role as RequiredRole;
    roles[typedRole] += 1;
    const found = groups.get(period) ?? new Map<RequiredRole, number>();
    found.set(typedRole, (found.get(typedRole) ?? 0) + 1);
    groups.set(period, found);
  }

  let candidatePeriods = 0;
  let incompletePeriods = 0;
  for (const group of groups.values()) {
    if (ROLES.every((role) => group.get(role) === 1)) candidatePeriods += 1;
    else incompletePeriods += 1;
  }
  const nextSteps: string[] = [];
  if (!asset.machineType) nextSteps.push("Confirm the machine category and process role.");
  if (!observations.length) {
    nextSteps.push("Identify an existing permissioned meter or operator record for this machine.");
  }
  if (candidatePeriods < 4) {
    nextSteps.push(
      "Map machine-level energy, output and operating-hours readings to at least four distinct periods (current plus three historical candidates).",
    );
  }
  if (rejectedRecords || incompletePeriods) {
    nextSteps.push(
      "Reconcile incomplete, duplicate, unverified, estimated, invalid or unbounded records before analysis.",
    );
  }
  if (sourceIds.size === 0 && observations.length) {
    nextSteps.push("Link readings to their actual data source and preserve the original records.");
  }
  nextSteps.push(
    "Verify operating state, product/job mix, period comparability and any tariff/economic assumptions on the server.",
  );
  nextSteps.push(
    "Use a qualified reviewer for causal interpretation; no fault or verified savings follows from coverage alone.",
  );
  return {
    state: observations.length === 0
      ? "no_records"
      : candidatePeriods >= 4
        ? "basic_coverage"
        : "incomplete",
    observationCount: observations.length,
    qualityEligibleCount,
    candidatePeriods,
    incompletePeriods,
    rejectedRecords,
    distinctDocumentedSources: sourceIds.size,
    mappedSources: asset.dataSources.length,
    roles,
    nextSteps,
  };
}
