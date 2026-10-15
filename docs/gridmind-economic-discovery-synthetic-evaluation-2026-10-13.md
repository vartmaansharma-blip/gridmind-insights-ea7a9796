# GridMind Economic Discovery — Synthetic Evaluation Fixture v1

**Status:** Offline design/evaluation aid only. All names, values, invoices, dates, and circumstances are invented. This fixture is not manufacturer evidence, an engineering audit, customer validation, or a claim of savings.

**Purpose:** Test whether the proposed Economic Discovery workflow detects data-quality problems, makes transparent calculations, compares like with like, and refuses to turn an anomaly into an unsupported causal or savings claim.

**Canonical home:** This fixture supports §16 of `docs/gridmind-master-plan-2026-10-11.md`. It does not create a competing strategy. The commercial wedge remains unselected; energy/utility is a provisional offer variant, C1 remains a comparator, and the 2026-11-10 decision gate is unchanged.

## 1. Synthetic base fixture

Hypothetical site: `SYNTHETIC-PLANT-01`. Energy records are monthly and assumed to cover the same site boundary. The simple base fixture deliberately assumes a flat all-in variable rate of ₹9/kWh and excludes fixed charges, demand charges, taxes, power-factor penalties, time-of-day rates, and other bill components. That assumption is only for arithmetic tests, not a realistic tariff model.

| Month | Invoice ID | Energy as recorded | Normalized energy | Output units | Operating days | Bill amount | Assumed rate |
|---|---|---:|---:|---:|---:|---:|---:|
| Jan | SYN-001 | 100,000 kWh | 100,000 kWh | 10,000 | 25 | ₹900,000 | ₹9/kWh |
| Feb | SYN-002 | 110,000 kWh | 110,000 kWh | 10,000 | 25 | ₹990,000 | ₹9/kWh |
| Mar | SYN-003 | 120,000 kWh | 120,000 kWh | 9,000 | 24 | ₹1,080,000 | ₹9/kWh |

Required arithmetic:
- Energy intensity = normalized kWh ÷ output units.
- Jan = 100,000 ÷ 10,000 = **10.00 kWh/unit**.
- Feb = 110,000 ÷ 10,000 = **11.00 kWh/unit**.
- Mar = 120,000 ÷ 9,000 = **13.333… kWh/unit**.
- March intensity relative to January = (13.333… ÷ 10) − 1 = **33.33% higher**.
- March consumption relative to January = (120,000 ÷ 100,000) − 1 = **20% higher**.
- March output relative to January = (9,000 ÷ 10,000) − 1 = **10% lower**.
- Under the deliberately simplified flat-rate assumption, the March bill reconciles arithmetically: 120,000 × ₹9 = **₹1,080,000**.

**Expected base conclusion:** “The synthetic records show higher energy intensity in March than January. The records alone do not establish cause, comparability, addressability, or savings. Investigate the signal before estimating an opportunity.”

A naïve calculation comparing March with January's intensity would calculate 10 kWh/unit × 9,000 March units = 90,000 kWh; 30,000 kWh × ₹9 = ₹270,000. This is **not** an opportunity estimate: it assumes comparable product mix, process, operating conditions, and a valid baseline, none of which the base fixture establishes. The workflow must label this only as an illustrative sensitivity calculation, not as savings, verified exposure, or a recommended financial claim.

## 2. Mutation tests and expected behavior

Each test mutates the base fixture. The required behavior is conservative: surface the issue, preserve provenance, and narrow the conclusion rather than silently “fixing” the data.

