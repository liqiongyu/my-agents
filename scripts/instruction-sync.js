const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOT = path.join("instructions", "root");
const TARGETS = {
  "AGENTS.md": ["shared.md", "codex.md"],
  "CLAUDE.md": ["shared.md", "claude.md"]
};

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function sourcePathsForTarget(targetPath) {
  const sourceNames = TARGETS[targetPath];
  if (!sourceNames) {
    throw new Error(`Unsupported instruction target: ${targetPath}`);
  }
  return sourceNames.map((sourceName) => path.join(SOURCE_ROOT, sourceName));
}

async function renderTarget(repoRoot, targetPath) {
  const relativeSourcePaths = sourcePathsForTarget(targetPath);
  const sourceContents = await Promise.all(
    relativeSourcePaths.map(async (relativeSourcePath) => {
      const absoluteSourcePath = path.join(repoRoot, relativeSourcePath);
      const content = await fs.readFile(absoluteSourcePath, "utf8");
      return normalizeContent(content).trim();
    })
  );

  const sourcesLabel = relativeSourcePaths.map((value) => `\`${value}\``).join(" and ");
  const intro = [
    `> This file is generated from ${sourcesLabel}.`,
    "> Edit those source fragments instead of hand-editing this file.",
    "> Run `npm run sync-instructions` after changing them. The versioned `pre-commit` hook auto-syncs and stages this file, and `npm test` plus CI fail if it drifts."
  ].join("\n");

  return normalizeContent([intro, ...sourceContents].join("\n\n"));
}

async function buildInstructionOutputs(repoRoot = DEFAULT_REPO_ROOT) {
  const outputs = {};
  for (const targetPath of Object.keys(TARGETS)) {
    outputs[targetPath] = await renderTarget(repoRoot, targetPath);
  }
  return outputs;
}

async function syncInstructions({ repoRoot = DEFAULT_REPO_ROOT, check = false } = {}) {
  const outputs = await buildInstructionOutputs(repoRoot);
  const staleTargets = [];
  const writtenTargets = [];

  for (const [targetPath, expectedContent] of Object.entries(outputs)) {
    const absoluteTargetPath = path.join(repoRoot, targetPath);
    let currentContent = null;

    try {
      currentContent = normalizeContent(await fs.readFile(absoluteTargetPath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    if (currentContent === expectedContent) {
      continue;
    }

    staleTargets.push(targetPath);
    if (!check) {
      await fs.writeFile(absoluteTargetPath, expectedContent, "utf8");
      writtenTargets.push(targetPath);
    }
  }

  return {
    outputs,
    staleTargets,
    writtenTargets
  };
}

module.exports = {
  DEFAULT_REPO_ROOT,
  SOURCE_ROOT,
  TARGETS,
  buildInstructionOutputs,
  normalizeContent,
  syncInstructions
};
