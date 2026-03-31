# 构建、测试与开发命令

使用 Node.js 18+ 并在运行 Python 支持的技能检查时安装 `uv`。

- `npm install` 安装仓库依赖并为此克隆配置版本化 Git 钩子。
- `npm run lint` 使用 ESLint 检查仓库的 JavaScript 工具代码。
- `npm run lint:fix` 应用安全的 ESLint 自动修复。
- `npm run format` 使用 Prettier 格式化支持的源文件。
- `npm run format:check` 验证格式是否正确但不修改文件。
- `npm run sync-instructions` 重新生成根目录的 `AGENTS.md` 和 `CLAUDE.md`。
- `npm run sync-instructions -- --check` 验证生成的根指令文件是否为最新。
- `npm run new -- my-skill`、`npm run new -- --agent my-agent` 和 `npm run new -- --pack my-pack` 搭建规范包脚手架。
- `npm run build` 重新生成 `dist/catalog.json`、`docs/catalog/skills.md`、`docs/catalog/agents.md` 和 `docs/catalog/packs.md`。
- `npm test`（`npm run validate` 的别名）运行完整验证流水线：lint、格式检查、指令同步检查、schema/约定验证、Node.js 单元测试（`test:node`）以及通过 `uv` 运行的 `skill-lifecycle-manager` 和 `agent-lifecycle-manager` Python 单元测试。
- `npx my-agents install <skill|agent|pack> <name>`（`add` 是 `install` 的别名）、`npx my-agents uninstall <skill|agent|pack> <name>`、`npx my-agents project sync` 和 `npx my-agents references <command>` 是规范的运行时命令。仓库内的 `npm run install-*`、`npm run uninstall-*`、`npm run sync-project` 和 `npm run sync-references` 别名保留以兼容。运行时命令支持 `--platform claude|codex|all`、`--scope user|project` 和 `--manifest <path>`（视场景而定）。
