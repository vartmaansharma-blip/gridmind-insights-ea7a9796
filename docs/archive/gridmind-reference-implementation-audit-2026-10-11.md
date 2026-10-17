> [!IMPORTANT]
> **Status: HISTORICAL SNAPSHOT — NOT A CURRENT EXECUTION AUTHORITY (reviewed 2026-10-13).** This document is preserved for context and evidence. Its dated ratings, status claims, recommendations, and next steps may be stale; do not treat them as current instructions or proof of present readiness. Follow the [canonical Master Plan](../gridmind-master-plan-2026-10-11.md), [Decision Constitution](../gridmind-decision-constitution-and-contradiction-register-2026-10-10.md), and current linked GitHub issues for present decisions and blockers. No historical findings below have been deleted or rewritten.

# GridMind Reference Audit — What to Borrow, Adapt, and Build

**Date:** 2026-10-11  
**Status:** Reference-derived design recommendations; not product or market validation.  
**Scope:** Translate the previously selected best-in-category references into an original GridMind experience. This audit does not authorize a full public-site build or changes to `src/routes/index.tsx`.

## Executive decision

Keep the existing provisional direction **Clarity Engineered**. Do not imitate any one reference wholesale. Combine the references by discipline:

- **Palantir Warp Speed:** visual authority, high-contrast narrative, and a sense of operational consequence.
- **Cognite Industrial AI:** explain contextualization and relationships across industrial data; make context a concrete concept, not a vague AI promise.
- **Braincube:** connect operational variability to a business question in direct language; avoid unsubstantiated outcome figures.
- **Augury:** organize the story around the operator's problem and progression from signal to prioritization to action; clearly distinguish what is actually demonstrated.
- **Apple:** deliberate pacing, large visual moments, and coherent transitions that make one idea unfold.
- **Nike:** concise, assertive message hierarchy and a clear point of view—not its brand styling.
- **Nothing:** a repeatable, recognizable visual grammar and disciplined use of annotation—not its glyph identity or product aesthetic.
- **NASA Eyes:** let visitors explore a system and change perspective, rather than watch a passive animation.
- **Stripe:** explain a complex commercial/product idea in digestible layers with clear paths to the next step.

These are reference roles, not claims that GridMind already has the capabilities shown by those companies.

## Implementation matrix

| Reference / strength | Implement for GridMind | Do not copy / do not imply |
|---|---|---|
| Palantir — cinematic technical authority | A bold opening composition; strong typographic hierarchy; one carefully choreographed transformation from incomplete view to contextualized view. | Dark tactical theatre, copied layouts, or the impression that GridMind is a deployed operational command platform. |
| Cognite — industrial context | Align a synthetic measurement with named operating events and show how context changes the question being asked. | Claims of integrations, knowledge graphs, real-time data, or automated contextualization unless built and evidenced. |
| Braincube — direct business framing | Start with a specific operational question and explain why variability or a changing condition matters to a decision. | Generic “AI improves margin” copy, invented savings, fabricated customer outcomes, or choosing energy as the wedge just because it looks good. |
| Augury — problem-to-action narrative | Sequence: signal → prioritize a question → inspect evidence → identify missing checks → human decides next step. | Autonomous diagnosis, predictive accuracy, or agent actions that GridMind does not demonstrably support. |
| Apple — pacing and reveal | Use progressive disclosure, scroll/interaction-triggered transitions that change meaning, and strong static frames. | Long forced scroll, waiting for animation, copied Apple product staging. |
| Nike — conviction | A short, specific hero statement followed by supporting explanation; remove generic filler. | Empty hype (“revolutionary”, “unstoppable”) without product proof. |
| Nothing — recognizability | A consistent GridMind signature: **The Cut**—a sharply bounded aperture reveals the context layer while the underlying measurement stays fixed. Repeat the same geometry in hero, evidence view, and transitions. | Copying Glyph lights, exact brand patterns, or making the signature decorative rather than informative. |
| NASA Eyes — exploration | A visitor-controlled scrubber / context selector; let them compare states and inspect a selected event. Provide keyboard/touch alternatives. | A fake live factory simulator, false precision, or 3D complexity without explanatory value. |
| Stripe — complex explanation | Layered explanations, clear labels, concise proof boundaries, and a credible next step that matches the real offer once validated. | Generic card grids and premature conversion claims. |

