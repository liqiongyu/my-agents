# Session-To-JWT Auth Migration Implementation Plan

## Complexity Gate
This work requires the heavy planning path rather than a lightweight task list:
- It spans four auth participants: the API gateway, two backend services, and the admin console.
- It is a staged migration with compatibility requirements rather than a greenfield replacement.
- It needs explicit rollback handling, observability, and rollout gates.
- Incorrect sequencing could create either auth bypass risk or client-breaking regressions.

## Preconditions
- Direction is already chosen: JWT is the target auth model.
- A prior planner session already mapped the codebase, so execution should begin from that handoff rather than rediscovering ownership.
- The remaining planning work is execution design: phase ordering, compatibility handling, verification, and rollback.
- Before implementation starts, attach the planner handoff to this plan or append an execution appendix with the exact file paths, entrypoints, and owners.

## Goal
Migrate the platform from session-based authentication to JWT-based authentication across the API gateway, two backend services, and the admin console without breaking existing clients, while preserving a safe rollback path and enough observability to run the migration in phases.

## Scope
- Introduce a JWT issuance, validation, and claim model that can coexist temporarily with the current session model.
- Update the API gateway to accept, validate, forward, and observe JWT-authenticated traffic.
- Update both backend services to trust JWT-derived identity and authorization context.
- Update the admin console to obtain, store, refresh, and send JWT credentials safely.
- Preserve compatibility for existing clients during the migration window through dual-read or bridge behavior.
- Add rollout controls, telemetry, and operational runbooks for phased enablement and rollback.

## Not In Scope
- Replacing the identity provider or redesigning login UX from first principles.
- Full authorization model redesign beyond what is needed to preserve current behavior.
- Mobile or third-party client rewrites beyond the compatibility measures needed to avoid breakage.
- Cross-org SSO, OAuth provider expansion, or fine-grained RBAC redesign unless already required by the current system.
- Long-term decommissioning work after the migration stabilizes, except where called out as a final cleanup phase.

## What Already Exists
- The current platform uses session-based authentication.
- The auth boundary spans an API gateway, two backend services, and an admin console.
- Existing clients must continue working during the migration, so compatibility is a hard constraint rather than a nice-to-have.
- The team already chose JWT as the target direction.
- A planner session already mapped the codebase, but that artifact is not attached in this workspace, so code-level file paths and framework-specific details should be filled in from that handoff before execution starts.

## Constraints
- No client-breaking auth cutover.
- Gateway and services must remain able to authenticate the same user identity during the migration window.
- Admin console token storage must avoid weakening security relative to the current session model.
- JWT rollout must be observable enough to distinguish token issuance, validation, expiry, refresh, and authorization failures.
- Rollback must be operationally simple and fast, ideally through flags or config instead of emergency code changes.

## Assumptions
- The current session system already has a canonical user identity and authorization source that JWT claims can mirror.
- The gateway is the narrowest control point and is the best place to add compatibility behavior and telemetry first.
- The two backend services currently receive user context either from gateway forwarding or from shared session validation logic.
- The admin console is a browser application and can be updated independently of external clients.
- A shared secret or asymmetric key infrastructure can be introduced without blocking on unrelated platform changes.
- Existing clients can keep using session cookies during the transition even after JWT support is introduced.

## Open Decisions
- Signing model: symmetric secret vs asymmetric keypair with `kid`-based rotation.
- Token topology: access token only vs access + refresh token pair.
- Claim source of truth: gateway-issued normalized claims vs service-local enrichment on each request.
- Backward-compatibility strategy: gateway translates session to internal JWT, or services support both session and JWT directly for a limited period.
- Browser storage and refresh strategy for the admin console: HttpOnly cookies carrying JWTs vs in-memory access token plus secure refresh path.
- Revocation approach: short TTL only, denylist, session-version claim, or user-token-version lookup.
- Exact deprecation criteria for session-based auth per client class.

