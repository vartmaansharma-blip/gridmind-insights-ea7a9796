// Reference-only POC catalog integrity. No hardware instructions or actual vehicle readings.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const document = JSON.parse(readFileSync("data/poc/scooter-stationary-v1.json", "utf8"));
const sql = readFileSync("supabase/migrations/20261017060000_scooter_poc_reference_catalogue.sql", "utf8");
assert.equal(document.id, "gridmind-poc-01-generic-scooter");
assert.equal(document.classification, "POC_REFERENCE_ONLY_NOT_INDUSTRIAL_MACHINE_TYPE");
assert.equal(document.drivetrain_variant, "unknown_until_owner_confirms_petrol_or_electric");
assert.equal(document.manufacturer, null);
assert.equal(document.model, null);
assert.equal(document.serial_number, null);
assert.equal(document.machine_diagnostics_enabled, false);
assert.equal(document.real_vehicle_attached_sensors, 0);
assert.equal(document.measurement_execution_status, "not_started");
assert.equal(document.components.length, 18);
assert.equal(document.measurements.length, 12);
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `Duplicate ${label}`);
unique(document.components.map(x=>x.key), "components");
unique(document.measurements.map(x=>x.key), "measurements");
const comps = new Map(document.components.map(x=>[x.key,x]));
const phase = new Map([[0,0],[1,0],[2,0]]);
for(const c of document.components){
 assert.ok(["both","petrol","electric"].includes(c.applies_to));
 assert.equal(c.validation, "archetype_candidate");
 assert.ok(c.name.length > 4 && c.scope.length > 20);
 assert.ok(sql.includes("'" + c.key + "'"), `Missing SQL component ${c.key}`);
}
for(const m of document.measurements){
 const component = comps.get(m.component_key);
 assert.ok(component, `Missing component for ${m.key}`);
 assert.ok(["both",m.applies_to].includes(component.applies_to), `Invalid variant ${m.key}`);
 assert.ok(["phone","manual","existing_record","professional_external"].includes(m.source_class));
 assert.ok(["independent_test_rig","existing_record","future_qualified_scooter"].includes(m.data_origin));
 assert.ok(phase.has(m.phase));
 phase.set(m.phase,phase.get(m.phase)+1);
 assert.equal(m.installation_status, "not_installed");
 assert.equal(m.validation, "candidate_not_tested");
 assert.ok(m.can_prove.length > 25 && m.cannot_prove.length > 25,`Evidence limits required ${m.key}`);
 if(m.phase===0){
  assert.equal(m.source_class,"phone");
  assert.equal(m.data_origin,"independent_test_rig");
  assert.equal(m.professional_required,false);
 }
 if(m.source_class==="professional_external"){
  assert.equal(m.phase,2);
  assert.equal(m.professional_required,true);
  assert.equal(m.data_origin,"future_qualified_scooter");
 }
 assert.ok(sql.includes("'" + m.key + "'"), `Missing SQL measurement ${m.key}`);
}
assert.deepEqual(Object.fromEntries(phase),{"0":2,"1":5,"2":5});
for(const term of ["enable row level security","revoke all on","grant select on","to authenticated","on conflict(archetype_id","check (installation_status = 'not_installed')"]){
 assert.ok(sql.includes(term), `Missing database guard: ${term}`);
}
assert.ok(!sql.includes("insert into public.machine_types"), "Do not pollute industrial taxonomy");
console.log("POC-01 catalogue integrity OK: 18 scooter component candidates, 12 measurement options, zero installed sensors, no diagnostics.");
