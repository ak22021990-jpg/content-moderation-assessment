# Phase 1: App Shell + One-Attempt Gate — Context

**Gathered:** 2026-07-08
**Status:** Ready for planning
**Source:** Interactive discuss during `/gsd:plan-phase 1` (post Phase 0 execution)

<domain>
## Phase Boundary

Deliver a working Landing → Guidelines → ASSESSMENT_PLACEHOLDER flow: users enter name + email on Landing, read the full Guidelines (all 10 L1 categories from `src/data/taxonomy.json` plus L2 sub-categories with one concrete example each), acknowledge the one-attempt + 3-minute-timer + auto-submit policies, click "Begin Assessment", and land on a placeholder screen ("Assessment content ships in Phase 2 — Video Player") that terminates the Phase 1 slice.

The complete `useOneAttemptGuard` hook (both `hasAttempted()` read + `markAttempted()` write API) ships in Phase 1 with unit tests; Phase 5 wires the `markAttempted()` trigger onto the backend-200 handler. Phase 1 exercises only the read path end-to-end (Landing mount checks the flag; if present, renders "AlreadyCompleted" screen).

Screen state machine is a `SCREENS` string enum in `useAssessmentState` (per research ARCHITECTURE.md Pattern 1); no react-router. Identity (name/email) persists via `sessionStorage` so mid-session refresh does not lose it; assessment answers are never persisted (Anti-Pattern 5 in ARCHITECTURE.md). Deploy pipeline from Phase 0 continues green.

**Out of scope:**
- VideoPlayer, TagPanel, timer, scoring, submission (Phases 2–5)
- Backend-200 trigger for `markAttempted()` (Phase 5 owns the wiring)
- GSAP transitions between screens (Phase 6 polish)
- Playwright e2e (deferred; Vitest + happy-dom component tests only per user decision)
- Design system, color tokens, motion primitives (Phase 6)

</domain>

<decisions>
## Implementation Decisions

### Screen Routing (D-P1-01)
- **D-P1-01:** Screen state machine via `SCREENS` string enum. Enum values for Phase 1: `LANDING`, `GUIDELINES`, `ASSESSMENT_PLACEHOLDER`, `ALREADY_COMPLETED`. Enum lives in `src/state/screens.js` as a frozen object. `useAssessmentState` hook owns the `screen` field + transition functions (`startAssessment`, `enterGuidelines`, `enterAssessment`, `resetAttempt`). No `react-router-dom`. This matches ARCHITECTURE.md Pattern 1 + STACK.md "drop react-router entirely" decision.

### State Composition (D-P1-02)
- **D-P1-02:** Hook composition, not Zustand. Phase 1 introduces `useAssessmentState` (screen + identity slice) and `useOneAttemptGuard` (localStorage read/write). No Zustand until Phase 3 (timer slice). App.jsx composes both hooks at the root and passes state down as a single prop object (matches flagmail1 + ARCHITECTURE.md Pattern 2).

### Identity Persistence (D-P1-03)
- **D-P1-03:** Name + email persist in `sessionStorage` under key `cma_identity_v1` as JSON `{ name, email, startedAt }`. Written on Landing form submit (when `startAssessment` transition fires). Cleared when Phase 5's `SUBMIT_DONE` transition completes (Phase 5 owns clear). Session-scope survives page refresh mid-flow but dies on tab close — matches ROADMAP §Phase 1 success criterion 2. NEVER persisted to `localStorage` — that's reserved for the one-attempt flag.

### One-Attempt Guard (D-P1-04)
- **D-P1-04:** Full `useOneAttemptGuard` hook API in Phase 1, no external trigger. localStorage key: `cma_attempt_v1`. Value shape: `{ emailHash: string, completedAt: ISO8601, submissionId: string }`. Hook exports `{ hasAttempted: boolean, record: object | null, markAttempted({ emailHash, submissionId }): void, clear(): void }`. Phase 5 imports `markAttempted` and calls it inside the backend-200 handler. `clear()` exists for dev/test only — no user-facing trigger. Unit tests cover: fresh state → hasAttempted=false; after markAttempted → hasAttempted=true + record shape valid; malformed JSON in localStorage → hasAttempted=false (graceful).
- **D-P1-05:** "Already completed" screen (`ALREADY_COMPLETED`) renders when Landing mounts with `hasAttempted=true`. Copy: "You have already completed this assessment. If you believe this is an error, contact your recruiter." No user-facing reset button. Terminal — no advance transition available. Landing form is NOT rendered on this screen (prevents second-attempt UI leak).

