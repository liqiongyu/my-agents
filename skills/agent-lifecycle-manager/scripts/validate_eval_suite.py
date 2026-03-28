#!/usr/bin/env python3
"""Validate skill eval suite files in either lightweight or assertion-rich formats."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _require_string(errors: list[str], value: object, label: str) -> None:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")


def validate_scoring(errors: list[str], warnings: list[str], scoring: object, label: str) -> None:
    if scoring in (None, {}):
        return
    if not isinstance(scoring, dict):
        errors.append(f"{label} must be an object when present")
        return

    per_assertion = scoring.get("per_assertion")
    if per_assertion is not None:
        if not isinstance(per_assertion, dict):
            errors.append(f"{label}.per_assertion must be an object when present")
        else:
            for key, value in per_assertion.items():
                if not isinstance(key, str) or not key.strip():
                    errors.append(f"{label}.per_assertion keys must be non-empty strings")
                    continue
                if not isinstance(value, (int, float)):
                    errors.append(f"{label}.per_assertion[{key!r}] must be numeric")

    pass_threshold = scoring.get("pass_threshold")
    if pass_threshold is not None:
        if not isinstance(pass_threshold, (int, float)):
            errors.append(f"{label}.pass_threshold must be numeric when present")
        elif not 0 <= float(pass_threshold) <= 1:
            errors.append(f"{label}.pass_threshold must be between 0 and 1")

    for key in ("case_max_strategy", "total_max_strategy"):
        if key in scoring and (not isinstance(scoring[key], str) or not scoring[key].strip()):
            errors.append(f"{label}.{key} must be a non-empty string when present")

    legacy_keys = [key for key in ("per_case_max", "total_max") if key in scoring]
    if legacy_keys:
        warnings.append(
            f"{label} uses legacy scoring field(s): {', '.join(legacy_keys)}; prefer case_max_strategy/total_max_strategy"
        )


def validate_evals_format(payload: dict) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    _require_string(errors, payload.get("skill_name"), "skill_name")
    evals = payload.get("evals")
    if not isinstance(evals, list) or not evals:
        errors.append("evals must be a non-empty array")
        return errors, warnings

    for index, entry in enumerate(evals, start=1):
        if not isinstance(entry, dict):
            errors.append(f"evals[{index}] must be an object")
            continue
        _require_string(errors, entry.get("prompt"), f"evals[{index}].prompt")
        if "id" not in entry:
            warnings.append(f"evals[{index}] is missing id")
        expectations = entry.get("expectations", [])
        if expectations and not isinstance(expectations, list):
            errors.append(f"evals[{index}].expectations must be an array when present")

    return errors, warnings


def validate_eval_cases_format(payload: dict) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    _require_string(errors, payload.get("skill"), "skill")
    validate_scoring(errors, warnings, payload.get("scoring"), "scoring")
    cases = payload.get("cases")
    if not isinstance(cases, list) or not cases:
        errors.append("cases must be a non-empty array")
        return errors, warnings

    top_level_assertions = payload.get("assertions", [])
    if top_level_assertions and not isinstance(top_level_assertions, list):
        errors.append("assertions must be an array when present")

    assertion_definitions = payload.get("assertion_definitions", {})
    if assertion_definitions and not isinstance(assertion_definitions, dict):
        errors.append("assertion_definitions must be an object when present")

    for index, case in enumerate(cases, start=1):
        if not isinstance(case, dict):
            errors.append(f"cases[{index}] must be an object")
            continue
        _require_string(errors, case.get("id"), f"cases[{index}].id")
        _require_string(errors, case.get("name"), f"cases[{index}].name")
        _require_string(errors, case.get("prompt"), f"cases[{index}].prompt")
        assertions = case.get("assertions", {})
        if assertions and not isinstance(assertions, dict):
            errors.append(f"cases[{index}].assertions must be an object when present")
        if isinstance(assertions, dict):
            missing = sorted(key for key in assertions.keys() if key not in assertion_definitions)
            for key in missing:
                warnings.append(f"cases[{index}] references assertion without top-level definition: {key}")

    return errors, warnings


def validate_eval_suite(eval_path: Path) -> tuple[list[str], list[str]]:
    payload = json.loads(eval_path.read_text(encoding="utf8"))
    if not isinstance(payload, dict):
        return ["top-level JSON value must be an object"], []
    if "cases" in payload:
        return validate_eval_cases_format(payload)
    if "evals" in payload:
        return validate_evals_format(payload)
    return ["expected top-level 'cases' or 'evals' array"], []


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a skill eval suite JSON file.")
    parser.add_argument("eval_file", help="Path to eval JSON file")
    args = parser.parse_args()

    eval_path = Path(args.eval_file).expanduser().resolve()
    errors, warnings = validate_eval_suite(eval_path)

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")

    if errors:
        return 1

    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
