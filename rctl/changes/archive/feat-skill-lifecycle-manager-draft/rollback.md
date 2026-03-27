# Rollback

1. Delete `skills/skill-lifecycle-manager/`.
2. Run `npm run build` so generated indexes drop the removed skill.
3. Re-run `npm test` to confirm the repository returns to the prior validation state.
