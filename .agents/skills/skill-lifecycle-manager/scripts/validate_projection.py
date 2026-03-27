#!/usr/bin/env python3
"""Validate that a projected skill matches the canonical source for one or more platforms."""

from __future__ import annotations

import argparse
from pathlib import Path

from projection_support import compare_projection, parse_platforms, projection_dir


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate projected skill surfaces.")
    parser.add_argument("skill_dir", help="Path to the canonical skill directory")
    parser.add_argument(
        "--platform",
        default="all",
        help="Validation target: codex, claude-code, or a comma-separated list (default: all)",
    )
    parser.add_argument(
        "--scope",
        default="project",
        choices=["project", "user"],
        help="Projection scope (default: project)",
    )
    parser.add_argument(
        "--output-root",
        help="Base directory for projections. Defaults to the repo root for project scope or $HOME for user scope.",
    )
    args = parser.parse_args()

    skill_dir = Path(args.skill_dir).expanduser().resolve()
    output_root = Path(args.output_root).expanduser().resolve() if args.output_root else None

    exit_code = 0
    for platform in parse_platforms(args.platform):
        destination = projection_dir(skill_dir, platform, args.scope, output_root=output_root)
        errors, warnings = compare_projection(skill_dir, platform, destination)
        for warning in warnings:
            print(f"WARNING [{platform}]: {warning}")
        for error in errors:
            print(f"ERROR [{platform}]: {error}")
        if errors:
            exit_code = 1
        else:
            print(f"OK [{platform}]")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
