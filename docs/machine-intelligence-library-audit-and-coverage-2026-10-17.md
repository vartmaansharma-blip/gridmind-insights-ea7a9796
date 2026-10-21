# GridMind machine intelligence: source-vs-live inventory and adoption gate
**Audit date:** 2026-10-17 (Asia/Kolkata). **State:** catalogue screening, **not a connected diagnostic product**.

## Bottom line
Machine data **is already present**, but **not everything is loaded or validated**. We must distinguish five independent layers:

1. **Industry taxonomy:** [31 industries](../data/industry-machine-taxonomy.json), descriptions of equipment usually associated with each industry. These are not customer asset ownership records.
2. **Universal machine type:** Supabase public.machine_types, **14 types**, machine_type_knowledge **14 candidate / not_yet_validated** reference records. Proposed failure modes and checks exist in diagnostic_rules (**57 candidate rules**); no machine-level field validation established.
3. **Regional machine archetype:** [49 regional L1 engineering archetypes](../data/regional-machine-knowledge/adityapur-jamshedpur-layer1-engineering.json), **7** confidently mapped to existing canonical types, **42** unresolved in the [crosswalk](../data/regional-machine-knowledge/adityapur-jamshedpur-canonical-mapping-v1.json). The unresolved 42 must **not** be assigned a broad or incorrect canonical ID.
4. **Manufacturer/OEM product model:** The schema holds `factory_assets.manufacturer` and `factory_assets.model`. All **8 current asset rows** have text values, but there is **no source-verified, versioned OEM model catalogue**. An asset's label is not a validated make/model specification. We have no authority to invent rated values, limits, OEM failure frequencies, service advice, or documentation.
5. **Physical deployed assets and measurements:** Supabase had **8 asset rows**, **8 integration profiles**, **8 calibration profiles**, **69 asset_sensor_mappings** (all `not_installed`, `available=false`, `source_type=retrofit`), **8 retrofit assessments** (all `pending`), **1 asset_measurements row**, **0 intelligence_events** at the audit. These are *database records*, not proof that instruments are operating or the asset data belongs to a real consenting customer.

Other Supabase reference records: **78** machine_measurement_definitions, **57** diagnostic_rules with candidate required metrics and recommended checks. All **14** machine_type_knowledge records remain `candidate / not_yet_validated`.

**Caution:** Counts are point-in-time Supabase observations, not source-controlled production fixtures. Do not replay these numbers into any user's live workspace or create new factories, customer models, statuses, or sensors.

## Newly added source-controlled planning coverage
- [49-machine connectivity triage](../data/regional-machine-knowledge/adityapur-jamshedpur-connectivity-triage-v1.json) joins the actual L1 inventory to the 7/42 canonical crosswalk. It assigns **46 candidate family measurement profiles**; **3 cases require specialized profiles** (shot blasting, EDM, wire EDM).
- [33 measurement-acquisition options](../data/regional-machine-knowledge/measurement-acquisition-options-v1.json) list **existing/manual evidence first** and example qualified instrument *classes* second. No actual device is selected, bought, installed, connected, calibrated, or declared necessary.
- Machine diagnostic **question families** refer to the [L4 evidence policy](../data/regional-machine-knowledge/adityapur-jamshedpur-layer4-diagnostics.json), **not** an active fault classifier. Every regional record explicitly disables automatic diagnoses and interventions.
- `bun run knowledge:check` confirms complete source linkage, flags omissions, validates every measurement option and prohibits accidentally enabling machine-specific diagnostics.

## What a machine passport must eventually contain
`factory_id` → `process_id` (once real plant process is observed) → `asset_id` → *verified canonical type* (or unresolved candidate) → *nameplate/OEM model* + evidence provenance → *existing data sources* → optional *qualified external measurements* → *operating context* → evidence/reviewed finding → signed-off action → measured outcome.

Information to collect **only after permission**:
- Machine nameplate photo or documentation, serial/model identity, factory and operating purpose.
- Manufacturer instructions and physical accessibility/installation constraints reviewed by a qualified technician.
- Relevant bills, meter data, operator logs, shift/job production, maintenance or quality documents; instrumented data if already available.
- Site-specific safety/risk approval and suitable calibration, sample-rate and context needs **if** external measurement is financially and technically justified.

Machine mapping is not OEM model validation; an existing bill cannot uniquely measure individual machine consumption. Never infer specific motor/bearing/tool failure from generic energy or vibration deviations. Recommended checks are **hypotheses and verification activities**, not automatic repair instructions. A sensor-absent machine is still eligible for an evidence-led investigation.

## Product readiness and decisions
| Capability | Reality | Next evidence gate |
| --- | --- | --- |
| Machine type selection | 14 database types + 49 regional L1 code archetypes | Confirm the first buyer's exact machines; review the 42 unmatched types |
| OEM model registry | 8 assets have manufacturer/model text; **no verified OEM catalogue** | Collect consenting-site nameplates/manuals, verify exact model and variants |
| Candidate sensors | 78 definitions, 69 **uninstalled** asset mappings, 33 generic acquisition options | Choose **only for a concrete investigation**, with qualified reviewer and data-quality plan |
| Fault knowledge | 57 candidate diagnostic rules with causes and recommended checks | Validate causal evidence, decision thresholds, operating context, suppressions and alternatives |
| Solutions | Proposed checks/intervention types exist in reference knowledge; **no verified outcomes** | Human review → approved action → before/after measurement → verification |
| Continuous monitoring | 1 measurement record, zero events; connectivity unproven | Real consented telemetry and ingestion, security, calibration and reliability tests |
| Machine-specific commercial claims | **NOT READY** | L5 engineering/site validation and actual customer evidence |

**Sequence:** energy/downtime customer discovery → identify machine/process and decision → use existing data → establish evidence quality → select optional instrumentation → validate machine-specific questions and human-reviewed recommendations → assess intervention and verify outcome. Pilot data must never be accepted before the separate commercial, authorization and tenant-isolation release gates.

**Long-term architecture:** Manual equipment and connected equipment share one *asset identity and investigation workflow*. New measurement adapters should attach to an asset without rewriting its historical investigations. The long-term objective is infrastructure intelligence, **not** deploying every conceivable sensor.

**Explicitly out of scope today:** Manufacturer/model-specific performance specs, thresholds, fault probability, universal sensor BOM, automated maintenance, validated savings, unreviewed database seeding or retrofits. [Machine knowledge specification](../data/machine-knowledge-spec.json) and [validation gate](../data/machine-validation-gate.json) remain authoritative.
