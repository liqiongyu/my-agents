from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from _loader import load_script_module


run_surface_eval = load_script_module("run_surface_eval")


class RunSurfaceEvalTests(unittest.TestCase):
    def _eval_entry(self) -> dict:
        return {
            "id": "case-1",
            "label": "Case 1",
            "prompt": "Say hello",
            "successCriteria": "Returns a useful answer",
        }

    def test_baseline_stage_hides_project_projection_and_restores_it(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            workdir = repo_root / "subdir"
            projection_dir = repo_root / ".agents" / "skills" / "demo-skill"
            stage_dir = repo_root / "artifacts"
            workdir.mkdir(parents=True)
            projection_dir.mkdir(parents=True)
            (repo_root / "categories.json").write_text('{"categories": ["workflow"]}\n', encoding="utf8")
            (projection_dir / "marker.txt").write_text("present\n", encoding="utf8")

            def fake_run(command, cwd, capture_output, text, timeout):  # type: ignore[no-untyped-def]
                self.assertFalse(projection_dir.exists())
                return subprocess.CompletedProcess(command, 0, stdout="baseline output", stderr="")

            with mock.patch.object(run_surface_eval, "build_command", return_value=["dummy"]), mock.patch.object(
                run_surface_eval.subprocess,
                "run",
                side_effect=fake_run,
            ):
                exit_code = run_surface_eval.run_case(
                    surface="codex",
                    workdir=workdir,
                    skill_name="demo-skill",
                    eval_entry=self._eval_entry(),
                    stage="baseline",
                    stage_dir=stage_dir,
                    effort=None,
                    timeout_sec=5,
                )

            self.assertEqual(exit_code, 0)
            self.assertTrue(projection_dir.exists())
            self.assertTrue((projection_dir / "marker.txt").exists())

            result = json.loads((stage_dir / "result.json").read_text(encoding="utf8"))
            self.assertEqual(result["baseline"]["mode"], "project-projection-disabled")
            self.assertEqual(result["stage"], "baseline")

    def test_timeout_writes_structured_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo_root = Path(tmp) / "repo"
            workdir = repo_root / "subdir"
            stage_dir = repo_root / "artifacts"
            workdir.mkdir(parents=True)
            (repo_root / "categories.json").write_text('{"categories": ["workflow"]}\n', encoding="utf8")

            timeout_error = subprocess.TimeoutExpired(
                cmd=["dummy"],
                timeout=7,
                output="partial stdout",
                stderr="partial stderr",
            )

            with mock.patch.object(run_surface_eval, "build_command", return_value=["dummy"]), mock.patch.object(
                run_surface_eval.subprocess,
                "run",
                side_effect=timeout_error,
            ):
                exit_code = run_surface_eval.run_case(
                    surface="codex",
                    workdir=workdir,
                    skill_name="demo-skill",
                    eval_entry=self._eval_entry(),
                    stage="with-skill",
                    stage_dir=stage_dir,
                    effort=None,
                    timeout_sec=7,
                )

            self.assertEqual(exit_code, run_surface_eval.TIMEOUT_EXIT_CODE)
            self.assertEqual((stage_dir / "stdout.log").read_text(encoding="utf8"), "partial stdout")
            self.assertEqual((stage_dir / "stderr.log").read_text(encoding="utf8"), "partial stderr")

            result = json.loads((stage_dir / "result.json").read_text(encoding="utf8"))
            self.assertTrue(result["timedOut"])
            self.assertEqual(result["exitCode"], run_surface_eval.TIMEOUT_EXIT_CODE)
            self.assertEqual(result["error"], "process timed out after 7 seconds")


if __name__ == "__main__":
    unittest.main()
