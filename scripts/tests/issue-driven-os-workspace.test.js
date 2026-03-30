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
  createIssueWorktree,
  refreshIssueBranch
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

test("refreshIssueBranch merges the latest base branch into an issue worktree", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-worktree-refresh-"));
  const remotePath = path.join(tempRoot, "remote.git");
  const repoPath = path.join(tempRoot, "repo");

  try {
    await runCommand("git", ["init", "--bare", remotePath], { stdio: "ignore" });
    await runCommand("git", ["clone", remotePath, repoPath], { stdio: "ignore" });
    await runCommand("git", ["config", "user.email", "agent@example.com"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["config", "user.name", "Issue OS Test"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["checkout", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await fs.writeFile(path.join(repoPath, "README.md"), "hello\n", "utf8");
    await runCommand("git", ["add", "README.md"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["commit", "-m", "init"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["push", "-u", "origin", "main"], { cwd: repoPath, stdio: "ignore" });

    const runtimePaths = buildRuntimePaths("owner/repo", {
      runtimeRoot: path.join(tempRoot, "runtime")
    });
    const workspace = await createIssueWorktree(repoPath, runtimePaths, 56);

    await fs.writeFile(path.join(repoPath, "README.md"), "hello\nfrom-main\n", "utf8");
    await runCommand("git", ["add", "README.md"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["commit", "-m", "main update"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["push"], { cwd: repoPath, stdio: "ignore" });

    const refresh = await refreshIssueBranch(workspace.worktreePath, workspace.baseBranch);
    const readme = await fs.readFile(path.join(workspace.worktreePath, "README.md"), "utf8");

    assert.equal(refresh.status, "merged");
    assert.equal(refresh.baseBranch, "main");
    assert.deepEqual(refresh.conflictedFiles, []);
    assert.match(readme, /from-main/);

    await cleanupIssueWorktree(repoPath, workspace.worktreePath, {
      branchName: workspace.branchName,
      deleteBranch: true
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("refreshIssueBranch reports conflicted files when base updates collide", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-worktree-conflict-"));
  const remotePath = path.join(tempRoot, "remote.git");
  const repoPath = path.join(tempRoot, "repo");

  try {
    await runCommand("git", ["init", "--bare", remotePath], { stdio: "ignore" });
    await runCommand("git", ["clone", remotePath, repoPath], { stdio: "ignore" });
    await runCommand("git", ["config", "user.email", "agent@example.com"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["config", "user.name", "Issue OS Test"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["checkout", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await fs.writeFile(path.join(repoPath, "README.md"), "hello\n", "utf8");
    await runCommand("git", ["add", "README.md"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["commit", "-m", "init"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["push", "-u", "origin", "main"], { cwd: repoPath, stdio: "ignore" });

    const runtimePaths = buildRuntimePaths("owner/repo", {
      runtimeRoot: path.join(tempRoot, "runtime")
    });
    const workspace = await createIssueWorktree(repoPath, runtimePaths, 57);

    await fs.writeFile(
      path.join(workspace.worktreePath, "README.md"),
      "hello\nfrom-issue-branch\n",
      "utf8"
    );
    await runCommand("git", ["add", "README.md"], {
      cwd: workspace.worktreePath,
      stdio: "ignore"
    });
    await runCommand("git", ["commit", "-m", "issue update"], {
      cwd: workspace.worktreePath,
      stdio: "ignore"
    });

    await fs.writeFile(path.join(repoPath, "README.md"), "hello\nfrom-main\n", "utf8");
    await runCommand("git", ["add", "README.md"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["commit", "-m", "main update"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["push"], { cwd: repoPath, stdio: "ignore" });

    const refresh = await refreshIssueBranch(workspace.worktreePath, workspace.baseBranch);

    assert.equal(refresh.status, "conflicted");
    assert.equal(refresh.baseBranch, "main");
    assert.deepEqual(refresh.conflictedFiles, ["README.md"]);

    await runCommand("git", ["merge", "--abort"], {
      cwd: workspace.worktreePath,
      stdio: "ignore"
    });
    await cleanupIssueWorktree(repoPath, workspace.worktreePath, {
      branchName: workspace.branchName,
      deleteBranch: true
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