### Form Validation (D-P1-06)
- **D-P1-06:** Manual validation via a `validators.js` utility module (per STACK.md "do NOT add react-hook-form or formik"). Functions: `validateName(str) → { valid, error }` (non-empty, ≤ 100 chars, trimmed); `validateEmail(str) → { valid, error }` (RFC-5322 basic — regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` with trim + max 254 chars). Called on every keystroke via controlled input `onChange`. `Start` button disabled unless both `valid=true`.

### Guidelines Page Structure (D-P1-07)
- **D-P1-07:** Single-scrolling page (no tabs/pagination). Renders each L1 as a section header with the definition, followed by its L2 children as a list — each L2 shows label + definition + one concrete example. All 10 L1s render in the order defined in `taxonomy.json`. Above the L1 list, a top card explicitly discloses (in this order): (a) one-attempt policy, (b) 3-minute per-video timer + auto-submit-on-timeout, (c) Approve vs Decline verdict rule + multi-tag policy. "Begin Assessment" button at the bottom is always enabled (no scroll-to-bottom gating); the button click is the explicit acknowledgment required by GUIDE-05. No `IntersectionObserver` gating in Phase 1.

### Taxonomy Data Contract (D-P1-08)
- **D-P1-08:** GuidelinesScreen consumes `taxonomy.json` via `import taxonomy from '../data/taxonomy.json'` at module scope (STACK.md — bundled, not fetched). Component pattern: `taxonomy.categories.map(l1 => ...)`. Zero hardcoded category names or definitions in JSX (locks GUIDE-06). If `taxonomy.json` schema evolves in a later phase, this component must adapt via the schema — never inline.

### `ASSESSMENT_PLACEHOLDER` Screen (D-P1-09)
- **D-P1-09:** Placeholder screen renders a centered message: "Assessment videos load in Phase 2. This is the placeholder terminus for Phase 1's App Shell slice." Includes a subtle `[dev] Reset` link (only visible when `import.meta.env.DEV === true`) that calls `useOneAttemptGuard.clear()` + `useAssessmentState.reset()` and returns to LANDING. NOT visible in production build. This lets Phase 1 be smoke-tested end-to-end without needing Phase 2/5 wired.

### App Shell Structure (D-P1-10)
- **D-P1-10:** `src/App.jsx` composes `useAssessmentState` + `useOneAttemptGuard` at the top and renders one screen based on `state.screen`. Wrapped in an `<ErrorBoundary>` (new component `src/components/ErrorBoundary.jsx`). `<title>` remains generic "Content Moderation Assessment" (locked in Phase 0). No new fonts, no design tokens introduced (Phase 6 polish).

### Testing Scope (D-P1-11)
- **D-P1-11:** Vitest + happy-dom + `@testing-library/react` + `@testing-library/user-event`. Add these three testing deps in Phase 1 as devDependencies. Test files colocated under `tests/` mirroring `src/` structure. Coverage targets:
  - `tests/utils/validators.test.js` — name + email validators, edge cases (unicode, ≤100 char boundary, invalid emails).
  - `tests/hooks/useOneAttemptGuard.test.js` — fresh state, mark → read, malformed JSON, clear.
  - `tests/hooks/useAssessmentState.test.js` — screen transitions (LANDING→GUIDELINES→ASSESSMENT_PLACEHOLDER), identity persistence, sessionStorage hydration on mount.
  - `tests/components/LandingScreen.test.jsx` — form disabled until both fields valid, "already completed" branch when localStorage flag set, submit transitions to GUIDELINES.
  - `tests/components/GuidelinesScreen.test.jsx` — renders all 10 L1s and L2s from a mocked taxonomy fixture, Begin button transitions to ASSESSMENT_PLACEHOLDER.
- No Playwright / e2e in Phase 1.

### Deploy Verification (D-P1-12)
- **D-P1-12:** Existing Phase 0 deploy workflow (`.github/workflows/deploy.yml`) remains unchanged. Phase 1 close criterion: the merged `main` deploys and the live GitHub Pages URL shows the Landing form (not the Phase 0 placeholder `<h1>`). No new CI steps needed — vitest runs via existing test script (already wired), brand-guard scan runs on the diff.

### Package Additions (D-P1-13)
- **D-P1-13:** No runtime dependency additions in Phase 1. React + ReactDOM already installed. DevDependencies to add:
  - `@testing-library/react@^16.3.0`
  - `@testing-library/user-event@^14.6.0`
  - (happy-dom already at ^20.10.6 — reuse)
  Update `vitest.config.js` to enable happy-dom environment + globals for testing-library.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope + Requirements
- `.planning/ROADMAP.md` §"Phase 1" — 5 success criteria that must all be TRUE for phase close (lines 43–58)
- `.planning/REQUIREMENTS.md` — Phase 1 REQ-IDs: IDENT-01..05 (lines 15–19), GUIDE-01..06 (lines 23–28), ATTEMPT-01, 02, 05 (lines 96, 97, 100)

### Architecture Decisions (locked before Phase 0)
- `.planning/research/ARCHITECTURE.md` §"Standard Architecture" (lines 15–66) — component tree + screen state machine diagram
- `.planning/research/ARCHITECTURE.md` §"Architectural Patterns" Pattern 1 (screen enum, lines 288–321), Pattern 2 (hook composition, lines 323–336), Pattern 8 (one-attempt guard code, lines 465–505)
- `.planning/research/ARCHITECTURE.md` §"Anti-Patterns" Anti-Pattern 5 (never persist answers mid-test, lines 693–697), Anti-Pattern 7 (no react-router, lines 705–710)

### Stack Decisions
- `.planning/research/STACK.md` §"Routing" (lines 82–92) — locked "no router" decision
- `.planning/research/STACK.md` §"Forms & Submission" (lines 108–118) — locked "manual fetch, no form library"
- `.planning/research/STACK.md` §"Testing" (lines 120–132) — Vitest + Playwright decision (Phase 1 uses Vitest only per D-P1-11)

### Cross-Cutting Concerns
- `.planning/ROADMAP.md` §"Cross-Cutting Concerns Map" — CC-01 (brand-leak defense: ongoing) applies to every Landing/Guidelines copy string

### Reference Implementation
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\src\App.jsx` — screen enum switch pattern to mirror
- `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\src\hooks\useGameState.js` — hook composition shape

### Existing Repo State (Phase 0 outputs)
- `src/data/taxonomy.json` — schema locked in Phase 0, consumed by GuidelinesScreen
- `docs/brand-guardrails.md` — forbidden strings for Landing/Guidelines copy review
- `vite.config.js` `base: '/content-moderation-assessment/'` — do not modify
- `.husky/pre-commit`, `.github/workflows/brand-guard.yml` — brand scan (excludes `.planning/**`; documented in `docs/brand-guardrails.md` §"Scan Exclusions")

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from Phase 0)
- `src/main.jsx` — ReactDOM.createRoot entry (unchanged)
- `src/App.jsx` — currently `export default function App() { return <h1>Content Moderation Assessment</h1> }`; Phase 1 replaces this with the screen switch
- `src/data/taxonomy.json` — 10 L1 + L2 tree locked in Phase 0; import from GuidelinesScreen
- `vitest.config.js` — verify happy-dom is the test environment; extend if needed
- `eslint.config.js` — no changes needed
- `.gitignore` — no changes needed

