#!/usr/bin/env python3
"""Validate one skill directory quickly without requiring the full repo validator."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover - fallback stays covered by unit tests
    yaml = None


MIN_DOC_LENGTH = 200


def parse_frontmatter(text: str) -> dict[str, str]:
    """Parse the top-level SKILL.md frontmatter.

    Prefer PyYAML when available so valid block scalars, comments, and quoted
    strings are accepted. Fall back to a small flat parser so the validator
    still works in minimal environments, but that fallback is intentionally
    limited to simple top-level `key: value` fields with optional continuation
    lines.
    """
    if not text.startswith("---"):
        raise ValueError("SKILL.md must start with YAML frontmatter")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.DOTALL)
    if not match:
        raise ValueError("SKILL.md frontmatter is not closed")
    block = match.group(1)

    if yaml is not None:
        try:
            loaded = yaml.safe_load(block)
        except yaml.YAMLError as exc:
            raise ValueError(f"SKILL.md frontmatter is invalid YAML: {exc}") from exc
        if loaded in (None, {}):
            return {}
        if not isinstance(loaded, dict):
            raise ValueError("SKILL.md frontmatter must parse to a top-level mapping")
        values: dict[str, str] = {}
        for key, value in loaded.items():
            normalized_key = str(key).strip()
            if not normalized_key:
                continue
            if value is None:
                values[normalized_key] = ""
            elif isinstance(value, str):
                values[normalized_key] = value.strip()
            else:
                values[normalized_key] = str(value).strip()
        return values

    values: dict[str, str] = {}
    current_key: str | None = None
    for raw_line in block.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue
        if line.lstrip().startswith("#"):
            continue
        if re.match(r"^[A-Za-z0-9_-]+:\s*", line):
            key, value = line.split(":", 1)
            current_key = key.strip()
            values[current_key] = value.strip().strip('"').strip("'")
        elif current_key is not None:
            values[current_key] = (values[current_key] + " " + line.strip()).strip()
    return values


def find_repo_root(start: Path) -> Path | None:
    current = start.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / "categories.json").exists():
            return candidate
    return None


def load_categories(repo_root: Path | None) -> set[str]:
    if repo_root is None:
        return set()
    data = json.loads((repo_root / "categories.json").read_text(encoding="utf8"))
    return set(data.get("categories", []))


def changelog_has_version(changelog_text: str, version: str) -> bool:
    return (
        re.search(rf"^##\s*\[{re.escape(version)}\](?:\s+-.*)?$", changelog_text, re.MULTILINE)
        is not None
    )


def validate_skill(skill_dir: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    skill_json_path = skill_dir / "skill.json"
    skill_md_path = skill_dir / "SKILL.md"
    changelog_path = skill_dir / "CHANGELOG.md"

    for required in [skill_json_path, skill_md_path, changelog_path]:
        if not required.exists():
            errors.append(f"missing required file: {required.name}")

    if errors:
        return errors, warnings

    try:
        skill_json = json.loads(skill_json_path.read_text(encoding="utf8"))
    except json.JSONDecodeError as exc:
        errors.append(f"skill.json is invalid JSON: {exc}")
        return errors, warnings

    skill_md = skill_md_path.read_text(encoding="utf8")
    changelog = changelog_path.read_text(encoding="utf8")

    try:
        frontmatter = parse_frontmatter(skill_md)
    except ValueError as exc:
        errors.append(str(exc))
        return errors, warnings

    dirname = skill_dir.name
    json_name = skill_json.get("name", "")
    fm_name = frontmatter.get("name", "")
    json_description = str(skill_json.get("description", "")).strip()
    fm_description = frontmatter.get("description", "").strip()
    version = str(skill_json.get("version", "")).strip()

    if json_name != dirname:
        errors.append(f"skill.json name mismatch: expected '{dirname}', got '{json_name}'")
    if fm_name != dirname:
        errors.append(f"frontmatter name mismatch: expected '{dirname}', got '{fm_name}'")
    if len(skill_md.strip()) < MIN_DOC_LENGTH:
        errors.append(f"SKILL.md too short: {len(skill_md.strip())} chars (minimum {MIN_DOC_LENGTH})")
    if not json_description:
        errors.append("skill.json description is empty")
    if not fm_description:
        errors.append("SKILL.md frontmatter description is empty")
    if version and not changelog_has_version(changelog, version):
        errors.append(f"CHANGELOG.md is missing a '## [{version}]' section")

    repo_root = find_repo_root(skill_dir)
    allowed_categories = load_categories(repo_root)
    for category in skill_json.get("categories", []):
        if allowed_categories and category not in allowed_categories:
            errors.append(f"unknown category '{category}' (not present in categories.json)")

    if "When Not To Use" not in skill_md and "When not to use" not in skill_md:
        warnings.append("SKILL.md does not clearly define a negative boundary")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate one skill directory.")
    parser.add_argument("skill_dir", help="Path to the skill directory")
    args = parser.parse_args()

    skill_dir = Path(args.skill_dir).expanduser().resolve()
    errors, warnings = validate_skill(skill_dir)

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")

    if errors:
        return 1

    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
