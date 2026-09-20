# DevForge — Implementation Roadmap

Companion document to `AUDIT_REPORT.md`. This defines execution order, ownership (AI agent vs. developer), Done criteria per phase, and the Review & Patch protocol that governs every push.

**Sequencing principle:** fixes that unblock testability come before fixes that need to be tested. Security-critical items that are cheap to fix (Prisma singleton, Redis TLS, CORS dedup) move early even though they're not "Phase 0" in a strict dependency sense, because they're low-risk and high-value — no reason to sit on them. The one deliberately late item is the sandbox/Piston consolidation (Phase 4): it's the highest-impact fix but the highest-blast-radius one (it changes how every code-execution feature works), so it lands only once a test harness exists to catch regressions.

---

## Ground Rules for Every Phase

1. **One phase = one branch = one PR.** No phase merges into `main` without its Done criteria met.
2. **The agent never merges its own PR.** It opens the PR, posts a self-review summary against the Done criteria, and stops. The developer merges.
3. **No phase touches files outside its stated scope.** If the agent discovers an unrelated issue while working, it logs it in the PR description as a follow-up note — it does not fix it inline. This keeps diffs reviewable and keeps token spend predictable.
4. **Every phase that touches AI-service code must show a before/after token-cost estimate** (rough: prompt length in tokens × expected retry rate) in the PR description, per the brief's cost-optimization constraint.

---

## Phase 0 — Test Harness Bootstrap
**Why first:** every subsequent phase needs a way to prove it didn't break anything. Shipping fixes 1–13 from the audit with zero tests is how regressions get introduced while "fixing" bugs.

**Agent tasks:**
- Add Vitest to root + both workspaces; wire `turbo.json` `test` pipeline.
- Add Fastify `app.inject()` smoke tests for existing routes: `/health`, `/api/auth/register`, `/api/auth/login` (happy path + validation failure path).
- Add a minimal GitHub Actions workflow: `lint` → `typecheck` → `test` → `build`, triggered on PR to `main`.
- Add React Testing Library + one smoke test for `useAuthStore`.

**Developer tasks:**
- Provision a test database (or approve Testcontainers usage) and add its connection string as a GitHub Actions secret.
- Review and approve the CI workflow's trigger conditions (PR-only vs. also on push).

**Definition of Done (triggers push):**
- `npm run test` passes locally and in CI on a clean checkout.
- CI workflow runs green on the PR itself (i.e., the workflow file is validated by actually running, not just reviewed).
- No existing functionality changed — this phase is additive only.

---

## Phase 1 — Low-Risk, High-Value Backend Fixes
Addresses audit items #2, #6, #7, #13 (Prisma singleton, Redis TLS, CORS dedup, uncaught-exception handling). All mechanical, all covered by Phase 0's smoke tests.

**Agent tasks:**
- Replace all 17 `new PrismaClient()` instantiations with `import { prisma } from "@devforge/database"`. Delete the local declarations.
- Extract the CORS origin-check into a single exported function; use it in both the Fastify `cors` plugin and the `socket.io` `Server` constructor. Tighten `.vercel.app` matching to the project's specific preview pattern (developer must confirm the pattern — see below).
- Remove `rejectUnauthorized: false` from the Redis TLS config; if the managed provider genuinely requires it, replace with CA pinning and document why in a code comment.
- Change `uncaughtException`/`unhandledRejection` handlers to log, flush, then `process.exit(1)`, relying on the process manager to restart.
- Consolidate the four repeated `REDIS_URL` parses in `news.worker.ts` into one parse.

**Developer tasks:**
- Confirm the exact Vercel preview URL pattern to allowlist (project-specific; the agent cannot know this from the code alone) and confirm the process manager/orchestrator will actually restart on exit (no point exiting cleanly into a void).
- Confirm whether Redis TLS cert pinning is needed for the specific provider in use.

**Definition of Done (triggers push):**
- All Phase 0 tests still pass.
- A load-test or manual check confirms only one Postgres connection pool is opened at startup (verifiable via provider dashboard or `pg_stat_activity` connection count before/after).
- CORS check has a unit test asserting both the allow and deny cases (own preview URL allowed, arbitrary `*.vercel.app` app rejected).

---

## Phase 2 — Authentication & Socket Security
Addresses audit items #3, #4, #8 (JWT storage, AI rate-limit race, unauthenticated `code_change`).

**Agent tasks:**
- Convert token issuance/storage from `localStorage` + manual header injection to `httpOnly` `Secure` `SameSite` cookies set by the backend on login/register; update `lib/api.ts` to rely on `withCredentials` alone (already set) and remove the manual `Authorization` header interceptor and the `localStorage` read/write in `auth.store.ts`.
- Update the Socket.io handshake auth to read the token from the cookie (via a shared parse on connection) instead of `socket.handshake.auth.token` sent from client-side JS.
- Replace `consumeAiRequest`'s read-then-write with a single atomic conditional `UPDATE ... RETURNING` query.
- Add the same `activeMatches.get(matchId)` membership check used in `arena:submit` to the `arena:code_change` handler.

