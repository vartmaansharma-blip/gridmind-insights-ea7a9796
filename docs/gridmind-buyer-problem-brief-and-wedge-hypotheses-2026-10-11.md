# GridMind Buyer / Problem Brief and Wedge Hypotheses

**Date:** 2026-10-11  
**Status:** Working hypothesis for discovery — NOT customer-validated and NOT authorization to claim deployed capability.  
**Authority:** The Decision Constitution controls if any statement here conflicts with it.

## 1. Working recommendation

Start discovery with **industrial operations teams investigating recurring, measurable losses or constraints in one bounded process**. Do not yet sell GridMind as a universal industrial-intelligence platform. Do not declare energy optimization the winning wedge.

Why this is the lead hypothesis:
- The problem can be framed around a concrete operational decision, rather than a vague promise to “use AI.”
- Potential value can be tied to a baseline and later measured, if suitable data and a qualified reviewer exist.
- The work can begin as evidence-backed investigation and decision support without autonomous control.
- The same core workflow—contextualize evidence, investigate, estimate impact, review, measure—may generalize later, but reuse must be demonstrated rather than assumed.

This is a discovery priority, not proof of market demand. It should be replaced if interviews, data access, economics, or delivery effort show a better wedge.

## 2. Initial ideal customer profile (ICP) hypothesis

**Company:** A manufacturing/industrial site with a recurring operational process, measurable production or resource data, and a team accountable for performance.

**Initial champion / daily user:** Plant operations manager, process-improvement leader, or site energy/utility manager—depending on the selected loss category.

**Economic buyer:** Plant manager, operations director, or business-unit leader with authority over improvement spend. Finance may need to validate the economics.

**Required reviewers:** Process/engineering expert and the owner of the relevant data; IT/OT or security reviewer before any connection to controlled systems.

**Not the initial target:** Every factory, small businesses with no usable operational records, safety-critical autonomous-control use cases, or enterprises requiring broad integration and long procurement before a narrow test can run.

These role and company assumptions need discovery. Do not assume a site has authority, budget, instrumentation, or usable records merely because it is industrial.

## 3. The problem to test

**Problem statement hypothesis:**  
“When an industrial process repeatedly misses expected performance, responsible teams must reconcile information spread across operational records, measurements, maintenance notes, and local knowledge. They may struggle to distinguish the real constraint from symptoms, estimate its economic significance, and determine whether an approved change actually improved the result.”

This is intentionally a hypothesis. It is not a claim that every factory has this problem, that current tools cannot solve it, or that GridMind already resolves it.

### Trigger event
A recent recurring deviation, bottleneck, abnormal consumption pattern, quality loss, downtime issue, or unexplained cost that has prompted an investigation.

### Job to be done
Help a qualified team answer:
1. What happened, and what evidence supports that description?
2. Which explanations remain plausible, and what evidence would distinguish them?
3. What is the estimated operational/economic significance, with assumptions exposed?
4. What action, if any, should a qualified person consider?
5. After an approved change, did the outcome improve against a defensible baseline?

### Current alternatives to investigate
Spreadsheets, historians/SCADA/MES/ERP reports, BI dashboards, maintenance systems, consultants, manual root-cause analysis, and local operator expertise. These are not presumed inadequate; discovery must learn where they work and where the gap remains.

## 4. Candidate wedge comparison

Scores are provisional reasoning aids (1 = weak, 5 = strong); they are NOT market evidence. Scores should be replaced by evidence from buyer conversations, sample-data feasibility, and delivery estimates.

| Criterion | Weight | Operational-loss / constraint investigation | Procurement intelligence for one category | Narrow vertical operations workflow |
|---|---:|---:|---:|---:|
| Pain is consequential and recurring | 15% | 4 | 4 | 4 |
| Baseline and outcome are measurable | 15% | 4 | 4 | 4 |
| Data likely available with permission | 15% | 3 | 3 | 3 |
| Time to a useful first result | 15% | 3 | 4 | 3 |
| Buyer/champion identifiable | 10% | 4 | 3 | 3 |
| Plausible willingness to pay | 10% | 3 | 4 | 3 |
| Delivery scope can be bounded | 10% | 3 | 4 | 3 |
| Repeatability / future expansion | 10% | 4 | 3 | 4 |
| **Weighted directional score / 5** | **100%** | **3.55** | **3.70** | **3.40** |

**Interpretation:** Procurement intelligence narrowly leads this unvalidated scorecard, while operational-loss investigation is the lead discovery conversation because it aligns with GridMind's evidence-to-outcome thesis. The difference is not meaningful enough to choose a permanent wedge. A single fatal blocker—no buyer access, no lawful data, no credible baseline, or unmanageable implementation burden—can override a numerical score. Do not treat these scores as validated findings.