### Established Patterns
- Test files live under `tests/` at repo root (Phase 0 landed `tests/taxonomy.test.js`); mirror the `src/` structure inside `tests/`.
- Import style: ES modules, `.jsx` for React components, `.js` for pure logic + hooks.
- Component filename convention: PascalCase for components (`LandingScreen.jsx`), camelCase for hooks (`useAssessmentState.js`).

### Integration Points (upstream)
- Phase 0 provides: `src/data/taxonomy.json` (GuidelinesScreen consumer), running Vite scaffold + deploy pipeline, brand-guard hooks (constrain copy).

### Integration Points (downstream)
- Phase 2 (VideoPlayer) replaces `ASSESSMENT_PLACEHOLDER` screen with `RunnerScreen`. Contract: `useAssessmentState.enterAssessment()` transition already exists; Phase 2 adds the `currentVideoIndex` slice.
- Phase 5 (Submission) imports `markAttempted` from `useOneAttemptGuard` and calls it inside the backend-200 handler. Contract: `markAttempted({ emailHash, submissionId })` signature is stable.

</code_context>

<specifics>
## Specific Ideas

- Landing form: two `<input>` fields (name + email), a `<button type="submit">` styled as "Start", inline error messages under each field when invalid, aria-invalid on the input. Submit blocked (button disabled + form onSubmit no-op) unless both `validateName` and `validateEmail` return `valid: true`. Preserves keyboard-only usability (Enter submits when valid).
- Guidelines top card copy (draft, subject to Phase 6 wordsmithing):
  1. "This is a one-attempt assessment. You cannot restart it from this browser once submitted."
  2. "Each video runs on a 3-minute countdown. When the timer hits zero, your current tags and verdict submit automatically."
  3. "For each video, tag every category and sub-category that applies (multi-select), then choose Approve or Decline. Approving with zero categories selected is valid."
