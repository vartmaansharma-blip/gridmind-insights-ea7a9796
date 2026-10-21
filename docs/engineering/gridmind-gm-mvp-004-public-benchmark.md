# GM-MVP-004 — Reproducible industrial decision benchmark (first slice)

**Status:** experimental, source-backed *public metadata* + deterministic *fictional factory* scenarios. **Not** independently validated operational accuracy, paid product value, savings or Excel/ERP superiority.

**Dependency:** [GridMind commercial MVP #171](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/issues/171), canonical [Master Plan §7](../gridmind-master-plan-2026-10-11.md), and [historical case preparation](../product/gridmind-first-commercial-retrospective-packet.md). These remain the execution and field-evidence authorities. The Buyer Discovery Sprint has no new verified interview.

## 1 — Question and benchmark method

**Can GridMind correctly preserve exact order/resource relationships, uncertainty and owner/contract/safety review gates in seven declared synthetic situations?** To avoid testing an invented "AI advantage", we compare:

1. **GridMind:** use existing `runPhysicalScenario(scenario)` → the actual merged physical/owner/constraint engine, not a copy.
2. **Spreadsheet-style reference:** `spreadsheetBaseline()` is a separate transparent, manually implementable table/join method over the **same** fictional raw core and topology. It joins `resource → operation → routing → work_order → order`, traces directed power-feed links, labels actual machine stop versus possible exposure, and conservatively holds for review. It is *not* a recording of how a real manufacturer uses Excel, ERP or its own engineers.
3. **Locked fixture truth:** a small version-controlled, scenario-by-scenario truth table authored from the *intended fictional experiment contract*, **not** from current GridMind evaluator output. This is useful for regression and does **not** count as third-party ground truth.

Both systems see the same input context. Report: affected order IDs, exposure category, candidate-vs-hold review disposition, and confirmed/unconfirmed owner conflict. Fail the fixed benchmark for any disagreement with the locked fixture; **do not** announce incremental commercial advantage even if GridMind matches the sheet or runs faster on a developer computer. A conservative spreadsheet can reasonably match the small sample.

Included fictional cases: normal; verified machine stop (order on other line stays unaffected); upstream panel interruption (two lines are *potentially* exposed, not confirmed stopped); suspected power fault; owner favors work on stopped press; owner avoids otherwise feasible work; unconfirmed inferred owner preference. All recommendations are candidates only and physical actuation is absent.

**Run:** `bun scripts/run-industrial-benchmark.ts` prints reproducible JSON. `bun run test` runs `benchmark.test.ts` and `public-failure-windows.test.ts` along with existing GridMind tests. No real customer data, new libraries, network requests, new API endpoints, production DB writes or environment secrets.

**Interpreting a result:** `gridmindLockedFixturePass / 7` and `spreadsheetLockedFixturePass / 7` are *scenario conformance*, not measured accuracy on real factories. `agreementCount / 7` is agreement with the spreadsheet-style reference, not superiority. The report intentionally leaves real-case accuracy, actual manual time, GridMind effort and economic benefit **null**.

## 2 — Real public source examined without disguising its limits

**UCI MetroPT-3 (Davari et al.; DOI [10.24432/C5VW3R](https://doi.org/10.24432/C5VW3R), [UCI primary record](https://archive.ics.uci.edu/dataset/791/metropt+3+dataset), Creative Commons Attribution 4.0).** The source describes real operational readings of a **metro-train air compressor** (reported 1,516,948 entries; 15 measured signals). Its metadata includes four operator-reported air-leak failure windows in 2020. We encoded and audited **only those four publicly documented event intervals**, preserving local wall-clock times as reported because a timezone was **not specified**. No raw sensor rows were downloaded, imported, predicted or analyzed; no false fault diagnosis or detection-time estimate was made. The dataset provides **no verified automotive customer orders, plant routing, alternative-machine qualification or owner constraints**. Therefore real order-impact accuracy remains *not evaluable*. This source may be used later for separate sensor anomaly detection comparisons, never to certify a manufacturer's production decisions.

**UCI SECOM (McCann & Johnston; DOI [10.24432/C54305](https://doi.org/10.24432/C54305), [UCI primary record](https://archive.ics.uci.edu/dataset/179/secom), CC BY 4.0)**: actual semiconductor process measurements (reported 1,567 instances) with pass/fail labels and missing values. It is a candidate for a *separate quality classification benchmark*, not a source of automotive production routing or material/order impacts. **Zero SECOM sample rows were processed** by this PR.

The two real sources prove only that public equipment/quality data exist with limitations. They **cannot** validate the GridMind business, identify production-line losses, reconstruct a customer's Excel baseline, or show preventable damage. Real source metadata and invented factory data are never merged into a single "customer case."

### Attribution and reproduction

`src/lib/industrial-core/public-failure-windows.ts` credits the original UCI metadata and preserves four published fault windows, not customer documents or times produced by the GridMind app. The computed duration is **wall-clock difference**, not exact elapsed physical time with a known timezone. Source license is CC BY 4.0; source credit accompanies the results. The UCI source may correct its metadata in the future, so a subsequent full-data test must version/hash its downloaded inputs, document any correction, and license/cite it properly.

## 3 — Failure, acceptance and stop conditions

- **PASS synthetic engineering only:** all expected fictional cases agree, an explicit resource interruption does not contaminate an unrelated order, electrical network exposure does not automatically certify a stopped machine, inferred objectives are not "confirmed", existing tests/build/security pass.
- **FAIL:** wrong order affected, misclassified owner state, recommendation/approval permitted while conflicting or missing required facts, fabricated source/benefit, a real data URI passed to synthetic customer-facing APIs, or broken CI.
- **NOT MEASURED:** real factory detection quality/speed, actual plant loss, customer decision impact, experienced spreadsheet analyst's time, successful qualified manufacturing/safety review, actual willingness to pay or net profit. A synthetic 7/7 is not 10/10 readiness.
- **Block commercial usage:** customer records require documented rights, independent engineering review, #29/#130 Auth/tenant/migration release and independently verified production controls. No unapproved live assets or control actions.

## 4 — Next evidence upgrade, without requiring the founder to interview manufacturers now

1. Obtain and version a **permissively licensed public measurement sample** through an offline, reproducible ingestion job with explicit source hash, timezone/units, schema rejection, and held-out evaluation. Do not silently auto-fetch large datasets in CI or accept private user uploads into public routes.
2. Run independent equipment-fault classification/baseline only if the dataset supplies ground-truth event windows and a defensible cutoff, and report false alarms/missed events and time-to-detection. **Do not attach fictional customer orders to genuine sensor rows.**
3. Add a separately qualified engineering review when assessing industrial causation or alternative-machine capability. For a paid commercial experiment, customer operational permission and comparable incumbent decisions remain future gates. The founder can pursue software validation and public-data research without personal outreach in this phase.

**Rollback:** revert this PR. No production migration or customer data is affected.
