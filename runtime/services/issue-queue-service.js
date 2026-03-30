const DEFAULT_PRIORITY_RANK = 2;
const PRIORITY_LABEL_RANKS = new Map([
  ["agent:priority-critical", 0],
  ["priority:critical", 0],
  ["priority:p0", 0],
  ["p0", 0],
  ["agent:priority-high", 1],
  ["priority:high", 1],
  ["priority:p1", 1],
  ["p1", 1],
  ["agent:priority-medium", 2],
  ["priority:medium", 2],
  ["priority:normal", 2],
  ["priority:p2", 2],
  ["p2", 2],
  ["agent:priority-low", 3],
  ["priority:low", 3],
  ["priority:p3", 3],
  ["p3", 3]
]);

function labelSet(issue) {
  return new Set(issue?.labels ?? []);
}

function normalizeStateName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function parseIssueDependencies(issue, defaultRepoSlug) {
  const lines = String(issue?.body ?? "").split(/\r?\n/);
  const dependencies = new Map();

  function addDependency(rawValue) {
    const refPattern = /(?:(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+))?#(?<number>\d+)/g;

    for (const match of rawValue.matchAll(refPattern)) {
      const issueNumber = Number.parseInt(match.groups?.number ?? "", 10);
      if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
        continue;
      }

      const repoSlug =
        match.groups?.owner && match.groups?.repo
          ? `${match.groups.owner}/${match.groups.repo}`
          : defaultRepoSlug;
      const key = `${repoSlug}#${issueNumber}`;

      if (!dependencies.has(key)) {
        dependencies.set(key, {
          repoSlug,
          issueNumber,
          raw: match[0]
        });
      }
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const marker = /^(depends[- ]on|blocked[- ]by)\s*:(.*)$/i.exec(line);

    if (!marker) {
      continue;
    }

    const inlineRefs = marker[2].trim();
    if (inlineRefs) {
      addDependency(inlineRefs);
      continue;
    }

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex].trim();

      if (!nextLine || /^(depends[- ]on|blocked[- ]by)\s*:/i.test(nextLine)) {
        break;
      }

      if (/^#{1,6}\s/.test(nextLine)) {
        break;
      }

      if (/^[-*]\s+/.test(nextLine) || /#\d+/.test(nextLine)) {
        addDependency(nextLine);
        continue;
      }

      break;
    }
  }

  return [...dependencies.values()];
}

function getIssuePriorityRank(issue) {
  let rank = Number.POSITIVE_INFINITY;

  for (const label of issue?.labels ?? []) {
    const normalizedLabel = normalizeStateName(typeof label === "string" ? label : label?.name);
    if (!normalizedLabel) {
      continue;
    }

    if (PRIORITY_LABEL_RANKS.has(normalizedLabel)) {
      rank = Math.min(rank, PRIORITY_LABEL_RANKS.get(normalizedLabel));
    }
  }

  return Number.isFinite(rank) ? rank : DEFAULT_PRIORITY_RANK;
}

function compareScheduledIssues(left, right) {
  const priorityDelta = left.priorityRank - right.priorityRank;
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftCreatedAt = Date.parse(left.issue.createdAt ?? "");
  const rightCreatedAt = Date.parse(right.issue.createdAt ?? "");
  const safeLeftCreatedAt = Number.isFinite(leftCreatedAt)
    ? leftCreatedAt
    : Number.MAX_SAFE_INTEGER;
  const safeRightCreatedAt = Number.isFinite(rightCreatedAt)
    ? rightCreatedAt
    : Number.MAX_SAFE_INTEGER;
  const createdAtDelta = safeLeftCreatedAt - safeRightCreatedAt;

  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  return left.issue.number - right.issue.number;
}

function isDependencySatisfied(issue) {
  if (!issue) {
    return false;
  }

  return normalizeStateName(issue.state) !== "open" || labelSet(issue).has("agent:done");
}

async function planConsumableIssues(repoSlug, issues, github, options = {}) {
  const openIssueMap = new Map(issues.map((issue) => [`${repoSlug}#${issue.number}`, issue]));
  const dependencyCache = new Map();

  async function loadDependencyIssue(dependency) {
    const dependencyKey = `${dependency.repoSlug}#${dependency.issueNumber}`;

    if (openIssueMap.has(dependencyKey)) {
      return openIssueMap.get(dependencyKey);
    }

    if (!dependencyCache.has(dependencyKey)) {
      dependencyCache.set(
        dependencyKey,
        github
          .viewIssue(dependency.repoSlug, dependency.issueNumber, options)
          .catch((error) => ({ loadError: error }))
      );
    }

    return dependencyCache.get(dependencyKey);
  }

  const analyzedIssues = [];

  for (const issue of issues) {
    const dependencies = parseIssueDependencies(issue, repoSlug);
    const unresolvedDependencies = [];
    const dependencyWarnings = [];

    const externalDeps = [];
    for (const dependency of dependencies) {
      if (dependency.repoSlug === repoSlug && dependency.issueNumber === issue.number) {
        unresolvedDependencies.push(dependency);
        dependencyWarnings.push(`Issue depends on itself: ${dependency.raw}`);
      } else {
        externalDeps.push(dependency);
      }
    }

    const resolvedDeps = await Promise.all(externalDeps.map((dep) => loadDependencyIssue(dep)));
    for (let i = 0; i < externalDeps.length; i++) {
      const dependency = externalDeps[i];
      const dependencyIssue = resolvedDeps[i];
      if (dependencyIssue?.loadError) {
        unresolvedDependencies.push(dependency);
        dependencyWarnings.push(
          `Failed to load dependency ${dependency.repoSlug}#${dependency.issueNumber}: ${dependencyIssue.loadError.message}`
        );
        continue;
      }

      if (!isDependencySatisfied(dependencyIssue)) {
        unresolvedDependencies.push(dependency);
      }
    }

    analyzedIssues.push({
      issue,
      priorityRank: getIssuePriorityRank(issue),
      dependencies,
      unresolvedDependencies,
      dependencyWarnings
    });
  }

  const ready = analyzedIssues
    .filter((entry) => entry.unresolvedDependencies.length === 0)
    .sort(compareScheduledIssues);
  const blocked = analyzedIssues
    .filter((entry) => entry.unresolvedDependencies.length > 0)
    .sort(compareScheduledIssues);

  return { ready, blocked };
}

function isConsumerCandidate(issue) {
  const labels = labelSet(issue);
  return labels.has("agent:ready") || labels.has("agent:review");
}

function isClaimedIssue(issue) {
  return labelSet(issue).has("agent:claimed");
}

module.exports = {
  compareScheduledIssues,
  getIssuePriorityRank,
  isClaimedIssue,
  isConsumerCandidate,
  isDependencySatisfied,
  labelSet,
  normalizeStateName,
  parseIssueDependencies,
  planConsumableIssues
};
