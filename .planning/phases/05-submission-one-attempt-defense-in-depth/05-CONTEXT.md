# Phase 5: Submission + One-Attempt Defense in Depth — Context

**Gathered:** 2026-07-08
**Status:** Ready for planning
**Source:** Interactive discuss during `/gsd-discuss-phase 5`

<domain>
## Phase Boundary

Deliver the end-to-end submission pipeline: after the scoreboard renders, a single JSON payload POSTs to a Google Apps Script `doPost` webhook under exponential-backoff retry (3 attempts max). The Apps Script validates HMAC token + Origin header + rate limits (3/IP/min), deduplicates by SHA-256 of normalized email, and writes a row to a Google Sheet. On backend 200, the one-attempt `localStorage` flag is set and the scoreboard shows a success banner for ~5 seconds before auto-transitioning to a terminal thank-you screen. A Formspree fallback endpoint is env-toggle ready (disabled by default).

**Out of scope:**
- Google Sheets dashboard/UI for recruiters (Sheet is raw data; future phase)
- Email notification to recruiter on new submission (future phase)
- Apps Script automated CI/CD deployment (manual copy-paste deploy only)
- PDF export of scoreboard (v2 — BOARD-v2-02)
- Shareable URL export (v2 — BOARD-v2-01)

</domain>

<decisions>
## Implementation Decisions

### Submission Screen Flow (D-P5-01)
- **D-P5-01:** Scoreboard renders fully first, THEN submission fires automatically in background. Candidate sees their complete scoreboard with a "Submitting results..." overlay/banner. The overlay is non-blocking — the scoreboard content is visible underneath. This is a screen-state addition on the existing `SCOREBOARD` screen, NOT a new `SCREENS` enum value. The `ScoreboardScreen` component gains a `submissionPhase` prop or internal state (`idle` → `submitting` → `success` → `done`).
- **D-P5-02:** On successful backend 200, the scoreboard overlay changes to a success banner ("Results sent to the hiring team" with checkmark icon) for exactly 5 seconds, then auto-transitions to a dedicated `SUBMIT_DONE` screen (new `SCREENS` value). The 5-second delay gives the candidate time to screenshot their scores.
- **D-P5-03:** New `SCREENS.SUBMIT_DONE` screen is terminal — thanks the candidate, confirms results were sent, no back navigation. Displays candidate name from the stored identity session. No scoreboard data shown on this screen (candidate already saw it).

### Post-Submission Experience (D-P5-04)
- **D-P5-04:** The `SUBMIT_DONE` screen copy: centered heading "Thank you, {name}" + body "Your assessment results have been sent to the hiring team. If you have questions about next steps, contact your recruiter." No contact details hardcoded — generic until recruiter contact is known (deferred).
- **D-P5-05:** On `SUBMIT_DONE` mount, `sessionStorage` identity (`cma_identity_v1`) is cleared (per D-P1-03 contract — Phase 5 owns the clear). The assessment store state is NOT reset — the scoreboard already showed.
- **D-P5-06:** The one-attempt `localStorage` flag (`cma_attempt_v1`) is written inside the backend-200 handler, BEFORE transitioning to `SUBMIT_DONE`. This closes ATTEMPT-01 (Phase 1 read path) + ATTEMPT-02 (Phase 1 guard) by wiring the write trigger. `markAttempted({ emailHash, submissionId })` uses the hashed-normalized email + the `id` returned by Apps Script.

### Apps Script Deployment & Secrets (D-P5-07)
- **D-P5-07:** Apps Script code lives in the repo at `scripts/apps-script/Code.gs` (and any companion `*.gs` files). The repo is the source of truth for the server-side logic. Deployed manually: copy-paste into the Apps Script editor web UI OR use `clasp push` if clasp is configured. No automated CI/CD for Apps Script deployment in Phase 5.
- **D-P5-08:** Secrets (HMAC shared key, Sheet ID) live in Apps Script Properties Service (`PropertiesService.getScriptProperties()`), NEVER in the repo. The repo contains a `scripts/apps-script/README.md` documenting: the endpoint URL, required Properties keys (`HMAC_SECRET`, `SHEET_ID`, `ALLOWED_ORIGIN`, `RATE_LIMIT_PER_IP`, `RATE_LIMIT_WINDOW_SEC`), and deployment steps.
- **D-P5-09:** The client-side HMAC secret is injected at build time via Vite env variable (`VITE_HMAC_SECRET`) and exposed to the submission module at runtime. This is a build-time secret, not a runtime fetch — acceptable for a static SPA with no backend server (the same security model as the bundled answer keys per SCORE-08).

