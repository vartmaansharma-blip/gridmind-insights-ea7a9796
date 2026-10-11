# GridMind Phase 1 — Future-State Design Audit
**Date:** 2026-10-11
**Status:** Source-based desk audit complete. Rendered UI review and usability validation remain outstanding.

## Executive verdict
GridMind’s design problem is bigger than styling. The current application is expressed as a factory-energy dashboard, while the long-term ambition is an industrial decision-and-value-realization system: contextualize operations, qualify evidence, surface economically meaningful opportunities, support a human decision, coordinate an intervention, and verify the outcome.

The interface must make that future legible without pretending future capabilities already exist. It should feel like a serious operational decision instrument—not a generic SaaS dashboard, a neon AI demo, or a collection of disconnected modules.

## First-principles design thesis
The user is not primarily trying to browse charts. They need to know: what deserves attention; what the economic exposure is and how it was calculated; what is observed, estimated, inferred or unknown; what evidence could change the conclusion; what action is safe and actionable; who owns the next step; and whether the intervention worked.

Design around the **decision object and its evidence trail**, not around data-source type or department. Energy, machines, maintenance, quality and production should be lenses into the same operating reality rather than permanently siloed experiences.

## Prior decisions to preserve
- Long-term ambition is industrial decision intelligence and verified value realization, not only energy monitoring.
- The first commercial workflow remains unvalidated; do not visually imply a universal connected platform already exists.
- Opportunities are the primary intelligence object; machines/assets and source records provide supporting evidence.
- Evidence hierarchy: source measurements → calculations → inference → explanation. Weak evidence must fail closed to unknown.
- Keep exposure, potential, expected, implemented and realized/verified value distinct.
- Consequential decisions remain human-authorized; the initial experience is not autonomous plant control.
- Earlier design discussions proposed the Reveal interaction: Context Snap, Layer Cut and Evidence Fold. Evaluate these as one coherent interaction grammar.
- Motion must reveal relationships or state changes, not decorate the interface. Respect reduced-motion preferences.

## Findings from current source review
### P0 — Product mental model is split
Root metadata describes “Factory Energy Intelligence” and energy-bill savings, while the shell brand descriptor says “Infrastructure intelligence.” The overview is dominated by monthly electricity costs and energy indicators. The code communicates both a narrow energy tool and a broader infrastructure platform.
**Implication:** label the present workflow honestly as a bounded energy-analysis workspace, nested in a future-capable industrial decision system. Do not market future breadth as current capability.

### P0 — Primary intelligence object is inconsistent across screens
The overview builds top findings from local energy-analysis calculations. The /opportunities page instead queries persisted canonical opportunities and excludes demo/screening calculations. The Run analysis action navigates to /opportunities after reporting local-analysis counts, where those same findings may not appear.
**Implication:** unify the result/state model. Make demo, screening, persisted opportunity and verified outcome visibly distinct. Results must not appear to disappear or silently change source of truth.

### P0 — Onboarding demands substantial input before first value
The empty state requests factory details, 12 months of bills, production, operating hours and equipment data, then promises a result in about 10 minutes.
**Implication:** progressive onboarding: inspect a clearly labelled synthetic example, understand the minimum inputs, add a small authorized sample, inspect data quality, and expand only when justified. Never imply weak data supports a strong conclusion.

### P1 — Pages are clearer than the end-to-end decision journey
Navigation separates Overview, Factory/Data, Energy, Machines, Opportunities, Alerts and Savings. Users must infer how a signal becomes an investigation, decision, intervention and verified outcome.
**Implication:** use a context-aware opportunity journey—evidence → investigation → decision → action → verification—with domain pages as supporting lenses.

### P1 — Opportunity metrics lack a complete decision narrative
The canonical opportunity list shows financial measures, payback, priority and multiple confidence values, but not a complete compact account of assumptions, supporting/counter-evidence, missing evidence, accountable owner and next decision.
**Implication:** lead with the decision summary, impact range and value-state; progressively reveal evidence lineage, assumptions, alternative explanations, uncertainty, human-reviewed action and outcome tracking. Avoid false precision and confidence theatre.

### P1 — Evidence labels are necessary but insufficient
Observed, estimated, hypothesis, recommended, verified and unknown are useful semantics, but badges/tooltips alone do not create an industrial trust layer.
**Implication:** show provenance, time period, source quality, calculation method, uncertainty and reviewer state where decisions are made. Verified must mean an auditable verification record, not merely a green badge.

### P1 — Visual tokens are coherent but not distinctive enough by themselves
The current source uses Manrope, Space Grotesk, IBM Plex Mono, warm neutral surfaces, dark green navigation, lime accents, rounded panels and a subtle rise animation. This is a reasonable foundation, but a palette and card system do not create a unique product identity.
**Implication:** develop a spatial grammar connecting industrial context, evidence lineage, economic consequence and intervention state. Avoid generic dark/neon AI styling and avoid giving every panel equal visual weight.

