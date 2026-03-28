#!/usr/bin/env python3
"""Seed an Anthropic-style eval workspace for a skill iteration."""

from __future__ import annotations

import argparse
import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "eval"


def parse_eval_specs(raw_specs: list[str]) -> list[dict[str, str]]:
    evals: list[dict[str, str]] = []
    for index, raw_spec in enumerate(raw_specs, start=1):
        parts = [part.strip() for part in raw_spec.split("|")]
        if len(parts) < 2:
            raise ValueError(
                f"invalid --eval value #{index}: expected 'label|prompt|success_criteria'"
            )
        label = parts[0]
        prompt = parts[1]
        success = parts[2] if len(parts) >= 3 else ""
        evals.append(
            {
                "id": slugify(label),
                "label": label,
                "prompt": prompt,
                "successCriteria": success,
            }
        )
    return evals


def _truncate_success_criteria(value: str, limit: int = 220) -> str:
    normalized = re.sub(r"\s+", " ", value).strip()
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def load_eval_file(eval_path: Path, case_filters: set[str] | None = None) -> list[dict[str, str]]:
    payload = json.loads(eval_path.read_text(encoding="utf8"))
    evals: list[dict[str, str]] = []

    if isinstance(payload.get("cases"), list):
        for case in payload["cases"]:
            case_id = str(case.get("id") or "").strip()
            case_name = str(case.get("name") or case_id or "eval").strip()
            if case_filters and case_id not in case_filters and case_name not in case_filters:
                continue
            assertions = case.get("assertions", {})
            assertion_keys = list(assertions.keys())[:5] if isinstance(assertions, dict) else []
            success = case.get("description") or ""
            if assertion_keys:
                success = (
                    f"{success} Assertions to review: " + ", ".join(assertion_keys)
                ).strip()
            evals.append(
                {
                    "id": slugify(case_id or case_name),
                    "label": case_name,
                    "prompt": str(case.get("prompt", "")).strip(),
                    "successCriteria": _truncate_success_criteria(success),
                }
            )
    elif isinstance(payload.get("evals"), list):
        for index, case in enumerate(payload["evals"], start=1):
            case_id = str(case.get("id") or f"eval-{index}").strip()
            if case_filters and case_id not in case_filters:
                continue
            expectations = case.get("expectations", [])
            success = str(case.get("expected_output", "")).strip()
            if expectations:
                success = (
                    f"{success} Expectations: " + "; ".join(str(item).strip() for item in expectations[:4])
                ).strip()
            evals.append(
                {
                    "id": slugify(case_id),
                    "label": case_id,
                    "prompt": str(case.get("prompt", "")).strip(),
                    "successCriteria": _truncate_success_criteria(success),
                }
            )
    else:
        raise ValueError("unsupported eval file format: expected 'cases' or 'evals' array")

    if case_filters:
        matched = {entry["id"] for entry in evals} | {entry["label"] for entry in evals}
        missing = sorted(case_filters - matched)
        if missing:
            raise ValueError(f"unknown case id(s): {', '.join(missing)}")

    filtered = [entry for entry in evals if entry["prompt"]]
    if not filtered:
        raise ValueError("eval file did not yield any prompts")
    return filtered


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def existing_iterations(base_dir: Path) -> list[int]:
    existing: list[int] = []
    for child in base_dir.iterdir() if base_dir.exists() else []:
        if not child.is_dir():
            continue
        match = re.fullmatch(r"iteration-(\d+)", child.name)
        if match:
            existing.append(int(match.group(1)))
    return sorted(existing)


def next_iteration(base_dir: Path) -> int:
    return max(existing_iterations(base_dir), default=0) + 1


def latest_iteration(base_dir: Path) -> int | None:
    iterations = existing_iterations(base_dir)
    if not iterations:
        return None
    return max(iterations)


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf8")


def read_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    payload = json.loads(path.read_text(encoding="utf8"))
    return payload if isinstance(payload, dict) else None