### Failure UX & Retry Visibility (D-P5-10)
- **D-P5-10:** Retries are VISIBLE. The scoreboard overlay shows "Submitting results... (attempt 1/3)" and updates per attempt. Exponential backoff: 1s, 3s, 9s delays between attempts. The candidate sees the attempt counter incrementing. Only 5xx or network errors trigger retry; 4xx errors (validation failure, duplicate) do NOT retry and surface immediately.
- **D-P5-11:** On final failure (all 3 attempts exhausted), the overlay changes to an error state: "Unable to submit your results. Please try again." with a prominent "Retry Submission" button. The retry button resets the attempt counter and starts fresh. The candidate stays on the scoreboard screen. There is ALSO a secondary message: "If the problem persists, contact your recruiter."
- **D-P5-12:** The `scoreboardData` (per-video scores, overall score, competency, per-L1 accuracy) is computed once before submission starts and passed to the submission module. If retries exhaust, this data is NOT lost — the retry button reuses it.

### Submission Payload (D-P5-13)
- **D-P5-13:** The JSON payload shape (SUBMIT-02):
  ```json
  {
    "name": "string",
    "email": "string",
    "emailHash": "sha256-hex",
    "answers": [{ "videoId": "string", "selectedL1": ["..."], "selectedL2": ["..."], "verdict": "APPROVE|DECLINE", "timeSpentMs": 12345, "timedOut": false }],
    "scores": { "overallPct": 72.5, "perVideo": [...], "perL1Accuracy": {...} },
    "competency": "Advanced|Proficient|Foundation",
    "strengthsWeaknesses": "string",
    "timeToCompleteMs": 720000,
    "answerKeyVersion": "string",
    "taxonomyVersion": "string",
    "sessionStartedAt": "ISO8601",
    "sessionEndedAt": "ISO8601",
    "userAgent": "string",
    "screenResolution": "WxH",
    "hmac": "hex-string"
  }
  ```
  Payload assembled by a pure `buildSubmissionPayload(identity, answers, scores, competency, hmac)` function in a new `utils/submission.js` module.

### Client-Side Submission Module (D-P5-14)
- **D-P5-14:** New utility module `src/utils/submission.js` with exported functions:
  - `hashEmail(email) → hex-string` — Web Crypto SHA-256 of normalized email (replaces `src/utils/dedup.js` placeholder). Normalization: lowercase, strip `+` aliases and dots for Gmail-family addresses (`/\.(?=.*@gmail\.com$)|(\+.*)(?=@gmail\.com$)/gi`), trim whitespace.
  - `buildHmac(payload, secret) → hex-string` — HMAC-SHA256 over the JSON payload body (excluding the `hmac` field itself).
  - `submitResults({ payload, endpoint, onProgress, maxAttempts }) → { ok, id }` — async function with fetch + exponential backoff. Calls `onProgress({ attempt, total, phase })` for UI updates. Returns `{ ok: true, id }` on success or `{ ok: false, error }` on exhaustion.
- **D-P5-15:** The existing `src/utils/dedup.js` is rewritten to export `normalizeEmail(email) → string` and `hashEmail(email) → Promise<string>` using `crypto.subtle.digest('SHA-256', ...)`. The `hashEmail` function is async because Web Crypto is async. The `useOneAttemptGuard.markAttempted` caller must `await` it.

### Screen Enum Addition (D-P5-16)
- **D-P5-16:** Add `SUBMIT_DONE: 'SUBMIT_DONE'` to `src/state/screens.js`. App.jsx `renderScreen` switch gets a new case rendering `<SubmitDoneScreen identity={state.identity} />`. The `goToScreen(SCREENS.SUBMIT_DONE)` call happens inside `ScoreboardScreen` after the 5-second success banner delay.

### Formspree Fallback (D-P5-17)
- **D-P5-17:** `@formspree/react` is already a runtime dependency (if not, add it). A `VITE_SUBMISSION_BACKEND` env var controls which endpoint `submitResults` hits: `"apps-script"` (default) or `"formspree"`. The Formspree form ID is injected via `VITE_FORMSPREE_FORM_ID`. On `"formspree"` mode, `submitResults` uses the Formspree SDK's `useSubmit` or raw fetch to the Formspree endpoint. The Apps Script-specific features (HMAC, Origin check, SHA-256 dedup, Sheet rows) are NOT available in Formspree mode — it's a degraded fallback for when Apps Script quota is exhausted.

