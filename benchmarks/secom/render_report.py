"""Generate the repository report and a canonical portable-report payload from measured outputs."""
import argparse
import json
import csv
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent


def render(artifact_path=None):
    r = json.loads((ROOT / "results/results.json").read_text())
    lock = json.loads((ROOT / "source-lock.json").read_text())
    q, split = r["data_quality"], r["split"]
    methods = r["methods"]
    majority, model = methods["majority"], methods["logistic_regression"]
    ap_delta = r["uncertainty"]["logistic_minus_majority"]["average_precision"]
    rate = lambda value: "undefined (no positive predictions)" if value is None else f"{value:.4f}"
    table = "| Method | TN | FP | FN | TP | Precision | Recall | Balanced accuracy | PR AUC (AP) | Accuracy |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n"
    for key, label in [("majority", "Training-majority baseline"), ("logistic_regression", "Balanced logistic regression")]:
        m = methods[key]
        table += f"| {label} | {m['tn']} | {m['fp']} | {m['fn']} | {m['tp']} | {rate(m['precision'])} | {rate(m['recall'])} | {rate(m['balanced_accuracy'])} | {rate(m['average_precision'])} | {rate(m['accuracy'])} |\n"
    hashes = "\n".join(f"- `{name}`: `{meta['sha256']}` ({meta['bytes']:,} bytes)." for name, meta in lock["members"].items())
    top_missing = sorted(json.loads((ROOT / "results/feature-profile.json").read_text()), key=lambda row: row['missing'], reverse=True)[:3]
    sparse = "; ".join(f"{row['feature']}: {row['missing']:,}/{q['labels']['rows']:,} missing" for row in top_missing)
    report = f'''# GM-MVP-005 — Real SECOM quality benchmark

## Measured result: no useful failure detection at the fixed threshold

On **{split['test']['rows']} later semiconductor production tests**, balanced logistic regression detected **{model['tp']} of {split['test']['fail']} failures**, missed **{model['fn']}** and raised **{model['fp']} false alarms**. The majority baseline calls everything a pass and also misses all failures. This is a successfully reproduced **negative benchmark result**, not a successful quality-detection product. Do not deploy this classifier or claim improved manufacturing quality.

The existing GridMind industrial-core constraint, owner and physical-dependency engines are preserved. This benchmark is an offline Python experiment in the same repository; it does not convert their synthetic-only APIs into real-data services. PR [#175](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/pull/175) catalogued SECOM but processed zero measurement rows. GM-MVP-005 separately processes genuine public measurements. It does not measure an advantage for the industrial core or combine these measurements with fictional automotive orders or Claude's market research.

## Exact errors and metrics

A positive means the source's **failed in-house test** (+1); pass (-1) maps to zero. Both methods see the same training rows and are scored on the same untouched later rows. At the fixed 0.5 classification threshold:

{table}

Confusion matrices use rows **actual [pass, fail]**, columns **predicted [pass, fail]**. Majority: `{majority['confusion_matrix']}`; logistic: `{model['confusion_matrix']}`. TN = correctly passed; FP = passing item flagged as failed; FN = missed failure; TP = detected failure. The [held-out predictions](../../benchmarks/secom/results/held-out-predictions.csv) allow independent row-level reconciliation. A reported {majority['accuracy']:.1%} baseline accuracy is misleading without recall: it misses every failure because most items pass.

Precision = TP/(TP+FP); recall = TP/(TP+FN); specificity = TN/(TN+FP); balanced accuracy = (recall+specificity)/2; accuracy = (TP+TN)/all test rows. Undefined precision is null, not perfect or fabricated. **PR AUC here means scikit-learn non-interpolated average precision (AP)**, the precision-weighted recall-increment sum, not trapezoidal integration. Constant scores have AP equal to held-out failure prevalence ({split['test']['failure_prevalence']:.4f}). Logistic's AP point estimate is {model['average_precision']:.4f}, but that small ranking difference is insufficient evidence of useful detection or improvement.

## Genuine data, attribution and quality findings

Source: McCann, M. & Johnston, A. (2008), **SECOM [Dataset]**, UCI Machine Learning Repository, [DOI 10.24432/C54305](https://doi.org/10.24432/C54305), [official record](https://archive.ics.uci.edu/dataset/179/secom), [official ZIP](https://archive.ics.uci.edu/static/public/179/secom.zip). UCI documents **CC BY 4.0** ([license](https://creativecommons.org/licenses/by/4.0/)). Public HTTPS access required no login. Retain source/author/license credit and identify derived changes; no author/UCI endorsement is claimed. Raw bytes are unchanged in the ignored local archive. GridMind derives parsing, chronological splits, imputation/scaling, model coefficients, predictions and reports.

Downloaded **{lock['first_acquisition']['downloaded_at_utc']}**. Archive size {lock['first_acquisition']['bytes']:,} bytes; SHA-256 **`{lock['archive_sha256']}`**. No semantic dataset release version, HTTP ETag or Last-Modified was supplied. Member ZIP dates are 2023-05-22 packaging metadata, not 2008 measurement dates. Hashes identify the exact snapshot. The [source lock](../../benchmarks/secom/source-lock.json) retains the original receipt, member dates, page checksum and access/license notes.

{hashes}

Each original line represents one production entity with a test outcome and test timestamp. The actual matrix is **{q['shape'][0]:,} × {q['shape'][1]}**. UCI's page and names file say 591 features, but **every actual row has 590 numeric measurement columns**. We document this discrepancy and do not invent a column. Features are indexed `measurement_000`–`measurement_589`; semantic names, physical units, availability times, machines and production groups are absent. The label and timestamp live in a separate aligned file and are never model inputs. The archived names file says donation 2008-11-19 while the current page says 2008-11-18; neither is an observation date.

Observed labels: **{q['labels']['pass']:,} pass / {q['labels']['fail']} fail**, failure prevalence **{q['labels']['failure_prevalence']:.2%}**. Missingness: **{q['missing_cells']:,}/{q['shape'][0] * q['shape'][1]:,} cells ({q['missing_fraction']:.2%})**, literal `NaN`; {len(q['all_missing_columns'])} entirely missing columns; {len(q['nonempty_constant_columns'])} nonempty constant columns over the full dataset. Most sparse: {sparse}. Per-column train/test missing counts and observed uniqueness are in [feature-profile.json](../../benchmarks/secom/results/feature-profile.json); per-day class counts and missingness are in [results.json](../../benchmarks/secom/results/results.json). Missingness is profiled, not assumed random. No measurements, labels or rows are dropped to improve scores.

No exact duplicate measurement vectors or cross-split vector duplicates were found. There are **{q['duplicate_timestamps']} repeated timestamps** and **{q['source_timestamp_inversions']} source-order timestamp inversions**. Recorded wall-clock observations span **{q['timestamp_min']}–{q['timestamp_max']}**. Timezone is not supplied; source times remain naive instead of being mislabeled UTC.

## Chronological separation and leakage controls

The fixed [protocol](../../benchmarks/secom/protocol.json) chooses approximately the earliest 70% for training, moves the boundary to the next whole calendar day and holds later days out. Labels do not choose the cutoff. All equal timestamps and calendar days stay in one partition; no random stratification obscures temporal drift. Result:

| Partition | Time interval (source wall clock; timezone unknown) | Rows | Pass | Fail |
|---|---|---:|---:|---:|
| Train | {split['train_start']}–{split['train_end']} | {split['train']['rows']} | {split['train']['pass']} | {split['train']['fail']} |
| Held out | {split['test_start']}–{split['test_end']} | {split['test']['rows']} | {split['test']['pass']} | {split['test']['fail']} |

The complete original physical-line membership is in [split.json](../../benchmarks/secom/results/split.json). Training and test sets are disjoint and strictly ordered. Missing-value medians, all-missing-column handling, constant-column removal, standard scaling and class weights are learned **only on the {split['train']['rows']} training rows**. Full-data profiles are descriptive and never passed to feature selection or fitting. We detect and reject exact duplicate vectors across the split. We cannot enforce group separation for unknown wafers/batches/machines; adjacent days can still share production context. Features may have been collected at or after the final quality test: chronology alone does not establish actionable prediction lead time.

## Transparent frozen models and reproducibility

Baseline: training-majority class with a constant training failure-prevalence score. Classifier: L2 logistic regression, `C=1`, `class_weight=balanced`, `solver=liblinear`, `max_iter=5000`, `random_state=20261021`. It uses all nonconstant training-imputed/scaled measurement columns. {r['preprocessing']['original_features']} input columns become **{r['preprocessing']['after_training_variance']} fitted features**. Fit converged in {r['preprocessing']['classifier_iterations'][0]} iterations; no fit warnings. Standardized coefficients are retained in results for inspection, not interpreted as physical causes. Balanced-class scores are **uncalibrated** and must not be presented as actual failure probabilities.

The protocol was written before fitting; no held-out model selection, threshold tuning, oversampling or feature search occurred. This is an exploratory first benchmark, not an externally preregistered evaluation. No random-CV literature result is quoted as comparable performance: its split and preprocessing protocol differ. Both methods use identical rows, labels and metric definitions. A poor result does not justify hiding the holdout or selecting a better-looking threshold on it.

[Run instructions](../../benchmarks/secom/README.md) cover explicit acquisition, fully offline preparation/training and no-network tests. Python **{r['environment']['python']}**, NumPy **{r['environment']['numpy']}**, SciPy **{r['environment']['scipy']}**, scikit-learn **{r['environment']['scikit-learn']}**, joblib **{r['environment']['joblib']}**, threadpoolctl **{r['environment']['threadpoolctl']}** are recorded and pinned. The [executed notebook](../../benchmarks/secom/inspection.ipynb) imports the same parser/runner and independently reconciles predictions. It is a companion, not a second pipeline. Raw data remain in ignored local cache; there is no application import, Supabase write, migration, credential change, serving endpoint or equipment connection.

## Uncertainty and robustness: a small ranking difference is inconclusive

The held-out sample has only **{split['test']['fail']} failures over {r['uncertainty']['test_day_blocks']} calendar days**. We report 2,000 seeded **paired day-block bootstrap** replicates of the fixed fitted predictions. Days, rather than individual rows, are resampled for limited dependence protection. Logistic AP 95% interval is **{r['uncertainty']['intervals']['logistic_regression']['average_precision']['lower']:.4f}–{r['uncertainty']['intervals']['logistic_regression']['average_precision']['upper']:.4f}**. The paired logistic-minus-majority AP interval is **{ap_delta['lower']:.4f}–{ap_delta['upper']:.4f}**, including zero. Do not infer a reliable improvement from the point estimate.

All bootstrap recall values are zero because the empirical test set contains no detected failures. **This degenerate interval does not prove population recall is exactly zero.** An explicitly iid-only Wilson sensitivity interval for 0/{split['test']['fail']} recall is **0–{model['recall_wilson_95_iid_sensitivity']['upper']:.1%}**; it too can be optimistic when unknown manufacturing groups are dependent. Precision bootstrap has 1,999/2,000 estimable replicates for logistic because one replicate includes no positive predictions; majority precision is never estimable. Counts of estimable replicates accompany every interval. Bootstrap does not refit training data, establish cross-plant uncertainty or address multi-day/unknown-group dependence. No causal or business-value inference is supported.

Verified negative/robustness contracts reject corrupt hashes, schema/label/timestamp drift, unsupported infinity, row misalignment and cross-split duplicate vectors; prevent held-out values from changing imputation/selection/scaling; handle empty metric denominators; reproduce block resampling; and independently rebuild confusion counts from exported predictions. Reproduction compares frozen splits, source/protocol hashes, quality counts, exact confusion counts, metric values and uncertainty. Small platform float differences in coefficients are not mistaken for different source versions.

## Founder interpretation and next engineering dependency

This experiment shows that GridMind can **ingest, audit and fairly test a real public industrial dataset offline**, expose its errors and reproduce a negative result. It **does not yet demonstrate meaningful failure classification** with this model/threshold. High pass-rate accuracy is not a customer benefit; missing every failure makes it unsuitable for quality triage. The small AP difference is uncertain and no cost, action, factory improvement or payment was measured.

The next dependency is a **prospective evaluation contract**: obtain documented feature timing and production-group identity (or choose a better-documented licensed dataset), define an actual review decision and false-alarm/missed-defect costs with qualified authority, then reserve a genuinely new temporal/group holdout. Any tuning should use nested training-only chronological validation and an explicit review-capacity/cost threshold. Because this holdout is now observed, later performance on it must be labeled exploratory, not a new blind test. Do not activate management automation based on this result. Customer rights, independent industrial/security reviews and #29/#130 remain separate release dependencies.

## Open questions and acceptance boundary

Which measurements exist before the quality outcome, what do they physically mean, how are lots/batches related, and what action can an authorized manager still take? Is there a useful lead time, what is the false-alarm burden, and does a new dataset support the intended industrial process? Those answers are unavailable here. Semiconductor testing does not establish Indian automotive performance, realized savings, customer validation or willingness to pay. No factory outreach or market study was conducted for this benchmark.

Engineering acceptance is **reproducible honest measurements and preserved app behavior**, not a minimum accuracy target. The prepared benchmark workflow template explicitly acquires hash-locked UCI bytes before offline reproduction. **Dedicated hosted benchmark automation is blocked:** GitHub rejected creating a workflow because the OAuth connection lacks `workflow` scope. The full offline real-data acceptance ran locally. A workflow-enabled connection must publish `benchmarks/secom/ci-workflow.yml.example` as `.github/workflows/secom-benchmark.yml` before claiming that additional hosted check. Existing CI, quality, browser and isolated migration checks remain required. Review status and exact candidate checks belong in the PR; an older green SHA does not validate a newer one. Rollback is reverting this isolated source/report increment, with no production database changes.
'''
    destination = REPO / "docs/engineering/gridmind-gm-mvp-005-secom-benchmark.md"
    destination.write_text(report)
    if artifact_path:
        title = "GridMind SECOM: reproducible experiment, no useful failure detection"
        generated = datetime.now(timezone.utc).isoformat()
        query = """WITH predictions AS (
 SELECT 'Majority' AS method, actual_fail AS actual, majority_predicted_fail AS predicted FROM held_out_predictions
 UNION ALL
 SELECT 'Logistic regression', actual_fail, logistic_predicted_fail FROM held_out_predictions
)
SELECT method, 'Missed failures' AS error, SUM(CASE WHEN actual=1 AND predicted=0 THEN 1 ELSE 0 END) AS count FROM predictions GROUP BY method
UNION ALL
SELECT method, 'False alarms', SUM(CASE WHEN actual=0 AND predicted=1 THEN 1 ELSE 0 END) FROM predictions GROUP BY method"""
        # Materially recompute chart numerators from original per-row held-out outcomes/predictions.
        # This disposable SQLite audit is local reporting only, not another application database.
        with sqlite3.connect(":memory:") as audit:
            audit.row_factory = sqlite3.Row
            audit.execute("CREATE TABLE held_out_predictions(actual_fail INTEGER, majority_predicted_fail INTEGER, logistic_predicted_fail INTEGER)")
            with (ROOT / "results/held-out-predictions.csv").open() as stream:
                audit.executemany("INSERT INTO held_out_predictions VALUES(?,?,?)", [
                    (int(row["actual_fail"]), int(row["majority_predicted_fail"]), int(row["logistic_predicted_fail"]))
                    for row in csv.DictReader(stream)])
            chart_rows = [dict(row) for row in audit.execute(query)]
        source = {"id": "measured", "label": "Independent held-out prediction error audit", "path": "benchmarks/secom/results/held-out-predictions.csv",
                  "query": {"language": "sql", "engine": "SQLite (ephemeral, standard Python library)",
                            "sql": query,
                            "description": "Read-only aggregation of each exported held-out label and model prediction. Predictions originate from benchmark.py with scikit-learn 1.7.2; this audit independently counts FN/FP for the chart.",
                            "tables_used": ["held_out_predictions"],
                            "filters": ["CSV contains held-out whole days 2008-09-27 to 2008-10-17 only; fail positive"],
                            "metric_definitions": {"errors": "FN missed failures; FP false alarms among held-out production entities"}}}
        sections = report.split("\n## ")
        blocks = [{"id": "title", "type": "markdown", "body": "# " + title}]
        for i, section in enumerate(sections[1:]):
            blocks.append({"id": f"section-{i}", "type": "markdown", "body": "## " + section})
            if i == 1: blocks.append({"id": "errors", "type": "chart", "chartId": "errors"})
        artifact = {"surface": "report", "manifest": {"version": 1, "surface": "report", "title": title,
                    "description": "GM-MVP-005 genuine public semiconductor benchmark; fixed later holdout, errors and source limitations.",
                    "generatedAt": generated, "filters": [], "cards": [], "tables": [], "sources": [source], "blocks": blocks,
                    "charts": [{"id": "errors", "type": "bar", "title": "Neither method detects a held-out failure",
                               "subtitle": "451 tests; 26 actual failures. Counts compare fixed-threshold errors on identical rows.",
                               "dataset": "errors", "sourceId": "measured",
                               "encodings": {"x": {"field": "error", "type": "nominal", "label": "Error type"},
                                             "y": {"field": "count", "type": "quantitative", "label": "Production entities"},
                                             "color": {"field": "method", "type": "nominal", "label": "Method"}}}]},
                    "snapshot": {"version": 1, "generatedAt": generated, "status": "ready", "accessIssues": [],
                                 "datasets": {"errors": chart_rows}}, "sources": [source]}
        # Portable reader sources and narrative links must be durable, never machine-local or parent traversals.
        branch = "feat/gm-mvp-005-secom-real-data"
        for block in blocks:
            if block["type"] == "markdown":
                block["body"] = block["body"].replace("](../../", f"](https://github.com/vartmaansharma-blip/gridmind-insights-ea7a9796/blob/{branch}/")
        artifact_path.parent.mkdir(parents=True, exist_ok=True)
        artifact_path.write_text(json.dumps(artifact, indent=2) + "\n")
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", type=Path)
    print(render(parser.parse_args().artifact))