| Test ID | Mutation | Required detection | Required outcome / forbidden behavior |
|---|---|---|---|
| T01 — Missing period | Remove February; Jan and Mar remain. | Coverage gap in the monthly series. | State that trend/seasonality inference is limited. Do not interpolate February silently or annualize a two-point difference as established loss. |
| T02 — Mixed units | Record February as 110 MWh while Jan/Mar are kWh. | Unit mismatch or explicit conversion requirement. | Convert only with an explicit, logged conversion (110 MWh = 110,000 kWh); preserve raw value/unit. If unit is unknown/ambiguous, stop the comparison. Never treat 110 MWh as 110 kWh. |
| T03 — Tariff change | March variable rate changes to ₹10/kWh; March bill becomes ₹1,200,000. | Rate/period change; bill no longer comparable at a flat ₹9 rate. | Separate quantity and rate effects. At 120,000 kWh, the ₹1/kWh change contributes ₹120,000 versus the ₹9 reference rate, under this simplified fixture. Do not call it avoidable waste or savings; verify actual tariff and bill components. |
| T04 — Duplicate invoice | Duplicate SYN-003 with the same invoice ID and amount. | Duplicate source-record identifier and duplicated billing period. | Quarantine/flag duplicate and calculate once only after confirming it is a duplicate. Never sum it as additional consumption/cost. |
| T05 — Implausible value | Change March to 12,000,000 kWh while output remains 9,000 units and bill stays ₹1,080,000. | Extreme intensity and a mismatch between energy, bill, and assumed rate. | Flag for source verification; do not auto-delete or accept as true. Under the flat-rate assumption, expected variable bill would be ₹108,000,000, which conflicts with the recorded bill. Stop financial interpretation pending reconciliation. |
| T06 — Operating-context change | Mark March as a different product family, one additional high-energy process, and a materially different shift pattern. | Non-comparable production mix/process/shift context. | Show the raw intensity change but do not attribute it to inefficiency. Request an appropriate stratified or adjusted comparison from qualified staff. |
| T07 — Unsupported causal story | Add a note: “The compressor caused the increase,” with no machine-level evidence. | Claim has no supporting evidence in supplied records. | Label as unverified hypothesis and list discriminating evidence needed. Do not present it as a root cause or prescribe equipment changes. |
| T08 — Unsupported savings claim | Add a draft statement: “GridMind found ₹270,000 monthly savings.” | Claim exceeds what the fixture supports. | Reject/rewrite as a clearly caveated sensitivity calculation; no “savings,” ROI, verified value, or customer result claim. |
| T09 — Missing production denominator | Remove output for March but retain energy and bill. | Intensity cannot be calculated. | Report energy/bill only; do not invent output or compare kWh/unit. |
| T10 — Contradictory records | Provide two different March bills for SYN-003 with no credit/rebill explanation. | Source conflict. | Record both, request reconciliation, and suspend cost-based conclusions until resolved. |
| T11 — Baseline sensitivity | Compare March against January only, then against a hypothetical 3-month median after adding suitable comparable synthetic periods. | Reference period materially affects result. | Report baseline choice and sensitivity; do not choose the baseline that maximizes an apparent opportunity. A median is not automatically valid if periods are not comparable. |
| T12 — No material opportunity | After qualified review, the apparent change is explained by documented product mix and the adjusted comparison shows no actionable residual gap. | Original signal is explained or not material. | Return “no material opportunity established” rather than inventing follow-up work. |
| T13 — Billing basis and fixed charges | Re-express the bill in kVAh with a power factor below 1.0 and add a fixed/demand charge based on contract demand, so the bill is no longer ₹9 × kWh. | Billing unit (kVAh vs kWh), power-factor effect, and fixed-charge share of the bill. | Separate fixed from variable components and state which unit the tariff bills in before computing any per-kWh rate. A drop in volume raises the effective per-unit cost even when nothing about efficiency changed. Do not attribute that rise to waste. Verify the actual tariff order and bill components before any interpretation. |

### Tariff-change arithmetic for T03

- March at old assumed rate: 120,000 kWh × ₹9 = ₹1,080,000.
- March at new assumed rate: 120,000 kWh × ₹10 = ₹1,200,000.
- Difference at identical quantity: 120,000 kWh × ₹1 = **₹120,000**.

This isolates only the arithmetic effect of the changed assumed variable rate. It does not establish that the rate is wrong, avoidable, negotiable, or recoverable; real invoices may include fixed/demand components and other rules.

### Implausible-value arithmetic for T05

- Recorded March: 12,000,000 kWh × ₹9 = ₹108,000,000 under the simplified fixture.
- Recorded bill: ₹1,080,000.
- The order-of-magnitude mismatch is a data-quality stop signal. The workflow must not decide which field is wrong without source verification.

