export interface DiagnosticContract {
  required: readonly string[];
  minimumSamples: number;
  requiresReference: boolean;
}

const CONTRACTS: Record<string, DiagnosticContract> = {
  energy_intensity: { required: ["power_kw", "production_count"], minimumSamples: 1, requiresReference: true },
  energy_per_unit: { required: ["power_kw", "production_count"], minimumSamples: 1, requiresReference: true },
  energy_per_weld: { required: ["power_kw", "production_count"], minimumSamples: 1, requiresReference: true },
  idle_energy: { required: ["power_kw", "operating_state"], minimumSamples: 1, requiresReference: true },
  idle_running: { required: ["power_kw", "production_count", "operating_state"], minimumSamples: 1, requiresReference: true },
  excess_idle_energy: { required: ["power_kw", "operating_state"], minimumSamples: 1, requiresReference: true },
  unload_loss: { required: ["power_kw", "load_state"], minimumSamples: 1, requiresReference: true },
  off_hours_operation: { required: ["power_kw", "operating_state"], minimumSamples: 1, requiresReference: true },
  cycle_drift: { required: ["cycle_time_s"], minimumSamples: 2, requiresReference: true },
  cycle_anomaly: { required: ["cycle_time_s"], minimumSamples: 2, requiresReference: true },
  stroke_anomaly: { required: ["stroke_rate_spm"], minimumSamples: 2, requiresReference: true },
  pressure_anomaly: { required: ["pressure_bar"], minimumSamples: 2, requiresReference: true },
  temperature_deviation: { required: ["temperature_c"], minimumSamples: 2, requiresReference: true },
  thermal_anomaly: { required: ["temperature_c"], minimumSamples: 2, requiresReference: true },
  flow_anomaly: { required: ["flow_lpm"], minimumSamples: 2, requiresReference: true },
  flow_loss: { required: ["flow_lpm"], minimumSamples: 2, requiresReference: true },
  throughput_anomaly: { required: ["production_count", "runtime_hours"], minimumSamples: 2, requiresReference: true },
  load_anomaly: { required: ["load_kw"], minimumSamples: 2, requiresReference: true },
  overload: { required: ["load_kva"], minimumSamples: 1, requiresReference: true },
  excess_idle_runtime: { required: ["load_kw", "runtime_hours"], minimumSamples: 1, requiresReference: true },
  pressure_excess: { required: ["discharge_pressure_bar"], minimumSamples: 1, requiresReference: true },
  specific_power: { required: ["power_kw", "air_flow_nm3_h"], minimumSamples: 2, requiresReference: true },
  cooling_efficiency: { required: ["power_kw"], minimumSamples: 2, requiresReference: true },
  pump_efficiency: { required: ["power_kw", "flow_lpm", "discharge_pressure_bar"], minimumSamples: 2, requiresReference: true },
  hydraulic_efficiency: { required: ["power_kw", "pressure_bar"], minimumSamples: 2, requiresReference: true },
  fuel_efficiency: { required: ["load_kw", "fuel_consumption_lph"], minimumSamples: 2, requiresReference: true },
  loss_anomaly: { required: ["load_kw"], minimumSamples: 2, requiresReference: true },
  power_quality_indicator: { required: ["power_factor"], minimumSamples: 2, requiresReference: true },
  electrical_anomaly: { required: ["power_kw"], minimumSamples: 2, requiresReference: true },
  filter_restriction: { required: ["power_kw", "airflow_m3_h"], minimumSamples: 2, requiresReference: true },
  overheating: { required: ["oil_temperature_c"], minimumSamples: 2, requiresReference: true },
  cavitation_indicator: { required: ["vibration_mm_s", "flow_lpm", "discharge_pressure_bar"], minimumSamples: 2, requiresReference: true },
  thermal_efficiency: { required: ["power_kw", "temperature_c", "production_count"], minimumSamples: 1, requiresReference: true },
};

export function getDiagnosticContract(key: string): DiagnosticContract | undefined {
  return CONTRACTS[key];
}
