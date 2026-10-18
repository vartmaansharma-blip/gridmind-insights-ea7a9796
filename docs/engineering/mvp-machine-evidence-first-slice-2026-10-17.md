# GridMind MVP — Machine evidence readiness (first incremental product slice)

**Status:** Feature branch, unvalidated until checks pass. **Date:** 2026-10-17.  
**Authority:** [GridMind Master Plan](../gridmind-master-plan-2026-10-11.md) and [MVP Implementation Handoff](../product/gridmind-mvp-lovable-handoff.md). This is a delivery checkpoint, not a second strategy or authorization to handle private factory files.

## Why this slice now?
GridMind already has an integrated public/customer/team synthetic workflow (case intake → evidence responses → independent simulated review → restricted released brief → customer decision). The old factory dashboard and the separate authoritative, deterministic **asset-level** energy-analysis function also exist. However, the application lacks a usable way for a staff member to understand **why a given conventional or connected machine is not ready for analysis**. The live environment has no canonical asset observations or persisted factory analysis runs. Making the next evidence gap visible is more useful than building another generic chart or adding more unvalidated diagnostic rules.

## Implemented in this branch
1. `src/lib/gridmind/machine-evidence-readiness.ts`: read-only readiness evaluator. Uses only factory-and-asset matched canonical observations, explicit role metadata or the exact authoritative canonical role names, non-estimated positive numeric readings, `valid` quality and explicit bounded measurement periods. Treats duplicate roles within a period as insufficient. Tracks source IDs but doesn't assume source mappings authorize installation or trust. A potential reference needs **at least three historical candidates plus one current candidate**; four periods do **not** establish same operating state, comparable product, calibrated meters, safety, cause or valid finances.
2. `src/routes/machines.$id.tsx`: adds **Evidence readiness** next to the existing machine passport, source mapping, observations and server-run button. Shows counts, source provenance and next actions; links to the team investigation list. Does not automatically create a case, import data, grant access or activate any machine-specific diagnostics. Adds a precise disclaimer on server verification: reproducibility is not proof of correct real-world measurements.
3. `src/lib/gridmind/machine-evidence-readiness.test.ts`: tests zero records, complete candidate periods, duplicates/invalid periods, estimated/unverified values, factory-vs-asset meter scope and explicit roles.

**Do not misread basic coverage as authorization or machine intelligence.** The server is the authority and may still return `insufficient_evidence`. The legacy monthly factory electricity model must never be silently passed to the asset-only engine.

## MVP build sequence (no speculative parallel platforms)
1. **Machine evidence readiness (this PR):** expose scope/missing evidence based on actual asset records.  
   Done when tests pass and the actual asset page displays a truthful empty-data state and a conservative populated-data state.
2. **Permissioned real intake design in isolated environment:** canonical source identity/asset scope, source custody/retention, manual records and CSV mapping, duplicate/version correction, quality review, tenant isolation, file privacy/security checks. Keep behind Tier 2 authorization until customer rights, independent reviewer and delivery boundary are established. Owner data cannot be uploaded just because a UI exists.
3. **One authoritative C4 energy investigation:** verify same-scope energy/output/hours, operating-state and product context, comparable reference, defensible tariff/economic input, stored server-owned snapshot and idempotent replay. Build refusal messages as first-class results.
4. **Connect existing investigation case:** deep-link/relate approved asset analysis evidence to the *same* case/review/brief process, with explicitly scoped access. Existing request/evidence/reviewer/publish/decision flows remain canonical; no forked engine. C1 remains separate downtime chronology until a justified method bridge exists.
5. **Human-reviewed outcome/learning:** specialist review, approved intervention by qualified personnel, comparable pre/post measurements, traceable verification and case outcome. No predictive maintenance or confirmed savings until validated.
6. **Acceptance & release:** secure auth, owner/analyst/reviewer/customer isolation; no synthetic→real promotion; full exact-SHA CI and migration replay; actual permitted case only after commercial Tier 1 and Tier 2 gates. A bounded first paid investigation would require a real buyer and qualified delivery capacity.

## Definition of MVP
One buyer-owned question flows end to end: authorized asset/process scope → permissioned evidence → quality/conflict checks → deterministic method → explanation of established and unknown facts → qualified reviewer → source-linked customer decision brief → customer decision → recorded follow-up; all persisted, safely scoped and recoverable after refresh. A verified economic outcome is a separate, higher gate, not automatically implied by a released brief.

## Decisions preserved
- **Scooter POC is parked, NOT deleted**; its reference catalogue remains in Supabase and [draft PR #120](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/120).
- Machine-knowledge catalog remains candidates in [draft PR #118](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/118).
- [Industrial pilot execution issue #121](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/121) follows the **MVP data and review gates**, rather than preceding them.
- No live Supabase data change, no sensor installation, no real customer data collected by this code change.

## Checkpoints / blockers
- Browser customer sign-in persistence must be demonstrated for the exact production origin.
- Cases remain synthetic-only: `origin: synthetic`, simulated independent reviewer; production customer-data workflow is not enabled.
- Asset-specific operational readings absent in live canonical `observations` as of audit; no real machine intelligence result.
- Machine sensors and OEM models remain unverified. A missing source or instrument does not justify buying hardware unless a scoped question requires it.

**Go/no-go for this PR:** exact head build/tests and isolated functional smoke test for both zero-data and complete synthetic asset-readiness paths; no change to operational database permissions or public claims.
