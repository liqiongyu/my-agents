const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildRecoveredLeaseSnapshot,
  buildReviewLoopBudgetExceededSummary,
  resolveReviewLoopsMax,
  snapshotLeaseForRun
} = require("../../runtime/services/issue-lease-service");

test("issue lease service resolves review loop budgets in precedence order", () => {
  assert.equal(resolveReviewLoopsMax({ reviewLoopsMax: 2 }, { reviewLoopsMax: 5 }), 5);
  assert.equal(resolveReviewLoopsMax({ reviewLoopsMax: 2 }, {}), 2);
  assert.equal(resolveReviewLoopsMax({}, { reviewLoopsMax: "bad" }), 3);
});

test("issue lease service snapshots and recovers lease metadata", () => {
  const lease = {
    holderId: "run_123",
    runId: "run_123",
    holderType: "worker",
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:05.000Z",
    expiresAt: "2026-03-30T00:01:00.000Z",
    leasePath: "/tmp/issue-12.json"
  };

  const snapshot = snapshotLeaseForRun(lease);
  const recovered = buildRecoveredLeaseSnapshot(lease, {
    recoveredAt: "2026-03-30T00:02:00.000Z"
  });

  assert.equal(snapshot.leasePath, undefined);
  assert.equal(recovered.lastOutcome, "expired_recovered");
  assert.equal(recovered.previousLease.holderId, "run_123");
  assert.match(
    buildReviewLoopBudgetExceededSummary({ summary: "Critic requested another pass." }, 2, 1),
    /Review-loop budget exhausted/
  );
});
