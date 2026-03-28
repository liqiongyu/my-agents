from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from _loader import load_script_module


run_unit_tests = load_script_module("run_unit_tests")


class RunUnitTestsTests(unittest.TestCase):
    def test_build_command_defaults_to_quiet_pytest_run(self) -> None:
        tests_path = Path("/tmp/demo-tests")

        command = run_unit_tests.build_command(tests_path, [])

        self.assertEqual(
            command,
            [
                "uv",
                "run",
                "--with",
                "pytest",
                "python",
                "-m",
                "pytest",
                str(tests_path),
                "-q",
            ],
        )

    def test_main_forwards_pytest_remainder_args(self) -> None:
        with mock.patch.object(run_unit_tests.subprocess, "run") as mock_run:
            mock_run.return_value = subprocess.CompletedProcess(["uv"], 3)

            exit_code = run_unit_tests.main(["--", "-k", "projection", "-q"])

        self.assertEqual(exit_code, 3)
        mock_run.assert_called_once()
        command = mock_run.call_args.args[0]
        self.assertEqual(command[:7], ["uv", "run", "--with", "pytest", "python", "-m", "pytest"])
        self.assertEqual(command[7], str(run_unit_tests.default_tests_path()))
        self.assertEqual(command[8:], ["-k", "projection", "-q"])

    def test_main_reports_canonical_only_when_tests_directory_is_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            missing_path = Path(tmp) / "missing-tests"

            with mock.patch.object(run_unit_tests.subprocess, "run") as mock_run, mock.patch(
                "sys.stderr"
            ) as mock_stderr:
                exit_code = run_unit_tests.main(["--tests-path", str(missing_path)])

        self.assertEqual(exit_code, 2)
        mock_run.assert_not_called()
        written = "".join(call.args[0] for call in mock_stderr.write.call_args_list)
        self.assertIn("canonical-only", written)
        self.assertIn("projected runtime copies intentionally exclude tests/", written)


if __name__ == "__main__":
    unittest.main()
