# GridMind accuracy and validation standard

> **REFERENCE ONLY — superseded for execution on 2026-10-11.** The sole execution authority is [GridMind Master Plan](gridmind-master-plan-2026-10-11.md); the sole live discovery tracker is [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md). This document may preserve useful analysis, but its old schedules, candidate letters, gates, engineering priorities, and numeric targets are not active instructions. Use stable candidate IDs C1–C5 and the two-tier gates in the canonical files. Do not create another plan from this document.


**Status:** Reference-only validation principles. The active execution authority is the [GridMind Master Plan](gridmind-master-plan-2026-10-11.md), and the active discovery record is the [Buyer Discovery Sprint](gridmind-buyer-discovery-sprint-2026-10-11.md). No numeric accuracy target is active until the exact task, risk, labeling rubric, comparison method and representative evaluation set are defined and approved for a selected workflow.

## 1. Accuracy is a system property

GridMind must not optimize for confident-sounding answers. Accuracy depends on the entire chain: source correctness, asset mapping, time alignment, context, calculation, uncertainty, interpretation, persistence, and expert review. A correct formula applied to the wrong meter, period, unit, or operating context is a wrong answer.

The system must be able to say **insufficient evidence**, ask for the next discriminating measurement, and keep a finding unresolved. Refusal is preferable to fabricated certainty.

## 2. Separate accuracy dimensions

Never report one undifferentiated “accuracy” percentage. Track:

1. **Input integrity:** percentage of required records with validated source, unit, period, quality and lineage.
2. **Mapping accuracy:** correct meter-to-asset/process mapping, independently checked.
3. **Period/comparability accuracy:** valid joins, aggregation, exclusions and context matching.
4. **Calculation correctness:** deterministic test cases, dimensional analysis, numerical edge cases and independent recomputation.
5. **Finding precision:** supported material findings / all material findings asserted.
6. **Finding recall:** supported material issues found / all material issues independently adjudicated as present in the evaluated scope.
7. **Calibration:** whether confidence levels correspond to observed correctness; do not show numerical confidence until calibrated on representative cases.
8. **Economic error:** forecast-versus-measured difference with a pre-agreed measurement and normalization method; do not confuse estimate error with causal attribution.
9. **Reproducibility:** same version and same canonical inputs reproduce the same result.
10. **Refusal quality:** insufficient-evidence cases correctly refused, with the missing evidence and next step explained.

A reviewer must distinguish a false positive, a missed issue, a valid refusal, and an unresolved case. An unresolved case is not automatically counted as either correct or incorrect.

## 3. Proposed release gates

The deterministic integrity checks below are candidate engineering acceptance checks. They do not establish analytical accuracy or customer value. Define any task-specific acceptance criteria before a selected workflow is tested.

### Gate A — deterministic and data integrity
- 100% of supported unit conversions and reference calculation fixtures pass.
- 100% of invalid/ambiguous inputs in the defined test suite are rejected or explicitly marked insufficient.
- 100% of reported values can be traced to canonical source IDs, units, periods and algorithm version.
- 100% of persisted analysis results pass reload-and-recompute consistency checks.
- Zero known cross-tenant data leakage in the defined security acceptance suite.
- No silent imputation, unit guessing, timestamp inference, or unsupported asset-level allocation.

### Gate B — expert-reviewed case set
- Define a representative case set appropriate to the exact claim; there is no universal case-count threshold that proves industrial generalization.
- Pre-register the target problem, inclusion/exclusion criteria, reviewer rubric, error severity, and acceptance thresholds before scoring.
- Report observed false positives, misses, valid refusals, unresolved cases, reviewer disagreement, sample limitations and uncertainty. Do not choose a percentage target without a defined task and risk rationale.
- Evaluate unsupported or ambiguous inputs against a defined refusal suite; set the required threshold before testing based on the consequences of an incorrect answer.
- Any safety-critical, high-consequence, or potentially damaging recommendation requires qualified human approval regardless of aggregate metrics.
- If the sample is too small or unrepresentative, report the result as preliminary and do not generalize to other assets, factories or industries.

