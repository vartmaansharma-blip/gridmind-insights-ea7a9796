"""Offline SECOM parsing, train-only preparation and frozen held-out comparison.

This module accepts local archive bytes only. It has no DB, HTTP, factory, payment,
credential, application-server or model-serving integration.
"""
import argparse
import csv
import hashlib
import importlib.metadata
import io
import json
import math
import platform
import re
import warnings
import zipfile
from datetime import datetime
from pathlib import Path

import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.exceptions import ConvergenceWarning
from sklearn.feature_selection import VarianceThreshold
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent
SEED = 20261021
METRICS = ("accuracy", "precision", "recall", "specificity", "balanced_accuracy", "average_precision")


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def sha(payload):
    return hashlib.sha256(payload).hexdigest()


def parse_measurements(data: bytes, labels: bytes, width=590):
    rows, outcomes, times = [], [], []
    for line_number, line in enumerate(data.decode("ascii").splitlines(), 1):
        tokens = line.split()
        if len(tokens) != width:
            raise ValueError(f"Measurement width at physical line {line_number}: {len(tokens)} != {width}")
        values = [float(token) for token in tokens]
        if any(not math.isfinite(value) and token != "NaN" for value, token in zip(values, tokens)):
            raise ValueError(f"Non-finite value other than literal NaN at line {line_number}")
        rows.append(values)
    for line_number, line in enumerate(labels.decode("ascii").splitlines(), 1):
        match = re.fullmatch(r'(-1|1) "(\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2})"', line)
        if not match:
            raise ValueError(f"Invalid label/timestamp at physical line {line_number}")
        outcomes.append(int(match[1]) == 1)
        times.append(datetime.strptime(match[2], "%d/%m/%Y %H:%M:%S"))
    if not rows or len(rows) != len(outcomes):
        raise ValueError("Measurement and label rows do not align")
    return np.asarray(rows, dtype=np.float64), np.asarray(outcomes, dtype=np.int64), times


def load_archive(archive: Path):
    lock = json.loads((ROOT / "source-lock.json").read_text())
    payload = archive.read_bytes()
    if sha(payload) != lock["archive_sha256"]:
        raise ValueError("Archive SHA-256 mismatch; reacquire exact source or review a new dataset version")
    with zipfile.ZipFile(io.BytesIO(payload)) as bundle:
        if sorted(bundle.namelist()) != sorted(lock["members"]):
            raise ValueError("Unexpected archive members")
        files = {}
        for name, expected in lock["members"].items():
            info = bundle.getinfo(name)
            if info.file_size != expected["bytes"]:
                raise ValueError("Member size mismatch")
            content = bundle.read(name)  # Never extract paths supplied by an archive.
            if sha(content) != expected["sha256"]:
                raise ValueError("Member SHA-256 mismatch")
            files[name] = content
    X, y, times = parse_measurements(files["secom.data"], files["secom_labels.data"])
    if X.shape != (lock["documented_instances"], lock["observed_measurement_columns"]):
        raise ValueError("Pinned source shape changed")
    return X, y, times, lock


def chronological_split(times, fraction=0.7):
    if not 0 < fraction < 1:
        raise ValueError("Invalid training fraction")
    if len(times) < 2:
        raise ValueError("Too few observations")
    # Deterministic, label-blind selection. Entire test calendar day stays held out.
    order = np.asarray(sorted(range(len(times)), key=lambda i: (times[i], i)), dtype=int)
    boundary = max(1, int(len(order) * fraction))
    boundary_day = times[order[boundary]].date()
    while boundary < len(order) and times[order[boundary]].date() == boundary_day:
        boundary += 1
    if boundary == len(order):
        raise ValueError("No later whole day remains for held-out evaluation")
    return order[:boundary], order[boundary:]


def counts(y):
    return {"pass": int((y == 0).sum()), "fail": int((y == 1).sum()), "rows": int(len(y)),
            "failure_prevalence": float(np.mean(y))}


