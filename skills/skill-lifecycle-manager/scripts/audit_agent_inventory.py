#!/usr/bin/env python3
"""Audit a directory of agents for contract alignment, runtime discipline, and library health."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
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

from quick_validate import find_repo_root
from quick_validate_agent import (
    _description_overlap,
    _parse_claude_code_frontmatter,
    _parse_codex_toml,
    _parse_tools_field,
    validate_agent,
)


SEVERITY_ORDER = ("critical", "high", "medium", "low")
SEVERITY_WEIGHT = {"critical": 4, "high": 3, "medium": 2, "low": 1}
MAX_FINDINGS_PER_AGENT = sum(SEVERITY_WEIGHT.values()) * 3  # normalizing factor

HEALTH_THRESHOLDS = {
    "healthy": 0.85,
    "needs_cleanup": 0.60,
}

# Codex runtime fields that reusable agents should set explicitly.
EXPLICIT_RUNTIME_FIELDS = ("sandbox_mode", "model_reasoning_effort")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def add_finding(report: dict, entry: dict, severity: str, dimension: str, message: str) -> None:
    if severity not in SEVERITY_ORDER:
        raise ValueError(f"unsupported severity: {severity}")

    finding = {"severity": severity, "dimension": dimension, "message": message}
    entry["findings"].append(finding)
    report["summary"][f"{severity}Count"] += 1

    if severity in {"critical", "high"}:
        entry["errors"].append(message)
        report["summary"]["errorCount"] += 1
    else:
        entry["warnings"].append(message)
        report["summary"]["warningCount"] += 1


def load_agent_json(agent_dir: Path) -> dict | None:
    path = agent_dir / "agent.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf8"))
    except json.JSONDecodeError:
        return None


def load_codex_toml(agent_dir: Path) -> dict | None:
    path = agent_dir / "codex.toml"
    if not path.exists() or tomllib is None:
        return None
    try:
        return _parse_codex_toml(path)
    except ValueError:
        return None


def load_claude_code_frontmatter(agent_dir: Path) -> dict[str, str]:
    path = agent_dir / "claude-code.md"
    if not path.exists():
        return {}
    try:
        return _parse_claude_code_frontmatter(path.read_text(encoding="utf8"))
    except ValueError:
        return {}


# ---------------------------------------------------------------------------
# Per-dimension audit functions
# ---------------------------------------------------------------------------


def audit_trigger_quality(report: dict, entry: dict, agent_json: dict, cc_fm: dict[str, str]) -> None:
    """Check whether the agent's descriptions signal when to use (and not use) it."""
    desc = str(agent_json.get("description", "")).strip()
    lowered = f" {desc.lower()} "

    if desc and len(desc) < 50:
        add_finding(report, entry, "low", "Trigger quality",
                    "agent.json description is very short; confirm it says what the agent does and when to invoke it")

    if desc and not any(tok in lowered for tok in (" use ", " when ", " only ", " request ", " requests ")):
        add_finding(report, entry, "medium", "Trigger quality",
                    "agent.json description may not clearly signal when the agent should be invoked")

    cc_desc = cc_fm.get("description", "").strip()
    if cc_desc and "not" not in cc_desc.lower() and "only" not in cc_desc.lower():
        add_finding(report, entry, "low", "Trigger quality",
                    "claude-code.md description has no obvious negative boundary")


def audit_contract_clarity(report: dict, entry: dict, agent_json: dict) -> None:
    """Check that archetype, capabilities, and tools make sense together."""
    archetype = agent_json.get("archetype", "")

    if archetype == "custom":
        add_finding(report, entry, "low", "Contract clarity",
                    "agent uses 'custom' archetype — confirm a built-in archetype would not work")


