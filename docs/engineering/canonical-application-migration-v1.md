# GridMind — Phase 13.1 Canonical Application & Data-Contract Migration Map

Status: **COMPLETE — audit and migration map frozen before application migration**

Repository: `vartmaansharma-blip/gridmind-insights-ea7a9796`
Branch: `main`
Stack: TanStack Start + React 19 + Vite + Supabase/Postgres

## 1. Executive finding

The database is now materially ahead of the application.

The current application is **not yet a canonical GridMind application**. Its primary operational state is still a browser-local `EnergyStoreProvider` backed by `localStorage`, while the machine intelligence area reads the legacy Supabase model through a server function using the service-role client.

This creates two competing application truths:

1. **Energy/product workflow:** local demo/domain model
2. **Machine intelligence workflow:** legacy Supabase model

The canonical Supabase model introduced in Phase 10–12.5 is not yet the application's source of truth.

**Therefore Phase 13 must migrate the application domain layer before adding further product intelligence or UI complexity.**

---

## 2. Current application data architecture

### A. Root/provider

`src/routes/__root.tsx`
- Mounts `EnergyStoreProvider`
- Energy application state therefore begins in client memory/localStorage.
- React Query exists, but the main energy workflow does not use it for persistence.

### B. Energy domain

`src/lib/energy/store.tsx`
- `Factory[]`
- `activeId`
- localStorage key `gridmind:v1`
- factory creation/update/delete is local
- opportunity status is local
- demo factory is injected by default

`src/lib/energy/types.ts`
- `Factory`
- `MonthRecord`
- `Equipment`
- `Intervention`
- `Opportunity`
- `Alert`

These are useful UI/domain types but are **not the canonical persistence model**.

### C. Energy analysis

`src/lib/energy/pipeline.ts`
- deterministic monthly data validation
- quality states
- fail-closed analysis threshold

`src/lib/energy/analysis.ts`
- calculates demand, power factor, SEC, equipment estimates and alerts
- generates opportunities directly from local `Factory`

`src/lib/energy/intelligence.ts`
- decorates local opportunities with evidence/context/uncertainty language
- does not persist evidence bundles, causal hypotheses, opportunities or decisions to canonical tables

These analytical rules should survive the migration, but their outputs must become canonical domain objects.

### D. Machine intelligence

`src/lib/machines.functions.ts`
- reads:
  - `factory_assets`
  - `machine_types`
  - `asset_integration_profiles`
  - `asset_sensor_mappings`
  - `retrofit_assessments`
  - `asset_calibration_profiles`
  - `intelligence_events`
  - `diagnostic_rules`
- uses `supabaseAdmin` / service-role access

This is explicitly a **legacy machine intelligence read path** and must be migrated to authenticated, factory-scoped canonical reads.

### E. Demo data

`src/lib/energy/demo-data.ts`
- fictional Adityapur factory
- synthetic monthly data
- synthetic equipment
- synthetic intervention

This must remain available as a clearly labelled demo fixture, but it must never be mistaken for customer evidence.

---

## 3. Route-by-route migration map

| Current route | Current source | Canonical target | Migration action |
|---|---|---|---|
| `/` | local EnergyStore + local analysis | observations → expectations → deviations → opportunities → decisions | migrate read model first |
| `/factory` | localStorage | organizations/factories/assets/data_sources/observations | replace persistence |
| `/opportunities` | local analysis + local opportunity status | opportunities + evidence_bundles + causal_hypotheses + decisions | canonical read/write |
| `/machines` | legacy Supabase server function | factory_assets + canonical physical/data-source model + knowledge layer | authenticated factory-scoped read |
| `/machines/$id` | legacy machine tables | canonical asset + data sources + observations + evidence | progressively migrate |
| `/savings` | local interventions + simplified verification | interventions → verification_plans → verification_runs → verified_outcomes | canonical M&V |
| `/energy` | local analysis | observations/context/baselines/expectations/deviations | canonical analytical read model |
| `/alerts` | local analysis alerts | deviations + evidence | canonical later |
| app shell | EnergyStore context | authenticated organization/factory context | canonical factory context |

---

## 4. Legacy → canonical object mapping

### Factory

Current:
`Factory`

Canonical:
- `organizations`
- `organization_members`
- `factories`
- `factory_members`

