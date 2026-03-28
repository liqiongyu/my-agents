const { parseRepositoryUrl } = require("./reference-repos");

function normalizeGitHubPackageUrl(rawUrl) {
  const parsedUrl = new URL(String(rawUrl ?? "").trim());
  parsedUrl.hash = "";
  parsedUrl.search = "";
  return parsedUrl.toString().replace(/\/+$/, "");
}

function parseGitHubPackageUrl(rawUrl) {
  const normalizedUrl = normalizeGitHubPackageUrl(rawUrl);
  const parsedUrl = new URL(normalizedUrl);

  if (parsedUrl.host !== "github.com") {
    throw new Error(`only github.com URLs are supported: ${normalizedUrl}`);
  }

  const pathnameParts = parsedUrl.pathname.split("/").filter(Boolean);
  if (pathnameParts.length < 5) {
    throw new Error(`GitHub URL must point to a tree/blob asset path: ${normalizedUrl}`);
  }

  const [owner, repo, mode, ...tail] = pathnameParts;
  if (mode !== "tree" && mode !== "blob") {
    throw new Error(`GitHub URL must use /tree/ or /blob/: ${normalizedUrl}`);
  }

  if (tail.length < 2) {
    throw new Error(`GitHub URL must include both a ref and a path: ${normalizedUrl}`);
  }

  const repository = parseRepositoryUrl(`https://github.com/${owner}/${repo}`);
  const candidates = [];

  for (let index = 1; index < tail.length; index += 1) {
    candidates.push({
      declaredRef: tail.slice(0, index).join("/"),
      path: tail.slice(index).join("/")
    });
  }

  return {
    owner,
    repo,
    repositoryUrl: `${repository.url}.git`,
    repositoryName: `${owner}/${repo}`,
    mode,
    sourceUrl: normalizedUrl,
    candidates
  };
}

module.exports = {
  normalizeGitHubPackageUrl,
  parseGitHubPackageUrl
};