**Real-bill caution (added in PR review):** the flat ₹9/kWh base fixture is arithmetic scaffolding only. Jharkhand industrial tariffs in the FY2026-27 JSERC order are expressed per kVAh with a per-kVA monthly fixed charge, so a real bill has fixed and variable parts and a power-factor effect. T13 exists to make the method handle this before any real-data trial. Confirm current rates from the original tariff order, not from this document.

## 3. Universal output contract

For every test, the analysis record must include:
1. Case/test ID and exact input mutation.
2. Raw values and normalized values kept separately.
3. Data-quality flag, severity, and reason.
4. Calculation formula, units, and result where valid.
5. Assumptions and comparison/baseline choice.
6. Alternative explanations and missing discriminating evidence.
7. Allowed conclusion and prohibited conclusion.
8. Next check, responsible qualified role, and whether work must pause.
9. Reviewer challenge/correction, or “not yet independently reviewed.”
10. Time spent by task and total delivery time.

Permitted status vocabulary: **Observed / Calculated / Estimated / Hypothesis / Recommended / Implemented / Realized / Verified / Sustained**. Do not upgrade status because a calculation is neat or an AI produced it.

## 4. Delivery-effort log template

Complete during each offline run. Do not backfill a guess as measured time.

| Task | Planned minutes | Actual minutes | Person/role | Rework reason | Notes |
|---|---:|---:|---|---|---|
| Scope and intake checklist | | | | | |
| Data coverage and unit checks | | | | | |
| Calculation and reconciliation | | | | | |
| Alternative explanations/baseline sensitivity | | | | | |
| Qualified review (when available) | | | | | |
| Brief and evidence ledger | | | | | |
| Quality check and corrections | | | | | |
| Closeout and next-step note | | | | | |
| **Total** | | | | | |

Also record: number of records; missing/conflicting fields; findings retained/rejected; material corrections; whether a decision changed; whether a qualified reviewer was actually available; direct costs; and what could be standardized. If reviewer review was not performed, mark it **not performed**—never simulate a sign-off.

## 5. Pass/fail acceptance criteria

**Pass the synthetic workflow only if all critical checks pass:**
- T01/T09/T10 stop or narrow invalid comparisons.
- T02 preserves raw units and converts only explicitly.
- T03 separates the assumed rate effect from consumption/efficiency claims.
- T04 prevents double counting.
- T05 flags the impossible/inconsistent record and pauses interpretation.
- T06/T07 preserve uncertainty and refuse unsupported causality.
- T08 removes the unsupported savings claim and blocks any customer-facing financial claim unless its claim register, traceability, review approval, and customer-approved wording are complete.
- T11 discloses baseline sensitivity rather than cherry-picking.
- T12 permits a valid “no opportunity” conclusion.
- T13 separates fixed and variable bill components and states the billing unit; it does not read a volume-driven rise in effective rate as inefficiency.
- All valid calculations are reproducible; missing data is not silently zero-filled.
- The brief distinguishes screening signal, inconclusive/more evidence required, no material opportunity established, potential opportunity, implemented change, realized result, and verified/sustained value; unresolved reviewer dissent remains visible.
- Period coverage, site/meter boundary, source provenance, and comparable production/operating context are explicitly checked; possible duplicate invoices are reviewed using a composite key and never auto-deleted by invoice ID alone.
- Effort is recorded honestly, including founder time and any reviewer time/cost.

**Fail the workflow** if any critical defect silently changes the data, produces a financial claim without adequate evidence, double-counts records, implies cause without support, or hides a stop condition. Fix the method and rerun the affected tests before using it on customer information.

## 6. What a pass would and would not prove

A pass would show only that the defined offline method handles these synthetic edge cases as specified. It would not prove:
- the customer has this problem;
- the chosen scope is commercially differentiated;
- the calculations are sufficient for a real tariff or engineering assessment;
- an independent qualified reviewer agrees;
- 5–10 working days is achievable;
- a buyer will pay any particular price;
- GridMind caused savings or can guarantee an outcome;
- the service is repeatable or scalable.

## 7. Execution record