- Screen enum module (`src/state/screens.js`): `export const SCREENS = Object.freeze({ LANDING: 'LANDING', GUIDELINES: 'GUIDELINES', ASSESSMENT_PLACEHOLDER: 'ASSESSMENT_PLACEHOLDER', ALREADY_COMPLETED: 'ALREADY_COMPLETED' });` — freezing prevents accidental mutation and lets future phases add cases without ambiguity.
- ErrorBoundary is class-based (React docs pattern), catches errors, renders a plain fallback ("Something went wrong. Please refresh."). Not fancy — Phase 6 can polish.
- Hash the email BEFORE writing to `localStorage` via `markAttempted` — hook accepts `emailHash`, not raw email. The hash function itself is Phase 5's concern (Web Crypto SHA-256); Phase 1 stubs a placeholder `hashEmail(str) → str` in `utils/dedup.js` that returns the trimmed lowercase input (Phase 5 replaces with real SHA-256). This lets Phase 1 tests write recognizable-shape records into localStorage.
- Landing screen should focus the name input on mount for keyboard-first usability.
- Package.json test script already runs `vitest run` — no changes.

</specifics>

<deferred>
## Deferred Ideas

- GSAP transitions between screens — **Phase 6** (per ROADMAP polish criterion 4).
- Design tokens, color palette, typography scale, spacing system — **Phase 6** (would introduce churn if landed now, before content is final).
- Playwright e2e smoke test covering full Landing → Guidelines → placeholder path — deferred (user decision D-P1-11). If added later, target Phase 6 (matches "browser matrix" criterion).
- Actual SHA-256 email hashing — **Phase 5** (owns `ATTEMPT-04` normalize + hash).
- Client moderation lead sign-off on L2 wording — **Phase 3** gate (CC-03); Phase 1 renders whatever `taxonomy.json` currently contains without editorializing.
- Accessibility deep audit (screen reader, colour contrast, focus visible tokens) — **Phase 6** (basic aria-invalid + focus management is enough for Phase 1 close).
- "Contact recruiter" contact info on `ALREADY_COMPLETED` — deferred until an actual contact address is known; copy is generic until then.
- `sessionStorage` clear on final SUBMIT_DONE — **Phase 5** owns.
- Locale / i18n — out of scope for v1.

</deferred>

---

*Phase: 01-app-shell-one-attempt-gate*
*Context gathered: 2026-07-08 via interactive discuss (Recommended answers to 3 gray-area questions on ATTEMPT-01 scope, post-Guidelines destination, and test depth)*
