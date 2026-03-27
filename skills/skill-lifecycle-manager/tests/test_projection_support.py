from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from _loader import load_script_module


projection_support = load_script_module("projection_support")


class ProjectionSupportTests(unittest.TestCase):
    def test_infer_project_root_finds_categories_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            nested = repo_root / "skills" / "demo"
            nested.mkdir(parents=True)
            (repo_root / "categories.json").write_text('{"categories": ["workflow"]}\n', encoding="utf8")

            inferred = projection_support.infer_project_root(nested)

            self.assertEqual(inferred.resolve(), repo_root.resolve())

    def test_infer_project_root_raises_without_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            start = Path(tmp) / "orphan" / "skill"
            start.mkdir(parents=True)

            with self.assertRaises(FileNotFoundError):
                projection_support.infer_project_root(start)

    def test_excluded_roots_merge_defaults_global_and_platform_values(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            skill_dir = Path(tmp) / "demo-skill"
            skill_dir.mkdir()
            (skill_dir / "projection.json").write_text(
                '{\n'
                '  "exclude": ["eval", "tmp"],\n'
                '  "platforms": {"claude-code": {"exclude": ["scripts"]}}\n'
                '}\n',
                encoding="utf8",
            )

            claude_roots = projection_support.excluded_roots(skill_dir, "claude-code")
            codex_roots = projection_support.excluded_roots(skill_dir, "codex")

            self.assertIn("projection.json", claude_roots)
            self.assertIn("eval", claude_roots)
            self.assertIn("scripts", claude_roots)
            self.assertIn("skill.json", claude_roots)
            self.assertIn("tmp", codex_roots)
            self.assertNotIn("scripts", codex_roots)


if __name__ == "__main__":
    unittest.main()
