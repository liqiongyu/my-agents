#!/usr/bin/env node

const path = require("node:path");

const { projectReferenceRuntimeSession } = require("./lib/issue-driven-os-projection-adapter");

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: node scripts/issue-driven-os-project.js <session-path> [--out <path>] [--json]",
        "",
        "Examples:",
        "  node scripts/issue-driven-os-project.js .tmp/issue-driven-os-runs/g1-session.json",
        "  node scripts/issue-driven-os-project.js .tmp/issue-driven-os-runs/f1-session.json --out .tmp/f1-projection.json",
        "  node scripts/issue-driven-os-project.js .tmp/issue-driven-os-runs/gt1-session.json --json"
      ].join("\n")
    );
    return;
  }

  const asJson = args.includes("--json");
  const outFlagIndex = args.indexOf("--out");
  const outputPath =
    outFlagIndex >= 0 && args[outFlagIndex + 1]
      ? path.resolve(process.cwd(), args[outFlagIndex + 1])
      : undefined;
  const sessionArg = args.find(
    (arg, index) => !arg.startsWith("-") && (outFlagIndex < 0 || index !== outFlagIndex + 1)
  );

  if (!sessionArg) {
    throw new Error("Missing session path.");
  }

  const repoRoot = path.resolve(__dirname, "..");
  const sessionPath = path.resolve(process.cwd(), sessionArg);
  const result = await projectReferenceRuntimeSession(repoRoot, sessionPath, {
    outputPath,
    persist: !asJson
  });

  if (asJson) {
    console.log(JSON.stringify(result.payload, null, 2));
    return;
  }

  console.log(
    [
      `Reference projection payload written for session ${result.session.id}.`,
      `Output: ${path.relative(process.cwd(), result.outputPath)}`,
      `Issue state: ${result.payload.issueProjection.visibleState ?? "n/a"}`,
      `Merge eligibility: ${result.payload.pullRequestProjection.mergeEligibility}`
    ].join("\n")
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