## Scope Challenge
- Do not combine protocol migration and authorization redesign. Preserve the current authorization semantics first; redesign roles/scopes later if needed.
- Do not migrate every client at once. The safe slice is dual-stack gateway first, then backend trust, then admin console defaulting to JWT, then explicit client cutover.
- Prefer one normalized principal contract across gateway and services. A migration that preserves both session-shaped and JWT-shaped principals deep into the system will create long-lived complexity.
- Keep session compatibility available longer than feels necessary. The cost of a longer dual-stack period is lower than emergency client recovery.
- If the planner handoff reveals major divergence between the two backend services, split their migrations after the gateway phase rather than forcing identical sequencing.

## Phases

### Phase 0: Align The Contract And Migration Envelope
- Outcome:
  A single migration contract exists for identity claims, token lifetime, refresh behavior, service trust boundaries, and compatibility rules.
- Files / components:
  Auth design doc, gateway auth middleware, shared auth library if one exists, service auth adapters, admin console auth client, deployment config, secret management.
- Steps:
  1. Convert the planner's repo mapping into an execution appendix: actual files, middleware entrypoints, auth helpers, login handlers, and client request utilities.
  2. Document the current session flow end to end: login, cookie/session creation, gateway enforcement, service identity propagation, logout, expiry, and admin console bootstrapping.
  3. Define the JWT contract: issuer, audience, subject, tenant/org fields if applicable, roles/scopes, issued-at, expiry, session-version or revocation field, and optional `kid`.
  4. Decide where tokens are minted and refreshed, and which component is authoritative for auth failures and refresh retries.
  5. Define bridge behavior for old clients, including whether session-authenticated requests are translated into an internal JWT at the gateway or continue through the old path temporarily.
  6. Introduce feature flags for issuance, acceptance, forwarding, refresh, and enforcement separately.
  7. Write a compatibility matrix that lists each client class, current auth method, target auth method, migration owner, and rollback dependency.
- Verify:
  Approved migration contract, explicit file/component inventory from the planner handoff, and a dependency matrix covering gateway, both services, admin console, secrets, and deployment config.
- Depends on:
  Existing planner handoff and current auth owners.

### Phase 1: Add Shared JWT Primitives Without Enabling Traffic
- Outcome:
  Token generation, validation, key loading, claim parsing, clock-skew handling, and telemetry exist in a disabled state.
- Files / components:
  Shared auth package or duplicated auth helpers, config schema, secret or key loader, structured logging, metrics definitions, test fixtures.
- Steps:
  1. Add a shared JWT module used by the gateway and both services, or define a strict compatibility suite if separate implementations are unavoidable.
  2. Implement token validation rules: issuer, audience, signature, expiry, not-before, skew tolerance, and malformed-token handling.
  3. Add token issuance logic in the designated issuer component, but keep it behind a flag.
  4. Add metrics and logs for issue, validate, reject, refresh, revoke, and fallback events with reason codes.
  5. Add golden test fixtures for valid, expired, wrong-audience, wrong-issuer, tampered, rotated-key, and revoked-token cases.
  6. If asymmetric signing is chosen, add `kid` support and key rotation scaffolding now rather than later.
  7. Define one shared principal schema and conversion helpers so every downstream component consumes the same identity shape.
- Verify:
  Unit tests for validation and issuance pass; compatibility fixtures are identical across gateway and services; disabled-path deploy shows no behavior change.
- Depends on:
  Phase 0 contract decisions on claims and signing.

### Phase 2: Make The API Gateway Dual-Stack
- Outcome:
  The gateway can authenticate both existing session traffic and JWT traffic, normalize identity, and emit consistent downstream context without forcing clients to switch yet.
- Files / components:
  Gateway auth middleware, request context builder, downstream header propagation, auth error mapping, observability dashboards, feature flags.