def audit_surface_alignment(
    report: dict, entry: dict, agent_json: dict,
    cc_fm: dict[str, str], codex_data: dict | None,
) -> None:
    """Check name and description consistency across authored files."""
    json_name = agent_json.get("name", "")
    json_desc = str(agent_json.get("description", "")).strip()
    has_claude = bool(cc_fm)
    has_codex = codex_data is not None and bool(codex_data)

    if has_claude and has_codex:
        cc_desc = cc_fm.get("description", "")
        codex_desc = str(codex_data.get("description", "")) if codex_data else ""
        if cc_desc and codex_desc:
            overlap = _description_overlap(cc_desc, codex_desc)
            if overlap < 0.25:
                add_finding(report, entry, "medium", "Surface alignment",
                            f"claude-code.md and codex.toml descriptions may have diverged (overlap {overlap:.0%})")
    elif not has_claude and not has_codex:
        add_finding(report, entry, "critical", "Surface alignment",
                    "no platform file found (need claude-code.md or codex.toml)")
    elif not has_claude:
        add_finding(report, entry, "low", "Surface alignment",
                    "codex.toml present but claude-code.md is missing — single-surface agent")
    elif not has_codex:
        add_finding(report, entry, "low", "Surface alignment",
                    "claude-code.md present but codex.toml is missing — single-surface agent")


def audit_runtime_discipline(
    report: dict, entry: dict, agent_json: dict, codex_data: dict | None,
) -> None:
    """Check Codex runtime defaults are explicit where they should be."""
    if codex_data is None:
        return

    for field in EXPLICIT_RUNTIME_FIELDS:
        if field not in codex_data:
            add_finding(report, entry, "medium", "Runtime-default discipline",
                        f"codex.toml does not explicitly set '{field}' — will inherit from parent session")

    # web_search should only be live when network capability is true.
    network = agent_json.get("capabilities", {}).get("network", False)
    if codex_data.get("web_search") == "live" and not network:
        add_finding(report, entry, "high", "Runtime-default discipline",
                    "codex.toml has web_search='live' but agent capabilities declare network: false")


def audit_dependency_graph(
    report: dict, entry: dict, agent_json: dict,
    all_agent_names: set[str], all_skill_names: set[str],
) -> None:
    """Check skill references, agent references, and graph depth."""
    for skill_ref in agent_json.get("skills", []):
        if all_skill_names and skill_ref not in all_skill_names:
            add_finding(report, entry, "high", "Dependency graph",
                        f"references skill '{skill_ref}' which does not exist in skills/")

    agent_refs = agent_json.get("agents", [])
    for agent_ref in agent_refs:
        if agent_ref not in all_agent_names:
            add_finding(report, entry, "high", "Dependency graph",
                        f"references agent '{agent_ref}' which does not exist in agents/")
        if agent_ref == agent_json.get("name"):
            add_finding(report, entry, "critical", "Dependency graph",
                        "agent references itself — creates a recursive loop")

    if len(agent_refs) > 3:
        add_finding(report, entry, "medium", "Dependency graph",
                    f"spawns {len(agent_refs)} sub-agents — review whether this is necessary")


def audit_permission_discipline(
    report: dict, entry: dict, agent_json: dict, cc_fm: dict[str, str],
) -> None:
    """Check that tools and permissions match the archetype's intent."""
    archetype = agent_json.get("archetype", "")
    capabilities = agent_json.get("capabilities", {})
    tools_str = cc_fm.get("tools", "")

    if not tools_str:
        return

    plain_tools, _ = _parse_tools_field(tools_str)

    # Read-only archetypes with write tools.
    read_only_archetypes = {"explorer", "reviewer", "planner"}
    write_tools = {"Edit", "Write", "NotebookEdit"}
    if archetype in read_only_archetypes:
        found_write = plain_tools & write_tools
        if found_write:
            add_finding(report, entry, "high", "Permission discipline",
                        f"'{archetype}' archetype declares write tools ({', '.join(sorted(found_write))}) "
                        f"in claude-code.md — should be read-only")

    # Broad network access without research archetype.
    network_tools = {"WebSearch", "WebFetch"}
    found_net = plain_tools & network_tools
    if found_net and not capabilities.get("network", False):
        add_finding(report, entry, "medium", "Permission discipline",
                    f"declares network tools ({', '.join(sorted(found_net))}) "
                    f"but capabilities have network: false")


