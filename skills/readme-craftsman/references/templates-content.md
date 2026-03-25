# README Templates: Content & Education Projects

Read this file when generating a README for documentation sites, tutorials/courses, or blogs/content collections.

---

## Table of Contents

- [Documentation / Knowledge Base](#documentation--knowledge-base)
- [Tutorial / Course](#tutorial--course)
- [Blog / Content Collection](#blog--content-collection)

---

## Documentation / Knowledge Base

For documentation sites, wikis, handbooks, specifications, or knowledge bases built with tools like MkDocs, Docusaurus, VitePress, mdBook, or plain Markdown.

```markdown
# Project Name Docs

One sentence: what this documentation covers and who it's for.

[![Docs](https://img.shields.io/badge/docs-live-blue)](https://docs-url.example.com)
[![License](https://img.shields.io/badge/license-CC%20BY%204.0-lightgrey.svg)](LICENSE)

## What's Inside

Brief overview of what this documentation covers. If it's a product/project's docs, link to the product.

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](docs/getting-started.md) | First-time setup and orientation |
| [User Guide](docs/user-guide/) | Day-to-day usage |
| [API Reference](docs/api/) | Complete API documentation |
| [Architecture](docs/architecture.md) | System design and decisions |
| [FAQ](docs/faq.md) | Frequently asked questions |

## Reading Locally

\```bash
# Install dependencies
pip install mkdocs mkdocs-material

# Serve locally with live reload
mkdocs serve
\```

Then open `http://localhost:8000`.

## How This Is Organized

\```
docs/
  getting-started.md     # First-time orientation
  user-guide/            # Task-oriented guides
  api/                   # Reference documentation
  architecture.md        # Design decisions
  contributing.md        # How to write docs
\```

## Contributing

We welcome documentation improvements! See [Contributing Guide](CONTRIBUTING.md) for:
- How to add a new page
- Style guide and conventions
- How to preview changes locally

## License

Content licensed under [CC BY 4.0](LICENSE).
```

---

## Tutorial / Course

For learning materials: programming tutorials, online courses, workshops, bootcamp content, or any progressive educational material.

```markdown
# Course / Tutorial Title

One sentence: what you'll learn and who this is for.

![Course preview or diagram](assets/preview.png)

## What You'll Learn

By the end of this course, you will be able to:
- Learning outcome 1
- Learning outcome 2
- Learning outcome 3

## Prerequisites

Before starting, you should:
- Know [specific skill/tool] at a [beginner/intermediate] level
- Have [tool/runtime] installed (version X+)
- Be comfortable with [concept]

## Curriculum

| # | Module | Topic | Duration |
|---|--------|-------|----------|
| 01 | [Getting Started](01-getting-started/) | Setup and first steps | ~30 min |
| 02 | [Fundamentals](02-fundamentals/) | Core concepts | ~1 hr |
| 03 | [Building](03-building/) | Hands-on project | ~2 hr |
| 04 | [Advanced](04-advanced/) | Deep dive topics | ~1.5 hr |
| 05 | [Project](05-project/) | Capstone project | ~3 hr |

Each module contains:
- `README.md` — Lesson content with explanations
- `exercises/` — Practice problems
- `solutions/` — Reference solutions (try the exercises first!)

## Getting Started

\```bash
git clone https://github.com/USER/REPO.git
cd REPO

# Install any dependencies
npm install  # or pip install -r requirements.txt

# Start with module 01
cd 01-getting-started
\```

## How to Use This

1. **Read the module README** for concepts and explanations
2. **Try the exercises** before looking at solutions
3. **Build the mini-projects** — this is where learning sticks
4. Progress is linear — each module builds on the previous one

> [!TIP]
> If you get stuck, check the `solutions/` directory or open an issue.

## Related Resources

- [Official Documentation](link) — Reference for the tools used
- [Companion Video Series](link) — Video walkthroughs (if available)
- [Community Forum](link) — Ask questions and discuss

## Contributing

Found an error or want to add content? See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Content: [CC BY-SA 4.0](LICENSE). Code examples: [MIT](LICENSE-CODE).
```

---

## Blog / Content Collection

For static blogs, newsletter archives, essay collections, or writing repositories powered by Hugo, Jekyll, Gatsby, Astro, or plain Markdown.

```markdown
# Blog / Publication Name

One sentence: what this blog/publication is about and who writes it.

## About

2-3 sentences describing the blog's focus, perspective, and what readers can expect. Link to the live site if published.

**Live site:** [https://your-blog.com](https://your-blog.com)

## Recent Posts

| Date | Title | Topic |
|------|-------|-------|
| 2025-03-15 | [Post Title](content/posts/post-slug.md) | Category |
| 2025-02-28 | [Post Title](content/posts/post-slug.md) | Category |
| 2025-02-10 | [Post Title](content/posts/post-slug.md) | Category |

## Topics

- **Topic A** — Brief description (X posts)
- **Topic B** — Brief description (X posts)
- **Topic C** — Brief description (X posts)

## Running Locally

\```bash
git clone https://github.com/USER/REPO.git
cd REPO
npm install  # or pip install, or brew install hugo
npm run dev  # or hugo server, or jekyll serve
\```

Open `http://localhost:1313` (Hugo) or `http://localhost:4000` (Jekyll).

## Writing a New Post

\```bash
# Create a new post
hugo new content/posts/my-new-post.md
\```

Posts use this frontmatter format:

\```yaml
---
title: "Post Title"
date: 2025-03-15
tags: ["topic-a", "topic-b"]
draft: false
---
\```

## Deployment

The site is deployed automatically via [GitHub Pages / Vercel / Netlify] when changes are pushed to `main`.

## License

Content: [CC BY 4.0](LICENSE). Theme/code: [MIT](LICENSE-CODE).
```

---

## Content-Specific Writing Tips

**For all content repos:**
- The README is the front door. Make it clear what readers will find and how to navigate.
- If there's a live site, link it prominently at the top.
- Content repos often have two audiences: readers and contributors. Address both.

**Table of Contents:**
Use a ToC for any content repo with more than 5-6 sections or documents. For large collections, use collapsible sections:
```markdown
<details>
<summary>Full post archive (50+ posts)</summary>

| Date | Title |
|------|-------|
| ... | ... |

</details>
```

**License clarity:**
Content repos often need dual licensing — one for prose (CC BY 4.0 is common) and one for code examples (MIT/Apache). Be explicit about which applies to what.
