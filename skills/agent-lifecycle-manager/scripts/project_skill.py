#!/usr/bin/env python3
"""Project a canonical repo skill into Codex and/or Claude Code skill surfaces."""

from __future__ import annotations

import argparse
from pathlib import Path

from projection_support import copy_projection, parse_platforms, projection_dir


def main() -> int:
    parser = argparse.ArgumentParser(description="Project a skill into platform-specific surfaces.")
    parser.add_argument("skill_dir", help="Path to the canonical skill directory")
    parser.add_argument(
        "--platform",
        default="all",
        help="Projection target: codex, claude-code, or a comma-separated list (default: all)",
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

    platforms = parse_platforms(args.platform)
    for platform in platforms:
        destination = projection_dir(skill_dir, platform, args.scope, output_root=output_root)
        copied = copy_projection(skill_dir, platform, destination)
        print(f"{platform}: {destination} ({len(copied)} files)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
