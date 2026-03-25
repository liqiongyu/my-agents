# README Templates by Project Type

Read this file when generating a README in Create mode. Select the template matching the project type from Step 3, then adapt it based on the codebase analysis.

These templates show section order and content style — not rigid fill-in-the-blanks. Omit sections that don't apply. Add sections not shown here if the project warrants them.

---

## Table of Contents

- [OSS Library](#oss-library)
- [Web Service / API](#web-service--api)
- [CLI Tool](#cli-tool)
- [Personal / Portfolio](#personal--portfolio)
- [Internal / Team](#internal--team)
- [Monorepo](#monorepo)
- [Config / Dotfiles](#config--dotfiles)

---

## OSS Library

```markdown
# library-name

One sentence: what problem this solves and for whom.

[![CI](https://img.shields.io/github/actions/workflow/status/USER/REPO/ci.yml?branch=main)](actions-url)
[![npm](https://img.shields.io/npm/v/PACKAGE)](npm-url)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- Feature one — brief explanation
- Feature two — brief explanation
- Feature three — brief explanation

## Installation

\```bash
npm install library-name
\```

### Prerequisites

- Node.js >= 18

## Quick Start

\```javascript
import { something } from 'library-name';

const result = something({ key: 'value' });
console.log(result);
\```

## API Reference

### `functionName(options)`

Description of what it does.

| Parameter | Type | Required | Default | Description |
|-----------|------|:--------:|---------|-------------|
| `key` | `string` | Yes | — | What this controls |
| `timeout` | `number` | No | `5000` | Timeout in ms |

**Returns:** `Promise<Result>` — description

### `anotherFunction(input)`

Brief description.

## Configuration

\```javascript
// Optional: customize defaults
import { configure } from 'library-name';

configure({
  timeout: 10000,
  retries: 3,
});
\```

## Testing

\```bash
npm test
\```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
```

---

## Web Service / API

```markdown
# service-name

One sentence: what this service does and where it fits.

[![CI](https://img.shields.io/github/actions/workflow/status/USER/REPO/ci.yml?branch=main)](actions-url)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Screenshot or architecture diagram](docs/screenshot.png)

## Features

- Feature one
- Feature two
- Feature three

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL 16
- Redis 7+

### Installation

\```bash
git clone https://github.com/USER/REPO.git
cd REPO
npm install
cp .env.example .env  # then edit with your values
\```

### Running Locally

\```bash
npm run dev
\```

The server starts at `http://localhost:3000`. Verify with:

\```bash
curl http://localhost:3000/health
\```

## Architecture

\```mermaid
graph LR
    Client --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Core[Core API]
    Core --> DB[(PostgreSQL)]
    Core --> Cache[(Redis)]
\```

### Key Directories

| Path | Purpose |
|------|---------|
| `src/routes/` | API route handlers |
| `src/services/` | Business logic |
| `src/models/` | Database models |
| `migrations/` | Database migrations |

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|:--------:|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | — |
| `REDIS_URL` | Redis connection string | Yes | — |
| `PORT` | Server port | No | `3000` |
| `JWT_SECRET` | Token signing secret | Yes | — |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/items` | List items |
| `POST` | `/api/items` | Create item |

For full API docs, see [API Documentation](docs/api.md).

## Deployment

### Docker

\```bash
docker build -t service-name .
docker run -p 3000:3000 --env-file .env service-name
\```

### Docker Compose

\```bash
docker compose up -d
\```

## Testing

\```bash
npm test          # unit tests
npm run test:e2e  # end-to-end tests
\```

## Troubleshooting

<details>
<summary>Database connection refused</summary>

Ensure PostgreSQL is running and `DATABASE_URL` is correct:

\```bash
psql $DATABASE_URL -c "SELECT 1"
\```

</details>

<details>
<summary>Port already in use</summary>

\```bash
lsof -i :3000
kill -9 <PID>
\```

</details>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
```

---

## CLI Tool

```markdown
# tool-name

One sentence: what this tool does.

[![CI](https://img.shields.io/github/actions/workflow/status/USER/REPO/ci.yml?branch=main)](actions-url)
[![npm](https://img.shields.io/npm/v/PACKAGE)](npm-url)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Terminal demo](docs/demo.gif)

## Features

- Feature one
- Feature two
- Feature three

## Installation

\```bash
npm install -g tool-name
\```

Or run directly:

\```bash
npx tool-name
\```

## Usage

\```bash
# Basic usage
tool-name input.txt

# With options
tool-name input.txt --output result.json --verbose

# Pipe from stdin
cat data.csv | tool-name --format json
\```

## Commands

| Command | Description |
|---------|-------------|
| `tool-name init` | Initialize a new project |
| `tool-name build` | Build the project |
| `tool-name serve` | Start dev server |

## Options

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--output <path>` | `-o` | Output file path | stdout |
| `--format <type>` | `-f` | Output format (json, csv, table) | `table` |
| `--verbose` | `-v` | Enable verbose logging | `false` |
| `--config <path>` | `-c` | Config file path | `.toolrc` |

## Configuration

Create a `.toolrc` file in your project root:

\```json
{
  "output": "dist",
  "format": "json",
  "verbose": false
}
\```

## FAQ

<details>
<summary>How do I use this with CI/CD?</summary>

\```yaml
# .github/workflows/ci.yml
- run: npx tool-name build --output dist/
\```

</details>

<details>
<summary>Can I use a custom config location?</summary>

\```bash
tool-name --config path/to/config.json
\```

</details>

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `command not found` | Ensure global npm bin is in `$PATH`: `npm bin -g` |
| Permission denied | Try `sudo npm install -g tool-name` or use `npx` |
| Unexpected output format | Check `--format` flag, default is `table` |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
```

---

## Personal / Portfolio

```markdown
# project-name

One sentence: what it does and why you built it.

![Screenshot or demo](docs/screenshot.png)

## Demo

[Live demo](https://your-demo-url.com) | [Video walkthrough](link)

## What This Does

2-3 sentences explaining the problem it solves for you. Be specific.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite | Fast dev loop, familiar |
| Backend | Express | Simple, sufficient |
| Database | SQLite | Zero-config, good enough for this |
| Hosting | Fly.io | Free tier, easy deploy |

## Getting Started

\```bash
git clone https://github.com/USER/REPO.git
cd REPO
npm install
npm run dev
\```

## How It Works

Brief explanation of the interesting technical decisions — architecture, algorithms, or patterns worth noting.

\```mermaid
graph TD
    A[User Input] --> B[Parser]
    B --> C{Valid?}
    C -->|Yes| D[Process]
    C -->|No| E[Error]
    D --> F[Output]
\```

## What I Learned

- Key learning 1
- Key learning 2
- Key learning 3

## Future Ideas

- [ ] Feature idea 1
- [ ] Feature idea 2
```

---

## Internal / Team

```markdown
# service-name

One sentence: what this does and where it fits in the system.

**Team:** #team-channel | **On-call:** [Rotation](link)

## Overview

2-3 sentences: what it does, why it exists, how it connects to other services.

### Dependencies

- **Upstream:** Service A, Service B
- **Downstream:** Service C

## Local Development

### Prerequisites

- Node.js >= 20
- Docker (for local Postgres and Redis)
- Access to internal VPN

### Environment Setup

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `DATABASE_URL` | Postgres connection | 1Password → "Dev DB" |
| `AUTH_SECRET` | JWT signing key | 1Password → "Auth Keys" |

### Running

\```bash
git clone <repo-url>
cd service-name
cp .env.example .env  # fill from 1Password
docker compose up -d   # start dependencies
npm install
npm run dev
\```

### Running Tests

\```bash
npm test
\```

## Architecture

\```mermaid
graph LR
    A[Client App] --> B[This Service]
    B --> C[(Postgres)]
    B --> D[(Redis)]
    B --> E[Auth Service]
\```

### Key Files

| Path | Purpose |
|------|---------|
| `src/routes/` | API handlers |
| `src/workers/` | Background job processors |
| `src/models/` | Database models + migrations |

## Deployment

| Environment | URL | Deploy |
|-------------|-----|--------|
| Staging | staging.internal.co | Auto on `main` push |
| Production | prod.internal.co | Manual via GitHub Release |

> [!IMPORTANT]
> Production deploys require approval from #platform-team.

## Runbooks

### Restart the Service

\```bash
kubectl rollout restart deployment/service-name -n production
\```

### Check Logs

\```bash
kubectl logs -f deployment/service-name -n production --tail=100
\```

## Troubleshooting

### High Memory Usage

**Symptom:** Pods OOMKilled
**Cause:** Unbounded cache growth in the worker process
**Fix:** Restart the worker, then investigate the job queue for stuck items

### Database Connection Pool Exhausted

**Symptom:** `ConnectionPoolTimeoutError` in logs
**Cause:** Long-running transactions holding connections
**Fix:** Check for stuck transactions: `SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';`

## Gotchas

- The `LEGACY_MODE` env var must be `true` until the Q2 migration is complete
- Don't run `npm run seed` on staging — it wipes the shared test data
- Background jobs process in FIFO order; don't assume parallel execution

## Related Docs

- [Architecture Decision Record](link)
- [API Specification](link)
- [Monitoring Dashboard](link)
```

---

## Monorepo

```markdown
# project-name

One sentence: what this monorepo contains.

[![CI](https://img.shields.io/github/actions/workflow/status/USER/REPO/ci.yml?branch=main)](actions-url)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

Brief description of the project's purpose and the relationship between packages.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@scope/core`](packages/core) | 1.2.0 | Core library |
| [`@scope/cli`](packages/cli) | 0.8.0 | CLI tool |
| [`@scope/web`](packages/web) | 1.0.0 | Web dashboard |

## Getting Started

\```bash
git clone https://github.com/USER/REPO.git
cd REPO
npm install        # installs all workspace dependencies
npm run build      # builds all packages
\```

## Development

\```bash
# Work on a specific package
npm run dev --workspace=packages/core

# Run tests across all packages
npm test

# Run tests for one package
npm test --workspace=packages/cli
\```

## Architecture

\```mermaid
graph TD
    CLI[CLI Package] --> Core
    Web[Web Dashboard] --> Core
    Core[Core Library] --> DB[(Shared DB)]
\```

## Directory Structure

\```
├── packages/
│   ├── core/        # Shared core library
│   ├── cli/         # Command-line interface
│   └── web/         # Web dashboard
├── docs/            # Shared documentation
├── scripts/         # Build and release scripts
└── .github/         # CI/CD workflows
\```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Each package has its own README with package-specific development instructions.

## License

[MIT](LICENSE)
```

---

## Config / Dotfiles

```markdown
# tool-name Config

> Last reviewed: 2025-01-15

One sentence: what this configures and why you have custom config.

## What's Here

| Path | Purpose |
|------|---------|
| `init.lua` | Main Neovim configuration entry point |
| `lua/plugins/` | Plugin definitions (lazy.nvim) |
| `lua/keymaps.lua` | Custom key bindings |
| `lua/options.lua` | Editor options and settings |

## Why This Setup

1-2 paragraphs explaining your philosophy. What problems were you solving? What workflow are you optimizing for?

## How to Install

\```bash
# Back up existing config
mv ~/.config/nvim ~/.config/nvim.bak

# Clone
git clone https://github.com/USER/REPO.git ~/.config/nvim
\```

### Dependencies

- Neovim >= 0.10
- ripgrep (for telescope search)
- A Nerd Font (for icons)

## How to Extend

### Adding a Plugin

1. Create a file in `lua/plugins/`
2. Follow the lazy.nvim spec format
3. Run `:Lazy sync`

### Adding a Keymap

Edit `lua/keymaps.lua`. Use `<leader>` prefix for custom bindings.

## Gotchas

- Don't edit `lazy-lock.json` manually — run `:Lazy update` instead
- The `after/` directory loads AFTER all plugins — use it for overrides
- LSP config assumes `mason.nvim` installs servers; don't install them globally

## Related

- [Neovim docs](https://neovim.io/doc/)
- [lazy.nvim docs](https://lazy.folke.io/)
```

---

## Badge Quick Reference

Common badge patterns (replace placeholders with actual values):

```markdown
<!-- Build / CI -->
[![CI](https://img.shields.io/github/actions/workflow/status/USER/REPO/ci.yml?branch=main)](link)

<!-- Package version -->
[![npm](https://img.shields.io/npm/v/PACKAGE)](link)
[![PyPI](https://img.shields.io/pypi/v/PACKAGE)](link)
[![crates.io](https://img.shields.io/crates/v/PACKAGE)](link)

<!-- License -->
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

<!-- Downloads -->
[![npm downloads](https://img.shields.io/npm/dm/PACKAGE)](link)
[![PyPI downloads](https://img.shields.io/pypi/dm/PACKAGE)](link)

<!-- Coverage -->
[![codecov](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](link)

<!-- Project status -->
[![Maintenance](https://img.shields.io/badge/maintained-yes-green.svg)](link)
```

Choose badges that convey useful metadata. 3-5 is the sweet spot.
