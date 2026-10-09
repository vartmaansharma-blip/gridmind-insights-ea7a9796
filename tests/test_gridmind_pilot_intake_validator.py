import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "scripts" / "validate-gridmind-pilot-intake.py"
spec = importlib.util.spec_from_file_location("gridmind_intake_validator", MODULE_PATH)
validator = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(validator)

class IntakeValidatorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.obs = self.root / "observations.csv"
        self.ops = self.root / "operating-contexts.csv"
        self.eco = self.root / "economic-context.csv"

    def tearDown(self):
        self.temp.cleanup()

    def write(self, path, headers, rows):
        with path.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)

    def valid_rows(self):
        obs = {
            "factory_id":"F1", "asset_id":"A1",
            "period_start":"2026-01-01T00:00:00+05:30",
            "period_end":"2026-02-01T00:00:00+05:30",
            "role":"energy", "metric":"energy_consumption_kwh",
            "value_numeric":"0", "value_text":"", "unit":"kWh",
            "quality_status":"validated", "is_estimated":"false",
            "source_system":"meter-export", "source_record_id":"row-1",
            "source_reference":"controlled://meter-export/row-1", "notes":""
        }
        op = {
            "factory_id":"F1", "asset_id":"A1",
            "start_time":"2026-01-01T00:00:00+05:30",
            "end_time":"2026-02-01T00:00:00+05:30",
            "status":"validated", "confidence":"0.9",
            "operating_state":"running", "product_code":"P1",
            "source_system":"ops-export", "source_record_id":"op-1",
            "source_reference":"controlled://ops/op-1", "notes":""
        }
        eco = {
            "factory_id":"F1", "context_name":"tariff-2026",
            "effective_from":"2026-01-01T00:00:00+05:30",
            "effective_until":"", "currency":"INR",
            "tariff_inr_per_kwh":"8.5", "recoverable_fraction":"", "intervention_cost_inr":"",
            "source_system":"invoice", "source_record_id":"bill-1",
            "source_reference":"controlled://bills/bill-1", "notes":""
        }
        return obs, op, eco

    def write_all(self, obs, op, eco):
        self.write(self.obs, validator.OBS, obs)
        self.write(self.ops, validator.OPS, op)
        self.write(self.eco, validator.ECO, eco)

    def test_explicit_zero_is_preserved_and_not_treated_as_missing(self):
        self.write_all(*([self.valid_rows()[0]], [self.valid_rows()[1]], [self.valid_rows()[2]]))
        errors, blockers = validator.validate(self.obs, self.ops, self.eco)
        self.assertEqual(errors, [])
        self.assertEqual(blockers, [])

    def test_blank_numeric_measurement_is_error_not_zero(self):
        obs, op, eco = self.valid_rows()
        obs["value_numeric"] = ""
        self.write_all([obs], [op], [eco])
        errors, _ = validator.validate(self.obs, self.ops, self.eco)
        self.assertTrue(any("provide exactly one" in e for e in errors))

    def test_missing_tariff_is_explicit_blocker(self):
        obs, op, eco = self.valid_rows()
        eco["tariff_inr_per_kwh"] = ""
        self.write_all([obs], [op], [eco])
        errors, blockers = validator.validate(self.obs, self.ops, self.eco)
        self.assertEqual(errors, [])
        self.assertTrue(any("tariff is absent" in b for b in blockers))

    def test_overlapping_same_role_periods_are_rejected(self):
        obs, op, eco = self.valid_rows()
        second = dict(obs, source_record_id="row-2", period_start="2026-01-20T00:00:00+05:30")
        self.write_all([obs, second], [op], [eco])
        errors, _ = validator.validate(self.obs, self.ops, self.eco)
        self.assertTrue(any("overlapping periods" in e for e in errors))

    def test_timezone_is_required(self):
        obs, op, eco = self.valid_rows()
        obs["period_start"] = "2026-01-01T00:00:00"
        self.write_all([obs], [op], [eco])
        errors, _ = validator.validate(self.obs, self.ops, self.eco)
        self.assertTrue(any("must include a timezone" in e for e in errors))

    def test_unknown_explicit_role_is_rejected_even_with_known_metric(self):
        obs, op, eco = self.valid_rows()
        obs["role"] = "made_up_role"
        self.write_all([obs], [op], [eco])
        errors, _ = validator.validate(self.obs, self.ops, self.eco)
        self.assertTrue(any("explicit role" in e for e in errors))

if __name__ == "__main__":
    unittest.main()
