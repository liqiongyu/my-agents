# README Templates by Project Type

Use this file in Create mode for software-oriented repositories. These are compact runtime templates: they define section order, emphasis, and must-not-miss details without shipping full sample READMEs for every case.

## OSS Library

Use when the repo exports an API or package for other developers to adopt.

Recommended order:
- Title, one-line value proposition, and 2-3 meaningful badges
- Short feature list focused on user-visible capabilities
- Installation with prerequisites and package manager commands
- Quick start with the smallest working example
- API reference for the top-level exported surface
- Configuration if there are important defaults or environment knobs
- Testing, contributing link, and license link

Must not miss:
- Show real import names and a working usage snippet
- Prefer a small API overview over a symbol dump
- Keep license and contributing sections link-first, not copy-pasted

Micro skeleton:

```markdown
# library-name
One sentence: what it solves and for whom.

## Installation
## Quick Start
## API Reference
## Testing
## Contributing
## License
```

## Web Service / API

Use when the repo is primarily a deployable service with routes, infrastructure, or operations concerns.

Recommended order:
- Title, one-liner, and status/license badges
- Optional screenshot or architecture diagram if it clarifies the service
- Features or service responsibilities
- Getting started: prerequisites, install, env setup, and local run command
- Architecture or key directories when orientation matters
- Environment variables and core endpoints or links to deeper API docs
- Deployment and troubleshooting only when the repo supports them
- Testing, contributing link, and license link

Must not miss:
- A health check or first verification command
- Required external services such as databases, queues, or caches
- Clear separation between README overview and deeper API docs

Micro skeleton:

```markdown
# service-name
One sentence: what the service does.

## Getting Started
## Architecture
## Environment Variables
## API Overview
## Deployment
## Troubleshooting
```

## CLI Tool

Use when the main value is a command users install and run directly.

Recommended order:
- Title, one-liner, and install/version badges
- Demo screenshot or terminal capture when available
- Installation and supported runtimes
- Usage with the simplest invocation first
- Commands, options, and configuration only for the surface users actually touch
- Troubleshooting or FAQ for common failures
- Contributing link and license link

Must not miss:
- A copy-pasteable command that produces an immediate result
- Input/output examples for flags, stdin, or files
- Error-recovery notes when setup is brittle

Micro skeleton:

```markdown
# tool-name
One sentence: what it does.

## Installation
## Usage
## Commands
## Configuration
## Troubleshooting
```

## Personal / Portfolio

Use when the repo is a solo project, experiment, or showcase piece.

Recommended order:
- Title, short description, and optional demo link
- What the project does or why it exists
- Tech stack only when it helps readers orient quickly
- Local setup or how to explore the project
- What you learned, tradeoffs, or future ideas

Must not miss:
- Honest framing about scope or maturity
- Screenshots only if they reflect the current state
- A lightweight README sized to the project

Micro skeleton:

```markdown
# project-name
One sentence.

## Demo
## What This Does
## Getting Started
## What I Learned
## Future Ideas
```

## Internal / Team

Use when the README primarily helps teammates, operators, or new contributors onboard.

Recommended order:
- Overview and service purpose
- Dependencies, local development, and required secrets/files
- Architecture or key file map
- Operational runbooks, deployment notes, and troubleshooting
- Gotchas and links to deeper team docs

Must not miss:
- The fastest path to running the project locally
- Links to source-of-truth docs instead of copying full internal policies
- Known operational sharp edges

Micro skeleton:

```markdown
# service-name
## Overview
## Local Development
## Architecture
## Runbooks
## Troubleshooting
## Related Docs
```

## Monorepo

Use when the repo contains multiple packages, services, or apps with shared tooling.

Recommended order:
- Repo overview and what lives here
- Package or service map with one-line descriptions
- Shared setup and root commands
- How to work on one package or service at a time
- Directory structure when it helps navigation
- Testing/contributing/license links

Must not miss:
- Workspace commands for install, build, test, and targeted development
- A package table or navigation section
- Clear guidance on where package-specific docs live

Micro skeleton:

```markdown
# project-name
## Overview
## Packages
## Getting Started
## Development
## Directory Structure
## Contributing
```

## Config / Dotfiles

Use when the repo mainly distributes configuration, shell setup, or editor/tool preferences.

Recommended order:
- What this setup covers
- Why the setup exists or what philosophy drives it
- Safe install steps with backup guidance
- Dependencies and platform assumptions
- Extension/customization notes
- Gotchas and related links

Must not miss:
- Backup warnings before overwrite or symlink steps
- OS/tool assumptions
- The difference between required and optional tooling

Micro skeleton:

```markdown
# tool-name Config
## What's Here
## Why This Setup
## How to Install
## How to Extend
## Gotchas
```
