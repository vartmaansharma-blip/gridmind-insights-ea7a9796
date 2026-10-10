# GridMind first-use-case data contract

**Status:** Provisional pilot contract for customer discovery and engineering review. It is not evidence that a real factory has supplied data or that GridMind is validated.

## 1. Provisional first use case

**Question:** For one electrically powered asset or tightly bounded process with its own trustworthy energy measurement, does energy consumed per comparable unit of production show a persistent, economically meaningful deviation that warrants investigation?

This is a candidate wedge, not a final commitment. It is attractive because it can be scoped narrowly and compared against a baseline, but it is only suitable when the energy boundary and matching production measure are defensible. If those conditions are absent, do not force an asset-level energy story; evaluate a different candidate with the factory.

**Intended output:** a traceable screening finding with accepted/excluded periods, evidence coverage, normalized comparison where supported, uncertainty, plausible investigation questions, and explicit next measurements/review. It is not an autonomous root-cause diagnosis or a savings guarantee.

## 2. Customer and asset boundary

Before ingestion, document:
- Customer/site and authorized business sponsor.
- One asset or process boundary and what loads it includes/excludes.
- Asset/meter/tag identifiers and verified mapping.
- One production measure and its definition.
- Relevant products/product mix, operating states, shifts and shutdowns.
- Named data owner, operations-context owner and qualified technical reviewer.
- Intended decision, current manual assessment method, and what outcome would justify a paid next step.

Do not analyze an individual asset from a whole-factory bill unless a qualified, documented allocation method supports that boundary.

## 3. Required data contract

Every record must retain source lineage, original values and units, normalized values (if transformed), transformation/version, exact period and quality status. No silent imputation.

| Role | Required fields | Preferred source |
|---|---|---|
| Energy | value; unit preferably kWh; period start/end and timezone; meter/tag; source/export reference; measured/estimated flag; quality/gap/reset notes | Submeter, historian or validated meter export |
| Production | quantity and stable unit; exact matching period; production definition; product code/mix if relevant; source reference | MES/production log or signed operator export |
| Operating context | operating hours or state; shift/calendar; planned shutdowns; product/process code; changeovers; maintenance/fault events | Historian, shift logs, CMMS and operator review |
| Economic context (only for monetary claims) | applicable tariff/rate and effective dates; currency; bill period; demand charges only if relevant; source document; documented recoverable fraction only if supported | Bills, official tariff schedule, finance/utility confirmation |
| Asset mapping | asset and meter IDs; physical/process boundary; relationship and allocation method; owner; evidence source; reviewer and confidence | P&ID/electrical drawing, asset register and site confirmation |

**Period:** request 12 months if available; minimum intake request is six months of comparable history. Daily/hourly or 15-minute intervals are preferred when aligned across sources; monthly can support screening only if the question and comparability justify it. The analysis engine's technical minimum of five comparable periods is not automatically sufficient for a credible industrial conclusion.

**Canonical application alignment:** use observations with explicit metadata.analysis_role values energy, production, operating_hours, operating_state, or product_code (or the exact supported canonical metric names). Include explicit unit and period boundaries (observed_until or metadata.period_end; optional metadata.period_start). Preserve provenance/source IDs and quality. Asset operating context must use the canonical asset scope and supported status described in docs/gridmind-authoritative-analysis.md. Economic inputs belong in effective, sourced economic_contexts. Do not send client-invented measurements or analysis assumptions to the analysis endpoint; it loads canonical persisted records server-side.

Before any customer intake is accepted, reconcile the customer-facing template with the current database schema and canonical adapter. The table above is a semantic contract, not permission to add unsupported fields directly to production.

## 4. Quality and comparability gates

Accept a period only when:
1. Energy and production intervals align or have an explicit, reviewed aggregation method.
2. Units are known and conversion is deterministic and tested.
3. Source, meter boundary, timestamps/timezone and measurement quality are traceable.
4. Missing, estimated, reset, duplicate, overlapping or conflicting values are flagged and handled according to documented rules.
5. Product mix, operating state, operating hours, shift pattern and unusual events are available to the degree required by the comparison.
6. Meter changes, asset configuration changes, maintenance and shutdowns are identified.
7. Baseline and comparison windows are defined before examining results.
8. Economic claims use period-appropriate tariff and cost evidence, not generic rates.