def profile(X, y, times, train, test):
    missing = np.isnan(X)
    days = np.asarray([time.date().isoformat() for time in times])
    row_hashes = [sha(canonical([None if np.isnan(v) else float(v) for v in row])) for row in X]
    train_hashes, test_hashes = {row_hashes[i] for i in train}, {row_hashes[i] for i in test}
    if train_hashes & test_hashes:
        raise ValueError("Exact duplicate measurement vectors cross the time split; review grouping before fitting")
    feature_profile = []
    for i in range(X.shape[1]):
        observed = X[:, i][~missing[:, i]]
        train_observed = X[train, i][~missing[train, i]]
        feature_profile.append({"feature": f"measurement_{i:03d}", "source_column_one_based": i + 1,
                                "description": "Anonymized real process measurement; physical meaning and units not supplied",
                                "missing": int(missing[:, i].sum()),
                                "train_missing": int(missing[train, i].sum()),
                                "test_missing": int(missing[test, i].sum()),
                                "unique_observed": int(len(np.unique(observed))),
                                "train_unique_observed": int(len(np.unique(train_observed)))})
    return {"shape": list(X.shape), "labels": counts(y), "missing_cells": int(missing.sum()),
            "missing_fraction": float(missing.mean()),
            "all_missing_columns": [r["feature"] for r in feature_profile if r["unique_observed"] == 0],
            "nonempty_constant_columns": [r["feature"] for r in feature_profile if r["unique_observed"] == 1],
            "train_all_missing_columns": [r["feature"] for r in feature_profile if r["train_unique_observed"] == 0],
            "features": feature_profile,
            "exact_duplicate_measurement_rows": len(row_hashes) - len(set(row_hashes)),
            "cross_split_duplicate_measurement_vectors": len(train_hashes & test_hashes),
            "duplicate_timestamps": len(times) - len(set(times)),
            "source_timestamp_inversions": sum(a > b for a, b in zip(times, times[1:])),
            "timestamp_min": min(times).isoformat(), "timestamp_max": max(times).isoformat(),
            "timezone": "not supplied; source wall-clock dates retained without inventing UTC",
            "batch_machine_wafer_groups": "not supplied; hidden group dependence cannot be excluded",
            "daily": [{"day": day, **counts(y[days == day]),
                       "missing_fraction": float(missing[days == day].mean())} for day in sorted(set(days))]}


def supervised_pipeline():
    return Pipeline([
        ("median", SimpleImputer(strategy="median", keep_empty_features=False)),
        ("nonconstant", VarianceThreshold()),
        ("scale", StandardScaler()),
        ("classifier", LogisticRegression(C=1.0, class_weight="balanced", solver="liblinear",
                                          max_iter=5000, random_state=SEED)),
    ])


def measure(y, predicted, scores):
    tn, fp, fn, tp = (int(value) for value in confusion_matrix(y, predicted, labels=[0, 1]).ravel())
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn) if tp + fn else None
    specificity = tn / (tn + fp) if tn + fp else None
    return {"confusion_matrix": [[tn, fp], [fn, tp]], "tn": tn, "fp": fp, "fn": fn, "tp": tp,
            "accuracy": (tp + tn) / len(y), "precision": precision, "recall": recall,
            "specificity": specificity,
            "balanced_accuracy": (recall + specificity) / 2 if recall is not None and specificity is not None else None,
            "average_precision": float(average_precision_score(y, scores)) if tp + fn and tn + fp else None,
            "flagged_for_review": tp + fp}


def wilson(successes, trials):
    """Supplement for zero-success degeneracy; assumes independent Bernoulli trials."""
    if trials == 0:
        return None
    z = 1.959963984540054
    proportion = successes / trials
    denominator = 1 + z * z / trials
    center = (proportion + z * z / (2 * trials)) / denominator
    half_width = z * math.sqrt(proportion * (1 - proportion) / trials + z * z / (4 * trials * trials)) / denominator
    return {"lower": max(0.0, center - half_width), "upper": min(1.0, center + half_width),
            "successes": successes, "trials": trials,
            "assumption": "iid binomial sensitivity only; unknown production clustering may invalidate nominal coverage"}


def block_uncertainty(y, predictions, scores, test_times, repeats=2000):
    days = np.asarray([value.date().isoformat() for value in test_times])
    groups = [np.flatnonzero(days == day) for day in sorted(set(days))]
    rng = np.random.default_rng(SEED)
    distributions = {name: {metric: [] for metric in METRICS} for name in predictions}
    differences = {metric: [] for metric in METRICS}
    for _ in range(repeats):
        indices = np.concatenate([groups[i] for i in rng.integers(0, len(groups), size=len(groups))])
        values = {name: measure(y[indices], predictions[name][indices], scores[name][indices]) for name in predictions}
        for name, result in values.items():
            for metric in METRICS:
                if result[metric] is not None:
                    distributions[name][metric].append(result[metric])
        for metric in METRICS:
            a, b = values["logistic_regression"][metric], values["majority"][metric]
            if a is not None and b is not None:
                differences[metric].append(a - b)
    def summarize(values):
        return {"lower": float(np.quantile(values, 0.025)) if values else None,
                "upper": float(np.quantile(values, 0.975)) if values else None,
                "estimable_replicates": len(values), "total_replicates": repeats}
    return {"method": "paired calendar-day cluster percentile bootstrap, fixed fitted models",
            "test_day_blocks": len(groups), "seed": SEED,
            "intervals": {name: {metric: summarize(values) for metric, values in metrics.items()}
                          for name, metrics in distributions.items()},
            "logistic_minus_majority": {metric: summarize(values) for metric, values in differences.items()},
            "limitations": "Conditional on fitted training data. No training-refit uncertainty; day blocks do not identify unknown production batches, and dependence may span multiple days."}


