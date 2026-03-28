#!/usr/bin/env python3
"""
Eval runner for git-worktree-workflows.

List mode (default): prints each eval case with its prompt and assertions so
the developer can run each prompt manually in a session with the skill active
and record results.

Score mode: reads a JSON results file and outputs a pass/fail summary against
the selected suite's 75% threshold.

Usage:
    uv run python scripts/run_eval.py
    uv run python scripts/run_eval.py --suite trigger
    uv run python scripts/run_eval.py --suite all
    uv run python scripts/run_eval.py --eval-file eval/eval-cases.json
    uv run python scripts/run_eval.py --case eval-2
    uv run python scripts/run_eval.py --score path/to/results.json

Results file format:
    {
        "eval-1": {"route_selection_correct": "pass", "official_command_model_used": "pass", ...},
        "eval-2": {"route_selection_correct": "partial", ...}
    }
    Valid scores: "pass", "partial", "fail"
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Optional


SCORE_VALUES = {"pass": 1.0, "partial": 0.5, "fail": 0.0}
SUITE_FILES = {
    "behavior": Path(__file__).parent.parent / "eval" / "eval-cases.json",
    "trigger": Path(__file__).parent.parent / "eval" / "trigger-posture-cases.json",
}


def load_json(path: Path) -> dict:
    with path.open() as f:
        return json.load(f)


def print_separator(char: str = "=", width: int = 60) -> None:
    print(char * width)


def load_suites(eval_file: Optional[Path], suite_name: str) -> list[dict]:
    if eval_file is not None:
        return [load_json(eval_file)]
    if suite_name == "all":
        return [load_json(path) for path in SUITE_FILES.values()]
    return [load_json(SUITE_FILES[suite_name])]


def list_cases(suite: dict, case_filter: Optional[str] = None) -> bool:
    cases = suite.get("cases", [])
    if case_filter:
        cases = [c for c in cases if c["id"] == case_filter]
        if not cases:
            return False

    scoring = suite.get("scoring", {})
    threshold = scoring.get("pass_threshold", 0.75)

    print_separator()
    print(f"Eval suite : {suite['skill']} v{suite['version']}")
    print(f"Cases      : {len(cases)}")
    print(f"Threshold  : {threshold * 100:.0f}% per case")
    print_separator()

    for i, case in enumerate(cases, 1):
        print(f"\nCase {i}/{len(cases)}: [{case['id']}] {case['name']}")
        print_separator("-")
        print(f"Stages   : {', '.join(case.get('expected_stages', []))}")
        print(f"\nPrompt:\n  {case['prompt']}\n")
        print("Assertions:")
        for key, assertion in case.get("assertions", {}).items():
            print(f"  [{key}]")
            print(f"    {assertion['check']}")

    runner = suite.get("runner_instructions", {})
    if runner:
        print(f"\n{'Setup'}: {runner.get('setup', '')}")
        print(f"{'Execute'}: {runner.get('execution', '')}")
        print(f"{'Evaluate'}: {runner.get('evaluation', '')}")

    print(f"\nRecord results as: {{\"case-id\": {{\"assertion_key\": \"pass|partial|fail\", ...}}}}")
    print(f"Then run: uv run python scripts/run_eval.py --score <results.json>")
    return True


def score_cases(suite: dict, results: Dict[str, Dict[str, str]]) -> tuple[bool, set[str]]:
    cases = {c["id"]: c for c in suite.get("cases", [])}
    threshold = suite.get("scoring", {}).get("pass_threshold", 0.75)
    matched_ids = set(cases) & set(results)

    print_separator()
    print(f"Scoring: {suite['skill']} v{suite['version']}")
    print_separator()

    if not matched_ids:
        print("Result: INCOMPLETE — no scored cases matched this suite")
        print_separator()
        return False, matched_ids

    all_passed = True
    for case_id in sorted(matched_ids):
        case = cases[case_id]
        case_scores = results[case_id]
        applicable = case.get("assertions", {})
        total = len(applicable)
        if total == 0:
            continue

        earned = sum(SCORE_VALUES.get(case_scores.get(k, "fail"), 0.0) for k in applicable)
        ratio = earned / total
        passed = ratio >= threshold

        if not passed:
            all_passed = False
        label = "PASS" if passed else "FAIL"
        print(f"\n[{label}] {case_id}: {case['name']}")
        print(f"       Score: {earned:.1f}/{total} ({ratio * 100:.0f}%)")
        for k in applicable:
            score = case_scores.get(k, "fail")
            print(f"       {score:<8}  {k}")

    print()
    print_separator()
    if all_passed:
        print("Result: PASS — all scored cases met the threshold")
    else:
        print("Result: FAIL — one or more cases did not meet the threshold")
    print_separator()
    return all_passed, matched_ids


def main() -> None:
    parser = argparse.ArgumentParser(
        description="List or score eval cases for git-worktree-workflows"
    )
    parser.add_argument(
        "--suite",
        choices=["behavior", "trigger", "all"],
        default="behavior",
        help="Eval suite to use when --eval-file is not provided (default: behavior)",
    )
    parser.add_argument(
        "--eval-file",
        type=Path,
        help="Path to a specific eval suite JSON file. Overrides --suite.",
    )
    parser.add_argument("--case", metavar="ID", help="Show only a single case by id")
    parser.add_argument(
        "--score",
        type=Path,
        metavar="RESULTS_JSON",
        help="Score mode: path to a JSON file with recorded results",
    )
    args = parser.parse_args()

    if args.eval_file is not None and not args.eval_file.exists():
        print(f"Eval file not found: {args.eval_file}", file=sys.stderr)
        sys.exit(1)

    suites = load_suites(args.eval_file, args.suite)

    if args.score:
        if not args.score.exists():
            print(f"Score file not found: {args.score}", file=sys.stderr)
            sys.exit(1)
        results: Dict[str, Dict[str, str]] = load_json(args.score)
        overall_passed = True
        matched_ids: set[str] = set()
        for suite in suites:
            suite_passed, suite_ids = score_cases(suite, results)
            overall_passed = overall_passed and suite_passed
            matched_ids.update(suite_ids)

        if not matched_ids:
            print("No scored cases matched the selected suite(s).", file=sys.stderr)
            sys.exit(1)

        unknown_ids = sorted(set(results) - matched_ids)
        for case_id in unknown_ids:
            print(f"Warning: unknown case id '{case_id}'", file=sys.stderr)
        sys.exit(0 if overall_passed else 1)

    found_case = False
    for suite in suites:
        found_case = list_cases(suite, args.case) or found_case

    if args.case and not found_case:
        print(f"No case found with id '{args.case}'", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
