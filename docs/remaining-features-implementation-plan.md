# DevForge — Implementation Plan: Remaining Roadmap Features

Status as of July 31, 2026. Covers everything still open from the original "Planned Next Features" list. Item #1 (1-to-many resumes) is complete and not covered here.

Suggested build order is by dependency and urgency, not the original numbering — see "Recommended Sequence" at the end.

---

## 1. PII Redaction

**Why it matters more than its list position suggests:** this isn't a new feature so much as closing an active gap — every resume upload today sends the raw PDF straight to Gemini with no scrubbing. Real user data (email, phone, possibly address) currently leaves your system unredacted on every scan.

### Schema changes
None required. This is a processing-step addition, not a data-model change.

### Backend changes
- New utility: `apps/backend/src/utils/redact.ts`
  - Regex-based detection for email addresses, phone numbers (multiple formats), and optionally street addresses/LinkedIn URLs.
  - Two modes: (a) redact before sending to Gemini, replacing matches with placeholders like `[EMAIL]`, `[PHONE]`; (b) redact only in what gets stored/displayed, if the AI genuinely needs the real contact info for context (unlikely — skills/experience analysis doesn't need it).
- Apply in `analyzeResume` (PDF path) and `analyzeResumeFromText` (builder path) in `resume.service.ts`, before the Gemini call.
- Decide: does the *stored* `originalText`/parsed data also get redacted, or only what's sent externally? Recommend redacting both — no reason to retain unredacted PII in your own DB either.

### Frontend changes
None required — this is invisible to the user by design, though consider a small note near the upload zone ("we redact contact info before AI analysis") for trust/transparency.

### Open decision before building
Regex-based PII detection has real false-negative rates (non-US phone formats, unusual email obfuscations). Decide upfront whether "best-effort regex" is acceptable for this project's stakes, or whether a more robust approach (e.g. a small NER-based library) is warranted. For a portfolio project, regex is likely fine — just don't oversell it as complete PII protection in any user-facing copy.

**Estimated effort:** Small (half a day) — one new utility file, two call sites.

---

## 2. Resume Forking

**Why it's cheap now:** the 1-to-many migration already did the hard part. Forking is essentially "duplicate a `Resume` row with a new `profileName`."

### Schema changes
None required — existing `Resume` model already supports multiple rows per user.

### Backend changes
- New service function in `resume.service.ts`:
  ```ts
  export async function forkResume(sourceId: string, userId: string, newProfileName: string) {
    const source = await prisma.resume.findFirst({ where: { id: sourceId, userId } })
    if (!source) return null
    const { id, createdAt, updatedAt, ...data } = source
    return prisma.resume.create({ data: { ...data, profileName: newProfileName } })
  }
  ```
- New route: `POST /api/resume/:id/fork` — body: `{ profileName: string }`. Ownership-checked via the same pattern as `getResumeById`/`deleteResume`.
- Decide: should forking copy `interviews` too, or leave the fork with a clean interview history? Recommend clean — a fork is meant to be a new targeted variant, old interview scores from the source resume don't apply.

### Frontend changes
- `hooks/useResume.ts`: add `useForkResume()` mutation, invalidates `["resumes"]` on success.
- `app/resume/[id]/page.tsx`: add a "Fork this profile" button near the delete button. On click, prompt for a new profile name (simple modal or inline input — reuse styling from the existing delete-confirm pattern), call the mutation, then route to the new resume's detail page.
- Optionally: show a small "forked from X" indicator on the hub cards, which requires an added field — see below.

### Optional schema addition (only if you want fork lineage tracking)
```prisma
model Resume {
  ...
  forkedFromId String?
  forkedFrom   Resume?  @relation("ResumeForks", fields: [forkedFromId], references: [id], onDelete: SetNull)
  forks        Resume[] @relation("ResumeForks")
}
```
Skip this for v1 unless you specifically want a visible fork tree in the UI — adds complexity for a "nice to have."

**Estimated effort:** Small–Medium (half to one day, more if lineage tracking is included).

---

## 3. Interview Hub (`/interview`)

**Why it's cheaper than it looks:** backend groundwork (`getUserInterviews`, `GET /resume/interviews`) already exists from the original interview feature. This is mostly a frontend consolidation task, structurally similar to the resume hub/detail split you already built.

### Schema changes
None required for the basic hub. See "session vault" note below for a possible addition.

### Backend changes
- Confirm `getUserInterviews` returns enough for a list view (resume profileName, score, date, status) — likely needs a `select`/`include` adjustment similar to what `getUserResumes` got, so the hub isn't over-fetching full question/answer data for a list page.
- **Export:** new route `GET /api/resume/interview/:id/export` — generate a simple PDF or markdown summary of the interview (questions, answers, scores, feedback). Reuse the `pdf` skill/toolchain pattern if generating server-side, or do it client-side with a print-to-PDF approach similar to how the Resume Builder already does `window.print()`.

### Frontend changes
- New page: `app/interview/page.tsx` — Hub Dashboard, same visual pattern as `/resume`: grid of cards, one per past interview, showing resume profile name, score, date, status (in-progress/completed).
- Context selector: when starting a *new* interview from this hub (rather than from a resume detail page), let the user pick which resume profile to base it on — dropdown, same pattern as the AI-Fill selector you just built in the Resume Builder.
- "Session vault": likely just means the hub list itself, functioning as a saved history — confirm this is the intended meaning before building anything extra.
- Add an "Export" button on the per-interview detail page (`/resume/interview/[id]`) wired to the new export route.
- Update navbar/resume hub to link to `/interview` as a peer of `/resume`.

**Open question worth resolving before building:** does "Interview Hub" replace the existing `/resume/interview/[id]` flow, or sit alongside it as an entry point? Recommend: keep the per-interview detail page as-is, add the hub purely as a new list/launch page.

**Estimated effort:** Medium (1–2 days) — mostly frontend, one new backend route for export.

---

## 4. JD Matching

**New feature, no existing groundwork.** Upload a job description, get an ATS keyword match score against a chosen resume.

### Schema changes
```prisma
model JDMatch {
  id           String   @id @default(cuid())
  userId       String
  resumeId     String
  jdText       String
  matchScore   Int      @default(0)
  matchedKeywords   String[]
  missingKeywords   String[]
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resume       Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```
Requires adding `jdMatches JDMatch[]` to both `User` and `Resume` models.

### Backend changes
- New service: `apps/backend/src/services/jd-match.service.ts`
  - Accepts JD text (pasted or uploaded — decide which; pasted text is much simpler to start with) + a `resumeId`.
  - Sends both to Gemini with a prompt asking for keyword extraction from the JD, comparison against the resume's `skills`/`originalText`, and a match score + gap list.
  - Persist result as a `JDMatch` row.
- New routes in a new `jd-match.routes.ts` (or extend `resume.routes.ts`):
  - `POST /api/resume/:id/jd-match` — body: `{ jdText: string }`
  - `GET /api/resume/:id/jd-matches` — list past matches for that resume

### Frontend changes
- New section on `app/resume/[id]/page.tsx` (or a new sub-route `app/resume/[id]/jd-match/page.tsx` if it gets complex): textarea for pasting JD text, "Analyze Match" button, results display (score, matched/missing keyword pills — reuse the existing skill-pill styling pattern already used for Skills/Gaps).
- New hook: `useJDMatch(resumeId)` and `useCreateJDMatch()`.

**Estimated effort:** Medium (1–2 days).

---

## 5. Grandmaster Interview (dynamic code debugging challenges)

**Most complex remaining item** — combines the existing Problems/Arena code execution infrastructure with the AI interview system. Should come after Sandbox Hardening is actually resolved, not before, since this expands the surface area of "AI + user-facing code execution" right as that execution path is known to have open security gaps.

### Schema changes
```prisma
model DebugChallenge {
  id            String   @id @default(cuid())
  interviewId   String
  buggyCode     String
  language      String
  bugDescription String
  userFixedCode String?
  isCorrect     Boolean?
  feedback      String?
  createdAt     DateTime @default(now())
  interview     Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
}
```
Add `debugChallenges DebugChallenge[]` to `Interview`.

### Backend changes
- Extend `interview.service.ts`: a new challenge type alongside the existing Q&A rounds — Gemini generates a deliberately buggy code snippet (relevant to the candidate's resume skills/target role), the candidate submits a fix, the fix runs through the **existing sandbox** (`runInSandbox`) against test cases, and Gemini evaluates both correctness and code quality.
- New route: `POST /api/resume/interview/:id/debug-challenge` (generate) and `POST /api/resume/interview/:id/debug-challenge/:challengeId/submit` (evaluate).

### Frontend changes
- New UI within the interview flow: Monaco editor (already used for Problems) embedded to show the buggy snippet and let the candidate edit/fix it.
- Reuse the existing Monaco integration pattern from `app/problems/[slug]/page.tsx` rather than building a new editor integration from scratch.

**Dependency flag:** this feature routes user-influenced code through `runInSandbox`, same as Problems/Arena — so whatever state Sandbox Hardening is in when you build this directly determines this feature's exposure too. Don't ship this ahead of resolving the open sandbox items if it's going to be public-facing.

**Estimated effort:** Large (3–5 days) — new schema, two new backend flows, new frontend editor integration, and it inherits all open sandbox risk.

---

## 6. JD Vibe Check

**Depends on JD Matching existing first** (reuses the same JD input) — build after #4, not independently.

### Schema changes
Extend `JDMatch` (from JD Matching, above) rather than creating a new model:
```prisma
model JDMatch {
  ...
  cultureFlags   Json?   // [{ flag: string, severity: "low"|"medium"|"high", quote: string }]
}
```

### Backend changes
- Extend the same `jd-match.service.ts` call (or add a second Gemini call) to also analyze the JD text for culture red flags: vague/inflated language ("rockstar", "wear many hats," unpaid overtime signals, unrealistic requirement stacking), returning a structured list of flags with severity.

### Frontend changes
- Add a "Culture Check" panel to the same JD Matching results view — red/yellow flag pills, similar pattern to the existing Suggestions display in the resume detail view.

**Estimated effort:** Small, once JD Matching exists (half a day — mostly a second prompt + a display panel, not new infrastructure).

---

## Sandbox Hardening — 🟡 In progress, paused

Not a new item — carried over from the original roadmap (#8) and from active work earlier this session. See `SANDBOX_STATUS.md` in the repo root for full detail. Summary:

- **Done:** `$0`/`$@` shell argument bug fixed and verified; env var scrubbing; `PYTHON_CMD` resolution; `SIGKILL` escalation; happy-path execution confirmed correct.
- **Not done / blocking:** network isolation confirmed broken in testing (raw sockets reach the open internet despite the fallback); `ulimit` resource caps entirely untested — both require a real Linux environment (Docker or Render staging) to test, which wasn't available locally.
- **Accepted limitation:** fork-bomb protection shares budget with the host process on non-root deploys — documented in code, not being pursued further without infra changes.
- **Resume point:** install Docker or get Render staging access, re-run `test-e2e.js`, confirm or fix network isolation and `ulimit` on real Linux.

**This should be resolved before Grandmaster Interview ships**, since that feature expands the sandbox's exposure. Not strictly blocking for JD Matching, PII Redaction, Resume Forking, or Interview Hub, which don't touch code execution.

---

## Recommended Sequence

1. **PII Redaction** — small, closes an active data-handling gap, no dependencies.
2. **Resume Forking** — small, cheap right now while the multi-resume patterns are fresh.
3. **Interview Hub** — medium, backend groundwork already exists.
4. **JD Matching** — medium, new but self-contained.
5. **JD Vibe Check** — small, but depends on #4.
6. **Sandbox Hardening (resume)** — needs Docker/Render access; not code-effort-heavy, needs an environment more than more coding time.
7. **Grandmaster Interview** — largest, and shouldn't ship ahead of #6 being resolved if this app will be public-facing.