Rule:
> A browser-generated factory ID must no longer be the identity of a production factory.

---

### Monthly electricity record

Current:
`MonthRecord`

Canonical:
- `data_sources`
- `data_source_mappings`
- `observations`

A monthly record is not itself a permanent physical entity.

Its components become observations with:
- subject
- metric
- value
- unit
- timestamp/window
- source
- quality
- provenance
- factory

---

### Equipment

Current:
`Equipment`

Canonical:
- `factory_assets`
- `machine_types`
- `physical_relationships`
- relevant data-source mappings

Nameplate information belongs to the physical asset.
Measured power/runtime belongs to observations.

---

### Operating context

Current:
partially embedded in analysis strings and monthly records.

Canonical:
- `operating_contexts`
- eventually `operating_regimes`

Production, shift, product, operating state, environment and configuration must not remain hidden inside free-text explanations.

---

### Baseline

Current:
`analysis.reference` / `baselineSec`

Canonical:
- `performance_baselines`
- `performance_expectations`

Important distinction:
- baseline = model/method
- expectation = expected value for a specific context/time

---

### Deviation

Current:
local opportunity/alert calculations.

Canonical:
- `performance_deviations`

An anomaly or threshold event must not automatically become an opportunity.

---

### Evidence

Current:
arrays of strings such as:
- `evidence`
- `possibleExplanations`
- `missingEvidence`

Canonical:
- `evidence_bundles`
- `evidence_links`
- source observations
- derived facts
- context
- contradicting evidence
- assumptions

The current UI language is useful but must be generated from structured evidence.

---

### Causal reasoning

Current:
`possibleExplanations` strings.

Canonical:
- `causal_hypotheses`
- `causal_tests`

A possible explanation must remain a hypothesis unless evidence supports it.

---

### Opportunity

Current:
local `Opportunity`

Canonical:
- `opportunities`

The canonical object becomes the product's economic decision object.

Current fields such as:
- `impactAnnual`
- `savingAnnual`
- `investment`
- `paybackMonths`

must become explicitly typed economic quantities with assumptions, methodology and uncertainty.

---

### Opportunity status

Current:
`Factory.opportunityStatus`

Canonical:
`opportunities.status`

Status must not live only in localStorage.

---

### Decision

Current:
not a persistent object.

Canonical:
- `decisions`

Every consequential customer decision should eventually have:
- selected/rejected opportunities
- constraints
- expected value
- assumptions
- decision maker
- approval
- implementation sequence
- review date

---

### Intervention

Current:
local `Intervention`

Canonical:
- transitional `asset_interventions`

The current table has now been hardened to function as the canonical V1 intervention object while retaining compatibility with the legacy machine model.

---

### Verification

Current:
`verifyIntervention()` in `analysis.ts`

Canonical:
- `verification_plans`
- `verification_runs`
- `verified_outcomes`

The existing deterministic verification calculation should be migrated as an analytical method, not copied as an authoritative verified result.

---

### Learning

Current:
none persisted.

Canonical:
- `learning_events`

Do not implement automated learning promotion until verified outcomes exist.

---

## 5. Critical blockers discovered

### P0 — Energy application has no production persistence

`EnergyStoreProvider` stores the application state in localStorage.

This is the largest application architecture mismatch.

**Required resolution:**
```
UI
 ↓
GridMind domain/data layer
 ↓
authenticated Supabase
 ↓
canonical tables
```

---

### P0 — Service-role machine read path bypasses user-level authorization

`src/lib/machines.functions.ts` imports `supabaseAdmin`.

The service-role client bypasses RLS. Therefore this function must not remain the production path for factory-scoped machine data.

**Required resolution:**
- derive authenticated user
- resolve organization/factory membership
- query with RLS-aware client or enforce equivalent server authorization
- never expose arbitrary factory data through an admin-backed client function

---

### P0 — Generated Supabase types are stale

`src/integrations/supabase/types.ts` still contains the older schema shape and does not represent the full canonical model introduced in the recent migrations.

**Required resolution:**
Regenerate types from the live canonical schema before implementing canonical application queries.

Do not manually patch generated types.

---

### P1 — Domain model is too energy-specific

The application currently treats the factory as:
- monthly electricity
- production
- equipment
- energy opportunities

