const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { runCommand } = require("../lib/git-utils");
const { buildRuntimePaths } = require("../lib/issue-driven-os-state-store");
const {
  cleanupIssueWorktree,
  commitAllChanges,
  createIssueWorktree
} = require("../lib/issue-driven-os-workspace");

test("issue-driven-os workspace manager creates a worktree and commits changes", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-worktree-"));
  const repoPath = path.join(tempRoot, "repo");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await runCommand("git", ["init", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["config", "user.email", "agent@example.com"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["config", "user.name", "Issue OS Test"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await fs.writeFile(path.join(repoPath, "README.md"), "hello\n", "utf8");
    await runCommand("git", ["add", "README.md"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["commit", "-m", "init"], { cwd: repoPath, stdio: "ignore" });

    const runtimePaths = buildRuntimePaths("owner/repo", {
      runtimeRoot: path.join(tempRoot, "runtime")
    });
    const workspace = await createIssueWorktree(repoPath, runtimePaths, 55);

    await fs.writeFile(path.join(workspace.worktreePath, "README.md"), "hello\nworld\n", "utf8");
    const commit = await commitAllChanges(workspace.worktreePath, "feat: update readme");

    assert.equal(workspace.branchName, "agent/issue-55");
    assert.equal(commit.changed, true);
    assert.ok(commit.commitSha);

    await cleanupIssueWorktree(repoPath, workspace.worktreePath, {
      branchName: workspace.branchName,
      deleteBranch: true
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
