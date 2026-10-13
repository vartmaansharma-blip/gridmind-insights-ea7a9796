# Strategic Problem Register Reconciliation — 2026-10-12

> **Status: point-in-time audit; not a competing execution plan.** The uploaded source, “The complete strategic problem register,” contains **34 numbered problems**, not 30. This crosswalk preserves its numbering and titles. The canonical execution authority remains [GridMind Master Plan](gridmind-master-plan-2026-10-11.md); the sole live customer-discovery tracker remains [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md); durable decisions remain in the [Decision Constitution](gridmind-decision-constitution-and-contradiction-register-2026-10-10.md) and [Problem-Solving Constitution](gridmind-problem-solving-constitution.md).

## Audit method and status meanings

Statuses describe the evidence currently visible in `main`, canonical documents, recent commit history, and open PR metadata. They do not claim a full code audit or fresh external-system verification for every row.

- **Documented on main** — a relevant decision or control exists in canonical committed documentation; completion criterion may still require a consistency check.
- **Partially addressed** — some supporting work exists, but the original completion criterion is not met.
- **Open — evidence required** — the problem depends on real customer, buyer, delivery, or market evidence that is not established.
- **Open — implementation/verification required** — code, operational tests, expert review, or production-readiness evidence remains outstanding.
- **Conditional/deferred** — deliberately postponed until an upstream dependency is resolved; not considered solved.

A commit or document mention is not proof that the business problem is solved. Open PRs are not counted as merged work. No customer interview, authorized customer data, pilot, revenue, or verified savings is claimed.

## Current baseline