### the agent's Discretion
- Exact exponential backoff delays (suggested: 1s, 3s, 9s — agent can adjust)
- HMAC header placement (`X-HMAC-SHA256` vs `Authorization: HMAC-SHA256 ...` vs custom)
- Whether the submission module is a hook (`useSubmission`) or a plain async function called from `ScoreboardScreen`
- `SubmitDoneScreen` exact layout and styling (design tokens deferred to Phase 6)
- Exact retry delay jitter strategy (if any)
- Apps Script rate-limit implementation (CacheService vs ScriptProperties)
- Whether Formspree fallback shares the same `submitResults` code path or is a separate module

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §"Phase 5" — goal, 5 success criteria, depends on Phase 4 (lines 148–165)
- `.planning/REQUIREMENTS.md` §"Submission (SUBMIT)" — SUBMIT-01..10 (lines 103–113)
- `.planning/REQUIREMENTS.md` §"One-Attempt Enforcement (ATTEMPT)" — ATTEMPT-03, 04 (lines 98, 99)
- `.planning/PROJECT.md` §"Results delivery" — backend submission + recruiter delivery (line 43)

### Architecture & Patterns
- `.planning/research/ARCHITECTURE.md` §"Standard Architecture" — component tree + screen state machine diagram
- `.planning/research/ARCHITECTURE.md` §"Pattern 1" — screen enum pattern (add SUBMIT_DONE)
- `.planning/research/ARCHITECTURE.md` §"Pattern 2" — hook composition (submit hook vs async fn)
- `.planning/research/ARCHITECTURE.md` §"Anti-Pattern 5" — never persist answers mid-test

### Stack & Security
- `.planning/research/STACK.md` §"Forms & Submission" — manual fetch, no form library
- `.planning/research/PITFALLS.md` — Phase 5 rows (LFS quota, Apps Script quota, secret management)
- `.planning/research/SUMMARY.md` — Sheets preferred over Formspree (decision context)

### Phase 1 Context (upstream contract)
- `.planning/phases/01-app-shell-one-attempt-gate/01-CONTEXT.md` §D-P1-04 — `useOneAttemptGuard` API contract
- `.planning/phases/01-app-shell-one-attempt-gate/01-CONTEXT.md` §D-P1-03 — identity persistence + Phase 5 clear
- `.planning/phases/01-app-shell-one-attempt-gate/01-CONTEXT.md` §D-P1-04.1 — `markAttempted` signature `{ emailHash, submissionId }`

### Existing Source (integration points)
- `src/App.jsx` — screen switch, `guard` composition (add SUBMIT_DONE case, wire `markAttempted`)
- `src/hooks/useOneAttemptGuard.js` — `markAttempted` / `clear` / `hasAttempted` API
- `src/hooks/useAssessmentState.js` — `goToScreen`, `identity` persistence, `sessionStorage` management
- `src/hooks/useScoreboard.js` — score computation (payload assembler consumes its output)
- `src/stores/useAssessmentStore.js` — `answers[]` array, `buildAnswerSnapshot`, `markComplete`, `isComplete`
- `src/state/screens.js` — `SCREENS` enum (add `SUBMIT_DONE`)
- `src/utils/scoring.js` — `scoreAssessment`, `computePerL1Accuracy` (payload source)
- `src/utils/competency.js` — `generateCompetency` (payload source)
- `src/utils/dedup.js` — placeholder `hashEmail` (replace with real SHA-256)
- `src/components/RunnerScreen.jsx` — `onComplete` → currently goes to SCOREBOARD directly
- `src/components/scoreboard/ScoreboardScreen.jsx` — new submission overlay integration point

