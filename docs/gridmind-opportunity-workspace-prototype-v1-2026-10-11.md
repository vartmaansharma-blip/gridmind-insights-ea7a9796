# GridMind Opportunity Workspace — Prototype Specification v1

**Date:** 2026-10-11  
**Status:** Design specification; not yet implemented or user-tested  
**Parent audit:** [Future-State Design Audit — Phase 1](gridmind-future-state-design-audit-phase-1-2026-10-11.md)  
**Related work:** [PR #31 — demo opportunity and verification states](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/31)

## 1. Design objective

Design one durable decision workspace that takes an industrial signal through context, evidence, decision, intervention and verification. It must feel credible to a plant engineer and legible to a finance leader without turning uncertain engineering estimates into guaranteed savings.

The product is not a collection of charts. Its primary object is an **opportunity with an evidence trail and an explicit value state**.

### Core user job

> Help me decide whether this issue is material, whether the evidence is strong enough to act, what would change my mind, who needs to do what next, and how we will prove the result.

### Design principles

1. **Context before conclusion.** Show the factory/process, comparison period and data coverage before interpreting a number.
2. **Economics with provenance.** Every value has a state, unit, time horizon, method and supporting inputs.
3. **Uncertainty is useful information.** Missing evidence and plausible alternative explanations must be visible, not hidden in tooltips.
4. **One object, multiple lenses.** Operations, engineering and finance can read the same finding with different emphasis, never different underlying facts.
5. **Human-authorized action.** The product may organize evidence and propose next steps; it must not imply autonomous plant control.
6. **No decorative intelligence.** Motion, color and visual hierarchy must explain a relationship, state change or decision.

## 2. Core workspace layout

### Desktop: three-zone decision surface

**A. Context rail (about 20% width)**
- Site and process identity.
- Data window and freshness.
- Production/operating context known for the comparison.
- Evidence coverage summary: measured, calculated, inferred, missing.
- Links to source records and machine/process pages.

**B. Evidence and economics canvas (about 55% width)**
- Opportunity title phrased as an observable condition, not an unsupported root cause.
- One-sentence decision summary.
- Economic exposure and potential saving shown as distinct values.
- Comparison/baseline visual with units, dates, and the relevant production normalization.
- Evidence chain: observation → calculation → interpretation → hypothesis.
- Competing explanations and what would distinguish them.
- Expandable calculation and provenance detail.

**C. Decision panel (about 25% width)**
- Current lifecycle state.
- Evidence sufficiency and blocking gaps.
- Recommended next step, explicitly labelled as a recommendation.
- Owner and due date only if those fields exist and are persisted.
- Decision actions appropriate to the current state.
- Verification plan summary once an intervention is recorded.

Do not force every detail into a card. Use a clear reading order and strong section hierarchy; keep secondary metadata available on demand.

### Mobile: one ordered column

1. Opportunity title and state.
2. Economic summary with value definitions.
3. Context and data-coverage summary.
4. Evidence chain and uncertainty.
5. Next action.
6. Provenance and calculations.
7. Lifecycle history.

The decision action may be sticky only if it does not cover evidence, focus targets, or screen-reader content. No horizontal three-column layout on mobile. Long evidence tables should become labelled stacked rows rather than an unreadable compressed grid.

## 3. The Reveal interaction grammar

These are three coordinated interactions, not three separate visual effects.

### 3.1 Context Snap — establish the frame

**Purpose:** stop users from interpreting a number without knowing the period, operating conditions and baseline.

Default visible content:
- Site/process and relevant asset scope.
- Current period vs comparison period.
- Production and operating-hours coverage.
- Data freshness and known gaps.

Interaction: selecting a different period or context lens updates the evidence and economic calculations together. Preserve the previous selection in the URL or session only if the app can do so reliably; never imply that a filter changed the underlying source data.

Acceptance: users can answer “what is being compared?” and “what context is missing?” without opening a tooltip.

### 3.2 Layer Cut — separate signal from explanation

**Purpose:** make the inference chain inspectable.

Progressive layers:
1. **Signal:** what changed or deviated, with observed units and period.
2. **Calculation:** the reproducible arithmetic that converts source data into an estimate.
3. **Interpretation:** what the signal may mean, with explicit uncertainty.
4. **Alternatives:** plausible explanations that could also produce the signal.
5. **Action hypothesis:** what to investigate or test next, and what result would support or reject the hypothesis.

Interaction: each layer expands inline; the user can compare adjacent layers without losing scroll/context. “Likely cause” must not be styled as a confirmed diagnosis.

Acceptance: every inference can be traced back to a visible input or marked as unknown.

### 3.3 Evidence Fold — inspect the trust contract

**Purpose:** make trust inspectable without overwhelming the first view.

Collapsed summary:
- Evidence state.
- Number/type of sources.
- Period covered.
- Material missing inputs.

Expanded detail:
- Source record and provenance.
- Source timestamp and freshness.
- Unit, normalization and transformation.
- Calculation version or rule identifier.
- Assumptions and uncertainty.
- Counter-evidence and unresolved questions.
- Reviewer/approval state, if implemented.

Interaction: expansion must be keyboard operable and have a clear expanded/collapsed state. It cannot be the only way to discover a material limitation; critical caveats remain visible in the summary.

Acceptance: a reviewer can reproduce the result or identify exactly why it cannot yet be reproduced.

## 4. Opportunity decision-object anatomy

Every opportunity workspace should follow this sequence:

1. **Identity:** stable ID, title, site/process/asset scope, first detected date, current status.
2. **Context:** comparison window, operating conditions, baseline, production normalization.
3. **Economic state:** exposure, potential, expected, implemented cost, realized and verified values kept separate.
4. **Evidence chain:** source observations, calculations, interpretation, hypotheses, counter-evidence.
5. **Uncertainty:** confidence by dimension, missing evidence, alternative explanations.
6. **Decision:** accept, investigate, defer, reject or mark insufficient evidence, with a reason where appropriate.
7. **Intervention:** proposed/approved action, owner, cost, timing, dependencies and implementation record.
8. **Verification:** baseline, post-period, counterfactual/comparison method, confounders, attribution and reviewer acceptance.
9. **Learning:** what was confirmed or falsified; reusable knowledge only when the evidence supports it.

A missing field must remain unknown—not silently default to zero, high confidence, “not applicable,” or a fabricated owner.

## 5. Value-state language

Use these definitions consistently across Overview, Opportunities and Verification:

| State | Meaning | Allowed presentation |
|---|---|---|
| Exposure | Potential economic consequence suggested by current evidence | Label as estimated exposure; not necessarily avoidable loss |
| Potential | A plausible improvement under stated assumptions | Show assumptions and evidence gaps |
| Expected | Risk-adjusted forecast for a defined intervention, with method disclosed | Forecast, not achieved value |
| Implemented | Intervention record says a change was made | Do not infer the change worked |
| Realized | Measured change after intervention, not yet necessarily attributable | Show comparison period and confounders |
| Verified | Outcome passed the defined verification protocol and reviewer acceptance | Show verification record, method, period and reviewer state |

For synthetic demo data, show a persistent **“Demo data · fictional factory”** label near financial values and actions. Demo calculations must not appear as canonical persisted opportunities or customer outcomes.

## 6. State and recovery matrix

| State | Required message | Primary next step |
|---|---|---|
| Demo screening | Synthetic example; not customer evidence | Inspect evidence chain |
| No factory selected | No active workspace selected | Choose or load an example |
| No data connected | Inputs are not connected or recorded | Connect/import data |
| Analysis not run | Inputs exist but no result has been produced | Run analysis |
| Insufficient evidence | Current inputs cannot support the conclusion | See missing evidence |
| No canonical opportunity | No durable opportunity record exists | Inspect screening or run qualified analysis |
| Request failed | The operation failed; data may not have been saved | Retry safely or inspect details |
| No verified outcomes | No accepted verification outcome exists | Review intervention/baseline requirements |
| Stale evidence | Source data is outside its freshness window | Refresh or acknowledge stale state |
| Implemented, unverified | Intervention is recorded but outcome is unproven | Set up or complete verification |
| Verified outcome | Verification protocol accepted the result | Inspect verification record |

These states must not share one generic empty-state component unless the component receives and renders an explicit state-specific contract.

## 7. Visual direction: Clarity Engineered

- Keep the current warm-neutral base and restrained industrial green as a starting point; do not introduce a generic dark/neon AI aesthetic.
- Use semantic color sparingly: measured/confirmed, caution/uncertainty, failure/blocking and neutral metadata.
- Use tabular/monospaced numerals for financial values, units and trace identifiers only where it improves comparison.
- Give the decision summary and economic state the strongest hierarchy; source metadata is secondary but always accessible.
- Prefer evidence chains, comparison bands and timeline/lineage structures over a grid of equally weighted cards.
- Motion should reveal hierarchy or relationship. Support reduced-motion preferences; all essential states must work without animation.
- Ensure status is communicated by text and icon/shape, not color alone.
- Avoid displaying precision unsupported by the inputs. Use ranges when uncertainty warrants them.

## 8. Prototype acceptance criteria

A clickable or otherwise testable prototype is ready for review when:

- A reviewer can follow one example from signal to evidence, decision, intervention and verification.
- Demo and canonical persisted opportunity paths are visibly distinct.
- Exposure, potential, expected, realized and verified values cannot be confused.
- The user can inspect a calculation, provenance, uncertainty and alternative explanation.
- “No data,” “insufficient evidence,” “no opportunity,” “no verified outcome” and failure are visibly different states.
- Desktop and mobile layouts preserve reading order and access to critical caveats.
- Keyboard operation, visible focus, accessible names, expanded/collapsed semantics and reduced-motion behaviour are specified.
- Every interaction corresponds to a real current or explicitly future capability; no fake controls.
- At least three target-role reviewers can complete a short task without being told what conclusion to reach. This is a proposed validation gate, not a claim that user testing has occurred.

## 9. Implementation sequence

1. Complete PR #31 state correction and its route acceptance checks.
2. Implement one opportunity workspace skeleton using current evidenced data only.
3. Add the Context Snap and Layer Cut interactions to the single workflow.
4. Add provenance/calculation disclosure only for fields the current data model can support.
5. Define explicit state contracts and tests.
6. Inspect desktop/mobile in a real browser and run accessibility checks.
7. Conduct usability sessions with a plant/energy engineer, plant manager and finance/operations decision-maker.
8. Expand to other workflows only after the first workflow proves useful and the evidence model is sound.

## 10. Not in scope yet

- Universal cross-industry industrial ontology in the UI.
- Autonomous control or automatic execution of plant changes.
- Claims of realized savings without verification records.
- Multi-site portfolio features before data model and buyer need justify them.
- Cosmetic re-skinning of every route before the core opportunity journey works.
- User validation, pilot success, product-market fit or production readiness claims.

**Decision:** prototype one complete opportunity workspace before broad visual redesign. Treat the current demo state fix as a prerequisite, not as proof that the full decision journey is complete.
