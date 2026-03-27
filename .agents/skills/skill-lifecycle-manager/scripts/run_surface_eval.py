#!/usr/bin/env python3
"""Run eval prompts directly through Codex CLI or Claude Code CLI and save artifacts."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from contextlib import nullcontext
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from projection_support import find_ancestor_with_markers
from seed_eval_workspace import load_eval_file, seed_workspace


SURFACES = ("codex", "claude-code")
TIMEOUT_EXIT_CODE = 124


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def ensure_command_exists(command: str) -> None:
    if shutil.which(command) is None:
        raise FileNotFoundError(f"required command not found on PATH: {command}")


def read_manifest(iteration_dir: Path) -> dict:
    return json.loads((iteration_dir / "manifest.json").read_text(encoding="utf8"))


def selected_evals(manifest: dict, case_filters: set[str] | None = None) -> list[dict]:
    evals = manifest.get("evals", [])
    if not case_filters:
        return evals
    chosen = [
        entry
        for entry in evals
        if entry.get("id") in case_filters or entry.get("label") in case_filters
    ]
    missing = sorted(
        case
        for case in case_filters
        if case not in {entry.get("id") for entry in chosen}
        and case not in {entry.get("label") for entry in chosen}
    )
    if missing:
        raise ValueError(f"unknown case id(s): {', '.join(missing)}")
    return chosen


def build_command(surface: str, workdir: Path, prompt: str, response_path: Path, effort: str | None) -> list[str]:
    if surface == "codex":
        ensure_command_exists("codex")
        command = [
            "codex",
            "exec",
            "-C",
            str(workdir),
            "--skip-git-repo-check",
            "--sandbox",
            "workspace-write",
            "--color",
            "never",
            "-o",
            str(response_path),
        ]
        if effort:
            command.extend(["-c", f'model_reasoning_effort="{effort}"'])
        command.append(prompt)
        return command

    if surface == "claude-code":
        ensure_command_exists("claude")
        command = [
            "claude",
            "-p",
            "--output-format",
            "text",
            "--permission-mode",
            "acceptEdits",
        ]
        if effort:
            command.extend(["--effort", effort])
        command.append(prompt)
        return command

    raise ValueError(f"unsupported surface: {surface}")


def _coerce_stream_text(value: str | bytes | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf8", errors="replace")
    return value


def _surface_project_root(surface: str, workdir: Path) -> Path:
    marker_sets = {
        "codex": (".agents", ".git", "categories.json"),
        "claude-code": (".claude", ".git", "categories.json"),
    }
    markers = marker_sets.get(surface, (".git", "categories.json"))
    return find_ancestor_with_markers(workdir, markers) or workdir


def _surface_projection_path(surface: str, project_root: Path, skill_name: str) -> Path:
    if surface == "codex":
        return project_root / ".agents" / "skills" / skill_name
    if surface == "claude-code":
        return project_root / ".claude" / "skills" / skill_name
    raise ValueError(f"unsupported surface: {surface}")


class ProjectionBaselineGuard:
    """Temporarily hide a project-local skill projection during a baseline run."""

    def __init__(self, surface: str, project_root: Path, skill_name: str) -> None:
        self.surface = surface
        self.project_root = project_root
        self.skill_name = skill_name
        self.original_path = _surface_projection_path(surface, project_root, skill_name)
        self.disabled_path: Path | None = None
        self.mode = "no-project-projection-found"

    def __enter__(self) -> dict[str, Any]:
        if not self.original_path.exists():
            return {
                "mode": self.mode,
                "originalPath": str(self.original_path),
                "disabledPath": None,
            }

        hidden_parent = Path(
            tempfile.mkdtemp(
                dir=str(self.original_path.parent),
                prefix=f".{self.skill_name}.baseline-",
            )
        )
        hidden_parent.rmdir()
        self.disabled_path = hidden_parent
        self.original_path.rename(self.disabled_path)
        self.mode = "project-projection-disabled"
        return {
            "mode": self.mode,
            "originalPath": str(self.original_path),
            "disabledPath": str(self.disabled_path),
        }

    def __exit__(self, exc_type, exc, exc_tb) -> bool:
        if self.disabled_path and self.disabled_path.exists():
            if self.original_path.exists():
                shutil.rmtree(self.original_path)
            self.disabled_path.rename(self.original_path)
        return False


def _write_result(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf8")


def _ensure_response_file(surface: str, response_path: Path, stdout_text: str) -> None:
    if surface == "claude-code":
        response_path.write_text(stdout_text, encoding="utf8")
    elif not response_path.exists():
        response_path.write_text("", encoding="utf8")


def run_case(
    surface: str,
    workdir: Path,
    skill_name: str,
    eval_entry: dict,
    stage: str,
    stage_dir: Path,
    effort: str | None,
    timeout_sec: int,
) -> int:
    stage_dir.mkdir(parents=True, exist_ok=True)
    response_path = stage_dir / "response.md"
    stdout_path = stage_dir / "stdout.log"
    stderr_path = stage_dir / "stderr.log"
    result_path = stage_dir / "result.json"

    prompt = str(eval_entry.get("prompt", "")).strip()
    command = build_command(surface, workdir, prompt, response_path, effort)
    started_at = now_iso()
    project_root = _surface_project_root(surface, workdir)

    guard = (
        ProjectionBaselineGuard(surface, project_root, skill_name)
        if stage == "baseline"
        else nullcontext(None)
    )
    baseline_info: dict[str, Any] | None = None

    try:
        with guard as maybe_baseline:
            if isinstance(maybe_baseline, dict):
                baseline_info = maybe_baseline

            # Both CLIs inherit the working directory from subprocess; Claude Code does
            # not expose a documented --cwd flag, so cwd is the portable source of truth.
            completed = subprocess.run(
                command,
                cwd=str(workdir),
                capture_output=True,
                text=True,
                timeout=timeout_sec,
            )
    except subprocess.TimeoutExpired as exc:
        stdout_text = _coerce_stream_text(exc.stdout)
        stderr_text = _coerce_stream_text(exc.stderr)
        stdout_path.write_text(stdout_text, encoding="utf8")
        stderr_path.write_text(stderr_text, encoding="utf8")
        _ensure_response_file(surface, response_path, stdout_text)

        _write_result(
            result_path,
            {
                "surface": surface,
                "stage": stage,
                "startedAt": started_at,
                "finishedAt": now_iso(),
                "timedOut": True,
                "timeoutSec": timeout_sec,
                "workdir": str(workdir),
                "projectRoot": str(project_root),
                "command": command,
                "evalId": eval_entry.get("id"),
                "label": eval_entry.get("label"),
                "successCriteria": eval_entry.get("successCriteria", ""),
                "responsePath": str(response_path),
                "stdoutPath": str(stdout_path),
                "stderrPath": str(stderr_path),
                "exitCode": TIMEOUT_EXIT_CODE,
                "error": f"process timed out after {timeout_sec} seconds",
                "baseline": baseline_info,
            },
        )
        return TIMEOUT_EXIT_CODE

    stdout_path.write_text(completed.stdout, encoding="utf8")
    stderr_path.write_text(completed.stderr, encoding="utf8")
    _ensure_response_file(surface, response_path, completed.stdout)

    _write_result(
        result_path,
        {
            "surface": surface,
            "stage": stage,
            "startedAt": started_at,
            "finishedAt": now_iso(),
            "timedOut": False,
            "timeoutSec": timeout_sec,
            "workdir": str(workdir),
            "projectRoot": str(project_root),
            "command": command,
            "evalId": eval_entry.get("id"),
            "label": eval_entry.get("label"),
            "successCriteria": eval_entry.get("successCriteria", ""),
            "responsePath": str(response_path),
            "stdoutPath": str(stdout_path),
            "stderrPath": str(stderr_path),
            "exitCode": completed.returncode,
            "baseline": baseline_info,
        },
    )
    return completed.returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="Run eval prompts directly through Codex or Claude Code CLI.")
    parser.add_argument("surface", choices=SURFACES, help="Execution surface")
    parser.add_argument("skill_name", help="Skill name used for workspace naming")
    parser.add_argument("--eval-file", required=True, help="Eval JSON file")
    parser.add_argument("--workspace-root", default="workspaces", help="Workspace root (default: workspaces)")
    parser.add_argument("--iteration", type=int, help="Reuse or create a specific iteration number")
    parser.add_argument(
        "--new-iteration",
        action="store_true",
        help="Force a new iteration when --iteration is omitted. By default the runner reuses the latest iteration for the skill.",
    )
    parser.add_argument("--case", dest="cases", action="append", default=[], help="Optional case id/name filter")
    parser.add_argument("--workdir", default=".", help="Working directory to run the CLI from")
    parser.add_argument(
        "--stage",
        default="with-skill",
        choices=["with-skill", "baseline"],
        help=(
            "Workspace stage bucket to store outputs in. "
            "The baseline stage temporarily hides the project-local projection for the current surface when present."
        ),
    )
    parser.add_argument("--effort", choices=["low", "medium", "high", "max"], help="Optional reasoning/effort hint")
    parser.add_argument("--timeout-sec", type=int, default=900, help="Per-case timeout in seconds (default: 900)")
    args = parser.parse_args()

    evals = load_eval_file(
        Path(args.eval_file).expanduser().resolve(),
        case_filters=set(args.cases) if args.cases else None,
    )
    workspace_root = Path(args.workspace_root).expanduser().resolve()
    iteration_dir = seed_workspace(
        skill_name=args.skill_name,
        workspace_root=workspace_root,
        iteration=args.iteration,
        evals=evals,
        source_eval_file=Path(args.eval_file).expanduser().resolve(),
        source_cases=args.cases,
        reuse_latest=args.iteration is None and not args.new_iteration,
    )
    manifest = read_manifest(iteration_dir)
    workdir = Path(args.workdir).expanduser().resolve()

    exit_code = 0
    for eval_entry in selected_evals(manifest, case_filters=set(args.cases) if args.cases else None):
        case_dir = iteration_dir / "evals" / str(eval_entry["id"]) / args.stage / args.surface
        case_exit = run_case(
            surface=args.surface,
            workdir=workdir,
            skill_name=args.skill_name,
            eval_entry=eval_entry,
            stage=args.stage,
            stage_dir=case_dir,
            effort=args.effort,
            timeout_sec=args.timeout_sec,
        )
        print(f"{args.surface} {eval_entry['id']} [{args.stage}]: exit {case_exit}")
        if case_exit != 0:
            exit_code = 1

    print(iteration_dir)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
