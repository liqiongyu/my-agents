# README Templates: Community Projects

Read this file when generating a README for community/organization repositories: awesome lists, curated collections, .github profile repos, or community resource hubs.

---

## Table of Contents

- [Awesome List / Curated Collection](#awesome-list--curated-collection)
- [Organization Profile (.github repo)](#organization-profile-github-repo)
- [Resource Hub / Topic Collection](#resource-hub--topic-collection)

---

## Awesome List / Curated Collection

For curated lists following the "awesome-*" pattern: tool compilations, resource lists, reading lists, or any community-maintained collection of links.

```markdown
# Awesome Topic Name

A curated list of [topic] resources — tools, libraries, articles, and more.

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![License](https://img.shields.io/badge/license-CC0-blue.svg)](LICENSE)

## Contents

- [Category A](#category-a)
- [Category B](#category-b)
- [Category C](#category-c)
- [Category D](#category-d)
- [Articles & Talks](#articles--talks)

## Category A

Brief description of what this category covers.

- [Tool Name](https://link) — One-line description of what it does.
- [Tool Name](https://link) — One-line description.
- [Tool Name](https://link) — One-line description.

## Category B

Brief description.

- [Resource Name](https://link) — Description.
- [Resource Name](https://link) — Description.

## Category C

Brief description.

- [Resource Name](https://link) — Description.
- [Resource Name](https://link) — Description.

## Articles & Talks

- [Article Title](https://link) — Author, Year. Brief note on why it's valuable.
- [Talk Title](https://link) — Speaker, Conference. Brief note.

---

## Contributing

Contributions welcome! Please read the [contribution guidelines](CONTRIBUTING.md) before submitting a PR.

**Quick contribution rules:**
- One item per PR
- Include a brief description (not just a link)
- Check that the link works and the project is actively maintained
- Follow the existing format

## License

[CC0 — Public Domain](LICENSE)
```

---

## Organization Profile (.github repo)

For `.github` repositories that define an organization's GitHub profile, default community health files, and contribution guidelines.

```markdown
# Organization Name

Brief tagline or mission statement.

## About Us

2-3 sentences: who we are, what we build, and what we care about.

## Our Projects

| Project | Description | Status |
|---------|-------------|--------|
| [project-a](https://github.com/org/project-a) | One-line description | Active |
| [project-b](https://github.com/org/project-b) | One-line description | Active |
| [project-c](https://github.com/org/project-c) | One-line description | Maintenance |

## Getting Involved

- **Use our projects** — Start with [Project A](link), our most popular tool
- **Report bugs** — Open an issue in the relevant project repository
- **Contribute code** — See our [contribution guidelines](CONTRIBUTING.md)
- **Join discussions** — [GitHub Discussions](link) or [Discord/Slack](link)

## Community Standards

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## Contact

- **Website:** [https://org-website.com](link)
- **Twitter/X:** [@orgname](link)
- **Email:** contact@org.com
```

---

## Resource Hub / Topic Collection

For repositories that aggregate resources around a specific topic without following the strict "awesome list" format — think study guides, roadmaps, cheat sheets, or reference collections.

```markdown
# Topic Name — Resource Collection

One sentence: what this collection covers and who it's for.

[![Stars](https://img.shields.io/github/stars/USER/REPO)](https://github.com/USER/REPO)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Why This Exists

2-3 sentences on the gap this fills. What was hard to find before this collection existed?

## How to Use This

Explain the intended reading order or navigation strategy:
- Start with [Section X] if you're a beginner
- Jump to [Section Y] for specific reference
- Browse by [category/difficulty/chronology]

## Contents

### Section A: Fundamentals

Brief intro to this section.

| Resource | Type | Level | Description |
|----------|------|-------|-------------|
| [Name](link) | Article | Beginner | What you'll learn |
| [Name](link) | Video | Beginner | What you'll learn |
| [Name](link) | Tool | Any | What it does |

### Section B: Intermediate

Brief intro.

| Resource | Type | Level | Description |
|----------|------|-------|-------------|
| [Name](link) | Tutorial | Intermediate | What you'll learn |
| [Name](link) | Book | Intermediate | What it covers |

### Section C: Advanced

Brief intro.

| Resource | Type | Level | Description |
|----------|------|-------|-------------|
| [Name](link) | Paper | Advanced | Key contribution |
| [Name](link) | Course | Advanced | What you'll learn |

## Contributing

We welcome additions! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

Before submitting:
- Verify the resource is high-quality and still available
- Add it to the appropriate section with a brief description
- Keep descriptions concise (one line)

## License

[CC BY 4.0](LICENSE)
```

---

## Community-Specific Writing Tips

**Navigation is everything.** Community repos live or die by how easy they are to browse. Use a table of contents, clear categories, and consistent formatting.

**Make contributing dead-simple.** These repos thrive on community contributions. Put contribution guidelines in the README itself (not just a linked file) and keep the bar low for first-time contributors.

**Freshness matters.** Curated lists with dead links lose trust fast. Consider adding a "last verified" date or automated link checking via CI.

**Badges signal legitimacy.** The Awesome badge, PRs Welcome badge, and license badge are near-universal for community repos. They signal "this is maintained and open to contributions."

**Consistent formatting is critical.** Every entry should follow the same pattern: `[Name](link) — Description.` Inconsistency makes the list feel unmaintained.
