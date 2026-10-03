# GridMind product overhaul

## Goal
Rework the existing MVP into one coherent industrial-intelligence product while preserving the working energy engine, local factory workflow, Lovable Cloud tables, and eight synthetic machine assets.

## Product experience
- Introduce a distinctive GridMind identity, restrained enterprise visual system, and consistent desktop/mobile navigation.
- Reframe navigation around the operating workflow: Overview, Factory Data, Energy, Machines, Opportunities, Alerts, Savings.
- Add a persistent factory context, data-quality state, analysis status/timestamp, and clear synthetic/demo labeling.
- Rebuild the overview around Money at Risk, biggest opportunities, evidence, recommended actions, energy/cost performance, demand/capacity, reliability, and savings verification.
- Make empty states guide users through factory setup, data completeness, and analysis without implying live connectivity.

## Intelligence model
- Extend each opportunity and alert presentation with evidence status, evidence, estimated rupee impact, confidence, recommended action, and data needed.
- Preserve transparent deterministic calculations and explicitly separate observations, estimates, hypotheses, recommendations, and verified outcomes.
- Treat low-resolution monthly data as indicators only; avoid machine-failure claims without suitable measurements.
- Keep the data hierarchy visible: Factory → System → Asset → Sensor → Measurement → Event/Finding → Action → Outcome.

## Legacy machine layer
- Upgrade the machine register and passport around the existing eight database assets.
- Present Digital/API, Electrical Retrofit, Physical Sensor Retrofit, Gateway, Manual/Assisted, and Indirect Inference as honest acquisition modes—not claimed connections.
- Organize each passport into identity, integration, measurement mapping, retrofit economics, 30-day calibration, fingerprint readiness, diagnostics, evidence, and next action.
- Show required/optional metrics, source, sensor type, units, installation state, diagnostic value, coverage, calibration, and diagnostic readiness.
- Present retrofit decisions using instrumentation cost, opportunity, downtime exposure, criticality, diagnostic value, payback, and decision.

## Savings and intervention workflow
- Recast savings as Baseline → Intervention → Post-intervention → Production normalization → Verified outcome.
- Visually separate estimated potential from verified realized savings and keep demo calculations clearly labeled.

## Technical implementation
- Use existing TanStack routes, components, frontend analysis/store, and Lovable Cloud machine tables; no new hardware/API integration.
- Fix current machine-route safety/build issues, add any small shared presentation components required, and keep all page metadata complete.
- Update shared tokens and shell first, then overview and intelligence cards, then machine views, then remaining screens for consistency.
- Verify the preview at desktop and mobile sizes, all routes, interactions, runtime console, and the latest build signal.

## Assumptions
- “Systems” is represented as a plant system grouping and workflow context using current factory/equipment/asset data; no new database schema is required.
- Existing zero-valued retrofit/calibration records remain “needs data” rather than receiving invented measurements or costs.
- The eight machine records remain synthetic demo assets and no UI state will claim a live machine connection.