**Developer tasks:**
- Decide `SameSite` policy based on actual frontend/backend domain relationship (same-site vs. cross-site deployment — this changes the cookie flags required and cannot be guessed from the code).
- Manually verify login/logout/session-expiry flow in a real browser after the cookie migration — this is the one class of bug (auth flow) that's worth a human click-through even with tests in place, because of how easy it is to write a passing test that doesn't reflect real browser cookie behavior (third-party cookie blocking, etc.).

**Definition of Done (triggers push):**
- Phase 0/1 tests still pass, plus new tests: AI rate-limit concurrency test (fire N parallel requests, assert exactly 3 succeed, not N), and `arena:code_change` unauthorized-sender test.
- Manual confirmation from developer that login persists across refresh and expires correctly.
- No token value appears in `localStorage` or `sessionStorage` in browser devtools after this change (agent notes this as a manual verification step for the developer since it requires a live browser).

---

## Phase 3 — AI Service Efficiency Overhaul
Addresses audit items #9, #11, and the §3 cost/latency findings (schema-constrained output, system-instruction reuse, caching pattern rollout). This is the phase most directly aligned with the brief's "minimize API token usage" constraint, so treat its cost numbers as the headline metric for this phase.

**Agent tasks:**
- Add `responseSchema`/`responseMimeType: "application/json"` to every `generateContent` call in `grandmaster.service.ts`, `jd-match.service.ts`, `interview.service.ts`, `resume-builder.service.ts`. Remove the markdown-fence-regex extraction for each.
- Move static instructional prompt text into `systemInstruction` on model construction; leave only variable payload in the per-call prompt.
- Shrink retry loops: keep retries for 429/503 transport errors only; since schema mode makes parse failures rare, drop the parse-failure retry path to a single attempt with a hard failure (better to fail loud than mask a schema/prompt bug with silent retries).
- Roll out the `jd-match.service.ts` hash-based caching pattern to `grandmaster.service.ts` (cache challenge generation per language, with a TTL or pool-and-reuse strategy the developer approves) and evaluate whether `interview.service.ts` submissions benefit similarly.
- Add the prompt-injection structural mitigation from audit §1.4 (post-hoc validation that extracted keywords/quotes actually appear in source text) to `jd-match.service.ts`.

**Developer tasks:**
- Approve the caching strategy for `grandmaster.service.ts` (pool size, TTL) — this is a product decision (does every user need a unique challenge, or is a shared pool of N pre-validated challenges acceptable?), not a technical one, and materially changes the cost savings.
- Spot-check 10–20 real AI outputs post-migration to confirm schema mode hasn't degraded output quality (schemas can over-constrain creative fields like `scenario` text) — this needs human judgment on prompt quality, not just test-passing.

**Definition of Done (triggers push):**
- Mocked AI-service tests pass (module-level mock of `@google/generative-ai`, asserting schema is passed and retry logic behaves correctly on simulated errors).
- PR description includes a before/after estimate: average prompt tokens per call, and expected retry-rate reduction, based on the removed regex-failure path.
- Developer's manual spot-check of output quality signed off.

---

## Phase 4 — Code Execution Consolidation (Sandbox → Piston)
Addresses audit items #1, and architectural item #2.2. Highest impact, highest blast radius — deliberately last among the code-change phases, after a test harness exists.

**Agent tasks:**
- Route `problems.service.ts`, `grandmaster.service.ts` (sandbox pre-check), and `interview.service.ts` execution calls through `piston.service.ts` exclusively.
- Delete `utils/sandbox.ts` and its Windows-bypass/`unshare`/`ulimit`/proxy-env logic entirely — do not leave it as unused dead code, remove it so it can't be silently reintroduced as a "quick fix" later.
- Update `problems.service.ts` to run test cases with bounded concurrency against Piston rather than the current sequential loop (audit performance note) — developer to confirm Piston's own rate limits before raising concurrency.

**Developer tasks:**
- **This is a self-host decision, not an agent decision.** Evaluate and stand up a self-hosted Piston instance (Docker image is official and documented) rather than depending on the public `emkc.org` API for production judge traffic — the public instance has undocumented rate limits and no SLA, which is not acceptable for a core product feature. Provide the self-hosted `PISTON_API_URL` to the agent as an environment variable.
- Load-test the self-hosted Piston instance's throughput ceiling before this phase ships, so the concurrency setting in `problems.service.ts` is based on real numbers, not a guess.

**Definition of Done (triggers push):**
- Integration tests run against the developer-provisioned Piston instance (not the public API) and pass for all three languages currently supported (JS/TS, Python) plus any test-case edge cases (timeout, syntax error, infinite loop).
- `sandbox.ts` no longer exists in the codebase (`grep -r "sandbox" apps/backend/src` returns nothing outside git history).
- Manual security review by the developer confirming the self-hosted Piston deployment itself is properly isolated (network policy, container escape mitigations) — the agent can verify code correctness but not infrastructure isolation of a system it didn't provision.

