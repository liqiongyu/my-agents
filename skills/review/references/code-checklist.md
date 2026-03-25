# Code Review Checklist

Detailed checks to apply when reviewing application code changes. Read this file when content type detection identifies Code or Frontend files.

## Table of Contents
- [Security](#security)
- [Performance](#performance)
- [Correctness](#correctness)
- [Design](#design)
- [Maintainability](#maintainability)
- [Testing](#testing)
- [Frontend-Specific](#frontend-specific)
- [Database-Specific](#database-specific)
- [Infrastructure-Specific](#infrastructure-specific)

---

## Security

Priority order — check the highest-impact items first:

**Injection**
- SQL: string concatenation or f-strings in queries → use parameterized queries
- Command: `subprocess` with `shell=True` + user input, `exec()`, `eval()` → validate and sanitize
- XSS: unescaped user input in HTML output, `render_template_string()` with user data, `dangerouslySetInnerHTML` → use template escaping
- Path traversal: user-controlled file paths without sanitization → use `secure_filename()`, validate against allowed directories

**Authentication & Authorization**
- Missing auth checks on endpoints that modify data
- Privilege escalation: user A can act on user B's resources (IDOR)
- Insecure token handling: tokens in URLs, localStorage without HttpOnly, no expiration
- `requireRole` imported but not applied (a common copy-paste miss)

**Secrets & Data Exposure**
- Hardcoded credentials, API keys, tokens (especially `sk_live_`, `AKIA`, `ghp_` prefixes)
- Sensitive data in responses: passwords, hashes, SSN, PII in API output
- Sensitive data in logs or error messages
- Debug mode enabled in production config (`debug=True`, `host="0.0.0.0"`)

**Cryptography**
- MD5 or SHA1 for password hashing → use bcrypt/scrypt/argon2
- Insufficient key lengths, ECB block cipher mode
- Custom crypto implementations (almost always wrong)

**Other**
- SSRF: unvalidated URLs from user input used in server-side requests
- CSRF: missing tokens on state-changing endpoints
- Unsafe deserialization of user-controlled input (pickle, yaml.load)
- Race conditions: TOCTOU (time-of-check-to-time-of-use), check-then-act without locks
- Dependencies: newly added packages with known CVEs, unnecessary dependencies

## Performance

**Database**
- N+1 queries: loop that issues one query per iteration → use eager loading / joins
- Missing indexes on columns used in WHERE, JOIN, ORDER BY for new query patterns
- Unbounded queries: `SELECT *` without LIMIT on potentially large tables
- Full table scans on large tables

**Memory & Compute**
- Unbounded collections: growing lists/maps without size limits
- Large object retention: loading entire files into memory when streaming is possible
- Missing pagination on list endpoints
- O(n²) algorithms where O(n) or O(n log n) is possible
- Blocking I/O on hot paths (sync file reads, DNS lookups in request handlers)

**Caching & Network**
- Cache opportunities missed (repeated identical DB/API calls)
- Cache with no invalidation strategy (stale data risk)
- Chatty API calls that could be batched
- Missing compression for large responses

## Correctness

- Off-by-one errors, incorrect boundary conditions
- Incorrect boolean logic, unreachable branches, swapped arguments
- Null/undefined: missing null checks before dereferencing, especially on DB query results
- Empty collections: code assumes non-empty arrays/maps
- Error handling: swallowed exceptions (`catch {}` with no logging), generic catches that hide bugs, missing error propagation to callers
- Type safety: unchecked type assertions, `any` abuse in TypeScript, raw types in Java/Go
- API contracts: breaking changes without versioning, changed response shapes
- Concurrency: deadlocks, data races, atomicity violations

## Design

- SOLID violations: god classes, broken interface segregation, concrete dependencies where abstractions fit
- Inappropriate patterns: over-engineering simple logic with factories/strategies
- Missing patterns: repeated manual work that a pattern solves
- Layer violations: UI code calling DB directly, circular dependencies
- API design: inconsistent naming, confusing parameter ordering, missing idempotency on writes
- LLM code smells: placeholder implementations (`// TODO: implement`), overly generic abstractions solving no concrete problem, hallucinated API calls, copy-paste blocks with only superficial variation

## Maintainability

- Unclear naming: single-letter variables outside tiny loops, misleading names
- Deep nesting: >3 levels of indentation (refactor with early returns or extraction)
- Long functions: >~50 lines suggests the function does too much
- Magic numbers: unexplained numeric literals → extract to named constants
- Duplication: copy-pasted blocks (flag if 3+ occurrences; 2 is usually fine)
- Dead code: unused imports, unreachable branches, commented-out code, deprecated symbols
- Consistency: deviations from existing codebase conventions (but don't block if linters/formatters handle it)

## Testing

- New logic paths without corresponding tests
- Edge cases untested (null, empty, boundary values)
- Tests that pass but don't assert meaningful behavior ("happy path only")
- Fragile tests coupled to implementation details (testing private methods, asserting exact strings)
- Tests depending on external services without mocks
- Tests depending on execution order
- Bug fixes: is there a test that reproduces the original bug?
- Test data: hardcoded test data that masks bugs

## Frontend-Specific

Apply when files match `*.tsx`, `*.vue`, `*.css`, `*.scss`, `components/`, etc.

**React**
- `useEffect` without dependency array → infinite re-render loop
- Missing `useMemo` / `useCallback` for expensive computations or callback props
- State updates that trigger unnecessary re-renders
- Missing cleanup in effects (AbortController, event listeners, timers)
- Unsafe `as` type assertions on component props

**General Frontend**
- Large bundle imports: importing entire libraries when tree-shakeable alternatives exist
- Missing virtualization for long lists (>100 items)
- Unoptimized images (no lazy loading, missing width/height, no srcset)
- Inline styles creating new object references every render
- Memory leaks: unreleased object URLs, uncleared intervals
- Accessibility: missing alt text, no keyboard navigation, insufficient color contrast
- CSV/data export: missing escaping for special characters (formula injection risk)
- Search inputs: missing debounce for API-backed search

## Database-Specific

Apply when files match `*.sql`, `migrations/`, `schema/`.

- Migration safety: will this lock a large table? Can it run without downtime?
- Rollback: is there a reverse migration? Has it been tested?
- Index coverage: new query patterns need supporting indexes
- Data integrity: foreign keys, CHECK constraints, NOT NULL on required fields
- Backwards compatibility: column drops/renames need coordination with app code
- Data migration: is existing data handled correctly during schema changes?

## Infrastructure-Specific

Apply when files match `Dockerfile`, `*.tf`, CI/CD configs, `k8s/`.

- Secrets in config files → use secret managers / env vars
- Missing CPU/memory limits in containers
- Unbounded autoscaling without cost guardrails
- Overly permissive IAM roles / security groups
- Exposed ports not needed by the service
- Missing network policies
- Idempotency: can this be applied multiple times safely?
- Environment parity: does this work in dev, staging, AND prod?
