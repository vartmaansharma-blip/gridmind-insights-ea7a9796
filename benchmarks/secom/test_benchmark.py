"""No-network unit tests plus explicit cached-real-source acceptance.

Normal tests use tiny invented records only to test mathematical/parser boundaries.
They are never included in the real SECOM scores.
"""
import csv
import json
import os
import tempfile
import unittest
import warnings
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch

import numpy as np
from numpy.testing import assert_allclose

import benchmark as bench
import fetch


class OfflineContracts(unittest.TestCase):
    def test_source_labels_and_naive_time_are_explicit(self):
        X, y, times = bench.parse_measurements(b"1 NaN\n3 4\n", b'-1 "19/07/2008 11:55:00"\n1 "19/07/2008 13:17:00"\n', width=2)
        self.assertEqual(X.shape, (2, 2))
        self.assertTrue(np.isnan(X[0, 1]))
        self.assertEqual(y.tolist(), [0, 1])
        self.assertIsNone(times[0].tzinfo)
        self.assertEqual(times[0].day, 19)

    def test_rejects_width_row_count_labels_timestamp_and_nonfinite_values(self):
        good = b'-1 "19/07/2008 11:55:00"\n'
        for X, y in [(b"1\n", good), (b"1 2\n3 4\n", good),
                     (b"1 2\n", good.replace(b"-1", b"0")),
                     (b"1 2\n", good.replace(b"19/07", b"32/07")),
                     (b"1 inf\n", good), (b"1 nan\n", good), (b"", b"")]:
            with self.subTest(X=X, y=y), self.assertRaises(ValueError):
                bench.parse_measurements(X, y, width=2)

    def test_tampered_archive_stops_before_modeling(self):
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / "corrupt.zip"
            archive.write_bytes(b"not the original bytes")
            with self.assertRaisesRegex(ValueError, "SHA-256"):
                bench.load_archive(archive)

    def test_fetch_checksum_change_never_overwrites_cached_archive(self):
        class Response:
            headers = {}
            def __enter__(self): return self
            def __exit__(self, *_): return False
            def geturl(self): return fetch.URL
            def read(self, _): return b"changed upstream bytes"
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory)
            (cache / "secom.zip").write_bytes(b"preserve me")
            with patch("urllib.request.urlopen", return_value=Response()), self.assertRaisesRegex(ValueError, "checksum"):
                fetch.acquire(cache)
            self.assertEqual((cache / "secom.zip").read_bytes(), b"preserve me")

    def test_split_is_whole_day_strictly_temporal_label_blind_and_complete(self):
        start = datetime(2008, 7, 19)
        times = [start + timedelta(hours=i // 2) for i in range(240)][::-1]
        train, test = bench.chronological_split(times)
        self.assertEqual(len(set(train) | set(test)), len(times))
        self.assertFalse(set(train) & set(test))
        self.assertLess(max(times[i] for i in train), min(times[i] for i in test))
        self.assertFalse({times[i].date() for i in train} & {times[i].date() for i in test})
        for fraction in [0, 1, -0.3]:
            with self.assertRaises(ValueError): bench.chronological_split(times, fraction)
        with self.assertRaises(ValueError): bench.chronological_split([start] * 10)

    def test_test_only_values_cannot_change_training_imputation_selection_or_scaling(self):
        X = np.array([[1, 5, np.nan, 3], [2, 5, np.nan, 6], [np.nan, 5, np.nan, 9], [4, 5, np.nan, 12]])
        y = np.array([0, 1, 0, 1])
        model = bench.supervised_pipeline()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model.fit(X, y)
            before = [model["median"].statistics_.copy(), model["scale"].mean_.copy(), model["classifier"].coef_.copy()]
            model.predict(np.array([[99999, -500, 99999, np.nan]]))
        assert_allclose(before[0], model["median"].statistics_, equal_nan=True)
        assert_allclose(before[1], model["scale"].mean_)
        assert_allclose(before[2], model["classifier"].coef_)
        self.assertEqual(model["median"].statistics_[0], 2)
        self.assertEqual(len(model["scale"].mean_), 2)
        self.assertEqual(model["classifier"].n_features_in_, 2)

    def test_metrics_independently_recompute_with_fail_as_positive(self):
        actual = np.array([0, 0, 1, 1])
        predicted = np.array([0, 1, 0, 1])
        result = bench.measure(actual, predicted, np.array([0.1, 0.6, 0.4, 0.9]))
        self.assertEqual(result["confusion_matrix"], [[1, 1], [1, 1]])
        self.assertEqual(result["precision"], 0.5)
        self.assertEqual(result["recall"], 0.5)
        self.assertEqual(result["balanced_accuracy"], 0.5)
        self.assertAlmostEqual(result["average_precision"], (1 + 2 / 3) / 2)

    def test_no_failure_predictions_have_undefined_precision_not_fabricated_perfection(self):
        result = bench.measure(np.array([0, 0, 0, 1]), np.zeros(4), np.full(4, 0.1))
        self.assertIsNone(result["precision"])
        self.assertEqual(result["recall"], 0)
        self.assertEqual(result["balanced_accuracy"], 0.5)
        self.assertEqual(result["average_precision"], 0.25)
        self.assertIsNone(bench.wilson(0, 0))
        self.assertGreater(bench.wilson(0, 26)["upper"], 0.12)

    def test_single_class_bootstrap_sample_is_explicitly_not_estimable(self):
        result = bench.measure(np.zeros(3), np.zeros(3), np.zeros(3))
        self.assertIsNone(result["average_precision"])
        self.assertIsNone(result["balanced_accuracy"])
        self.assertIsNone(result["recall"])

    def test_bootstrap_is_paired_and_reproducible(self):
        y = np.array([0, 1, 0, 1])
        predictions = {"majority": np.zeros(4), "logistic_regression": np.zeros(4)}
        scores = {"majority": np.full(4, 0.1), "logistic_regression": np.full(4, 0.1)}
        times = [datetime(2008, 7, 19), datetime(2008, 7, 19), datetime(2008, 7, 20), datetime(2008, 7, 20)]
        a = bench.block_uncertainty(y, predictions, scores, times, repeats=20)
        self.assertEqual(a, bench.block_uncertainty(y, predictions, scores, times, repeats=20))
        self.assertEqual(a["test_day_blocks"], 2)
        self.assertEqual(a["logistic_minus_majority"]["average_precision"]["upper"], 0)

    def test_report_is_regenerated_from_outputs_and_chart_counts_are_independently_aggregated(self):
        import render_report
        with tempfile.TemporaryDirectory() as directory, patch.object(render_report, "REPO", Path(directory)):
            (Path(directory) / "docs/engineering").mkdir(parents=True)
            artifact = Path(directory) / "artifact.json"
            report = render_report.render(artifact)
            self.assertIn("negative benchmark result", report.read_text())
            payload = json.loads(artifact.read_text())
            actual = {(row["method"], row["error"]): row["count"] for row in payload["snapshot"]["datasets"]["errors"]}
            self.assertEqual(actual, {("Majority", "Missed failures"): 26, ("Majority", "False alarms"): 0,
                                      ("Logistic regression", "Missed failures"): 26, ("Logistic regression", "False alarms"): 7})
            self.assertIn("SUM(CASE", payload["sources"][0]["query"]["sql"])

    def test_duplicate_measurement_vectors_cannot_cross_split(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            bench.profile(np.array([[1, 2], [1, 2]]), np.array([0, 1]),
                          [datetime(2008, 7, 19), datetime(2008, 7, 20)], np.array([0]), np.array([1]))


@unittest.skipUnless(os.environ.get("SECOM_REAL_ACCEPTANCE") == "1", "explicit cached-real-data acceptance only")
class RealSourceAcceptance(unittest.TestCase):
    def test_locked_real_source_and_report_reproduce_offline(self):
        expected = json.loads((bench.ROOT / "results/results.json").read_text())
        with tempfile.TemporaryDirectory() as directory, patch("urllib.request.urlopen", side_effect=AssertionError("Offline runner attempted network")):
            actual = bench.run(bench.ROOT / "cache/secom.zip", Path(directory))
            self.assertEqual(actual["split"], expected["split"])
            self.assertEqual(actual["data_quality"], expected["data_quality"])
            self.assertEqual(actual["source_archive_sha256"], expected["source_archive_sha256"])
            self.assertEqual(actual["protocol_sha256"], expected["protocol_sha256"])
            for name in actual["methods"]:
                self.assertEqual(actual["methods"][name]["confusion_matrix"], expected["methods"][name]["confusion_matrix"])
                for metric in bench.METRICS:
                    a, b = actual["methods"][name][metric], expected["methods"][name][metric]
                    if a is None or b is None: self.assertIs(a, b)
                    else: self.assertAlmostEqual(a, b, places=8)
            self.assertEqual(actual["uncertainty"], expected["uncertainty"])
            self.assertEqual((Path(directory) / "split.json").read_bytes(), (bench.ROOT / "results/split.json").read_bytes())
            # Independent CSV-level confusion recomputation, no sklearn scorer.
            with (Path(directory) / "held-out-predictions.csv").open() as stream:
                predictions = list(csv.DictReader(stream))
            self.assertEqual(len(predictions), actual["split"]["test"]["rows"])
            for name, field in [("majority", "majority_predicted_fail"), ("logistic_regression", "logistic_predicted_fail")]:
                cm = [[0, 0], [0, 0]]
                for row in predictions: cm[int(row["actual_fail"])][int(row[field])] += 1
                self.assertEqual(cm, expected["methods"][name]["confusion_matrix"])
            self.assertEqual(actual["data_quality"]["shape"], [1567, 590])
            self.assertEqual(actual["data_quality"]["labels"]["fail"], 104)
            self.assertEqual(actual["data_quality"]["missing_cells"], 41951)
            self.assertEqual(len(actual["coefficients"]), actual["preprocessing"]["after_training_variance"])


if __name__ == "__main__":
    unittest.main()
