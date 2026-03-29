const fs = require("node:fs/promises");
const path = require("node:path");

const { fileExists } = require("./fs-utils");
const { runCommand, runCommandCapture } = require("./git-utils");

function branchNameForIssue(issueNumber) {
  return `agent/issue-${issueNumber}`;
}

function worktreePathForIssue(runtimePaths, issueNumber) {
  return path.join(runtimePaths.worktreesDir, `issue-${issueNumber}`);
}

async function ensureGitRepository(repoPath) {
  const { stdout } = await runCommandCapture("git", [
    "-C",
    repoPath,
    "rev-parse",
    "--show-toplevel"
  ]);
  return stdout.trim();
}

async function resolveDefaultBaseBranch(repoPath) {
  try {
    const { stdout } = await runCommandCapture("git", [
      "-C",
      repoPath,
      "symbolic-ref",
      "--quiet",
      "--short",
      "refs/remotes/origin/HEAD"
    ]);
    return stdout.trim().replace(/^origin\//, "");
  } catch {
    const { stdout } = await runCommandCapture("git", ["-C", repoPath, "branch", "--show-current"]);
    return stdout.trim() || "main";
  }
}

async function removeWorktreeIfPresent(repoPath, worktreePath) {
  if (!(await fileExists(worktreePath))) {
    return;
  }

  try {
    await runCommand("git", ["-C", repoPath, "worktree", "remove", "--force", worktreePath], {
      stdio: "ignore"
    });
  } catch {
    await fs.rm(worktreePath, { recursive: true, force: true });
  }
}

async function createIssueWorktree(repoPath, runtimePaths, issueNumber, options = {}) {
  await ensureGitRepository(repoPath);
  await fs.mkdir(runtimePaths.worktreesDir, { recursive: true });

  const branchName = options.branchName ?? branchNameForIssue(issueNumber);
  const worktreePath = options.worktreePath ?? worktreePathForIssue(runtimePaths, issueNumber);
  const baseBranch = options.baseBranch ?? (await resolveDefaultBaseBranch(repoPath));

  await removeWorktreeIfPresent(repoPath, worktreePath);

  try {
    await runCommand("git", ["-C", repoPath, "fetch", "origin", baseBranch], { stdio: "ignore" });
  } catch {
    // Fall back to the local branch if fetch is unavailable.
  }

  await runCommand(
    "git",
    ["-C", repoPath, "worktree", "add", "-B", branchName, worktreePath, `origin/${baseBranch}`],
    { stdio: "ignore" }
  ).catch(async () => {
    await runCommand(
      "git",
      ["-C", repoPath, "worktree", "add", "-B", branchName, worktreePath, baseBranch],
      {
        stdio: "ignore"
      }
    );
  });

  return {
    repoPath,
    worktreePath,
    branchName,
    baseBranch
  };
}

async function getWorkingTreeStatus(worktreePath) {
  const { stdout } = await runCommandCapture("git", ["-C", worktreePath, "status", "--porcelain"]);
  return stdout.trim();
}

async function commitAllChanges(worktreePath, message) {
  const status = await getWorkingTreeStatus(worktreePath);
  if (!status) {
    return { changed: false, commitSha: null };
  }

  await runCommand("git", ["-C", worktreePath, "add", "-A"], { stdio: "ignore" });
  await runCommand("git", ["-C", worktreePath, "commit", "-m", message], { stdio: "ignore" });

  const { stdout } = await runCommandCapture("git", ["-C", worktreePath, "rev-parse", "HEAD"]);
  return {
    changed: true,
    commitSha: stdout.trim()
  };
}

async function pushBranch(worktreePath, branchName) {
  await runCommand("git", ["-C", worktreePath, "push", "-u", "origin", branchName], {
    stdio: "ignore"
  });
}

async function cleanupIssueWorktree(repoPath, worktreePath, options = {}) {
  await removeWorktreeIfPresent(repoPath, worktreePath);

  if (options.deleteBranch && options.branchName) {
    try {
      await runCommand("git", ["-C", repoPath, "branch", "-D", options.branchName], {
        stdio: "ignore"
      });
    } catch {
      // Branch may already be gone; ignore cleanup failures.
    }
  }
}

module.exports = {
  branchNameForIssue,
  cleanupIssueWorktree,
  commitAllChanges,
  createIssueWorktree,
  ensureGitRepository,
  getWorkingTreeStatus,
  pushBranch,
  resolveDefaultBaseBranch,
  worktreePathForIssue
};
