# Rollback

If this hardening pass needs to be reverted:

1. Revert the canonical changes under `skills/skill-lifecycle-manager/`.
2. Revert the projected copies under `.agents/skills/skill-lifecycle-manager/` and `.claude/skills/skill-lifecycle-manager/`.
3. Remove the new test files under `skills/skill-lifecycle-manager/tests/` if they were added only for this pass.
4. Run `npm run build` to restore generated catalog/index artifacts.
5. Run `npm test` to confirm the repository returns to a clean validation state.
