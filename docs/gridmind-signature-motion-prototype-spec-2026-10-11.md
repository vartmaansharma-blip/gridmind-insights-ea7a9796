> **Decision status update (2026-10-11): REJECTED.** This document is historical design documentation, not an active build instruction. The concept was judged insufficiently aligned with GridMind's intended identity and at risk of reading as decorative energy-tech/SaaS design. Do not implement it. Any replacement direction must be evaluated on its own merits.

# GridMind Signature Motion Prototype — Build Specification

**Date:** 2026-10-11  
**Status:** REJECTED — do not implement this concept. Retained only as a record of a rejected proposal.  
**Decision:** The topographic hero, cursor ripple, and four-stage glowing process rail are rejected as a visual direction. No prototype or product integration is authorized from this specification. The concept may be reconsidered only if a materially different proposal is explicitly approved.  
**Authority:** The GridMind Decision Constitution takes precedence over this specification.

## 1. Objective and decision to be tested

Test whether a restrained animated topographic field plus a scroll-linked process rail gives GridMind a recognizable visual identity and helps a first-time visitor understand its evidence-led process.

This is a prototype hypothesis, not a settled design. The prototype must answer:
1. Does the hero feel distinctive and intentional rather than like generic AI decoration?
2. Can a visitor explain the core idea after a brief look?
3. Does the process rail clarify the page's structure without distracting from the content?
4. Does it work smoothly on a typical mobile device, with keyboard navigation and reduced motion?
5. Can it be implemented and maintained without a disproportionate engineering burden?

Do not build a complete marketing site as part of this experiment.

## 2. Scope boundary

### In scope
- One responsive hero composition.
- SVG topographic contour field.
- Subtle pointer ripple on compatible desktop devices.
- One vertical process rail with four active states: Data, Detect, Quantify, Verify.
- A short content sequence whose sections activate the rail.
- Reduced-motion and touch fallbacks.
- A standalone route, branch preview, or isolated prototype that cannot overwrite the existing product route.

### Out of scope
- Replacing `src/routes/index.tsx` or changing the existing product experience.
- Real factory telemetry, real customer data, or claims of actual GridMind findings.
- A full Discovery Lab, live analytical engine, Three.js/WebGL scene, or complex particle system.
- Scroll hijacking, autoplay audio, forced animation, or interactions that hide essential information.
- Claims of savings, causality, predictive accuracy, production readiness, or verified outcomes.

## 3. Visual composition

### Canvas and layout
- Background: near-black neutral, with sufficient contrast for body copy and controls.
- Accent: electric/neon lime used selectively for contour emphasis, active rail state and focus cues; do not use it for every element.
- Hero: editorial text block and custom contour visualization share the viewport. On wide screens, keep the headline in a clear text column and allow the field to occupy the remaining area or sit behind a carefully controlled region. Text must never be obscured by contours.
- Preserve negative space. Avoid a dense, uniformly glowing mesh.
- Keep the GridMind wordmark legible and consistent with the approved brand asset; do not stretch or invent a replacement.
- Contours should suggest an abstract landscape of operational intensity and connected systems, not a literal geographic map or actual measurement surface.

### Hero copy for prototype testing
Primary creative hypothesis:
**Everything is connected. What are we missing?**

Supporting line:
**Understand the relationships behind industrial performance—and investigate where better decisions may create value.**

Primary CTA: **Explore the GridMind approach**  
Secondary CTA: **Discuss an industrial challenge**

The line above is test copy, not market-validated final messaging. Compare it in buyer research against the commercially direct alternative, **Find the value your operations are hiding.** Do not choose based on animation aesthetics alone. CTA destinations must exist and work; otherwise use a valid in-page anchor and do not simulate a successful lead submission.

## 4. Topographic field behavior

### Default state
- Render a limited set of thin SVG contour paths with varied but controlled curvature.
- Use slow, subtle drift or low-amplitude path morphing; no jitter, flashing or constant high-frequency movement.
- Most contours remain quiet. A small number may carry a slightly stronger accent to establish hierarchy.
- The animation should not compete with the headline or CTA. If motion draws attention away from reading, reduce amplitude and contrast.

