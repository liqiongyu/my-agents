#!/usr/bin/env python3
"""Run agent-lifecycle-manager unit tests in a uv-managed pytest environment."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def default_tests_path() -> Path:
    return Path(__file__).resolve().parents[1] / "tests"


def package_name() -> str:
    return Path(__file__).resolve().parents[1].name


def normalize_pytest_args(pytest_args: list[str]) -> list[str]:
    if pytest_args[:1] == ["--"]:
        return pytest_args[1:]
    return pytest_args


def build_command(tests_path: Path, pytest_args: list[str]) -> list[str]:
    command = [
        "uv",
        "run",
        "--with",
        "pytest",
        "python",
        "-m",
        "pytest",
        str(tests_path),
    ]
    if pytest_args:
        command.extend(pytest_args)
    else:
        command.append("-q")
    return command


def missing_tests_message(tests_path: Path) -> str:
    return (
        f"tests directory not found: {tests_path}\n"
        "This helper is canonical-only: projected runtime copies intentionally exclude tests/.\n"
        f"Run it from the canonical package, for example "
        f"`uv run python skills/{package_name()}/scripts/run_unit_tests.py`, "
        "or pass --tests-path to an existing tests directory."
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run agent-lifecycle-manager unit tests with an ephemeral pytest dependency."
    )
    parser.add_argument(
        "--tests-path",
        default=str(default_tests_path()),
        help="Path to the tests directory (default: %(default)s)",
    )
    parser.add_argument(
        "pytest_args",
        nargs=argparse.REMAINDER,
        help="Arguments forwarded to pytest. Prefix them with -- after this script's options.",
    )
    args = parser.parse_args(argv)

    tests_path = Path(args.tests_path).expanduser().resolve()
    if not tests_path.is_dir():
        print(missing_tests_message(tests_path), file=sys.stderr)
        return 2

    command = build_command(tests_path, normalize_pytest_args(args.pytest_args))
    completed = subprocess.run(command, check=False)
    return completed.returncode


if __name__ == "__main__":
    sys.exit(main())