class SeedWorkspaceLock:
    def __init__(self, lock_path: Path, timeout_sec: float = 10.0, poll_interval_sec: float = 0.05) -> None:
        self.lock_path = lock_path
        self.timeout_sec = timeout_sec
        self.poll_interval_sec = poll_interval_sec
        self.fd: int | None = None

    def __enter__(self) -> "SeedWorkspaceLock":
        deadline = time.monotonic() + self.timeout_sec
        while True:
            try:
                self.fd = os.open(self.lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                payload = json.dumps(
                    {"pid": os.getpid(), "createdAt": now_iso()},
                    ensure_ascii=True,
                )
                os.write(self.fd, payload.encode("utf8"))
                return self
            except FileExistsError:
                if time.monotonic() >= deadline:
                    raise TimeoutError(f"timed out waiting for seed workspace lock: {self.lock_path}")
                time.sleep(self.poll_interval_sec)

    def __exit__(self, exc_type, exc, exc_tb) -> bool:
        if self.fd is not None:
            os.close(self.fd)
            self.fd = None
        try:
            self.lock_path.unlink()
        except FileNotFoundError:
            pass
        return False


def reserve_next_iteration_dir(skill_root: Path) -> tuple[int, Path]:
    while True:
        iteration_number = next_iteration(skill_root)
        iteration_dir = skill_root / f"iteration-{iteration_number}"
        try:
            iteration_dir.mkdir(parents=False, exist_ok=False)
            return iteration_number, iteration_dir
        except FileExistsError:
            continue


def merge_evals(existing_evals: list[dict], new_evals: list[dict]) -> list[dict]:
    merged: list[dict] = []
    positions: dict[str, int] = {}

    for entry in [*existing_evals, *new_evals]:
        if not isinstance(entry, dict):
            continue
        key = str(entry.get("id") or entry.get("label") or "").strip()
        if not key:
            continue
        normalized = dict(entry)
        if key in positions:
            merged[positions[key]] = normalized
        else:
            positions[key] = len(merged)
            merged.append(normalized)

    return merged


def merge_manifests(existing_manifest: dict | None, new_manifest: dict) -> dict:
    if not existing_manifest:
        payload = dict(new_manifest)
        payload["evalCount"] = len(payload.get("evals", []))
        return payload

    merged_evals = merge_evals(
        existing_manifest.get("evals", []) if isinstance(existing_manifest.get("evals"), list) else [],
        new_manifest.get("evals", []) if isinstance(new_manifest.get("evals"), list) else [],
    )

    merged_stages = list(
        dict.fromkeys(
            [
                *(
                    existing_manifest.get("stages", [])
                    if isinstance(existing_manifest.get("stages"), list)
                    else []
                ),
                *(new_manifest.get("stages", []) if isinstance(new_manifest.get("stages"), list) else []),
            ]
        )
    )
    merged_source_cases = list(
        dict.fromkeys(
            [
                *(
                    existing_manifest.get("sourceCases", [])
                    if isinstance(existing_manifest.get("sourceCases"), list)
                    else []
                ),
                *(new_manifest.get("sourceCases", []) if isinstance(new_manifest.get("sourceCases"), list) else []),
            ]
        )
    )

    return {
        "skill": existing_manifest.get("skill", new_manifest.get("skill")),
        "iteration": existing_manifest.get("iteration", new_manifest.get("iteration")),
        "generatedAt": new_manifest.get("generatedAt"),
        "evalCount": len(merged_evals),
        "stages": merged_stages or ["with-skill", "baseline"],
        "notes": new_manifest.get("notes") or existing_manifest.get("notes"),
        "evals": merged_evals,
        "sourceEvalFile": new_manifest.get("sourceEvalFile") or existing_manifest.get("sourceEvalFile"),
        "sourceCases": merged_source_cases,
    }


def seed_workspace(
    skill_name: str,
    workspace_root: Path,
    iteration: int | None,
    evals: list[dict[str, str]],
    *,
    source_eval_file: Path | None = None,
    source_cases: list[str] | None = None,
    reuse_latest: bool = False,
) -> Path:
    skill_root = workspace_root / skill_name
    skill_root.mkdir(parents=True, exist_ok=True)
    lock_path = skill_root / ".seed-workspace.lock"

    with SeedWorkspaceLock(lock_path):
        if iteration is not None:
            iteration_number = iteration
            iteration_dir = skill_root / f"iteration-{iteration_number}"
            iteration_dir.mkdir(parents=False, exist_ok=True)
        elif reuse_latest:
            existing_iteration = latest_iteration(skill_root)
            if existing_iteration is not None:
                iteration_number = existing_iteration
                iteration_dir = skill_root / f"iteration-{iteration_number}"
                iteration_dir.mkdir(parents=False, exist_ok=True)
            else:
                iteration_number, iteration_dir = reserve_next_iteration_dir(skill_root)
        else:
            iteration_number, iteration_dir = reserve_next_iteration_dir(skill_root)

        evals_dir = iteration_dir / "evals"
        evals_dir.mkdir(parents=True, exist_ok=True)

        manifest = {
            "skill": skill_name,
            "iteration": iteration_number,
            "generatedAt": now_iso(),
            "evalCount": len(evals),
            "stages": ["with-skill", "baseline"],
            "notes": "Populate outputs after running the skill and any requested baseline.",
            "evals": evals,
            "sourceEvalFile": str(source_eval_file) if source_eval_file else None,
            "sourceCases": source_cases or [],
        }
        merged_manifest = merge_manifests(read_json(iteration_dir / "manifest.json"), manifest)
        write_json(iteration_dir / "manifest.json", merged_manifest)

        for eval_spec in evals:
            eval_dir = evals_dir / eval_spec["id"]
            for stage in ["with-skill", "baseline"]:
                stage_dir = eval_dir / stage
                stage_dir.mkdir(parents=True, exist_ok=True)
                write_json(
                    stage_dir / "run-template.json",
                    {
                        "skill": skill_name,
                        "iteration": iteration_number,
                        "evalId": eval_spec["id"],
                        "stage": stage,
                        "prompt": eval_spec["prompt"],
                        "successCriteria": eval_spec["successCriteria"],
                        "resultSummary": "",
                        "artifacts": [],
                    },
                )

        return iteration_dir


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed a skill eval workspace.")
    parser.add_argument("skill_name", help="Skill name or folder name")
    parser.add_argument(
        "--workspace-root",
        default="workspaces",
        help="Workspace root directory (default: workspaces)",
    )
    parser.add_argument(
        "--iteration",
        type=int,
        help="Iteration number to create. Defaults to the next available iteration.",
    )
    parser.add_argument(
        "--eval",
        dest="evals",
        action="append",
        default=[],
        help="Eval spec in the form 'label|prompt|success_criteria'. Repeat for multiple evals.",
    )
    parser.add_argument(
        "--eval-file",
        help="Path to an eval JSON file with either a top-level 'cases' or 'evals' array.",
    )
    parser.add_argument(
        "--case",
        dest="cases",
        action="append",
        default=[],
        help="Optional case id/name filter when --eval-file is provided. Repeat for multiple cases.",
    )
    parser.add_argument(
        "--reuse-latest",
        action="store_true",
        help="Reuse the latest iteration for this skill instead of creating a new one when --iteration is omitted.",
    )
    args = parser.parse_args()

    if not args.evals and not args.eval_file:
        raise SystemExit("provide at least one --eval spec or use --eval-file")

    evals: list[dict[str, str]] = []
    if args.eval_file:
        evals.extend(
            load_eval_file(
                Path(args.eval_file).expanduser().resolve(),
                case_filters=set(args.cases) if args.cases else None,
            )
        )
    if args.evals:
        evals.extend(parse_eval_specs(args.evals))

    iteration_dir = seed_workspace(
        skill_name=args.skill_name,
        workspace_root=Path(args.workspace_root).expanduser().resolve(),
        iteration=args.iteration,
        evals=evals,
        source_eval_file=Path(args.eval_file).expanduser().resolve() if args.eval_file else None,
        source_cases=args.cases,
        reuse_latest=args.reuse_latest,
    )

    print(iteration_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
