# Architecture Research

**Domain:** Content-moderation video hiring assessment — Static React SPA on GitHub Pages + Git LFS
**Researched:** 2026-07-07
**Confidence:** HIGH (grounded in verified reference implementation `flagmail1` + published GitHub Pages / LFS / HTML5 video patterns)

---

## Executive Summary

This is a **zero-backend static SPA** with a **screen-based state machine** (LANDING → GUIDELINES → RUNNER → SCOREBOARD → SUBMIT). Because the reference implementation `flagmail1` already ships a hook-composition pattern (`useGameState` + `useScoring` + `useTimer` + `useBadges`) that manager and reviewer have already accepted, we replicate that exact pattern rather than introducing Redux/Zustand. Ground-truth answer keys are **compiled into the bundle** (JSON imported by JS, tree-shaken at build) — no runtime fetch, no network dependency for grading. Videos and thumbnail sprites ship as **Git LFS pointers** in the same repo; GitHub Actions checks out LFS, runs Vite build, and deploys to `gh-pages`. Thumbnail sprites are generated **at build time via ffmpeg in a script** (not runtime canvas capture) so playback works even on low-end candidate machines. One-attempt enforcement uses **localStorage as fast client guard** plus **backend dedup via Formspree/Sheets** as authoritative server-side reject.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     BROWSER (Static SPA)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐    │
│   │                     App.jsx (root)                     │    │
│   │           screen-state-machine + <ErrorBoundary>       │    │
│   └───┬────────┬────────┬─────────┬─────────┬──────────────┘    │
│       │        │        │         │         │                    │
│   ┌───▼──┐ ┌───▼───┐ ┌──▼────┐ ┌──▼─────┐ ┌▼──────────┐          │
│   │Landing│ │Guide │ │Runner │ │Scoreb'd│ │SubmitDone │          │
│   │Screen │ │lines │ │Screen │ │Screen  │ │Screen     │          │
│   └───────┘ └──────┘ └───┬───┘ └────────┘ └───────────┘          │
│                          │                                       │
│              ┌───────────┼───────────┐                           │
│              │           │           │                           │
│         ┌────▼────┐ ┌────▼────┐ ┌────▼──────┐                    │
│         │Video    │ │Chapter  │ │Tag Panel  │                    │
│         │Player   │ │Timeline │ │L1 + L2    │                    │
│         │(<video>)│ │Markers  │ │+ Verdict  │                    │
│         └────┬────┘ └─────────┘ └───────────┘                    │
│              │                                                   │
│         ┌────▼──────┐  ┌──────────┐                              │
│         │ Countdown │  │ Sprite-  │                              │
│         │ 3-min     │  │ hover    │                              │
│         │ Timer     │  │ preview  │                              │
│         └───────────┘  └──────────┘                              │
├──────────────────────────────────────────────────────────────────┤
│                     STATE HOOKS (in-memory)                       │
│  useAssessmentState │ useVideoAnswer │ useScoring │ useTimer     │
│  useOneAttemptGuard │ useBadges                                   │
├──────────────────────────────────────────────────────────────────┤
│              STATIC DATA (compiled into bundle)                   │
│    playlist.json │ answerKeys.json │ taxonomy.json                │
├──────────────────────────────────────────────────────────────────┤
│               STATIC ASSETS (served from origin)                  │
│    /videos/*.mp4 (LFS) │ /sprites/*.jpg (LFS) │ /vtt/*.vtt        │
│    /lottie/*.json (lazy) │ /fonts/*.woff2                         │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
              ┌─────────────────────────────────┐
              │  Formspree OR Google Sheets     │
              │  Webhook — single POST at end   │
              │  (dedup by email server-side)   │
              └─────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `App.jsx` | Screen-state machine, orchestrates hooks, renders one screen at a time | Same pattern as `flagmail1/src/App.jsx`: `SCREENS` enum + conditional render |
| `LandingScreen` | Capture name+email; check localStorage one-attempt guard; block on prior attempt | Controlled form + basic email regex + `localStorage.getItem('cma_attempt')` |
| `GuidelinesScreen` | Show L1/L2 taxonomy w/ examples; require scroll-to-bottom OR N-second dwell before "Start Test" | Static content component + IntersectionObserver on footer sentinel |
| `RunnerScreen` | Owns per-video loop (video N of 5), mounts Player + TagPanel + Timer | Container reading `currentVideoIndex` from `useAssessmentState` |
| `VideoPlayer` | Custom skin over `<video>`, seek bar, hover-thumbnail sprite, chapter markers, play/pause | Uncontrolled `<video ref>` + custom UI overlay; no third-party player library |
| `ChapterMarkers` | Render pill markers on seek bar at flagged timestamps from playlist.json | Absolute-positioned divs computed from `chapters[]` |
| `HoverThumbnail` | On seek-bar hover, compute time → sprite frame index → show sprite crop | CSS `background-position` on div sized to one sprite tile |
| `CountdownTimer` | 3-min per-video timer; auto-submit on expiry; green/amber/red phases | Reuse `useTimer.js` verbatim from flagmail1 (already proven) |
| `TagPanel` | Multi-select L1 chips; dependent L2 chips filtered by selected L1s; Approve/Decline verdict button | Controlled component driven by `useVideoAnswer` reducer |
| `ScoreboardScreen` | Per-category accuracy, competency title, Lottie milestones, overall % | Direct clone of `flagmail1/src/components/ResultsScreen.jsx` shape |
| `SubmitDoneScreen` | Confirmation after POST; disable retry via localStorage flag | Simple confirmation card |
| `useAssessmentState` | Screen router, player identity, current video index, per-video answers array | Custom hook (composition pattern from `useGameState`) |
| `useScoring` | Rubric math (verdict 50 / L1 25 / L2 25) with partial credit | Custom hook mirroring `useScoring` from flagmail1 |
| `useOneAttemptGuard` | Read/write `cma_attempt_v1` localStorage key; expose `hasAttempted`, `markAttempted` | Custom hook — thin wrapper on localStorage |
| `useTimer` | Countdown w/ phase colors + timeout callback | **Verbatim reuse** of `flagmail1/src/hooks/useTimer.js` |

---

## Recommended Project Structure

```
src/
├── App.jsx                          # screen state machine root
├── main.jsx                         # ReactDOM.createRoot entry
├── index.css                        # base styles
│
├── components/
│   ├── LandingScreen.jsx            # name+email + one-attempt gate
│   ├── GuidelinesScreen.jsx         # taxonomy walkthrough
│   ├── RunnerScreen.jsx             # per-video loop container
│   ├── ScoreboardScreen.jsx         # results + Lottie
│   ├── SubmitDoneScreen.jsx         # post-submit confirmation
│   ├── ErrorBoundary.jsx            # copy from flagmail1
│   │
│   ├── player/                      # video player subtree
│   │   ├── VideoPlayer.jsx          # <video> + custom controls
│   │   ├── SeekBar.jsx              # scrubber + chapters + hover preview
│   │   ├── ChapterMarker.jsx        # single suspicious-moment pin
│   │   ├── HoverThumbnail.jsx       # sprite-crop preview on hover
│   │   └── PlayerControls.jsx       # play/pause/mute/volume
│   │
│   ├── tagging/
│   │   ├── TagPanel.jsx             # L1+L2+verdict container
│   │   ├── L1Chips.jsx              # multi-select category chips
│   │   ├── L2Chips.jsx              # dependent sub-category chips
│   │   └── VerdictButton.jsx        # Approve/Decline segmented control
│   │
│   └── scoreboard/
│       ├── CategoryAccuracy.jsx     # per-L1 accuracy bars
│       ├── CompetencyBadge.jsx      # Advanced/Proficient/Foundation
│       ├── MilestoneLottie.jsx      # lazy Lottie loader
│       └── PerVideoBreakdown.jsx    # correct/incorrect per video
│
├── hooks/
│   ├── useAssessmentState.js        # screen + identity + video index + answers[]
│   ├── useVideoAnswer.js            # reducer for one video's L1/L2/verdict state
│   ├── useScoring.js                # rubric computation
│   ├── useTimer.js                  # COPY from flagmail1 unchanged
│   ├── useOneAttemptGuard.js        # localStorage attempt flag
│   ├── useVideoPlayer.js            # imperative ref over <video>
│   └── useBadges.js                 # copy from flagmail1
│
├── data/                            # BUNDLED — imported by JS, tree-shaken
│   ├── playlist.json                # video metadata (src, chapters, duration)
│   ├── answerKeys.json              # ground truth per video (L1s, L2s, verdict, reasoning)
│   └── taxonomy.json                # L1/L2 tree with descriptions + examples
│
├── utils/
│   ├── scoring.js                   # rubric math (pure functions, unit-testable)
│   ├── competency.js                # score → tier + strengths/weaknesses text
│   ├── submit.js                    # Formspree / Sheets webhook POST
│   ├── dedup.js                     # SHA-256 email hash for backend dedup key
│   └── validators.js                # email regex, form validation
│
├── config/
│   ├── app.js                       # VIDEO_DURATION_S, SUBMIT_URL, ATTEMPT_KEY
│   └── phase.js                     # feature flags per build phase
│
├── assets/
│   ├── animation/                   # Lottie JSON — loaded lazy
│   └── fonts/                       # self-hosted woff2
│
└── styles/
    └── animations.css               # keyframes (spin, pulse, etc.)

public/                              # copied to dist/ as-is
├── videos/                          # *.mp4 — LFS-tracked
│   ├── v01.mp4
│   └── ...
├── sprites/                         # *.jpg thumbnail sprites — LFS-tracked
│   ├── v01_sprite.jpg
│   └── ...
└── vtt/                             # WebVTT for chapters (optional, redundant w/ JSON)

scripts/
├── generate-sprites.mjs             # ffmpeg pipeline — run pre-build
└── build-answer-keys.mjs            # validate answerKeys.json shape

.github/
└── workflows/
    └── deploy.yml                   # Actions: checkout w/ LFS → build → gh-pages

.gitattributes                       # LFS filter for *.mp4, *.jpg in sprites/
vite.config.js                       # base: '/<repo-name>/'
```

### Structure Rationale

- **`components/` grouped by feature-subtree (player, tagging, scoreboard):** matches how the screens compose. `RunnerScreen` renders `player/*` + `tagging/*` side-by-side; each subtree is independently developable.
- **`data/` in `src/` (not `public/`):** answer keys and taxonomy are **imported by JavaScript**, so Vite tree-shakes them, applies content hashing, and prevents casual URL-based cheating (candidate can't `curl /data/answerKeys.json`). Playlist is here too because it changes rarely and referencing `import videoUrl from '/videos/v01.mp4'` doesn't work through LFS — we hardcode paths.
- **`public/videos/` and `public/sprites/`:** must be in `public/` because Vite passes them through untouched — Git LFS pointers get resolved to real files at checkout, then copied verbatim into `dist/`.
- **`scripts/` for build-time asset generation:** ffmpeg sprite generation runs **once per video added**, checked into repo. Never runs in the browser.
- **`hooks/` at the top level:** matches flagmail1 exactly; manager pattern-matches on this layout instantly.

---

## Data Flow

### Screen State Machine (unidirectional)

```
                          ┌────────────────────┐
                          │  useOneAttemptGuard │
                          │  (localStorage)    │
                          └─────────┬──────────┘
                                    │ hasAttempted?
                                    ▼
   LANDING ──── name+email ────► GUIDELINES ────► RUNNER ─────► SCOREBOARD ────► SUBMIT_DONE
      │                                              │              │                │
      │ (identity captured)              (loop 5 times)              │                │
      │                                              │              │                │
      │                                     video N of 5             │       POST to Formspree/
      │                                              │              │       Sheets (once)
      │                                              │              │                │
      │                              ┌───────────────┴────────┐     │                │
      │                              │                        │     │                │
      │                     ┌────────▼──────────┐             │     │                │
      │                     │ Video Player      │             │     │                │
      │                     │  ↕ chapter clicks │             │     │                │
      │                     │  ↕ scrub          │             │     │                │
      │                     └────────┬──────────┘             │     │                │
      │                              │                        │     │                │
      │                     ┌────────▼──────────┐             │     │                │
      │                     │ 3-min Timer       │             │     │                │
      │                     │  fires → auto-    │             │     │                │
      │                     │  submit current   │             │     │                │
      │                     └────────┬──────────┘             │     │                │
      │                              │                        │     │                │
      │                     ┌────────▼──────────┐             │     │                │
      │                     │ TagPanel          │             │     │                │
      │                     │  L1[] + L2[] +    │             │     │                │
      │                     │  verdict          │             │     │                │
      │                     └────────┬──────────┘             │     │                │
      │                              │                        │     │                │
      │                              │ SUBMIT_VIDEO_ANSWER    │     │                │
      │                              ▼                        │     │                │
      │                     answers[N] = {L1, L2, verdict}    │     │                │
      │                              │                        │     │                │
      │                              ▼                        │     │                │
      │                        N < 4? YES → loop              │     │                │
      │                        N == 4? NO ─────────────────► compute scoring        │
      │                                                       (rubric) → set state ─▼
      │                                                                       (idempotent)
      ▼
  markAttempted() written to localStorage AT SUBMIT_DONE entry
```

### State Shape (single source of truth in `useAssessmentState`)

```javascript
{
  screen: 'LANDING' | 'GUIDELINES' | 'RUNNER' | 'SCOREBOARD' | 'SUBMIT_DONE',
  identity: { name: string, email: string, startedAt: ISO8601 },
  currentVideoIndex: 0..4,
  answers: [
    {
      videoId: 'v01',
      selectedL1: ['hate_harassment', 'violence'],   // multi-select
      selectedL2: ['slurs', 'graphic_injury'],       // dependent multi-select
      verdict: 'DECLINE' | 'APPROVE' | null,
      timeSpentMs: number,
      timedOut: boolean,
      submittedAt: ISO8601,
    },
    // ... 5 entries total
  ],
  scoring: null | {                                  // computed once at end of RUNNER
    perVideo: [{ videoId, verdictCorrect, l1Score, l2Score, total }],
    perCategory: { hate_harassment: 0.80, violence: 1.0, ... },
    overallPct: 74,
    tier: 'Proficient',
    milestones: ['SNIPER', 'ZONE_CLEAR'],
  },
  submission: { status: 'idle' | 'posting' | 'done' | 'error', attemptCount: 0..3 },
}
```

**Why one shape, one hook:**
- Manager already accepted this composition in flagmail1 — same mental model.
- All screens are pure functions of `screen` field; unidirectional data flow is trivial to reason about.
- Persisting the whole shape into `sessionStorage` on every write makes reload-mid-test recovery a one-liner (nice-to-have, not required for v1).

### Key Data Flows

1. **Identity capture:** `LandingScreen` → `useOneAttemptGuard.hasAttempted()` returns `true` → block with "You already completed this assessment" screen. Otherwise `useAssessmentState.startAssessment({name, email})` → transition to `GUIDELINES`.

2. **Per-video answer flow:** `TagPanel` dispatches `setL1(['x'])` / `setL2(['y'])` / `setVerdict('DECLINE')` → local reducer state → on Submit or timer-timeout → `useAssessmentState.commitVideoAnswer(index, payload)` → advance `currentVideoIndex` → `useTimer.reset() + start()` for next video.

3. **Scoring:** After video 5 commit → `useScoring.compute(answers, answerKeys)` runs pure functions from `utils/scoring.js` → produces `scoring` object → transition to `SCOREBOARD`.

4. **Submission:** On `SCOREBOARD` mount OR on user-click "Continue" → `utils/submit.js` POSTs consolidated payload (identity + answers + scoring + `attemptFingerprint`) → on `200 OK` → `useOneAttemptGuard.markAttempted(email)` writes `cma_attempt_v1` → transition to `SUBMIT_DONE`. On failure: retry up to 3× with exponential backoff, then surface "Contact recruiter" with copyable payload.

---

## Architectural Patterns

### Pattern 1: Screen State Machine via Enum + Conditional Render

**What:** Single `screen` string field drives a switch of top-level renders in `App.jsx`. No React Router. No client-side URL routing.

**When to use:** Linear multi-step flows with no need for deep-linking or history (assessments, onboarding, checkout). Especially fits a **one-attempt-only** product where forward-only navigation is enforced.

**Trade-offs:**
- (+) Simplest possible mental model; matches flagmail1 exactly.
- (+) Impossible for candidate to jump to `/scoreboard` and see answers — no URL exists.
- (+) Refresh loses progress (which is a **feature** for hiring integrity, not a bug).
- (−) No deep links (fine — nothing here needs them).
- (−) Browser back button is inert (add `history.pushState` block if needed).

**Example:**
```jsx
// App.jsx
const SCREENS = { LANDING: 'landing', GUIDELINES: 'guidelines',
                  RUNNER: 'runner', SCOREBOARD: 'scoreboard', SUBMIT_DONE: 'submit_done' };

export default function App() {
  const state = useAssessmentState();
  return (
    <ErrorBoundary>
      {state.screen === SCREENS.LANDING    && <LandingScreen    onStart={state.startAssessment} />}
      {state.screen === SCREENS.GUIDELINES && <GuidelinesScreen onContinue={state.enterRunner} />}
      {state.screen === SCREENS.RUNNER     && <RunnerScreen     state={state} />}
      {state.screen === SCREENS.SCOREBOARD && <ScoreboardScreen state={state} />}
      {state.screen === SCREENS.SUBMIT_DONE && <SubmitDoneScreen />}
    </ErrorBoundary>
  );
}
```

**Recommendation:** Do **not** introduce `react-router-dom`. The reference product doesn't. Adding it forces URL invariants we actively want to prevent.

### Pattern 2: Hook Composition Over Global Store

**What:** Instead of Redux/Zustand/Context, compose small custom hooks at the App level. Each hook owns one slice of state.

**When to use:** SPA with <10 screens, no cross-tree state sharing, no time-travel debugging need. Assessment fits perfectly.

**Trade-offs:**
- (+) Zero dependencies.
- (+) Each hook is unit-testable in isolation (`renderHook`).
- (+) Manager already accepted the pattern.
- (−) Prop drilling if hooks are consumed deep in the tree — mitigated by passing the whole `state` object down as a single prop (as flagmail1 does).
- (−) No middleware for logging/analytics — not needed here.

**Recommendation:** Zustand would be overkill; Context is fine if a single deep component needs a slice, but not needed by default.

### Pattern 3: Reducer for Per-Video Answer State

**What:** `useVideoAnswer` uses `useReducer` (not multiple `useState`) because L1 selection cascades into filtered L2 options — mutations are coupled.

**When to use:** State transitions where multiple fields update together and invariants matter (e.g., "deselecting an L1 must drop its L2 children").

**Example:**
```javascript
function videoAnswerReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_L1': {
      const nextL1 = toggle(state.selectedL1, action.id);
      // Drop L2s whose parent is no longer selected
      const validL2 = state.selectedL2.filter(l2 => nextL1.some(l1 => TAXONOMY[l1].l2.includes(l2)));
      return { ...state, selectedL1: nextL1, selectedL2: validL2 };
    }
    case 'TOGGLE_L2':  return { ...state, selectedL2: toggle(state.selectedL2, action.id) };
    case 'SET_VERDICT': return { ...state, verdict: action.verdict };
    case 'RESET':       return initialAnswerState();
  }
}
```

### Pattern 4: Ground-Truth Compiled Into Bundle (Not Fetched)

**What:** `answerKeys.json` and `taxonomy.json` live in `src/data/` and are `import`ed by JS. Vite bundles them into a hashed chunk.

**When to use:** Grading logic that runs in the browser but where the ground truth **should not be trivially discoverable** by URL.

**Trade-offs:**
- (+) No runtime fetch — grading works offline mid-test.
- (+) Bundling obscures the file path (`assets/index-abc123.js` contains the keys mixed with code — not casually greppable).
- (+) Tree-shaking + minification make casual inspection much harder than `curl /answerKeys.json`.
- (−) **Determined candidate can still extract keys from bundle.** This is a hiring test, not a certification exam — the reputational cost of getting caught cheating is the actual deterrent. If real anti-cheat is needed, move grading server-side (out of scope per PROJECT.md).
- (−) Rebuilding is required to update answer keys — that's a feature (versioning + deploy trail).

**Alternative considered — runtime-fetched JSON:** Rejected. Bundled version wins on obscurity, offline resilience, and single-artifact deploy.

### Pattern 5: Build-Time Thumbnail Sprite Generation (ffmpeg)

**What:** A Node script `scripts/generate-sprites.mjs` shells out to ffmpeg to sample N frames per video, tile them into one JPEG sprite (e.g., 10×10 grid = 100 thumbnails), and emit a WebVTT manifest mapping `time → sprite region`.

**When to use:** Any custom video player wanting hover-preview thumbnails without runtime canvas capture (which fails on some browsers, drops frames on low-end machines, and requires playing the video invisibly).

**Trade-offs:**
- (+) Zero runtime cost — sprite is just a `<img>` with `background-position`.
- (+) Works even before the video is buffered.
- (+) Sprite is ~200-500 KB per video, LFS-tracked once.
- (−) Rebuild sprite on every video edit — but videos are stable content.
- (−) Adds ffmpeg as build-time dep — install via GH Actions `apt-get install ffmpeg` (already present on `ubuntu-latest`).

**Example script sketch:**
```javascript
// scripts/generate-sprites.mjs
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const COLS = 10, ROWS = 10, TILE_W = 160, TILE_H = 90;

for (const video of readdirSync('public/videos').filter(f => f.endsWith('.mp4'))) {
  const base = video.replace('.mp4', '');
  const duration = Number(execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 public/videos/${video}`
  ).toString().trim());
  const interval = duration / (COLS * ROWS);

  execSync(
    `ffmpeg -y -i public/videos/${video} ` +
    `-vf "fps=1/${interval},scale=${TILE_W}:${TILE_H},tile=${COLS}x${ROWS}" ` +
    `-frames:v 1 public/sprites/${base}_sprite.jpg`
  );
  // Emit WebVTT thumb track pointing at sprite regions...
}
```

**HoverThumbnail component consumes it:**
```jsx
function HoverThumbnail({ hoverTime, duration, videoId }) {
  const frame = Math.floor((hoverTime / duration) * (COLS * ROWS));
  const col = frame % COLS, row = Math.floor(frame / COLS);
  return (
    <div style={{
      width: TILE_W, height: TILE_H,
      backgroundImage: `url(/sprites/${videoId}_sprite.jpg)`,
      backgroundPosition: `-${col * TILE_W}px -${row * TILE_H}px`,
    }} />
  );
}
```

### Pattern 6: Countdown Timer Coupled to Video Element (Not Wall Clock)

**What:** The 3-min timer runs on wall-clock (`setInterval`), independent of video playback. On expiry, fires `onTimeout` → commits current answer with `timedOut: true`. **Pausing the video does NOT pause the timer.**

**When to use:** Assessment timers where the candidate must complete within N minutes regardless of playback speed.

**Trade-offs vs "video-currentTime-driven":**
- (+) Deters gaming (candidate can't pause + think forever).
- (+) Reuses `useTimer.js` from flagmail1 verbatim.
- (−) Candidate can lose time to slow video buffer — mitigate by starting timer only after `canplaythrough` event fires.

**Recommendation:** Start timer on `canplaythrough`, not on component mount. Show "Loading video…" spinner until ready. Once started, timer runs to zero regardless of playback state.

### Pattern 7: Lazy Lottie Loading (per milestone)

**What:** Lottie JSON files (~50-200 KB each × 11 files) are `React.lazy`-loaded per-milestone at scoreboard render time, not bundled with initial JS.

**When to use:** Large optional assets shown conditionally. Aligns with flagmail1 pattern (`AdminPanel` already lazy).

**Example:**
```jsx
const PerfectEyeLottie = lazy(() => import('../assets/animation/perfect_eye.json')
  .then(m => ({ default: () => <Lottie animationData={m.default} /> })));

// In ScoreboardScreen:
{milestones.includes('PERFECT_EYE') && (
  <Suspense fallback={null}><PerfectEyeLottie /></Suspense>
)}
```

**Trade-offs:**
- (+) Initial bundle stays small (< 300 KB gzipped goal).
- (+) Only downloads the animations the candidate actually earned.
- (−) Slight delay (~200ms) before animation appears on scoreboard — acceptable.

**Alternative — eager load all 11:** Rejected. Would add ~1 MB to initial bundle, most never shown.

### Pattern 8: One-Attempt Guard (Defence in Depth)

**What:** Two independent gates: (a) client-side localStorage flag `cma_attempt_v1` = `{email, completedAt, submissionId}`, (b) server-side dedup by SHA-256(email) in the Sheets/Formspree payload.

**When to use:** Any assessment where retakes contaminate the signal.

**Trade-offs:**
- (+) LocalStorage guard: instant UX ("You already completed this"), zero network.
- (+) Backend dedup: authoritative — clearing localStorage / using incognito doesn't defeat it.
- (−) Different email = new attempt. Acceptable per PROJECT.md (identity is candidate-declared, not verified).
- (−) Sheets webhook needs a Google Apps Script that checks for existing rows before writing. Formspree can't dedup natively; either accept dup rows in inbox (recruiter filters) or use Formspree's [webhook forwarding to a Sheets script](https://formspree.io/help/webhooks/).

**Recommendation:** Google Sheets + Apps Script webhook. It's the same pattern flagmail1 uses (`google-apps-script.js` in that repo) and gives dedup for free.

**Client:**
```javascript
// useOneAttemptGuard.js
const KEY = 'cma_attempt_v1';
export function useOneAttemptGuard() {
  const record = JSON.parse(localStorage.getItem(KEY) || 'null');
  const hasAttempted = Boolean(record);
  const markAttempted = ({ email, submissionId }) =>
    localStorage.setItem(KEY, JSON.stringify({ email, completedAt: Date.now(), submissionId }));
  return { hasAttempted, record, markAttempted };
}
```

**Server (Apps Script):**
```javascript
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSheet();
  const emailHash = payload.emailHash;  // SHA-256 from client
  const existing = sheet.getRange('A:A').getValues().flat();
  if (existing.includes(emailHash)) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'duplicate' }));
  }
  sheet.appendRow([emailHash, payload.name, payload.email, /* ... */]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: Utilities.getUuid() }));
}
```

---

## GitHub Actions + Git LFS Deploy Pipeline

### End-to-End Flow

```
Developer commits video → LFS pointer stored in git; blob in LFS storage
                              │
                              ▼
                    git push origin main
                              │
                              ▼
             ┌────────────────────────────────────┐
             │  GitHub Actions runner (ubuntu)    │
             │                                    │
             │  1. actions/checkout@v4            │
             │     with: lfs: true                │  ← REAL video bytes downloaded
             │                                    │
             │  2. setup-node@v4 (Node 20)        │
             │                                    │
             │  3. npm ci                         │
             │                                    │
             │  4. (sprites already committed —   │
             │      or run: node scripts/         │
             │      generate-sprites.mjs if       │
             │      missing)                      │
             │                                    │
             │  5. npm run build                  │
             │     → dist/ (with videos+sprites   │
             │       copied from public/)         │
             │                                    │
             │  6. peaceiris/actions-gh-pages@v3  │
             │     publish_dir: ./dist            │
             │     publish_branch: gh-pages       │
             └────────────────┬───────────────────┘
                              ▼
                     gh-pages branch updated
                              │
                              ▼
             GitHub Pages serves from gh-pages/
             at https://<user>.github.io/<repo>/
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages-deploy
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true           # CRITICAL — pulls real MP4 bytes not pointers

      - name: Verify LFS files are real
        run: |
          file public/videos/*.mp4 | grep -q "MP4" || (echo "LFS not resolved!" && exit 1)

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run build
        env:
          # Vite reads this into config
          VITE_BASE_URL: /${{ github.event.repository.name }}/

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

### `.gitattributes`

```
public/videos/*.mp4  filter=lfs diff=lfs merge=lfs -text
public/sprites/*.jpg filter=lfs diff=lfs merge=lfs -text
*.lottie             filter=lfs diff=lfs merge=lfs -text
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',  // matches gh-pages path
  build: { assetsInlineLimit: 0 },          // never inline videos as data-URIs
});
```

### LFS Bandwidth Budget

- **Free tier:** 1 GB storage + 1 GB bandwidth/month.
- **Video budget:** 5 videos × ~40 MB = ~200 MB. Fits storage easily.
- **Bandwidth:** Each candidate downloads ~200 MB → **5 candidates/month before overage**. **This is a real constraint.**
- **Mitigation options** (document in PITFALLS.md too):
  1. Re-encode at H.264 720p @ 500-800 kbps to hit ~15 MB/video (~75 MB total per candidate).
  2. Preload only current-video-index + next; do not eager-load all 5 at page load.
  3. If bandwidth blows up, migrate videos to Cloudflare R2 or Backblaze B2 (near-zero egress) with `<video src="https://cdn...">` — pattern is identical, just external URL. **This should be a Phase 4 fallback path.**
- **Do not** attempt to serve LFS files via `media.githubusercontent.com` — that URL is rate-limited and unsupported for hotlinking.

---

## Suggested Build Order (Phase Structure)

| Phase | What ships | Why this order |
|-------|-----------|----------------|
| **1. Foundations** | Vite + React 19 scaffold; `App.jsx` with SCREENS enum; `LandingScreen` (name+email); `useAssessmentState` hook; `useOneAttemptGuard`; `GuidelinesScreen` skeleton; deploy to gh-pages with placeholder | Establishes the deploy pipeline and state machine before content complexity is added. First working URL end-to-end. |
| **2. Video Player** | `VideoPlayer` w/ custom controls; `SeekBar` w/ chapter markers; `HoverThumbnail` w/ pre-generated sprites; ffmpeg script; 1 test video via LFS | Player is the highest-risk custom component. De-risk before tagging UI is built on top of it. |
| **3. Tagging + Timer** | `TagPanel` L1/L2 multi-select; verdict button; reuse `useTimer.js`; per-video state via reducer; auto-submit on timeout; taxonomy.json content | Depends on player working; state shape solidifies here. |
| **4. Scoring + Scoreboard** | `useScoring` hook; `utils/scoring.js` rubric math; `ScoreboardScreen`; `CategoryAccuracy`; `CompetencyBadge`; lazy Lottie milestones; answerKeys.json | Requires answers array from Phase 3. Scoring is pure functions — highly unit-testable, so easy to iterate on. |
| **5. Submission** | Google Apps Script deployed; `utils/submit.js`; dedup via emailHash; retry/backoff; `SubmitDoneScreen`; localStorage flag written; connect to Formspree fallback | Backend integration comes last so it doesn't block front-end iteration. Sheets script can be developed in parallel. |
| **6. Polish** | GSAP transitions; motion parity with flagmail1; final 4 videos + sprites; taxonomy content review; accessibility pass; browser matrix testing | Content and polish are cheapest to defer until form is settled. |

**Build order rationale:**
- Player is **highest-risk** — de-risk first after foundations.
- Scoring math is **highest-testability** — write pure-function unit tests once inputs are stable.
- Submission is **highest-blocking-external** — do it last so front-end iteration isn't gated on Apps Script deploys.
- Content (videos, taxonomy) can be **stubbed then swapped** — final content in Phase 6 doesn't require rework.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-50 candidates/month | Current architecture is sufficient. LFS free tier holds if videos < 20 MB each. |
| 50-500 candidates/month | **Move videos off LFS to Cloudflare R2/B2** (LFS bandwidth ceiling exceeded). Client-side code doesn't change — just swap URLs in `playlist.json`. Move Sheets to Firebase Firestore for concurrent write safety. |
| 500+ candidates/month | Sheets webhook rate-limits (Apps Script has ~30 req/min quota). Migrate to a real backend (Cloudflare Worker + D1, or Vercel + Postgres). Consider server-side grading to close the answer-key leak. |

### Scaling Priorities (what breaks first)

1. **LFS bandwidth** breaks first, well before UI performance does. Video hosting is the #1 architectural risk. Plan the CDN-swap escape hatch now (keep video URLs in playlist.json, not hardcoded).
2. **Sheets append conflicts** break second, at concurrent write >5-10/sec. Apps Script serializes; long queues fail.
3. **Bundle size** never really breaks — even with all Lotties eager, we're under 2 MB.

---

## Anti-Patterns

### Anti-Pattern 1: Storing Answer Keys in `public/answerKeys.json`

**What people do:** Drop `answerKeys.json` in `public/` for convenience.
**Why it's wrong:** Any candidate can `curl https://<site>/answerKeys.json` and pre-read all answers. Game over.
**Do this instead:** Keep in `src/data/answerKeys.json`, imported by JS. Vite bundles it into a hashed JS chunk that mixes with code.

### Anti-Pattern 2: Using `<video>` Native Controls Alongside Custom Chapters

**What people do:** Set `controls` attribute AND overlay custom chapter markers.
**Why it's wrong:** Native controls span the full player width and cover chapter markers; z-index fights; keyboard focus split between two seek bars.
**Do this instead:** Omit `controls`. Build controls entirely custom. Reference the `<video>` via `ref` and drive `.play()`, `.pause()`, `.currentTime` imperatively.

### Anti-Pattern 3: Pausing Timer When Video Pauses

**What people do:** Bind timer to `video.paused` state so candidate can "think without penalty".
**Why it's wrong:** Defeats the purpose of a timed assessment; candidate can effectively take infinite time. Contradicts PROJECT.md "simulates real BPO queue SLA".
**Do this instead:** Timer runs on wall clock once started. Video controls are for review/rewind; they don't buy time.

### Anti-Pattern 4: Fetching Playlist at Runtime for "Flexibility"

**What people do:** `fetch('/playlist.json')` at app boot for "hot-swappable" video list.
**Why it's wrong:** Adds a network request before the first paint; makes testing harder; JSON URL is a public config surface. Zero real benefit — playlist changes require a rebuild anyway because sprites+chapters+answerKeys ship together.
**Do this instead:** `import playlist from './data/playlist.json'`. Rebuild+redeploy is the update workflow.

### Anti-Pattern 5: Persisting Assessment State to localStorage Mid-Test

**What people do:** Save `answers[]` to localStorage after each video so refresh doesn't lose progress.
**Why it's wrong:** Defeats one-attempt integrity — candidate refreshes to escape a bad answer, edits localStorage, or shares saved state with another candidate. Also enables "practice mode" abuse.
**Do this instead:** Keep state in-memory only during test. Only the **completion flag** persists. A mid-test refresh = restart (with the one-attempt guard blocking restart if already completed).

### Anti-Pattern 6: Runtime Thumbnail Capture via Hidden `<video>` + Canvas

**What people do:** Play the video invisibly, seek to each hover time, drawImage → canvas → data-URL for the preview.
**Why it's wrong:** Slow (seek + decode per hover), unreliable across browsers, blocks main thread, drops frames.
**Do this instead:** Pre-generate sprite sheet at build time via ffmpeg. Show via CSS `background-position`. Zero runtime cost.

### Anti-Pattern 7: Introducing React Router "Because It's a SPA"

**What people do:** Add `react-router-dom`, give each screen a URL.
**Why it's wrong:** Enables deep-linking to `/scoreboard` (leaks results shape), forces auth guards, adds a dependency, breaks the one-attempt model.
**Do this instead:** Screen enum + conditional render (as flagmail1 does). Manager already accepted this.

### Anti-Pattern 8: Skipping `lfs: true` in Actions Checkout

**What people do:** `actions/checkout@v4` without `lfs: true`.
**Why it's wrong:** Videos in `dist/` are 100-byte LFS **pointer files** instead of MP4s. Site deploys "successfully" but videos are broken. Failure mode is silent until first candidate tries to play.
**Do this instead:** Always `with: { lfs: true }`. Add the `file public/videos/*.mp4 | grep MP4` verification step so a broken LFS pull fails CI loudly.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Sheets | Apps Script Web App deployed as POST endpoint (`doPost`) | Dedup by emailHash. Requires "Anyone" access. Reuse flagmail1's `google-apps-script.js` as starting template. |
| Formspree (fallback) | HTTPS POST to `https://formspree.io/f/<form-id>` | No native dedup — Sheets preferred. |
| GitHub Pages | Static hosting from `gh-pages` branch | Custom domain optional; default `<user>.github.io/<repo>/` requires `vite.base` = `/<repo>/`. |
| Git LFS | `.gitattributes` filter, LFS server via github.com | 1 GB free / 1 GB bandwidth/mo — plan CDN escape hatch. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `RunnerScreen` ↔ `VideoPlayer` | Player exposes `onCanPlay`, `onEnded`, `onTimeUpdate` callbacks + imperative ref for `.play() / .pause()` | Keep player agnostic of assessment state — it only knows about video ops. |
| `VideoPlayer` ↔ `CountdownTimer` | Timer starts on `onCanPlay` from player; on timeout, calls `commitVideoAnswer(timedOut: true)` on state hook | Timer does NOT read `video.currentTime`. |
| `TagPanel` ↔ `useVideoAnswer` reducer | Dispatch actions: `TOGGLE_L1`, `TOGGLE_L2`, `SET_VERDICT` | Reducer enforces L2-must-have-parent-L1 invariant. |
| `ScoreboardScreen` ↔ `utils/submit.js` | On mount, fire-and-await POST; show submitting overlay pattern from flagmail1 App.jsx | Idempotent — retries include same `submissionId` UUID. |
| `App.jsx` ↔ `useOneAttemptGuard` | Read on `LANDING`; write on `SUBMIT_DONE` | Never write mid-test. |

---

## Sources

- **Reference implementation:** `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1` — verified hook composition pattern (`useGameState`, `useScoring`, `useTimer`, `useBadges`), screen state machine (`SCREENS` enum in `useGameState.js`), Vite `base` config for GitHub Pages, submitting overlay UX, ErrorBoundary pattern, lazy-loaded auxiliary panels. **Confidence: HIGH — code inspected directly.**
- **`flagmail1/src/App.jsx`:** conditional-render screen switching + consolidated payload assembly pattern.
- **`flagmail1/src/hooks/useTimer.js`:** direct reuse target — phased green/amber/red timer already fits 3-min countdown.
- **`flagmail1/vite.config.js`:** `base: '/flagmail1/'` pattern for gh-pages sub-path serving.
- **`.planning/PROJECT.md`:** authoritative source of scope, constraints (LFS free tier, no backend, one-attempt), and key decisions (video hosting via LFS, JSON-driven playlist, backend via Formspree/Sheets).
- **GitHub Actions checkout with LFS** — `actions/checkout@v4` `lfs: true` input is the documented mechanism; verification step (`file ... | grep MP4`) is a common CI hardening pattern to catch silent LFS resolution failures.
- **peaceiris/actions-gh-pages@v3** — widely used deploy action; supports `publish_dir` + `publish_branch` for the exact `dist → gh-pages` shape needed.
- **ffmpeg tile filter** — `-vf "fps=1/N,scale=WxH,tile=CxR"` — canonical sprite-sheet generation invocation.
- **HTML5 `<video>` API** — `canplaythrough` event is the documented signal that playback can proceed uninterrupted; correct hook for timer start.

**Confidence caveats:**
- LFS bandwidth ceiling (1 GB/mo) is a HIGH-confidence GitHub-published limit; the "5 candidates/month before overage" figure assumes 200 MB total payload and is a straightforward division.
- Google Apps Script quota (~30 req/min from a single script) is MEDIUM confidence — verify with your specific deployment before promising volume.
- The pattern of bundling answer keys into JS chunks as **obscurity** (not security) should be flagged in PITFALLS.md — a determined candidate can still extract keys.

---
*Architecture research for: content-moderation video hiring assessment SPA*
*Researched: 2026-07-07*
