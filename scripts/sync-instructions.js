#!/usr/bin/env node

const { syncInstructions } = require("./instruction-sync");

async function main() {
  const check = process.argv.includes("--check");
  const result = await syncInstructions({ check });

  if (check) {
    if (result.staleTargets.length > 0) {
      console.error(
        [
          "Generated instruction files are out of date.",
          "Run `npm run sync-instructions` to regenerate:",
          ...result.staleTargets.map((targetPath) => `- ${targetPath}`)
        ].join("\n")
      );
      process.exitCode = 1;
      return;
    }

    console.log("Generated instruction files are up to date.");
    return;
  }

  if (result.writtenTargets.length === 0) {
    console.log("Generated instruction files are already up to date.");
    return;
  }

  console.log(
    ["Updated generated instruction files:", ...result.writtenTargets.map((value) => `- ${value}`)].join(
      "\n"
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
