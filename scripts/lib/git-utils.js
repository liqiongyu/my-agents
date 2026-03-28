const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const { fileExists } = require("./fs-utils");
const { GIT_COMMIT_SHA_RE } = require("./project-manifest-entries");

function runCommand(command, args, options = {}) {
  const { cwd, stdio = "inherit" } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function runCommandCapture(command, args, options = {}) {
  const { cwd } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
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

      reject(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`
        )
      );
    });
  });
}

async function resolveGitRemoteRef(repositoryUrl, ref) {
  const trimmedRef = String(ref ?? "").trim();
  if (!trimmedRef) {
    throw new Error("git ref is required");
  }

  if (GIT_COMMIT_SHA_RE.test(trimmedRef)) {
    return trimmedRef;
  }

  const { stdout } = await runCommandCapture("git", [
    "ls-remote",
    "--quiet",
    repositoryUrl,
    `refs/heads/${trimmedRef}`,
    `refs/tags/${trimmedRef}^{}`,
    `refs/tags/${trimmedRef}`,
    trimmedRef
  ]);

  const shas = [
    ...new Set(
      stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/\s+/)[0])
        .filter(Boolean)
    )
  ];

  if (shas.length === 0) {
    return null;
  }

  if (shas.length > 1) {
    throw new Error(`git ref "${trimmedRef}" resolved ambiguously in ${repositoryUrl}`);
  }

  return shas[0];
}

async function cloneGitRepository(repositoryUrl, destination, options = {}) {
  const { checkoutRef = null, depth = null, noCheckout = false, quiet = false } = options;
  const args = ["clone"];

  if (quiet) {
    args.push("--quiet");
  }

  if (noCheckout) {
    args.push("--no-checkout");
  }

  if (typeof depth === "number" && depth > 0) {
    args.push("--depth", String(depth));
  }

  args.push(repositoryUrl, destination);
  await runCommand("git", args, { stdio: quiet ? "ignore" : "inherit" });

  if (checkoutRef) {
    await runCommand("git", ["-C", destination, "checkout", "--detach", checkoutRef], {
      stdio: quiet ? "ignore" : "inherit"
    });
  }
}

async function syncGitRepository(entry, depth, label) {
  const repoPath = path.resolve(entry.path);
  const gitDir = path.join(repoPath, ".git");

  if (await fileExists(gitDir)) {
    console.log(`Updating ${label} -> ${entry.path}`);
    await runCommand("git", ["-C", repoPath, "pull", "--ff-only"]);
    return "updated";
  }

  if (await fileExists(repoPath)) {
    const existingEntries = await fs.readdir(repoPath);
    if (existingEntries.length > 0) {
      throw new Error(`path exists and is not an empty Git repository: ${entry.path}`);
    }
  }

  await fs.mkdir(path.dirname(repoPath), { recursive: true });

  console.log(`Cloning ${label} -> ${entry.path}`);
  await cloneGitRepository(entry.url, repoPath, { depth });
  return "cloned";
}

module.exports = {
  cloneGitRepository,
  resolveGitRemoteRef,
  runCommand,
  runCommandCapture,
  syncGitRepository
};