### P1 — Reveal is not yet an end-to-end interaction model
The reviewed route components do not show Context Snap, Layer Cut and Evidence Fold integrated into a single journey.
**Implication:** prototype one workflow: Context Snap establishes operating context and baseline; Layer Cut moves from economic signal to evidence and alternatives; Evidence Fold progressively reveals provenance, calculations, assumptions, uncertainty and missing inputs. The journey must remain accessible without animation.

### P2 — Role and operational scale are not central to the experience
The current page model is factory-centric and does not visibly define how operators, reliability engineers, plant managers, finance leaders and multi-site executives use the same underlying truth.
**Implication:** create one shared decision object with role-relevant summaries rather than separate inconsistent truths. Multi-site breadth is a future architecture concern, not a reason to simulate unvalidated features now.

### P2 — States and recovery paths need a stronger visual contract
Loading, no data, demo data, insufficient evidence, failed analysis, persisted result, implemented action and verified outcome must not look interchangeable. Some demo/no-active-factory cases use the same generic empty state.
**Implication:** distinguish not connected, not run, insufficient evidence, no persisted records, loading, failed request, demo, implemented and verified states—with clear recovery actions.

## Future-state information architecture (proposal, not a build-everything mandate)
1. **Decision overview:** material exposures, priority opportunities, evidence/data health, decisions awaiting a person and outcomes awaiting verification.
2. **Opportunity workspace:** one durable decision object from detection through investigation, action and verification.
3. **Operational context:** site, process, assets, production state, shifts, constraints and comparable periods.
4. **Evidence room:** source records, mappings, calculations, assumptions, uncertainty, provenance and audit trail.
5. **Intervention and verification:** owner, approved action, dependencies, cost, timing, baseline, post-period, confounders and outcome state.
6. **Data and integrations:** source freshness, quality, mapping, permissions, gaps and repair steps.
7. **Portfolio view (future):** cross-site and cross-workflow prioritization only when data and validated user need justify it.

## Visual direction: Clarity Engineered
- Restrained industrial palette; colour conveys semantic meaning rather than decoration.
- Clear hierarchy: decision and impact first, evidence and caveats next, metadata last.
- Monospaced numerals selectively for measured values, ranges, units and trace identifiers.
- One primary action per decision state; secondary actions stay quiet.
- Every chart answers a question and states its baseline/comparison.
- Use diagrams when they reduce reasoning effort; avoid dashboard wallpaper.
- Motion explains a transition, reveals an evidence layer or confirms a saved action; no perpetual pulsing.
- Keyboard access, visible focus, semantic labels, sufficient contrast, non-colour cues and reduced-motion support are requirements.
- Responsive layouts preserve the decision hierarchy; key decisions cannot disappear off-screen.

## Ranked Phase 1 backlog
| Rank | Work item | Acceptance evidence |
|---|---|---|
| 1 | Unify overview/opportunities result states | Same run identity; clear demo vs canonical state; no silent count mismatch |
| 2 | Define opportunity decision-object anatomy | One journey shows value state, evidence, uncertainty, next action and outcome |
| 3 | Redesign onboarding and empty states | User can explore demo, understand minimum inputs and see evidence gaps truthfully |
| 4 | Align product framing/navigation with future thesis | Present workflow is clear without implying unbuilt breadth |
| 5 | Prototype Reveal interaction grammar | Context Snap → Layer Cut → Evidence Fold shown in one accessible workflow |
| 6 | Document design tokens and component rules | Type, spacing, surfaces, status styles and responsive rules defined |
| 7 | Define system states and recovery | Demo, stale, error, unknown, persisted, implemented and verified states differentiated |
| 8 | Validate responsive/accessibility behaviour | Keyboard, reduced-motion and mobile checks pass |
| 9 | Conduct rendered UI and task walkthrough | Screens captured at key widths; representative tasks observed |

## Audit limits
- Reviewed root layout, global styles, shell/navigation, overview, factory input, energy, machines, opportunities, alerts, savings and evidence/finding components in GitHub.
- This is a source-based product/design audit, not a rendered screenshot review, browser interaction test, accessibility audit or user study.
- No design changes were implemented in Phase 1.
- Do not rate the visual design definitively until the live interface is inspected at desktop and mobile widths.

## Phase 1 exit criteria
1. Capture and review the current rendered UI at desktop and mobile widths.
2. Tie each ranked issue to a screen/component and a specific observed defect.
3. Document the opportunity decision-object and core user journey.
4. Prototype the visual system and Reveal interaction in a testable form.
5. Keep future capabilities clearly separate from current evidenced functionality.
6. Do not begin broad visual polish ahead of result/state consistency and decision-object design.

## Next step
Conduct the rendered UI walkthrough and map ranked issues to exact screens and components. Then prototype one opportunity journey before making broad visual changes.