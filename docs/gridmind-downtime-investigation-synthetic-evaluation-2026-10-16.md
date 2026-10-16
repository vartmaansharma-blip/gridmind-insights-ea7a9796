# GridMind C1 Downtime Investigation — Synthetic Evaluation Fixture v1

**Status:** Supporting synthetic/offline evaluation only. Every site, event, timestamp, record and value is invented. This is not manufacturer evidence, an engineering assessment, a root-cause finding, customer validation or a financial-loss claim.

**Purpose:** Test whether GridMind can turn fragmented downtime records into a bounded, evidence-ranked decision without overstating causality or economic value. This fixture is the C1 comparator to the existing [C4 Economic Discovery fixture](gridmind-economic-discovery-synthetic-evaluation-2026-10-13.md).

**Canonical home:** This fixture supports §15 of the [Master Plan](gridmind-master-plan-2026-10-11.md). It does not select C1 or C4, authorize a product module, or change the discovery and customer-data gates.

## 1. Bounded synthetic case

| Field                  | Synthetic value                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Site / asset boundary  | `SYNTHETIC-PLANT-02`, packaging line `P-2`                                                                                       |
| Historical window      | One incident on 2026-09-17, plus a 30-day alarm summary                                                                          |
| Investigation question | What is established about the 62-minute stop, which explanations remain plausible, and what next check or decision is justified? |
| Decision owner         | Operations-manager role                                                                                                          |
| Evidence coordinator   | Maintenance-lead role                                                                                                            |
| Required reviewer      | Qualified plant/maintenance professional appropriate to the actual equipment and risk                                            |
| Allowed result         | Evidence-ranked explanation, explicit uncertainty and next discriminating check—or no residual gap                               |
| Forbidden result       | Automatic root-cause declaration, safety instruction, equipment-setting change, guaranteed prevention or verified-loss claim     |

The fixture deliberately omits the exact maintenance action used before restart. The investigation must not infer that action or recommend a technical intervention. Physical inspection, isolation, testing and restart remain under the customer's qualified personnel and safety system.

## 2. Synthetic incident timeline

| Time  | Record                                                            | Evidence ID | Initial interpretation                                                    |
| ----- | ----------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| 08:10 | Line recorded as running normally                                 | E02         | Pre-event state only                                                      |
| 08:12 | Operator later records intermittent abnormal noise                | E03         | Recollection; timestamp and meaning require confirmation                  |
| 08:14 | PLC event export records line stop and drive-overload alarm `A17` | E01         | Observed system event; alarm is not a root cause                          |
| 08:16 | Operator reset attempt is recorded as unsuccessful                | E03         | Shows persistence; does not distinguish mechanical/electrical causes      |
| 08:22 | Maintenance arrival recorded                                      | E04         | Response milestone                                                        |
| 08:28 | Material accumulation near a transfer point recorded              | E04         | Relevant observation; may be cause, consequence or coincidence            |
| 08:37 | Accumulation recorded as cleared                                  | E04         | Intervention milestone; exact procedure excluded                          |
| 08:42 | Restart attempt records `A17` again                               | E01, E04    | Weakens a single-obstruction explanation but does not rule it out         |
| 08:46 | Drive diagnostic snapshot preserved                               | E05         | Partial technical evidence requiring qualified interpretation             |
| 09:16 | Line recorded as running again after customer maintenance action  | E02, E04    | End of stop; action and causal effect are not established by this fixture |

**Calculated duration:** 09:16 − 08:14 = **62 minutes**. This calculation is valid only if the PLC clock, production record and event boundary are reconciled.

## 3. Evidence register

| ID  | Synthetic source           | Provenance / quality                                  | What it can support                                    | Limitation                                                   |
| --- | -------------------------- | ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| E01 | PLC event export           | System-generated; clock reconciliation not yet proven | Alarm sequence and PLC timestamps                      | Alarm code does not establish physical cause                 |
| E02 | Production/downtime record | System record; stop-category rules unknown            | Recorded line state and duration boundary              | May contain manual classification or rounding                |
| E03 | Operator note              | Named-role recollection entered after the event       | Observed symptoms and attempted response               | Recall and timestamp uncertainty                             |
| E04 | Maintenance work order     | Named-role operational record                         | Arrival, observations, milestones and recorded actions | Detail and terminology may be incomplete                     |
| E05 | Drive diagnostic snapshot  | Device output requiring competent interpretation      | Conditions captured at one moment                      | No continuous waveform or validated causal interpretation    |
| E06 | Prior 30-day alarm summary | Aggregated system export                              | Whether similar alarm codes recurred                   | Missing operating-hours denominator and event context        |
| E07 | Production plan            | Planning record                                       | Scheduled rate and intended run window                 | Plan is not proof of realized demand or unrecoverable output |
| E08 | Post-event observation     | Later operating record                                | Whether the line ran after restart                     | Short stable running does not prove the cause was removed    |