| Field | Status |
|---|---|
| Fixture version | v1, 2026-10-13 |
| Data | Synthetic only |
| Base arithmetic independently recalculated in the working session | Yes: intensities 10.00, 11.00, 13.333… kWh/unit; March +33.33% vs January; consumption +20%; output −10%; simplified tariff effect T03 ₹120,000 |
| Mutation cases fully executed by an automated test runner | **No** — 12 scenario-level logic assertions were executed in-session against synthetic inputs; this is not a repository/application test suite |
| Independent energy/engineering review | Not performed |
| Manufacturer/customer validation | Not performed |
| Delivery-time validation | Not performed |
| Willingness-to-pay validation | Not performed |
| Customer-data authorization | None; no customer data used |
| Commercial wedge | Not selected |
| Existing 2026-11-10 decision gate | Unchanged |

**Scenario assertion run (2026-10-13):** 12 simplified synthetic logic assertions were run in-session and reported as passing. The assertion script was not saved to the repository, so this result is **not reproducible from this repo** and should be treated as an unverified working-session note until a script is committed. Checks covered gap detection, explicit MWh-to-kWh normalization while preserving raw values, tariff-effect arithmetic, duplicate IDs, bill/energy inconsistency, non-comparable operating context, unsupported causality, unsupported savings language, missing denominator, conflicting bill values, baseline sensitivity, and a valid no-opportunity outcome. The base intensity and tariff arithmetic stated in §1 and §2 was independently rechecked by hand during PR review and is correct. These assertions validate the stated fixture logic and expected arithmetic only; they do not execute GridMind application code, prove a production workflow, or substitute for independent domain review. No delivery effort or reviewer time was measured in this run.

**Next action:** use the fixture for a structured human-reviewed offline walkthrough and log actual effort. If a future implementation is created, translate these cases into automated tests only after the manual workflow and intended data model are stable. Do not build a new application module just to make this document look complete.


## 8. Structured walkthrough record — 2026-10-13

**Review mode:** internal AI-assisted desk walkthrough against the documented synthetic fixtures and expected behaviors. This is not an independent human review, an energy engineer's sign-off, or execution of GridMind application code. No external reviewer participated. Actual elapsed time was not instrumented; no minutes or reviewer hours are claimed.

### Case-by-case walkthrough

