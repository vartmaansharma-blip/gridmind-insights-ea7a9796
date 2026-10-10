# GridMind improvement priorities — 2026-10-10
**Status:** Execution priorities derived from the master thesis critique. These are proposed gates, not claims that they have passed.

## Decision
Keep the broad GridMind company thesis; narrow the next execution cycle to proving one valuable, safe, repeatable customer workflow. Do not expand the product surface until this is demonstrated.

## P0 — Resolve before calling the product customer-ready

### 1. Validate the first buyer and use case
**Problem:** The long-term platform is compelling but the first paid use case remains unvalidated.
**Work:**
- Compare three candidates: operational-loss investigation, one-category procurement intelligence, and one narrow industrial workflow.
- For each, identify a specific buyer/job title, recent costly event, current workaround, budget owner, data owner, expert reviewer and route to a paid pilot.
- Request evidence of the problem and authorized sample data; do not treat compliments or hypothetical interest as demand.
- Score severity/frequency, buyer access, data readiness, time-to-result, willingness to pay, delivery effort, repeatability and expansion potential. A fatal blocker overrides a high score.
**Acceptance criteria:** One selected wedge has a named reachable buyer, a real recent problem, authorized data, qualified reviewer, baseline, scope, timeline, explicit pass/fail criteria and a credible paid-pilot next step. If no candidate meets the gate, continue discovery rather than build.
**Deliverable:** Completed buyer/problem scorecard with evidence and rejected alternatives.

### 2. Define a specific offer, not a general promise
**Problem:** “Industrial intelligence” is too broad to explain why a customer should buy now.
**Work:** Draft one offer with target customer, triggering event, inputs required, work performed, outputs, delivery time, human-review boundary, price hypothesis and exclusions.
**Acceptance criteria:** A factory manager can understand what they receive, what it requires, what it does not promise and what decision it enables without a long explanation. The offer is testable with one bounded case.
**Guardrail:** No guaranteed savings, unsupported ROI, “replaces engineers,” or superiority claims.

### 3. Verify app integrity and evidence lineage
**Problem:** A strategic thesis is worthless if the actual workflow is unreliable or data provenance is unclear.
**Work:** Test sign-in and authorized workspace creation; tenant isolation; permission boundaries; save/reload/recompute/retry; deterministic calculations; missing/ambiguous input refusal; source, unit, time window and algorithm-version lineage; visible persistence failures.
**Acceptance criteria:** A documented acceptance suite passes on the deployed build; no known cross-tenant leakage in tested paths; saved results reload consistently; invalid or unsupported inputs are rejected explicitly; findings are reproducible from recorded inputs. Report test results honestly with build/commit and timestamps.
**Guardrail:** Do not manually add memberships, fabricate factory evidence, or present demo inventory as a real customer factory.

### 4. Establish a fair outcome benchmark
**Problem:** “Better than a normal engineer” is an aspiration, not evidence.
**Work:** Pre-register a comparison against the customer's normal process on the same bounded case. Use an independent qualified reviewer and adjudicate findings without revealing which source produced them where feasible. Track material precision, material misses, time-to-useful-finding, review burden, reproducibility and economic-estimate error.
**Acceptance criteria:** Baseline, inclusion rules, scoring rubric, reviewer and thresholds are agreed before examining the result. Findings are reported including failures and uncertainty. Do not claim superiority from a tiny or cherry-picked sample.
**Initial sample:** Use 30 independently adjudicated cases only as an initial smoke test where feasible; it is not sufficient on its own to establish broad superiority.

## P1 — Build only after the P0 evidence exists

### 5. Measure delivery economics
Track onboarding time, analyst/expert hours, integration effort, support burden, time to first useful result, recurring use and full cost to deliver. Separate manual service work from software automation.
**Acceptance criteria:** A pilot report discloses total delivery effort and a plausible price/margin hypothesis; repeated cases show which steps actually generalize.

### 6. Prove the shared-core advantage
**Problem:** A broad platform is justified only if shared capabilities reduce cost or improve decisions across use cases.
**Work:** Compare the next adjacent workflow against a clean standalone implementation. Measure reused data model, connectors, evidence pipeline, review process and outcome tracking.
**Acceptance criteria:** Evidence shows lower marginal onboarding/delivery effort or improved decision quality. Otherwise keep the module separate or do not build it.

### 7. Make customer-facing trust visible
Show data coverage and freshness, source lineage, uncertainty, unsupported conclusions, review status, assumptions, baseline definition, expected versus realized value, and the identity/role of the approver. Make failures visible.
**Acceptance criteria:** A reviewer can trace every material number and recommendation to its inputs, assumptions and calculation version.

## P2 — Defer until customer pull proves the need

- Multi-site benchmarking.
- Broad supplier marketplace or transaction handling.
- Autonomous execution of material operations.
- Many integrations without an identified customer use case.
- Specialized data-centre/energy-flexibility verticals.
- General-purpose industrial ontology beyond requirements of real cases.
- Marketing polish that does not resolve a conversion or trust barrier.

## First 30-day execution sequence

### Days 1–5: Buyer/problem discovery
Reach relevant industrial decision-makers through legitimate existing relationships. Conduct structured problem interviews; seek a recent example and evidence, not only opinions. Compare the three wedge candidates.

### Days 6–10: Data feasibility and offer
Secure permission for a bounded dataset or case. Define required fields, units, periods, missingness rules, expert reviewer and customer decision. Write the offer and pre-register the scorecard.

### Days 11–20: One bounded assessment and product acceptance
Run the case with traceable evidence. In parallel, execute the technical acceptance suite on the deployed app. Record failures, false positives, misses, time and manual effort. No unsupported savings claims.

### Days 21–30: Decision gate
Present the result and limitations to the customer. Seek a paid continuation or a concrete next step. Decide to:
- **Continue** if the customer validates the result and there is a credible paid path;
- **Narrow or pivot the wedge** if the pain is real but data, buyer or delivery economics fail;
- **Stop the candidate** if no meaningful problem, data rights or willingness to pay exists.

These are planning windows, not promises that customer access or validation will be achieved within 30 days.

## Required decision dashboard
Maintain one row per candidate and capture:
- Buyer and role; date and source of contact.
- Recent costly event and frequency.
- Current workaround and estimated cost, with evidence quality.
- Budget owner and purchase trigger.
- Data owner, rights, available fields and quality.
- Qualified reviewer and safety boundaries.
- Time to first result and full delivery hours.
- Independently reviewed findings, misses and uncertainty.
- Customer response and concrete commercial next step.
- Reasons to continue, narrow, pivot or stop.

## Operating rule
Every material strategic claim should be labelled **observed evidence**, **inference**, or **untested hypothesis**. Record material changes in GitHub. Never treat a roadmap, passing deployment status or polished UI as proof of product-market fit.

**Immediate next action:** create the candidate scorecard and begin buyer/problem discovery before expanding the feature set.