No record is silently upgraded from observation to causal proof. Raw source, timestamp, source clock, received time, authorized owner and transformations must remain traceable.

## 4. Competing explanations

| Hypothesis                                             | Supporting evidence                                                | Counter-evidence / gap                                                    | Status                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| H1 — Material accumulation increased drive load        | E01 alarm and E04 accumulation observation                         | `A17` recurred after clearing; origin of accumulation is unknown          | Plausible, not established                                        |
| H2 — Another mechanical load condition contributed     | E03 noise recollection, recurring alarm summary and failed restart | No qualified inspection finding links a mechanical condition to the event | Plausible, insufficient evidence                                  |
| H3 — Electrical/drive/control condition contributed    | Alarm recurrence after clearing and E05 snapshot                   | Snapshot has no qualified interpretation; no complete diagnostic record   | Plausible, insufficient evidence                                  |
| H4 — Multiple conditions formed one event chain        | Mixed sequence could fit obstruction plus another condition        | Sequence and dependencies are incomplete                                  | Plausible, not testable from current records                      |
| H5 — Record/classification error explains the incident | Clock/category rules are unverified                                | Physical stop and response are documented across sources                  | Relevant to duration/classification, not a full event explanation |

**Required conclusion:** the evidence supports a real recorded stop and several plausible explanations, but it does not establish a root cause. A qualified customer role must choose any physical or technical check under the site's safety process. GridMind may identify the evidence gap; it must not invent the answer.

## 5. Economic sensitivity without a loss claim

The synthetic production plan lists 480 conforming units/hour and an assumed contribution of ₹55/unit.

- Theoretical scheduled units during 62 minutes: 480 × 62 ÷ 60 = **496 units**.
- Illustrative gross contribution exposure: 496 × ₹55 = **₹27,280**.

This is a sensitivity calculation, not realized loss or recoverable value. It excludes schedule slack, inventory, downstream constraints, recovery production, scrap/rework, variable costs, order demand, customer penalties and whether the line would otherwise have run at the planned rate. A customer-facing economic claim is prohibited until the relevant records, counterfactual, calculation basis and reviewer approval exist.

## 6. Mutation tests and required behavior

| Test                                | Mutation                                                                                                       | Required behavior                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| C1-T01 — Clock skew                 | PLC clock is seven minutes ahead of the maintenance system.                                                    | Preserve both raw clocks; reconcile or express a time range. Do not create false event ordering.                                |
| C1-T02 — Missing PLC segment        | Events from 08:35–08:50 are absent.                                                                            | Mark the evidence gap and prevent a complete sequence or root-cause conclusion.                                                 |
| C1-T03 — Conflicting classification | Production log says “mechanical”; work order says “process jam.”                                               | Preserve both classifications and their owners; request reconciliation instead of selecting the convenient label.               |
| C1-T04 — Overlapping stops          | A downstream stop overlaps 18 minutes of this event.                                                           | Prevent double counting and state the allocation rule before calculating duration or exposure.                                  |
| C1-T05 — Changed production basis   | The planned rate belongs to another product family.                                                            | Reject the 496-unit calculation until a comparable rate and schedule are established.                                           |
| C1-T06 — Unsupported root cause     | Draft report says “the jam caused the failure.”                                                                | Reject causal wording; retain H1 as a hypothesis with counter-evidence and a discriminating evidence need.                      |
| C1-T07 — Unsupported financial loss | Draft report calls ₹27,280 “verified loss.”                                                                    | Reject the claim and retain only a labeled sensitivity calculation.                                                             |
| C1-T08 — Missing authority          | Records are supplied by someone who cannot authorize their use.                                                | Do not accept or process the records; record the authorization blocker.                                                         |
| C1-T09 — Reviewer disagreement      | Operations favors H1; qualified maintenance reviewer says evidence cannot distinguish H1–H3.                   | Preserve the dissent and issue an inconclusive result. Do not force consensus.                                                  |
| C1-T10 — Post-event confounder      | Several actions occurred before restart but the order/detail is incomplete.                                    | Do not attribute recovery to one action; list the missing sequence and evidence.                                                |
| C1-T11 — Biased recurrence rate     | Three alarms are counted without operating hours or coverage by shift.                                         | Do not calculate a failure rate or claim recurrence risk. Request the denominator and coverage.                                 |
| C1-T12 — No residual gap            | Customer records already contain a reviewed root cause, completed corrective action and accepted verification. | Return “existing process appears adequate / no residual GridMind investigation established.”                                    |
| C1-T13 — Safety boundary            | A requested next step would require physical inspection, isolation, testing or setting changes.                | Assign decision and execution to qualified customer personnel under site procedures; GridMind does not provide the instruction. |

## 7. Minimum investigation architecture tested by this fixture

The smallest shared architecture is a traceable chain, not a dashboard:

1. **Investigation case:** question, decision to inform, site/asset boundary, historical window, owner, status and stop conditions.
2. **Evidence item:** source owner, authorization, raw reference, timestamps/source clock, provenance, quality, permitted use, retention/deletion and access roles.
3. **Timeline event:** source-linked observed event with raw and reconciled time kept separately.
4. **Claim or hypothesis:** exact wording, evidence for/against, alternatives, uncertainty, next discriminating check and state.
5. **Calculation:** formula, units, inputs, counterfactual/baseline, exclusions and sensitivity; no missing value becomes zero.
6. **Review record:** reviewer role, challenge, correction, approval/rejection/dissent and unresolved limitation.
7. **Decision record:** customer-owned decision, rationale, responsible role and any approved next action.
8. **Outcome check:** expected measure/window, confounders and state—planned, implemented, observed, realized, verified or sustained.

Every customer-facing finding must resolve through those objects. Files, charts and AI summaries are views over the chain; they are not the source of truth.

## 8. Desk-test result

The mutation cases were walked through against the required behavior above. This is an internal specification test; it did not execute application code or include an independent domain reviewer.

| Test   | Desk-test outcome                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| C1-T01 | Pass: raw timestamps remain distinct and event order becomes a range until clocks are reconciled.           |
| C1-T02 | Pass: the missing PLC interval blocks a complete causal sequence.                                           |
| C1-T03 | Pass: both stop classifications remain attributed to their sources; neither is treated as truth by default. |
| C1-T04 | Pass: the 18-minute overlap is quarantined from economic aggregation until an allocation rule is approved.  |
| C1-T05 | Pass: the 496-unit sensitivity is withdrawn when the rate belongs to another product family.                |
| C1-T06 | Pass: the proposed jam root-cause statement is downgraded to H1 with counter-evidence visible.              |
| C1-T07 | Pass: ₹27,280 remains an illustrative gross sensitivity and cannot be called verified loss.                 |
| C1-T08 | Pass: missing authority is a hard intake stop.                                                              |
| C1-T09 | Pass: reviewer disagreement produces an inconclusive result rather than forced agreement.                   |
| C1-T10 | Pass: recovery is not attributed to any one undocumented action.                                            |
| C1-T11 | Pass: no recurrence rate is calculated without operating-hours and coverage denominators.                   |
| C1-T12 | Pass: an adequate existing process yields no residual GridMind investigation.                               |
| C1-T13 | Pass: physical or technical action remains with qualified customer personnel under site procedures.         |

| Check                                           | Result                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| Bounded question and decision                   | Pass in the synthetic specification                 |
| Evidence-to-timeline traceability               | Pass by design; not implemented in application code |
| Competing hypotheses and counter-evidence       | Pass in the desk walkthrough                        |
| Unsupported root-cause and loss claims rejected | Pass in the desk walkthrough                        |
| Inconclusive and no-residual-gap outcomes       | Pass in the specification                           |
| Independent plant/maintenance review            | Not performed                                       |
| Delivery time and reviewer cost                 | Not measured                                        |
| Manufacturer usefulness / willingness to pay    | Not tested                                          |
| Customer-data authorization                     | None; no customer data used                         |

This result validates only that the proposed method has the necessary decision and evidence boundaries for this invented case. It does not establish that C1 is a stronger market, that the hypotheses are technically correct, or that GridMind can deliver a real investigation safely or profitably.

## 9. C1/C4 comparison and decision

| Dimension            | C1 downtime fixture                                        | C4 energy fixture                                             | Architecture consequence                                                         |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Primary structure    | Event timeline and causal alternatives                     | Period comparison, units, tariff and baseline                 | Support both event and period evidence without forcing one model                 |
| Main failure risk    | False root cause and unsafe action                         | False comparability and unsupported savings                   | Claims require evidence, counter-evidence, reviewer state and prohibited wording |
| Economic estimate    | Counterfactual output and contribution are often uncertain | Rate/quantity/baseline and addressability are often uncertain | Keep gross sensitivity separate from realized/verified value                     |
| Reviewer need        | Plant/maintenance/process competence                       | Energy/tariff/process competence                              | Reviewer qualification is scope-specific, not a generic approval flag            |
| Current software fit | Limited                                                    | Higher because the prototype is energy-oriented               | Existing code is implementation context only, never demand evidence              |
| Commercial evidence  | None from this fixture                                     | None from the C4 fixture                                      | No wedge selected; interviews and buyer actions decide                           |

**Decision:** use the eight-object shared architecture for future workflow design. Do not implement a generic workbench yet. After buyer evidence selects a bounded test, implement only the selected case path from question through approved decision brief; keep the other fixture as a regression against architectural bias.

## 10. Next validation

Run one qualified, synthetic-only methodology critique for C1 and one for C4 using the same review questions and record actual effort. In parallel, use the existing discovery tracker to obtain buyer evidence. No customer-data intake or product build is authorized by this fixture.
