# GridMind Main Website — Homepage Specification

**Status:** Build-ready specification; not implemented. **Last updated:** 2026-10-10.  
**Scope:** New public-facing main website only; no changes to the current deployed application are authorized.  
**Brand descriptor:** Infrastructure Intelligence. **Primary audience:** Factory owners, plant heads, operations and energy leaders. **Primary conversion:** A qualified conversation about a specific industrial problem.

## 1. Strategic decision

The homepage must communicate a commercially relevant industrial problem, explain GridMind's evidence-first approach, establish credibility without overstating readiness, and invite relevant buyers to discuss a specific challenge.

**Recommended hero hypothesis:** Lead with the hidden-operational-loss curiosity angle, then immediately explain the evidence-first mechanism. Validate with target buyers rather than treating it as proven.

Primary CTA: **Discuss an industrial challenge**  
Secondary CTA: **See how GridMind works**

Avoid “Book a demo” as the only CTA while the product demonstration and current capabilities remain limited or unvalidated. Do not imply guaranteed findings, savings, deployments, or pilot readiness.

## 2. Message hierarchy

1. Attention: industrial reports may not make every important operational question obvious.
2. Value: connect factory evidence and operating context to better economic decisions.
3. Mechanism: qualify evidence, investigate findings, prioritize opportunities, support decisions, and verify outcomes.
4. Differentiation: distinguish observations, estimates, hypotheses, recommendations, interventions, and verified outcomes.
5. Action: discuss a real industrial challenge and determine whether the current approach is a fit.
6. Vision: expand into a trusted industrial intelligence and coordination layer only as repeatable evidence justifies it.

## 3. Homepage section specification

### Section 1 — Header and navigation
**Goal:** Make the brand and next step recognizable.

**Layout:** GridMind wordmark at left; descriptor “Infrastructure Intelligence” integrated into the brand system; navigation for Platform, Applications, Technology, Vision and About; primary CTA “Discuss a challenge.” On mobile, use a compact accessible menu and preserve a clear conversion path.

**Behavior:** A sticky header may appear after scrolling if it does not consume excessive mobile viewport. Navigation should lead to real pages or valid in-page anchors only.

**Acceptance:** Keyboard navigable, visible focus, no layout jump, usable at 320px viewport width and desktop.

### Section 2 — Hero
**Eyebrow:** GRIDMIND · INFRASTRUCTURE INTELLIGENCE

**H1:** Your factory holds more answers than your reports reveal.

**Body:** GridMind is being developed to help industrial teams connect operational evidence, investigate potential losses, and prioritize improvements worth examining.

**Primary CTA:** Discuss an industrial challenge  
**Secondary CTA:** See how GridMind works

**Optional supporting line:** Evidence first. Clear assumptions. Outcomes measured—not assumed.

Use this as a statement of principles, not proof that all capabilities are deployed.

**Visual:** Expressive, legible GridMind wordmark; high-contrast clean background; custom visualization connecting measurements, operating context, finding, decision and verification. No invented KPI, savings figure, customer logo or fake live telemetry. Keep the first screen focused on headline, short body, two CTAs and one visual.

**Motion:** The visual may progressively reveal relationships. Honor reduced-motion preferences. No scroll hijacking, flashing, or essential information conveyed only through animation.

**Why this version:** It creates curiosity around a buyer-relevant problem while the next sections explain it. Test against these alternatives:

**Alternative A — Evidence-led**  
H1: “From factory data to decisions you can defend.”  
Body: “GridMind aims to help industrial teams understand operational evidence, investigate potential losses and evaluate improvement opportunities with clearer reasoning.”  
CTA: “See how GridMind works.”

**Alternative B — Vision-led**  
H1: “Intelligence for the infrastructure that powers industry.”  
Body: “GridMind's ambition is to connect industrial operating evidence with the decisions and interventions that improve performance.”  
CTA: “Discover the approach.”

Use structured buyer interviews and qualified conversion behavior to choose. Do not decide on aesthetics alone.

### Section 3 — The problem
**Heading:** Industrial problems rarely arrive as a complete answer.

**Copy:** Factory teams may have readings, maintenance records, production information and operational knowledge spread across different systems and people. The difficult part is often establishing what changed, why it matters, and which question deserves attention first.

**Three cards:**
- **Signals without context:** A measurement may be hard to interpret without production, operating hours, product mix or other relevant context.
- **Findings without confidence:** A deviation does not automatically establish its cause; poor or incomplete data can mislead.
- **Opportunities without follow-through:** A proposed improvement needs an owner, a decision, a suitable intervention and a way to evaluate the result.