- Steps:
  1. Add JWT acceptance to the gateway auth middleware while preserving the current session path.
  2. Normalize both auth modes into one internal request principal shape so downstream logic does not fork unnecessarily.
  3. Decide and implement downstream propagation: signed internal JWT, forwarded claims headers, or gateway-populated identity context.
  4. Add per-request markers for auth mode (`session`, `jwt`, `bridged-session`) to logs and metrics.
  5. Keep enforcement in permissive mode initially: accept JWT when present, continue accepting sessions, and prefer stable current behavior on ambiguity.
  6. Add shadow validation if useful: when a session-authenticated request arrives, generate or simulate JWT validation and record mismatches without impacting the response.
  7. Add a gateway kill switch that can disable JWT enforcement independently of token parsing and telemetry.
- Verify:
  Integration tests cover session-only, JWT-only, missing-auth, expired-token, malformed-token, and mixed-header cases; gateway dashboards show auth mode splits and zero unexpected regressions in session traffic.
- Depends on:
  Phase 1 shared primitives.

### Phase 3: Update Backend Service A
- Outcome:
  Service A authorizes requests from normalized JWT-derived identity without breaking existing gateway-mediated session traffic.
- Files / components:
  Service A auth middleware, authorization helpers, request principal model, service tests, internal client calls if Service A fans out.
- Steps:
  1. Replace direct session assumptions in Service A with a normalized principal abstraction.
  2. Accept the gateway-forwarded JWT or normalized identity payload according to the contract from Phase 2.
  3. Preserve compatibility for requests still originating from session-authenticated clients through the gateway bridge behavior.
  4. Audit authorization checks that currently read session state directly and migrate them to claims or explicit lookups.
  5. Add service-local observability to detect claim mismatches, missing roles/scopes, and principal-construction failures.
  6. If Service A makes downstream calls, update those calls to propagate the normalized auth context rather than any session-derived state.
- Verify:
  Contract tests between gateway and Service A pass; authorization regression suite passes for current user roles; canary traffic shows equal success rates for session-bridged and JWT-native requests.
- Depends on:
  Phase 2 dual-stack gateway.

### Phase 4: Update Backend Service B
- Outcome:
  Service B handles JWT-derived identity with the same normalized contract and compatibility posture as Service A.
- Files / components:
  Service B auth middleware, authorization helpers, request principal model, service tests, downstream call adapters.
- Steps:
  1. Repeat the Service A migration pattern, but explicitly review Service B for any divergent session coupling or background-job auth assumptions.
  2. Migrate service authorization to claims or explicit identity lookups instead of session reads.
  3. If Service B calls Service A or vice versa, standardize service-to-service auth now so downstream requests do not reintroduce session dependencies.
  4. Add alerting for token parsing failures and authorization mismatches specific to Service B.
  5. Add a service-local fallback mode that trusts the gateway's normalized principal if token-specific parsing has to be disabled during containment.
- Verify:
  Contract tests and regression tests pass; service-to-service flows continue working; dashboard parity with pre-migration success and latency baselines holds.
- Depends on:
  Phase 2, plus preferably the validated pattern from Phase 3.

### Phase 5: Migrate The Admin Console To JWT
- Outcome:
  The admin console authenticates with JWTs safely and continues to function during the dual-stack window.
- Files / components:
  Login flow, auth bootstrap, API client/interceptor, logout flow, refresh mechanism, route guards, admin session UI, browser security settings.
- Steps:
  1. Update the login/bootstrap flow to receive JWT credentials from the chosen issuer path.
  2. Implement refresh behavior and expired-token handling before switching default request auth mode.
  3. Store credentials using the approved browser security model; avoid introducing `localStorage` token persistence unless there is an explicit security sign-off.
  4. Update the API client to send JWT auth by default and gracefully handle compatibility responses during rollout.
  5. Keep logout semantics aligned with the session world during the migration window so users do not experience partial sign-out.
  6. Add UI-visible handling for expired or invalid auth states that avoids loops and preserves operator workflows.
  7. Add instrumentation around bootstrap, refresh success, refresh failure, forced re-auth, and auth-loop detection.
