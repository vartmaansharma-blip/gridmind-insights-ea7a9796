#!/usr/bin/env python3
"""Validate GridMind pilot CSVs locally; never uploads or writes to a database."""
from __future__ import annotations

import argparse
import csv
import math
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

OBS = ["factory_id", "asset_id", "period_start", "period_end", "role", "metric", "value_numeric", "value_text", "unit", "quality_status", "is_estimated", "source_system", "source_record_id", "source_reference", "notes"]
OPS = ["factory_id", "asset_id", "start_time", "end_time", "status", "confidence", "operating_state", "product_code", "source_system", "source_record_id", "source_reference", "notes"]
ECO = ["factory_id", "context_name", "effective_from", "effective_until", "currency", "tariff_inr_per_kwh", "recoverable_fraction", "intervention_cost_inr", "source_system", "source_record_id", "source_reference", "notes"]
ROLES = {"energy", "production", "operating_hours", "operating_state", "product_code"}
CANONICAL = {"energy_consumption_kwh", "production_output", "operating_hours", "operating_state", "product_code"}
USABLE_QUALITY = {"observed", "derived", "validated", "valid", "active"}
TRUE = {"true", "1", "yes"}
FALSE = {"false", "0", "no"}

def parse_time(value: str, label: str, errors: list[str]) -> datetime | None:
    if not value.strip():
        errors.append(f"{label}: missing timestamp")
        return None
    try:
        dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        errors.append(f"{label}: invalid ISO-8601 timestamp {value!r}")
        return None
    if dt.tzinfo is None or dt.utcoffset() is None:
        errors.append(f"{label}: timestamp must include a timezone")
        return None
    return dt