No missing value becomes zero. No ambiguous tag mapping is silently chosen. No extrapolation beyond the observed scope is presented as measured fact. Preserve rejected periods and exclusion reasons.

## 5. Insufficiency/refusal rules

Return **insufficient evidence** rather than a quantified conclusion if any material condition applies:
- energy measurement does not match the stated asset/process boundary;
- production quantity is missing, incompatible, or cannot be aligned to energy periods;
- required periods are missing, overlapping, duplicated or materially non-comparable;
- units, timestamp semantics, quality, product/operating context or source lineage are ambiguous;
- tariff/cost evidence is missing for a monetary conclusion;
- only rated nameplate power or an unallocated plant bill is available for an asset-level claim;
- result depends on unsupported allocation, guessed recovery, guessed intervention cost, or invented context;
- analysis cannot be reproduced from persisted canonical inputs.

A refusal must identify the missing evidence, why it matters, and the cheapest safe next step to resolve it. “Insufficient evidence” is not a failed analysis; inventing precision is.

## 6. Required output for each run

- Case ID, site/asset boundary and intended decision.
- Analysis algorithm/version and timestamp assigned by the server.
- Input source IDs, units, periods, provenance and quality.
- Coverage summary and accepted/excluded periods with reasons.
- Contextual comparison and calculation method, only when supported.
- Observed facts separated from estimates, hypotheses and recommendations.
- Uncertainty, limitations, possible confounders and alternate explanations.
- Next discriminating data request, measurement or physical inspection.
- Independent reviewer and review decision.
- Reproducibility status after persisted inputs are reloaded.
- Explicit economic status: not quantified / estimated / intervention implemented / verified outcome.

## 7. Head-to-head review rubric

Before seeing GridMind's answer, document the existing assessment method and baseline time/effort. Have a qualified reviewer compare the methods on the same case.

Score each dimension with evidence:
- **Finding quality:** true positives, false positives, missed material issues and unsupported causal claims.
- **Speed:** elapsed time and person-hours from data receipt to a reviewable finding, including data cleaning.
- **Economic defensibility:** correctness of source data, assumptions and calculations; compare estimated value with measured outcome only after an intervention and agreed M&V.
- **Actionability:** whether the result identifies a concrete, proportionate next investigation and the evidence needed.
- **Auditability:** can another reviewer reproduce the result and trace each claim to a source?
- **Calibration:** does confidence/uncertainty correspond to what the evidence supports?
- **Operational usefulness:** plant expert's documented judgment of whether the finding changes a decision.

Agree thresholds with the customer before analysis. Record disagreements. Do not claim GridMind beats an engineer unless an independent comparison supports the claim. A faster output with more false positives or missed problems is not a win.

## 8. Privacy, permission and security

- Obtain written authorization specifying purpose, records, period, users, retention, allowed analysis and deletion/return terms.
- Collect the minimum necessary data; prefer controlled exports for the first pilot.
- Keep customer data out of public GitHub, sample fixtures, prompts/logs and unrelated environments.
- Enforce tenant isolation and least privilege; verify access boundaries before loading sensitive data.
- Do not reuse a customer's data for cross-customer training or benchmarks without explicit contractual rights and appropriate anonymization/privacy review.
- Maintain access/audit records and a defined incident/contact path.
- Do not issue machine-control commands or operational instructions from this screening workflow. Physical inspection and safety-critical decisions remain with qualified site personnel.

## 9. Pilot exit criteria

Proceed to a paid repeat engagement only if:
- data boundary and lineage pass review;
- a result reproduces after persistence/reload;
- an independent reviewer finds the result defensible and useful, or the system correctly refuses a weak claim and identifies a practical evidence gap;
- comparison metrics are recorded against the conventional process;
- any implemented intervention is tracked separately from any verified outcome;
- the customer confirms the next decision and willingness to pay.

A successful data intake alone is not a successful pilot. A positive estimate alone is not verified savings.

## 10. First execution checklist

1. Identify a prospective factory and obtain permission before receiving records.
2. Hold a scoping call with energy/data owner, operations owner and technical reviewer.
3. Confirm one asset/process boundary and one decision.
4. Map each required field to actual source records and current GridMind schema.
5. Run a read-only schema/adapter compatibility review before any migration or production write.
6. Agree baseline method, comparison rubric, thresholds and handling of inconclusive results.
7. Ingest a minimal controlled sample; validate units, periods, source references and coverage.
8. Only then run analysis and review its persisted reproducibility.
