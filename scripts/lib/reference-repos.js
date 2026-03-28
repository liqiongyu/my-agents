const fs = require("node:fs/promises");
const path = require("node:path");

const { fileExists } = require("./fs-utils");

const MANIFEST_PATH = path.join(".my-agents", "reference-repos.json");
const REFERENCES_ROOT = path.join("workspaces", "references");

function createEmptyManifest() {
  return {
    schemaVersion: 1,
    repositories: []
  };
}

function uniqueSortedStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === "string"))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function sanitizePathSegment(value) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-");
}

function normalizeRelativePath(value) {
  return value
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function parseRepositoryUrl(rawUrl) {
  const trimmed = String(rawUrl ?? "").trim();
  if (!trimmed) {
    throw new Error("repository URL is required");
  }

  const sshMatch = trimmed.match(/^git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, host, owner, repo] = sshMatch;
    return {
      host,
      owner,
      repo,
      url: `https://${host}/${owner}/${repo}`
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error(`unsupported repository URL: ${trimmed}`);
  }

  const pathname = parsedUrl.pathname.replace(/\/+$/, "").replace(/\.git$/, "");
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`repository URL must include owner and repo: ${trimmed}`);
  }

  const owner = parts[0];
  const repo = parts[1];

  return {
    host: parsedUrl.host,
    owner,
    repo,
    url: `https://${parsedUrl.host}/${owner}/${repo}`
  };
}

function defaultRepositoryPath(owner, repo) {
  return `${REFERENCES_ROOT}/${sanitizePathSegment(owner)}__${sanitizePathSegment(repo)}`;
}

function normalizeRepositoryEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error("repository entries must be objects");
  }

  const parsed = parseRepositoryUrl(entry.url);
  const repositoryPath =
    typeof entry.path === "string" && entry.path.trim()
      ? normalizeRelativePath(entry.path.trim())
      : defaultRepositoryPath(parsed.owner, parsed.repo);

  if (!repositoryPath) {
    throw new Error(`repository path is invalid for ${parsed.url}`);
  }

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    url: parsed.url,
    path: repositoryPath,
    purpose: typeof entry.purpose === "string" ? entry.purpose.trim() : "",
    tags: uniqueSortedStrings(entry.tags)
  };
}

function normalizeManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("manifest must be a JSON object");
  }

  const repositories = (manifest.repositories ?? []).map(normalizeRepositoryEntry);
  const seenUrls = new Set();
  const seenPaths = new Set();

  for (const repository of repositories) {
    if (seenUrls.has(repository.url)) {
      throw new Error(`manifest contains duplicate repository URL: ${repository.url}`);
    }
    if (seenPaths.has(repository.path)) {
      throw new Error(`manifest contains duplicate repository path: ${repository.path}`);
    }
    seenUrls.add(repository.url);
    seenPaths.add(repository.path);
  }

  repositories.sort((left, right) => left.path.localeCompare(right.path));

  return {
    schemaVersion: 1,
    repositories
  };
}

async function readManifest() {
  if (!(await fileExists(MANIFEST_PATH))) {
    return createEmptyManifest();
  }

  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return normalizeManifest(JSON.parse(raw));
}

async function writeManifest(manifest) {
  const normalized = normalizeManifest(manifest);
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function repositoryLabel(entry) {
  return `${entry.owner}/${entry.repo}`;
}

function repositorySlug(entry) {
  return `${entry.owner}__${entry.repo}`;
}

function findRepositoryIndex(manifest, identifier) {
  const trimmed = String(identifier ?? "").trim();
  if (!trimmed) {
    return -1;
  }

  let normalizedUrl = null;
  try {
    normalizedUrl = parseRepositoryUrl(trimmed).url;
  } catch {
    normalizedUrl = null;
  }

  const normalizedPath = normalizeRelativePath(trimmed);

  return manifest.repositories.findIndex((entry) => {
    return (
      entry.url === normalizedUrl ||
      entry.path === normalizedPath ||
      repositoryLabel(entry) === trimmed ||
      repositorySlug(entry) === trimmed
    );
  });
}

module.exports = {
  MANIFEST_PATH,
  REFERENCES_ROOT,
  defaultRepositoryPath,
  findRepositoryIndex,
  normalizeRelativePath,
  normalizeRepositoryEntry,
  parseRepositoryUrl,
  readManifest,
  repositoryLabel,
  repositorySlug,
  writeManifest
};
