from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from _loader import load_script_module


seed_eval_workspace = load_script_module("seed_eval_workspace")


def _eval_spec(eval_id: str) -> dict[str, str]:
    return {
        "id": eval_id,
        "label": eval_id,
        "prompt": f"Prompt for {eval_id}",
        "successCriteria": f"Success for {eval_id}",
    }


class SeedEvalWorkspaceTests(unittest.TestCase):
    def test_seed_workspace_retries_when_candidate_iteration_already_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace_root = Path(tmp) / "workspaces"
            skill_root = workspace_root / "demo-skill"
            (skill_root / "iteration-1").mkdir(parents=True)

            with mock.patch.object(seed_eval_workspace, "next_iteration", side_effect=[1, 2]):
                iteration_dir = seed_eval_workspace.seed_workspace(
                    "demo-skill",
                    workspace_root,
                    iteration=None,
                    evals=[_eval_spec("case-a")],
                    reuse_latest=False,
                )

            self.assertEqual(iteration_dir.name, "iteration-2")
            self.assertTrue((iteration_dir / "manifest.json").exists())

    def test_seed_workspace_merges_manifest_when_reusing_iteration(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace_root = Path(tmp) / "workspaces"

            first_dir = seed_eval_workspace.seed_workspace(
                "demo-skill",
                workspace_root,
                iteration=1,
                evals=[_eval_spec("case-a")],
            )
            second_dir = seed_eval_workspace.seed_workspace(
                "demo-skill",
                workspace_root,
                iteration=1,
                evals=[_eval_spec("case-b")],
            )

            self.assertEqual(first_dir, second_dir)

            manifest = json.loads((first_dir / "manifest.json").read_text(encoding="utf8"))
            eval_ids = [entry["id"] for entry in manifest["evals"]]
            self.assertEqual(eval_ids, ["case-a", "case-b"])
            self.assertEqual(manifest["evalCount"], 2)
            self.assertTrue((first_dir / "evals" / "case-a" / "with-skill" / "run-template.json").exists())
            self.assertTrue((first_dir / "evals" / "case-b" / "with-skill" / "run-template.json").exists())


if __name__ == "__main__":
    unittest.main()
