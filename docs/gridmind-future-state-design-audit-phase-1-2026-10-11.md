> [!IMPORTANT]
> **Status: HISTORICAL SNAPSHOT — NOT A CURRENT EXECUTION AUTHORITY (reviewed 2026-10-13).** This document is preserved for context and evidence. Its dated ratings, status claims, recommendations, and next steps may be stale; do not treat them as current instructions or proof of present readiness. Follow the [canonical Master Plan](gridmind-master-plan-2026-10-11.md), [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and current linked GitHub issues for present decisions and blockers. No historical findings below have been deleted or rewritten.

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

## Live deployment spot-check and audit limits
- Inspected server-rendered HTML from the identified READY deployment, [GridMind deployment at commit 50c57c8](https://vercel.com/vartmaansharma-blips-projects/gridmind/72GwVVgx9JvDYHhYS5XTbFVeE9LP), and cross-checked current GitHub source.
- The overview server response shows a fictional Adityapur factory, a demo badge, ₹1.68 Cr/year estimated exposure, ₹1.03 Cr/year potential saving, eight opportunities, and ₹0 verified. Large financial figures are prominent; demo/fictional context and the distinction between exposure, potential and verified value must remain unmistakable at the point of interpretation.
- Route source confirms a critical journey break: the overview can show locally generated demo findings, but the Opportunities route returns the generic empty state when the active factory is demo data. The Savings route does the same for demo data, despite the overview offering an “Open verification” path. This is source evidence for the demo-mode branch, not a completed click-flow recording.
- Independent server requests to /opportunities and /savings show the generic “No data connected yet” onboarding because client-side factory state is not present in that server request. This alone does not prove what a hydrated browser session shows; the route source explains the demo-mode branch that needs to be corrected.
- Reviewed root layout, global styles, shell/navigation, overview, factory input, energy, machines, opportunities, alerts, savings and evidence/finding components in GitHub.
- This is a source review plus server-rendered HTML spot-check, not a screenshot/pixel review, browser interaction test, accessibility audit or user study.
- No design changes have been implemented in Phase 1.
- Do not rate visual design definitively until the live interface is inspected at desktop and mobile widths.

## Phase 1 exit criteria
1. Capture and review the current rendered UI at desktop and mobile widths.
2. Tie each ranked issue to a screen/component and a specific observed defect.
3. Document the opportunity decision-object and core user journey.
4. Prototype the visual system and Reveal interaction in a testable form.
5. Keep future capabilities clearly separate from current evidenced functionality.
6. Do not begin broad visual polish ahead of result/state consistency and decision-object design.

## Next step
Conduct the rendered UI walkthrough and map ranked issues to exact screens and components. Then prototype one opportunity journey before making broad visual changes.

## Follow-up: live route response walkthrough — 2026-10-11

### What was checked
Fetched the deployed Overview, Opportunities and Savings/Verification routes directly from the current Vercel deployment:
`https://gridmind-cf3axeqfg-vartmaansharma-blips-projects.vercel.app/`

| Route | Direct response observation | Design implication | Confidence |
|---|---|---|---|
| Overview `/` | HTTP 200. Server-rendered response includes the demo factory, ₹1.68 Cr/year estimated exposure, ₹1.03 Cr/year potential savings, opportunity summaries, and ₹0 verified. | The example communicates material value, but demo/synthetic context and the distinction between exposure, potential and verified value must remain unmistakable wherever figures appear. | High for fetched HTML; not a screenshot assessment. |
| Opportunities `/opportunities` | HTTP 200. Direct response contains “No data connected yet” onboarding and asks for factory inputs; overview's demo figures are absent. | A direct route entry does not preserve the overview's visible demo context in its server response. The user needs an explicit, consistent state and a clear way to inspect the same example or understand why results are unavailable. | High for fetched HTML; client hydration may change the browser view. |
| Savings / Verification `/savings` | HTTP 200. Direct response likewise contains “No data connected yet” onboarding; overview shows an “Open verification” path and ₹0 verified. | Verification needs a state-specific explanation: no verified outcomes yet is different from no factory data connected. Do not let generic onboarding erase the user's context. | High for fetched HTML; client hydration may change the browser view. |

### Interpretation boundary
This was a direct-route HTML response check, not a live interactive browser session. I did not capture screenshots, click through hydrated client-side state, test viewport widths, or run accessibility automation. The source audit already identifies a demo-mode branch in Opportunities and Savings that returns a generic empty state; the live response check corroborates the direct-entry symptom, but it does not establish the full hydrated click-path. Mark the browser journey as **not yet verified**, not as passed or definitively broken in every session.

### Design decision
**Decision:** fix the shared result/state contract before visual polish. A demo/screening result must have an explicit provenance and stable identity as the user moves from Overview to Opportunity and Verification. If a route cannot display that result, it must say why and offer a useful next step; it must not silently imply that the factory has no data.

The UI must distinguish at minimum:
- **Demo example:** synthetic, clearly labelled; never represented as customer evidence.
- **Screening result:** provisional analysis with visible data coverage and limitations.
- **Persisted opportunity:** durable record with source, version and audit trail.
- **Insufficient evidence:** explain what is unknown and what evidence would reduce uncertainty.
- **No verified outcome:** no accepted post-intervention result exists; not equivalent to no data.
- **Verified outcome:** only when an auditable baseline, post-period, comparison method, confounders and reviewer acceptance exist.
- **Connection / request failure:** identify the failure and safe recovery path rather than reusing a no-data state.

### Phase 2 — smallest safe implementation slice
1. Trace the exact demo/screening result source on Overview and the factory/demo state consumed by Opportunities and Savings. Confirm the intended state transition before editing.
2. Define a typed route-state contract and shared value-state vocabulary; avoid a broad architecture rewrite.
3. Preserve the current demo example across navigation, or provide an explicit “Open demo example” action that consistently enters the same example state on all three routes.
4. Make Verification's empty state say “No outcomes verified yet” when that is the truth, while separately explaining whether data is connected and whether an intervention exists.
5. Keep value categories separate: exposure ≠ potential savings ≠ expected savings ≠ realized/verified savings. Label demo figures at their point of use.
6. Add regression tests for direct entry and in-app navigation across Overview → Opportunity → Verification, including demo, no factory, persisted result, insufficient evidence and request failure.
7. Verify desktop/mobile layout, keyboard navigation, focus state and reduced-motion behaviour in a real browser before closing the design phase.

### Acceptance criteria for the slice
- Same demo/example context is available after navigating from Overview to Opportunities and Verification, or a deliberate and truthful state transition is shown.
- No result silently disappears because a route reads a different source of truth.
- Direct route entry and in-app navigation have tested, documented outcomes.
- “No data connected”, “no opportunity”, “insufficient evidence” and “no verified outcome” are separate states.
- Demo data is visibly synthetic; no demo savings are claimed as customer-realized.
- Tests cover the states above and pass in CI; no production database or settings changes are needed for this UI-state correction.
- Browser observations are recorded separately from source inference.

### Scope and release guardrail
This is a UI/state-consistency slice, not authorization to claim production readiness, verified customer savings, validated product-market fit, or broad industrial platform capability. No application code or production settings were changed during this follow-up check.


## Phase 2 implementation started — 2026-10-11

A narrow implementation is in review on [PR #31](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/31), branch `fix/demo-opportunity-verification-states`.

### Changes in the draft PR
- The demo Opportunities route now intends to show the same local screening findings as Overview, explicitly labelled as synthetic screening calculations—not canonical persisted opportunities or customer evidence.
- The demo Verification route now intends to state “No outcomes verified yet,” explain that the demo has no canonical verification records, and label the included intervention as synthetic.
- The changes preserve the existing canonical query path for non-demo factories and do not create or mutate canonical records.

### Validation status
- Source changes committed to the feature branch; draft PR opened.
- CI status at time of record: typecheck/lint/test/build workflows were still running; no pass result is claimed.
- Interactive browser testing, responsive inspection and accessibility checks are still outstanding.
- The PR is deliberately a draft and must not be merged until CI and the manual acceptance path pass.


### Preview validation update — 2026-10-11

After the route-state changes on PR #31, direct HTML responses from the branch's READY Vercel preview were fetched again:
- Preview deployment: `https://gridmind-d8zbmm9n9-vartmaansharma-blips-projects.vercel.app/`
- `/`: HTTP 200; existing demo overview and ₹0 verified remain visible.
- `/opportunities`: HTTP 200; “Demo screening opportunities” and synthetic demo badge are present; “No data connected yet” is absent from the route content.
- `/savings`: HTTP 200; “No outcomes verified yet”, synthetic example intervention and ₹0 verified are present; “No data connected yet” is absent from the route content.

This confirms the intended server-rendered direct-route output on the preview. It is **not** a substitute for interactive browser navigation, client-state testing, screenshots, viewport inspection or accessibility checks.

Latest code commit at the time of this note: `e833de506fd88086015be48330d3d40488f5b5cb`. GitHub CI and GridMind Quality Gate completed successfully after correcting an initial TypeScript failure. Migration Replay initially hit a GitHub Actions release-resolution rate limit; the retry completed successfully. CI, GridMind Quality Gate and Migration Replay are all green for the reviewed code commit. The draft PR remains unmerged; no production deployment or production data mutation was performed.
