const ISSUE_ORCHESTRATOR_ACTIONS = [
  "spawn_worker",
  "split_issue",
  "block_issue",
  "request_merge",
  "create_handoff"
];

const ISSUE_ORCHESTRATOR_WORKER_KINDS = [
  "issue-shaper",
  "issue-cell-executor",
  "issue-cell-critic",
  "explorer",
  "debugger",
  "docs-researcher"
];

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

function buildIssueOrchestratorSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["action", "summary", "worker", "splitIssues", "blockers", "mergeReadiness"],
    properties: {
      action: {
        type: "string",
        enum: ISSUE_ORCHESTRATOR_ACTIONS
      },
      summary: {
        type: "string"
      },
      worker: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            additionalProperties: false,
            required: ["kind", "task", "acceptanceFocus"],
            properties: {
              kind: {
                type: "string",
                enum: ISSUE_ORCHESTRATOR_WORKER_KINDS
              },
              task: { type: "string" },
              acceptanceFocus: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        ]
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
      },
      blockers: {
        type: "array",
        items: { type: "string" }
      },
      mergeReadiness: {
        type: "string",
        enum: ["none", "not_ready", "needs_gate", "ready"]
      }
    }
  };
}

module.exports = {
  ISSUE_ORCHESTRATOR_ACTIONS,
  ISSUE_ORCHESTRATOR_WORKER_KINDS,
  buildCriticSchema,
  buildExecutionSchema,
  buildIssueNormalizationSchema,
  buildIssueOrchestratorSchema,
  buildIssueShapingSchema
};
