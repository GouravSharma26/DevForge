# DevForge Remediation Plan (Updated)

**Repository:** `GouravSharma26/DevForge`
**Original review:** commit `4807279` (`main`)
**This update:** re-checked against `02194c3` (commits `85c3262` and `02194c3`, 5 Oct 2026)
**Source:** Code review findings C1–C9, medium items, plus new concerns N1–N7 found in the remediation commit
**Estimates:** rough, for one developer who knows the codebase

---

## Status Legend

| Mark | Meaning |
|---|---|
| ✅ | Done and verified in the code |
| 🟡 | Partially done; remaining work listed |
| ⬜ | Open; not addressed in any commit |
| 🆕 | New task raised by the latest review |

---

## Table of Contents

1. [Progress Summary](#progress-summary)
2. [Principles](#principles)
3. [Roadmap Overview](#roadmap-overview)
4. [Phase 0: Baseline](#phase-0-baseline--done)
5. [Phase 1A: Fix Regressions from the Latest Commit (new)](#phase-1a-fix-regressions-from-the-latest-commit-new)
6. [Phase 1B: Stop the Bleeding](#phase-1b-stop-the-bleeding)
7. [Phase 2: Core Integrity](#phase-2-core-integrity)
8. [Phase 3: AI Cost and Resilience](#phase-3-ai-cost-and-resilience)
9. [Phase 4: Cleanup, Docs and CI](#phase-4-cleanup-docs-and-ci)
10. [Risks and Dependencies](#risks-and-dependencies)
11. [Sequencing for Two Developers](#sequencing-for-two-developers)
12. [Task Tracker](#task-tracker)

---

## Progress Summary

| Task | Status | Evidence / remaining work |
|---|---|---|
| P0.1 Baseline CI | 🟡 | CI runs, but `4807279` shipped a syntax error in the admin page (fixed in `85c3262`). Record a clean baseline. |
| P0.2 Lint in CI | 🟡 | Step added, but several important rules are switched off (see N5). |
| P0.3 Test DB helper | 🟡 | Truncation helper added, but it has no safety guard (see N4). |
| P0.4 Stale audit file | ✅ | `AUDIT_REPORT.md` deleted. |
| C1 Dependencies | 🟡 | Prod audit went from 21 issues (3 critical, 14 high) to 4 (2 critical, 2 low). Remaining: `@fastify/jwt` → `fast-jwt` (see N6), and two low `dompurify` / `monaco-editor` items. |
| C2 Atomic `completeMatch` | ✅ | `updateMany` gate and a 3-way concurrency test. Socket callers are guarded; bot timer is not (see N7). |
| C3 Skill-tree integrity | ⬜ | No node ↔ problem binding. |
| C4 Exam-room fixes | ⬜ | Only the `match_found` payload was trimmed (`safeMatchState`). All core items open. |
| C5 Judge reliability | 🟡 | Only a 100 KB code-size cap was added. |
| C6 Account deletion | 🟡 | `onDelete: Cascade` added, but no migration (see N1), and no password re-check. |
| C7 Auth hardening | 🟡 | Login/register rate limits added (see N2). Email normalization, password max, token revocation, timing equalization, profile validation are open. |
| C8 AI layer | 🟡 | `jd-match` retry precedence bug fixed. Everything else open. |
| C9 State and startup | 🟡 | News job is fire-and-forget; `X-Api-Key` header, `res.ok`, timeout, `createMany`, 3 h skip done. `ABANDONED` enum added but unused; no reconciliation job; no Redis state. |
| M7 Cookie SameSite | 🟡 | Changed to `Lax`; may break cross-site sockets (see N3). |
| M1–M6, M8, M9 | ⬜ | Not addressed. |
| R1–R4, Docs, CI hardening | ⬜ | Not addressed, except `lint` being added to CI. |

**Remaining effort:** about 4 weeks for one developer, or about 2–2.5 weeks for two.

---

## Principles

- **One PR per task ID.** Each PR is small, includes its tests, and can be reverted on its own.
- **Tests first for bugs.** Write a failing test that reproduces the bug, then fix it.
- **Additive migrations first.** Schema changes ship, with a committed migration, before the code that depends on them.
- **Definition of done** for every task:
  - Typecheck, lint and tests pass in CI.
  - The acceptance criteria below are met.
  - The PR description includes a rollback note.

---

## Roadmap Overview

| Phase | Theme | Tasks | Est. effort remaining |
|---|---|---|---|
| 0 | Baseline and guardrails | P0.1–P0.4 (mostly done) | 0.5 day |
| 1A 🆕 | Fix regressions from the latest commit | N1–N7 | 4–5 days |
| 1B | Stop the bleeding | C1 (residual), C3, C4 | 4–5 days |
| 2 | Core integrity | C5, C6 (residual), C7 (remaining) | 6–8 days |
| 3 | AI cost and resilience | C8, C9 (remaining) | 8–10 days |
| 4 | Cleanup, docs, CI hardening | M-items, R-items, docs, CI | 5–6 days |

After Phase 0, Phase 1A and C3 can run in parallel, and so can C5 and C7.

---

## Phase 0: Baseline (mostly done)

| ID | Status | Task | Remaining |
|---|---|---|---|
| P0.1 | 🟡 | Baseline CI run recorded | Confirm `main` at `02194c3` is green, and record run time. |
| P0.2 | 🟡 | Lint added to CI | Done, but see N5 for the disabled rules. |
| P0.3 | 🟡 | Test database helper | Done, but see N4 for the missing guard. |
| P0.4 | ✅ | Stale audit file removed | None. |

**Exit criteria:** CI is green on `main`, lint runs, and the test helper cannot touch a non-test database.

---

## Phase 1A: Fix Regressions from the Latest Commit (new)

These tasks come from the review of `02194c3`. Do N1–N3 before the next deploy.

### N1. 🆕 Commit the missing migration (0.5 day, HIGH)

**Problem:** `schema.prisma` gained `onDelete: Cascade` (on `Match.player1`, `player2`, `problem`) and `MatchStatus.ABANDONED`, but nothing was added under `packages/database/prisma/migrations/`. CI uses `prisma db push`, so it stays green. Any environment using `migrate deploy` silently misses the change, and account deletion would still fail there.

**Steps:**
1. Run `npx prisma migrate dev --name match_cascade_and_abandoned` and commit the generated SQL.
2. Switch the CI step from `npx prisma db push --skip-generate` to `npx prisma migrate deploy`, so drift fails the build.
3. Make a deliberate decision on the relations:
   - `Match.player1` / `player2` with `Cascade` deletes a user's matches, so **opponents lose their match history**. The safer option is to make `player1Id` nullable and use `SetNull` for `player1`, `player2` and `winner`, and show "deleted user" in the UI.
   - `Match.problem` with `Cascade` means deleting a problem wipes its match history. Use `Restrict` instead.

**Acceptance:** A fresh database built only from migrations matches `schema.prisma` (`prisma migrate diff` reports no changes), and a user with matches can be deleted (see C6).

### N2. 🆕 Make rate limiting work behind the proxy (0.5 day, HIGH)

**Problem:** `Fastify({ logger: true })` has no `trustProxy`. All API traffic now arrives through the Next.js rewrite, so `request.ip` is likely the proxy's address. The new limits (5 per 15 min on `/login` and `/register`) would then be shared by every user. Five attempts could lock out everyone. Five registrations per 15 min is also tight for shared networks such as campuses.

**Steps:**
1. Set `trustProxy` to the real number of proxy hops in front of the app (commonly 1–2). Do not use `true`, because it lets clients spoof `X-Forwarded-For` and sidestep the limiter.
2. Key the login limiter on IP plus normalized email.
3. Relax registration to something like 10 per hour per IP, and keep login at about 5–10 per 15 minutes per IP and email.

```ts
const app = Fastify({ logger: true, trustProxy: 2 }) // set to your real hop count
```

**Test:** Inject requests with different `X-Forwarded-For` values and assert that they get separate buckets.
**Verification in a real environment:** Log in from two different clients through the production frontend and confirm they do not share a limit.

### N3. 🆕 Fix the cookie and socket topology (1–2 days, HIGH, needs testing)

**Problem:** Cookies are now `SameSite=Lax`. `useArena.ts` still connects straight to `NEXT_PUBLIC_BACKEND_URL`. If the frontend and backend are on different registrable domains, the Lax cookie is not sent on that handshake and the socket fails with "Unauthorized". The interview page instead connects same-origin through the Next rewrite with `transports: ["websocket"]`, which only works if the host proxies WebSocket upgrades (Vercel rewrites to external URLs do not).

**Decide one topology:**
- **Option A (recommended):** Serve both apps under one parent domain (for example `app.example.com` and `api.example.com`), set the cookie `Domain=.example.com` with `Lax`, and connect sockets directly to the API.
- **Option B:** Put a real reverse proxy (nginx, Cloudflare, or similar) in front of both and proxy WebSockets through it.

**Then:**
1. Make every `io()` call (`useArena.ts`, `interview/agent/page.tsx`) use the same helper and the same URL strategy.
2. Remove the unused `apiUrl` variable in the interview agent page.
3. Test in an incognito window against a production-like environment, for login, arena queue, friendly room, and interview chat.

**Acceptance:** Arena and interview sockets authenticate in production with the Lax cookie.

### N4. 🆕 Guard the test database (0.25 day, MEDIUM)

`apps/backend/test/setup.ts` truncates every table in `beforeEach` against whatever `DATABASE_URL` is set. Running `npm test` with a dev `.env` would erase that data.

```ts
const dbName = new URL(process.env.DATABASE_URL!).pathname
if (!/test/i.test(dbName)) throw new Error(`Refusing to truncate non-test DB: ${dbName}`)
```

Also document a dedicated test database in the README and CI.

### N5. 🆕 Restore meaningful lint rules (0.5–1 day, MEDIUM)

`apps/frontend/eslint.config.mjs` disables `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `@typescript-eslint/no-explicit-any`, `no-unused-vars` and `set-state-in-effect`. The CI step passes, but the gate is mostly cosmetic.

**Steps:**
1. Re-enable `react-hooks/rules-of-hooks` as an `error`, and fix the violations it finds.
2. Set the other disabled rules to `warn`, not `off`, so they stay visible.
3. Add a lint step for the backend if it has none.

### N6. 🆕 Make the JWT test meaningful and finish the `fast-jwt` upgrade (0.5 day, LOW–MEDIUM)

- The new "invalid crit header" test uses `invalid_signature`, so it returns 401 regardless of how the library handles `crit`. Rewrite it to sign a token with the real secret and a `crit` header, and assert it is rejected.
- `npm audit` reports a fix via a newer `@fastify/jwt`. Upgrade it and confirm cookie and header auth still work.
- Practical exposure is low because only the server signs tokens, but clearing the critical finding keeps the audit gate usable.

### N7. 🆕 Small robustness fixes (0.25 day, LOW)

- Wrap the 3-second bot-win `setTimeout` in `arena-bot.service.ts` in a try/catch. If the human wins in that window, `completeMatch` throws as an unhandled rejection.
- Replace the plain `Error("Payload too large")` in `submitSolution` with a typed error that maps to HTTP 413, and validate size before the work starts.

---

## Phase 1B: Stop the Bleeding

### C1. Dependency vulnerabilities (residual, 0.5 day) — 🟡

Done: dead dependencies removed, Fastify 5 stack, Next 16.3.8, bcrypt 6.
Remaining: the `@fastify/jwt` / `fast-jwt` upgrade (N6) and the two low `dompurify` / `monaco-editor` findings (`npm audit fix`).

**Acceptance:** `npm audit --omit=dev --audit-level=high` reports 0 critical and 0 high.

### C2. Atomic `completeMatch` — ✅ Done

`updateMany({ where: { id, status: "ACTIVE" } })` gates the update, XP is awarded once, and `arena:submit` handles the "already completed" case. A test covers three concurrent calls. The only unguarded caller is the bot timer (N7).

### C3. Skill-tree progression integrity (1 day) — ⬜ Open

- **Files:** `problems.service.ts`, `learn.service.ts`, tests.
- **Changes:**
  1. In `submitSolution`, call `completeNode` only if `node.problemSlug === problem.slug` and the node is unlocked for this user. Root nodes (empty `dependsOn`) count as unlocked without a progress row, mirroring `getSkillTree`.
  2. In `completeNode`, unlock a dependent only when **all** of its `dependsOn` nodes are `COMPLETED` for that user.
  3. Fix `unlockNode`: its upsert `update` sets `UNLOCKED` unconditionally, so re-solving a prerequisite can **downgrade** a completed dependent. Make the update a no-op if the status is already `COMPLETED`.
  4. Replace the per-dependent loop with a single `createMany({ skipDuplicates: true })`.

```ts
if (allPassed && nodeId) {
  const node = await prisma.skillNode.findUnique({ where: { id: nodeId } })
  if (node?.problemSlug === problem.slug) {            // bind node <-> problem
    await completeNode(userId, nodeId)                 // also verify node is unlocked / all deps done
  }
}
```

- **Tests:** a wrong `nodeId` is ignored; a locked node cannot be completed; a node with two prerequisites unlocks only after both are done; re-solving does not downgrade progress.

### C4. Friendly-room (exam) fixes (2 days) — ⬜ Open

Only the `safeMatchState` trimming for `match_found` landed. The verified defects remain. Split into two PRs.

#### PR A: Correctness

1. Add `publicRoom(room)` and use it for every `emit` that sends a room (`room_created`, `room_updated`, `room_restarted`). Strip `examTimeout` and anything server-only. (Verified: serializing a room holding a live `Timeout` throws "Converting circular structure to JSON".)
2. Bound the `arena:create_room` and `arena:update_room_settings` schemas: `name` 1–40 chars, `numberOfQuestions` 1–10, `timeLimitMinutes` 1–180, `difficulties` as an enum array. (Verified: a delay above 2^31−1 ms makes `setTimeout` fire after 1 ms.)
3. Guard `arena:start_room` with `if (room.startTime) return`, and clear any existing timeout.
4. Generate room codes with `crypto.randomBytes` and loop until the code is unused.
5. Multi-tab fix: in the disconnect handler, return early if `userSockets.get(userId) !== socket.id`, and only start the forfeit timer when no other live socket exists for that user.
6. Add an `examEnded` flag so `endExam` is idempotent and `submit_exam_code` and `exam_forfeit` are rejected after the exam ends. Reject `exam_forfeit` before the exam starts.
7. Clean up on exam end: delete the room and its `userToRoom` entries after a short grace period, to stop the memory leak.

```ts
const CreateRoom = z.object({
  name: z.string().trim().min(1).max(40),
  numberOfQuestions: z.number().int().min(1).max(10),
  timeLimitMinutes: z.number().int().min(1).max(180),
  difficulties: z.array(z.enum(["EASY", "MEDIUM", "HARD"])).max(3),
})
const publicRoom = ({ examTimeout, ...rest }: FriendlyRoom) => rest      // never emit the Timeout
const newCode = () => {
  let c
  do { c = crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase() } while (friendlyRooms.has(c))
  return c
}
// in "disconnect": if (userSockets.get(userId) !== socket.id) return    // a newer tab owns this user
```

#### PR B: Abuse controls

1. Add a small per-user limiter inside the shared `on()` helper (for example, 10 events per 10 s, with a stricter bucket for submit events).
2. Allow only one in-flight submission per user, since `submitSolution` fans out to Piston.
3. Add `maxHttpBufferSize` to the Socket.IO server config, to cap the size of the `code` payload.

**Tests (extend `arena.socket.test.ts`):** serializing a started room never throws; `timeLimitMinutes: 99999999` is rejected; a second `start_room` is a no-op; a second tab does not cause a forfeit; room codes never collide.

---

## Phase 2: Core Integrity

### C5. Judge reliability (3–4 days) — 🟡 Only a code-size cap exists

1. **Whitelist languages.**
   - Define `SUPPORTED_LANGUAGES = ["javascript", "python"]` in `shared-types`.
   - Validate `code` and `language` with Zod on the submit route and both socket events (replacing the manual 100 KB check).
   - Return 400, not 500. Return 404 for an unknown problem.
2. **Single-execution harness.** Change `buildCode` so one script receives all test cases and prints one JSON array of results. One Piston call per submission replaces N calls. Keep the stdout-redirect trick so user `print` output cannot corrupt the result.
3. **Runner registry.**
   - Replace the `getJSRunner` and `getPyRunner` switch statements with one typed registry keyed by slug and language.
   - For slugs with no runner, **fail loudly**. Never compare a placeholder string.
   - Linked-list problems need a `ListNode` serializer and deserializer. Either implement it, or mark `reverse-linked-list` and `merge-two-sorted-lists` unpublished until it exists. (The JS runners for those two currently hardcode `result = "[]"`, and Python has no runner.)
4. **Piston client hardening.**
   - Add an `AbortController` timeout (about 10 s).
   - Pass run/compile limits and stdin where your Piston version supports them.
   - Add a bounded retry with jitter on 429/5xx.
   - Cap the response size.
5. **Infrastructure.** Self-host Piston and set `PISTON_API_URL`. Document this in the README and `.env.example`, and fail at startup in production if it still points at `emkc.org`.
6. **Persistence.** Skip storing identical consecutive submissions, and add the `Submission` indexes (see M4).

**Tests:** Mock `executeCode` to verify one call per submission, language rejection, and the timeout path. Add a table-driven test that every published problem has a runner for both languages.

**Acceptance:** A submission makes exactly one execution request, and an unsupported language returns 400 without any execution.

### C6. Safe account deletion (residual, 0.5–1 day) — 🟡

Done: `onDelete` added in the schema (migration and design decision tracked in N1).
Remaining:
- Require the current password in `DELETE /api/user/me` (it currently deletes immediately), delete in a transaction, and clear the auth cookie.
- Revoke tokens on delete (see `tokenVersion` in C7).
- **Tests:** a user with matches, submissions, resumes and interviews can be deleted, and the opponent's match is still readable if you chose `SetNull`.

### C7. Auth hardening (remaining, 2 days) — 🟡

Done: per-route limits on `/login` and `/register` (tuning in N2); cookie options (N3).
Remaining:
1. **Input normalization.**
   - Update `RegisterSchema` and `LoginSchema`: trimmed, lowercased email (currently `z.string().email()`); password 8–72 characters.
   - Add `UpdateProfileSchema`, `ChangePasswordSchema` (with the same password rules) and `DeleteAccountSchema`.
   - Add a username pattern.
   - Handle Prisma `P2002` as a 409.
2. **Existing data migration.** Before adding the lowercase rule, run a script that checks for case-colliding emails, and resolve them manually. Then normalize stored emails.
3. **Rate limits on password change.**
4. **Timing and enumeration.** Run `bcrypt.compare` against a dummy hash when the user does not exist.
5. **Revocation.** Add `User.tokenVersion` (an Int), include it in the JWT, and check it in `authenticate` and in the socket auth middleware, with a short in-memory cache (for example 30 s). Increment it on password change and account delete.
6. **Avatar.** Cap it at roughly 256 KB with a data-URL MIME allowlist (png, jpeg, webp), or move it to object storage. Remove the unreachable 2 MB check (Fastify's default `bodyLimit` is 1 MiB).

```ts
email: z.string().trim().toLowerCase().email(),
password: z.string().min(8).max(72),
// when the user is missing, still run bcrypt.compare(password, DUMMY_HASH) to equalize timing
```

**Tests:** case-insensitive duplicate register is rejected; the old token is rejected after a password change; the code path is the same for known and unknown emails.

---

## Phase 3: AI Cost and Resilience

### C8. AI layer (5–6 days) — 🟡

Done: the `jd-match.service.ts` retry precedence bug is fixed, and persistent 503/429 now surfaces the original error. The remaining work builds on that:

1. **Shared retry helper (0.5 day).** Create `utils/gemini.ts` with `withGeminiRetry(fn, { retries, baseDelay })` that retries only on 429/503 and rethrows the **original** error. Replace the other hand-rolled loops (`resume.service` ×3, `resume-builder`, `interview`, `grandmaster`, and the fixed one in `jd-match`).

   ```ts
   for (let i = 0; i < 3; i++) {
     try { result = await model.generateContent(parts); break }
     catch (e: any) {
       if (![429, 503].includes(e.status) || i === 2) throw e
       await sleep(2000 * 2 ** i)
     }
   }
   ```

2. **Quota semantics (0.5 day).** Add `refundAiRequest(userId)` (an atomic decrement, floored at 0). Call it when the failure is ours or Google's, not when the user's input was bad.
3. **Structured output everywhere (1 day).**
   - Add `responseSchema` plus a Zod parse of the response to `resume.service` and `resume-builder`.
   - Clamp scores to 0–100 and validate `experienceLevel` against the enum.
   - Remove the regex JSON extraction and the dead fence-stripping in `interview.socket.ts`.
4. **Local PDF text (1.5 days).**
   - Extract text with `pdf-parse`, run `redactPII`, and send only text to Gemini.
   - Store the locally extracted text as `originalText`.
   - Add `%PDF-` magic-byte validation and handle the multipart size error.
5. **Async analysis (1.5 days, optional).** Move resume analysis to a BullMQ job so requests no longer block for up to about 75 s. Do this only if timeouts are a real problem on your host; otherwise just cap retries at 3.
6. **Interview socket limits (0.5 day).**
   - Zod-validate all payloads.
   - Cap messages at about 2,000 chars and the session at about 30 turns.
   - Enforce `duration` server-side with a timer that ends the session.
   - Fix the `"\\n\\n"` join bug (it produces literal backslash-n characters, not newlines).
   - Mark abandoned `IN_PROGRESS` interviews on disconnect.
7. **Grandmaster (1 day).**
   - Have the model also return `fixedCode`. At generation time, run it in Piston and require that its stdout equals `expectedOutput` and that the buggy code's stdout does not.
   - Judge submissions deterministically (`stdout.trim() === expectedOutput.trim()`), and use the LLM for feedback only.
   - Replace the one-per-language cache with a small pool per language, and do not charge quota on a cache hit.

**Acceptance:**
- A failed generation does not burn a daily credit.
- No service regex-parses JSON.

### C9. State, startup and background jobs (remaining, 3–4 days) — 🟡

Done:
- `scheduleNewsJob()` and the initial fetch are fire-and-forget, so an outage no longer calls `process.exit(1)`.
- `news.service.ts` uses the `X-Api-Key` header, checks `res.ok`, has a timeout, uses `createMany({ skipDuplicates: true })`, and skips the fetch when articles are under 3 hours old.

Remaining:
1. **Lazy-initialize the BullMQ Queue and Worker** instead of connecting at import time.
2. **Stale-match reconciliation (1 day).** The `ABANDONED` enum value exists but nothing uses it.
   - On boot and every few minutes (a BullMQ repeatable job), delete `WAITING` matches older than about 2 minutes and mark old `ACTIVE` matches `ABANDONED`.
   - Order `getWaitingMatch` by `createdAt`, and reject double-queueing.
   - Ship together with the N1 migration.
3. **Redis-backed state (2–3 days, only if you plan more than one instance).**
   - Add `@socket.io/redis-adapter`.
   - Introduce a `RoomStore` interface with in-memory and Redis implementations.
   - Move `activeMatches`, `friendlyRooms` and `userToRoom` behind it, and use `SET NX` with a TTL instead of the in-process `quickMatchLock`.
   - Cancel the bot-injection `setTimeout` when the waiting player leaves.

---

## Phase 4: Cleanup, Docs and CI

### Medium items (3 days)

| ID | Status | Task | File(s) |
|---|---|---|---|
| M1 | ⬜ | Replace the async CSRF hook with a synchronous `isAllowedOrigin()` and an explicit `return reply.code(403).send(...)` | `app.ts`, `utils/cors.ts` |
| M2 | ⬜ | Zod schema for `PUT /admin/config` (non-negative bounded numbers, booleans) | `admin.routes.ts` |
| M3 | ⬜ | Zod-validate querystrings; clamp `page` and `limit`; map invalid enums to 400 | `problems.routes.ts`, `news.routes.ts` |
| M4 | ⬜ | Add indexes: `Submission(userId, status)`, `Submission(problemId)`, `Match(status, createdAt)`, `Match(player1Id)`, `Match(player2Id)` (ship in a migration) | `schema.prisma` |
| M5 | ⬜ | `getNRandomProblems` using `ORDER BY random() LIMIT n` or an ID shuffle (Fisher–Yates) | `arena.service.ts` |
| M6 | ⬜ | Unify `Resume.experienceLevel` with the enum (migrate "JUNIOR" values) | `schema.prisma`, `shared-types` |
| M7 | 🟡 | Cookie `SameSite=Lax` done; topology follow-up is N3 | `auth.controller.ts` |
| M8 | ⬜ | Add `headers()` in `next.config.ts` with CSP, `frame-ancestors`, `Referrer-Policy` and `X-Content-Type-Options`; test that Monaco still loads | `next.config.ts` |
| M9 | ⬜ | Fail fast on `unhandledRejection`, and move `dotenv/config` to be the first import | `server.ts`, `app.ts` |

### Refactors (2 days, schedule opportunistically)

- **R1.** Split `arena.socket.ts` into `matchmaking`, `rooms`, `exam` and `state` modules. Do this *after* C4 and C9 so the fixes don't conflict.
- **R2.** Replace `console.*` (33 calls) with the Fastify/pino logger. Reduce `as any` (23 occurrences) as each file is touched.
- **R3.** Move the Anvil starter code out of `getProblemBySlug` into data.
- **R4.** Split the largest frontend pages (`arena/page.tsx`, `resume/builder/page.tsx`) into components when they are next modified.

### Documentation (1 day)

Fix the README:

- Node ≥22 (it currently says v20+).
- `prisma migrate deploy` instead of `prisma db push`.
- The complete env var list, including `COOKIE_SECRET`, `FRONTEND_URL`, `NEWS_API_KEY` and `PISTON_API_URL`.
- Add a frontend `.env.example` (only the backend has one today).
- Document the test database requirement (N4) and the deployment topology chosen in N3.
- Fix the ELO claim: either implement `updateArenaStats` or describe the flat +100 XP.

Also:

- Replace the placeholder license line.
- Add `SECURITY.md`, a short architecture diagram, and a "Known limitations" section.

### CI/CD (1 day)

Done: `lint` step added.
Remaining:
- `prisma migrate deploy` in place of `db push` (N1).
- `npm audit --omit=dev --audit-level=high`.
- Dependabot or Renovate.
- Concurrency cancellation and a coverage threshold.
- Secret scanning (gitleaks).
- Later: a Playwright smoke test for login, queue and submit.

---

## Risks and Dependencies

| Risk | Mitigation |
|---|---|
| Schema drift: the committed schema and the migrations disagree | N1 first; switch CI to `migrate deploy` so drift fails the build |
| Rate limits bucket all users together behind the proxy | N2: set `trustProxy` to the real hop count, then verify with two clients |
| Sockets fail to authenticate in production after the cookie change | N3: choose one topology, and test in incognito against a production-like setup |
| `Cascade` on `Match` erases opponents' history | Decide in N1; prefer nullable `player1Id` with `SetNull` |
| Test helper truncates a real database | N4 guard before anyone else runs the suite |
| Lowercasing emails collides with existing accounts | Run the duplicate-detection script before the migration |
| Token-version check adds DB load | Short in-memory cache; measure before adding Redis |
| Self-hosted Piston needs a privileged container host | Confirm your hosting supports it before committing to C5 step 5; otherwise keep the whitelisted public instance with the timeout and retry changes |
| Real-time refactor conflicts with the C4 fixes | Strict ordering: C4 → C9 → R1 |

---

## Sequencing for Two Developers

- **Dev A:** N1 → N2 → N3 → C1 residual / N6 → C5 → C8
- **Dev B:** N4 → N5 → N7 → C3 → C4 → C6 → C7 → C9

Review the checkpoints together after Phase 1A (before the next deploy) and after Phase 2, before starting the AI-layer rework.

---

## Task Tracker

Copy this into a GitHub issue or project board.

**Phase 0**
- [x] **P0.4** Stale `AUDIT_REPORT.md` removed
- [ ] **P0.1** Confirm green baseline CI on `02194c3`
- [ ] **P0.2** Lint added to CI *(added; see N5 for rule restoration)*
- [ ] **P0.3** Test DB truncation helper *(added; see N4 for the guard)*

**Phase 1A (new, do before next deploy)**
- [ ] **N1** Commit the missing migration; switch CI to `migrate deploy`; decide Cascade vs SetNull
- [ ] **N2** `trustProxy` and rate-limit tuning
- [ ] **N3** Cookie and socket topology decision, plus end-to-end test
- [ ] **N4** Test database guard
- [ ] **N5** Re-enable `rules-of-hooks`; downgrade other rules to `warn`
- [ ] **N6** Real `crit` header test; upgrade `@fastify/jwt`
- [ ] **N7** Bot timer try/catch; typed 413 error

**Phase 1B**
- [ ] **C1** Dependency vulnerabilities *(mostly done: 21 → 4 findings)*
  - [x] Remove dead dependencies
  - [x] Fastify 5 stack upgrade
  - [x] Next.js and bcrypt upgrade
  - [ ] `@fastify/jwt` / `fast-jwt` upgrade (N6)
  - [ ] Two low-severity findings
- [x] **C2** Atomic `completeMatch`
- [ ] **C3** Skill-tree progression integrity
- [ ] **C4** Friendly-room fixes
  - [ ] PR A: correctness
  - [ ] PR B: abuse controls

**Phase 2**
- [ ] **C5** Judge reliability
- [ ] **C6** Safe account deletion *(schema relation done; migration, password check, and token revocation remain)*
- [ ] **C7** Auth hardening *(login/register limits done; the rest remains)*

**Phase 3**
- [ ] **C8** AI layer *(`jd-match` retry bug fixed; the rest remains)*
  - [ ] Shared retry helper
  - [ ] Quota refund
  - [ ] Structured output everywhere
  - [ ] Local PDF text
  - [ ] Interview limits
  - [ ] Grandmaster deterministic judging
- [ ] **C9** State, startup and background jobs *(startup decoupling and news service done)*
  - [ ] Lazy queue and worker init
  - [ ] Stale-match reconciliation using `ABANDONED`
  - [ ] Redis-backed state (if scaling out)

**Phase 4**
- [ ] **M1–M9** Medium items *(M7 partially done)*
- [ ] **R1–R4** Refactors
- [ ] **Docs** README, `SECURITY.md`, architecture diagram
- [ ] **CI/CD** audit step, Dependabot, secret scanning, coverage threshold
