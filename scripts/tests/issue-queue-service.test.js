const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isConsumerCandidate,
  parseIssueDependencies,
  planConsumableIssues
} = require("../../runtime/services/issue-queue-service");

test("issue queue service identifies consumable ready and review issues", () => {
  assert.equal(isConsumerCandidate({ labels: ["agent:ready"] }), true);
  assert.equal(isConsumerCandidate({ labels: ["agent:review"] }), true);
  assert.equal(isConsumerCandidate({ labels: ["agent:claimed"] }), false);
});

test("issue queue service plans ready issues after dependency checks", async () => {
  const issues = [
    {
      number: 2,
      body: "Depends-On: #1",
      labels: ["agent:ready"],
      createdAt: "2026-03-29T00:00:01Z",
      state: "OPEN"
    },
    {
      number: 1,
      body: "",
      labels: ["agent:ready", "agent:priority-high"],
      createdAt: "2026-03-29T00:00:00Z",
      state: "OPEN"
    },
    {
      number: 3,
      body: "Depends-On: #99",
      labels: ["agent:review"],
      createdAt: "2026-03-29T00:00:02Z",
      state: "OPEN"
    }
  ];

  const plan = await planConsumableIssues("owner/repo", issues, {
    viewIssue: async () => ({
      number: 99,
      labels: ["agent:done"],
      state: "CLOSED"
    })
  });

  assert.deepEqual(
    plan.ready.map((entry) => entry.issue.number),
    [1, 3]
  );
  assert.deepEqual(
    plan.blocked.map((entry) => entry.issue.number),
    [2]
  );
  assert.deepEqual(parseIssueDependencies(issues[0], "owner/repo"), [
    { repoSlug: "owner/repo", issueNumber: 1, raw: "#1" }
  ]);
});
