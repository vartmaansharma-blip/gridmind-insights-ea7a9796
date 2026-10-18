# GridMind — Initial Commercial Wedge Scorecard

> **REFERENCE ONLY — superseded for execution on 2026-10-11.** The sole execution authority is [GridMind Master Plan](../gridmind-master-plan-2026-10-11.md); the sole live discovery tracker is [Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md). This document may preserve useful analysis, but its old schedules, candidate letters, gates, engineering priorities, and numeric targets are not active instructions. Use stable candidate IDs C1–C5 and the two-tier gates in the canonical files. Do not create another plan from this document.


**Date:** 2026-10-11  
**Status:** Five-opportunity desk comparison recorded; no candidate is validated and no numeric scores are assigned without buyer evidence.  
**Purpose:** Identify a credible first customer problem that can be delivered honestly with current resources and can expand into a larger industrial intelligence platform.

## Decision rule

Do not select a wedge because it is easiest to animate, sounds impressive, or has the largest theoretical market. Select a testable problem where a reachable buyer experiences a consequential recurring pain, relevant data can be accessed lawfully, and GridMind can produce a useful first deliverable without pretending unbuilt capabilities already exist.

Unknown is not zero. Each candidate must carry a confidence rating and an evidence trail. Do not calculate a meaningful weighted ranking until evidence exists for the inputs.

## Five candidate opportunities to compare

The five categories below replace the earlier three-bucket framing for current wedge selection. Procurement intelligence can return as a candidate if discovery uncovers a concrete, costly purchasing workflow, but it is not treated as directly equivalent to the five industrial problem families until narrowed to a specific category and buyer.

### A — Downtime / production loss
- **User / buyer hypotheses:** production manager, operations/plant manager, continuous-improvement lead; economic buyer may be plant leadership or the owner.
- **Possible first test:** reconstruct one closed stoppage or production deviation and test whether evidence reconciliation improves the current investigation.
- **Potential strength:** often maps to a concrete event and potentially material operating consequence.
- **Risks / unknowns:** downtime duration is not automatically lost profit; lost output may be recovered, demand may be absent, another constraint may dominate, and incumbent MES/OEE/maintenance processes may already suffice.
- **Critical evidence:** recent event, accepted cost method, current workflow bottleneck, actionable intervention, and credible baseline.

### B — Quality defects / scrap / rework
- **User / buyer hypotheses:** quality manager, production leader, process engineer; buyer authority must be confirmed.
- **Possible first test:** assemble a source-linked defect or rework case and identify missing/conflicting evidence for qualified review.
- **Potential strength:** scrap and rework can have traceable quantities and costs when records are reliable.
- **Risks / unknowns:** QMS/SPC systems may already solve the problem; false causal claims can be costly; records and identifiers may not align.
- **Critical evidence:** repeat pattern, cost calculation, data rights, qualified reviewer, and proof that GridMind adds more than a summary.

### C — Maintenance recurrence / reliability
- **User / buyer hypotheses:** reliability engineer, maintenance manager, maintenance/plant leader.
- **Possible first test:** compare one recurring failure's work orders, event timeline, corrective actions, and recurrence evidence against the existing workflow.
- **Potential strength:** a closed incident may permit a bounded retrospective test without autonomous control; work orders and maintenance history may provide a practical starting point if available.
- **Risks / unknowns:** records may omit physical context; root-cause analysis may require inspection or specialist judgment; CMMS/OEM workflows may already be effective.
- **Critical evidence:** repeated incidents, accessible authorized records, engineer review, and measurable reduction in review effort or improvement in evidence completeness.

### D — Energy / material inefficiency
- **User / buyer hypotheses:** energy/utility manager, operations leader, owner, process engineer.
- **Possible first test:** investigate one narrowly defined resource-use anomaly with operating context and a qualified reviewer.
- **Potential strength:** resource consumption can sometimes be measured and costed; recurring improvements may create measurable value.
- **Risks / unknowns:** meter and process data may be unavailable; normalization for product mix, output, shift, weather, tariff, and operating hours can be demanding; an energy audit or specialist may be better.
- **Critical evidence:** suitable meter/process context, defensible baseline, controllable intervention, and net value after implementation cost.

### E — Cross-functional decision / handoff delay
- **User / buyer hypotheses:** plant/operations manager, owner, continuous-improvement leader.
- **Possible first test:** map one real case from detection through investigation, approval, action, and closure; measure avoidable waiting and duplicate effort.
- **Potential strength:** may reveal gaps spanning several systems and teams, aligning with the long-term GridMind thesis.
- **Risks / unknowns:** too broad as a starting product; root cause may be authority, staffing, incentives, or management discipline rather than information; value attribution can be difficult.
- **Critical evidence:** named accountable owner, repeatable delay, measurable cost or risk, and a feasible process change GridMind can influence.

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
| Candidate | A / B / C / D / E |
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

The next meaningful evidence is a real recent problem narrative from a relevant buyer, paired with a practical data path, a credible comparison against current alternatives, and a specific next-step commitment. The five-opportunity desk comparison below is a prioritization of what to test—not a selection of the commercial wedge.


## Five-opportunity comparison — desk-based, not market validation

### Executive decision

**Do not declare a commercial winner from current evidence.** There are zero completed real customer interviews, no confirmed willingness to pay, no authorized factory data, and no measured GridMind outcome. A numeric weighted rank would create false precision.

