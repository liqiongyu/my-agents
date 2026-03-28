const path = require("node:path");

const ALL_PLATFORMS = ["claude", "codex"];
const DEFAULT_PROJECT_MANIFEST = "my-agents.project.json";
const PROJECT_SYNC_STATE_PATH = path.join(".my-agents", "project-sync-state.json");

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((error) => `- ${error.instancePath || "/"} ${error.message}`)
    .join("\n");
}

function unique(values) {
  return [...new Set(values ?? [])];
}

function uniqueSorted(values) {
  return unique(values).sort((left, right) => left.localeCompare(right));
}

function difference(previousValues, nextValues) {
  const nextSet = new Set(nextValues ?? []);
  return (previousValues ?? []).filter((value) => !nextSet.has(value));
}

const USAGE = `Usage:
  npx my-agents add <github-url> [options]           Add an external official asset
  npm run install-skill   -- <name> [options]    Install a skill
  npm run install-agent   -- <name> [options]    Install an agent
  npm run install-pack    -- <name> [options]    Install a pack
  npm run sync-project    -- [options]           Sync a project manifest into project scope
  npm run uninstall-skill -- <name> [options]    Uninstall a skill
  npm run uninstall-agent -- <name> [options]    Uninstall an agent
  npm run uninstall-pack  -- <name> [options]    Uninstall a pack

Options:
  --all                    Install/uninstall all packages of the selected type
  --manifest <path>        Project manifest path (default: my-agents.project.json)
  --platform, -p <list>    Platforms: claude, codex, or all (default: all)
  --prune                  When used with sync-project, remove previously managed items no longer desired
  --scope <scope>          Scope: user or project (default: project)

Examples:
  npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
  npm run install-skill -- clarify
  npm run install-agent -- explorer --platform codex --scope project
  npm run install-pack -- product-manager --platform codex --scope project
  npm run sync-project -- --manifest docs/examples/my-agents.project.example.json
  npm run sync-project -- --prune
  npm run uninstall-pack -- product-manager --platform claude`;

module.exports = {
  ALL_PLATFORMS,
  DEFAULT_PROJECT_MANIFEST,
  PROJECT_SYNC_STATE_PATH,
  formatAjvErrors,
  unique,
  uniqueSorted,
  difference,
  USAGE
};