- Verify:
  End-to-end admin login, refresh, logout, idle-expiry, hard-refresh, multi-tab, and permission-change scenarios pass in staging; browser security review is completed.
- Depends on:
  Phase 2 and at least one validated backend service path.

### Phase 6: Controlled Rollout And Client Migration
- Outcome:
  JWT usage increases in production through measurable stages while session compatibility remains available as a safety net.
- Files / components:
  Feature-flag config, deployment manifests, dashboards, alert rules, runbooks, client communication artifacts if external clients exist.
- Steps:
  1. Enable JWT issuance for internal/admin flows first while leaving session acceptance fully on.
  2. Roll out JWT acceptance by environment: local, dev, staging, canary, then production percentage slices.
  3. Track auth success/failure, 401/403 rates, refresh churn, latency, and auth-mode distribution at each stage.
  4. Migrate known first-party clients to JWT explicitly; leave unknown or long-tail clients on the compatibility path until measured safe.
  5. Define hard gates for advancing rollout, such as stable auth error rates, no unexplained role mismatches, and successful expiry/refresh behavior under load.
  6. Keep session revocation and support tooling live until JWT traffic is dominant and stable.
  7. Require an explicit go/no-go review after each environment promotion with engineering and support sign-off.
- Verify:
  Production canary metrics meet predefined thresholds for at least one full token-lifetime cycle plus peak traffic windows; support team confirms no new auth incident pattern.
- Depends on:
  Phases 2 through 5.

### Phase 7: Enforce JWT As Primary And Retire Session Dependencies
- Outcome:
  JWT becomes the primary auth mechanism; session logic is either removed or reduced to an explicitly temporary fallback path with an expiry date.
- Files / components:
  Gateway fallback logic, service session adapters, admin console compatibility code, secret/session store config, operational runbooks.
- Steps:
  1. Flip the gateway default to JWT-first enforcement while keeping emergency fallback behind an operator-only flag.
  2. Remove direct session reads from both backend services.
  3. Remove admin console session-specific compatibility code once production data shows no dependency remains.
  4. Decommission unused session infrastructure only after rollback windows and client cutoffs are complete.
  5. Rotate JWT keys or secrets once the steady-state path is live to validate operational ownership of the new model.
  6. Archive the migration runbook into steady-state auth operations documentation, including emergency fallback usage and key-rotation procedures.
- Verify:
  No production traffic depends on session auth outside approved fallback paths; rollback drill still works; post-migration audit confirms session code is no longer on critical paths.
- Depends on:
  Successful completion of the controlled rollout.

## Verification
- Pre-implementation:
  Confirm the planner handoff contains exact file paths, auth entrypoints, shared libraries, and current login/session flows.
- Automated:
  Unit tests for token issue/validate/revoke behavior; contract tests between gateway and each service; end-to-end admin console auth flows; regression tests for existing session clients during dual-stack phases.
- Operational:
  Dashboards segmented by auth mode, service, client type, response code, and rejection reason.
- Staging:
  Run mixed-mode traffic where some requests use sessions and others use JWTs against the same environments.
- Security:
  Review signing-key management, browser token handling, refresh flow, logout semantics, replay exposure, and revocation behavior.
- Rollout gate:
  Require one successful canary window covering login, refresh, expiry, logout, and permission changes before expanding production rollout.

## Verification By Phase
- Phase 0:
  Contract review completed, compatibility matrix approved, and every component owner agrees on the normalized principal schema.
- Phase 1:
  JWT fixture suite passes in CI; disabled deploy causes no request-path changes; key-loading failures fail closed in tests.
- Phase 2:
  Gateway can process session and JWT traffic concurrently; shadow-validation mismatch rate is understood and triaged before downstream enforcement.
- Phase 3:
  Service A role and permission regression suite matches pre-migration outcomes for representative user classes.
- Phase 4:
  Service B plus service-to-service flows show parity on auth success rate, latency, and error mix.
- Phase 5:
  Admin console staging soak covers refresh, logout, hard refresh, and multi-tab behavior for at least one full token lifetime.
