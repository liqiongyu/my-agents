#!/usr/bin/env python3
"""Render a lightweight static HTML review panel for a skill eval iteration."""

from __future__ import annotations

import argparse
import html
import json
from datetime import datetime, timezone
from pathlib import Path

from seed_eval_workspace import slugify


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_text_if_exists(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf8")


def read_json_if_exists(path: Path) -> dict | list | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf8"))


def load_manifest(iteration_dir: Path) -> dict:
    manifest_path = iteration_dir / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"missing manifest: {manifest_path}")
    return json.loads(manifest_path.read_text(encoding="utf8"))


def load_case_metadata(source_eval_file: Path | None) -> dict[str, dict]:
    if source_eval_file is None or not source_eval_file.exists():
        return {}

    payload = json.loads(source_eval_file.read_text(encoding="utf8"))
    cases = payload.get("cases")
    if not isinstance(cases, list):
        return {}

    metadata: dict[str, dict] = {}
    definitions = payload.get("assertion_definitions", {})
    for case in cases:
        case_id = str(case.get("id") or case.get("name") or "").strip()
        if not case_id:
            continue
        key = slugify(case_id)
        raw_assertions = case.get("assertions", {})
        assertions: list[dict[str, str]] = []
        if isinstance(raw_assertions, dict):
            for name, value in raw_assertions.items():
                if not isinstance(name, str):
                    continue
                check = ""
                if isinstance(value, dict):
                    check = str(value.get("check", "")).strip()
                assertions.append(
                    {
                        "name": name,
                        "definition": str(definitions.get(name, "")).strip(),
                        "check": check,
                    }
                )
        metadata[key] = {
            "id": key,
            "name": str(case.get("name", "")).strip(),
            "description": str(case.get("description", "")).strip(),
            "prompt": str(case.get("prompt", "")).strip(),
            "mode": str(case.get("mode", "")).strip(),
            "category": str(case.get("category", "")).strip(),
            "expectedVerdict": str(case.get("expected_trigger", "")).strip(),
            "expectedPosture": str(case.get("expected_posture", "")).strip(),
            "expectedStages": case.get("expected_stages", []),
            "assertions": assertions,
        }
    return metadata


def collect_stage(stage_dir: Path) -> dict:
    template = read_json_if_exists(stage_dir / "run-template.json")
    surfaces: list[dict] = []
    for child in sorted(stage_dir.iterdir()) if stage_dir.exists() else []:
        if not child.is_dir():
            continue
        result = read_json_if_exists(child / "result.json") or {}
        surfaces.append(
            {
                "name": child.name,
                "result": result,
                "response": read_text_if_exists(child / "response.md"),
                "stdout": read_text_if_exists(child / "stdout.log"),
                "stderr": read_text_if_exists(child / "stderr.log"),
            }
        )
    return {
        "name": stage_dir.name,
        "template": template,
        "surfaces": surfaces,
    }


def build_bundle(iteration_dir: Path) -> dict:
    manifest = load_manifest(iteration_dir)
    source_eval_file = manifest.get("sourceEvalFile")
    source_eval_path = Path(source_eval_file).expanduser().resolve() if source_eval_file else None
    metadata_by_id = load_case_metadata(source_eval_path)

    cases: list[dict] = []
    evals_dir = iteration_dir / "evals"
    for eval_entry in manifest.get("evals", []):
        eval_id = str(eval_entry.get("id", "")).strip()
        if not eval_id:
            continue
        case_dir = evals_dir / eval_id
        stages: list[dict] = []

        desired_stage_names = [str(stage) for stage in manifest.get("stages", [])]
        actual_stage_names = [
            child.name
            for child in sorted(case_dir.iterdir()) if case_dir.exists()
            if child.is_dir()
        ]
        stage_names = list(dict.fromkeys([*desired_stage_names, *actual_stage_names]))
        for stage_name in stage_names:
            stage_dir = case_dir / stage_name
            if stage_dir.exists():
                stages.append(collect_stage(stage_dir))

        meta = metadata_by_id.get(eval_id, {})
        cases.append(
            {
                "id": eval_id,
                "label": str(eval_entry.get("label", eval_id)).strip(),
                "prompt": str(eval_entry.get("prompt", "")).strip(),
                "successCriteria": str(eval_entry.get("successCriteria", "")).strip(),
                "description": str(meta.get("description", "")).strip(),
                "mode": str(meta.get("mode", "")).strip(),
                "category": str(meta.get("category", "")).strip(),
                "expectedVerdict": str(meta.get("expectedVerdict", "")).strip(),
                "expectedPosture": str(meta.get("expectedPosture", "")).strip(),
                "expectedStages": meta.get("expectedStages", []),
                "assertions": meta.get("assertions", []),
                "stages": stages,
            }
        )

    return {
        "skill": str(manifest.get("skill", "")).strip(),
        "iteration": manifest.get("iteration"),
        "generatedAt": now_iso(),
        "workspaceGeneratedAt": manifest.get("generatedAt"),
        "sourceEvalFile": str(source_eval_path) if source_eval_path else None,
        "sourceCases": manifest.get("sourceCases", []),
        "cases": cases,
    }


