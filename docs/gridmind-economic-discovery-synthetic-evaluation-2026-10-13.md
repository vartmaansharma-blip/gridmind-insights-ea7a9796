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

### Tariff-change arithmetic for T03

- March at old assumed rate: 120,000 kWh × ₹9 = ₹1,080,000.
- March at new assumed rate: 120,000 kWh × ₹10 = ₹1,200,000.
- Difference at identical quantity: 120,000 kWh × ₹1 = **₹120,000**.

This isolates only the arithmetic effect of the changed assumed variable rate. It does not establish that the rate is wrong, avoidable, negotiable, or recoverable; real invoices may include fixed/demand components and other rules.

### Implausible-value arithmetic for T05

- Recorded March: 12,000,000 kWh × ₹9 = ₹108,000,000 under the simplified fixture.
- Recorded bill: ₹1,080,000.
- The order-of-magnitude mismatch is a data-quality stop signal. The workflow must not decide which field is wrong without source verification.

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
- T08 removes the unsupported savings claim.
- T11 discloses baseline sensitivity rather than cherry-picking.
- T12 permits a valid “no opportunity” conclusion.
- All valid calculations are reproducible; missing data is not silently zero-filled.
- The brief distinguishes screening signal, estimated potential, implemented change, realized result, and verified/sustained value.
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

**Scenario assertion run (2026-10-13):** all 12 simplified synthetic logic assertions passed in-session (12/12). Checks covered gap detection, explicit MWh-to-kWh normalization while preserving raw values, tariff-effect arithmetic, duplicate IDs, bill/energy inconsistency, non-comparable operating context, unsupported causality, unsupported savings language, missing denominator, conflicting bill values, baseline sensitivity, and a valid no-opportunity outcome. Base intensity and tariff arithmetic checks also passed. These assertions validate the stated fixture logic and expected arithmetic only; they do not execute GridMind application code, prove a production workflow, or substitute for independent domain review. No delivery effort or reviewer time was measured in this run.

**Next action:** use the fixture for a structured human-reviewed offline walkthrough and log actual effort. If a future implementation is created, translate these cases into automated tests only after the manual workflow and intended data model are stable. Do not build a new application module just to make this document look complete.
