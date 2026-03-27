from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path

from _loader import load_script_module


audit_skill_inventory = load_script_module("audit_skill_inventory")
quick_validate = load_script_module("quick_validate")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf8")


class SkillAuditAndValidateTests(unittest.TestCase):
    def test_validate_skill_accepts_well_formed_skill(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            skill_dir = repo_root / "skills" / "demo-skill"
            write_text(repo_root / "categories.json", '{"categories": ["workflow"]}\n')
            write_text(
                skill_dir / "skill.json",
                textwrap.dedent(
                    """\
                    {
                      "name": "demo-skill",
                      "description": "Use this skill when you need demo lifecycle guidance for a skill request.",
                      "version": "1.0.0",
                      "categories": ["workflow"]
                    }
                    """
                ),
            )
            write_text(
                skill_dir / "SKILL.md",
                textwrap.dedent(
                    """\
                    ---
                    name: demo-skill
                    description: >
                      Use this skill when you need demo lifecycle guidance for a skill request.
                    ---

                    # Demo Skill

                    This skill exists only for tests. It explains when to use it, how to validate it,
                    and how to stay within scope. The body is intentionally long enough to satisfy the
                    doc-quality gate while remaining easy to read.

                    ## When Not To Use

                    Do not use this for general code work.

                    ## Workflow

                    Validate the package before making claims.
                    """
                )
                + ("Extra filler to clear the minimum length. " * 8),
            )
            write_text(
                skill_dir / "CHANGELOG.md",
                textwrap.dedent(
                    """\
                    # Changelog

                    ## [1.0.0] - 2026-03-27

                    ### Added
                    - Initial release.
                    """
                ),
            )

            errors, warnings = quick_validate.validate_skill(skill_dir)

            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])

    def test_validate_skill_accepts_yaml_comments_and_block_scalars(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            skill_dir = repo_root / "skills" / "commented-skill"
            write_text(repo_root / "categories.json", '{"categories": ["workflow"]}\n')
            write_text(
                skill_dir / "skill.json",
                textwrap.dedent(
                    """\
                    {
                      "name": "commented-skill",
                      "description": "Use this skill when you need lifecycle guidance for a commented-skill request.",
                      "version": "1.0.0",
                      "categories": ["workflow"]
                    }
                    """
                ),
            )
            write_text(
                skill_dir / "SKILL.md",
                textwrap.dedent(
                    """\
                    ---
                    # A valid YAML comment that the simple fallback parser would skip.
                    name: commented-skill
                    description: >
                      Use this skill when you need lifecycle guidance for a
                      commented-skill request.
                    ---

                    # Commented Skill

                    This fixture checks that frontmatter comments and block scalar
                    descriptions are accepted during validation.

                    ## When Not To Use

                    Do not use this for unrelated code work.
                    """
                )
                + ("Extra filler to clear the minimum length. " * 8),
            )
            write_text(
                skill_dir / "CHANGELOG.md",
                textwrap.dedent(
                    """\
                    # Changelog

                    ## [1.0.0] - 2026-03-27

                    ### Added
                    - Initial release.
                    """
                ),
            )

            errors, warnings = quick_validate.validate_skill(skill_dir)

            self.assertEqual(errors, [])
            self.assertEqual(warnings, [])

    def test_audit_inventory_reports_trigger_and_projection_findings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            skills_root = repo_root / "skills"
            skill_dir = skills_root / "demo-skill"
            write_text(repo_root / "categories.json", '{"categories": ["workflow"]}\n')
            write_text(
                skill_dir / "projection.json",
                '{\n  "exclude": ["eval"]\n}\n',
            )
            write_text(
                skill_dir / "skill.json",
                textwrap.dedent(
                    """\
                    {
                      "name": "demo-skill",
                      "description": "Demo helper for skills.",
                      "version": "1.0.0",
                      "categories": ["workflow"],
                      "requirements": {"tools": ["uv"]}
                    }
                    """
                ),
            )
            write_text(
                skill_dir / "SKILL.md",
                textwrap.dedent(
                    """\
                    ---
                    name: demo-skill
                    description: Demo helper for skills.
                    ---

                    # Demo Skill

                    This intentionally leaves out the negative boundary and richer trigger wording so the
                    audit can flag it. The file also stays long enough for structural validation.

                    ## Workflow

                    Validate it eventually.
                    """
                )
                + ("Extra filler to clear the minimum length. " * 8),
            )
            write_text(
                skill_dir / "CHANGELOG.md",
                textwrap.dedent(
                    """\
                    # Changelog

                    ## [1.0.0] - 2026-03-27

                    ### Added
                    - Initial release.
                    """
                ),
            )

            report = audit_skill_inventory.audit_inventory(skills_root)
            findings = report["skills"][0]["findings"]
            dimensions = {finding["dimension"] for finding in findings}

            self.assertIn("Trigger quality", dimensions)
            self.assertIn("Projection health", dimensions)
            self.assertIn("Boundary clarity", dimensions)
            self.assertGreater(report["summary"]["mediumCount"], 0)
            self.assertEqual(report["summary"]["duplicateNameCount"], 0)


if __name__ == "__main__":
    unittest.main()
