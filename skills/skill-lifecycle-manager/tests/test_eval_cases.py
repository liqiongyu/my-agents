from __future__ import annotations

import json
import unittest
from pathlib import Path


class EvalCasesTests(unittest.TestCase):
    def test_eval_10_describes_a_generic_package_boundary_defect(self) -> None:
        eval_path = Path(__file__).resolve().parents[1] / "eval" / "eval-cases.json"
        payload = json.loads(eval_path.read_text(encoding="utf8"))
        cases = {case["id"]: case for case in payload["cases"]}

        case = cases["eval-10"]
        prompt = case["prompt"]

        self.assertIn("private scripts from another installable skill package", prompt)
        self.assertNotIn("skills/skill-lifecycle-manager/scripts/quick_validate_agent.py", prompt)
        self.assertNotIn("skills/skill-lifecycle-manager/scripts/audit_agent_inventory.py", prompt)


if __name__ == "__main__":
    unittest.main()
