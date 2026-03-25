# Content Review Checklist

Detailed checks for non-code content types: documentation, API specs, design documents, PRDs, and configuration. Read this file when content type detection identifies Documentation, API Spec, Design Doc, or Configuration files.

## Table of Contents
- [Documentation](#documentation)
- [API Specifications](#api-specifications)
- [Design Documents & PRDs](#design-documents--prds)
- [Configuration](#configuration)

---

## Documentation

Apply when reviewing READMEs, guides, tutorials, API docs, changelogs, or inline documentation.

### Accuracy
- Do descriptions match actual code behavior? (Critical when code and docs change in the same PR)
- Are code examples correct and runnable? Test mentally or check imports/function signatures
- Are version numbers, dependency names, and URLs current and valid?
- Are command-line examples correct? (flags, argument order, expected output)
- Do screenshots or diagrams reflect the current UI/architecture?

### Completeness
- Prerequisites: are required tools, versions, and setup steps documented?
- Happy path AND error cases: does the doc cover what happens when things go wrong?
- New features: does new functionality introduced in this PR have corresponding docs?
- Changelog: is there a changelog entry for user-facing changes?
- API endpoints: are all parameters, response codes, and edge cases documented?
- Environment variables: are all required env vars documented with defaults and descriptions?

### Clarity
- Audience fit: is the language appropriate? (Developer docs vs. user guides vs. API reference)
- Scannable structure: proper headings, short paragraphs, code blocks for commands
- First-use experience: can someone unfamiliar with the project follow the instructions?
- Ambiguity: vague instructions ("configure the service appropriately"), unclear pronouns, missing context
- Examples: do examples cover realistic use cases, not just trivial ones?
- Ordering: are steps in the correct sequence? Are dependencies between steps clear?

### Consistency
- Terminology: same concept uses same term throughout (don't mix "user"/"customer"/"account holder")
- Formatting: consistent use of code blocks, bold, headings, list styles
- Tone: consistent voice (imperative vs. descriptive, formal vs. casual)
- Cross-references: internal links are valid, external links aren't broken
- Structure: follows the project's existing doc conventions

---

## API Specifications

Apply when reviewing OpenAPI/Swagger specs, GraphQL schemas, protobuf definitions, or similar.

### Backwards Compatibility
- Removed or renamed fields/endpoints → breaking change, needs version bump
- Changed field types (string → number, required → optional or vice versa)
- Changed response envelope structure
- Removed enum values that existing clients may rely on

### Naming & Consistency
- Consistent casing: camelCase, snake_case, or kebab-case — pick one and stick to it
- Verb consistency in endpoints: `GET /users`, `POST /users`, not `GET /fetchUsers`
- Pluralization: consistent plural/singular for collection vs. single resource
- Parameter naming: same concept uses same name across endpoints

### Completeness
- All error responses documented (400, 401, 403, 404, 409, 422, 500 as applicable)
- Request/response examples for each endpoint
- Required vs. optional parameters clearly marked
- Pagination parameters for list endpoints
- Rate limiting documentation

### Validation & Constraints
- String fields: min/max length, pattern/regex where appropriate
- Numeric fields: min/max values, integer vs. float
- Enum fields: all valid values listed
- Array fields: min/max items
- Required fields marked correctly

---

## Design Documents & PRDs

Apply when reviewing RFCs, ADRs, architecture documents, PRDs, technical specifications.

### Feasibility
- Can this be implemented with current technology, team skills, and infrastructure?
- Are performance requirements realistic given the constraints?
- Is the timeline achievable given the scope?
- Are there hidden dependencies on other teams or external services?

### Completeness
- Problem statement: is the "why" clearly articulated?
- Edge cases: are boundary conditions, failure modes, and error scenarios addressed?
- Rollback plan: what happens if this fails in production? How do we undo it?
- Migration path: for changes to existing systems, how do we get from here to there?
- Non-goals: what is explicitly out of scope? (Prevents scope creep)
- Security considerations: has the security impact been assessed?
- Observability: how will we know this is working? Metrics, alerts, dashboards?

### Trade-offs
- Are alternatives listed with pros/cons?
- Is the rationale for the chosen approach clear and well-argued?
- Are the trade-offs acknowledged honestly? (Every design has downsides)
- Cost analysis: infrastructure cost, development cost, maintenance burden

### Acceptance Criteria
- Are success metrics defined and measurable?
- Are user stories complete with acceptance criteria?
- Is there a clear definition of "done"?
- Are there concrete examples of expected behavior?

### Consistency
- Does this align with existing architecture patterns and conventions?
- Does it conflict with any other in-flight designs or open RFCs?
- Does it follow the project's design document template/format?

### Dependencies
- External service dependencies identified
- Team coordination needs (who needs to be involved?)
- Data migration requirements
- Feature flag strategy for gradual rollout
- Timeline dependencies and critical path

---

## Configuration

Apply when reviewing environment files, YAML/JSON/TOML configs, CI pipelines.

### Security
- No secrets, tokens, or passwords in committed config files
- `.env.example` has placeholders, not real values
- Sensitive config values reference secret managers or env vars
- CI/CD secrets use the platform's secret storage, not inline values

### Correctness
- Syntax valid (YAML indentation, JSON brackets, TOML tables)
- Values are appropriate for the target environment
- Feature flags have sensible defaults
- Timeouts and retry values are reasonable (not too aggressive, not too lax)

### Consistency
- Format matches existing project conventions
- Naming conventions consistent with other config files
- Environment-specific overrides are clearly separated (dev/staging/prod)
- Comments explain non-obvious values

### CI/CD Specific
- Pipeline steps in correct order (install → build → test → deploy)
- Cache keys are correct (won't use stale caches)
- Secrets not echoed in logs
- Failure conditions handled (what happens if a step fails?)
- Timeout values set to prevent hanging jobs