### Pointer ripple
- On devices with a fine pointer and hover capability, pointer movement may produce a localized, low-amplitude deformation.
- The effect must be bounded, reversible and visually smooth. It must not imply that a real factory sensor or live dataset is responding.
- Use pointer events and an isolated visual layer; do not trigger full-page React renders for every pointer movement.
- Throttle or coalesce updates with `requestAnimationFrame`; avoid continuous work when the pointer is idle.
- Disable the ripple on touch/coarse-pointer devices. Do not emulate a cursor on mobile.

### Scroll transition
- The hero should gradually lead into a clearer network/structure as the visitor enters the process story. Prefer a simple opacity/position/path transition over a complex 3D transformation.
- Do not lock the scroll position or force the visitor to complete an animation.
- Content must be readable if animation never runs or JavaScript is unavailable.

## 5. Process rail behavior

The rail has a quiet baseline line and a single active marker. The marker moves to the corresponding section as the user scrolls; the active stage gains emphasis while inactive stages remain legible.

### Stage 1 — Data
Explain that relevant operational information can come from different sources and requires context, source lineage, units, period and quality checks.

### Stage 2 — Detect
Explain that a change or relationship may warrant investigation. A detected deviation is not proof of cause.

### Stage 3 — Quantify
Explain how potential operational or economic significance may be estimated using explicit assumptions, bounds and uncertainty. An estimate is not realized savings.

### Stage 4 — Verify
Explain that outcomes require suitable evidence after an approved intervention and a defensible comparison with a baseline. A planned verification is not a verified result.

### Interaction rules
- Use `IntersectionObserver` or equivalent section-visibility logic with sensible thresholds; avoid fragile calculations tied to a single screen size.
- The active marker should follow reading position and remain stable around section boundaries. It must not flicker when two sections overlap.
- If a stage is clicked, navigate to its section only if this behavior is clear and keyboard accessible. Otherwise keep the rail as a progress indicator, not a deceptive control.
- Use semantic headings and accessible state announcements only when needed; avoid announcing every scroll update to screen readers.
- Each stage's meaning must be present in page content, not conveyed solely by line color or animation.
- On small screens, collapse the rail to a compact vertical indicator beside content or a simple four-stage progress treatment that does not consume the reading width.

## 6. Technical approach

### Preferred implementation
- SVG for contour paths and the small network transition.
- CSS transforms, opacity and stroke properties for basic animation.
- `IntersectionObserver` for section activation.
- `requestAnimationFrame` for pointer-driven visual updates where needed.
- Reusable components with explicit props and no global application-state dependency.
- Keep the animated layer decorative (`aria-hidden="true"`) unless it exposes a genuinely useful interactive control. Provide an equivalent textual explanation.

### Do not add initially
- Three.js, WebGL, a physics engine, a charting library or an animation framework solely for this effect.
- Large images or video backgrounds.
- New analytics or third-party scripts unless separately justified and reviewed.

Consider Canvas only if an SVG prototype demonstrably fails a measured performance or rendering requirement. Any heavier approach needs a documented benefit.

## 7. Responsive and accessibility requirements

- Test at 320px, 375px, 768px, 1024px and wide desktop.
- No horizontal overflow, clipped headings, obscured CTA or overlapping process labels.
- Touch users receive the static/gently drifting field without pointer ripple.
- Honor `prefers-reduced-motion: reduce`: stop continuous drift and path morphing, remove scroll-linked decorative transitions, and change active states immediately or with minimal non-motion styling.
- Keyboard users can reach every real control in a logical order, see focus clearly and activate controls without a pointer.
- Meet WCAG contrast expectations for text, controls and focus. Lime is an accent, not the only indicator of state.
- Maintain semantic heading order and readable content with animation disabled.
- Do not use flashing or rapid luminance changes.
- Avoid sticky rail behavior that obscures content or keyboard focus.
- On low-powered/mobile devices, prefer static contours if frame pacing or battery cost is poor.

