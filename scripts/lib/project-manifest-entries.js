const GIT_COMMIT_SHA_RE = /^[0-9a-f]{40}$/;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLocalProjectManifestEntry(value) {
  return typeof value === "string";
}

function isExternalProjectManifestEntry(value) {
  return isObject(value) && value.source === "official";
}

function getExternalProjectManifestEntryId(entry) {
  return `official:${entry.provider}:${entry.repo}@${entry.resolvedCommit}:${entry.path}`;
}

function getProjectManifestRuntimeCollisionKey(kind, platform, name) {
  return `${kind}:${platform}:${name}`;
}

function getProjectManifestManagedEntryKey(kind, entry) {
  if (!isExternalProjectManifestEntry(entry)) {
    return `local:${kind}:${entry}`;
  }

  return `external:${kind}:${entry.platform}:${entry.name}`;
}

function parseProjectManifestManagedEntryKey(value) {
  if (typeof value === "string" && !value.includes(":")) {
    return {
      source: "local",
      kind: null,
      name: value
    };
  }

  const parts = String(value ?? "").split(":");
  if (parts[0] === "local" && parts.length === 3) {
    return {
      source: "local",
      kind: parts[1],
      name: parts[2]
    };
  }

  if (parts[0] === "external" && parts.length === 4) {
    return {
      source: "external",
      kind: parts[1],
      platform: parts[2],
      name: parts[3]
    };
  }

  return null;
}

function getLocalProjectManifestEntries(entries) {
  return (entries ?? []).filter(isLocalProjectManifestEntry);
}

function getExternalProjectManifestEntries(entries) {
  return (entries ?? []).filter(isExternalProjectManifestEntry);
}

module.exports = {
  GIT_COMMIT_SHA_RE,
  isLocalProjectManifestEntry,
  isExternalProjectManifestEntry,
  getExternalProjectManifestEntryId,
  getProjectManifestRuntimeCollisionKey,
  getProjectManifestManagedEntryKey,
  parseProjectManifestManagedEntryKey,
  getLocalProjectManifestEntries,
  getExternalProjectManifestEntries
};