### What each candidate means in practice
- **Operational-loss / constraint investigation:** one site, one process, one recurring deviation, one bounded decision, read-only authorized data where possible.
- **Procurement intelligence:** one spend category and a defined question such as price variance, supplier performance, or specification/volume mismatch; requires reliable purchasing and specification data.
- **Narrow vertical workflow:** one clearly defined process and user group, chosen only after interviews show a repeated, urgent workflow gap.

## 5. Minimum evidence needed

### Data
For the chosen case, establish the data owner, lawful access/permission, time range, units, sampling rate, missingness, context fields, event labels, and whether records can be reconciled. Start with a minimized, read-only sample. No customer data should be uploaded or connected without explicit authorization and required security review.

### Baseline
Define the metric before evaluating the result: formula, unit, measurement window, comparison period, known confounders, and who signs off. A plausible estimate is not a verified saving. Avoid double counting and distinguish gross opportunity from realizable net value.

### Trust
Every finding should identify source evidence, timestamp/window, transformations, assumptions, uncertainty, alternative explanations, and the reviewer. Label claims as observation, inference, hypothesis, recommendation, approved action, measured result, or verified outcome.

### Feasibility
A narrow prototype should be able to ingest an authorized sample, validate it, expose data-quality limitations, produce a traceable analysis, support qualified review, and export a decision record. If any essential stage is missing, mark it as a prototype limitation instead of implying end-to-end product readiness.

## 6. Initial offer hypothesis

**Offer:** A bounded, evidence-led operational investigation for one defined process/question, delivered with the customer’s qualified team. It identifies what the data can and cannot support, estimates the possible significance with explicit assumptions, and proposes what to validate next. Any intervention remains customer-approved; value is reported as verified only after measurement.

**Pilot shape to test, not promise:** One site, one process or spend category, one primary question, one agreed baseline, a defined authorized data sample, named customer reviewer, written success criteria, and a time-boxed review. The exact duration, fee, and data requirements must be set after learning the workflow and estimating delivery effort.

**Do not promise:** guaranteed savings, fully autonomous optimization, universal factory compatibility, immediate integrations, accuracy rates without appropriate evaluation, or production readiness not established by testing.

## 7. Discovery questions

Ask about a recent event rather than asking whether someone “likes AI”:
1. Tell me about the last time this process underperformed or a decision was delayed. What happened?
2. What did you do first, and which systems/files/people were needed?
3. How long did it take? What remained uncertain?
4. What was the consequence, and how was it calculated?
5. What evidence would have changed the decision sooner?
6. Which data exists, who owns it, and what permission is required to examine a small sample?
7. Who must trust/review the finding, and who can approve spend or action?
8. What solution have you already tried? Why did it work or fail?
9. What would make a small pilot a clear success or a clear failure?
10. Would you allocate staff time, provide an authorized sample, introduce the budget owner, or pay for a bounded test? What would prevent that?

Do not lead the interview toward the GridMind answer. Record disconfirming evidence and the respondent’s actual words.

## 8. Decision gates

### Gate A — Continue discovery
At least several relevant conversations reveal a specific recent problem, a clear owner, an existing workaround, and a plausible measurable consequence. This is directional learning, not statistically representative validation.

### Gate B — Run a data-feasibility test
A data owner can authorize a minimized sample; a qualified reviewer can define expected results; the baseline and units can be understood; security/privacy review permits the proposed method.

### Gate C — Offer a bounded pilot
A named buyer/champion, reviewer, data permission, written scope, success criteria, delivery estimate, and commercial next step exist. Do not equate verbal enthusiasm with buying intent.

### Gate D — Decide
At the end of the discovery cycle, choose GO / NARROW / PIVOT / STOP based on evidence. If buyer access or data access is absent, record it as an unresolved blocker rather than fabricate validation.

## 9. Unknowns that must remain visible

- Which industrial sector and geography provide the most accessible first buyers?
- Which specific operational or procurement problem is both urgent and measurable?
- What usable data can a customer lawfully share?
- How much work is manual versus reliably automatable?
- What level of evidence will the buyer accept?
- What can the current GridMind code actually execute end-to-end today?
- What is a buyer willing to pay for, and who owns that budget?
- How long will security, IT/OT, and procurement approvals take?

## 10. Immediate next actions

1. Prepare a list of target-relevant people who can discuss a real industrial workflow; use warm introductions where legitimately available.
2. Conduct problem interviews and record evidence without identifying customers publicly unless authorized.
3. Request no raw data until permissions and a secure handling plan are clear.
4. Compare the three wedges using observed facts; update the scorecard with evidence and confidence.
5. Audit the current code against the exact smallest workflow implied by the leading candidate.
6. Only then choose a creative website concept that explains the proven problem and the capability GridMind can honestly demonstrate.
