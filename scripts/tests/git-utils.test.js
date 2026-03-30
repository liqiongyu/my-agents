const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseGitHubRepoSlugFromRemoteUrl,
  resolveGitHubRepoSlug,
  runCommand
} = require("../lib/git-utils");

test("parseGitHubRepoSlugFromRemoteUrl supports common GitHub remote URL forms", () => {
  assert.equal(parseGitHubRepoSlugFromRemoteUrl("git@github.com:owner/repo.git"), "owner/repo");
  assert.equal(parseGitHubRepoSlugFromRemoteUrl("https://github.com/owner/repo.git"), "owner/repo");
  assert.equal(
    parseGitHubRepoSlugFromRemoteUrl("ssh://git@github.com/owner/repo.git"),
    "owner/repo"
  );
  assert.equal(parseGitHubRepoSlugFromRemoteUrl("https://gitlab.com/owner/repo.git"), null);
});

test("resolveGitHubRepoSlug prefers origin when available", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "git-utils-origin-"));
  const repoPath = path.join(tempRoot, "repo");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await runCommand("git", ["init", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["remote", "add", "origin", "git@github.com:example/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["remote", "add", "upstream", "git@github.com:other/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });

    const context = await resolveGitHubRepoSlug(repoPath);

    assert.equal(context.repoSlug, "example/project");
    assert.equal(context.remoteName, "origin");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolveGitHubRepoSlug uses a unique GitHub remote when origin is absent", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "git-utils-unique-"));
  const repoPath = path.join(tempRoot, "repo");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await runCommand("git", ["init", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["remote", "add", "upstream", "https://github.com/example/project"], {
      cwd: repoPath,
      stdio: "ignore"
    });

    const context = await resolveGitHubRepoSlug(repoPath);

    assert.equal(context.repoSlug, "example/project");
    assert.equal(context.remoteName, "upstream");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolveGitHubRepoSlug falls back when origin is not a GitHub remote", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "git-utils-fallback-"));
  const repoPath = path.join(tempRoot, "repo");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await runCommand("git", ["init", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["remote", "add", "origin", "git@gitlab.com:example/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["remote", "add", "upstream", "git@github.com:example/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });

    const context = await resolveGitHubRepoSlug(repoPath);

    assert.equal(context.repoSlug, "example/project");
    assert.equal(context.remoteName, "upstream");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolveGitHubRepoSlug errors when the project has no resolvable GitHub remote", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "git-utils-missing-"));
  const repoPath = path.join(tempRoot, "repo");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await runCommand("git", ["init", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["remote", "add", "origin", "git@gitlab.com:example/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });

    await assert.rejects(
      resolveGitHubRepoSlug(repoPath),
      /No resolvable GitHub remote found for project repository/
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolveGitHubRepoSlug errors when multiple GitHub remotes are ambiguous", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "git-utils-ambiguous-"));
  const repoPath = path.join(tempRoot, "repo");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await runCommand("git", ["init", "-b", "main"], { cwd: repoPath, stdio: "ignore" });
    await runCommand("git", ["remote", "add", "upstream", "git@github.com:example/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });
    await runCommand("git", ["remote", "add", "mirror", "git@github.com:other/project.git"], {
      cwd: repoPath,
      stdio: "ignore"
    });

    await assert.rejects(
      resolveGitHubRepoSlug(repoPath),
      /Ambiguous GitHub remotes for project repository/
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
