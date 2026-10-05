import type { DiagnosticRequest, DiagnosticResult, EvidenceItem } from "./types";
import { getDiagnosticContract } from "./contracts";

const nums = (request: DiagnosticRequest, key: string) =>
  request.samples.map(s => s.values[key]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));

const avg = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;

const ref = (request: DiagnosticRequest, key: string) => {
  const value = request.reference?.values[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const fail = (request: DiagnosticRequest, message: string): DiagnosticResult => ({
  assetId: request.assetId,
  machineTypeId: request.machineTypeId,
  diagnosticKey: request.diagnosticKey,
  status: "insufficient_evidence",
  evidence: [],
  metrics: {},
  explanation: message,
  limitations: ["Fail-closed result."],
  evaluatedAt: new Date().toISOString(),
});

const evidence = (key: string, value: number, lineage: string): EvidenceItem => ({
  key, value, state: "observed", source: "diagnostic-engine", confidence: 1, lineage
});

export function evaluateDiagnostic(request: DiagnosticRequest): DiagnosticResult {
  const contract = getDiagnosticContract(request.diagnosticKey);
  if (!contract) return fail(request, "Diagnostic is not registered.");
  if (request.samples.length < contract.minimumSamples) return fail(request, "Insufficient samples.");

  const missing = contract.required.filter(key => nums(request, key).length === 0);
  if (missing.length) return fail(request, "Missing or invalid evidence: " + missing.join(", "));
  if (contract.requiresReference && !request.reference) return fail(request, "Approved reference is missing.");

  const metrics: Record<string, number> = {};
  const items: EvidenceItem[] = [];

  if (["energy_intensity", "energy_per_unit", "energy_per_weld"].includes(request.diagnosticKey)) {
    const power = avg(nums(request, "power_kw"));
    const production = nums(request, "production_count").reduce((a, b) => a + b, 0);
    const baseline = ref(request, "energy_kwh_per_unit");
    const hours = avg(nums(request, "runtime_hours")) ?? 1;

    if (power === undefined || production <= 0 || baseline === undefined) {
      return fail(request, "Energy intensity cannot be calculated.");
    }

    const actual = (power * hours) / production;
    const deviation = Math.max(0, actual - baseline);
    metrics.actual_kwh_per_unit = actual;
    metrics.reference_kwh_per_unit = baseline;
    metrics.excess_kwh_per_unit = deviation;
    items.push(evidence("actual_kwh_per_unit", actual, "power × runtime / production"));
    items.push(evidence("reference_kwh_per_unit", baseline, "approved reference"));
  } else if (["idle_energy", "idle_running", "excess_idle_energy", "unload_loss", "off_hours_operation"].includes(request.diagnosticKey)) {
    const power = avg(nums(request, "power_kw"));
    const baseline = ref(request, "idle_power_kw");
    const hours = avg(nums(request, "runtime_hours"));

    if (power === undefined || baseline === undefined || hours === undefined || hours <= 0) {
      return fail(request, "Idle energy cannot be calculated.");
    }

    const avoidable = Math.max(0, power - baseline) * hours;
    metrics.actual_power_kw = power;
    metrics.reference_idle_power_kw = baseline;
    metrics.avoidable_kwh = avoidable;
    items.push(evidence("avoidable_kwh", avoidable, "(power - idle reference) × runtime"));
  } else if (["cycle_drift", "cycle_anomaly"].includes(request.diagnosticKey)) {
    const actual = avg(nums(request, "cycle_time_s"));
    const baseline = ref(request, "cycle_time_s");

    if (actual === undefined || baseline === undefined || baseline <= 0) {
      return fail(request, "Cycle reference is missing or invalid.");
    }

    metrics.actual_cycle_time_s = actual;
    metrics.reference_cycle_time_s = baseline;
    metrics.cycle_drift_s = actual - baseline;
    metrics.cycle_drift_pct = ((actual - baseline) / baseline) * 100;
    items.push(evidence("cycle_drift_s", metrics.cycle_drift_s, "actual - reference"));
    items.push(evidence("cycle_drift_pct", metrics.cycle_drift_pct, "(actual - reference) / reference"));
  } else {
    return fail(request, "Evidence contract exists, but deterministic calculation is not implemented yet.");
  }

  const material = Object.values(metrics).some(v => Math.abs(v) > 0);

  return {
    assetId: request.assetId,
    machineTypeId: request.machineTypeId,
    diagnosticKey: request.diagnosticKey,
    status: material ? "requires_investigation" : "evaluated",
    evidence: items,
    metrics,
    explanation: material ? "Deviation detected against the supplied reference." : "No material deviation calculated.",
    limitations: ["Generic logic requires field validation.", "Deviation does not establish cause.", "Economic exposure is not verified savings."],
    nextInvestigation: material ? ["Validate reference quality.", "Compare with customer-known issues.", "Investigate with qualified personnel."] : undefined,
    evaluatedAt: new Date().toISOString(),
  };
}