- Phase 6:
  Each rollout promotion meets predefined SLO and auth-specific thresholds before the next promotion.
- Phase 7:
  A rollback drill succeeds after JWT-primary enforcement and before session infrastructure is retired.

## Risks
- Risk:
  Claims do not faithfully represent the current session-derived authorization context.
  Impact:
  Silent privilege loss or escalation after migration.
  Mitigation:
  Shadow-compare session-derived and JWT-derived principals before enforcement and add authorization regression suites per role.

- Risk:
  Token storage in the admin console weakens browser-side security.
  Impact:
  Increased token theft or replay exposure.
  Mitigation:
  Prefer HttpOnly cookie transport or in-memory access tokens with secure refresh flow; perform a focused browser security review before rollout.

- Risk:
  Services diverge in JWT validation behavior.
  Impact:
  Inconsistent auth outcomes across the platform.
  Mitigation:
  Use a shared library where possible and a shared compatibility fixture suite where not.

- Risk:
  Old clients depend on undocumented session behavior.
  Impact:
  Client breakage during rollout.
  Mitigation:
  Keep gateway dual-stack support, instrument auth mode by client, and cut over only after observed usage drops below the agreed threshold.

- Risk:
  Revocation and logout semantics become weaker than the current session model.
  Impact:
  Users retain access longer than intended after logout or permission changes.
  Mitigation:
  Use short-lived access tokens plus refresh control, token-version checks, or denylist support where required by current security posture.

## Rollback Or Containment
- Rollback ladder:
  1. Disable JWT-primary enforcement.
  2. Keep JWT parsing and telemetry on if they are not causing failures.
  3. Revert affected clients or the admin console to the session-compatible path.
  4. Re-enable service-specific fallback behavior.
  5. If needed, disable JWT issuance defaults and return to session-primary traffic.
  6. Only retire session infrastructure after the ladder has been proven unnecessary for one full rollback window.

- Trigger:
  Elevated 401/403 rates, auth refresh loops, role mismatches, client breakage, or unexplained login failures after enabling a JWT phase.
  Action:
  Disable the relevant feature flag in reverse order of rollout: JWT enforcement off first, then JWT issuance defaults off, while leaving validation telemetry on if safe.

- Trigger:
  A service-specific regression appears after service migration.
  Action:
  Keep the gateway in dual-stack mode, route affected traffic back through the session-compatible path, and revert only the impacted service's principal enforcement if the architecture allows.

- Trigger:
  Admin console browser-side failures appear after JWT enablement.
  Action:
  Re-enable session-backed admin auth path, keep backend JWT support intact, and isolate the console migration from the service rollout.

- Trigger:
  Signing key, issuer, or audience misconfiguration causes widespread validation failures.
  Action:
  Restore the prior signing config or disable JWT acceptance temporarily while preserving the existing session path.

- Trigger:
  JWT steady state is live but an emergency rollback is required after session infrastructure has been partially retired.
  Action:
  Retain session infrastructure and compatibility toggles until at least one full rollback window passes after JWT-primary enforcement; do not decommission session stores or middleware earlier.

## Next Step
Append the planner handoff as an execution appendix to this document with:
- exact file paths for gateway auth middleware, both services' auth entrypoints, admin console auth/bootstrap code, shared request/client helpers, and deployment/config surfaces
- the owner for each component and the feature flags that can gate it
- the currently known client classes that still depend on session auth

Once that appendix exists, the first implementation milestone should be Phase 0 approval plus Phase 1 shared JWT primitives behind flags. That is the smallest slice that reduces risk without changing live traffic behavior.

## Next Step
Take the planner's codebase handoff and convert Phase 0 into a concrete execution appendix: exact repositories, files, middleware entrypoints, token issuer location, auth helpers, and test suites. Once that appendix is filled in, execution should start with Phase 1 and Phase 2 together in a feature-flagged branch, because those phases create the shared primitives and reversible gateway compatibility layer the rest of the rollout depends on.