def read_csv(path: Path, expected: list[str], errors: list[str]) -> list[dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            if reader.fieldnames != expected:
                errors.append(f"{path}: headers must match the repository template exactly; expected: {','.join(expected)}")
                return []
            rows: list[dict[str, str]] = []
            for line_number, row in enumerate(reader, start=2):
                if None in row:
                    errors.append(f"{path}:{line_number}: row has extra columns; expected {len(expected)} fields")
                    continue
                normalized = {k: (v or "").strip() for k, v in row.items()}
                if not any(normalized.values()):
                    continue
                rows.append(normalized)
            return rows
    except OSError as exc:
        errors.append(f"{path}: cannot read file ({exc})")
        return []

def required(row: dict[str, str], fields: list[str], label: str, errors: list[str]) -> None:
    for field in fields:
        if not row.get(field, "").strip():
            errors.append(f"{label}: {field} is required")

def number(value: str, label: str, errors: list[str], *, low: float | None = None, high: float | None = None, optional: bool = False) -> float | None:
    if value == "" and optional:
        return None
    if value == "":
        errors.append(f"{label}: numeric value is missing (blank is not zero)")
        return None
    try:
        n = float(value)
    except ValueError:
        errors.append(f"{label}: {value!r} is not numeric")
        return None
    if not math.isfinite(n):
        errors.append(f"{label}: value must be finite")
        return None
    if low is not None and n < low or high is not None and n > high:
        errors.append(f"{label}: value {n} is outside allowed range")
        return None
    return n

def validate(obs_path: Path, ops_path: Path, eco_path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    blockers: list[str] = []
    observations = read_csv(obs_path, OBS, errors)
    operating = read_csv(ops_path, OPS, errors)
    economics = read_csv(eco_path, ECO, errors)

    source_ids: set[tuple[str, str]] = set()
    intervals: dict[tuple[str, str, str], list[tuple[datetime, datetime, str]]] = defaultdict(list)
    observation_periods: list[tuple[str, str, datetime, datetime, str]] = []
    valid_context_coverage: list[tuple[str, str, datetime, datetime, str]] = []
    economic_coverage: list[tuple[str, datetime, datetime | None, str, float | None, str]] = []
    factories: set[str] = set()
    for i, row in enumerate(observations, 2):
        label = f"{obs_path.name}:{i}"
        required(row, ["factory_id", "asset_id", "period_start", "period_end", "role", "metric", "unit", "quality_status", "is_estimated", "source_system", "source_record_id", "source_reference"], label, errors)
        factories.add(row.get("factory_id", ""))
        role = row.get("role", "")
        metric = row.get("metric", "")
        if role and role not in ROLES:
            errors.append(f"{label}: explicit role {role!r} is not recognized by the authoritative adapter")
        elif not role and metric not in CANONICAL:
            errors.append(f"{label}: metric {metric!r} is not recognized by the authoritative adapter")
        if row.get("quality_status", "").lower() not in USABLE_QUALITY:
            blockers.append(f"{label}: quality_status {row.get('quality_status')!r} is not an accepted analysis quality; do not upgrade it without review")
        est = row.get("is_estimated", "").lower()
        if est not in TRUE | FALSE:
            errors.append(f"{label}: is_estimated must be true/false (or 1/0, yes/no)")
        elif est in TRUE and row.get("quality_status", "").lower() in {"validated", "valid", "active"}:
            blockers.append(f"{label}: estimated evidence is labelled as validated/active; review and label it provisionally rather than treating it as measured evidence")
        numeric = row.get("value_numeric", "")
        text = row.get("value_text", "")
        if bool(numeric) == bool(text):
            errors.append(f"{label}: provide exactly one of value_numeric or value_text")
        if numeric:
            number(numeric, f"{label}: value_numeric", errors)
        expected_unit = {"energy": "kWh", "operating_hours": "h"}.get(role)
        if expected_unit and row.get("unit", "").strip().lower() != expected_unit.lower():
            errors.append(f"{label}: role {role!r} requires unit {expected_unit!r}; do not convert units implicitly")
        metric_unit = {"energy_consumption_kwh": "kWh", "operating_hours": "h"}.get(metric)
        if metric_unit and row.get("unit", "").strip().lower() != metric_unit.lower():
            errors.append(f"{label}: metric {metric!r} requires unit {metric_unit!r}")
        if text and (role in {"energy", "production", "operating_hours"} or metric in {"energy_consumption_kwh", "production_output", "operating_hours"}):
            errors.append(f"{label}: numeric measurement role cannot use value_text")
        start = parse_time(row.get("period_start", ""), f"{label}: period_start", errors)
        end = parse_time(row.get("period_end", ""), f"{label}: period_end", errors)
        if start and end:
            if end <= start:
                errors.append(f"{label}: period_end must be after period_start")
            if end > start:
                observation_periods.append((row.get("factory_id", ""), row.get("asset_id", ""), start, end, label))
            key_role = role or metric
            intervals[(row.get("factory_id", ""), row.get("asset_id", ""), key_role)].append((start, end, label))
        sid = row.get("source_record_id", "")
        if sid:
            key = (row.get("source_system", ""), sid)
            if key in source_ids:
                errors.append(f"{label}: duplicate source_system/source_record_id {key!r}")
            source_ids.add(key)

    for key, rows in intervals.items():
        rows.sort(key=lambda x: x[0])
        for prev, curr in zip(rows, rows[1:]):
            if curr[0] < prev[1]:
                errors.append(f"{curr[2]}: overlapping periods for factory/asset/role {key}; resolve against source records")

    context_intervals: dict[tuple[str, str], list[tuple[datetime, datetime, str, str]]] = defaultdict(list)
    for i, row in enumerate(operating, 2):
        label = f"{ops_path.name}:{i}"
        required(row, ["factory_id", "asset_id", "start_time", "end_time", "status", "source_system", "source_record_id", "source_reference"], label, errors)
        factories.add(row.get("factory_id", ""))
        start = parse_time(row.get("start_time", ""), f"{label}: start_time", errors)
        end = parse_time(row.get("end_time", ""), f"{label}: end_time", errors)
        if start and end:
            if end <= start:
                errors.append(f"{label}: end_time must be after start_time")
            else:
                signature = "|".join([row.get("operating_state", ""), row.get("product_code", "")])
                context_intervals[(row.get("factory_id", ""), row.get("asset_id", ""))].append((start, end, signature, label))
                if row.get("status", "").lower() in USABLE_QUALITY:
                    valid_context_coverage.append((row.get("factory_id", ""), row.get("asset_id", ""), start, end, label))
        if row.get("status", "").lower() not in USABLE_QUALITY:
            blockers.append(f"{label}: status is not an accepted analysis status; human review required")
        if row.get("confidence"):
            number(row["confidence"], f"{label}: confidence", errors, low=0, high=1)

    for factory, asset, period_start, period_end, observation_label in observation_periods:
        if not any(
            ctx_factory == factory and ctx_asset == asset and ctx_start <= period_start and ctx_end >= period_end
            for ctx_factory, ctx_asset, ctx_start, ctx_end, _ in valid_context_coverage
        ):
            blockers.append(
                f"{observation_label}: no accepted operating-context interval covers this observation period for factory {factory!r}, asset {asset!r}"
            )

    for key, rows in context_intervals.items():
        rows.sort(key=lambda x: x[0])
        for idx, current in enumerate(rows):
            for prior in rows[:idx]:
                if current[0] < prior[1] and prior[2] != current[2]:
                    errors.append(f"{current[3]}: overlapping operating contexts conflict for factory/asset {key}")

    economics_by_factory: dict[str, list[tuple[datetime, datetime | None, str]]] = defaultdict(list)
    economic_rows_by_factory: dict[str, list[dict[str, str]]] = defaultdict(list)
    for i, row in enumerate(economics, 2):
        label = f"{eco_path.name}:{i}"
        required(row, ["factory_id", "context_name", "effective_from", "currency", "source_system", "source_record_id", "source_reference"], label, errors)
        factory = row.get("factory_id", "")
        factories.add(factory)
        economic_rows_by_factory[factory].append(row)
        start = parse_time(row.get("effective_from", ""), f"{label}: effective_from", errors)
        end = None
        if row.get("effective_until"):
            end = parse_time(row["effective_until"], f"{label}: effective_until", errors)
        if start and end and end <= start:
            errors.append(f"{label}: effective_until must be after effective_from")
        tariff_value = None
        for field, low, high in [("tariff_inr_per_kwh", 0, None), ("recoverable_fraction", 0, 1), ("intervention_cost_inr", 0, None)]:
            if row.get(field):
                parsed = number(row[field], f"{label}: {field}", errors, low=low, high=high)
                if field == "tariff_inr_per_kwh":
                    tariff_value = parsed
        currency = row.get("currency", "").upper()
        if row.get("tariff_inr_per_kwh") and currency != "INR":
            errors.append(f"{label}: tariff_inr_per_kwh requires currency INR; do not mix currencies or silently convert")
        if start:
            economics_by_factory[factory].append((start, end, label))
            economic_coverage.append((factory, start, end, label, tariff_value, currency))

    for factory, rows in economics_by_factory.items():
        rows.sort(key=lambda x: x[0])
        for index, current in enumerate(rows):
            for prior in rows[:index]:
                prior_start, prior_end, prior_label = prior
                current_start, current_end, current_label = current
                prior_end_bound = prior_end or datetime.max.replace(tzinfo=prior_start.tzinfo)
                current_end_bound = current_end or datetime.max.replace(tzinfo=current_start.tzinfo)
                if current_start < prior_end_bound and prior_start < current_end_bound:
                    errors.append(f"{current_label}: effective economic context overlaps {prior_label} for factory {factory!r}")

    for factory, asset, period_start, period_end, observation_label in observation_periods:
        covering = [
            item for item in economic_coverage
            if item[0] == factory and item[1] <= period_start and (item[2] is None or item[2] >= period_end)
        ]
        if not covering:
            blockers.append(
                f"{observation_label}: no economic context is effective for the full observation period; do not quantify financial impact"
            )
        elif not any(item[4] is not None and item[5] == "INR" for item in covering):
            blockers.append(
                f"{observation_label}: no covering INR tariff is documented; do not quantify financial impact"
            )

    for factory in sorted(f for f in factories if f):
        rows = economics_by_factory.get(factory, [])
        if not rows:
            blockers.append(f"factory {factory!r}: no economic-context row supplied; analysis must not invent tariff/recovery/cost assumptions")
        elif not any(row.get("factory_id") == factory and row.get("tariff_inr_per_kwh") for row in economics):
            blockers.append(f"factory {factory!r}: tariff is absent; no quantified economic opportunity can be claimed")
    if not observations:
        blockers.append("no observations supplied; no analysis can run")
    if not operating:
        blockers.append("no operating-context rows supplied; comparability may be insufficient and must be explicitly reviewed")
    return errors, blockers

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observations", type=Path, default=Path("docs/templates/gridmind/observations.csv"))
    parser.add_argument("--operating-contexts", type=Path, default=Path("docs/templates/gridmind/operating-contexts.csv"))
    parser.add_argument("--economic-context", type=Path, default=Path("docs/templates/gridmind/economic-context.csv"))
    args = parser.parse_args()
    errors, blockers = validate(args.observations, args.operating_contexts, args.economic_context)
    for item in errors:
        print("ERROR:", item)
    for item in blockers:
        print("BLOCKER:", item)
    if errors:
        print(f"\nINTAKE INVALID: {len(errors)} error(s), {len(blockers)} blocker(s). No data was uploaded.")
        return 1
    if blockers:
        print(f"\nINTAKE STRUCTURE VALID, NOT READY FOR ANALYSIS: {len(blockers)} blocker(s). No data was uploaded.")
        return 2
    print("\nINTAKE STRUCTURE VALID. This is not a guarantee of analysis eligibility or economic findings; expert and server-side validation remain required.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
