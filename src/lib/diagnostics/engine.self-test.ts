import { evaluateDiagnostic } from "./engine";

const result = evaluateDiagnostic({
  assetId: "self-test-cnc-01",
  machineTypeId: 1,
  diagnosticKey: "energy_intensity",
  period: { start: "2026-01-01T00:00:00Z", end: "2026-01-31T23:59:59Z" },
  samples: [
    { timestamp: "2026-01-01T08:00:00Z", values: { power_kw: 20, production_count: 100, runtime_hours: 10 } },
    { timestamp: "2026-01-02T08:00:00Z", values: { power_kw: 22, production_count: 100, runtime_hours: 10 } },
  ],
  reference: {
    values: { energy_kwh_per_unit: 1.5 },
    source: "historical",
    version: "self-test-v1",
    confidence: 0.9,
  },
  economics: { electricityTariffPerKwh: 10 },
});

if (result.status !== "requires_investigation") {
  throw new Error("Diagnostic engine self-test failed.");
}

export const diagnosticEngineSelfTest = "passed";