That is appropriate for the initial wedge but not for GridMind's canonical domain.

The new domain layer should use:
```
Factory
Asset
DataSource
Observation
Context
Baseline
Expectation
Deviation
Evidence
Opportunity
Decision
Intervention
Verification
```

Energy becomes the first analytical capability rather than the application's identity.

---

### P1 — Analysis outputs are not persisted as evidence

The current analysis can calculate a legitimate candidate opportunity, but its evidence chain disappears when the local state disappears.

Canonical migration must preserve:
```
raw/source data
 → observation
 → derived fact
 → baseline/expectation
 → deviation
 → evidence bundle
 → opportunity
```

---

### P1 — Local opportunity status is not authoritative

`setOppStatus()` only changes local application state.

It must become a canonical opportunity/decision mutation.

---

### P1 — Verification currently risks being interpreted too strongly

The existing code correctly uses `verified_candidate`, but the UI/application contract must ensure:

```
measured improvement
≠
verified economic value
```

Only `verified_outcomes` with defensible attribution can become verified value.

---

## 6. What should NOT be migrated yet

Do not prematurely build:
- autonomous agents
- MCP execution
- PLC writes
- autonomous control
- simulation platform
- full industrial knowledge marketplace
- generalized multi-industry optimization
- advanced learning promotion

Those belong after the canonical V1 workflow proves itself.

---

## 7. Phase 13 execution order

### 13.1 — Audit + migration map
**This document. COMPLETE.**

### 13.2 — Canonical generated types + domain contracts
- regenerate Supabase types
- define typed canonical domain objects
- define repository interfaces
- define mapping/normalization functions
- no UI rewrite yet

### 13.3 — Authenticated canonical data layer
- organization/factory resolution
- RLS-safe reads
- canonical writes
- replace service-role machine read path

### 13.4 — Factory + observation migration
- replace localStorage factory persistence
- import/CSV data becomes observations
- preserve source/provenance/quality
- demo mode remains isolated

### 13.5 — Canonical intelligence pipeline
```
observations
 → context
 → baseline
 → expectation
 → deviation
 → evidence
 → opportunity
```

### 13.6 — Decision/intervention/verification migration
```
opportunity
 → decision
 → intervention
 → verification plan
 → verification run
 → verified outcome
```

### 13.7 — Legacy compatibility and retirement
Only after application usage is migrated and validated:
- mark legacy paths deprecated
- stop new writes
- retain historical compatibility
- migrate required historical data
- remove legacy paths only after a verified dependency audit

---

## 8. Canonical application architecture after migration

```
TanStack UI
     ↓
GridMind Domain Layer
     ↓
Canonical Repositories
     ↓
Supabase / Postgres
     ↓
RLS + tenant integrity

Analytical engine:
Observations
     ↓
Context
     ↓
Baseline
     ↓
Expectation
     ↓
Deviation
     ↓
Evidence
     ↓
Opportunity
     ↓
Decision
     ↓
Intervention
     ↓
Verification
     ↓
Verified outcome
```

The UI should never calculate its own competing version of economic truth once a canonical analytical object exists.

---

## 9. Definition of done for Phase 13

Phase 13 is complete only when:

- no production workflow depends on localStorage for authoritative data
- no production factory-scoped read uses unrestricted service-role access
- generated Supabase types match the live schema
- canonical domain contracts exist
- factory context is organization-aware
- observations are the canonical measurement object
- opportunities persist in `opportunities`
- decisions persist in `decisions`
- interventions persist canonically
- verification persists in canonical verification objects
- every economic claim has evidence/provenance
- demo data is visibly and structurally isolated
- legacy tables receive no new production writes
- the end-to-end workflow works:

```
Factory data
 → Observation
 → Context
 → Expected performance
 → Deviation
 → Evidence
 → Opportunity
 → Decision
 → Intervention
 → Verification
 → Verified economic value
```

---

## 10. Architectural decision

**Canonical Supabase schema is the system of record.**

The current React energy types become presentation/domain adapters.

The old localStorage model is transitional and must not receive further feature development.

The legacy machine tables are transitional compatibility data, not the long-term GridMind ontology.

The application should be migrated incrementally, with the canonical model becoming authoritative one workflow at a time.
