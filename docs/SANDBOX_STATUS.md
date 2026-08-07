# Sandbox Hardening — Status (Paused)

Last worked: August 1, 2026. Paused deliberately to prioritize feature work. Pick this back up before any public/production deploy that allows untrusted code submission.

File: `apps/backend/src/utils/sandbox.ts`

## ⚠️ Scope increase: two features now depend on this, not one

Originally this only gated the **Problems/Arena** feature. As of August 1, 2026, **Grandmaster Interview** (AI-generated debug challenges, evaluated via user-submitted code fixes) also routes through `runInSandbox` — both for a pre-check on AI-generated buggy code (`generateGrandmasterChallenge`) and for evaluating user-submitted fixes (`evaluateGrandmasterSubmission` in `grandmaster.service.ts`).

**Why this happened:** Grandmaster Interview originally attempted to use Piston (a third-party, purpose-built code-execution sandbox) instead of `runInSandbox`, specifically to avoid depending on this unresolved hardening work. That fell through — Piston's public API now blocks portfolio/AI-generated projects (policy change, confirmed as of Feb 2026), and self-hosting it (a small VPS running Piston's Docker image) was deferred as a cost/effort tradeoff for a demo-only project. Decision made: ship Grandmaster Interview now on the existing `runInSandbox`, accept that it inherits the same open gaps below, and revisit self-hosted Piston (or finishing this hardening properly) later.

**Practical effect:** every gap listed below now applies to *two* user-facing features, not one. The urgency of finishing this work — or at minimum, keeping the app's user base small/trusted until it's finished — is correspondingly higher than when this was paused.

## ✅ Confirmed working (verified with real test output, not just claims)

- **`$0`/`$@` argument-passing bug — fixed.** The nested `sh -c` wrapper was silently dropping the executable name when relaying only `"$@"` to the inner shell, causing all submissions to fail to execute at all. Fixed by passing `"$0" "$@"` together at every nested layer. Confirmed via a standalone diagnostic (`test.sh`) showing the exact failure mode, then confirmed again via a full end-to-end run.
- **Environment variable scrubbing.** Child process `env` is now a minimal explicit object (`PATH` + fallback proxy vars only) — `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY` etc. are not inherited by submitted code.
- **`PYTHON_CMD` resolution.** Uses `process.env.PYTHON_CMD` with a platform-based fallback (`python` on Windows, `python3` on Linux), rather than a hardcoded binary name that could fail on Render's actual image.
- **`SIGKILL` escalation.** A fallback timer now force-kills the child process if it doesn't exit on `SIGTERM` within `timeoutMs + 1000`.
- **Happy path.** A real "Two Sum" JS solution executes end-to-end and returns correct output (`Result: [ 0, 1 ]`) through the full wrapper.

## ❌ Confirmed NOT working — needs real Linux to test/fix

- **Network isolation.** `unshare -n` fails in the current test environment (logs `[Sandbox Warning] unshare failed, network isolation degraded`). The `HTTP_PROXY`/`HTTPS_PROXY` fallback provides **no real protection** — confirmed by a raw `net.connect()` test successfully reaching `8.8.8.8:53` from inside the sandbox despite the fallback being active. Submitted code can currently reach the open internet.
- **`ulimit` resource caps** (`-v` memory, `-u` processes, `-n` file descriptors, `-t` CPU time, `-f` file size). Untested — Windows/Git Bash cannot apply these POSIX flags at all (`ulimit: max user processes: cannot modify limit: Invalid argument`), so it's currently unknown whether these caps work on the actual deploy target.

**Important caveat:** all testing so far has been on Windows via Git Bash, which structurally cannot support `unshare` or `ulimit` properly. It is possible (not confirmed either way) that both of these work correctly on real Linux (Render, or a local Docker container) even though they fail here. This has not yet been tested anywhere that could give a real answer.

## Known, accepted limitation (deliberate decision, not a bug to chase)

- The fork-bomb protection (`ulimit -u`) is shared with the host server's own process budget on non-root deployments (like Render), because switching the child to a separate low-privilege user (`uid`/`gid`) requires root, which Render doesn't grant. Attempted, confirmed to `EPERM` as expected, and explicitly accepted as a documented limitation rather than pursued further — real isolation here would require infrastructure changes (e.g. a custom Dockerfile with a baked-in low-priv user) that are out of scope for now. Comment already added in `sandbox.ts` above the `ulimit -u` line.

## Next steps when resuming

1. Install Docker Desktop OR get access to a Render staging/preview deploy — user noted plans to test both a fix and a real Docker/Linux environment personally (per Aug 1 conversation).
2. Re-run `test-e2e.js` (already includes a raw-socket test) inside a real Linux environment.
3. If `unshare` succeeds there: confirm network isolation actually blocks the raw-socket test.
4. If `unshare` still fails there too: need a real fix for network isolation before this ships to any environment where untrusted users can submit code — the current fallback is not sufficient.
5. Confirm `ulimit` caps actually constrain a deliberately malicious submission (fork bomb, memory bomb, infinite CPU loop) on real Linux.
6. Once confirmed for Problems/Arena, also re-verify `grandmaster.service.ts`'s two `runInSandbox` call sites (challenge pre-check + submission evaluation) against the same hardened sandbox — don't assume passing the Problems/Arena tests automatically covers Grandmaster's usage without a direct check.
7. Once both are confirmed, this item (roadmap #8) can be marked done.

## Test files already in repo root (not yet moved into a proper test suite)

- `test-e2e.js` — end-to-end sandbox test, includes Two Sum happy path + raw socket test
- `test.sh` — isolated diagnostic for the `$0`/`$@` shell argument bug
- `test_grandmaster.ts` — end-to-end Grandmaster Interview flow (challenge generation, submission, evaluation); re-run this too once `runInSandbox` is hardened, since it now exercises the same sandbox code path

## Related, deferred: self-hosted Piston

`apps/backend/src/services/piston.service.ts` exists, is clean, and works (confirmed against the real public API before it started blocking portfolio/AI projects). It's currently unused — not deleted, in case self-hosting Piston becomes worthwhile later (e.g. via a free-tier VPS like Oracle Cloud's Always Free tier, or a paid demo-only droplet spun up/torn down around specific demo sessions). If resumed, this would let Grandmaster Interview (and potentially Problems/Arena) use a purpose-built, already-isolated execution engine instead of depending on `runInSandbox` being fully hardened.