- Current `main` head inspected: `5fd6402c7f37c66035cc4d4d2e9cf15f7fa4c273` (2026-10-12).
- Relevant merged commits include `726536c2` (problem-solving constitution), `17fb1d42` (link constitution from repository guide), `87eeaaac` (repository operating standards), and `5fd6402c` (agent instructions aligned with repository authority).
- Canonical strategy documents were fetched from `main`: master plan, buyer-discovery sprint, decision constitution, problem-solving constitution, and documentation index.
- Relevant open PRs at audit time: [#47 preservation-first rules](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/47), [#41 workspace/security hardening](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/41), [#38 discovery/offer/tariff reconciliation](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/38), [#37 equipment metadata round-trip](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/37), [#36 migration history alignment](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/36), [#31 demo opportunity states](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/31), [#14 intake provenance/economic completeness](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/14), [#6 pilot readiness documentation](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/6), and [#2 truthful screening claims/regression gates](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/2). Their presence does not imply merge or completion.
- The master plan explicitly leaves the commercial wedge undecided. C1 (downtime/production-loss investigation) and C4 (energy/material inefficiency) are discovery probes, not selected products.
- The next commercial decision gate in the canonical master plan is 2026-11-10. This audit does not replace that gate or create another schedule.

## Problem-by-problem crosswalk

| # | Original problem | Priority in source | Current status | Evidence / remaining gap |
|---:|---|:---:|---|---|
| 1 | Our definition is ambitious but not yet operationally precise | P0 | **Partially addressed** | Working company definition is documented in the strategy and problem-solving constitution. Verify that product, offer, sales claims, and roadmap consistently trace to this purpose; the initial offer remains deliberately open. |
| 2 | We have not established the boundary between intelligence and execution | P0 | **Partially addressed** | Human-reviewed analysis, customer-authorised action, and outcome verification are described in canonical strategy. Verify the actual workflow and responsibility boundaries before any real-world use. |
| 3 | We are at risk of designing for an imagined future rather than a real customer | P0 | **Documented on main** | Discovery-first strategy is canonical; broad product redesign is parked. Keep implementation subordinate to the validated initial workflow. |
| 4 | Our moat is still a hypothesis | P0 | **Open — evidence required** | Potential advantages are described, but customer-valued differentiation, lawful learning rights, and cumulative advantage are unproven. |
| 5 | We have not selected the initial problem | P0 | **Open — evidence required** | C1/C4 are probes only. No customer evidence supports selecting a commercial wedge. Compare candidates without assigning invented scores to unknown inputs. |
| 6 | Our ideal customer profile is not sufficiently narrow | P0 | **Partially addressed** | Adityapur–Jamshedpur independent automotive-component manufacturers are a geography/segment hypothesis, not a validated ICP. Validate process, size/complexity, loss type, access, and testability. |
| 7 | We have not identified the actual economic buyer | P0 | **Open — evidence required** | Buyer-role hypotheses are documented; no confirmed problem owner, technical authority, economic buyer, or purchasing path. |
| 8 | We lack customer-specific evidence | P0 | **Open — evidence required** | Public research and outbound outreach are not customer validation. Master plan reports no completed customer conversations or authorized customer data. |
| 9 | We have not established whether the problem is painful enough to justify buying | P0 | **Open — evidence required** | No customer-specific frequency, consequence, unresolved gap, urgency, or willingness-to-act evidence. |
| 10 | We do not understand the customer's current alternatives deeply enough | P0 | **Partially addressed** | Candidate alternatives are listed in strategic research. Need a real workflow-level comparison and evidence of any material residual gap. |
| 11 | We have not mapped the competitive landscape by function | P0 | **Partially addressed** | Desk research and reference analyses exist, but there is no complete, current, source-backed matrix proving an underserved gap. |
| 12 | Our differentiation is phrased as a feature, not yet a customer advantage | P0 | **Open — evidence required** | Candidate benefits exist; no measured baseline comparison establishes improved time, quality, action ownership, or verification. |
| 13 | Our market-size thesis is not yet credible | P1 | **Open — evidence required** | No defensible TAM/SAM/SOM tied to a selected segment, credible pricing, and delivery capacity. Do not substitute broad MSME counts. |
| 14 | We have not decided how much of the business should be service versus software | P0 | **Partially addressed** | Service-led, software-assisted delivery is the working recommendation and aligns with on-site intent. Commercial fit, repeatability, and economics remain unvalidated. |
| 15 | The initial offer is not yet sufficiently defined | P0 | **Partially addressed** | Discovery offer is defined: a 20-minute incident conversation and optional one-page workflow/decision map from voluntary verbal information. A paid/technical offer remains unvalidated and must not be misrepresented as an audit or diagnosis. |
| 16 | Pricing is not grounded in delivery economics | P0 | **Open — evidence required** | Any prior ₹15,000 concept is unvalidated. No verified delivery-cost model or willingness-to-pay evidence. |
| 17 | We have not proved the customer-acquisition route | P0 | **Partially addressed** | ASIA inquiry was reported sent 2026-10-12; no reply/referral/conversation confirmed. Warm-introduction route is planned but not activated in the tracker. |
| 18 | We do not have a complete path from first engagement to repeat business | P1 | **Open — evidence required** | Initial discovery give is described, but there is no validated progression from discovery to scoped paid work, outcome review, renewal, or referral. |
| 19 | We have not established delivery economics or repeatability | P1 | **Open — evidence required** | No measured effort, qualified-review cost, rework, margin, cycle time, or repeat-engagement evidence. |
| 20 | Our business-model alternatives have not been compared | P1 | **Partially addressed** | Service-led approach is the current working recommendation; alternatives have not been compared using observed delivery and customer evidence. |
| 21 | The prototype's scope is not yet locked to a validated workflow | P0 | **Conditional/deferred** | Product work is intentionally paused pending customer evidence. No validated commercial workflow exists to lock. A bounded synthetic demonstration can be specified separately but is not customer validation. |
| 22 | We have not defined how the prototype will be judged | P0 | **Partially addressed** | Evidence-linked incident brief and baseline comparison are proposed in reference analysis. Acceptance metrics and repeatable test results must be formalised before building/evaluating a prototype. |
| 23 | We have not designed for incomplete, inconsistent, or contradictory evidence | P0 | **Partially addressed** | Evidence provenance, missing-vs-zero, conflicts, and human-review principles are represented across strategy and technical work. Actual end-to-end behaviour and test coverage must be verified on exact current code. |
| 24 | We have not established a defensible method for calculating economic impact | P0 | **Partially addressed** | Canonical guardrails reject unsupported savings claims and warn against double counting. A validated, workflow-specific impact method and independent review remain outstanding. |
| 25 | We have not completed the technical reliability and security gates | P0 | **Open — implementation/verification required** | Production/customer-data use remains NO-GO. PRs #41/#37/#36 and release gate #29 identify outstanding isolation, persistence, migration, and acceptance checks. Open PRs are not proof of completion. |
| 26 | We have not resolved the role of AI in the workflow | P1 | **Partially addressed** | AI is subordinate to traceable evidence and qualified human review in the working approach. Task-specific boundaries, evaluation, and failure handling still need to be validated. |
| 27 | We have not defined how GridMind will work within actual factory constraints | P1 | **Open — evidence required** | No customer workflow observation validates data availability, connectivity, staffing, downtime windows, record quality, or deployment constraints. |
| 28 | We have not defined the professional expertise required | P1 | **Partially addressed** | Qualified human review and external oversight are required in principle; the specific industrial/energy reviewer and review protocol are not confirmed. |
| 29 | We have not fully addressed data ownership, confidentiality, and reuse | P0 | **Partially addressed** | Authorisation, confidentiality, and permissioned learning guardrails are documented. No customer data permissions, contract terms, or real engagement controls are in place; maintain the no-customer-data gate. |
| 30 | We have not separated technical validation from commercial validation | P0 | **Documented on main** | Canonical documents explicitly distinguish synthetic/technical feasibility from demand, production readiness, and verified value. Apply that distinction to every future report. |
| 31 | The roadmap does not yet contain sufficiently explicit stop conditions | P0 | **Documented on main; monitor execution** | Master plan and discovery tracker define decision gates and GO TO BOUNDED TEST / NARROW / PIVOT / STOP. Revisit only if the live gates become contradictory or are not operationally applied. |
| 32 | We have not established a disciplined system for managing assumptions | P1 | **Partially addressed** | Decision constitution and canonical strategy distinguish fact, hypothesis, decision, unknown, and inference. A complete assumption-by-assumption inventory and review cadence have not been verified in this audit. |
| 33 | We have not established a credible measure of company progress | P1 | **Partially addressed** | Discovery gates and concrete next-step signals are documented. Actual progress evidence remains limited; avoid vanity metrics and do not count plans as completed outreach or validation. |
| 34 | We have not defined the long-term expansion logic | P2 | **Partially addressed** | Long-term platform direction and staged expansion are described, but expansion must remain conditional on repeatability, trust, and proven economics in the initial workflow. |

## Phased execution order

This is a dependency map for the original register, not a second dated schedule. The canonical master plan controls dates and the discovery tracker controls live outreach.

### Phase 0 — Reconcile and protect existing work (current)
- Preserve the original 34-problem numbering and map each problem to committed docs, commits, relevant open PRs, and remaining evidence.
- Do not duplicate or overwrite canonical strategy documents.
- Keep open PRs separate from merged work and preserve technical/customer-data NO-GO controls.

**Exit condition:** this crosswalk is reviewed and the next action is unambiguous.

### Phase 1 — Strategic precision and candidate selection (Problems 1–5)
- Recheck company definition and responsibility boundaries against canonical docs and the intended workflow.
- Keep the three horizons and discovery-first rule.
- Treat moat as an unvalidated hypothesis.
- Select no wedge until evidence supports C1, C4, or a justified reopened candidate.

**Exit condition:** company definition and boundaries are internally consistent; candidate decision uses evidence, or explicitly remains open pending customer access.

### Phase 2 — Customer, buyer, pain, and alternatives (Problems 6–10)
- Validate the initial segment and roles.
- Secure legitimate access to relevant professionals.
- Capture specific incident/workflow evidence, consequences, current alternatives, unresolved gap, and next step.
- Keep public research separate from customer evidence.

**Exit condition:** sufficient specific evidence to justify a bounded candidate test—or an explicit narrow/pivot/stop decision.

### Phase 3 — Competitive gap and measurable advantage (Problems 11–14)
- Complete source-backed competitor/alternative comparison only for the strongest candidate.
- Define a baseline and the customer advantage to test.
- Develop market sizing only after the segment and offer are narrow enough.
- Keep service-led/software-assisted as a hypothesis until delivery evidence supports it.

**Exit condition:** a plausible, evidence-supported gap and a measurable value hypothesis—or record that none has been established.

### Phase 4 — Offer, acquisition, and economics (Problems 15–20)
- Separate the current research give from any commercial offer.
- Cost delivery including specialist review, preparation, travel, rework, software, and follow-up.
- Validate a credible buyer path, next-step progression, repeatability, and business-model alternatives.
- Do not publish or promise an unvalidated price.

**Exit condition:** a bounded offer and credible path to responsible delivery with economics explicit enough for a test.

### Phase 5 — Prototype and technical trust (Problems 21–30)
- Specify a bounded workflow and evaluation baseline before building.
- Test provenance, missing/conflicting evidence, uncertainty, economic calculations, and human review.
- Resolve relevant technical/security/release gates on exact commits before real customer data.
- Keep synthetic success, technical readiness, commercial validation, and customer outcomes distinct.

**Exit condition:** a reproducible demonstration passes defined criteria; real-world use proceeds only with authorisation, qualified oversight, and release gates met.

### Phase 6 — Stop conditions, progress, and expansion (Problems 31–34)
- Apply the existing decision gates and record actual evidence.
- Review assumptions against new observations.
- Measure progress by qualified access, specific evidence, buyer next steps, test results, and delivery economics—not document count or feature count.
- Expand only after the initial workflow is repeatable and valuable.

**Exit condition:** an evidence-backed GO TO BOUNDED TEST / NARROW / PIVOT / STOP decision under the canonical master plan.

## Immediate next action

The audit suggests the next business problem is still **Problem 5 — selecting the initial problem**, but it cannot be solved by writing another scorecard. The practical prerequisite is customer/workflow evidence. Continue the current access experiment in the canonical discovery tracker and use public research only to sharpen testable questions. In parallel, Phase 1 should verify consistency of Problems 1–4 without reopening settled wording unless a concrete contradiction is found.

## Audit limits

- This is a documentation/metadata crosswalk, not a complete source-code review, security assessment, legal review, market study, or customer-validation exercise.
- Some statuses rely on the canonical documents' latest reported state; operational systems and CI should be rechecked before relying on historical snapshots.
- The original uploaded Markdown is a conversation attachment; this audit preserves its problem numbers and titles but does not replace or modify the source attachment.
- Reassess statuses when a PR merges, fresh evidence arrives, or the master plan changes.


## Phase 1–2 desk-research checkpoint (2026-10-12)

This checkpoint records public-source findings that affect the candidate comparison. It does **not** select a commercial wedge and is not customer validation.

### C4 — energy/resource inefficiency: the generic audit offer is not differentiated

The Bureau of Energy Efficiency's current ADEETIE scheme describes support across 60 industrial clusters and 14 energy-intensive sectors, including technical guidance, investment-grade energy audits, project planning, technology selection, commissioning, and monitoring/verification. The BEE's SIDHIEE portal also lists audit support, implementation hand-holding, technology suppliers, performance benchmarking, and post-implementation support. Sources: [BEE ADEETIE overview](https://beeindia.gov.in/show_content.php?lang=1&level=1&lid=384&ls_id=234), [SIDHIEE](https://sidhiee.beeindia.gov.in/), [BEE SME programme](https://saathee.beeindia.gov.in/sme-programme/).

**Implication:** “We audit energy use,” “we find energy-saving opportunities,” or “we verify implementation” is not, by itself, a defensible differentiation claim. Those capabilities already exist in the wider ecosystem. C4 remains worth probing only if discovery identifies a specific customer segment/workflow with a material residual gap, such as an unmet need that existing auditors, vendors, schemes, and internal teams do not adequately address. Whether such a gap exists in Adityapur–Jamshedpur is unknown.

### C1 — downtime/production-loss investigation: recording downtime is not enough

The existing reference analysis documents functional overlap with machine-monitoring/OEE tools, including OpeEye's published description of machine monitoring, production tracking, downtime reasons, and OEE: [OpeEye overview](https://opeeye.com/about).

**Implication:** GridMind must not position itself as differentiated merely because it records downtime or displays production metrics. A possible research question is whether a specific buyer has an unresolved, consequential gap in reconstructing an incident from authorised records, separating facts from hypotheses, assigning follow-up, or verifying whether corrective action worked. That is a hypothesis, not evidence of a market gap.

### What this research changes

1. Keep C1 and C4 as discovery probes; do not score a winner from desk research alone.
2. Test the current workflow and existing provider/system first, not whether the customer owns a dashboard.
3. Ask for one recent example, what the current approach did well, what remained unresolved, what that gap cost, and who could authorise a change.
4. Do not claim that existing energy-efficiency programmes or OEE tools are inadequate without customer-specific evidence.
5. The next decision-changing input is a substantive conversation with a relevant industrial professional; if access remains unavailable, record that as an access blocker rather than inventing demand.

**Evidence class:** public-source facts above; implications are strategic inferences; the existence and commercial importance of any residual gap remain unknown.


## Phase 2 expanded — public evidence and candidate stress-test (2026-10-12)

**Purpose:** Improve the quality of questions we take into customer discovery. Public research can identify incumbents, existing support, and plausible barriers; it cannot establish that a target factory has an unmet need or will pay.

### Evidence-backed landscape

| Candidate | What public sources establish | Strategic implication | What remains unknown |
|---|---|---|---|
| **C1 — downtime / production-loss investigation** | OpeEye publicly describes machine-level status, piece counts, downtime reasons, OEE, shift reports, offline logging, and pricing of ₹399/machine/month on its product pages. [Product page](https://opeeye.com/cnc-machine-monitoring-software), [production tracking](https://opeeye.com/production-tracking-software). | Do not compete merely on recording stoppages, reporting OEE, or producing another dashboard. A possible wedge must be narrower than monitoring and tied to a consequential unresolved investigation/follow-up job. | Whether the target factory already has adequate monitoring; whether incident investigation remains a bottleneck; whether evidence can be lawfully accessed; whether the gap matters enough to fund. |
| **C3 — recurring maintenance failures** | A 2023 study reports a review and survey of 216 Indian organisations to examine barriers to implementing maintenance practices in northern Indian SMEs. [Journal of Quality in Maintenance Engineering / ScienceDirect](https://www.sciencedirect.com/org/science/article/pii/S1355251123000030). | Maintenance barriers may involve organisational practice and implementation, not only software. Treat this as a reason to investigate the workflow and people, not evidence that GridMind can solve it. | Which barriers apply to the target cluster and segment; frequency/cost of recurring failures; existing maintenance routines and tools; available qualified reviewer; willingness to change. |
| **C4 — energy / resource inefficiency** | BEE describes ADEETIE as an MSME energy-efficiency programme covering 60 industrial clusters and 14 energy-intensive sectors, with technical guidance, energy audits, project planning, implementation, and monitoring. [BEE ADEETIE](https://beeindia.gov.in/show_content.php?lang=1&level=1&lid=384&ls_id=234); [SIDHIEE programme details](https://sidhiee.beeindia.gov.in/ProjectComponent/ADEETIE). | A generic energy audit or savings-opportunity report is not an obvious differentiated offer. GridMind would need to discover a specific unmet job alongside existing auditors, schemes, vendors, and factory teams. | Whether the target cluster/sector is covered or eligible; which support is actually accessible; whether implementation follow-through is inadequate; baseline and measurement availability; buyer authority. |

**Source quality note:** BEE is an official government source for scheme descriptions. OpeEye is a vendor's own product marketing and establishes what the vendor claims to offer, not independently verified product performance or market share. The maintenance paper's abstract establishes its stated scope and method; do not generalise its findings to every factory without reviewing the full study and segment fit.

### Candidate decision logic — no invented scores

Use these as qualitative gates rather than a numerical weighted score while evidence is missing.

| Gate | Evidence needed to advance a candidate | Stop / reopen signal |
|---|---|---|
| **1. Specific recurring job** | A relevant participant describes a recent, concrete event or recurring workflow and the steps taken. | Only broad complaints, hypothetical interest, or no identifiable event. |
| **2. Residual gap** | The participant explains what current staff, systems, consultants, vendors, or schemes did—and what still remained unresolved. | Existing approach is adequate, or the supposed gap is merely a feature GridMind has not built. |
| **3. Material consequence** | The factory's own method supports a credible consequence estimate, with uncertainty and no double counting. | Consequence cannot be estimated or is not important to the decision-maker. |
| **4. Actionability and authority** | A named role can approve the next step; a qualified person can review technical conclusions. | No route to decision authority, no feasible intervention, or no qualified reviewer. |
| **5. Evidence access and permissions** | The factory can lawfully share a minimal, appropriate evidence set, with an agreed handling and retention approach. | Confidentiality, customer/OEM restrictions, missing provenance, or unsafe data handling blocks access. |
| **6. Testable outcome** | A baseline and a proportionate result measure can be defined before work starts. | No credible baseline or no way to distinguish GridMind's contribution from other changes. |
| **7. Delivery economics** | Work can be bounded; reviewer time, preparation, travel, rework, and follow-up can be estimated. | Bespoke expert effort makes delivery implausible or the customer has no credible next-step interest. |

A candidate advances only when the relevant gates have supporting evidence. Unknown remains **unknown**; it is not a zero and should not be replaced by a guessed score. No candidate wins based on the public-source table alone.

### Discovery questions to test the hypotheses

Ask about the participant's real process, not whether they like GridMind or AI. Avoid requesting confidential records or sensitive operational details at the exploratory stage.

1. “Could you describe the most recent time this problem occurred, at a high level?”
2. “What happened first, and how did the team work out what was going on?”
3. “Which records, people, or systems were used? Which were most trustworthy?”
4. “What did your existing process handle well?”
5. “What remained uncertain or unresolved after the team finished?”
6. “What was the consequence, and how does the factory estimate it?”
7. “How often has something similar happened? What makes you confident in that estimate?”
8. “What has already been tried, and why was it kept, changed, or abandoned?”
9. “Who owns the problem, who reviews the technical conclusion, and who can authorise a change?”
10. “If the team wanted to examine one example safely, what permission and data-handling steps would be required?”
11. “What evidence would convince you that a different approach was useful?”
12. “What would make you decide not to change the current process?”

**Recording discipline:** Separate direct statements, observed artefacts (only if explicitly authorised), calculations, interpretations, and unknowns. Record the role and context, not unnecessary personal details. Do not describe a conversation as customer validation if it only expresses general interest. A meaningful signal includes a concrete example, current alternative, unresolved gap, credible consequence, decision authority, and a specific authorised next step.

### What changed after this phase

- **C1:** narrowed from “downtime tool” to a hypothesis about incident investigation and follow-through after existing monitoring/records have done their job.
- **C3:** retained as a conditional alternative, not promoted based on one general maintenance study.
- **C4:** narrowed from “energy savings” to a hypothesis about a specific residual gap beyond existing audit and implementation support.
- **Wedge decision:** remains **OPEN**. No customer-specific evidence was added by desk research.
- **Next action:** use the existing [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md) to seek an appropriate conversation through a legitimate introduction route. Given the founder is under 18, any formal factory engagement, site visit, data handling, payment, or commercial commitment must have appropriate adult and professional oversight.

**Phase 2 exit condition:** public research has sharpened the questions and exposed obvious overlap; it has not passed the customer-evidence gate. Phase 3 should not begin as a product build until a target workflow and its evaluation criteria are specified. A bounded synthetic test may be designed for technical feasibility, but it cannot be counted as demand or customer impact.


## Phase 3 preflight — technical experiment readiness (prepared, not executed)

The register's Phase 3 is a technical experiment. The canonical Master Plan controls whether and when that experiment can run. Because the commercial wedge is still undecided, this section prepares the evaluation contract without starting a product build or pretending that synthetic data validates demand.

### Decision

**Phase 3 execution status: NOT AUTHORIZED YET.** Prepare only the reusable test protocol. Run a workflow-specific synthetic experiment only after the master plan's candidate-comparison gate identifies a concrete workflow to test, or explicitly authorises a narrow candidate-neutral experiment. Do not pull the dates forward just because the research document is ready.

### Minimum experiment contract

Before writing code or evaluating outputs, record:

1. **Question:** one narrow task the system should perform, not “understand a factory.”
2. **Input contract:** exact fields, units, time windows, source identity, provenance, and what may be missing.
3. **Synthetic case design:** clearly fabricated records, including at least one missing field, one conflicting record, and one ambiguous or non-causal relationship. Never use realistic customer identifiers or copied customer records.
4. **Expected answer / reference label:** independently written expected findings and the evidence supporting each; state where the correct answer is “unknown” or “insufficient evidence.”
5. **Required output:** source-linked timeline or calculation, facts separated from inferences, alternative explanations, contradiction/missing-evidence list, confidence limitations, and an explicit human-review boundary.
6. **Failure cases:** plausible but unsupported root-cause narrative, unit/time mismatch, missing-as-zero error, double-counted economic impact, incorrect arithmetic, and a recommendation exceeding the evidence.
7. **Acceptance criteria:** each material statement traceable to an input; calculations independently reproducible; no unsupported causal claim; missing/conflicting evidence surfaced; no action framed as approved without a human decision.
8. **Review:** a qualified domain reviewer checks technical correctness before any operational interpretation is offered.

### What this experiment can and cannot prove

| It can test | It cannot prove |
|---|---|
| Data-contract behaviour on defined synthetic inputs | That a factory has the problem or will buy a solution |
| Whether provenance and missing/conflicting evidence are represented correctly | Root-cause accuracy in real operations |
| Whether deterministic calculations reproduce expected results | Verified savings, ROI, causal impact, or customer value |
| Whether the interface makes uncertainty and human review visible | Security approval for production data or permission to deploy |
| Whether a bounded task is technically feasible under test conditions | Repeatable delivery economics or product-market fit |

### Phase 3 entry gate

Do not execute the experiment until all are true:

- A single workflow question is stated clearly and tied to the candidate register.
- The relevant source/field semantics and expected outputs are defined.
- Acceptance and failure criteria are written before seeing the output.
- Synthetic data are labelled as synthetic and contain no customer-derived information.
- A qualified reviewer is identified for any domain-specific conclusion.
- The result will be recorded as a technical test only, separate from customer evidence.

If these conditions are not met, the correct action is to keep the product build paused and continue discovery/access work under the canonical Buyer Discovery Sprint. This is a deliberate dependency, not a project delay to conceal.



## Phase 3 dry-run — synthetic evidence packet and reference answer (2026-10-12)

**Scope:** A documentation-only dry-run of evidence discipline using wholly invented values. It does not select C1 as the wedge, validate demand, test software, or authorise customer-data work. It tests whether the proposed method refuses to overstate what a small evidence packet can establish.

### Fictional packet

Everything below is fabricated for this test.

| Record ID | Record | What it directly states | Limitation |
|---|---|---|---|
| R-01 | Shift log | Fictional Line L-7 stopped at 10:14 and restarted at 10:32. | Operator-entered; no independent time source supplied. |
| R-02 | Maintenance note | “Sensor signal intermittent”; note created at 10:41. | Does not establish when the issue began or prove it caused the stop. |
| R-03 | Production summary | 18 units below the shift target. | Does not establish that all 18 units were lost because of this stop. |
| R-04 | Event export | Stop time listed as 10:19; restart time is blank. | Conflicts with R-01; time source and clock alignment unknown. |
| R-05 | Cost worksheet | “₹12,000 impact” entered by an unknown author. | Formula, unit basis, included cost categories, and approval are absent. |

No real factory, employee, equipment, customer, or incident is represented.

### Reference answer — what a disciplined system should say

**Supported observations**
- R-01 reports a stop interval of 18 minutes (10:14–10:32), based on its own timestamps.
- R-04 reports a different stop time (10:19) and no restart time.
- R-02 records an intermittent sensor signal in a note created at 10:41.
- R-03 reports an 18-unit shortfall against a target.
- R-05 contains a ₹12,000 impact entry without a reproducible calculation.

**Unresolved / not established**
- The authoritative stop and restart times are not established because R-01 and R-04 conflict and clock/source quality is unknown.
- The sensor issue is a possible lead, not a proven root cause.
- The 18-unit target shortfall cannot be attributed entirely to the stop from these records alone.
- The ₹12,000 figure is unverified and must not be reported as GridMind-estimated loss or savings.
- The packet does not establish recurrence, buyer urgency, willingness to pay, or whether the current factory process is inadequate.

**Appropriate next evidence (if this were a real, authorised investigation)**
- Confirm source ownership, timestamp definitions, clock alignment, and which record is authoritative.
- Establish the stop/restart event from an authorised source and reconcile it with shift records.
- Ask a qualified reviewer whether the maintenance note supports any causal inference and what alternatives remain.
- Request the formula and source inputs behind the ₹12,000 entry before using it.
- Define the question and approval boundary with the responsible factory owner before recommending any action.

### Dry-run pass/fail criteria

| Criterion | Pass condition | Dry-run result |
|---|---|---|
| Provenance | Every observation references a record ID. | Pass in this written reference answer. |
| Conflict handling | R-01/R-04 conflict is surfaced, not silently reconciled. | Pass. |
| Missing data | Blank restart time is stated as missing, not imputed. | Pass. |
| Causality | Sensor note is not presented as confirmed root cause. | Pass. |
| Economic integrity | ₹12,000 is not treated as verified impact or savings. | Pass. |
| Attribution | The 18-unit shortfall is not fully attributed to the stop. | Pass. |
| Commercial inference | No demand, ROI, or willingness-to-pay claim is made. | Pass. |

**Limit of this result:** These passes mean the written reference answer follows the protocol. They are not automated test results, independent expert review, software accuracy, or evidence of real-world reliability. An independent reviewer and an implementation-level test remain outstanding.

### Phase 3 disposition

- **Documentation/method dry-run:** completed for this one fabricated packet.
- **Software implementation test:** not run.
- **Independent domain review:** not obtained.
- **Customer validation / real-world test:** not performed.
- **Production/customer-data use:** not authorised.

### Correction to Phase 2 candidate framing

C3 maintenance recurrence is included only as a **conditional landscape comparator** because the canonical sprint parks C3 unless discovery redirects. The active discovery probes remain **C1 and C4**. The public maintenance study does not promote C3, establish local prevalence, or justify expanding the sprint. This distinction preserves the canonical candidate register and prevents research breadth from becoming scope creep.

## Phase 4 preflight — offer, acquisition, and economics (2026-10-13)

**Purpose:** Resolve what can be made precise from existing work for Problems 15–20, while making the remaining customer-evidence requirements explicit. This is a supporting audit checkpoint, not a second execution plan. The canonical Master Plan remains the execution authority; the Buyer Discovery Sprint remains the only live access/discovery tracker.

### Phase 4 status by problem

| Problem | What can be clarified now | What remains unproven | Current disposition |
|---:|---|---|---|
| **15 — Initial offer** | Separate the no-data research give from any paid or technical service. The research give is a 20-minute conversation and, if useful, an optional one-page non-technical workflow/decision map based only on voluntary verbal information. A possible later paid offer is a tightly bounded, human-reviewed investigation of one defined operational incident. | Whether the target buyer has the problem, wants the deliverable, can provide lawful evidence, trusts the method, and will authorize a next step. The paid offer is not approved or validated. | **Offer architecture clarified; commercial offer remains a hypothesis.** |
| **16 — Pricing and delivery economics** | Establish a cost model and a rule for deciding whether a case is economically viable. Keep price, time, reviewer availability, and margin as separate variables. | Actual investigator/reviewer hours, travel, data-preparation effort, rework, buyer budget, willingness to pay, and repeatable delivery cost. | **Model defined; no price validated.** |
| **17 — Customer acquisition** | Treat ASIA as one public-route access experiment, not a warm introduction or buyer lead. Use one legitimate route at a time and log actual outcomes in the live tracker. | A reply, referral, booked conversation, genuine warm-introduction requests, conversion rate, or repeatable access channel. | **Access route unproven; follow the existing tracker.** |
| **18 — First engagement to repeat business** | Define the stages that would need evidence: discovery → qualified case → scoped proposal → authorized evidence → delivery/review → buyer decision → follow-up or repeat. Do not assume that one stage automatically converts to the next. | Actual stage conversion, buyer procurement steps, repeat demand, referral behavior, and evidence that a second case can be delivered consistently. | **Progression map only; no validated funnel.** |
| **19 — Delivery economics and repeatability** | Record effort and direct costs per case from the beginning, including work that is easy to overlook: coordination, waiting, preparation, corrections, qualified review, travel, reporting, and follow-up. | Measured delivery time/cost, contribution, rework, customer acquisition effort, repeatability, and a viable route to covering overhead. | **Measurement method defined; operating economics unknown.** |
| **20 — Service versus software** | Use a manual, human-reviewed service as a learning method only if a specific case qualifies and the work can be delivered safely. Automate only recurring steps whose inputs, outputs, and failure modes are understood. | Whether buyers prefer a service, software, or a hybrid; which steps repeat; and whether software materially improves quality, speed, or economics. | **Service-led is a testable hypothesis, not a settled business model.** |

### Offer boundary — do not mix research with a commercial promise

**Current research give (no customer data):**
- A short, voluntary conversation about one past workflow or incident.
- An optional one-page workflow/decision map based on non-confidential verbal information.
- No diagnosis, energy audit, root-cause conclusion, quantified savings, plant visit, confidential records, or implementation commitment.

**Possible later paid offer (not yet authorized or validated):**
- One tightly scoped, human-reviewed investigation of a specific operational problem, only after discovery establishes a meaningful residual gap and a feasible, authorized evidence path.
- A written brief separating source-backed observations, reconstructed events, hypotheses, contradictions, unknowns, and recommended next checks.
- Explicit exclusions, customer review, change control, delivery-hour tracking, and a stop condition if evidence or qualified expertise is insufficient.

The [detailed offer hypothesis in PR #50](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/50) is a draft supporting specification, not a selected wedge or a claim that the service is ready to sell. C1 and C4 remain discovery probes. Do not present the provisional Production Loss Investigation as the approved GridMind product.

### First-principles delivery economics

For each future qualified case, capture the following using actual observations rather than defaults:

- **Fee (F):** the price explicitly offered to and accepted or rejected by the buyer.
- **Direct delivery cost (C):** investigator hours × an explicit internal cost rate, plus qualified reviewer time/cost, data preparation, coordination, travel/on-site time where necessary, software/operating costs, rework, and delivery-related administration.
- **Contribution before acquisition and overhead:** **F − C**.
- **Contribution margin:** **(F − C) ÷ F**, only when F is positive and the cost basis is stated.
- **Customer-side net value hypothesis:** conservative incremental benefit attributable to the intervention, less the fee and the customer's implementation cost. This must not be calculated from gross exposure alone; the benefit and attribution method need evidence.

Do not substitute a guessed hourly rate, reviewer fee, conversion rate, or customer-loss number. Record ranges and assumptions when exact inputs are unavailable. Distinguish direct costs from acquisition effort and general overhead rather than hiding them. If the work requires scarce specialist effort, uncontrolled data cleaning, repeated site visits, or extensive bespoke analysis, that burden is part of the offer economics—not free labor.

The previously discussed **₹15,000** and **5–10 working days** are hypotheses only. They are not an approved price, market benchmark, service-level promise, demonstrated delivery time, or willingness-to-pay signal. No margin or customer ROI can be claimed until actual fee, delivery cost, baseline, and outcome evidence exist.

### Acquisition and commercial evidence ladder

Use these as evidence categories, not a forecast or conversion funnel:

1. **Route attempted:** an actual message/request is sent through a legitimate channel.
2. **Route response:** a real reply or useful next step is received.
3. **Relevant conversation:** a willing, relevant professional discusses a specific past workflow.
4. **Qualified problem:** evidence indicates a material problem, current alternatives, a residual gap, an identifiable owner, and a plausible next step.
5. **Scoped proposal:** a defined deliverable, exclusions, required inputs, timeline, review, and price are presented to an appropriate decision-maker.
6. **Buyer decision:** the buyer explicitly accepts, declines, or requests changes at the stated scope/price.
7. **Paid delivery and use:** payment and delivery occur, and the customer can describe how the result informed a decision.
8. **Repeatability:** a later case can be delivered with a stable method, acceptable quality, and measured economics.

Never infer later stages from earlier ones. An email sent is not a response; a response is not a buyer conversation; a positive conversation is not a purchase commitment; one paid case is not repeatable demand.

### Current access truth and safe next action

The current tracker reports the ASIA inquiry as sent on 2026-10-12, with no reply, referral, booked/held conversation, customer-data permission, or buyer commitment confirmed. The separate 3–5 warm-introduction-request experiment remains capacity-dependent; it must not be recorded as completed unless genuine requests were actually sent. The ASIA inquiry is not to be counted as one of those warm requests.

The next action remains the one in the [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md): check the real message thread, use at most one appropriate follow-up if still suitable, and pursue only legitimate routes with appropriate adult/professional support. If no genuine warm connector is available, record an access-capacity blocker. Do not invent contacts, send messages on the founder's behalf, request factory records, or promise a technical audit.

### Phase 4 decision gates

A bounded commercial test should not be proposed until all relevant conditions are supported:

- A specific recent problem and residual gap are supported by real conversations.
- A relevant operational owner and plausible economic-buyer/procurement path are identified.
- The customer can state what decision the deliverable would inform.
- Required data can be accessed lawfully and safely, with explicit scope and handling terms.
- Any technical conclusion has an appropriate qualified reviewer.
- The scope, exclusions, success/failure criteria, delivery effort, and stop conditions are explicit.
- A price is tested with a real buyer; actual delivery cost and customer-side value are measured separately.
- No claim depends on unverified savings, unsupported causal attribution, or a hypothetical conversion rate.

**Phase 4 disposition:** the offer boundary, economics equations, and evidence ladder can be specified now; customer acquisition, buyer willingness to pay, delivery economics, repeatability, and service-versus-software fit cannot be solved by desk analysis alone. They remain open until actual evidence exists. This does not authorize a product build or customer-data test, and it does not change the canonical 2026-11-10 decision gate.