**Visual:** Three streams converge into a structured investigation, not a dramatic red-alert screen. Treat these as challenges to validate with customers, not universal facts.

### Section 4 — The GridMind approach
**Heading:** From operational evidence to accountable action.

**Intro:** GridMind is designed around a traceable workflow that separates what is measured from what is inferred—and what is proposed from what is actually verified.

**Steps:**
1. **Contextualize:** Identify the asset, system, operating conditions and relevant period.
2. **Qualify evidence:** Check units, completeness, freshness, comparability and source.
3. **Investigate:** Examine changes and possible explanations without confusing correlation with cause.
4. **Prioritize:** Consider economic significance, confidence, cost, risk and feasibility.
5. **Decide and coordinate:** Support qualified people in determining what to investigate or do next.
6. **Verify:** Evaluate post-intervention evidence against a defensible baseline.

**Closing line:** A detected change is a starting point. A defensible decision requires context; a verified outcome requires evidence after action.

**Interaction:** Selecting a step updates a short explanation and highlights that stage in the workflow diagram. All content must remain available without interaction and on mobile.

### Section 5 — Illustrative product walkthrough
**Label:** ILLUSTRATIVE WORKFLOW · SYNTHETIC DATA

**Heading:** See how an industrial question could be investigated.

**Intro:** Explore an illustrative example of how evidence, operating context and uncertainty can shape an investigation. This example uses synthetic data and is not a customer deployment or measured GridMind result.

**Sequence:** Select a sample utility or asset; inspect sample measurements and time range; view a potential deviation; inspect data-quality checks and context; review what is observed, estimated and still a hypothesis; see what evidence or expert review may be needed; inspect a mock verification plan.

**Requirements:** Persistent synthetic-data label, explicit assumptions, no unqualified savings claims, and no simulated values styled as live factory telemetry.

**Fallback:** If an interactive demo cannot be implemented reliably, use an accessible sequence of annotated static panels rather than a fragile fake dashboard.

**CTA:** Discuss a similar challenge.

### Section 6 — Initial applications
**Heading:** Start with the operational question—not a feature checklist.

**Intro:** The right use case depends on the facility, the problem's economic importance and whether suitable evidence is available.

1. **Energy and utility performance:** Examine consumption and operating context to investigate potential inefficiencies and establish whether an opportunity can be quantified. Candidate application; assess data and capability requirements.
2. **Equipment and reliability investigations:** Organize relevant asset evidence to support investigation and prioritization. Intended application; do not claim predictive performance without validation.
3. **Production and operational losses:** Explore relationships between operating conditions, production context and possible losses where suitable records exist. Candidate application requiring appropriate data and domain review.
4. **Investment and intervention decisions:** Structure evidence, costs, risks and assumptions when comparing interventions. Intended decision-support workflow, not autonomous approval or control.

**CTA:** Explore whether your problem fits.

Do not present these as independently validated product modules unless implementation and evidence are confirmed.

### Section 7 — Evidence and trust
**Heading:** Know what is observed, what is estimated, and what remains unknown.

**Copy:** Industrial decisions should not depend on a system presenting every output with equal certainty. GridMind's design principles distinguish direct evidence from calculations, hypotheses, recommendations and verified outcomes.

**Evidence labels:**
- **Observed:** Supported by supplied measurements or records.
- **Estimated:** Calculated using explicit assumptions.
- **Hypothesis:** A possible explanation requiring validation.
- **Recommended:** A proposed action for qualified human review.
- **Implemented:** An intervention recorded as having occurred.
- **Verified:** An outcome supported by suitable post-intervention evidence and comparison.

Supporting principles: traceable sources, data-quality checks, visible assumptions, explicit uncertainty, appropriate human review, and post-intervention verification.

**Visual:** Evidence card with source, period, quality status, assumptions and limitations. Label synthetic values. Avoid “100% accurate,” “eliminates waste,” “guaranteed savings,” “fully autonomous,” or unsupported benchmarks.

### Section 8 — Designed for industrial constraints
**Heading:** Industrial intelligence must respect the operating environment.

**Copy:** Factory data can be incomplete, inconsistent, sensitive and tied to systems that must remain reliable. GridMind's approach is intended to make data quality, authorization, traceability and operational boundaries explicit.

