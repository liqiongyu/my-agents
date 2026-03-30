const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");
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

function resolveTraceMode(options = {}) {
  return options.traceMode === "rich" ? "rich" : "compact";
}

function runCodexExec(args, options = {}) {
  return new Promise((resolve, reject) => {
    const traceMode = resolveTraceMode(options);
    const captureRichTrace = traceMode === "rich";
    const startedAt = new Date().toISOString();
    const spawnImpl = options.spawnImpl ?? spawn;
    const child = spawnImpl("codex", args, {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });

    let stdout = "";
    let stderr = "";
    let threadId = null;
    const events = [];
    let eventCount = 0;
    let eventProcessing = Promise.resolve();
    const stdoutReader = readline.createInterface({ input: child.stdout });

    function enqueueEventWork(work) {
      eventProcessing = eventProcessing.then(work, work);
    }

    stdoutReader.on("line", (line) => {
      if (captureRichTrace) {
        stdout += `${line}\n`;
      }
      enqueueEventWork(async () => {
        let parsedEvent = null;
        try {
          parsedEvent = JSON.parse(line);
        } catch {
          parsedEvent = null;
        }

        if (!parsedEvent) {
          return;
        }

        eventCount += 1;
        if (captureRichTrace) {
          events.push(parsedEvent);
        }
        if (parsedEvent.type === "thread.started" && parsedEvent.thread_id) {
          threadId = parsedEvent.thread_id;
        }

        if (typeof options.onEvent === "function") {
          await options.onEvent(parsedEvent);
        }
      });
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", async (code) => {
      stdoutReader.close();
      await eventProcessing;
      const sessionPath = threadId ? await findCodexSessionPath(threadId, { startedAt }) : null;

      if (code === 0) {
        resolve({ stdout, stderr, events, eventCount, threadId, sessionPath, startedAt });
        return;
      }

      const error = new Error(
        `codex exec exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`
      );
      error.stdout = stdout;
      error.stderr = stderr;
      error.events = events;
      error.eventCount = eventCount;
      error.threadId = threadId;
      error.sessionPath = sessionPath;
      error.startedAt = startedAt;
      reject(error);
    });
  });
}

async function findCodexSessionPath(threadId, options = {}) {
  const codexHome = options.codexHome ?? path.join(os.homedir(), ".codex");
  const baseSessionsDir = path.join(codexHome, "sessions");
  const startedAt = Date.parse(options.startedAt ?? "");
  const offsets = [0, -1, 1];

  for (const dayOffset of offsets) {
    const candidateDate = Number.isFinite(startedAt)
      ? new Date(startedAt + dayOffset * 24 * 60 * 60 * 1000)
      : new Date();
    const year = String(candidateDate.getUTCFullYear()).padStart(4, "0");
    const month = String(candidateDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(candidateDate.getUTCDate()).padStart(2, "0");
    const candidateDir = path.join(baseSessionsDir, year, month, day);

    let entries;
    try {
      entries = await fs.readdir(candidateDir);
    } catch {
      continue;
    }

    const match = entries.find((entry) => entry.endsWith(`${threadId}.jsonl`));
    if (match) {
      return path.join(candidateDir, match);
    }
  }

  return null;
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
  const traceMode = resolveTraceMode(options);
  const captureRichTrace = traceMode === "rich";
  const agentLoader = options.loadCodexAgentDefinition ?? loadCodexAgentDefinition;
  const codexExec = options.runCodexExec ?? runCodexExec;
  const agentDefinition = await agentLoader(repoRoot, agentName);
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
      "--json",
      "--output-schema",
      schemaTemp.filePath,
      "--output-last-message",
      outputTemp.filePath,
      prompt
    ];

    const result = await codexExec(args, {
      cwd: options.cwd,
      traceMode,
      onEvent: options.onEvent
    });
    const rawOutput = await fs.readFile(outputTemp.filePath, "utf8");
    const parsedPayload = JSON.parse(rawOutput);

    return {
      agent: agentDefinition,
      payload: parsedPayload,
      stdout: captureRichTrace ? result.stdout : "",
      stderr: captureRichTrace ? result.stderr : "",
      trace: {
        mode: traceMode,
        startedAt: result.startedAt,
        threadId: result.threadId,
        sessionPath: result.sessionPath,
        prompt: captureRichTrace ? prompt : null,
        finalMessage: captureRichTrace ? rawOutput : null,
        events: captureRichTrace ? result.events : [],
        eventCount: result.eventCount ?? (result.events ?? []).length
      }
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

async function normalizeIssueInput(repoRoot, cwd, rawInput, context = {}, options = {}) {
  return runStructuredCodexTask(
    repoRoot,
    "issue-intake-normalizer",
    {
      rawInput,
      context
    },
    buildIssueNormalizationSchema(),
    {
      ...options,
      cwd,
      taskHeader: "Normalize the following raw signal into a GitHub issue draft:"
    }
  );
}

async function shapeGitHubIssue(repoRoot, cwd, issueContext, options = {}) {
  return runStructuredCodexTask(repoRoot, "issue-shaper", issueContext, buildIssueShapingSchema(), {
    ...options,
    cwd,
    taskHeader: "Shape the following GitHub issue for execution readiness:"
  });
}

async function executeGitHubIssue(repoRoot, cwd, executionContext, options = {}) {
  return runStructuredCodexTask(
    repoRoot,
    "issue-cell-executor",
    executionContext,
    buildExecutionSchema(),
    {
      ...options,
      cwd,
      taskHeader:
        "Implement the issue in the current repository, update tests as needed, and return structured execution output:"
    }
  );
}

async function critiqueGitHubIssue(repoRoot, cwd, criticContext, options = {}) {
  return runStructuredCodexTask(repoRoot, "issue-cell-critic", criticContext, buildCriticSchema(), {
    ...options,
    cwd,
    taskHeader:
      "Review the current repository state and execution result, then return a structured critic verdict:"
  });
}

module.exports = {
  critiqueGitHubIssue,
  executeGitHubIssue,
  findCodexSessionPath,
  normalizeIssueInput,
  runCodexExec,
  shapeGitHubIssue
};
