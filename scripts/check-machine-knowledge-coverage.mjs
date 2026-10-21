// GridMind source-controlled candidate knowledge integrity gate.
// References only generic, unvalidated regional archetypes; it cannot activate diagnoses.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const base = "data/regional-machine-knowledge/";
const regional = read(base + "adityapur-jamshedpur-layer1-engineering.json");
const crosswalk = read(base + "adityapur-jamshedpur-canonical-mapping-v1.json");
const measurement = read(base + "adityapur-jamshedpur-layer2-measurement.json");
const diagnostics = read(base + "adityapur-jamshedpur-layer4-diagnostics.json");
const triage = read(base + "adityapur-jamshedpur-connectivity-triage-v1.json");
const acquisition = read(base + "measurement-acquisition-options-v1.json");

function unique(values, label) {
  assert.equal(values.length, new Set(values).size, `Duplicate ${label} detected`);
}
const regionalIds = regional.records.map((m) => m.machine_id);
const crosswalkIds = crosswalk.mappings.map((m) => m.regional_machine_id);
const candidateIds = triage.machine_types.map((m) => m.machine_id);
unique(regionalIds, "regional archetypes");
unique(crosswalkIds, "canonical crosswalk");
unique(candidateIds, "candidate coverage");
assert.equal(regionalIds.length, 49, "L1 inventory must be reviewed when its size changes");
assert.deepEqual([...candidateIds].sort(), [...regionalIds].sort());
assert.deepEqual([...crosswalkIds].sort(), [...regionalIds].sort());
assert.equal(triage.status, "candidate_screening_only");
assert.equal(triage.diagnostic_enablement, "all_blocked");
assert.equal(triage.installation_authorization, "none");
assert.equal(acquisition.status, "candidate_examples_not_specs");
const sourceById = new Map(regional.records.map((m) => [m.machine_id, m]));
const canonicalById = new Map(crosswalk.mappings.map((m) => [m.regional_machine_id, m]));
const candidates = Object.values(measurement.profiles).flat();
const quantities = Object.keys(acquisition.quantities);
unique(quantities, "measurement option definitions");
assert.deepEqual([...new Set(candidates)].sort(), quantities.sort(), "L2 profile signals must all have acquisition choices");
for (const [signal, choice] of Object.entries(acquisition.quantities)) {
  assert.ok(typeof choice.existing_or_manual === "string" && choice.existing_or_manual.length > 12, `Missing existing source for ${signal}`);
  assert.ok(choice.external_instrument_classes_to_consider.length > 0, `Missing candidate instrument for ${signal}`);
  assert.equal(choice.requirement_status, "conditional_engineering_review");
}
for (const m of triage.machine_types) {
  const l1 = sourceById.get(m.machine_id);
  const cross = canonicalById.get(m.machine_id);
  assert.ok(l1 && cross, `Unmatched regional machine ${m.machine_id}`);
  assert.equal(m.machine_type, l1.machine_type);
  assert.equal(m.engineering_level, "L1");
  assert.equal(m.canonical_mapping_status, cross.mapping_status);
  assert.equal(m.canonical_machine_type_id, cross.canonical_machine_type_id);
  assert.equal(m.manufacturer_model_mapping_status, "requires_nameplate_and_oem_documentation");
  assert.equal(m.validation_status, "not_validated");
  assert.equal(m.sensor_selection_status, "not_selected_or_installed");
  assert.equal(m.machine_diagnostics_enabled, false, "Do not enable unvalidated diagnostics");
  assert.equal(m.interventions_enabled, false, "Do not enable interventions");
  const profile = m.measurement_profile_candidate;
  if (profile === null) {
    assert.deepEqual(m.measurement_candidates, []);
    assert.equal(m.measurement_profile_status, "machine_specific_profile_required");
  } else {
    assert.ok(measurement.profiles[profile], `Missing profile ${profile}`);
    assert.deepEqual(m.measurement_candidates, measurement.profiles[profile]);
    assert.equal(m.measurement_profile_status, "family_screening_only_not_machine_specific");
  }
  unique(m.diagnostic_question_families_not_enabled, `diagnostic candidates for ${m.machine_id}`);
  for (const family of m.diagnostic_question_families_not_enabled)
    assert.ok(diagnostics.diagnostic_families[family], `Missing question family: ${family}`);
}
const summary = triage.coverage_summary;
assert.equal(summary.regional_archetypes, candidateIds.length);
assert.equal(summary.confident_canonical_mappings, triage.machine_types.filter((x) => x.canonical_mapping_status === "confident_canonical_mapping").length);
assert.equal(summary.unresolved_canonical_mappings, triage.machine_types.filter((x) => x.canonical_mapping_status === "unresolved_canonical_mapping").length);
assert.equal(summary.confident_canonical_mappings + summary.unresolved_canonical_mappings, candidateIds.length);
assert.equal(summary.candidate_profiles, triage.machine_types.filter((x) => x.measurement_profile_candidate !== null).length);
assert.equal(summary.needs_custom_profile, triage.machine_types.filter((x) => x.measurement_profile_candidate === null).length);
assert.equal(summary.machine_specific_validated_models, 0);
assert.equal(summary.validated_machine_specific_diagnostics, 0);
console.log(`Machine coverage integrity OK: ${candidateIds.length} regional archetypes; ${summary.confident_canonical_mappings} canonical links; ${summary.unresolved_canonical_mappings} unresolved; ${quantities.length} measurement acquisition choices. No diagnostics or installations authorized.`);