def run(archive: Path, output: Path):
    protocol = json.loads((ROOT / "protocol.json").read_text())
    X, y, times, lock = load_archive(archive)
    train, test = chronological_split(times, protocol["train_fraction"])
    quality = profile(X, y, times, train, test)
    if len(np.unique(y[train])) < 2 or len(np.unique(y[test])) < 2:
        raise ValueError("Training and held-out data must both contain pass and fail labels")
    output.mkdir(parents=True, exist_ok=True)
    # Persist preparation before fitting. IDs are original physical lines, never model features.
    split = {"method": protocol["split"], "train": counts(y[train]), "test": counts(y[test]),
             "train_start": min(times[i] for i in train).isoformat(), "train_end": max(times[i] for i in train).isoformat(),
             "test_start": min(times[i] for i in test).isoformat(), "test_end": max(times[i] for i in test).isoformat(),
             "train_source_lines": (train + 1).tolist(), "test_source_lines": (test + 1).tolist(),
             "strict_chronology": max(times[i] for i in train) < min(times[i] for i in test)}
    assert split["strict_chronology"] and set(train).isdisjoint(test)
    (output / "split.json").write_bytes(canonical(split) + b"\n")
    majority = DummyClassifier(strategy="most_frequent").fit(X[train], y[train])
    model = supervised_pipeline()
    with warnings.catch_warnings(record=True) as captured:
        warnings.simplefilter("always")
        model.fit(X[train], y[train])
    if any(issubclass(item.category, ConvergenceWarning) for item in captured):
        raise ValueError("Logistic regression failed to converge; do not publish incomplete fit")
    predictions = {"majority": majority.predict(X[test]), "logistic_regression": model.predict(X[test])}
    scores = {"majority": np.full(len(test), float(np.mean(y[train]))),
              "logistic_regression": model.predict_proba(X[test])[:, 1]}
    results = {name: measure(y[test], predictions[name], scores[name]) for name in predictions}
    for metrics in results.values():
        metrics["recall_wilson_95_iid_sensitivity"] = wilson(metrics["tp"], metrics["tp"] + metrics["fn"])
        metrics["precision_wilson_95_iid_sensitivity"] = wilson(metrics["tp"], metrics["tp"] + metrics["fp"])
    kept = np.flatnonzero(~np.isnan(model["median"].statistics_))
    selected = kept[model["nonconstant"].get_support()]
    coefficients = [{"feature": f"measurement_{i:03d}", "coefficient_per_training_standard_deviation": float(coef)}
                    for i, coef in zip(selected, model["classifier"].coef_[0])]
    report = {"benchmark_version": protocol["benchmark_version"], "origin": "real_public_semiconductor_measurements",
              "source_archive_sha256": lock["archive_sha256"], "protocol_sha256": sha(canonical(protocol)),
              "positive_class": "fail", "confusion_matrix_axes": "rows actual [pass, fail]; columns predicted [pass, fail]",
              "precision_recall_auc_definition": "non-interpolated average precision (AP), not trapezoidal PR integration",
              "undefined_metrics": "null when denominator is zero; never invent perfect precision for predicting no failures",
              "data_quality": {key: value for key, value in quality.items() if key != "features"},
              "split": {key: value for key, value in split.items() if not key.endswith("source_lines")},
              "preprocessing": {"fit_rows": len(train), "original_features": X.shape[1],
                                "after_training_median": len(kept), "after_training_variance": len(selected),
                                "fit_warnings": [str(item.message) for item in captured],
                                "classifier_iterations": model["classifier"].n_iter_.tolist()},
              "methods": results,
              "uncertainty": block_uncertainty(y[test], predictions, scores, [times[i] for i in test]),
              "coefficient_interpretation": "Association conditional on correlated anonymized signals, not physical importance or cause. Balanced training scores are not calibrated failure probabilities.",
              "coefficients": coefficients,
              "environment": {"python": platform.python_version(), "platform": platform.system(), **{name: importlib.metadata.version(name)
                             for name in ("numpy", "scipy", "scikit-learn", "joblib", "threadpoolctl")}},
              "limitations": ["Unknown feature timing relative to the final test prevents early-warning claims.",
                              "No batch, tool, wafer, machine, route, actionable lead time or intervention cost supplied.",
                              "A single historical source and temporal holdout do not establish transfer to another plant or Indian automotive manufacturing.",
                              "No customer adoption, willingness to pay, management outcome or realized savings was measured.",
                              "No raw records enter the GridMind app, production Supabase or public routes."]}
    (output / "feature-profile.json").write_text(json.dumps(quality["features"], indent=2, allow_nan=False) + "\n")
    (output / "results.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    with (output / "held-out-predictions.csv").open("w", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["source_line", "test_timestamp_no_timezone", "actual_fail", "majority_predicted_fail",
                         "majority_score", "logistic_predicted_fail", "logistic_score_uncalibrated"])
        for position, i in enumerate(test):
            writer.writerow([i + 1, times[i].isoformat(), int(y[i]), int(predictions["majority"][position]),
                             format(scores["majority"][position], ".12g"), int(predictions["logistic_regression"][position]),
                             format(scores["logistic_regression"][position], ".12g")])
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=ROOT / "cache/secom.zip")
    parser.add_argument("--output", type=Path, default=ROOT / "results")
    args = parser.parse_args()
    result = run(args.archive, args.output)
    print(json.dumps({"split": result["split"], "methods": result["methods"],
                      "preprocessing": result["preprocessing"]}, indent=2))