The most defensible immediate experiment is **one human-reviewed retrospective investigation of a closed, real incident**, selected with a real factory professional and authorized records. The incident could involve downtime, maintenance recurrence, quality, or another category. This experiment tests evidence reconciliation, reviewability, time-to-useful-result, and current-workflow comparison without prematurely choosing the long-term market. It is an experiment design, not a claim that incident investigation is the best business.

### Relative desk assessment

| Candidate | Pain / economic measurability (hypothesis) | Data / first-test feasibility (hypothesis) | Differentiation challenge | Influence over outcome | Repeatability / expansion | Current evidence confidence | Validation priority |
|---|---|---|---|---|---|---|---|
| A. Downtime / production loss | Potentially high; actual recoverable margin can be hard to calculate | A closed incident may be reconstructable if logs and production context exist | High: MES/OEE, maintenance systems, engineers and consultants already address parts | Medium: depends on whether the cause and intervention are controllable | High potential across production and reliability, but only if cases share a repeatable workflow | Low; no buyer cases | High for discovery; do not equate downtime with financial loss |
| B. Quality defects / scrap / rework | Potentially high when quantities, rework, and disposition are recorded | Medium: QMS, production and lot records may be fragmented or sensitive | High: QMS, SPC, process engineering and traceability systems | Medium: root cause and corrective action may require specialist control | High potential across quality and supplier/process context | Low; no buyer cases | High if a qualified quality professional is reachable |
| C. Maintenance recurrence / reliability | Potentially meaningful when failures recur and corrective actions fail | Medium-to-high for a retrospective test if CMMS/work-order history exists; this is not verified | High: CMMS, OEM, reliability engineers and existing RCA practices | Medium: physical inspection, parts, skills and maintenance windows constrain action | High potential into asset context and recurrence tracking | Low; no buyer cases | High for the bounded retrospective experiment |
| D. Energy / material inefficiency | Potentially measurable, but normalized net savings are case-dependent | Medium-to-low until suitable meter/process data and operating context are confirmed | High: energy-management platforms, audits, controls vendors and specialists | Medium: requires an authorized intervention and qualified verification | Potentially high across assets/sites if normalization and deployment repeat | Low; existing data contract is only a candidate specification | Medium-high; advance if data access and buyer are readily available |
| E. Cross-functional handoff / decision delay | Consequence may be real but harder to isolate and attribute | Medium for mapping interviews; lower for proving economic impact | Very high: can become generic workflow software or consulting | Variable; authority, staffing and incentives may dominate | High theoretical breadth, but risk of becoming too broad | Low; no buyer cases | Lower as a standalone first wedge; use as a lens in every interview |

**Interpretation:** These qualitative judgments reflect problem mechanics and likely incumbent categories, not verified prevalence or demand. “High” in expansion potential is not a score for commercial attractiveness. Data feasibility remains unknown until a real case and authorized data owner are identified.

### Hard gates — any one can stop a candidate

A candidate cannot advance to a paid-offer test until:
1. A real buyer describes a specific recent problem and current workflow.
2. The consequence is calculated conservatively with sources, assumptions, and double-counting checks.
3. A named owner can influence the outcome and a qualified reviewer can assess the analysis.
4. The current alternative is mapped and GridMind's incremental benefit is testable.
5. A lawful, practical data path and an appropriate security review exist.
6. A baseline and outcome measure can be agreed before the test.
7. The likely customer value can exceed fees and adoption costs, and GridMind's delivery effort has a plausible economic path.
8. The buyer agrees to a concrete next step; compliments alone do not pass.

### The next experiment, step by step

1. Obtain a legitimate introduction to one operations, maintenance/reliability, or quality professional. A trusted adult/professional should support introductions as appropriate; do not request factory access or records at this stage.
2. Ask about the last real incident without pitching GridMind. Map trigger, current tools, roles, evidence, decision, action, consequence, and verification.
3. Ask which records would support a retrospective review, who controls them, and what permissions/security checks would be required. Do not accept confidential records until explicit organizational authorization and a safe handling path are established.
4. If the professional identifies a meaningful case and approves a suitable process, agree the reference assessment, success measures, and stop criteria before comparing outputs.
5. Compare current workflow versus GridMind-assisted review on total human time, source traceability, material omissions, unsupported claims, reviewer usefulness, and delivery cost.
6. Record what would falsify the opportunity. If an existing process is as good or better, recommend that process and move on.
7. After initial interviews, update each candidate's evidence, confidence, and unknowns. Select a wedge only when hard gates pass and a buyer takes a concrete commercial next step.

### What would change the prioritization?

- **Downtime rises** if repeated events have a defensible addressable cost, evidence is available, and investigation delay is the limiting factor.
- **Quality rises** if repeat defects have traceable costs and a qualified reviewer identifies a material evidence gap not handled by QMS/SPC.
- **Maintenance rises** if recurrence is common, records are usable, and teams cannot connect corrective actions to repeat failures.
- **Energy/material rises** if normalized resource-use data is accessible and a buyer can approve and verify an intervention.
- **Handoff delay rises** if a repeatable delay has an accountable owner and measurable consequences that GridMind can actually influence.
- **Any candidate falls** if a simple process fix or existing vendor solves the problem at lower total cost, data access is blocked, the buyer lacks authority, or GridMind cannot demonstrate incremental value.

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
