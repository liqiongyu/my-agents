const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { cloneGitRepository, resolveGitRemoteRef } = require("./git-utils");
const { fileExists } = require("./fs-utils");
const { getProjectManifestManagedEntryKey } = require("./project-manifest-entries");

async function withExternalRepositoryCheckout(repo, resolvedCommit, fn) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "my-agents-external-"));

  try {
    await cloneGitRepository(`https://github.com/${repo}.git`, tempDir, {
      checkoutRef: resolvedCommit,
      quiet: true
    });
    return await fn(tempDir);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function inspectExternalAssetCandidate(candidate) {
  const { repo, declaredRef, sourceUrl, mode, path: assetPath } = candidate;

  const resolvedCommit = await resolveGitRemoteRef(`https://github.com/${repo}.git`, declaredRef);
  if (!resolvedCommit) {
    return null;
  }

  return withExternalRepositoryCheckout(repo, resolvedCommit, async (checkoutPath) => {
    const absoluteAssetPath = path.join(checkoutPath, ...assetPath.split("/"));
    if (!(await fileExists(absoluteAssetPath))) {
      return null;
    }

    const stats = await fs.stat(absoluteAssetPath);
    if (mode === "tree" && !stats.isDirectory()) {
      return null;
    }
    if (mode === "blob" && !stats.isFile()) {
      return null;
    }

    if (stats.isDirectory()) {
      const skillDocPath = path.join(absoluteAssetPath, "SKILL.md");
      if (!(await fileExists(skillDocPath))) {
        return null;
      }

      return {
        kind: "skills",
        entry: {
          source: "official",
          provider: "github",
          platform: "claude",
          name: path.basename(assetPath),
          repo,
          declaredRef,
          resolvedCommit,
          path: assetPath,
          sourceUrl
        }
      };
    }

    const extension = path.extname(absoluteAssetPath).toLowerCase();
    if (extension === ".md") {
      return {
        kind: "agents",
        entry: {
          source: "official",
          provider: "github",
          platform: "claude",
          name: path.basename(assetPath, ".md"),
          repo,
          declaredRef,
          resolvedCommit,
          path: assetPath,
          sourceUrl
        }
      };
    }

    if (extension === ".toml") {
      return {
        kind: "agents",
        entry: {
          source: "official",
          provider: "github",
          platform: "codex",
          name: path.basename(assetPath, ".toml"),
          repo,
          declaredRef,
          resolvedCommit,
          path: assetPath,
          sourceUrl
        }
      };
    }

    return null;
  });
}

async function resolveExternalAssetCandidates(parsedGitHubUrl) {
  const matches = [];

  for (const candidate of parsedGitHubUrl.candidates) {
    const inspected = await inspectExternalAssetCandidate({
      repo: parsedGitHubUrl.repositoryName,
      declaredRef: candidate.declaredRef,
      path: candidate.path,
      sourceUrl: parsedGitHubUrl.sourceUrl,
      mode: parsedGitHubUrl.mode
    });

    if (inspected) {
      matches.push(inspected);
    }
  }

  if (matches.length === 0) {
    throw new Error("URL must point to one supported external asset");
  }

  if (matches.length > 1) {
    throw new Error("URL resolved ambiguously; use a URL with an unambiguous ref and asset path");
  }

  return matches[0];
}

function getExternalAssetManagedKey(kind, entry) {
  return getProjectManifestManagedEntryKey(kind === "skills" ? "skill" : "agent", entry);
}

module.exports = {
  getExternalAssetManagedKey,
  resolveExternalAssetCandidates,
  withExternalRepositoryCheckout
};
