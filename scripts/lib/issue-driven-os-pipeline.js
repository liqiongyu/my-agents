const fs = require("node:fs/promises");
const path = require("node:path");

const {
  createProjectionPayload,
  writeProjectionPayload
} = require("./issue-driven-os-projection-adapter");
const { runReferenceScenario } = require("./issue-driven-os-run-manager");

function toCompactTimestamp(isoString) {
  return isoString.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildDefaultPipelineDir(repoRoot, scenarioId, startedAt) {
  return path.join(
    repoRoot,
    ".tmp",
    "issue-driven-os-pipeline",
    `${scenarioId.toLowerCase()}-${toCompactTimestamp(startedAt)}`
  );
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function runIssueDrivenOsPipeline(repoRoot, scenarioId, options = {}) {
  const startedAt = options.startedAt ?? new Date().toISOString();
  const finishedAt = options.finishedAt ?? startedAt;

  const outputDir = options.outputDir ?? buildDefaultPipelineDir(repoRoot, scenarioId, startedAt);
  const sessionPath = path.join(outputDir, "session.json");
  const projectionPath = path.join(outputDir, "projection.json");

  if (options.persist !== false) {
    await ensureDir(outputDir);
  }

  const { session } = await runReferenceScenario(repoRoot, scenarioId, {
    outputPath: sessionPath,
    startedAt,
    finishedAt,
    persist: options.persist !== false
  });

  const payload = createProjectionPayload(session);

  if (options.persist !== false) {
    await writeProjectionPayload(projectionPath, payload);
  }

  return {
    scenarioId,
    outputDir,
    sessionPath,
    projectionPath,
    session,
    payload
  };
}

function formatPipelineRun(result, cwd = process.cwd()) {
  const lines = [
    `Issue-Driven OS pipeline completed for ${result.scenarioId}.`,
    `Session id: ${result.session.id}`,
    `Output dir: ${path.relative(cwd, result.outputDir)}`,
    `Session artifact: ${path.relative(cwd, result.sessionPath)}`,
    `Projection artifact: ${path.relative(cwd, result.projectionPath)}`,
    `Final issue state: ${result.payload.issueProjection.visibleState ?? "n/a"}`,
    `Merge eligibility: ${result.payload.pullRequestProjection.mergeEligibility}`
  ];

  return `${lines.join("\n")}\n`;
}

module.exports = {
  buildDefaultPipelineDir,
  formatPipelineRun,
  runIssueDrivenOsPipeline
};
