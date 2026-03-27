#!/usr/bin/env python3
"""Shared helpers for projecting repo skills into platform-specific surfaces."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Iterable


PLATFORMS = ("codex", "claude-code")
EXCLUDED_NAMES = {"__pycache__", ".DS_Store"}
EXCLUDED_SUFFIXES = {".pyc"}
PROJECTION_CONFIG_NAME = "projection.json"
DEFAULT_EXCLUDED_ROOTS = {PROJECTION_CONFIG_NAME}
PLATFORM_EXCLUDED_ROOTS = {
    "codex": set(),
    "claude-code": {"skill.json", "CHANGELOG.md", "agents"},
}


def load_skill_name(skill_dir: Path) -> str:
    skill_json_path = skill_dir / "skill.json"
    if skill_json_path.exists():
        data = json.loads(skill_json_path.read_text(encoding="utf8"))
        name = str(data.get("name", "")).strip()
        if name:
            return name
    return skill_dir.name


def find_ancestor_with_markers(start: Path, markers: Iterable[str]) -> Path | None:
    current = start.resolve()
    marker_names = tuple(markers)
    for candidate in [current, *current.parents]:
        if any((candidate / marker).exists() for marker in marker_names):
            return candidate
    return None


def infer_project_root(start: Path) -> Path:
    root = find_ancestor_with_markers(start, ("categories.json",))
    if root is None:
        raise FileNotFoundError(
            "could not infer project root from "
            f"{start.resolve()}; pass --output-root explicitly or run from a repo containing categories.json"
        )
    return root


def parse_platforms(raw: str) -> list[str]:
    value = raw.strip().lower()
    if value in {"", "all"}:
        return list(PLATFORMS)
    platforms = [part.strip() for part in value.split(",") if part.strip()]
    invalid = sorted(set(platforms) - set(PLATFORMS))
    if invalid:
        raise ValueError(f"unsupported platform(s): {', '.join(invalid)}")
    return platforms


def projection_base_dir(platform: str, scope: str, output_root: Path | None, skill_dir: Path) -> Path:
    if scope not in {"project", "user"}:
        raise ValueError("scope must be 'project' or 'user'")

    if scope == "user":
        base_root = output_root.resolve() if output_root else Path.home()
    else:
        base_root = output_root.resolve() if output_root else infer_project_root(skill_dir)

    if platform == "codex":
        return base_root / ".agents" / "skills"
    if platform == "claude-code":
        return base_root / ".claude" / "skills"
    raise ValueError(f"unsupported platform: {platform}")


def projection_dir(skill_dir: Path, platform: str, scope: str, output_root: Path | None = None) -> Path:
    return projection_base_dir(platform, scope, output_root, skill_dir) / load_skill_name(skill_dir)


def load_projection_config(skill_dir: Path) -> dict:
    config_path = skill_dir / PROJECTION_CONFIG_NAME
    if not config_path.exists():
        return {}
    data = json.loads(config_path.read_text(encoding="utf8"))
    if not isinstance(data, dict):
        raise ValueError(f"{PROJECTION_CONFIG_NAME} must contain a JSON object")
    return data


def normalized_roots(values: object) -> set[str]:
    if not isinstance(values, list):
        return set()
    roots: set[str] = set()
    for value in values:
        if isinstance(value, str):
            normalized = value.strip().strip("/")
            if normalized:
                roots.add(normalized)
    return roots


def excluded_roots(skill_dir: Path, platform: str) -> set[str]:
    config = load_projection_config(skill_dir)
    roots = set(DEFAULT_EXCLUDED_ROOTS)
    roots.update(PLATFORM_EXCLUDED_ROOTS.get(platform, set()))
    roots.update(normalized_roots(config.get("exclude")))

    platforms = config.get("platforms", {})
    if isinstance(platforms, dict):
        roots.update(normalized_roots(platforms.get(platform, {}).get("exclude") if isinstance(platforms.get(platform), dict) else []))
    return roots


def should_skip_relative(relative_path: Path, platform: str, root_excludes: set[str]) -> bool:
    parts = relative_path.parts
    if any(part in EXCLUDED_NAMES for part in parts):
        return True
    if relative_path.suffix in EXCLUDED_SUFFIXES:
        return True
    if parts and parts[0] in root_excludes:
        return True
    return False


def expected_files(skill_dir: Path, platform: str) -> list[Path]:
    root_excludes = excluded_roots(skill_dir, platform)
    files: list[Path] = []
    for path in sorted(skill_dir.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(skill_dir)
        if should_skip_relative(relative, platform, root_excludes):
            continue
        files.append(relative)
    return files


def copy_projection(skill_dir: Path, platform: str, destination: Path) -> list[Path]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    copied: list[Path] = []
    with tempfile.TemporaryDirectory(
        dir=str(destination.parent),
        prefix=f".{destination.name}.tmp-",
    ) as tmp_root:
        staging_root = Path(tmp_root) / destination.name
        staging_root.mkdir(parents=True, exist_ok=True)

        for relative in expected_files(skill_dir, platform):
            src = skill_dir / relative
            dest = staging_root / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            copied.append(relative)

        if destination.exists():
            shutil.rmtree(destination)
        os.replace(staging_root, destination)
    return copied


def compare_projection(skill_dir: Path, platform: str, destination: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not destination.exists():
        errors.append(f"projection missing: {destination}")
        return errors, warnings

    expected = expected_files(skill_dir, platform)
    expected_set = {path.as_posix() for path in expected}

    for relative in expected:
        source_path = skill_dir / relative
        dest_path = destination / relative
        if not dest_path.exists():
            errors.append(f"missing projected file: {relative.as_posix()}")
            continue
        if source_path.read_bytes() != dest_path.read_bytes():
            errors.append(f"projected file differs from source: {relative.as_posix()}")

    for dest_path in sorted(destination.rglob("*")):
        if not dest_path.is_file():
            continue
        relative = dest_path.relative_to(destination)
        if should_skip_relative(relative, platform, excluded_roots(skill_dir, platform)):
            continue
        if relative.as_posix() not in expected_set:
            warnings.append(f"unexpected projected file: {relative.as_posix()}")

    return errors, warnings