## 8. Truth and claim boundaries

The contours are an abstract brand visualization, not a live data display. If any numbers or operational scenario are later introduced, label synthetic data persistently and state the assumptions.

The four-stage rail is a simplified communication model. It must not imply that:
- detection proves root cause;
- correlation proves causality;
- estimates are actual savings;
- a recommendation has been approved or executed;
- a planned comparison proves an outcome;
- every stage is already implemented in the deployed product.

The public site and marketing prototype must remain separate from customer deployments and the existing product route.

## 9. Prototype test plan

Run a short review with people who have not been briefed on the concept. Ask them to describe what they think GridMind does, what the moving lines mean, and what they believe the four stages promise. Do not explain the intended answer before asking.

Evaluate:
- **Comprehension:** Can a visitor describe the idea in their own words?
- **Distinctiveness:** Does the visual feel specific to GridMind rather than generic AI branding?
- **Hierarchy:** Is the headline noticed before the decoration?
- **Process clarity:** Can visitors distinguish detection, estimation and verification?
- **Interaction quality:** Does pointer ripple feel subtle and responsive rather than gimmicky?
- **Mobile usability:** Is the content clear without hover or pointer effects?
- **Accessibility:** Can the page be understood and used with keyboard navigation and reduced motion?
- **Performance:** Is initial content fast, animation smooth on representative devices, and CPU usage low while idle?
- **Commercial credibility:** Does the copy invite a relevant industrial conversation without promising unsupported results?

Record observations and failures. Do not invent success percentages or treat a few informal reactions as statistical proof.

## 10. Acceptance criteria

The prototype can advance only when:
1. The existing product route and functionality remain unchanged.
2. Hero headline and CTA are readable before animation completes.
3. The contour field is visibly restrained and never blocks content.
4. The process marker activates all four sections reliably on desktop and mobile.
5. No scroll hijacking, forced waits, pointer-only essential interactions or fake form success exists.
6. Reduced-motion mode removes continuous decorative movement.
7. Keyboard, focus, contrast and semantic structure checks pass.
8. Synthetic/abstract visuals cannot be mistaken for real customer telemetry.
9. Browser/device checks show no material layout shift or persistent high CPU activity while idle.
10. The team records a keep / refine / remove decision based on observed tests.

If the visual is attractive but confuses the message, simplify it. If the rail adds no comprehension, remove it. Do not defend the concept merely because it has already been designed.

## 11. Implementation sequence

1. Create an isolated prototype surface; inspect the current route structure first.
2. Implement static SVG contours and final text hierarchy.
3. Add restrained drift and test reduced-motion behavior.
4. Add pointer ripple behind a capability check.
5. Build the four content stages and scroll-linked rail.
6. Test responsive behavior, keyboard, reduced motion and performance.
7. Run an unprompted comprehension review and record findings.
8. Decide keep / refine / remove before any integration.
9. Integrate only after approval and after confirming that the separate public website is authorized by the current GridMind decision gates.

## 12. Dependencies and unresolved decisions

- The first commercial wedge remains undecided; do not tailor the graphic to energy alone as if that choice were final.
- Hero copy remains a hypothesis to test with industrial buyers.
- The full public website remains gated by product-truth and offer-validation work in the Decision Constitution.
- Exact brand color tokens, approved wordmark assets, target-browser matrix and measured performance budgets should be confirmed before production integration.
- This prototype does not establish that the GridMind product is production-ready or that any economic result is achievable.

## Related source-of-truth documents
- [GridMind Decision Constitution and Contradiction Register](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md)
- [GridMind Main Website — Homepage Specification](gridmind-main-website-homepage-spec.md)
- [GridMind Motion and Discovery Experience Strategy](gridmind-motion-and-discovery-experience-strategy-2026-10-11.md)
