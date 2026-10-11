# GridMind — Initial Commercial Wedge Scorecard

**Date:** 2026-10-11  
**Status:** Framework created; candidates are not yet validated. No scores are assigned where supporting evidence is absent.  
**Purpose:** Identify a credible first customer problem that can be delivered honestly with current resources and can expand into a larger industrial intelligence platform.

## Decision rule

Do not select a wedge because it is easiest to animate, sounds impressive, or has the largest theoretical market. Select a testable problem where a reachable buyer experiences a consequential recurring pain, relevant data can be accessed lawfully, and GridMind can produce a useful first deliverable without pretending unbuilt capabilities already exist.

Unknown is not zero. Each candidate must carry a confidence rating and an evidence trail. Do not calculate a meaningful weighted ranking until evidence exists for the inputs.

## Candidates to investigate

### A — Operational-loss / constraint investigation
- **Hypothesis:** A plant or operations team loses time or output investigating recurring deviations, bottlenecks, or unexplained performance changes.
- **Possible buyer:** Operations manager, plant manager, continuous-improvement lead; confirm in discovery.
- **First-deliverable hypothesis:** A bounded, human-reviewed investigation brief that aligns customer-provided records, identifies what is observed versus hypothesized, and proposes checks for the responsible team.
- **Critical unknowns:** Whether the problem is frequent and costly enough; whether usable records are available; whether customers will share them; whether existing tools or internal teams already solve it; whether a small, manual-first deliverable is valuable.
- **Risk:** Without trustworthy data and domain review, the product could produce generic explanations or imply causality that has not been established.

### B — Procurement intelligence for one bounded category
- **Hypothesis:** A specific industrial buyer struggles to compare supplier, price, specification, lead-time, and availability information for a narrowly defined purchasing category.
- **Possible buyer:** Procurement/category manager or owner of a smaller industrial operation; confirm in discovery.
- **First-deliverable hypothesis:** A source-linked comparison and exception brief from permitted documents and customer-defined requirements, with missing fields clearly marked.
- **Critical unknowns:** Which category has recurring complexity; whether source data can be lawfully and reliably collected; willingness to pay; update burden; whether incumbent ERP/procurement systems already cover the need.
- **Risk:** Generic web aggregation is easily copied and may be stale; defensibility would require trusted workflow, verified sources, domain-specific normalization, or a differentiated distribution path.

### C — Narrow vertical operations workflow
- **Hypothesis:** One defined industrial sub-sector repeats a costly workflow that is poorly served by its current mix of spreadsheets, messaging, and general-purpose software.
- **Possible buyer:** To be selected only after a specific vertical and workflow are identified.
- **First-deliverable hypothesis:** A focused workflow tool or human-assisted service that captures one input, supports one decision, and records one measurable outcome.
- **Critical unknowns:** Which vertical/workflow has the strongest urgency; buyer access; operational variability; data permission; implementation and support burden; expansion path.
- **Risk:** “Vertical operations AI” is not a sufficiently specific market. It must be narrowed to a named user, triggering event, workflow, and measurable consequence before scoring.

## Weighted rubric

Score each criterion from 1–5 **only when evidence supports the score**. Record confidence (low/medium/high) and a source or observation beside each score.

| Criterion | Weight | What a strong score requires |
|---|---:|---|
| Problem severity and frequency | 20% | Multiple concrete recent examples; frequency and consequence understood |
| Economic consequence | 20% | Customer-grounded estimate or operational measure; calculation method explicit |
| Willingness-to-pay evidence | 20% | Budget/process evidence, paid pilot, or a specific credible commitment—not compliments |
| Access to customers and data | 15% | Identifiable reachable buyer and a lawful, practical path to relevant records |
| Credible first-delivery feasibility | 15% | A bounded deliverable can be produced with current skills/resources and explicit human review |
| Expansion potential | 10% | Adjacent workflows share buyer, data, distribution, or trust advantage |

**Weighted score formula:** sum of (criterion score ÷ 5) × weight. The result is a prioritization aid, not proof. Do not publish a rank while critical fields remain unsubstantiated.

## Evidence register (fill in after each conversation/test)

| Field | Record |
|---|---|
| Candidate | A / B / C |
| Interview date and participant role | |
| Triggering event / last real occurrence | |
| Current workaround and alternatives | |
| Frequency and consequence | |
| How consequence was estimated | |
| Existing spend / budget owner / procurement path | |
| Data available and permission constraints | |
| Why current alternatives fall short | |
| Minimum useful deliverable | |
| What would make the buyer distrust it | |
| Willingness-to-pay signal (quote/action, not interpretation alone) | |
| Evidence source and confidence | |
| Assumption most likely to invalidate the idea | |
| Next test, owner, and date | |

