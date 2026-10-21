# GM-MVP-005 — Real SECOM quality benchmark

## Measured result: no useful failure detection at the fixed threshold

On **451 later semiconductor production tests**, balanced logistic regression detected **0 of 26 failures**, missed **26** and raised **7 false alarms**. The majority baseline calls everything a pass and also misses all failures. This is a successfully reproduced **negative benchmark result**, not a successful quality-detection product. Do not deploy this classifier or claim improved manufacturing quality.

The existing GridMind industrial-core constraint, owner and physical-dependency engines are preserved. This benchmark is an offline Python experiment in the same repository; it does not convert their synthetic-only APIs into real-data services. PR [#175](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/175) catalogued SECOM but processed zero measurement rows. GM-MVP-005 separately processes genuine public measurements. It does not measure an advantage for the industrial core or combine these measurements with fictional automotive orders or Claude's market research.

## Exact errors and metrics

A positive means the source's **failed in-house test** (+1); pass (-1) maps to zero. Both methods see the same training rows and are scored on the same untouched later rows. At the fixed 0.5 classification threshold:

| Method | TN | FP | FN | TP | Precision | Recall | Balanced accuracy | PR AUC (AP) | Accuracy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Training-majority baseline | 425 | 0 | 26 | 0 | undefined (no positive predictions) | 0.0000 | 0.5000 | 0.0576 | 0.9424 |
| Balanced logistic regression | 418 | 7 | 26 | 0 | 0.0000 | 0.0000 | 0.4918 | 0.0678 | 0.9268 |


Confusion matrices use rows **actual [pass, fail]**, columns **predicted [pass, fail]**. Majority: `[[425, 0], [26, 0]]`; logistic: `[[418, 7], [26, 0]]`. TN = correctly passed; FP = passing item flagged as failed; FN = missed failure; TP = detected failure. The [held-out predictions](../../benchmarks/secom/results/held-out-predictions.csv) allow independent row-level reconciliation. A reported 94.2% baseline accuracy is misleading without recall: it misses every failure because most items pass.

Precision = TP/(TP+FP); recall = TP/(TP+FN); specificity = TN/(TN+FP); balanced accuracy = (recall+specificity)/2; accuracy = (TP+TN)/all test rows. Undefined precision is null, not perfect or fabricated. **PR AUC here means scikit-learn non-interpolated average precision (AP)**, the precision-weighted recall-increment sum, not trapezoidal integration. Constant scores have AP equal to held-out failure prevalence (0.0576). Logistic's AP point estimate is 0.0678, but that small ranking difference is insufficient evidence of useful detection or improvement.

## Genuine data, attribution and quality findings

Source: McCann, M. & Johnston, A. (2008), **SECOM [Dataset]**, UCI Machine Learning Repository, [DOI 10.24432/C54305](https://doi.org/10.24432/C54305), [official record](https://archive.ics.uci.edu/dataset/179/secom), [official ZIP](https://archive.ics.uci.edu/static/public/179/secom.zip). UCI documents **CC BY 4.0** ([license](https://creativecommons.org/licenses/by/4.0/)). Public HTTPS access required no login. Retain source/author/license credit and identify derived changes; no author/UCI endorsement is claimed. Raw bytes are unchanged in the ignored local archive. GridMind derives parsing, chronological splits, imputation/scaling, model coefficients, predictions and reports.

Downloaded **2026-10-21T10:47:26.680799+00:00**. Archive size 1,964,989 bytes; SHA-256 **`eea568baf3c2229096d7d294cf0b096b5502bd96d92c0b80a65b84714059be8e`**. No semantic dataset release version, HTTP ETag or Last-Modified was supplied. Member ZIP dates are 2023-05-22 packaging metadata, not 2008 measurement dates. Hashes identify the exact snapshot. The [source lock](../../benchmarks/secom/source-lock.json) retains the original receipt, member dates, page checksum and access/license notes.

- `secom.data`: `20f0e7ee434f7dcbae0eea9ffff009a2b57f42d6b0dc9a5bd4f00782c0a3374c` (5,389,983 bytes).
- `secom.names`: `6d91b0b46cdee03064ee3e3112f937c1b3f7fcd9933575794ec07974e6f1ea59` (4,223 bytes).
- `secom_labels.data`: `126884cf453705c9e61a903fe906f0665a3b45ce3639e621edc5c93c89627e03` (40,638 bytes).

Each original line represents one production entity with a test outcome and test timestamp. The actual matrix is **1,567 × 590**. UCI's page and names file say 591 features, but **every actual row has 590 numeric measurement columns**. We document this discrepancy and do not invent a column. Features are indexed `measurement_000`–`measurement_589`; semantic names, physical units, availability times, machines and production groups are absent. The label and timestamp live in a separate aligned file and are never model inputs. The archived names file says donation 2008-11-19 while the current page says 2008-11-18; neither is an observation date.

Observed labels: **1,463 pass / 104 fail**, failure prevalence **6.64%**. Missingness: **41,951/924,530 cells (4.54%)**, literal `NaN`; 0 entirely missing columns; 116 nonempty constant columns over the full dataset. Most sparse: measurement_157: 1,429/1,567 missing; measurement_158: 1,429/1,567 missing; measurement_292: 1,429/1,567 missing. Per-column train/test missing counts and observed uniqueness are in [feature-profile.json](../../benchmarks/secom/results/feature-profile.json); per-day class counts and missingness are in [results.json](../../benchmarks/secom/results/results.json). Missingness is profiled, not assumed random. No measurements, labels or rows are dropped to improve scores.

No exact duplicate measurement vectors or cross-split vector duplicates were found. There are **33 repeated timestamps** and **0 source-order timestamp inversions**. Recorded wall-clock observations span **2008-07-19T11:55:00–2008-10-17T06:07:00**. Timezone is not supplied; source times remain naive instead of being mislabeled UTC.

## Chronological separation and leakage controls

The fixed [protocol](../../benchmarks/secom/protocol.json) chooses approximately the earliest 70% for training, moves the boundary to the next whole calendar day and holds later days out. Labels do not choose the cutoff. All equal timestamps and calendar days stay in one partition; no random stratification obscures temporal drift. Result:

| Partition | Time interval (source wall clock; timezone unknown) | Rows | Pass | Fail |
|---|---|---:|---:|---:|
| Train | 2008-07-19T11:55:00–2008-09-26T20:31:00 | 1116 | 1038 | 78 |
| Held out | 2008-09-27T00:16:00–2008-10-17T06:07:00 | 451 | 425 | 26 |

The complete original physical-line membership is in [split.json](../../benchmarks/secom/results/split.json). Training and test sets are disjoint and strictly ordered. Missing-value medians, all-missing-column handling, constant-column removal, standard scaling and class weights are learned **only on the 1116 training rows**. Full-data profiles are descriptive and never passed to feature selection or fitting. We detect and reject exact duplicate vectors across the split. We cannot enforce group separation for unknown wafers/batches/machines; adjacent days can still share production context. Features may have been collected at or after the final quality test: chronology alone does not establish actionable prediction lead time.

## Transparent frozen models and reproducibility

Baseline: training-majority class with a constant training failure-prevalence score. Classifier: L2 logistic regression, `C=1`, `class_weight=balanced`, `solver=liblinear`, `max_iter=5000`, `random_state=20261021`. It uses all nonconstant training-imputed/scaled measurement columns. 590 input columns become **468 fitted features**. Fit converged in 11 iterations; no fit warnings. Standardized coefficients are retained in results for inspection, not interpreted as physical causes. Balanced-class scores are **uncalibrated** and must not be presented as actual failure probabilities.

The protocol was written before fitting; no held-out model selection, threshold tuning, oversampling or feature search occurred. This is an exploratory first benchmark, not an externally preregistered evaluation. No random-CV literature result is quoted as comparable performance: its split and preprocessing protocol differ. Both methods use identical rows, labels and metric definitions. A poor result does not justify hiding the holdout or selecting a better-looking threshold on it.

[Run instructions](../../benchmarks/secom/README.md) cover explicit acquisition, fully offline preparation/training and no-network tests. Python **3.12.14**, NumPy **2.3.5**, SciPy **1.16.3**, scikit-learn **1.7.2**, joblib **1.5.2**, threadpoolctl **3.6.0** are recorded and pinned. The [executed notebook](../../benchmarks/secom/inspection.ipynb) imports the same parser/runner and independently reconciles predictions. It is a companion, not a second pipeline. Raw data remain in ignored local cache; there is no application import, Supabase write, migration, credential change, serving endpoint or equipment connection.

## Uncertainty and robustness: a small ranking difference is inconclusive

The held-out sample has only **26 failures over 21 calendar days**. We report 2,000 seeded **paired day-block bootstrap** replicates of the fixed fitted predictions. Days, rather than individual rows, are resampled for limited dependence protection. Logistic AP 95% interval is **0.0346–0.1188**. The paired logistic-minus-majority AP interval is **-0.0033–0.0421**, including zero. Do not infer a reliable improvement from the point estimate.

All bootstrap recall values are zero because the empirical test set contains no detected failures. **This degenerate interval does not prove population recall is exactly zero.** An explicitly iid-only Wilson sensitivity interval for 0/26 recall is **0–12.9%**; it too can be optimistic when unknown manufacturing groups are dependent. Precision bootstrap has 1,999/2,000 estimable replicates for logistic because one replicate includes no positive predictions; majority precision is never estimable. Counts of estimable replicates accompany every interval. Bootstrap does not refit training data, establish cross-plant uncertainty or address multi-day/unknown-group dependence. No causal or business-value inference is supported.

Verified negative/robustness contracts reject corrupt hashes, schema/label/timestamp drift, unsupported infinity, row misalignment and cross-split duplicate vectors; prevent held-out values from changing imputation/selection/scaling; handle empty metric denominators; reproduce block resampling; and independently rebuild confusion counts from exported predictions. Reproduction compares frozen splits, source/protocol hashes, quality counts, exact confusion counts, metric values and uncertainty. Small platform float differences in coefficients are not mistaken for different source versions.

## Founder interpretation and next engineering dependency

This experiment shows that GridMind can **ingest, audit and fairly test a real public industrial dataset offline**, expose its errors and reproduce a negative result. It **does not yet demonstrate meaningful failure classification** with this model/threshold. High pass-rate accuracy is not a customer benefit; missing every failure makes it unsuitable for quality triage. The small AP difference is uncertain and no cost, action, factory improvement or payment was measured.

The next dependency is a **prospective evaluation contract**: obtain documented feature timing and production-group identity (or choose a better-documented licensed dataset), define an actual review decision and false-alarm/missed-defect costs with qualified authority, then reserve a genuinely new temporal/group holdout. Any tuning should use nested training-only chronological validation and an explicit review-capacity/cost threshold. Because this holdout is now observed, later performance on it must be labeled exploratory, not a new blind test. Do not activate management automation based on this result. Customer rights, independent industrial/security reviews and #29/#130 remain separate release dependencies.

## Open questions and acceptance boundary

Which measurements exist before the quality outcome, what do they physically mean, how are lots/batches related, and what action can an authorized manager still take? Is there a useful lead time, what is the false-alarm burden, and does a new dataset support the intended industrial process? Those answers are unavailable here. Semiconductor testing does not establish Indian automotive performance, realized savings, customer validation or willingness to pay. No factory outreach or market study was conducted for this benchmark.

Engineering acceptance is **reproducible honest measurements and preserved app behavior**, not a minimum accuracy target. The prepared benchmark workflow template explicitly acquires hash-locked UCI bytes before offline reproduction. **Dedicated hosted benchmark automation is blocked:** GitHub rejected creating a workflow because the OAuth connection lacks `workflow` scope. The full offline real-data acceptance ran locally. A workflow-enabled connection must publish `benchmarks/secom/ci-workflow.yml.example` as `.github/workflows/secom-benchmark.yml` before claiming that additional hosted check. Existing CI, quality, browser and isolated migration checks remain required. Review status and exact candidate checks belong in the PR; an older green SHA does not validate a newer one. Rollback is reverting this isolated source/report increment, with no production database changes.
