# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Clarified that `run_unit_tests.py` is canonical-only for `skill-lifecycle-manager` and updated the packaged test runner to fail with an explicit self-validation message when projected runtime copies omit `tests/`.
- Rewrote `eval-10` to describe a generic cross-package private-runtime dependency defect instead of hardcoding a repo state that could quickly go stale.
- Added projection and eval-fixture regression coverage so runtime-surface docs and package-boundary cases stay aligned with the current package behavior.

## [0.7.0] - 2026-03-28

### Added
- Added explicit package-boundary guidance so installable skills may reference other skills conceptually but must not depend on another skill package's private script paths.
- Added eval coverage for self-contained installability so install/publish work now treats cross-skill private script dependencies as packaging defects that must be fixed before projection or install completes.

### Changed
- Removed the agent-specific validation and audit scripts from `skill-lifecycle-manager` so the package stays skills-only and no longer acts as a hidden runtime dependency for `agent-lifecycle-manager`.
- Tightened the main workflow so the Discover-first gate is defined once in `Router First`, with later phases pointing back to that authority instead of restating the same gate criteria.
- Expanded the install/publish and audit guidance to treat cross-package private runtime dependencies as portability issues, not acceptable authoring shortcuts.

## [0.6.0] - 2026-03-28

### Changed
- Added a Discover-first gate for broad new-skill requests so general-purpose, domain-agnostic, comparison-heavy, or overlap-prone skill ideas must route through Discover before any package drafting starts.
- Tightened the main workflow and lifecycle-mode reference so unresolved discovery depth, candidate confirmation, and separate research handoff checkpoints block `Create / Update` instead of being treated as optional follow-up work.
- Expanded the failure-pattern and example-prompt guidance to explicitly call out the regression where a nearby local skill is mistaken for sufficient research on a broad new skill.

### Added
- Added eval coverage for broad new-skill routing so the suite now checks that a project-generic documentation-skill request stops at the discovery-depth gate instead of jumping straight into authoring.
- Added a posture-suite regression case ensuring broad reusable skill requests can still route to the lifecycle manager while staying `manual-first` and Discover-first.
- Added regression coverage for the bounded-scope exception and the "depth already specified" path so the new Discover-first gate is exercised on both its blocking and non-blocking branches.

## [0.5.3] - 2026-03-28

### Changed
- Taught projection support to rewrite projected `skill.json` entrypoints so platform-excluded files like `CHANGELOG.md` do not remain advertised on runtime surfaces.
- Hardened projection validation so a projected `skill.json` now fails when it points at a file that does not exist on that surface.
- Added regression tests covering entrypoint filtering and missing projected entrypoint detection.

## [0.5.2] - 2026-03-28

### Changed
- Hardened eval workspace seeding so concurrent `--new-iteration` runs reserve iteration directories atomically instead of racing onto the same manifest.
- Taught workspace seeding to merge existing manifests when reusing an iteration, which preserves earlier cases instead of overwriting them.
- Added regression tests covering occupied-iteration retry behavior and manifest merging for reused iterations.

## [0.5.1] - 2026-03-28

### Changed
- Taught `scripts/quick_validate.py` and `scripts/audit_skill_inventory.py` to recognize additional negative-boundary headings such as `When Not to Activate` and `Do Not Activate`, reducing false positives for otherwise well-bounded skills.
- Added regression tests covering the alternate negative-boundary heading variants so validation and audit behavior stay aligned.

## [0.5.0] - 2026-03-27

### Added
- Added a delegated-research regression case to `eval/eval-cases.json` so the suite now checks that deep Discover work can stop at candidate inventory instead of jumping straight into authoring.
- Added `scripts/run_unit_tests.py` as a stable `uv run --with pytest ...` entrypoint for the skill's packaged Python unit tests.
- Added unit coverage for the new test-runner wrapper so the default and forwarded pytest argument paths stay exercised.

### Changed
- Synchronized `skill.json` description wording with the richer frontmatter boundary so generated metadata now matches the canonical skill trigger text.
- Tightened the Discover-stage protocol so delegated specialist workflows inherit their own mandatory checkpoints and handoff semantics before downstream stages resume.
- Updated the lifecycle-mode reference and eval documentation to make the delegated research pause semantics explicit.
- Tightened `skill.json` requirements so only the common lifecycle tools (`git`, `uv`) are declared as baseline dependencies; direct Codex and Claude CLIs are now documented as phase-specific needs for surface evals instead of hard prerequisites for every stage.
- Expanded the Validate workflow and eval README so packaged unit tests are part of the documented validation path when projection, validation, or eval-runner code changes.
- Wired the packaged Python unit tests into the repository `npm test` path and updated CI to install `uv` before running shared validation.