## Discovery interview guide

Ask about actual behavior before presenting GridMind or its prototype:

1. “Tell me about the last time this problem happened.”
2. “What triggered it, and who became responsible?”
3. “What did you do step by step to handle it?”
4. “How often has this happened recently?”
5. “What did it cost in time, delay, material, risk, or missed output? How do you know?”
6. “What tools, vendors, reports, or internal teams do you use now?”
7. “What still remains unresolved after using them?”
8. “Which records would someone need to investigate it? Who controls those records, and can they be shared?”
9. “Who owns the budget and approves a new solution? What would block a purchase?”
10. “What result would make a small first engagement worth paying for?”
11. “What evidence would you require before trusting the result?”
12. “May we follow up with a narrowly defined proposal or test?”

Avoid leading questions such as “Would you use AI for this?” or “Would this save you money?” Hypothetical enthusiasm is weak evidence. Record the person's actual recent behavior, existing spend, access constraints, and next-step commitment.

## Provisional test sequence

1. Identify reachable people who match the plausible buyer roles; do not invent interview results or imply access that is not confirmed.
2. Conduct comparable problem interviews across A, B, and C where access permits.
3. After each interview, update evidence and confidence; revise candidate definitions if they are too broad.
4. Test the riskiest assumption for each candidate before building a product-specific capability.
5. Produce a ranked scorecard only when evidence is sufficient to explain each score. Keep “not known” visible.
6. Draft a first-offer brief for the leading candidate and seek a concrete next step (data review, scoped pilot discussion, or paid engagement) before declaring demand validated.

## Current conclusion

**No commercial wedge is selected.** This document creates a disciplined way to learn; it is not market research and does not establish customer demand, willingness to pay, data access, or a defensible moat.

The next meaningful evidence is a real recent problem narrative from a relevant buyer, paired with a practical data path and a specific next-step commitment.


## Commercial economics gate — required before choosing a wedge

**Reason for this gate:** a product can solve a real problem and still be a bad business if the value created is too small relative to the customer's effort to adopt it and GridMind's cost to sell, deliver, and support it. The concern that a factory might save only ₹2,000–₹3,000 per month is therefore a serious viability warning, not a minor pricing question.

A ₹2,000–₹3,000 monthly benefit is generally a weak basis for a high-touch industrial enterprise offer: even a modest fee, staff time, onboarding, procurement, and support can consume the benefit. It is not an automatic rejection in every business model. It might work if delivery and acquisition costs are exceptionally low, the workflow is highly self-serve, usage can be aggregated at scale, or the verified benefit is larger than the first estimate. Those conditions must be demonstrated, not assumed. Do not set a universal minimum savings threshold before understanding the buyer and business model.

### 1. Calculate customer value conservatively

For every candidate, estimate a range (low / base / high) and show the evidence behind each input.

- **Baseline:** what happens today, using the buyer's current process and existing tools.
- **Gross problem cost:** direct and indirect cost of the recurring problem (for example, documented downtime, scrap, expediting, rework, investigation hours, or avoidable delay). Avoid double-counting overlapping costs.
- **Incremental value attributable to GridMind:** only the part plausibly caused by the proposed deliverable, after accounting for what the customer already does and what other changes are required. Separate measured facts from assumptions.
- **Frequency:** how often the problem occurs, how many sites/lines/users experience it, and whether the value is recurring or episodic.
- **Confidence and realization:** probability the improvement can actually be achieved, time to realize it, and who must act on the output.
- **Customer adoption cost:** implementation, data preparation, integration, staff time, training, workflow change, approvals, security review, and ongoing operating effort.
- **Customer net benefit:** conservative incremental value minus the fee and adoption/operating costs.
- **Buyer hurdle:** the minimum return, payback period, risk reduction, or strategic value the specific budget owner requires. Ask the buyer; do not invent it.

Use explicit calculations, such as:

- Annualized incremental value = conservative verified value per occurrence × credible occurrences per year, adjusted for attribution and realization.
- First-year customer net benefit = expected incremental value − GridMind fees − one-time implementation/adoption costs − customer-side ongoing costs.
- Customer ROI = (expected incremental value − total customer costs) ÷ total customer costs.
- Payback period = one-time adoption costs ÷ credible monthly net benefit after recurring fees and operating costs.