Explain intended principles: authorized data; identification of missing, stale, invalid or incomparable measurements; separation of data-quality problems from possible equipment issues; read-only initial OT integration unless a separately reviewed and authorized design permits otherwise; traceable assumptions and calculations; customer confidentiality and permissioned data use.

**CTA:** Review technical principles.

Publish only actual current architecture, security controls and tested integrations. Do not present design principles as proof that every control is implemented or independently certified.

### Section 9 — Long-term vision
**Heading:** One intelligence loop. More ways to create industrial value.

**Copy:** GridMind's long-term ambition is to connect industrial understanding with the decisions, people and resources required to improve performance. The same evidence-to-verification discipline could eventually support adjacent workflows such as maintenance, procurement and implementation coordination—where customer need and repeatable outcomes justify expansion.

**Visual:** Focused facility use case → adjacent operational workflows → decision and execution partners → multi-facility intelligence.

Label as long-term direction, not current availability. Do not make a marketplace or cross-factory benchmark the centerpiece before the initial use case is proven.

### Section 10 — About and principles
**Heading:** Built around disciplined industrial reasoning.

**Copy:** GridMind is being developed around a simple principle: operational decisions should be grounded in evidence, explicit assumptions and a clear understanding of what remains uncertain.

Principles: evidence over assertion; economics with assumptions visible; qualified people accountable for consequential decisions; outcomes measured rather than presumed.

Add founder biography, team credentials, advisors, affiliations or company history only when confirmed and approved for publication.

### Section 11 — FAQ

**How is GridMind different from an existing monitoring dashboard?**  
GridMind's intended focus is to connect authorized operational evidence and context to investigation, economic prioritization, intervention decisions and outcome verification. The practical distinction must be demonstrated for each supported use case.

**Does GridMind guarantee savings?**  
No. An estimated opportunity is not realized savings. Any outcome claim requires suitable post-intervention evidence and a defensible comparison.

**Does it work with every machine or factory system?**  
Compatibility depends on equipment, data source, interface, data quality and integration requirements. Untested configurations must be assessed individually.

**What if our data is incomplete?**  
The approach should identify material limitations and avoid unsupported conclusions. Some questions may require additional measurements or may not be answerable with available data.

**Is GridMind ready to deploy in a factory today?**  
Do not publish a blanket readiness claim. The current system-alignment audit states that the end-to-end evidence-to-action-to-verification path must be demonstrated with real factory evidence before GridMind is described as pilot-ready. Update this answer only after a fresh readiness review supports a more specific statement.

**How is factory data handled?**  
Explain the actual access, retention, processing, sharing and deletion practices in force. Do not publish promises that have not been implemented and reviewed.

**What does an initial conversation involve?**  
We discuss the operational question, its importance, available evidence and constraints, then determine whether GridMind's current approach is a fit. No result is promised before assessment.

### Section 12 — Final CTA
**Heading:** Have an industrial problem worth investigating?

**Body:** Tell us what your team is trying to understand or improve. We'll assess whether the problem and available evidence fit GridMind's current approach.

**Primary CTA:** Discuss an industrial challenge  
**Secondary link:** Review the GridMind approach

**Form fields:** name, work email, company, role, industry, broad problem category, optional short description, and stage of interest. Keep it brief; do not ask for confidential production data in the marketing form.

Link to a real, reviewed privacy notice explaining submission use. Do not launch a form without a defined recipient, secure handling, appropriate legal review, and a tested response workflow.

## 4. Global visual system

- **Logo:** Retain the expressive hand-drawn wordmark direction, refining letter separation and small-size legibility. Do not stretch or redraw it inconsistently.
- **Descriptor:** “Infrastructure Intelligence” in clean, restrained typography.
- **Color:** Predominantly neutral, high-contrast palette. Use accents sparingly for active states and data semantics. Never rely on color alone for evidence status.
- **Typography:** Expressive brand treatment plus highly legible sans-serif body and interface type. Limit type scale and maintain hierarchy.
- **Layout:** Strong grid, generous whitespace, concise copy, clear section boundaries and restrained card use.
- **Imagery:** Credible industrial photography and custom diagrams; avoid generic AI-generated machinery or fabricated customer environments.
- **Data visuals:** Label units, time ranges, sources, assumptions and synthetic status.
- **Motion:** Purposeful, short transitions; no distracting perpetual movement; honor reduced-motion settings.
- **Tone:** Precise, commercially relevant, technically literate, confident about ambition but candid about current limits.

## 5. Responsive behavior