def build_initial_review(bundle: dict) -> dict:
    review_cases: list[dict] = []
    for case in bundle["cases"]:
        case_entry = {
            "id": case["id"],
            "stages": [],
        }
        for stage in case.get("stages", []):
            stage_entry = {
                "name": stage["name"],
                "surfaces": [],
            }
            for surface in stage.get("surfaces", []):
                stage_entry["surfaces"].append(
                    {
                        "name": surface["name"],
                        "assertions": {item["name"]: None for item in case.get("assertions", [])},
                        "notes": "",
                    }
                )
            case_entry["stages"].append(stage_entry)
        review_cases.append(case_entry)

    return {
        "skill": bundle["skill"],
        "iteration": bundle["iteration"],
        "generatedAt": bundle["generatedAt"],
        "reviewedAt": None,
        "cases": review_cases,
    }


def build_html(bundle: dict, initial_review: dict, title: str) -> str:
    bundle_json = json.dumps(bundle, ensure_ascii=False).replace("</", "<\\/")
    review_json = json.dumps(initial_review, ensure_ascii=False).replace("</", "<\\/")
    escaped_title = html.escape(title)
    escaped_heading = html.escape(f"{bundle['skill']} Review Panel")

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escaped_title}</title>
  <style>
    :root {{
      --bg: #f7f3ea;
      --panel: #fffdfa;
      --panel-2: #f1eadf;
      --line: #d8cdbf;
      --text: #1f1b16;
      --muted: #6b6258;
      --accent: #205c4d;
      --accent-soft: #d7ebe4;
      --pass: #2f855a;
      --partial: #b7791f;
      --fail: #c53030;
      --unset: #8b8276;
      --shadow: 0 18px 40px rgba(55, 42, 24, 0.08);
      --radius: 18px;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(32, 92, 77, 0.08), transparent 28%),
        radial-gradient(circle at right 15%, rgba(183, 121, 31, 0.10), transparent 25%),
        var(--bg);
    }}
    .shell {{
      display: grid;
      grid-template-columns: 320px 1fr;
      min-height: 100vh;
      gap: 20px;
      padding: 20px;
    }}
    .sidebar, .main {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }}
    .sidebar {{
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 20px;
      height: calc(100vh - 40px);
      overflow: auto;
    }}
    .main {{
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }}
    h1, h2, h3, h4 {{
      margin: 0;
      font-family: "Iowan Old Style", "Georgia", serif;
      font-weight: 700;
      letter-spacing: 0.01em;
    }}
    p {{
      margin: 0;
      line-height: 1.6;
    }}
    .eyebrow {{
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }}
    .summary-card {{
      padding: 16px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(32, 92, 77, 0.09), rgba(255, 253, 250, 0.95));
      border: 1px solid rgba(32, 92, 77, 0.15);
    }}
    .case-list {{
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}
    .case-button {{
      width: 100%;
      text-align: left;
      padding: 14px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: var(--panel);
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
    }}
    .case-button:hover {{
      transform: translateY(-1px);
      border-color: rgba(32, 92, 77, 0.5);
    }}
    .case-button.active {{
      background: var(--accent-soft);
      border-color: rgba(32, 92, 77, 0.65);
    }}
    .case-meta {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }}
    .pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--panel-2);
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
    }}
    .toolbar {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }}
    .toolbar-actions {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }}
    button, .button-like {{
      border: 1px solid rgba(32, 92, 77, 0.28);
      background: white;
      color: var(--text);
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      font: inherit;
    }}
    button.primary {{
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }}
    .section {{
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
      background: rgba(255, 253, 250, 0.85);
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }}
    .meta-card {{
      padding: 14px;
      border-radius: 14px;
      background: var(--panel-2);
      border: 1px solid rgba(107, 98, 88, 0.12);
    }}
    .tab-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }}
    .tab {{
      border-radius: 999px;
      border: 1px solid var(--line);
      background: white;
      padding: 8px 12px;
      cursor: pointer;
    }}
    .tab.active {{
      background: var(--accent-soft);
      border-color: rgba(32, 92, 77, 0.65);
      color: var(--accent);
    }}
    .assertion-list {{
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}
    .assertion {{
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      background: white;
    }}
    .assertion header {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: start;
      margin-bottom: 8px;
    }}
    .score-row {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }}
    .score-button {{
      min-width: 72px;
    }}
    .score-button.active[data-score="pass"] {{
      background: rgba(47, 133, 90, 0.12);
      border-color: rgba(47, 133, 90, 0.55);
      color: var(--pass);
    }}
    .score-button.active[data-score="partial"] {{
      background: rgba(183, 121, 31, 0.12);
      border-color: rgba(183, 121, 31, 0.55);
      color: var(--partial);
    }}
    .score-button.active[data-score="fail"] {{
      background: rgba(197, 48, 48, 0.12);
      border-color: rgba(197, 48, 48, 0.55);
      color: var(--fail);
    }}
    .score-button.active[data-score="unset"] {{
      background: rgba(107, 98, 88, 0.10);
      border-color: rgba(107, 98, 88, 0.35);
      color: var(--unset);
    }}
    textarea {{
      width: 100%;
      min-height: 140px;
      resize: vertical;
      border-radius: 14px;
      border: 1px solid var(--line);
      padding: 14px;
      font: inherit;
      background: white;
      color: var(--text);
    }}
    .viewer-tabs {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }}
    .viewer-panel {{
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #171512;
      color: #f8f4ed;
      padding: 16px;
      min-height: 280px;
      overflow: auto;
      white-space: pre-wrap;
      font-family: "SFMono-Regular", "IBM Plex Mono", monospace;
      line-height: 1.55;
    }}
    .empty {{
      padding: 20px;
      border-radius: 14px;
      background: var(--panel-2);
      color: var(--muted);
    }}
    .footer-note {{
      color: var(--muted);
      font-size: 13px;
    }}
    @media (max-width: 980px) {{
      .shell {{
        grid-template-columns: 1fr;
      }}
      .sidebar {{
        position: static;
        height: auto;
      }}
    }}
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="summary-card">
        <div class="eyebrow">Review Artifact</div>
        <h1>{escaped_heading}</h1>
        <p id="workspace-summary"></p>
      </div>

      <div>
        <div class="eyebrow">Cases</div>
        <div id="case-list" class="case-list"></div>
      </div>

      <div class="section">
        <div class="eyebrow">Quick Stats</div>
        <div class="meta-grid" id="quick-stats"></div>
      </div>
    </aside>

    <main class="main">
      <div class="toolbar">
        <div>
          <div class="eyebrow">Current Selection</div>
          <h2 id="selection-title"></h2>
        </div>
        <div class="toolbar-actions">
          <label class="button-like">
            Import Review JSON
            <input id="import-review" type="file" accept="application/json" hidden />
          </label>
          <button id="reset-surface">Reset Surface</button>
          <button id="export-review" class="primary">Export Review JSON</button>
        </div>
      </div>

      <section class="section">
        <div class="meta-grid">
          <div class="meta-card">
            <div class="eyebrow">Prompt</div>
            <p id="case-prompt"></p>
          </div>
          <div class="meta-card">
            <div class="eyebrow">Success Criteria</div>
            <p id="case-success"></p>
          </div>
          <div class="meta-card">
            <div class="eyebrow">Description</div>
            <p id="case-description"></p>
          </div>
          <div class="meta-card">
            <div class="eyebrow">Expected Stages</div>
            <p id="case-stages"></p>
          </div>
          <div class="meta-card">
            <div class="eyebrow">Expected Verdict</div>
            <p id="case-verdict"></p>
          </div>
          <div class="meta-card">
            <div class="eyebrow">Expected Posture</div>
            <p id="case-posture"></p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="eyebrow">Stage</div>
        <div class="tab-row" id="stage-tabs"></div>
      </section>

      <section class="section">
        <div class="eyebrow">Surface</div>
        <div class="tab-row" id="surface-tabs"></div>
      </section>

      <section class="section">
        <div class="toolbar">
          <div>
            <div class="eyebrow">Assertions</div>
            <h3>Score This Surface</h3>
          </div>
          <div class="pill" id="score-summary"></div>
        </div>
        <div id="assertion-list" class="assertion-list"></div>
      </section>

      <section class="section">
        <div class="eyebrow">Reviewer Notes</div>
        <textarea id="review-notes" placeholder="Capture what held up, what broke, and what you want to do next."></textarea>
      </section>

      <section class="section">
        <div class="toolbar">
          <div>
            <div class="eyebrow">Artifacts</div>
            <h3>Run Output</h3>
          </div>
          <div class="pill" id="run-summary"></div>
        </div>
        <div class="viewer-tabs" id="viewer-tabs"></div>
        <div class="viewer-panel" id="viewer-panel"></div>
      </section>

      <p class="footer-note">
        This panel is self-contained. It stores draft scoring in local browser storage for this iteration and lets you export a portable review JSON when ready.
      </p>
    </main>
  </div>

  <script id="review-data" type="application/json">{bundle_json}</script>
  <script id="initial-review" type="application/json">{review_json}</script>
  <script>
    const REVIEW_DATA = JSON.parse(document.getElementById("review-data").textContent);
    const INITIAL_REVIEW = JSON.parse(document.getElementById("initial-review").textContent);
    const STORAGE_KEY = `slm-review::${{REVIEW_DATA.skill}}::${{REVIEW_DATA.iteration}}`;

    let reviewState = loadReviewState();
    let currentCaseId = REVIEW_DATA.cases[0]?.id ?? null;
    let currentStage = REVIEW_DATA.cases[0]?.stages[0]?.name ?? null;
    let currentSurface = REVIEW_DATA.cases[0]?.stages[0]?.surfaces[0]?.name ?? null;
    let currentViewerTab = "response";

    function loadReviewState() {{
      try {{
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {{
          return structuredClone(INITIAL_REVIEW);
        }}
        return JSON.parse(saved);
      }} catch {{
        return structuredClone(INITIAL_REVIEW);
      }}
    }}

    function persistReviewState() {{
      reviewState.reviewedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewState));
    }}

    function getCase(caseId) {{
      return REVIEW_DATA.cases.find((item) => item.id === caseId) ?? null;
    }}

    function getStage(caseObj, stageName) {{
      return caseObj?.stages.find((item) => item.name === stageName) ?? null;
    }}

    function getSurface(stageObj, surfaceName) {{
      return stageObj?.surfaces.find((item) => item.name === surfaceName) ?? null;
    }}

    function ensureSelection() {{
      const caseObj = getCase(currentCaseId);
      if (!caseObj) {{
        currentCaseId = REVIEW_DATA.cases[0]?.id ?? null;
      }}
      const refreshedCase = getCase(currentCaseId);
      const fallbackStage = refreshedCase?.stages[0]?.name ?? null;
      if (!getStage(refreshedCase, currentStage)) {{
        currentStage = fallbackStage;
      }}
      const refreshedStage = getStage(refreshedCase, currentStage);
      const fallbackSurface = refreshedStage?.surfaces[0]?.name ?? null;
      if (!getSurface(refreshedStage, currentSurface)) {{
        currentSurface = fallbackSurface;
      }}
    }}

    function reviewEntry(caseId, stageName, surfaceName) {{
      const caseEntry = reviewState.cases.find((item) => item.id === caseId);
      if (!caseEntry) return null;
      const stageEntry = caseEntry.stages.find((item) => item.name === stageName);
      if (!stageEntry) return null;
      return stageEntry.surfaces.find((item) => item.name === surfaceName) ?? null;
    }}

    function scoreCounts(entry) {{
      const counts = {{ pass: 0, partial: 0, fail: 0, unset: 0 }};
      if (!entry) return counts;
      for (const value of Object.values(entry.assertions ?? {{}})) {{
        if (value === "pass" || value === "partial" || value === "fail") {{
          counts[value] += 1;
        }} else {{
          counts.unset += 1;
        }}
      }}
      return counts;
    }}

    function setAssertionScore(assertionName, value) {{
      const entry = reviewEntry(currentCaseId, currentStage, currentSurface);
      if (!entry) return;
      entry.assertions[assertionName] = value === "unset" ? null : value;
      persistReviewState();
      render();
    }}

    function setNotes(value) {{
      const entry = reviewEntry(currentCaseId, currentStage, currentSurface);
      if (!entry) return;
      entry.notes = value;
      persistReviewState();
    }}

    function resetCurrentSurface() {{
      const entry = reviewEntry(currentCaseId, currentStage, currentSurface);
      if (!entry) return;
      for (const key of Object.keys(entry.assertions)) {{
        entry.assertions[key] = null;
      }}
      entry.notes = "";
      persistReviewState();
      render();
    }}

    function renderCaseList() {{
      const root = document.getElementById("case-list");
      root.innerHTML = "";
      for (const caseObj of REVIEW_DATA.cases) {{
        const button = document.createElement("button");
        button.className = `case-button${{caseObj.id === currentCaseId ? " active" : ""}}`;
        button.onclick = () => {{
          currentCaseId = caseObj.id;
          currentStage = caseObj.stages[0]?.name ?? null;
          currentSurface = caseObj.stages[0]?.surfaces[0]?.name ?? null;
          currentViewerTab = "response";
          render();
        }};

        const entry = reviewEntry(
          caseObj.id,
          caseObj.stages[0]?.name ?? "",
          caseObj.stages[0]?.surfaces[0]?.name ?? ""
        );
        const counts = scoreCounts(entry);

        const meta = document.createElement("div");
        meta.className = "case-meta";

        const strong = document.createElement("strong");
        strong.textContent = caseObj.id;
        meta.appendChild(strong);

        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = `${{counts.pass}} pass / ${{counts.unset}} open`;
        meta.appendChild(pill);

        const label = document.createElement("div");
        label.textContent = caseObj.label;

        button.appendChild(meta);
        button.appendChild(label);
        root.appendChild(button);
      }}
    }}

    function renderQuickStats() {{
      const root = document.getElementById("quick-stats");
      const totalCases = REVIEW_DATA.cases.length;
      const totalSurfaces = REVIEW_DATA.cases.reduce(
        (sum, caseObj) => sum + caseObj.stages.reduce((inner, stage) => inner + stage.surfaces.length, 0),
        0
      );
      const reviewedSurfaces = reviewState.cases.reduce((sum, caseObj) => {{
        return sum + caseObj.stages.reduce((stageSum, stage) => {{
          return (
            stageSum +
            stage.surfaces.filter((surface) =>
              Object.values(surface.assertions ?? {{}}).some((value) => value === "pass" || value === "partial" || value === "fail")
              || (surface.notes ?? "").trim()
            ).length
          );
        }}, 0);
      }}, 0);

      root.innerHTML = "";
      for (const [label, value] of [
        ["Cases", totalCases],
        ["Surface Runs", totalSurfaces],
        ["Reviewed", reviewedSurfaces],
      ]) {{
        const card = document.createElement("div");
        card.className = "meta-card";

        const eyebrow = document.createElement("div");
        eyebrow.className = "eyebrow";
        eyebrow.textContent = label;

        const valueHeading = document.createElement("h3");
        valueHeading.textContent = String(value);

        card.appendChild(eyebrow);
        card.appendChild(valueHeading);
        root.appendChild(card);
      }}
    }}

    function renderHeader(caseObj) {{
      document.getElementById("workspace-summary").textContent =
        `Iteration ${{REVIEW_DATA.iteration}} • Generated ${{REVIEW_DATA.generatedAt}}`;
      document.getElementById("selection-title").textContent = caseObj?.label ?? "No case selected";
      document.getElementById("case-prompt").textContent = caseObj?.prompt ?? "";
      document.getElementById("case-success").textContent = caseObj?.successCriteria ?? "";
      document.getElementById("case-description").textContent = caseObj?.description || "No extra case description recorded.";
      document.getElementById("case-stages").textContent =
        (caseObj?.expectedStages ?? []).join(" -> ") || "No expected stage metadata";
      document.getElementById("case-verdict").textContent =
        caseObj?.expectedVerdict || "No explicit verdict metadata";
      document.getElementById("case-posture").textContent =
        caseObj?.expectedPosture || "No explicit posture metadata";
    }}

    function renderTabs(caseObj) {{
      const stageRoot = document.getElementById("stage-tabs");
      stageRoot.innerHTML = "";
      for (const stage of caseObj?.stages ?? []) {{
        const button = document.createElement("button");
        button.className = `tab${{stage.name === currentStage ? " active" : ""}}`;
        button.textContent = stage.name;
        button.onclick = () => {{
          currentStage = stage.name;
          currentSurface = stage.surfaces[0]?.name ?? null;
          currentViewerTab = "response";
          render();
        }};
        stageRoot.appendChild(button);
      }}

      const surfaceRoot = document.getElementById("surface-tabs");
      surfaceRoot.innerHTML = "";
      const stageObj = getStage(caseObj, currentStage);
      for (const surface of stageObj?.surfaces ?? []) {{
        const button = document.createElement("button");
        button.className = `tab${{surface.name === currentSurface ? " active" : ""}}`;
        button.textContent = surface.name;
        button.onclick = () => {{
          currentSurface = surface.name;
          currentViewerTab = "response";
          render();
        }};
        surfaceRoot.appendChild(button);
      }}
    }}

    function renderAssertions(caseObj) {{
      const root = document.getElementById("assertion-list");
      const stageObj = getStage(caseObj, currentStage);
      const surfaceObj = getSurface(stageObj, currentSurface);
      const entry = reviewEntry(caseObj?.id, currentStage, currentSurface);
      const counts = scoreCounts(entry);
      document.getElementById("score-summary").textContent =
        `${{counts.pass}} pass • ${{counts.partial}} partial • ${{counts.fail}} fail • ${{counts.unset}} open`;
      root.innerHTML = "";

      if (!caseObj?.assertions?.length) {{
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No structured assertions were found for this case. Use notes for qualitative review.";
        root.appendChild(empty);
        return;
      }}

      for (const assertion of caseObj.assertions) {{
        const currentValue = entry?.assertions?.[assertion.name] ?? null;
        const card = document.createElement("div");
        card.className = "assertion";

        const header = document.createElement("header");

        const headerCopy = document.createElement("div");

        const strong = document.createElement("strong");
        strong.textContent = assertion.name;
        headerCopy.appendChild(strong);

        const definition = document.createElement("p");
        definition.textContent = assertion.definition || "No shared definition recorded.";
        headerCopy.appendChild(definition);

        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = currentValue ?? "unset";

        header.appendChild(headerCopy);
        header.appendChild(pill);
        card.appendChild(header);

        if (assertion.check) {{
          const check = document.createElement("p");
          check.textContent = assertion.check;
          card.appendChild(check);
        }}

        const scores = document.createElement("div");
        scores.className = "score-row";
        for (const score of ["pass", "partial", "fail", "unset"]) {{
          const button = document.createElement("button");
          button.className = `score-button${{(currentValue ?? "unset") === score ? " active" : ""}}`;
          button.dataset.score = score;
          button.textContent = score;
          button.onclick = () => setAssertionScore(assertion.name, score);
          scores.appendChild(button);
        }}
        card.appendChild(scores);
        root.appendChild(card);
      }}

      document.getElementById("review-notes").value = entry?.notes ?? "";
    }}

    function renderViewer(caseObj) {{
      const stageObj = getStage(caseObj, currentStage);
      const surfaceObj = getSurface(stageObj, currentSurface);
      const viewerTabs = document.getElementById("viewer-tabs");
      const viewerPanel = document.getElementById("viewer-panel");
      const runSummary = document.getElementById("run-summary");

      viewerTabs.innerHTML = "";
      if (!surfaceObj) {{
        viewerPanel.textContent = "No run artifacts for this selection yet.";
        runSummary.textContent = "No artifacts";
        return;
      }}

      const result = surfaceObj.result ?? {{}};
      runSummary.textContent = `exit ${{result.exitCode ?? "?"}}`;
      const views = {{
        response: surfaceObj.response || "No response.md captured.",
        stdout: surfaceObj.stdout || "No stdout.log captured.",
        stderr: surfaceObj.stderr || "No stderr.log captured.",
        result: JSON.stringify(result, null, 2),
      }};

      for (const name of Object.keys(views)) {{
        const button = document.createElement("button");
        button.className = `tab${{name === currentViewerTab ? " active" : ""}}`;
        button.textContent = name;
        button.onclick = () => {{
          currentViewerTab = name;
          renderViewer(caseObj);
        }};
        viewerTabs.appendChild(button);
      }}

      viewerPanel.textContent = views[currentViewerTab] ?? "";
    }}

    function exportReview() {{
      reviewState.reviewedAt = new Date().toISOString();
      const blob = new Blob([JSON.stringify(reviewState, null, 2)], {{ type: "application/json" }});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${{REVIEW_DATA.skill}}-iteration-${{REVIEW_DATA.iteration}}-review.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      persistReviewState();
    }}

    async function importReview(file) {{
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || parsed.skill !== REVIEW_DATA.skill || parsed.iteration !== REVIEW_DATA.iteration) {{
        window.alert("This review JSON does not match the current skill/iteration.");
        return;
      }}
      reviewState = parsed;
      persistReviewState();
      render();
    }}

    function render() {{
      ensureSelection();
      const caseObj = getCase(currentCaseId);
      renderCaseList();
      renderQuickStats();
      renderHeader(caseObj);
      renderTabs(caseObj);
      renderAssertions(caseObj);
      renderViewer(caseObj);
    }}

    document.getElementById("review-notes").addEventListener("input", (event) => {{
      setNotes(event.target.value);
    }});
    document.getElementById("reset-surface").addEventListener("click", resetCurrentSurface);
    document.getElementById("export-review").addEventListener("click", exportReview);
    document.getElementById("import-review").addEventListener("change", (event) => {{
      importReview(event.target.files?.[0]);
    }});

    render();
  </script>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a lightweight static HTML review panel for a skill eval iteration.")
    parser.add_argument("iteration_dir", help="Path to workspaces/<skill>/iteration-<N>")
    parser.add_argument(
        "--output",
        help="Output HTML path. Defaults to <iteration_dir>/review/index.html",
    )
    parser.add_argument(
        "--title",
        help="Optional HTML title. Defaults to '<skill> iteration <N> review panel'.",
    )
    args = parser.parse_args()

    iteration_dir = Path(args.iteration_dir).expanduser().resolve()
    bundle = build_bundle(iteration_dir)
    initial_review = build_initial_review(bundle)

    title = args.title or f"{bundle['skill']} iteration {bundle['iteration']} review panel"
    output_path = (
        Path(args.output).expanduser().resolve()
        if args.output
        else iteration_dir / "review" / "index.html"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_html(bundle, initial_review, title), encoding="utf8")

    template_path = output_path.parent / "review-template.json"
    template_path.write_text(json.dumps(initial_review, indent=2, ensure_ascii=True) + "\n", encoding="utf8")

    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
