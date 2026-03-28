from __future__ import annotations

import subprocess
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


if __name__ == "__main__":
    unittest.main()
