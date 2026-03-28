# Scope Rules

Use these rules before broad discovery starts.

## Default Breadth

Default to cross-platform skill research. A normal search should look across
multiple relevant surfaces such as:

- Claude Code skills
- Codex skills
- other skill-like agent surfaces when they are likely to teach reusable patterns

The point of this skill is to find portable ideas, not to stay trapped inside a
single ecosystem by accident.

## User-Supplied Scope Wins

If the user already supplied specific URLs, repositories, platforms, or a
bounded candidate set, treat that scope as binding.

Examples:

- "Compare only these three repos"
- "Stay inside Codex skills"
- "Use our local skill plus the official OpenAI and Anthropic examples"

Do not widen the search unless the user explicitly asks for broader coverage.

## How To Narrow

When the scope is constrained:

1. skip broad candidate hunting
2. collect from the supplied sources directly
3. say that the comparison is intentionally narrow
4. keep the output as a focused Fusion Report or comparison artifact

## Local Skill Check

If the work is happening inside a skill repository, check for existing local
skills on the same topic before searching the wider ecosystem. Sometimes the
right answer is "update the local skill and only use external sources as
comparison anchors."