## Proposed GridMind experience

### 1. Opening: the incomplete picture

A distinctive, editorially composed industrial schematic and a single illustrative measurement. The viewer should understand the scene before animation begins. Display **ILLUSTRATIVE SCENARIO · SYNTHETIC DATA · NOT LIVE GRIDMIND OUTPUT** in the visible composition.

### 2. Signature interaction: The Cut

A sharply bounded vertical or angled aperture travels across the schematic. It reveals context—such as an illustrative shift boundary or production-state change—while the original measurement remains in place. The interaction must answer a question: “What else was happening at this point?” It must not suggest that the event caused the measurement change.

### 3. Investigation: let the visitor choose

Offer two or three clearly labelled context layers, for example **Production**, **Shift / operating context**, and **Quality check**. These are example layers for the prototype, not a claim about available GridMind integrations. Selecting one changes the annotation and evidence shown, not just the accent colour.

### 4. Evidence boundary: make uncertainty visible

Present three distinct groups:
- **Observed in this synthetic scenario**
- **Possible explanation — not established**
- **Missing evidence / next check**

Do not use “verified”, “root cause”, or a recommended operational change unless the fictional scenario explicitly contains enough evidence to support it. The prototype should end with a sensible investigation question, not a fake AI-generated answer.

### 5. Commercial bridge

The closing state should explain the intended value in plain language and offer a provisional next step. Keep CTA copy uncommitted until the first commercial offer is validated. No fabricated savings calculator or arbitrary percentage.

## Motion and interaction specification

- **Reveal:** The Cut opens a context layer.
- **Relate:** a selected event aligns with a stable time axis / measurement.
- **Investigate:** a visitor selects an event or context layer; explanatory labels and evidence update together.
- **Resolve:** the composition simplifies into observed / hypothesis / missing evidence / next question.
- Keep the visitor in control. No scroll hijacking, fake real-time indicators, random particles, generic glowing networks, or simulated “AI thinking”.
- Provide a reduced-motion version that switches layers immediately and preserves all information.
- Ensure keyboard focus, touch targets, contrast, text alternatives, and a narrow-screen layout.
- Prefer custom SVG/CSS over heavy 3D unless a test proves 3D materially improves comprehension.

## What to implement now

Build one isolated, self-contained interactive prototype in `docs/prototypes/` that combines the best-fit principles above. Do not replace the existing product route. Use deterministic, internally consistent synthetic data and clearly label it. Include:
1. a strong static opening;
2. The Cut reveal;
3. a meaningful context selector;
4. an evidence / uncertainty panel;
5. a concluding next-investigation question;
6. reduced-motion and mobile states;
7. a small review rubric and known limitations.

This prototype tests the experience and the brand signature; it does not validate demand, select the commercial wedge, or prove product readiness.

## How to evaluate it

Ask a person unfamiliar with GridMind to interact without a spoken explanation. Then ask:
- What do you think GridMind helps with?
- What changed when you used the control?
- What does the visual claim—and what does it not claim?
- What would you want to inspect next?
- What do you remember about the experience after a short delay?

Track comprehension, recall, mistaken capability assumptions, and accessibility issues—not only whether they “like” the design. Keep scores internal until relevant industrial buyers have been tested.

## Source references

- Palantir Warp Speed — https://www.palantir.com/warpspeed/
- Cognite Industrial AI — https://www.cognite.com/en/industrial-ai
- Braincube — https://braincube.com/
- Augury — https://www.augury.com/
- Apple — https://www.apple.com/
- Nike — https://www.nike.com/
- Nothing — https://nothing.tech/
- NASA Eyes — https://eyes.nasa.gov/
- Stripe — https://stripe.com/

## Decision boundary

**Adopt:** the strengths as described above, translated into an original GridMind design system.  
**Keep provisional:** The Cut as the leading signature interaction, exact hero copy, selected scenario, palette, CTA, and final commercial positioning.  
**Do not authorize yet:** full public-site implementation, production claims, real customer/factory data, or changes to `src/routes/index.tsx`.

**Operating rule:** Borrow the craft, not the costume. Make the complexity visible; make the evidence legible; make the next decision understandable.
