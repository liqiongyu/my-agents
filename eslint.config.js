const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.agents/**",
      "**/.claude/**",
      "**/.codex/**",
      "**/.my-agents/**",
      "**/dist/**",
      "**/docs/catalog/**",
      "**/workspaces/**",
      "**/.venv/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-console": "off",
      "no-process-exit": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
];