If a term cannot be estimated credibly, mark it **unknown** and state what evidence would resolve it. Do not turn illustrative assumptions into claims.

### 2. Calculate GridMind delivery economics

A valuable customer problem is not sufficient if GridMind cannot serve it profitably.

For each candidate, estimate:
- one-time sales and qualification effort;
- onboarding and implementation hours;
- expert/domain-review hours per delivery;
- ongoing support and account-management time;
- data acquisition, hosting, inference, integration, and third-party costs;
- rework, error handling, and quality-assurance effort;
- expected contract value and payment timing;
- renewal/retention logic and the frequency at which value recurs;
- whether delivery becomes more efficient with each customer or stays bespoke.

Track the following separately:
- **Gross profit per customer** = revenue − direct delivery and support costs.
- **Gross margin** = gross profit ÷ revenue.
- **Contribution after acquisition** = gross profit − customer acquisition cost, using a stated period and allocation method.
- **Founder bottleneck:** hours of specialist/founder effort required per customer and whether that burden can plausibly scale.

Do not claim attractive margins or scalability until the cost drivers are observed in a real or transparently simulated delivery run. Label estimates and assumptions.

### 3. Illustrative examples — arithmetic only, not market evidence

These examples show why small nominal savings can fail commercially. They are hypothetical and do not represent GridMind customer results or industry benchmarks.

- **Weak economics:** a proposed workflow appears to create ₹3,000/month in incremental value, while the fee is ₹2,000/month and customer-side adoption/operating effort costs another ₹1,500/month equivalent. The buyer's estimated net benefit is negative (₹3,000 − ₹2,000 − ₹1,500 = −₹500/month), before uncertainty. Do not sell this as a savings product.
- **Potentially viable, pending proof:** a recurring problem is credibly estimated to create ₹1,00,000/month of addressable cost, but only 20% is realistically attributable to the intervention. The expected incremental value is ₹20,000/month before GridMind fees and adoption costs. Viability still depends on confidence, buyer hurdle, delivery cost, and willingness to pay; the gross problem cost is not the product's value.
- **High-value but poor GridMind business:** a customer could benefit materially, but each delivery needs many days of bespoke expert work and expensive integrations. The opportunity may support a consultancy but not yet a scalable software business. Test packaging, repeatability, and delivery cost before calling it SaaS.

### 4. Hard decision rules

A candidate cannot pass the commercial gate merely because it has a large theoretical market or an impressive demo.

**Pass to a scoped offer test only when:**
1. A named buyer describes a recent, concrete problem and its current workaround.
2. Frequency and economic consequence are estimated with a transparent method and conservative range.
3. The likely incremental value is material against the buyer's fees, adoption burden, and required return.
4. A lawful, practical data path and a credible delivery process exist.
5. The budget owner, purchase process, and a real next step are identified.
6. GridMind's delivery and support burden has a plausible route to sustainable margins.
7. The buyer gives a behavioral willingness-to-pay signal (for example, agreeing to a scoped paid-pilot discussion, sharing permitted sample data, or involving the budget owner)—not just praise.

**Reject, narrow, or redesign when:**
- the benefit is only a few thousand rupees per month and the offer requires high-touch enterprise selling or implementation, unless a specific low-cost/aggregate model is evidenced;
- the value is mostly theoretical, cannot be attributed, or depends on unsupported causal claims;
- the issue occurs too rarely to support recurring revenue and no appropriate project-based model exists;
- the customer can solve it adequately with existing tools at lower total cost;
- data access, domain review, or customer action makes the promised result impractical;
- cost-to-serve consumes the likely contract value.

### 5. Add these fields to every evidence-register entry

| Field | Record |
|---|---|
| Conservative incremental value per event / month / year | |
| Evidence source, calculation, range, and confidence | |
| Frequency and recurrence pattern | |
| Share plausibly attributable to the proposed intervention | |
| Customer fee tolerance and buyer's required return/payback | |
| One-time and ongoing customer adoption costs | |
| Existing alternative cost and performance | |
| GridMind sales/onboarding/delivery/support cost estimate | |
| Direct cost, gross profit, gross margin, and assumptions | |
| Recurring revenue rationale vs one-off project rationale | |
| Unit-economics failure condition | |
| Next evidence needed and owner/date | |

**Updated conclusion:** no candidate passes this gate yet. There are no real customer economics, interviews, pricing commitments, or delivery-cost observations recorded in this document. The gate is a framework for collecting them, not evidence that the opportunity is viable.
