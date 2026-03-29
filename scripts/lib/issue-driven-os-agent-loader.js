const fs = require("node:fs/promises");
const path = require("node:path");

const AGENT_INSTRUCTION_PATTERN = /developer_instructions\s*=\s*"""\n?([\s\S]*?)\n?"""/m;
const AGENT_DESCRIPTION_PATTERN = /description\s*=\s*"([^"]+)"/m;
const AGENT_MODEL_PATTERN = /model\s*=\s*"([^"]+)"/m;
const AGENT_REASONING_PATTERN = /model_reasoning_effort\s*=\s*"([^"]+)"/m;
const AGENT_SANDBOX_PATTERN = /sandbox_mode\s*=\s*"([^"]+)"/m;

async function loadCodexAgentDefinition(repoRoot, agentName) {
  const configPath = path.join(repoRoot, "agents", agentName, "codex.toml");
  const raw = await fs.readFile(configPath, "utf8");

  const instructionsMatch = raw.match(AGENT_INSTRUCTION_PATTERN);
  const descriptionMatch = raw.match(AGENT_DESCRIPTION_PATTERN);
  const modelMatch = raw.match(AGENT_MODEL_PATTERN);
  const reasoningMatch = raw.match(AGENT_REASONING_PATTERN);
  const sandboxMatch = raw.match(AGENT_SANDBOX_PATTERN);

  return {
    agentName,
    configPath,
    description: descriptionMatch?.[1] ?? "",
    model: modelMatch?.[1] ?? "gpt-5.4",
    reasoningEffort: reasoningMatch?.[1] ?? "medium",
    sandboxMode: sandboxMatch?.[1] ?? "workspace-write",
    developerInstructions: (instructionsMatch?.[1] ?? "").trim()
  };
}

module.exports = {
  loadCodexAgentDefinition
};