These principles are not evidence that GridMind currently meets any accuracy level. If evidence is insufficient or errors exceed the pre-agreed risk tolerance, narrow the supported use case, improve the method, or refuse to claim readiness.

### Gate C — comparative value
- Compare GridMind with the existing engineering process on the same cases and with a pre-agreed review method.
- Track false positives, misses, review time, data-cleaning effort, reproducibility and expert acceptance separately.
- A speed improvement counts only if the finding-quality gates are also met.
- Do not claim superiority over engineers from a demo, one anecdote, synthetic data, or an unblinded founder review.
- Before claiming savings, run an agreed measurement-and-verification plan after an approved intervention and document confounders and uncertainty.

## 4. Test design that avoids self-deception

- Separate development/tuning cases from locked evaluation cases. Never tune on the held-out evaluation set and then report it as independent.
- Include negative cases and inconclusive cases, not just examples where the system found something.
- Have reviewers adjudicate cases using source evidence and a written rubric; record disagreements and use a second reviewer for disputed/high-impact cases.
- Where practical, hide which method generated each finding until scoring is complete.
- Record the denominator, exclusions, missing labels, confidence intervals and known selection bias.
- Repeat evaluation on a second facility before claiming cross-site transferability.
- Test data drift, meter replacements, changes in product mix, shift schedules, tariffs, and equipment configuration.
- Version the adapter, calculation engine, rules, prompts/models if used, and all material transformations. A material semantic change requires regression tests and re-evaluation.

## 5. Root-cause and recommendation discipline

Energy-per-unit deviation is a screening signal, not a root cause. Potential explanations may include operating hours, product mix, idle time, process settings, meter boundary errors, maintenance, environmental conditions, or measurement faults. Present these as hypotheses only when supported by context, and identify the observation or inspection that would distinguish them.

Never automatically convert:
- correlation into causation;
- nameplate ratings into measured consumption;
- technical potential into recoverable financial value;
- estimated opportunity into realized savings;
- a generated hypothesis into a confirmed diagnosis;
- one site's pattern into a universal rule.

Recommendations affecting machinery, electrical systems, production quality, or worker safety must remain advisory and require qualified site review and approval. This initial use case does not control equipment.

## 6. Accuracy incident loop

For each material error or missed issue:
1. Preserve the exact input snapshot, source lineage, algorithm version and output.
2. Classify the failure: data, mapping, temporal alignment, context, calculation, interpretation, calibration, persistence, or reviewer process.
3. Determine scope and whether any customer-facing claim needs correction.
4. Add a minimized, permissioned regression fixture where legally permitted; otherwise record a non-sensitive test specification.
5. Add a test that would have caught the error and test nearby edge cases.
6. Re-run the locked evaluation set and check for regressions.
7. Document resolution, remaining risk and whether prior results need re-review.

Customer data must not be committed to public GitHub or used for training/benchmarks without explicit rights. Store only redacted test fixtures or synthetic fixtures clearly labeled as synthetic.

## 7. Public claims policy

Until the evidence exists, describe GridMind as **being built to produce traceable, reproducible industrial findings**. Do not advertise a percentage accuracy, “better than engineers,” verified savings, autonomous diagnosis, or broad industrial generalization without a representative, independently reviewed evaluation supporting the exact claim.

For each public performance claim retain: metric definition, denominator, dataset scope, date/version, reviewer method, exclusions, uncertainty and permission to disclose. Marketing must not outrun the evidence.

## 8. Next execution sequence

1. Audit the current calculation engine and tests against Gate A; record actual pass/fail evidence rather than assuming tests pass because they exist.
2. Create a case-labeling rubric and a versioned evaluation harness using synthetic fixtures only for engineering correctness—not as proof of real-world accuracy.
3. Obtain an authorized real case and independent technical adjudication.
4. Build a locked evaluation set from authorized cases, with positive, negative and insufficient-evidence examples.
5. Run the head-to-head scorecard; publish only scope-limited measured results.
6. Fix the most common failure mode first and repeat evaluation.