---

## Phase 5 — Frontend Decomposition & UX Cleanup
Addresses audit items #10, and the `alert()` UX issue noted in the audit's frontend review. Lower urgency than Phases 1–4; scheduled last because it's pure maintainability/UX, not security or cost.

**Agent tasks:**
- Split `app/page.tsx` into section components; apply `next/dynamic` to below-the-fold sections.
- Replace the blocking `alert("Credits exhausted...")` in `lib/api.ts`'s response interceptor with a non-blocking toast/notification, consistent with whatever notification pattern already exists elsewhere in the UI (agent should check for an existing toast library before introducing a new dependency).
- Delete `apps/frontend/test-tw.js` and relocate or delete the three one-off scripts in root `scripts/`.

**Developer tasks:**
- Confirm whether the `scripts/*.js` refactor scripts have already been run against current `main` (if yes: delete; if unclear: developer must check git history, since the agent shouldn't guess about irreversible deletions of scripts whose execution state isn't recorded in code).
- Visual QA pass on the decomposed landing page across breakpoints — layout regressions from a large-file split are a real risk and are best caught by eyes, not just a passing build.

**Definition of Done (triggers push):**
- Lighthouse/bundle-analyzer comparison shows reduced initial JS payload for the landing page (agent reports the number; this is the objective metric for this phase).
- Developer visual QA sign-off across at least desktop + one mobile breakpoint.
- No functional regressions in Phase 0–4 test suite.

---

## Review & Patch Protocol

This protocol governs what happens **after** each phase's PR is pushed and reviewed — it's the loop between "developer looks at it" and "next phase starts."

### Step 1 — Structured feedback intake
Developer feedback on a PR must be categorized before the agent acts on it, into exactly one of:
- **Regression** — something that worked before this phase now doesn't.
- **Scope miss** — the Done criteria weren't actually met, despite the PR claiming they were.
- **New requirement** — a change in what's wanted, not a defect in what was built.

This categorization matters because the response differs: regressions and scope misses are fixed on the same branch before merge; new requirements go into a new phase or a backlog item, never bolted onto an in-flight PR.

### Step 2 — Regression identification
For any reported regression, the agent's first action is **not** to write a fix — it's to identify which specific commit in the phase's branch introduced it, using the Phase 0 test suite as the diagnostic tool (run the suite at each commit if `git bisect` is warranted for anything non-obvious). A fix proposed without first isolating the cause risks patching a symptom.

### Step 3 — Patch scope discipline
A patch in response to review feedback touches only the files implicated by the regression/scope-miss. If fixing it properly requires touching files outside the original phase's scope, the agent flags this explicitly to the developer rather than silently expanding the diff — an expanding PR is exactly how "Phase 1: Prisma singleton" quietly becomes "Phase 1: Prisma singleton plus three unrelated refactors," which defeats the whole point of phased review.

### Step 4 — Re-validation before re-push
Every patch re-runs the full Phase 0 CI pipeline (not just tests related to the patched files) before being re-pushed for review. Phases are cumulative — Phase 4's Piston migration must not silently break Phase 2's auth flow — so the full suite, not a partial one, is the gate every time.

### Step 5 — Close the loop explicitly
Once the developer confirms a patch resolves the feedback, the agent updates the PR description's Done-criteria checklist to reflect the actual final state (not the originally-planned state) before merge. This keeps the PR history an honest record of what shipped, which matters the first time someone needs to `git blame` their way to understanding why a given fix exists.

### Escalation rule
If the same regression recurs twice across patches within one phase, that is a signal the phase's scope was wrong, not that the third patch will be the one that works. Stop patching, and re-scope the phase with the developer before continuing — this prevents the failure mode of an agent iterating indefinitely on a fix that's treating a symptom of a deeper design problem.

---

## Summary Sequencing Table

| Phase | Focus | Blast Radius | Depends On |
|---|---|---|---|
| 0 | Test harness + CI | None (additive) | — |
| 1 | Prisma singleton, CORS, Redis TLS, process exit handling | Low | Phase 0 |
| 2 | JWT cookie migration, AI rate-limit atomicity, socket auth | Medium | Phase 0, 1 |
| 3 | AI schema mode, system instructions, caching | Medium (cost-critical) | Phase 0 |
| 4 | Sandbox → Piston consolidation | High | Phase 0, developer's self-hosted Piston |
| 5 | Frontend decomposition, dead-file cleanup | Low | Phase 0 |

Phases 2 and 3 can run in parallel branches if the developer wants to compress the timeline — they don't share files. Phase 4 should not start until the developer has provisioned self-hosted Piston, since the agent has no infrastructure-provisioning authority and blocking on that dependency mid-phase wastes a review cycle.
