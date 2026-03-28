#!/usr/bin/env python3
"""Audit a directory of skills for lifecycle, projection, and package health."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from projection_support import compare_projection, projection_dir
from quick_validate import find_repo_root, has_negative_boundary, parse_frontmatter, validate_skill


SEVERITY_ORDER = ("critical", "high", "medium", "low")
LONG_SKILL_DOC_THRESHOLD = 7000
PROJECTED_FILE_WASTE_THRESHOLD = 24
PROJECTED_BYTES_WASTE_THRESHOLD = 48 * 1024
RISKY_SCRIPT_PATTERNS = {
    r"\bsubprocess\.run\b": "spawns external commands",
    r"\brequests\.[A-Za-z_]+\b": "performs network requests",
    r"\burllib\.request\b": "performs network requests",
    r"\bshutil\.rmtree\b": "removes directories recursively",
    r"\bos\.remove\b": "removes files",
    r"\bos\.replace\b": "replaces files or directories atomically",
}


def load_skill_json(skill_dir: Path) -> dict | None:
    path = skill_dir / "skill.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf8"))
    except json.JSONDecodeError:
        return None


def load_skill_markdown(skill_dir: Path) -> str:
    path = skill_dir / "SKILL.md"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf8")


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


def has_dimension_finding(entry: dict, dimension: str) -> bool:
    return any(finding["dimension"] == dimension for finding in entry.get("findings", []))


def extract_reference_targets(skill_md: str) -> list[str]:
    targets: list[str] = []
    for target in re.findall(r"\]\(([^)#]+)", skill_md):
        normalized = target.strip()
        if normalized.startswith("references/"):
            targets.append(normalized)
    return targets


def projection_sizes(destination: Path) -> tuple[int, int]:
    file_count = 0
    byte_count = 0
    for path in destination.rglob("*"):
        if not path.is_file():
            continue
        file_count += 1
        byte_count += path.stat().st_size
    return file_count, byte_count


def audit_trigger_and_boundary(report: dict, entry: dict, frontmatter: dict[str, str], skill_md: str) -> None:
    description = frontmatter.get("description", "").strip()
    lowered = f" {description.lower()} "

    if description and len(description) < 50:
        add_finding(
            report,
            entry,
            "low",
            "Trigger quality",
            "frontmatter description is very short; confirm it still says what the skill does and when to use it",
        )
    if description and not any(token in lowered for token in (" use ", " when ", " only ", " request ", " requests ")):
        add_finding(
            report,
            entry,
            "medium",
            "Trigger quality",
            "frontmatter description may describe the skill without clearly signaling when it should trigger",
        )
    if not has_negative_boundary(skill_md) and not has_dimension_finding(entry, "Boundary clarity"):
        add_finding(
            report,
            entry,
            "medium",
            "Boundary clarity",
            "SKILL.md does not clearly define when the skill should not be used",
        )


def audit_reference_hygiene(report: dict, entry: dict, skill_dir: Path, skill_md: str) -> None:
    for target in extract_reference_targets(skill_md):
        if not (skill_dir / target).exists():
            add_finding(
                report,
                entry,
                "medium",
                "Reference hygiene",
                f"SKILL.md references a missing file: {target}",
            )

    if len(skill_md) > LONG_SKILL_DOC_THRESHOLD and not (skill_dir / "references").is_dir():
        add_finding(
            report,
            entry,
            "low",
            "Reference hygiene",
            "SKILL.md is unusually long but the skill has no references/ directory for progressive disclosure",
        )


def audit_script_safety(report: dict, entry: dict, skill_dir: Path, skill_json: dict) -> None:
    scripts_dir = skill_dir / "scripts"
    if not scripts_dir.is_dir():
        return

    risky_hits: list[str] = []
    for script_path in sorted(scripts_dir.glob("*.py")):
        text = script_path.read_text(encoding="utf8")
        for pattern, label in RISKY_SCRIPT_PATTERNS.items():
            if re.search(pattern, text):
                risky_hits.append(f"{script_path.name}: {label}")

    if risky_hits:
        add_finding(
            report,
            entry,
            "low",
            "Script safety",
            "manual review recommended for potentially side-effecting helpers: " + "; ".join(risky_hits[:5]),
        )

    tools = skill_json.get("requirements", {}).get("tools", [])
    if not isinstance(tools, list) or not tools:
        add_finding(
            report,
            entry,
            "low",
            "Script safety",
            "scripts/ exists but skill.json does not declare any tool requirements",
        )


def audit_readiness(report: dict, entry: dict, skill_dir: Path, skill_md: str) -> None:
    lowered = skill_md.lower()
    if "validate" not in lowered and not (skill_dir / "scripts" / "quick_validate.py").exists():
        add_finding(
            report,
            entry,
            "low",
            "Validation readiness",
            "no obvious validation hook detected in SKILL.md or scripts/quick_validate.py",
        )
    if "evaluate" not in lowered and "eval/" not in lowered and not (skill_dir / "eval").exists():
        add_finding(
            report,
            entry,
            "low",
            "Evaluation readiness",
            "no eval directory or obvious evaluation guidance detected",
        )
    if "project" not in lowered and "install" not in lowered and not (skill_dir / "projection.json").exists():
        add_finding(
            report,
            entry,
            "low",
            "Install / publish readiness",
            "no projection config or obvious install/publish guidance detected",
        )


def audit_projection_health(report: dict, entry: dict, repo_root: Path | None, skill_dir: Path) -> None:
    if repo_root is None:
        add_finding(
            report,
            entry,
            "low",
            "Projection health",
            "repo root could not be inferred, so project-scope projection checks were skipped",
        )
        return

    projection_config_present = (skill_dir / "projection.json").exists()
    for platform in ("codex", "claude-code"):
        destination = projection_dir(skill_dir, platform, "project", output_root=repo_root)
        if destination.exists():
            errors, warnings = compare_projection(skill_dir, platform, destination)
            for error in errors:
                add_finding(report, entry, "high", "Projection health", f"{platform}: {error}")
            for warning in warnings:
                add_finding(report, entry, "low", "Projection health", f"{platform}: {warning}")

            file_count, byte_count = projection_sizes(destination)
            if file_count > PROJECTED_FILE_WASTE_THRESHOLD or byte_count > PROJECTED_BYTES_WASTE_THRESHOLD:
                add_finding(
                    report,
                    entry,
                    "low",
                    "Inventory health",
                    (
                        f"{platform} projection is comparatively heavy "
                        f"({file_count} files, {byte_count} bytes); review runtime context cost"
                    ),
                )
        elif projection_config_present:
            add_finding(
                report,
                entry,
                "medium",
                "Projection health",
                f"{platform} project projection is missing even though projection.json is present",
            )


def audit_inventory(root: Path) -> dict:
    report: dict = {
        "root": str(root),
        "skills": [],
        "automatedDimensions": [
            "Trigger quality",
            "Boundary clarity",
            "Package integrity",
            "Reference hygiene",
            "Script safety",
            "Validation readiness",
            "Evaluation readiness",
            "Install / publish readiness",
            "Projection health",
            "Inventory health",
        ],
        "manualFollowUpDimensions": [
            "Deep trigger wording judgment",
            "Whether scripts are necessary rather than merely possible",
            "Qualitative usefulness of the skill on real tasks",
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
    name_to_dirs: defaultdict[str, list[str]] = defaultdict(list)
    repo_root = find_repo_root(root)

    skill_dirs = sorted([path for path in root.iterdir() if path.is_dir() and not path.name.startswith(".")])

    for skill_dir in skill_dirs:
        skill_json = load_skill_json(skill_dir) or {}
        skill_md = load_skill_markdown(skill_dir)
        errors, warnings = validate_skill(skill_dir)
        json_name = skill_json.get("name") or skill_dir.name
        name_to_dirs[str(json_name)].append(skill_dir.name)

        frontmatter: dict[str, str] = {}
        if skill_md.startswith("---"):
            try:
                frontmatter = parse_frontmatter(skill_md)
            except ValueError:
                frontmatter = {}

        entry = {
            "dir": skill_dir.name,
            "name": json_name,
            "version": skill_json.get("version"),
            "categories": skill_json.get("categories", []),
            "errors": [],
            "warnings": [],
            "findings": [],
        }
        report["skills"].append(entry)
        report["summary"]["total"] += 1

        for error in errors:
            add_finding(report, entry, "critical", "Package integrity", error)
        for warning in warnings:
            dimension = "Boundary clarity" if "negative boundary" in warning.lower() else "Package integrity"
            add_finding(report, entry, "medium", dimension, warning)

        if skill_md:
            audit_trigger_and_boundary(report, entry, frontmatter, skill_md)
            audit_reference_hygiene(report, entry, skill_dir, skill_md)
            audit_readiness(report, entry, skill_dir, skill_md)
        audit_script_safety(report, entry, skill_dir, skill_json)
        audit_projection_health(report, entry, repo_root, skill_dir)

    duplicates = {name: dirs for name, dirs in name_to_dirs.items() if len(dirs) > 1}
    report["duplicates"] = duplicates
    report["summary"]["duplicateNameCount"] = len(duplicates)

    for entry in report["skills"]:
        if entry["name"] in duplicates:
            add_finding(
                report,
                entry,
                "high",
                "Inventory health",
                f"duplicate skill name across directories: {', '.join(duplicates[entry['name']])}",
            )

    return report


def verdict_for(report: dict) -> str:
    if report["summary"]["criticalCount"] or report["summary"]["highCount"]:
        return "High-risk drift"
    if report["summary"]["mediumCount"] or report["summary"]["lowCount"]:
        return "Needs cleanup"
    return "Healthy"


def render_markdown(report: dict) -> str:
    lines = [
        f"## Skill Inventory Audit: {report['root']}",
        "",
        f"**Verdict**: {verdict_for(report)}",
        "",
        f"- Total skills: {report['summary']['total']}",
        f"- Critical findings: {report['summary']['criticalCount']}",
        f"- High findings: {report['summary']['highCount']}",
        f"- Medium findings: {report['summary']['mediumCount']}",
        f"- Low findings: {report['summary']['lowCount']}",
        f"- Errors (critical/high): {report['summary']['errorCount']}",
        f"- Warnings (medium/low): {report['summary']['warningCount']}",
        f"- Duplicate names: {report['summary']['duplicateNameCount']}",
        "",
        "### Automated dimensions",
    ]

    for dimension in report.get("automatedDimensions", []):
        lines.append(f"- {dimension}")

    lines.extend(["", "### Manual follow-up still recommended"])
    for dimension in report.get("manualFollowUpDimensions", []):
        lines.append(f"- {dimension}")

    lines.extend(
        [
            "",
            "| Skill | Version | Critical | High | Medium | Low |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )

    for entry in report["skills"]:
        counts = {severity: 0 for severity in SEVERITY_ORDER}
        for finding in entry["findings"]:
            counts[finding["severity"]] += 1
        lines.append(
            f"| {entry['dir']} | {entry.get('version') or '-'} | {counts['critical']} | {counts['high']} | {counts['medium']} | {counts['low']} |"
        )

    if report.get("duplicates"):
        lines.extend(["", "### Duplicates"])
        for name, dirs in report["duplicates"].items():
            lines.append(f"- `{name}` appears in: {', '.join(dirs)}")

    for severity in SEVERITY_ORDER:
        lines.extend(["", f"### {severity.title()}"])
        emitted = False
        for entry in report["skills"]:
            skill_findings = [finding for finding in entry["findings"] if finding["severity"] == severity]
            if not skill_findings:
                continue
            emitted = True
            lines.append(f"- `{entry['dir']}`")
            for finding in skill_findings:
                lines.append(f"  - {finding['dimension']}: {finding['message']}")
        if not emitted:
            lines.append("- None.")

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit a skill inventory directory.")
    parser.add_argument("--root", default="skills", help="Directory containing skill folders")
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
