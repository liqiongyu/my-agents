#!/usr/bin/env python3
"""Validate one agent directory for structure, cross-surface alignment, and contract consistency."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:
    try:
        import tomli as tomllib  # type: ignore[no-redef]
    except ModuleNotFoundError:
        tomllib = None  # type: ignore[assignment]

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

from quick_validate import changelog_has_version, find_repo_root, load_categories

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MIN_DOC_LENGTH = 200

VALID_ARCHETYPES = {"explorer", "reviewer", "implementer", "planner", "debugger", "custom"}

# Archetype → expected filesystemWrite value.
# custom is omitted intentionally — no hard rule.
ARCHETYPE_WRITE_EXPECTATIONS: dict[str, bool] = {
    "explorer": False,
    "reviewer": False,
    "planner": False,
    "implementer": True,
    "debugger": True,
}

# Claude-code.md tools that imply capabilities.
WRITE_TOOLS = {"Edit", "Write", "NotebookEdit"}
NETWORK_TOOLS = {"WebSearch", "WebFetch"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_claude_code_frontmatter(text: str) -> dict[str, str]:
    """Extract YAML frontmatter from claude-code.md."""
    if not text.startswith("---"):
        raise ValueError("claude-code.md must start with YAML frontmatter")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.DOTALL)
    if not match:
        raise ValueError("claude-code.md frontmatter is not closed")
    block = match.group(1)

    if yaml is not None:
        try:
            loaded = yaml.safe_load(block)
        except yaml.YAMLError as exc:
            raise ValueError(f"claude-code.md frontmatter is invalid YAML: {exc}") from exc
        if loaded in (None, {}):
            return {}
        if not isinstance(loaded, dict):
            raise ValueError("claude-code.md frontmatter must parse to a top-level mapping")
        return {str(k).strip(): (str(v).strip() if v is not None else "") for k, v in loaded.items()}

    # Minimal fallback parser.
    values: dict[str, str] = {}
    current_key: str | None = None
    for raw_line in block.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue
        if re.match(r"^[A-Za-z0-9_-]+:\s*", line):
            key, value = line.split(":", 1)
            current_key = key.strip()
            values[current_key] = value.strip().strip('"').strip("'")
        elif current_key is not None:
            values[current_key] = (values[current_key] + " " + line.strip()).strip()
    return values


def _parse_codex_toml(path: Path) -> dict | None:
    """Parse a codex.toml file.  Returns None if tomllib is unavailable."""
    if tomllib is None:
        return None
    try:
        return tomllib.loads(path.read_text(encoding="utf8"))
    except Exception as exc:
        raise ValueError(f"codex.toml parse error: {exc}") from exc


def _parse_tools_field(tools_str: str) -> tuple[set[str], list[str]]:
    """Parse the tools field from claude-code.md frontmatter.

    Returns (plain_tools, agent_refs) where agent_refs are names extracted
    from ``Agent(name)`` entries.
    """
    plain: set[str] = set()
    agent_refs: list[str] = []
    for token in re.split(r",\s*", tools_str):
        token = token.strip()
        if not token:
            continue
        m = re.match(r"Agent\(([^)]+)\)", token)
        if m:
            agent_refs.append(m.group(1).strip())
        else:
            # Strip annotations like "Bash(readonly)".
            base = re.match(r"(\w+)", token)
            if base:
                plain.add(base.group(1))
    return plain, agent_refs


def _description_overlap(a: str, b: str) -> float:
    """Compute a simple keyword overlap ratio between two descriptions."""
    if not a or not b:
        return 0.0
    words_a = set(re.findall(r"[a-z]{3,}", a.lower()))
    words_b = set(re.findall(r"[a-z]{3,}", b.lower()))
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    return len(intersection) / min(len(words_a), len(words_b))


# ---------------------------------------------------------------------------
# Main validator
# ---------------------------------------------------------------------------


def validate_agent(agent_dir: Path) -> tuple[list[str], list[str]]:
    """Validate a single agent directory.

    Returns (errors, warnings).
    """
    errors: list[str] = []
    warnings: list[str] = []

    agent_json_path = agent_dir / "agent.json"
    claude_code_path = agent_dir / "claude-code.md"
    codex_toml_path = agent_dir / "codex.toml"
    changelog_path = agent_dir / "CHANGELOG.md"

    # ── 1. File existence ────────────────────────────────────────────────
    if not agent_json_path.exists():
        errors.append("missing required file: agent.json")
    if not changelog_path.exists():
        errors.append("missing required file: CHANGELOG.md")
    has_claude = claude_code_path.exists()
    has_codex = codex_toml_path.exists()
    if not has_claude and not has_codex:
        errors.append("at least one platform file required: claude-code.md or codex.toml")

    if errors:
        return errors, warnings

    # ── 2. agent.json parse ──────────────────────────────────────────────
    try:
        agent_json = json.loads(agent_json_path.read_text(encoding="utf8"))
    except json.JSONDecodeError as exc:
        errors.append(f"agent.json is invalid JSON: {exc}")
        return errors, warnings

    dirname = agent_dir.name
    json_name = agent_json.get("name", "")
    json_desc = str(agent_json.get("description", "")).strip()
    version = str(agent_json.get("version", "")).strip()
    archetype = str(agent_json.get("archetype", "")).strip()
    capabilities = agent_json.get("capabilities", {})
    json_skills = agent_json.get("skills", [])
    json_agents = agent_json.get("agents", [])
    fs_write = capabilities.get("filesystemWrite", False)
    network = capabilities.get("network", False)

    if json_name != dirname:
        errors.append(f"agent.json name mismatch: expected '{dirname}', got '{json_name}'")
    if not json_desc:
        errors.append("agent.json description is empty")
    if not version:
        errors.append("agent.json version is empty")
    elif not re.match(r"^\d+\.\d+\.\d+", version):
        errors.append(f"agent.json version is not semver: '{version}'")
    if not archetype:
        errors.append("agent.json archetype is empty")
    elif archetype not in VALID_ARCHETYPES:
        errors.append(f"agent.json archetype '{archetype}' is not one of: {', '.join(sorted(VALID_ARCHETYPES))}")

    # Categories.
    repo_root = find_repo_root(agent_dir)
    allowed_categories = load_categories(repo_root)
    for category in agent_json.get("categories", []):
        if allowed_categories and category not in allowed_categories:
            errors.append(f"unknown category '{category}' (not in categories.json)")

    # Changelog version.
    changelog = changelog_path.read_text(encoding="utf8")
    if version and not changelog_has_version(changelog, version):
        errors.append(f"CHANGELOG.md is missing a '## [{version}]' section")

    # ── 3. claude-code.md frontmatter ────────────────────────────────────
    cc_fm: dict[str, str] = {}
    cc_text = ""
    if has_claude:
        cc_text = claude_code_path.read_text(encoding="utf8")
        if len(cc_text.strip()) < MIN_DOC_LENGTH:
            errors.append(f"claude-code.md too short: {len(cc_text.strip())} chars (minimum {MIN_DOC_LENGTH})")
        try:
            cc_fm = _parse_claude_code_frontmatter(cc_text)
        except ValueError as exc:
            errors.append(str(exc))

        cc_name = cc_fm.get("name", "")
        cc_desc = cc_fm.get("description", "")
        if cc_name and cc_name != json_name:
            errors.append(f"claude-code.md name '{cc_name}' does not match agent.json name '{json_name}'")
        if not cc_desc:
            warnings.append("claude-code.md frontmatter description is empty")

    # ── 4. codex.toml parse ──────────────────────────────────────────────
    codex_data: dict = {}
    if has_codex:
        if tomllib is None:
            warnings.append("codex.toml present but tomllib/tomli not available — skipping TOML validation")
        else:
            try:
                codex_data = _parse_codex_toml(codex_toml_path) or {}
            except ValueError as exc:
                errors.append(str(exc))

            codex_name = codex_data.get("name", "")
            codex_desc = str(codex_data.get("description", "")).strip()
            codex_instructions = str(codex_data.get("developer_instructions", "")).strip()

            if codex_name and codex_name != json_name:
                errors.append(f"codex.toml name '{codex_name}' does not match agent.json name '{json_name}'")
            if not codex_desc:
                warnings.append("codex.toml description is empty")
            if not codex_instructions:
                errors.append("codex.toml developer_instructions is empty")

    # ── 5. Cross-surface description alignment ───────────────────────────
    if has_claude and cc_fm.get("description") and json_desc:
        overlap = _description_overlap(json_desc, cc_fm["description"])
        if overlap < 0.3:
            warnings.append(
                f"agent.json and claude-code.md descriptions may have diverged (keyword overlap {overlap:.0%})"
            )

    if has_codex and codex_data.get("description") and json_desc:
        overlap = _description_overlap(json_desc, str(codex_data["description"]))
        if overlap < 0.3:
            warnings.append(
                f"agent.json and codex.toml descriptions may have diverged (keyword overlap {overlap:.0%})"
            )

    # ── 6. Archetype-to-capability consistency ───────────────────────────
    if archetype in ARCHETYPE_WRITE_EXPECTATIONS:
        expected_write = ARCHETYPE_WRITE_EXPECTATIONS[archetype]
        if fs_write != expected_write:
            if expected_write:
                warnings.append(
                    f"archetype '{archetype}' typically requires filesystemWrite: true, "
                    f"but capabilities say false"
                )
            else:
                warnings.append(
                    f"archetype '{archetype}' is typically read-only (filesystemWrite: false), "
                    f"but capabilities say true"
                )

    # ── 7. Runtime defaults alignment (codex.toml) ───────────────────────
    if has_codex and codex_data:
        codex_sandbox = codex_data.get("sandbox_mode", "")
        codex_web = codex_data.get("web_search", "")

        if not fs_write and codex_sandbox == "workspace-write":
            warnings.append(
                "codex.toml sandbox_mode is 'workspace-write' but agent capabilities "
                "declare filesystemWrite: false"
            )
        if fs_write and codex_sandbox == "read-only":
            warnings.append(
                "codex.toml sandbox_mode is 'read-only' but agent capabilities "
                "declare filesystemWrite: true"
            )
        if not network and codex_web == "live":
            warnings.append(
                "codex.toml web_search is 'live' but agent capabilities "
                "declare network: false"
            )

    # ── 8. Tools alignment (claude-code.md) ──────────────────────────────
    tools_str = cc_fm.get("tools", "")
    if tools_str:
        plain_tools, agent_refs = _parse_tools_field(tools_str)

        write_tools_used = plain_tools & WRITE_TOOLS
        if write_tools_used and not fs_write:
            warnings.append(
                f"claude-code.md declares write tools ({', '.join(sorted(write_tools_used))}) "
                f"but capabilities have filesystemWrite: false"
            )

        net_tools_used = plain_tools & NETWORK_TOOLS
        if net_tools_used and not network:
            warnings.append(
                f"claude-code.md declares network tools ({', '.join(sorted(net_tools_used))}) "
                f"but capabilities have network: false"
            )

        for ref in agent_refs:
            if ref not in json_agents:
                warnings.append(
                    f"claude-code.md references Agent({ref}) but '{ref}' is not in "
                    f"agent.json agents array {json_agents}"
                )

    # ── 9. Model divergence ──────────────────────────────────────────────
    cc_model = cc_fm.get("model", "")
    codex_model = str(codex_data.get("model", "")) if codex_data else ""
    if cc_model and codex_model and cc_model != codex_model:
        warnings.append(
            f"model divergence across platforms: claude-code.md='{cc_model}', "
            f"codex.toml='{codex_model}' (this may be intentional)"
        )

    return errors, warnings


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate one agent directory.")
    parser.add_argument("agent_dir", help="Path to the agent directory")
    args = parser.parse_args()

    agent_dir = Path(args.agent_dir).expanduser().resolve()
    errors, warnings = validate_agent(agent_dir)

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
