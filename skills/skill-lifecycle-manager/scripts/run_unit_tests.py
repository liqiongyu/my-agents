#!/usr/bin/env python3
"""Run skill-lifecycle-manager unit tests in a uv-managed pytest environment."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def default_tests_path() -> Path:
    return Path(__file__).resolve().parents[1] / "tests"


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


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run skill-lifecycle-manager unit tests with an ephemeral pytest dependency."
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

    command = build_command(
        Path(args.tests_path).expanduser().resolve(),
        normalize_pytest_args(args.pytest_args),
    )
    completed = subprocess.run(command, check=False)
    return completed.returncode


if __name__ == "__main__":
    sys.exit(main())