### Cross-Cutting Concerns
- `.planning/ROADMAP.md` §"Cross-Cutting Concerns Map" — CC-01 (brand-leak: Apps Script code + Sheet name generic)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useOneAttemptGuard` hook — `markAttempted({ emailHash, submissionId })` API ready. Phase 5 calls it inside backend-200 handler.
- `useAssessmentState` hook — `goToScreen(target)` generic transition. Phase 5 uses `goToScreen(SCREENS.SUBMIT_DONE)`.
- `useAssessmentStore` — `answers[]` with full per-video snapshots (`videoId`, `selectedL1`, `selectedL2`, `verdict`, `timeSpentMs`, `timedOut`, `submittedAt`). Directly usable for payload assembly.
- `scoring.js` — `scoreAssessment(answers, answerKeys)`, `computePerL1Accuracy` produce the score data for the payload.
- `competency.js` — `generateCompetency(perL1Accuracy)` produces `{ title, strengthsWeaknesses }` for the payload.
- `src/data/playlist.json` — `videos[].id` used to cross-reference answers.
- `src/data/taxonomy.json` — `version` field for `taxonomyVersion` in payload.

### Established Patterns
- Screen state machine via `SCREENS` enum in `src/state/screens.js` — add `SUBMIT_DONE` following the frozen-object convention.
- Hook composition at App.jsx root — new submission state (loading, error, attempts) lives in ScoreboardScreen or a dedicated `useSubmission` hook.
- Vite env vars (`VITE_*`) for build-time configuration — HMAC secret, Apps Script URL, Formspree form ID.
- Utility modules in `src/utils/` are pure functions — `submission.js` follows this pattern.
- Test files colocated under `tests/` mirroring `src/` structure.
- `screens.test.js` expects exactly N keys in SCREENS — must update count when adding `SUBMIT_DONE`.

### Integration Points
- **App.jsx** — adds `SUBMIT_DONE` case to the `renderScreen` switch. Passes `identity` to `SubmitDoneScreen` for the thank-you name.
- **ScoreboardScreen** — receives `onSubmitComplete` callback or imports submission logic directly. The overlay/banner/submission-phase state lives here.
- **RunnerScreen** — currently calls `onComplete()` → SCOREBOARD. Phase 5 does NOT change this flow. Submission happens AFTER scoreboard renders.
- **useOneAttemptGuard** — Phase 5 imports `markAttempted` and calls it. The `clear()` API exists for dev reset.
- **sessionStorage** — `cma_identity_v1` cleared on SUBMIT_DONE mount. `cma_timer_v1` already cleared by store reset.

</code_context>

<specifics>
## Specific Ideas

- Scoreboard overlay: semi-transparent dark backdrop over the scoreboard, centered card with loading spinner and "Submitting results... (attempt 1/3)" text. Updates on retry. Transitions to green success card on 200.
- Success banner: green-tinted card with checkmark icon, "Results sent to the hiring team", auto-fades after 5 seconds. Use `setTimeout` for the auto-transition.
- `SubmitDoneScreen`: clean centered layout matching LandingScreen simplicity. Heading "Thank you, {name}" (from `state.identity`). Body paragraph confirming results sent. No buttons, no navigation — terminal screen.
- The submission overlay animation should be subtle — a CSS fade-in, not a Lottie or GSAP transition (polish deferred to Phase 6).
- Apps Script `doPost` returns `{ ok: true, id: "<sha256-hash-or-row-number>" }` on success. The `id` goes into `markAttempted({ submissionId: id })`.
- HMAC shared key: generate a 256-bit random key, stored in both `VITE_HMAC_SECRET` (build-time) and Apps Script Properties `HMAC_SECRET`. Document the generation command: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Email normalization before hashing follows Gmail's documented address normalization: lowercase, remove dots from local part (Gmail only), strip `+alias` suffix (Gmail only). Non-Gmail addresses: lowercase + trim only.
- The `emailHash` in the payload is the normalized-email SHA-256 hex digest — same value written to localStorage via `markAttempted`. Server computes the same hash and checks against previously stored hashes in the Sheet for dedup.
</specifics>

<deferred>
## Deferred Ideas

- Google Sheets dashboard/recruiter UI — future phase (needs Apps Script web app or separate frontend)
- Email notification to recruiter on new submission — future phase (Apps Script `MailApp.sendEmail`)
- Automated clasp-based CI/CD for Apps Script deployment — future phase (needs clasp auth token in GitHub Secrets)
- PDF export of scoreboard — v2 (BOARD-v2-02)
- Shareable URL export — v2 (BOARD-v2-01)
- Contact email/phone on `SUBMIT_DONE` — deferred until actual recruiter contact is known. Copy stays generic.
- Browser-fingerprint dedup as additional signal — v2 (ATTEMPT-v2-01)
- Submission analytics/telemetry (success rate, latency p50/p99, retry distribution) — future phase
- Offline/queue-based submission (service worker retry) — v2 (overkill for v1 desktop-only hiring test)
- GSAP transitions for submission overlay + submit-done — Phase 6 polish
- Design tokens, typography, spacing for `SubmitDoneScreen` — Phase 6 polish

</deferred>

---

*Phase: 05-submission-one-attempt-defense-in-depth*
*Context gathered: 2026-07-08 via interactive discuss*
