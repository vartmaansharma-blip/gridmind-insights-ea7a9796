# GridMind POC-01 — Scooter reference catalogue and safe data pipeline

**Status:** Reference design only; no scooter instrumentation, no live readings, no field test and no diagnosed fault.  
**Version:** 1.0.0 · **Business context:** Prove a reusable asset/measurement/evidence pipeline, **not** a scooter-maintenance product or a manufacturing customer offer.

## What has been loaded in source code
Source of truth: [scooter-stationary-v1.json](../data/poc/scooter-stationary-v1.json)

- **18 component archetypes**, including common chassis/steering/wheels/brakes/suspension/transmission/lighting, **petrol-only** engine/fuel/exhaust, and **electric-only** traction motor/battery/controller/charging. No actual scooter manufacturer/model/serial is presumed.
- **12 measurement candidates**, all `not_installed`, all `candidate_not_tested`. **2** stage-0 smartphone channels, **5** stage-1 existing/manual record channels, **5** stage-2 independently reviewed measurement candidates. See the JSON for exact scope and what each candidate **cannot** demonstrate.
- **0** physical sensors installed, **0** measured scooter sessions, **0** machine-specific diagnoses and no approved interventions.

## Safe, low-cost experimental process

**Phase 0 — Prove software without instrumenting the vehicle (first task).** Place a smartphone on a normal stable table **away from the scooter** and, on a compatible mobile browser, collect a short, permissioned sample from the phone's built-in accelerometer and gyroscope. Alternatively use explicitly synthetic demonstration samples. Record the sensor's identity, unit, measurement time, device timebase, sample count, status and software version. This is **phone movement**, not scooter vibration. No scooter needs to be started, ridden, parked for testing, wired, opened or modified. No device mounted while riding.

**Phase 1 — Register the actual scooter as an asset only after the owner's consent.** Confirm **petrol or electric** and its exact make/model from owner-provided documentation (no guess). Optional previously existing odometer/service observations can supply general context. No photos containing registration plates, precise location, raw recordings or personal identifiers. Keep test data in an isolated user-authorized dataset, **not** `public.factory_assets` or the industrial machine library. The current PR **does not** create a user-specific scooter asset or an observation-upload API.

**Phase 2 — Only if useful, engineer-reviewed real measurements.** A qualified professional may consider a stationary, manufacturer-compatible, non-invasive plan. The candidate measurements (vibration, temperature, acoustic feature, and—in electric variants—electrical power) must be selected according to operating context, calibration, legal requirements, safety and cost. **This release does not authorize installation or use**, and no one should wire into a battery, fuel system, brakes, rotating parts, drive controller, ignition or vehicle harness to run this POC.

**Phase 3 — Evidence chain and interpretation.** `registered asset identity → component → measurement/source → time/unit/quality checks → operating context → evidence status → human-reviewed observation`. Suppress misleading results if timestamps, calibration, context or sample quality are inadequate. Compare repeatable measurements only after the source actually measures the scooter; no current fault predictions or safety conclusions. Demonstrate traceable review and reproducibility before applying to a conventional factory machine.

## Sensor and component prioritization

| Priority | Data | Source | Can prove | Cannot prove |
| --- | --- | --- | --- | --- |
| **Now** | Phone acceleration and angular rate | Existing phone on a table / controlled synthetic fixture | Safe timestamped multichannel ingestion | Anything about scooter condition |
| **Next** | Existing odometer/service/visual logs | Owner-provided records | Source provenance and asset-context tracking | Current component faults |
| **Future: qualified review** | External vibration / temperature / acoustic measurements | Model-appropriate instruments evaluated by professionals | Additional stationary observations with a documented source | An identified failure without controlled evidence |
| **Only electric and separately approved** | Existing charge energy / proposed electrical power | Existing attributable meter record / specialist | Energy accounting in defined scope | Battery safety or motor diagnosis |
| **Only petrol and separately approved** | Existing fuel-use record / proposed thermal measurement | Existing record / specialist | Contextual fuel or surface temperature evidence | Engine condition without a validated reference |

**Recommended MVP:** use only the existing phone's accelerometer and gyroscope for the first data-pipeline test; do **not** buy a sensor kit at this stage.

## Database boundary

The committed versioned migration [scooter POC reference catalogue](../supabase/migrations/20261017060000_scooter_poc_reference_catalogue.sql) introduces three read-only tables:

- `public.poc_asset_archetypes`: one generic, **unvalidated** scooter reference. Variant=unknown; make/model=null; no actual vehicle asset.
- `public.poc_asset_components`: 18 generic parts with variant applicability.
- `public.poc_measurement_candidates`: 12 candidate acquisition options, each linked to a part with stage and evidence limitations.

All three tables use **RLS**, allow **SELECT to authenticated only**, no public/anonymous read and no authenticated writes. They are **not** linked to factory/customer operational tables, have no upload interface, and cannot be used to authorize hardware work. Seed/reference catalogue content is nonpersonal. Before any live observation system, create an explicitly owner-scoped measurement session store and test RLS/cross-tenant denial, consent and deletion.

**Verification:** `bun run poc:scooter:check` validates source manifest assumptions and the migration includes [SQL acceptance checks](../supabase/tests/scooter-poc-reference-contract.sql) for row counts, no installed sensors, stage-0 isolation, privileges and RLS; the clean migration replay workflow executes those checks.

## POC success gates

1. No scooter modifications, attachments, riding test, or risky system access.
2. 18 components + 12 planned methods stored with explicit applicability/status; source = database version and JSON manifest.
3. Software pipeline can ingest at least two **independently sourced smartphone** channels with timestamps and unit identity; no false scooter provenance.
4. Bad timestamps, duplicate/unusable samples and unavailable permissions are handled clearly.
5. Repeated, comparable observations are flagged for **review**, never automatically diagnosed.
6. A separate, qualified site test plus independent review is mandatory before any physical instrumented scooter evidence is used.

## Decisions and blockers

**Decision:** This POC is a **separate sandbox asset class**. Never insert a scooter into universal `machine_types` or a fictional factory and never label uninstalled candidates as actual sensors.

**Blocking clarification for any scooter-specific plan:** Is the actual scooter **petrol or electric**, and what exact manufacturer/model is it? Until confirmed, both component alternatives remain conditional.

**Not delivered by this reference-data release:** a sensor-data acquisition app, real-time dashboard, physical prototype, actual scooter registration, customer data ingestion or validated fault detection. Do not claim POC success solely because the catalogue was seeded.
