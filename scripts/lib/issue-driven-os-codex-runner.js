const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const { loadCodexAgentDefinition } = require("./issue-driven-os-agent-loader");

async function writeTempJsonFile(prefix, value) {
  const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const filePath = path.join(dirPath, "payload.json");
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return {
    dirPath,
    filePath
  };
}

function runCodexExec(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("codex", args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`codex exec exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`));
    });
  });
}

function buildStructuredPrompt(agentDefinition, payload, options = {}) {
  const sections = [
    `You must act using this agent definition: ${agentDefinition.agentName}.`,
    agentDefinition.developerInstructions,
    "",
    options.taskHeader ?? "Task payload:",
    JSON.stringify(payload, null, 2),
    "",
    "Return only data that satisfies the provided output schema."
  ];

  return sections.join("\n");
}

async function runStructuredCodexTask(repoRoot, agentName, payload, schema, options = {}) {
  const agentDefinition = await loadCodexAgentDefinition(repoRoot, agentName);
  const schemaTemp = await writeTempJsonFile("issue-driven-os-schema-", schema);
  const outputTemp = await writeTempJsonFile("issue-driven-os-output-", {});

  try {
    const prompt = buildStructuredPrompt(agentDefinition, payload, {
      taskHeader: options.taskHeader
    });
    const args = [
      "-a",
      "never",
      "-s",
      agentDefinition.sandboxMode === "read-only" ? "read-only" : "workspace-write",
      "exec",
      "-C",
      options.cwd,
      "-m",
      agentDefinition.model,
      "--output-schema",
      schemaTemp.filePath,
      "--output-last-message",
      outputTemp.filePath,
      prompt
    ];

    const result = await runCodexExec(args, { cwd: options.cwd });
    const rawOutput = await fs.readFile(outputTemp.filePath, "utf8");

    return {
      agent: agentDefinition,
      payload: JSON.parse(rawOutput),
      stdout: result.stdout,
      stderr: result.stderr
    };
  } finally {
    await fs.rm(schemaTemp.dirPath, { recursive: true, force: true });
    await fs.rm(outputTemp.dirPath, { recursive: true, force: true });
  }
}

function buildIssueNormalizationSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "body", "labels", "summary"],
    properties: {
      title: { type: "string" },
      body: { type: "string" },
      summary: { type: "string" },
      labels: {
        type: "array",
        items: { type: "string" }
      }
    }
  };
}

function buildIssueShapingSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["route", "summary", "acceptanceCriteria", "nonGoals", "splitIssues"],
    properties: {
      route: {
        type: "string",
        enum: ["execute", "split", "clarify", "block"]
      },
      summary: { type: "string" },
      acceptanceCriteria: {
        type: "array",
        items: { type: "string" }
      },
      nonGoals: {
        type: "array",
        items: { type: "string" }
      },
      splitIssues: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "body", "labels"],
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            labels: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  };
}

function buildExecutionSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "status",
      "summary",
      "changeSummary",
      "verificationSummary",
      "commitMessage",
      "prTitle",
      "prBody",
      "blockers"
    ],
    properties: {
      status: {
        type: "string",
        enum: ["implemented", "no_changes", "blocked", "split_required"]
      },
      summary: { type: "string" },
      changeSummary: { type: "string" },
      verificationSummary: { type: "string" },
      commitMessage: { type: "string" },
      prTitle: { type: "string" },
      prBody: { type: "string" },
      blockers: {
        type: "array",
        items: { type: "string" }
      }
    }
  };
}

function buildCriticSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "verdict",
      "summary",
      "verificationVerdict",
      "blockingFindings",
      "nonBlockingFindings"
    ],
    properties: {
      verdict: {
        type: "string",
        enum: ["ready", "needs_changes", "blocked"]
      },
      verificationVerdict: {
        type: "string",
        enum: ["verified-pass", "verified-partial", "verified-fail", "needs-more-evidence"]
      },
      summary: { type: "string" },
      blockingFindings: {
        type: "array",
        items: { type: "string" }
      },
      nonBlockingFindings: {
        type: "array",
        items: { type: "string" }
      }
    }
  };
}

async function normalizeIssueInput(repoRoot, cwd, rawInput, context = {}) {
  return runStructuredCodexTask(
    repoRoot,
    "issue-intake-normalizer",
    {
      rawInput,
      context
    },
    buildIssueNormalizationSchema(),
    {
      cwd,
      taskHeader: "Normalize the following raw signal into a GitHub issue draft:"
    }
  );
}

async function shapeGitHubIssue(repoRoot, cwd, issueContext) {
  return runStructuredCodexTask(repoRoot, "issue-shaper", issueContext, buildIssueShapingSchema(), {
    cwd,
    taskHeader: "Shape the following GitHub issue for execution readiness:"
  });
}

async function executeGitHubIssue(repoRoot, cwd, executionContext) {
  return runStructuredCodexTask(
    repoRoot,
    "issue-cell-executor",
    executionContext,
    buildExecutionSchema(),
    {
      cwd,
      taskHeader:
        "Implement the issue in the current repository, update tests as needed, and return structured execution output:"
    }
  );
}

async function critiqueGitHubIssue(repoRoot, cwd, criticContext) {
  return runStructuredCodexTask(repoRoot, "issue-cell-critic", criticContext, buildCriticSchema(), {
    cwd,
    taskHeader:
      "Review the current repository state and execution result, then return a structured critic verdict:"
  });
}

module.exports = {
  critiqueGitHubIssue,
  executeGitHubIssue,
  normalizeIssueInput,
  shapeGitHubIssue
};