**Mobile:** Single-column narrative; naturally wrapping headline; stacked or full-width CTAs; vertical workflow; no hover-only interactions; simple demo panels with accessible controls; sticky CTA only if it does not obstruct content; tables become stacked cards or scrollable with clear affordances.

**Tablet:** Use two-column layouts only when content remains legible. Simplify network diagrams rather than shrinking them.

**Desktop:** Restrained maximum content width, consistent grid, balanced hero text and visual. Avoid oversized animation that delays the value proposition.

## 6. Accessibility and performance

- Semantic headings, one clear H1 and logical heading order.
- Keyboard functionality and visible focus states.
- Sufficient contrast; descriptive links and accessible control names.
- Alternative text for meaningful imagery; decorative imagery ignored by assistive technology.
- Form labels, accessible validation errors and submission status.
- No essential content conveyed by color or motion alone.
- Honor reduced-motion settings.
- Optimize image formats, sizes and loading; avoid unnecessary third-party scripts.
- Lazy-load below-the-fold media where appropriate; never delay the main headline and CTA for decoration.
- Test Core Web Vitals on representative devices and networks.
- No auto-playing audio; avoid video backgrounds on mobile unless lightweight and accessible.

## 7. CTA destinations and form behavior

- “See how GridMind works” → workflow section.
- “Discuss an industrial challenge” → discovery page or form section.
- “Explore potential applications” → applications section/page, only if built.
- “Review technical principles” → technology page, only if built.
- “Discover the platform” → platform overview, only if built.

Until supporting pages exist, use valid anchors instead of dead links. Form success should be shown only after server-side submission succeeds. Error states preserve entered data and explain retry options. No fake success states.

## 8. Analytics plan

Use privacy-conscious, consent-appropriate analytics. Never send personal or confidential industrial information to analytics providers.

Track these events: hero primary CTA click; hero secondary CTA click; demo start, step completion and completion; application card click; technical principles click; discovery form start, successful submission and error; qualified discovery in the CRM or controlled internal system, not inferred from a page click.

Capture campaign attribution where appropriate. Define a qualified opportunity separately from a raw lead. Do not log form contents, personal data or factory-confidential details in analytics payloads.

## 9. Claim-by-claim evidence checklist

Classify every claim as one of:
- **Current verified capability:** tested in the relevant deployed environment.
- **Design principle:** intended constraint or method; not proof of implementation.
- **Candidate application:** plausible use case, not yet validated.
- **Illustrative/synthetic:** clearly labelled demonstration only.
- **Long-term ambition:** explicitly future-facing.
- **Proven outcome:** supported by appropriate evidence, reviewed and approved for publication.

Review every statement about customers, deployments, partners, credentials, readiness, integrations, security, accuracy, prediction, root-cause diagnosis, financial impact, savings, payback, ROI, benchmarks, uptime, performance and scalability.

**Launch-blocking rule:** If the evidence category is unknown, remove the claim or rewrite it conservatively. Do not infer readiness from a mockup, source-code presence or synthetic data.

## 10. Content dependencies

1. Confirm wordmark assets and usage rules.
2. Select the initial commercial use case through customer discovery and data access.
3. Refresh the technical/readiness audit.
4. Decide which current capabilities can actually be demonstrated.
5. Build or omit the synthetic interactive demo.
6. Confirm current data-handling and privacy policies.
7. Confirm form recipient, lead-handling workflow and response owner.
8. Approve all technical and economic claims.
9. Verify team, company, customer and partner details.
10. Confirm the new main-site domain and its relationship to the existing app; do not silently replace or redirect the current application.

## 11. Acceptance criteria

The homepage is ready for implementation review when every section has approved copy and a defined purpose; every CTA has a valid destination and tested outcome; every product/company claim has an evidence classification; synthetic content is persistently labelled; no fabricated customer proof, savings or unsupported readiness claims remain; mobile works without hover or motion; accessibility checks pass; performance is measured; analytics avoids sensitive data; form handling and privacy notice are tested; the new site remains separate from the current app until an explicit launch decision; and content, product status, security language and CTA are reviewed before launch.

## 12. Immediate next steps

1. Refresh the read-only product readiness audit and map which homepage claims are supportable today.
2. Validate hero and core positioning with target industrial buyers.
3. Finalize the first use case and create the clearly labelled illustrative walkthrough.
4. Design homepage and responsive prototypes.
5. Build a separate implementation plan, then implement the new site.
6. Test claims, forms, analytics, accessibility and performance before launch.

**Strategic constraint:** The main website can communicate GridMind's ambition, but must never make the company appear more operationally mature than the evidence supports.