| Test | Walkthrough outcome | Gap identified in current specification | Required tightening before a real-data trial |
|---|---|---|---|
| T01 — Missing period | Expected conservative outcome is clear: disclose the gap and do not silently interpolate. | The fixture does not define an expected-period calendar, grace period, or how to handle partial billing cycles. | Record expected periods, received periods, coverage ratio, partial-cycle status, and who approved any exclusion. Default to pause if period coverage could change the conclusion. |
| T02 — Mixed units | The explicit 110 MWh → 110,000 kWh conversion is correct; raw value/unit must remain visible. | Unit conversion is only a simple example; unknown units and meter multipliers are not fully specified. | Maintain raw value, raw unit, normalized value/unit, conversion factor, source, and conversion rule. Unknown unit or uncertain multiplier = stop that calculation. |
| T03 — Tariff change | At fixed synthetic quantity, the simplified variable-rate arithmetic difference is ₹120,000. | Real bills can include demand charges, fixed charges, time-of-day rates, taxes, adjustments, and billing-period differences; simple rate decomposition is not sufficient for a real invoice. | Reconcile bill components and dates separately. Label this calculation as an isolated illustrative variable-rate effect only. Require qualified review before interpreting a real bill. |
| T04 — Duplicate invoice | Same invoice ID appears twice; double-counting must be prevented. | Invoice ID alone may not be globally unique; credits, corrected bills, split invoices, or repeated IDs can be legitimate. | Use a composite review key (site/meter, utility, invoice ID, billing period, amount) and quarantine possible duplicates for source confirmation. Never auto-delete based only on matching ID. |
| T05 — Implausible value | Under the simplified ₹9/kWh assumption, 12,000,000 kWh implies ₹108,000,000 versus a recorded ₹1,080,000 bill; reconciliation is required. | No calibrated anomaly threshold exists; bill reconciliation itself may be invalid if bill amount excludes or combines components differently. | Treat this as a conspicuous contradiction fixture, not a universal threshold. Compare only like-for-like components; record source and unit checks before deciding which field is wrong. |
| T06 — Changed operating context | A different product family/process/shift pattern prevents a straightforward causal interpretation. | No validated normalization model or rule for deciding whether periods are comparable exists. | Present raw metrics and context side-by-side. Do not mathematically adjust unless the model and inputs are reviewed by a qualified domain professional; otherwise stop at a screening signal. |
| T07 — Unsupported cause | “Compressor caused increase” has no evidence attached and must remain a hypothesis. | An empty evidence list is a toy representation and does not define evidence quality or the evidence required to discriminate among causes. | Require a claim-to-evidence map: supporting evidence, contradictory evidence, alternative explanations, and next discriminating check. No root-cause wording without reviewable evidence. |
| T08 — Unsupported savings claim | The ₹270,000 claim is unsupported by the synthetic baseline and must be rejected as a savings claim. | The specification needs a clear approval gate for any customer-facing financial claim. | Add a mandatory claim register with amount, status, formula, baseline, exclusions, attribution method, reviewer, and customer-approved wording. Default to no savings claim if any required field is missing. |
| T09 — Missing denominator | Energy intensity cannot be computed without valid positive output. | The denominator may be wrong even when present: mixed product units, rejects, outsourced production, or inconsistent output definitions can invalidate comparison. | Define output unit and inclusion rules per case; verify consistency across periods. Missing/ambiguous/incomparable denominator blocks intensity analysis. |
| T10 — Conflicting bill values | Two different amounts for the same invoice key must block cost conclusions until reconciled. | Corrected invoices and credit notes may explain the difference; a conflict flag alone cannot determine which record is authoritative. | Preserve both records and their provenance; obtain source-document/credit-note reconciliation and log which version is authoritative. Do not silently overwrite. |
| T11 — Baseline sensitivity | Different reference choices can change the apparent magnitude; the baseline must be disclosed. | The current illustrative assertion uses an arbitrary sensitivity threshold and a hypothetical alternative baseline; it is not a defensible baseline-selection rule. | Remove any universal 1%/other threshold as an acceptance rule. Report results for plausible comparable baselines and explain selection; domain review decides comparability. |
| T12 — No material opportunity | A valid process must allow “no material opportunity established.” | The synthetic case assumes qualified review has occurred; it does not test how reviewer disagreement, uncertainty, or insufficient evidence is handled. | Add a status for “inconclusive / more evidence required,” record reviewer dissent, and permit no-opportunity only when the defined scope was adequately assessed. |

### Walkthrough conclusion

- **Specification-level outcome:** 13 scenarios (T01–T13) have documented conservative expected responses. The document reports that lightweight assertions passed in an earlier walkthrough; this update did not rerun those assertions or independently verify code-level tests.
- **Gaps found:** the method still needs explicit period coverage rules, source provenance and reconciliation, an invoice duplicate-review key, qualified handling of bill components, a comparability/normalization boundary, claim-level evidence traceability, a financial-claim approval gate, output-denominator definitions, defensible baseline selection, and treatment of reviewer disagreement/inconclusive results.
- **Decision:** the workflow is **not ready for customer-data use**. These gaps must be incorporated into the operating specification and reviewed by a qualified person before a real-data trial. Do not claim a technical or commercial pass.
- **Actual effort:** elapsed time was not instrumented during this session. Record as “not measured”; do not infer or backfill hours. No independent reviewer time, external costs, or delivery-time performance is claimed.

### Updated readiness gates

Before any real customer-data trial, require all of:
1. Written scope and data authorization, approved secure handling and retention/deletion rules.
2. Qualified reviewer identified and available for the specific scope.
3. Input provenance, coverage, units, meter/site boundary, and invoice reconciliation documented.
4. Comparability and baseline rationale recorded; unsupported adjustment is prohibited.
5. Every financial claim traceable to formulas, inputs, assumptions, exclusions, and review approval.
6. Clear outcomes for “screening signal,” “inconclusive,” “no material opportunity,” and any supported next step.
7. Actual task time and direct/reviewer costs measured prospectively.
8. Existing technical security gates pass before customer data is entered into GridMind's application.

The commercial wedge remains unselected; C1/C4 remain discovery candidates; ₹15,000 and 5–10 working days remain unvalidated; the 2026-11-10 decision gate is unchanged.
