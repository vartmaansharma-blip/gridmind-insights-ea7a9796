# GM-MVP-003 — First Indian manufacturer retrospective case packet

**Status:** Prepared; **no customer engagement, consent, professional review, permissioned real evidence, payable offer or commercial winner established**. This is a one-case preparation method extending [canonical Master Plan §7](../gridmind-master-plan-2026-10-11.md), the [sole Buyer Discovery Sprint](../gridmind-buyer-discovery-sprint-2026-10-11.md), [merged physical + owner integration #173](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/173), and [India-first commercial MVP #171](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/171). Do not treat this as an independent roadmap, private evidence ledger or customer authorization.

## The one question this pilot must answer

**On one historical manufacturing decision, did GridMind identify a feasible, permitted and commercially relevant action at a point when the manufacturer's actual existing staff/Excel/ERP process did not—and could that advantage repeat at a delivery cost a customer would pay for?**

A successful retrospective is **not** proof a stopped machine was caused by power, an order was permanently lost, a material shortage was avoidable, that an alternative machine was qualified, or that GridMind could change the decision window. Compare **two competing hypothesis lanes on one bounded historical case**, not two preselected products:

- **B: Production readiness/interruption** — machine or specialized material unavailable, order and due-date consequences, source/time of awareness, actual available and authorized alternative. Primary test if the incident is suitable.
- **A: Finishing/quality** — same part/process where possible; distinguish **required production finishing** from repeat finishing, rework, scrap and defect-related repeat operations. Only pursue if the same source packet can support a fair comparison; otherwise **mark A incomparable**, not a worse product.

This does not select B as the paid commercial winner. Ask which path changed a real controllable decision compared with incumbent practice; record disconfirming evidence.

## Stage 0 — non-confidential fact confirmation (can proceed without private operational uploads)

The founder or a responsible adult authorized for outreach asks the already identified proposed factory contact for **one retrospective discussion**, not a current sales or data-use agreement. Do not cite guessed savings, customer identity or implied paid acceptance.

Suggested request: *“We are investigating whether operational records can make one historic machine/material interruption easier to resolve. Could we review a non-confidential outline of one incident and how your team handled it, including whether any better action would actually have been possible? We will not collect plant records without a separate permission and secure handling arrangement.”*

Ask and document **only** non-confidential answers to:

1. Which broad process and part family; what was the problem, and when could management actually act?
2. Was there a specific customer order or promise at risk? What was the actual consequence, including eventual recovery if applicable?
3. Who knew what at which times? How was the root cause established or left unknown?
4. Which alternatives—approved stock, supplier, machine, routing, shift or customer negotiation—were genuinely feasible, within contractual/quality/safety restrictions?
5. What did the factory actually do using people, Excel, ERP/MRP/QMS and existing suppliers? What decision did the process produce, and how long did it take? **Do not confuse effort estimate with measured time**.
6. If an engineer presented the same GridMind output then, would that have changed a decision? What information would already have been known? Would another screen add work instead?
7. Are there repeat incidents, and who can authorize scoped records, choose a competent independent reviewer and buy a review/pilot?

**Do not record identifiable customer, part, supplier, contract, price, plant, invoice or employee data in this public repository, chat previews, unapproved cloud tools or our synthetic API.** Actual meeting date/role/permission and evidence category belong **only** in the Buyer Discovery Sprint after the event, with identifiers in an approved private system if/when one exists.

## Stage 1 — authorization before any real data

**Non-negotiable dependencies:** written authorization covering one incident, defined purpose/data categories, permitted users/processor, confidentiality, secure custody, retention/deletion and revocation; technical owner/tenant identity; reviewer competence and independence; release gate [#29](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/29) for populated Auth/tenant controls; [#130](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/130) for production migrations/recovery; #150 wherever its bootstrap permissions matter. A customer's verbal openness **alone** is not permission to paste records into GitHub, ChatGPT, Google Sheets, email or public synthetic workspaces.

Until those gates pass, use **fictional records only** to rehearse format, source links, validation and the review presentation. Owner provides business context; a relevant manufacturing engineer checks method and physical assumptions; an electrical specialist is separately needed if attributing faults to power infrastructure.

## Stage 2 — exact minimal record manifest once authorized

| Requirement | Record or question | Falsification / stop condition |
| --- | --- | --- |
| Scope | Part/revision, process/routing, operation, broad plant area, decision cutoff time | Missing part or cutoff prevents the as-of reconstruction |
| Incident | Time-stamped stop/shortage reports, source origin, actual first awareness, any revisions or contradictory clocks | 'Occurred' without reliable chronology is not advance warning |
| Order | Work order quantity/unit, engineering revision, confirmed obligation/due date and relevant planned operation | A downstream order must be linked by routing, not shared product name |
| Resources | Equipment identity, actual operating state, capability qualification, tooling, approved substitutes, shift availability | Common machine model does not prove site-specific substitution |
| Materials | Approved supplier/grade, lot status/reservation and BOM units at the cutoff | Later-arriving stock cannot be counted as earlier availability |
| Constraints | Actual customer/OEM specifications, safety, quality releases, contractual source rules, who can grant exceptions | Higher margin or owner preference cannot waive prohibitions |
| Options | Exactly what could be approved/executed before cutoff and by whom | If no feasible action existed, there may be nothing software could improve |
| Current baseline | Contemporaneous human/Excel/ERP/MRP/QMS record, investigation elapsed time, actual action/reviewer | Reconstructed retrospective Excel guess is not a valid baseline |
| Result | What happened, shipments/rework, and where causality is uncertain | Threatened orders are not automatically lost sales or savings |
| Finishing lane | Mandatory/repeated finishing classification, defects, dispositions, work time, engineering route | Necessary finishing is not preventable waste |
| Review and buyer | Domain reviewer, commercial decision-maker, recurrence, actual pilot terms/acceptance | No actual buyer or expert → cannot label paid pilot validated |

Retain original time zones, units, document revisions and correction histories. Evidence statuses must distinguish **missing / reported / source-linked / contradictory**. A digital record's SHA-256 proves integrity only, not who created it or whether it is true.

## Stage 3 — side-by-side historical experiment

For the *same* order, cutoff and original information set, fill the table below **only from actual authorized material after Stage 1**. No invented improvement claims.

| Test measure | Current staff/Excel/ERP | GridMind | Decision rule |
| --- | --- | --- | --- |
| First accurate identification of blocked operation | Unknown until observed | Unknown until verified | Compare same information and clock |
| Time and human effort spent | Unknown | Unknown | Count all source cleaning, expert and review time |
| Correct feasible alternatives before cutoff | Unknown | Unknown | Engineer confirms capability, contract and authority |
| False positives / missing critical facts | Unknown | Unknown | Any unsafe claim blocks result |
| Actual decision changed | Unknown | Unknown | Different report wording is not incremental value |
| Repeated incidents and delivery cost | Unknown | Unknown | One retrospective does not establish recurring revenue |
| Willingness to pay | Not confirmed | Not confirmed | Document genuine priced acceptance/refusal, not predicted value |

**Possible conclusions:** `narrow_product_test`, `inconclusive_more_evidence`, `reject_no_incremental_value`, `stop_safety_or_permissions`. Never infer commercial willingness merely from a clean technical demo. Record actual findings **only in the canonical Buyer Discovery Sprint**.

## What engineering can reproduce today without customer data

The typed validator in `src/lib/industrial-core/retrospective.ts` returns missing, unverified and contradictory requirements **separately for A and B**. A fixed synthetic preparation scenario reuses `runPhysicalScenario("machine_stop")` and the merged owner/physical industrial engine, traces one fictional affected order, and explicitly returns:
- missing real decision window, current staff/Excel/ERP baseline, feasible authorized alternative, actual outcome and independent reviewer;
- no access to real customer data, no paid customer, no verified savings, no selected commercial winner;
- no new ERP, scheduling algorithm, solver, live customer API or database mutation.

The validator **accepts only strictly typed fictional records** and permits neither real-customer origin nor forged commercial permission. Its `sourceCompleteInFiction` result is only a sample specification completeness check; it must **never** be shown as a permission to ingest data or a real-world domain accuracy score.

## Human staffing and next actionable handoff

**First expert to secure:** One part-time qualified metal-component production/quality practitioner capable of reviewing order routing, material eligibility, line substitution and as-of constraints, with independence/conflict recorded. An experienced technical lead is needed for the future permissioned connector and security review, but not to manufacture historical proof out of synthetic data. If power-causation questions are integral, recruit a competent electrical professional separately.

**Founder-facing next action:** Arrange a *single* non-confidential owner discussion using the existing owner-confirmation packet. State that no records will be uploaded and no obligation to pay exists at this step. This meeting has **not** happened merely because this code/document was merged.

**Engineering next action:** Independently verify tenant and production migration release gates (#29/#130), define the smallest authenticated case-capture path only after appropriate data handling decisions, and compare one actual authorized historical incident with the factory's current method. If no actionable incremental benefit survives, do not ship a paid offer.
