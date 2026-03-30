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

async function resolveCurrentBranch(worktreePath) {
  const { stdout } = await runCommandCapture("git", [
    "-C",
    worktreePath,
    "branch",
    "--show-current"
  ]);
  return stdout.trim();
}

async function gitRefExists(repoPath, ref) {
  try {
    await runCommandCapture("git", ["-C", repoPath, "rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
}

async function remoteBranchExists(repoPath, branchName) {
  try {
    const { stdout } = await runCommandCapture("git", [
      "-C",
      repoPath,
      "ls-remote",
      "--heads",
      "origin",
      branchName
    ]);
    return Boolean(stdout.trim());
  } catch {
    return false;
  }
}

async function createIssueWorktree(repoPath, runtimePaths, issueNumber, options = {}) {
  await ensureGitRepository(repoPath);
  await fs.mkdir(runtimePaths.worktreesDir, { recursive: true });

  const branchName = options.branchName ?? branchNameForIssue(issueNumber);
  const worktreePath = options.worktreePath ?? worktreePathForIssue(runtimePaths, issueNumber);
  const baseBranch = options.baseBranch ?? (await resolveDefaultBaseBranch(repoPath));

  if (options.reuseExisting !== false && (await fileExists(worktreePath))) {
    try {
      const currentBranch = await resolveCurrentBranch(worktreePath);
      if (currentBranch === branchName) {
        return {
          repoPath,
          worktreePath,
          branchName,
          baseBranch,
          reused: true
        };
      }
    } catch {
      // Fall through to rebuilding the worktree from a known ref.
    }
  }

  await removeWorktreeIfPresent(repoPath, worktreePath);

  try {
    await runCommand("git", ["-C", repoPath, "fetch", "origin", baseBranch], { stdio: "ignore" });
  } catch {
    // Fall back to the local branch if fetch is unavailable.
  }

  const hasLocalBranch = await gitRefExists(repoPath, `refs/heads/${branchName}`);
  const hasRemoteBranch = await remoteBranchExists(repoPath, branchName);

  if (hasLocalBranch) {
    await runCommand("git", ["-C", repoPath, "worktree", "add", worktreePath, branchName], {
      stdio: "ignore"
    });
  } else if (hasRemoteBranch) {
    await runCommand(
      "git",
      ["-C", repoPath, "worktree", "add", "-B", branchName, worktreePath, `origin/${branchName}`],
      { stdio: "ignore" }
    );
  } else {
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
  }

  if (hasRemoteBranch) {
    try {
      await runCommand(
        "git",
        ["-C", worktreePath, "branch", "--set-upstream-to", `origin/${branchName}`, branchName],
        { stdio: "ignore" }
      );
    } catch {
      // Resume can still proceed without an upstream if the push uses an explicit ref.
    }
  }

  return {
    repoPath,
    worktreePath,
    branchName,
    baseBranch,
    reused: false
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

async function getHeadCommitSha(worktreePath) {
  const { stdout } = await runCommandCapture("git", ["-C", worktreePath, "rev-parse", "HEAD"]);
  return stdout.trim();
}

async function pushBranch(worktreePath, branchName, options = {}) {
  const args = ["-C", worktreePath, "push"];
  if (options.forceWithLease) {
    args.push("--force-with-lease");
  }
  args.push("-u", "origin", branchName);
  await runCommand("git", args, {
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
  getHeadCommitSha,
  getWorkingTreeStatus,
  pushBranch,
  resolveDefaultBaseBranch,
  worktreePathForIssue
};