## [0.4.1] - 2026-03-27

### Added
- Added two non-meta eval cases to `eval/eval-cases.json` so the suite now covers ordinary utility/content skills in addition to `skill-lifecycle-manager` working on itself.

### Changed
- Made the command examples projection-safe by introducing an `SLM_DIR` command-path model and explicit guidance for canonical versus projected copies.
- Clarified that the documented workflow has 9 phases wrapped around 7 routed lifecycle stages, so readers do not have to infer the mapping themselves.
- Improved `quick_validate.py` frontmatter handling by preferring a real YAML parser when available and documenting the fallback parser's limits.
- Updated the docs to explain that eval fixtures stay canonical/author-only even when scripts are projected into runtime surfaces.

## [0.4.0] - 2026-03-27

### Added
- Added explicit invocation-posture guidance for `manual-first`, `hybrid`, and `auto-first` skill designs.
- Added a dedicated posture-aware trigger suite under `eval/trigger-posture-cases.json`.
- Added focused Python unit tests covering projection-root inference, eval-runner baseline behavior, timeout artifacts, and audit/validation helpers.

### Changed
- Updated the main lifecycle workflow so posture is decided before writing or optimizing a description.
- Updated evaluation guidance so trigger testing depends on whether the target skill should be called explicitly or trigger automatically.
- Updated eval documentation so the lighter posture-aware routing suite is easy to seed, run, and review.
- Updated the posture-aware suite and references to treat overlap-check recommendations and a conservative `hybrid` answer as acceptable in a few explicitly marked boundary cases.
- Hardened the review panel so dynamic case/assertion content is rendered through DOM text nodes instead of interpolated HTML.
- Aligned both eval suite files on the same normalized scoring schema and taught the eval validator to check scoring metadata.
- Hardened `run_surface_eval.py` so `baseline` runs temporarily hide the project-local projection for the active surface and timeout failures still write structured artifacts.
- Tightened projection root inference so project-scope projection commands now fail explicitly instead of silently guessing the wrong root.
- Updated `projection.json` so both `eval/` and `tests/` stay out of runtime projections.
- Expanded `audit_skill_inventory.py` from a basic structure scan into a severity-ranked audit that also checks trigger quality, reference hygiene, readiness signals, projection health, and projection-weight context cost.
- Removed the `sys.path` mutation from the inventory audit script.

## [0.3.0] - 2026-03-27

### Changed
- Shortened the frontmatter and `skill.json` descriptions to prefer precision over recall.
- Reframed the trigger boundary around explicitly skill-focused requests instead of trying to enumerate every possible user verb.
- Added a stronger negative boundary excluding general code tasks and agent-management requests.

## [0.2.0] - 2026-03-27

### Added
- Added platform references for shared core vs platform-specific behavior and for canonical-to-projection workflow.
- Added projection helper scripts to generate and validate Codex and Claude Code skill surfaces.
- Added a structured cross-platform eval suite under `eval/` plus `seed_eval_workspace.py --eval-file` support.
- Added `validate_eval_suite.py` to check eval fixtures before seeding or running them.
- Added `run_surface_eval.py` so eval prompts can be run directly through local `codex` and `claude` CLIs instead of a separate API harness.
- Added `projection.json` support so skills can exclude author-only roots like `eval/` from platform projections without hand-editing projected copies.
- Added `render_review_panel.py` to generate a lightweight static review panel for scoring assertions, taking notes, and exporting review JSON.

### Changed
- Expanded the install/publish stage to explicitly cover projection generation and validation before distribution.
- Made projection writes and local installs replace skill directories atomically instead of deleting the destination first and then copying files back piecemeal.
- Updated eval workspace manifests to record source suite metadata and let the direct CLI runner reuse the latest iteration by default.
- Updated `init_skill.py` so scaffold dates are dynamic, default authors come from the environment when available, and default tags are derived from the skill name plus categories.

## [0.1.0] - 2026-03-27

### Added
- Initial release of `skill-lifecycle-manager` as a thin router across seven lifecycle stages: Discover, Create/Update, Validate, Evaluate, Optimize Trigger, Install/Publish, and Audit/Governance.
- Explicit delegation guidance tying deep discovery to `skill-researcher` instead of duplicating ecosystem research inline.
- Combined OpenAI-style authoring structure with Anthropic-style evaluation and trigger optimization guidance.
- Added `references/lifecycle-modes.md` for stage routing and depth selection.
- Added `references/evaluation-loop.md` for Anthropic-style iteration planning and trigger-only passes.
- Added `references/audit-rubric.md` for library-health audits and issue prioritization.
- Added helper scripts for repo-compatible scaffolding, single-skill validation, eval workspace seeding, and inventory auditing.
