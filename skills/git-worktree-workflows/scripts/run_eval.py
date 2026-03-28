#!/usr/bin/env python3
"""
Eval runner for git-worktree-workflows.

List mode (default): prints each eval case with its prompt and assertions so
the developer can run each prompt manually in a session with the skill active
and record results.

Score mode: reads a JSON results file and outputs a pass/fail summary against
the 75% threshold defined in eval-cases.json.

Usage:
    uv run python scripts/run_eval.py
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


def load_json(path: Path) -> dict:
    with path.open() as f:
        return json.load(f)


def print_separator(char: str = "=", width: int = 60) -> None:
    print(char * width)


def list_cases(suite: dict, case_filter: Optional[str] = None) -> None:
    cases = suite.get("cases", [])
    if case_filter:
        cases = [c for c in cases if c["id"] == case_filter]
        if not cases:
            print(f"No case found with id '{case_filter}'", file=sys.stderr)
            sys.exit(1)

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

    print(f"\nRecord results as: {{\"eval-N\": {{\"assertion_key\": \"pass|partial|fail\", ...}}}}")
    print(f"Then run: uv run python scripts/run_eval.py --score <results.json>")


def score_cases(suite: dict, score_file: Path) -> None:
    results: Dict[str, Dict[str, str]] = load_json(score_file)
    cases = {c["id"]: c for c in suite.get("cases", [])}
    threshold = suite.get("scoring", {}).get("pass_threshold", 0.75)

    print_separator()
    print(f"Scoring: {suite['skill']} v{suite['version']}")
    print_separator()

    all_passed = True
    for case_id, case_scores in results.items():
        case = cases.get(case_id)
        if not case:
            print(f"Warning: unknown case id '{case_id}'", file=sys.stderr)
            continue

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
    sys.exit(0 if all_passed else 1)


def main() -> None:
    default_eval = Path(__file__).parent.parent / "eval" / "eval-cases.json"

    parser = argparse.ArgumentParser(
        description="List or score eval cases for git-worktree-workflows"
    )
    parser.add_argument(
        "--eval-file",
        type=Path,
        default=default_eval,
        help=f"Path to eval-cases.json (default: {default_eval})",
    )
    parser.add_argument("--case", metavar="ID", help="Show only a single case by id")
    parser.add_argument(
        "--score",
        type=Path,
        metavar="RESULTS_JSON",
        help="Score mode: path to a JSON file with recorded results",
    )
    args = parser.parse_args()

    if not args.eval_file.exists():
        print(f"Eval file not found: {args.eval_file}", file=sys.stderr)
        sys.exit(1)

    suite = load_json(args.eval_file)

    if args.score:
        if not args.score.exists():
            print(f"Score file not found: {args.score}", file=sys.stderr)
            sys.exit(1)
        score_cases(suite, args.score)
    else:
        list_cases(suite, args.case)


if __name__ == "__main__":
    main()
