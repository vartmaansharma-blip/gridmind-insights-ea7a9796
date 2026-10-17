import { describe, expect, it } from "vitest";
import type { CanonicalMachineSnapshot } from "./repository";
import type { ObservationContract } from "./domain";
import { assessMachineEvidence } from "./machine-evidence-readiness";

const asset = {
  id: 7,
  factoryId: 3,
  machineType: { id: 8, name: "Air Compressor", category: "Utilities", purpose: null },
  dataSources: [{ id: 5, name: "Meter log", sourceType: "manual", status: "unknown", timezone: "Asia/Kolkata" }],
  observations: [] as ObservationContract[],
} satisfies Pick<CanonicalMachineSnapshot, "id" | "factoryId" | "machineType" | "dataSources" | "observations">;

function row(id: number, metric: string, overrides: Partial<ObservationContract> = {}): ObservationContract {
  const index = Math.floor((id - 1) / 3);
  const start = new Date(Date.UTC(2026, 9, 1 + index)).toISOString();
  const end = new Date(Date.UTC(2026, 9, 2 + index)).toISOString();
  return {
    id, factoryId: 3, subjectType: "asset", subjectId: 7,
    metric, valueNumeric: 100, valueText: null,
    unit: metric === "operating_hours" ? "h" : metric === "production_output" ? "units" : "kWh",
    observedAt: start, observedUntil: end, qualityStatus: "valid",
    qualityScore: 1, dataSourceId: 5, isEstimated: false,
    metadata: {}, provenance: {}, createdAt: end, ...overrides,
  };
}
const readings = () => Array.from({ length: 4 }, (_, i) => [
  row(i * 3 + 1, "energy_consumption_kwh"),
  row(i * 3 + 2, "production_output"),
  row(i * 3 + 3, "operating_hours"),
]).flat();

describe("machine evidence readiness for MVP", () => {
  it("returns a practical missing-evidence plan when an asset is not instrumented", () => {
    const r = assessMachineEvidence(asset);
    expect(r.state).toBe("no_records");
    expect(r.candidatePeriods).toBe(0);
    expect(r.nextSteps.join(" ")).toContain("existing permissioned meter");
  });

  it("counts four candidate periods but never states the machine is diagnosed or analyzable", () => {
    const r = assessMachineEvidence({ ...asset, observations: readings() });
    expect(r.state).toBe("basic_coverage");
    expect(r.candidatePeriods).toBe(4);
    expect(r.roles).toEqual({ energy: 4, production: 4, operating_hours: 4 });
    expect(r.distinctDocumentedSources).toBe(1);
    expect(r.nextSteps.join(" ")).toContain("period comparability");
    expect(r.nextSteps.join(" ")).toContain("qualified reviewer");
  });

  it("rejects duplicate roles, incomplete periods, and poor-quality input instead of silently treating it as valid", () => {
    const rows = readings();
    rows.push(row(13, "energy_consumption_kwh", { observedAt: rows[0].observedAt, observedUntil: rows[0].observedUntil }));
    rows[4] = { ...rows[4], qualityStatus: "unverified" };
    const r = assessMachineEvidence({ ...asset, observations: rows });
    expect(r.state).toBe("incomplete");
    expect(r.candidatePeriods).toBe(2);
    expect(r.incompletePeriods).toBe(2);
    expect(r.rejectedRecords).toBe(1);
  });

  it("never promotes factory-wide meter readings, estimated values, unknown roles or values without explicit periods", () => {
    const rows = readings();
    rows[0] = { ...rows[0], subjectType: "factory", subjectId: 3 };
    rows[1] = { ...rows[1], isEstimated: true };
    rows[2] = { ...rows[2], metadata: { analysis_role: "invented" } };
    rows[3] = { ...rows[3], observedUntil: null };
    const r = assessMachineEvidence({ ...asset, observations: rows });
    expect(r.candidatePeriods).toBe(2);
    expect(r.observationCount).toBe(11);
    expect(r.rejectedRecords).toBe(3);
  });

  it("accepts string operating context without misclassifying it as an invalid numeric meter reading", () => {
    const record = row(21, "operating_state", {
      valueNumeric: null,
      valueText: "running",
      unit: null,
      metadata: { analysis_role: "operating_state" },
    });
    const result = assessMachineEvidence({ ...asset, observations: [...readings(), record] });
    expect(result.candidatePeriods).toBe(4);
    expect(result.rejectedRecords).toBe(0);
    expect(result.qualityEligibleCount).toBe(12);
  });

  it("honors explicit role metadata and avoids treating repeated source readings as independent periods", () => {
    const rows = readings().map((o) => ({
      ...o, metric: "custom",
      metadata: { analysis_role: o.metric === "energy_consumption_kwh" ? "energy" : o.metric === "production_output" ? "production" : "operating_hours" },
    }));
    const r = assessMachineEvidence({ ...asset, observations: rows });
    expect(r.candidatePeriods).toBe(4);
    const duplicated = assessMachineEvidence({ ...asset, observations: [...rows, { ...rows[0], id: 99 }] });
    expect(duplicated.candidatePeriods).toBe(3);
  });
});
