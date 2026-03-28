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
  npx my-agents add <github-url> [options]
  npx my-agents install <skill|agent|pack> <name> [options]
  npx my-agents install <skill|agent|pack> --all [options]
  npx my-agents uninstall <skill|agent|pack> <name> [options]
  npx my-agents uninstall <skill|agent|pack> --all [options]
  npx my-agents project sync [options]
  npx my-agents references <command> [options]

Options:
  --all                    Install/uninstall all packages of the selected type
  --manifest <path>        Project manifest path (default: my-agents.project.json)
  --platform, -p <list>    Platforms: claude, codex, or all (default: all)
  --prune                  When used with project sync, remove previously managed items no longer desired
  --scope <scope>          Scope: user or project (default: project)

Examples:
  npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
  npx my-agents install skill clarify
  npx my-agents install agent explorer --platform codex --scope project
  npx my-agents install pack product-manager --platform codex --scope project
  npx my-agents project sync --manifest docs/examples/my-agents.project.example.json
  npx my-agents project sync --prune
  npx my-agents references add https://github.com/example/agent-reference-repo

Compatibility aliases:
  npm run install-skill -- <name>
  npm run install-agent -- <name>
  npm run install-pack -- <name>
  npm run sync-project -- [options]
  npm run uninstall-skill -- <name>
  npm run uninstall-agent -- <name>
  npm run uninstall-pack -- <name>
  npm run sync-references -- <command> [options]`;

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
