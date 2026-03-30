const test = require("node:test");
const assert = require("node:assert/strict");

const { DEFAULT_AGENT_LABELS, buildGhAdapter } = require("../lib/issue-driven-os-github-adapter");

function findFieldValue(args, fieldName) {
  const entry = args.find(
    (value) => value === `name=${fieldName}` || value.startsWith(`${fieldName}=`)
  );
  return entry ? entry.slice(fieldName.length + 1) : null;
}

test("ensureLabels skips labels that already exist", async () => {
  const existingLabels = new Set(["agent:ready", "agent:blocked"]);
  const createdLabels = [];
  const inspectedLabels = [];
  const github = buildGhAdapter({
    capture: async (_command, args) => {
      const pathArg = args.find((value) => value.startsWith("repos/"));

      if (!pathArg) {
        throw new Error(`unexpected gh call: ${args.join(" ")}`);
      }

      if (args.includes("--method") && args.includes("POST")) {
        const labelName = findFieldValue(args, "name");
        createdLabels.push(labelName);
        return { stdout: JSON.stringify({ name: labelName }) };
      }

      const labelName = decodeURIComponent(pathArg.split("/").pop());
      inspectedLabels.push(labelName);

      if (existingLabels.has(labelName)) {
        return { stdout: JSON.stringify({ name: labelName }) };
      }

      throw new Error(`gh ${args.join(" ")} exited with code 1: gh: Not Found (HTTP 404)`);
    }
  });

  await github.ensureLabels("owner/repo");

  assert.deepEqual(
    inspectedLabels,
    DEFAULT_AGENT_LABELS.map((label) => label.name)
  );
  assert.deepEqual(
    createdLabels,
    DEFAULT_AGENT_LABELS.map((label) => label.name).filter(
      (labelName) => !existingLabels.has(labelName)
    )
  );
});

test("ensureLabels treats already-existing create races as idempotent success", async () => {
  const createdLabels = [];
  const github = buildGhAdapter({
    capture: async (_command, args) => {
      const pathArg = args.find((value) => value.startsWith("repos/"));

      if (!pathArg) {
        throw new Error(`unexpected gh call: ${args.join(" ")}`);
      }

      if (!(args.includes("--method") && args.includes("POST"))) {
        throw new Error(`gh ${args.join(" ")} exited with code 1: gh: Not Found (HTTP 404)`);
      }

      const labelName = findFieldValue(args, "name");
      createdLabels.push(labelName);

      if (labelName === "agent:ready") {
        throw new Error(
          `${_command} ${args.join(" ")} exited with code 1: gh: Validation Failed (HTTP 422)\n{"errors":[{"resource":"Label","code":"already_exists","field":"name"}]}`
        );
      }

      return { stdout: JSON.stringify({ name: labelName }) };
    }
  });

  await assert.doesNotReject(() => github.ensureLabels("owner/repo"));
  assert.deepEqual(
    createdLabels,
    DEFAULT_AGENT_LABELS.map((label) => label.name)
  );
});