def audit_overlap(
    report: dict, entries: list[dict], agent_jsons: list[dict],
) -> None:
    """Check for overlapping descriptions or duplicate archetypes in the library."""
    # Pairwise description similarity.
    for i in range(len(entries)):
        for j in range(i + 1, len(entries)):
            desc_a = str(agent_jsons[i].get("description", ""))
            desc_b = str(agent_jsons[j].get("description", ""))
            overlap = _description_overlap(desc_a, desc_b)
            if overlap > 0.7:
                add_finding(report, entries[i], "medium", "Overlap",
                            f"high description overlap ({overlap:.0%}) with '{entries[j]['dir']}' — "
                            f"review whether roles should be consolidated")

    # Archetype duplication (excluding custom).
    archetype_groups: defaultdict[str, list[str]] = defaultdict(list)
    for aj in agent_jsons:
        arch = aj.get("archetype", "")
        if arch and arch != "custom":
            archetype_groups[arch].append(aj.get("name", ""))
    for arch, names in archetype_groups.items():
        if len(names) > 1:
            # Multiple agents sharing an archetype is allowed but worth noting.
            for entry in entries:
                if entry["name"] in names:
                    peers = [n for n in names if n != entry["name"]]
                    add_finding(report, entry, "low", "Overlap",
                                f"shares archetype '{arch}' with {', '.join(peers)}")


# ---------------------------------------------------------------------------
# Health score
# ---------------------------------------------------------------------------


def compute_health_score(report: dict) -> float:
    """Compute a 0-1 health score.  1.0 = no findings, 0.0 = maximally unhealthy."""
    agent_count = report["summary"]["total"]
    if agent_count == 0:
        return 1.0

    weighted_sum = sum(
        report["summary"][f"{sev}Count"] * SEVERITY_WEIGHT[sev]
        for sev in SEVERITY_ORDER
    )
    max_possible = agent_count * MAX_FINDINGS_PER_AGENT
    return max(0.0, 1.0 - (weighted_sum / max_possible))


def health_label(score: float) -> str:
    if score >= HEALTH_THRESHOLDS["healthy"]:
        return "Healthy"
    if score >= HEALTH_THRESHOLDS["needs_cleanup"]:
        return "Needs cleanup"
    return "High-risk drift"


# ---------------------------------------------------------------------------
# Main audit
# ---------------------------------------------------------------------------


def audit_inventory(root: Path) -> dict:
    report: dict = {
        "root": str(root),
        "agents": [],
        "automatedDimensions": [
            "Package integrity",
            "Trigger quality",
            "Contract clarity",
            "Surface alignment",
            "Runtime-default discipline",
            "Dependency graph",
            "Permission discipline",
            "Overlap",
        ],
        "manualFollowUpDimensions": [
            "Whether the archetype genuinely fits the agent's real-world usage",
            "Whether sub-agent delegation improves outcomes versus doing the work inline",
            "Qualitative routing precision on realistic user prompts",
        ],
        "summary": {
            "total": 0,
            "errorCount": 0,
            "warningCount": 0,
            "duplicateNameCount": 0,
            "criticalCount": 0,
            "highCount": 0,
            "mediumCount": 0,
            "lowCount": 0,
        },
    }

    repo_root = find_repo_root(root)

    # Collect all agent and skill names for reference validation.
    all_agent_names: set[str] = set()
    all_skill_names: set[str] = set()
    if repo_root:
        skills_root = repo_root / "skills"
        if skills_root.is_dir():
            for d in skills_root.iterdir():
                if d.is_dir() and not d.name.startswith("."):
                    sj = d / "skill.json"
                    if sj.exists():
                        try:
                            all_skill_names.add(json.loads(sj.read_text(encoding="utf8")).get("name", d.name))
                        except (json.JSONDecodeError, KeyError):
                            all_skill_names.add(d.name)

    agent_dirs = sorted([p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")])

    # First pass: collect all agent names so reference checks work regardless of iteration order.
    for agent_dir in agent_dirs:
        aj = load_agent_json(agent_dir)
        all_agent_names.add((aj or {}).get("name") or agent_dir.name)

    entries: list[dict] = []
    agent_jsons: list[dict] = []

    for agent_dir in agent_dirs:
        agent_json = load_agent_json(agent_dir) or {}
        codex_data = load_codex_toml(agent_dir)
        cc_fm = load_claude_code_frontmatter(agent_dir)

        json_name = agent_json.get("name") or agent_dir.name

        # Structural validation via quick_validate_agent.
        errors, warnings = validate_agent(agent_dir)

        entry = {
            "dir": agent_dir.name,
            "name": json_name,
            "version": agent_json.get("version"),
            "archetype": agent_json.get("archetype", ""),
            "categories": agent_json.get("categories", []),
            "errors": [],
            "warnings": [],
            "findings": [],
        }
        entries.append(entry)
        agent_jsons.append(agent_json)
        report["agents"].append(entry)
        report["summary"]["total"] += 1

        # Map structural validation results.
        for error in errors:
            add_finding(report, entry, "critical", "Package integrity", error)
        for warning in warnings:
            add_finding(report, entry, "low", "Package integrity", warning)

        # Per-dimension audits.
        audit_trigger_quality(report, entry, agent_json, cc_fm)
        audit_contract_clarity(report, entry, agent_json)
        audit_surface_alignment(report, entry, agent_json, cc_fm, codex_data)
        audit_runtime_discipline(report, entry, agent_json, codex_data)
        audit_dependency_graph(report, entry, agent_json, all_agent_names, all_skill_names)
        audit_permission_discipline(report, entry, agent_json, cc_fm)

    # Library-wide checks.
    audit_overlap(report, entries, agent_jsons)

    # Duplicate name detection.
    name_to_dirs: defaultdict[str, list[str]] = defaultdict(list)
    for entry in entries:
        name_to_dirs[entry["name"]].append(entry["dir"])
    duplicates = {name: dirs for name, dirs in name_to_dirs.items() if len(dirs) > 1}
    report["duplicates"] = duplicates
    report["summary"]["duplicateNameCount"] = len(duplicates)
    for entry in entries:
        if entry["name"] in duplicates:
            add_finding(report, entry, "high", "Overlap",
                        f"duplicate agent name across directories: {', '.join(duplicates[entry['name']])}")

    # Health score.
    score = compute_health_score(report)
    report["summary"]["healthScore"] = round(score, 3)
    report["summary"]["healthLabel"] = health_label(score)

    return report


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def render_markdown(report: dict) -> str:
    summary = report["summary"]
    lines = [
        f"## Agent Inventory Audit: {report['root']}",
        "",
        f"**Health**: {summary.get('healthLabel', 'Unknown')} "
        f"(score {summary.get('healthScore', 0):.2f})",
        "",
        f"- Total agents: {summary['total']}",
        f"- Critical findings: {summary['criticalCount']}",
        f"- High findings: {summary['highCount']}",
        f"- Medium findings: {summary['mediumCount']}",
        f"- Low findings: {summary['lowCount']}",
        f"- Errors (critical/high): {summary['errorCount']}",
        f"- Warnings (medium/low): {summary['warningCount']}",
        f"- Duplicate names: {summary['duplicateNameCount']}",
        "",
        "### Automated dimensions",
    ]
    for dim in report.get("automatedDimensions", []):
        lines.append(f"- {dim}")

    lines.extend(["", "### Manual follow-up still recommended"])
    for dim in report.get("manualFollowUpDimensions", []):
        lines.append(f"- {dim}")

    lines.extend([
        "",
        "| Agent | Version | Archetype | Critical | High | Medium | Low |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ])
    for entry in report["agents"]:
        counts = {sev: 0 for sev in SEVERITY_ORDER}
        for finding in entry["findings"]:
            counts[finding["severity"]] += 1
        lines.append(
            f"| {entry['dir']} | {entry.get('version') or '-'} | {entry.get('archetype') or '-'} "
            f"| {counts['critical']} | {counts['high']} | {counts['medium']} | {counts['low']} |"
        )

    if report.get("duplicates"):
        lines.extend(["", "### Duplicates"])
        for name, dirs in report["duplicates"].items():
            lines.append(f"- `{name}` appears in: {', '.join(dirs)}")

    for severity in SEVERITY_ORDER:
        lines.extend(["", f"### {severity.title()}"])
        emitted = False
        for entry in report["agents"]:
            findings = [f for f in entry["findings"] if f["severity"] == severity]
            if not findings:
                continue
            emitted = True
            lines.append(f"- `{entry['dir']}`")
            for finding in findings:
                lines.append(f"  - {finding['dimension']}: {finding['message']}")
        if not emitted:
            lines.append("- None.")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit an agent inventory directory.")
    parser.add_argument("--root", default="agents", help="Directory containing agent folders")
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    report = audit_inventory(root)

    if args.format == "json":
        print(json.dumps(report, indent=2, ensure_ascii=True))
    else:
        print(render_markdown(report), end="")

    return 1 if report["summary"]["errorCount"] else 0


if __name__ == "__main__":
    sys.exit(main())
