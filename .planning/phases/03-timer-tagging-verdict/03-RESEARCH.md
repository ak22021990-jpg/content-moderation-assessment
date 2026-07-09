---
phase: 03-timer-tagging-verdict
artifact: RESEARCH.md
status: complete
researched: 2026-07-08
confidence: HIGH
sources:
  - https://github.com/pmndrs/zustand (README, v5.0.14 API)
  - https://www.media-chrome.org/docs/en/react/hooks (MediaStore hooks)
  - src/App.jsx (screen routing, onReady wiring)
  - src/components/player/VideoPlayerScreen.jsx (player, onReady)
  - src/data/taxonomy.json (10 L1, 63 L2)
  - src/data/playlist.json (single video, needs 4 more)
  - src/hooks/useAssessmentState.js (screen state machine)
  - src/state/screens.js (SCREENS enum)
  - src/index.css (dark theme design tokens)
  - .planning/REQUIREMENTS.md (TIME, TAG, VERDICT reqs)
  - .planning/research/STACK.md (zustand@5.0.14 decision)
  - .planning/research/PITFALLS.md (Pitfall 5 timer)
  - .planning/research/ARCHITECTURE.md (patterns)
---

# Research — Phase 3: Timer + L1/L2 Tagging + Verdict

## Summary

Phase 3 delivers the core assessment interaction: per-video 3-minute countdown timer, multi-select L1/L2 taxonomy tagging panel, and Approve/Decline verdict flow. Introduces Zustand as cross-cutting state manager for timer state (persisted to sessionStorage for refresh survival) and per-video answer accumulation. Existing VideoPlayerScreen becomes subordinate to new RunnerScreen composing: VideoPlayer + CountdownTimer + TagPanel + VerdictButtons. Multi-video iteration through 5-video playlist is controlled by `currentVideoIndex` in Zustand store, with answer state resetting per video and accumulating into `answers[]` array for downstream scoring (Phase 4).

**Primary recommendation:** Single Zustand store with three logical slices (timer, assessment, answers). Timer uses `performance.now()` deltas + `requestAnimationFrame` (NOT `setInterval`). TagPanel is data-driven controlled component consuming `taxonomy.json` via import. Verdict buttons trigger answer commit + advance. Zero `setInterval` anywhere; timer accuracy and tab-throttle resilience guaranteed by monotonic clock.

**Confidence:** HIGH for Zustand API (official README verified), media-chrome hooks (official docs verified), timer pattern (PITFALLS.md + practitioner knowledge). MEDIUM for exact TagPanel UX layout (multiple valid approaches; planner should pick one).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Countdown timer (display + tick) | Browser / Client | — | `performance.now()` is browser-only API |
| Timer persistence (sessionStorage) | Browser / Client | — | Client-side Web Storage API |
| Timer start signal (`playing` event) | Browser / Client | — | Video DOM event; detected via ref |
| TagPanel rendering (L1/L2 multi-select) | Browser / Client | — | React controlled components; taxonomy imported at build |
| Tag cascade logic (L1 deselect drops L2) | Browser / Client | — | Pure reducer logic; no network |
| Verdict recording (Approve/Decline) | Browser / Client | — | In-memory state accumulation |
| Multi-video iteration (video index) | Browser / Client | — | Zustand store; track index |
| Answer accumulation (per-video) | Browser / Client | — | Zustand store; stored for Phase 4 |
| Auto-submit on timer expiry | Browser / Client | — | Timer slice calls answer commit action |

All capabilities are browser-tier only. No API calls, no CDN, no backend. Pure client-side state management + UI composition.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TIME-01 | 3:00 countdown timer visible above player | Sections 1, 9 |
| TIME-02 | Timer starts on `playing` event | Section 4 |
| TIME-03 | `performance.now()` deltas, not `setInterval` | Section 1 |
| TIME-04 | Timer persists to sessionStorage, survives refresh | Section 2 |
| TIME-05 | Color shifts at 60s (amber), 15s (red) | Section 3 |
| TIME-06 | Auto-submit at 0:00 | Section 3 |
| TIME-07 | Zustand slice with selector subscriptions | Sections 1, 8 |
| TIME-08 | Pausing video does NOT pause timer | Section 1 |
| TAG-01 | Multi-select L1 categories | Section 5 |
| TAG-02 | Selecting L1 reveals its L2 sub-categories | Section 5 |
| TAG-03 | L2 scoped to parent L1 | Section 5 |
| TAG-04 | Deselect any L1/L2 at any time before verdict | Section 5 |
| TAG-05 | Zero L1 + Approve = valid submission | Sections 5, 6 |
| TAG-06 | L1 selected + no L2 = valid, L2 rubric scores 0 | Section 5 |
| TAG-07 | Data-driven from taxonomy.json | Section 5 |
| TAG-08 | Keyboard accessible | Section 5 |
| VERDICT-01 | Clear Approve/Decline buttons | Section 6 |
| VERDICT-02 | Clicking records verdict + advances | Sections 6, 9 |
| VERDICT-03 | Verdict required to advance (or timer auto-submits) | Section 6 |
| VERDICT-04 | Cannot go back and edit previous answers | Sections 6, 7 |

---

## 1. Zustand Timer Implementation

### Package & Version

- **Package:** `zustand` @ `^5.0.14` [VERIFIED: npm registry] — `npm view zustand version` → `5.0.14` (published May 28, 2026)
- **Install:** `npm install zustand` (in STACK.md plan, not yet in package.json)
- **Bundle:** ~1.1 KB gzip, zero dependencies
- **API stability:** v5 is current major; `create()` API stable since v4

### Zustand v5 Core API

v5 API identical to v4 for patterns used here [CITED: github.com/pmndrs/zustand]:

```javascript
import { create } from 'zustand'

const useStore = create((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Selector pattern prevents re-renders
function Component() {
  const count = useStore((state) => state.count)       // only re-renders on count change
  const increment = useStore((state) => state.increment) // stable reference
}
```

Key v5 facts:
- `set()` merges state by default (shallow merge)
- `set(state, true)` replaces state entirely
- `get()` reads current state synchronously
- `useShallow` from `zustand/react/shallow` for multi-field selectors
- Store is a hook — no Provider needed (global singleton)
- Middleware: `persist`, `devtools`, `immer`, `subscribeWithSelector`

### Timer Architecture: RAF + performance.now()

**Do NOT use `setInterval`.** Per PITFALLS.md Pitfall 5: drifts, throttled in background tabs, inaccurate.

**Correct pattern — `requestAnimationFrame` loop with `performance.now()` anchor:**

```javascript
const useTimerStore = create((set, get) => ({
  remainingMs: 180000,
  startedAt: null,
  isRunning: false,
  isExpired: false,
  phase: 'green',
  rafId: null,

  start: () => {
    const startedAt = performance.now()
    set({ startedAt, isRunning: true, isExpired: false, phase: 'green' })
    const tick = () => {
      const elapsed = performance.now() - get().startedAt
      const remainingMs = Math.max(0, 180000 - Math.floor(elapsed))
      const phase = remainingMs <= 15000 ? 'red' : remainingMs <= 60000 ? 'amber' : 'green'
      const isExpired = remainingMs <= 0
      set({ remainingMs, phase, isExpired })
      if (!isExpired) {
        set({ rafId: requestAnimationFrame(tick) })
      } else {
        set({ isRunning: false })
        get().onExpire?.()
      }
    }
    set({ rafId: requestAnimationFrame(tick) })
  },

  stop: () => {
    const { rafId } = get()
    if (rafId) cancelAnimationFrame(rafId)
    set({ isRunning: false, rafId: null })
  },

  reset: () => {
    const { rafId } = get()
    if (rafId) cancelAnimationFrame(rafId)
    set({ remainingMs: 180000, startedAt: null, isRunning: false,
          isExpired: false, phase: 'green', rafId: null })
  },
}))
```

**Why RAF:** Fires before every paint (~60fps visible). When tab is backgrounded, RAF pauses but `performance.now()` continues. On tab return, next tick computes correct elapsed — no drift. `cancelAnimationFrame` on unmount prevents zombie callbacks.

**Why `performance.now()` over `Date.now()`:** Monotonic (never decreases), immune to system clock changes, sub-millisecond precision, accurate across tab backgrounding.

### Selector Pattern for Timer Display

CountdownDisplay subscribes ONLY to timer state. VideoPlayer and TagPanel do NOT subscribe to timer at all:

```javascript
// CountdownDisplay.jsx — subscribes to timer
function CountdownDisplay() {
  const remainingMs = useTimerStore((s) => s.remainingMs)
  const phase = useTimerStore((s) => s.phase)
  // render MM:SS with phase color
}
// VideoPlayerScreen.jsx — no timer subscription
// TagPanel.jsx — no timer subscription
```

Strict equality (`===`) is default in v5. `remainingMs` change triggers re-render; `phase` change does NOT re-render components selecting only `remainingMs`.

### Timer Not Paused by Video Pause (TIME-08)

Timer NOT coupled to video playback. Started on `playing` event, runs to zero regardless. `stop()` exists for programmatic use (between videos) but never called on video `pause` event.

---

## 2. Timer Persistence via sessionStorage

### What to Persist

| Field | Type | Purpose |
|-------|------|---------|
| `startedAtWallClock` | `number` (wall-clock `Date.now()` at start) | Compute remaining on reload |
| `videoIndex` | `number` | Which video is active (0..4) |
| `playbackPosition` | `number` | `video.currentTime` at persist (best-effort restore) |

**Why `startedAtWallClock` not just `remainingMs`:** Time between `beforeunload` and reload is unknown. Wall-clock anchor enables correct computation:

```javascript
const stored = JSON.parse(sessionStorage.getItem('cma_timer_v1'))
const elapsed = Date.now() - stored.startedAtWallClock
const remainingMs = Math.max(0, 180000 - elapsed)
if (remainingMs <= 0) {
  // Timer expired during reload — auto-submit
}
```

### Persistence Timing

- Write on `beforeunload` event (page close/refresh)
- Write on manual verdict submission (clear timer state)
- Write every ~5 seconds via debounced save in RAF loop (belt-and-suspenders)
- Read from sessionStorage on store initialization
- Clear on timer reset (next video) or assessment completion

### Serialization Key

`cma_timer_v1` — namespaced, versioned. Separate from `cma_identity_v1`.

### Edge Case: Timer Expired During Refresh

If `Date.now() - startedAtWallClock >= 180000` on reload: set `remainingMs = 0`, `isExpired = true`, trigger auto-submit of current video's answers using stored `videoIndex`.

---

## 3. Timer Thresholds & Auto-Submit

### Phase Colors

| Remaining | Phase | CSS Variable | Visual |
|-----------|-------|-------------|--------|
| > 60 s | green | `--cma-success` (#10B981) | Normal |
| 60 s → 15 s | amber | `--cma-warning` (#F59E0B) | Background pulse or color change |
| < 15 s | red | `--cma-destructive` (#EF4444) | Pulse + shake at 10s |

Computed in RAF tick:
```javascript
const phase = remainingMs <= 15000 ? 'red' : remainingMs <= 60000 ? 'amber' : 'green'
```

CSS:
```css
.cma-timer--amber { color: var(--cma-warning); }
.cma-timer--red { color: var(--cma-destructive); animation: cma-pulse 0.5s infinite; }
```

### Auto-Submit on Expiry (TIME-06)

When `remainingMs` reaches 0:
1. Set `isExpired = true`, `isRunning = false`
2. Cancel RAF loop
3. Read current tag selections + verdict from answers slice
4. Commit answer with `timedOut: true`
5. Advance `currentVideoIndex` (or transition to scoreboard if last video)
6. Reset timer for next video (or stop if last)

Auto-submit uses whatever tags/verdict candidate currently selected — even if nothing selected.

---

## 4. media-chrome Playing Event Integration

### Detection Strategy

Existing `VideoPlayerScreen.jsx` (Phase 2) has `videoRef`, `canplaythrough` listener, and `onReady` callback. Phase 3 adds `playing` event listener:

```javascript
// Add to existing useEffect in VideoPlayerScreen.jsx:
const handlePlaying = () => {
  onPlaying?.()  // Phase 3: timer.start()
}
videoEl.addEventListener('playing', handlePlaying)
// cleanup: videoEl.removeEventListener('playing', handlePlaying)
```

### Event Sequencing

Standard HTML5 video event order:
1. `loadstart` → `durationchange` → `loadedmetadata` → `loadeddata`
2. `canplay` → `canplaythrough` → **(user clicks play)**
3. `play` → `playing` ← **TIMER STARTS HERE**

`canplaythrough` fires when enough data buffered. `playing` fires when playback actually begins. Timer starts on `playing` per TIME-02.

### Why Not MediaStore

MediaStore exposes `mediaPaused` via `useMediaSelector`. Could watch it flip. But:
- Existing codebase uses native DOM ref pattern (Phase 2 decision)
- `onReady` already wired in App.jsx
- Adding `onPlaying` sibling callback simpler than introducing MediaStore hooks
- Direct DOM event more precise

**Decision:** Add `onPlaying` callback prop alongside existing `onReady`. App.jsx wires `onPlaying` → `timerStore.start()`.

### App.jsx Change

Current (line 35-38):
```jsx
onReady={() => {
  console.log('[cma] video ready (canplaythrough) — timer start target');
}}
```

Phase 3:
```jsx
onPlaying={() => useAssessmentStore.getState().startTimer()}
```

---

## 5. Multi-Select Tag Panel

### Data-Driven Design (TAG-07)

TagPanel entirely data-driven from `taxonomy.json`. No hardcoded category IDs/labels in JSX.

Source: `src/data/taxonomy.json` — 10 L1 categories (ids "1"–"10"), 63 L2 subcategories (6–7 per L1). Each L1 has `id`, `label`, `definition`, `subcategories[]`. Each L2 has `id`, `label`, `definition`, `example`.

### State Shape (per video)

```javascript
{
  videoId: 'v01',
  selectedL1: ['1', '3'],
  selectedL2: ['1.1', '3.2'],
  verdict: null,           // 'APPROVE' | 'DECLINE' | null
  timedOut: false,
  timeSpentMs: null,
}
```

### Reducer for L1/L2 Cascade Logic

Use `useReducer` inside TagPanel component — NOT in Zustand. Rationale: form-level state, mutated rapidly during interaction, does not need to survive screen transitions. Follows ARCHITECTURE.md Pattern 3.

```javascript
function tagReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_L1': {
      const l1Id = action.id
      const next = state.selectedL1.includes(l1Id)
        ? state.selectedL1.filter(id => id !== l1Id)
        : [...state.selectedL1, l1Id]
      // Drop L2s belonging to deselected L1
      const keptL2 = state.selectedL2.filter(l2Id => {
        const parentL1 = l2Id.split('.')[0]
        return next.includes(parentL1)
      })
      return { ...state, selectedL1: next, selectedL2: keptL2 }
    }
    case 'TOGGLE_L2': {
      const l2Id = action.id
      const next = state.selectedL2.includes(l2Id)
        ? state.selectedL2.filter(id => id !== l2Id)
        : [...state.selectedL2, l2Id]
      return { ...state, selectedL2: next }
    }
    case 'RESET':
      return { selectedL1: [], selectedL2: [] }
    default:
      return state
  }
}
```

### Component Structure

```
TagPanel.jsx                 ← container, useReducer
├── L1CategoryList.jsx       ← scrollable L1 chips
│   └── L1Chip.jsx           ← toggle chip (checkbox/button)
│       └── L2SubList.jsx    ← revealed on L1 selection
│           └── L2Chip.jsx   ← toggle chip
└── VerdictButtons.jsx       ← Approve / Decline
```

### Keyboard Accessibility (TAG-08)

- **Tab:** Focus moves between chips in DOM order
- **Space/Enter:** Toggle focused chip
- **role="checkbox" or aria-pressed:** On toggle chips
- **Focus ring:** Uses `--cma-focus-outline` (already defined)
- **Group labeling:** L1 groups wrapped in `<fieldset>` with `<legend>`

### TAG-05 & TAG-06 — Edge Cases

- **Zero L1 + Approve = valid:** No client-side validation. Sending `selectedL1: []` + `verdict: 'APPROVE'` is valid data point.
- **L1 selected + no L2 = valid:** Similarly no enforcement. L2 rubric scores 0 for that L1 in Phase 4.

---

## 6. Verdict Buttons & Flow

### Button Design

| Button | Label | Color | Action |
|--------|-------|-------|--------|
| Approve | "Approve" | `--cma-success` (#10B981) | Records APPROVE, advances |
| Decline | "Decline" | `--cma-destructive` (#EF4444) | Records DECLINE, advances |

Both disabled until timer started (`isRunning === true`). Prevents pre-clicking before playback.

### Verdict Actions

On button click or timer expiry:

1. Read current state from TagPanel reducer + timer store
2. Build answer object:
```javascript
{
  videoId: playlist.videos[currentVideoIndex].id,
  selectedL1: [...tagState.selectedL1],
  selectedL2: [...tagState.selectedL2],
  verdict: 'APPROVE' | 'DECLINE',
  timedOut: false | true,
  timeSpentMs: 180000 - store.remainingMs,
  submittedAt: new Date().toISOString(),
}
```
3. Commit to Zustand: `store.commitAnswer(answer)`
4. Advance `currentVideoIndex`
5. Reset timer + TagPanel for next video
6. If last video (index === 4), transition to SCOREBOARD (stub for Phase 4)

### No Going Back (VERDICT-04)

`currentVideoIndex` monotonically increasing. No "previous video" button. Answers cannot be edited after commit. Brief "Answer recorded" transition before next video loads.

---

## 7. Zustand Slice Architecture

### Store Shape

Single store with three logical slices:

```javascript
const useAssessmentStore = create((set, get) => ({
  // Timer Slice
  remainingMs: 180000,
  startedAt: null,
  isRunning: false,
  isExpired: false,
  phase: 'green',
  rafId: null,
  startTimer: () => { /* RAF loop */ },
  stopTimer: () => { /* cancel RAF */ },
  resetTimer: () => { /* cancel RAF + reset */ },
  persistTimer: () => { /* write sessionStorage */ },
  restoreTimer: () => { /* read sessionStorage */ },

  // Assessment Slice
  currentVideoIndex: 0,
  isComplete: false,
  nextVideo: () => set((s) => ({ currentVideoIndex: s.currentVideoIndex + 1 })),
  markComplete: () => set({ isComplete: true }),

  // Answers Slice
  answers: [],
  commitAnswer: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
}))
```

### Why Single Store

- Timer + answers interact: timer expiry calls `commitAnswer`
- Single `create()` call is idiomatic Zustand
- Selector isolation at component level, not store level
- Multiple stores require inter-store communication — complexity for no benefit
- Entire store surface <100 lines

### Devtools Middleware (Dev Only)

```javascript
import { devtools } from 'zustand/middleware'
const useAssessmentStore = create(devtools((set, get) => ({ ... }), { name: 'cma-assessment' }))
```

Invaluable during Phase 3 development for debugging timer ticks.

---

## 8. React Performance Strategy

### Problem: Timer Ticks at 60fps

RAF loop calls `set({ remainingMs, phase })` ~60 times/sec. Without selectors, every component using `useAssessmentStore()` re-renders 60/sec.

### Solution: Granular Selectors

**Rule: Every `useAssessmentStore()` call MUST include a selector.**

```javascript
// GOOD: only re-renders on remainingMs change (~60/sec, but only this component)
const remainingMs = useAssessmentStore((s) => s.remainingMs)

// GOOD: only re-renders when phase changes (3 times per video)
const phase = useAssessmentStore((s) => s.phase)

// BAD: re-renders on every state change (60/sec!)
const store = useAssessmentStore()

// Multi-field: useShallow prevents unnecessary re-renders
import { useShallow } from 'zustand/react/shallow'
const { remainingMs, phase } = useAssessmentStore(
  useShallow((s) => ({ remainingMs: s.remainingMs, phase: s.phase }))
)
```

### Component Subscription Map

| Component | Subscribes To | Re-render Frequency |
|-----------|--------------|---------------------|
| CountdownDisplay | `remainingMs`, `phase` | ~60/s (only component that does) |
| VideoPlayerScreen | **NOTHING from Zustand** | 0 timer-induced re-renders |
| TagPanel | **NOTHING from Zustand** (local `useReducer`) | 0 timer-induced re-renders |
| VerdictButtons | `isRunning` (for disabled state) | 2× per video (start + stop) |
| RunnerScreen | `currentVideoIndex`, `isComplete` | Once per video (5× total) |
| ProgressIndicator | `currentVideoIndex` | Once per video (5× total) |

**Net effect:** Only CountdownDisplay re-renders on timer ticks. VideoPlayer and TagPanel completely isolated from timer loop. Satisfies TIME-07 and performance target (player ≤ 5 renders per 3-min run from timer).

### Verification

React DevTools Profiler: start assessment, let run 3 min. VideoPlayerScreen render count should be 1 (initial mount) plus 5 (video changes) = 6 total. Not 180 (one per second of timer).

---

## 9. RunnerScreen Architecture

### Screen Composition

RunnerScreen is a new top-level screen that composes the assessment UI:

```
RunnerScreen.jsx              ← new component, replaces VideoPlayerScreen as ASSESSMENT screen
├── ProgressBar.jsx           ← "Video 2 of 5" indicator
├── CountdownDisplay.jsx      ← 3:00 timer (subscribes to Zustand timer slice)
├── VideoPlayerScreen.jsx     ← existing player (Phase 2, updated with onPlaying)
├── TagPanel.jsx              ← L1/L2 chips + verdict buttons
└── TransitionOverlay.jsx     ← brief "Answer recorded" between videos
```

### Screen State: SCREENS.RUNNER

Add to `src/state/screens.js`:
```javascript
export const SCREENS = Object.freeze({
  LANDING: 'LANDING',
  GUIDELINES: 'GUIDELINES',
  RUNNER: 'RUNNER',           // NEW — assessment flow
  ALREADY_COMPLETED: 'ALREADY_COMPLETED',
})
```

Update `useAssessmentState.enterAssessment()` to use `SCREENS.RUNNER`.

### Multi-Video Flow

```
RunnerScreen mounts
  → videoIndex = 0
  → load video from playlist.videos[0]
  → VideoPlayer mounts, starts buffering
  → canplaythrough fires → onReady()
  → user clicks play → playing fires → onPlaying() → timer.start()
  → user selects tags + clicks Approve/Decline (or timer expires)
  → commitAnswer() → videoIndex++
  → if videoIndex < 5: reset timer + TagPanel, load next video
  → if videoIndex === 5: markComplete() → screen transitions to SCOREBOARD (Phase 4 stub)
```

### VideoPlayerScreen Changes for Phase 3

1. Accept `videoSrc` prop (from playlist, indexed by `currentVideoIndex`) — remove hardcoded `playlist.videos[0]`
2. Accept `onPlaying` callback prop (timer start)
3. Accept `videoIndex` for "Video N of 5" display
4. Remove hardcoded "Video 1 of 5" — make dynamic

### Progress Indicator

"Video 2 of 5" displayed above player. Reads `currentVideoIndex` from Zustand (via selector). Updates only on video advance (5 transitions max).

---

## 10. Testing Strategy

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + @testing-library/react 16.3.2 |
| DOM env | happy-dom 20.10.6 |
| Mock pattern | `vi.mock()` for media-chrome (established in Phase 2) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | File |
|--------|----------|-----------|------|
| TIME-01 | Timer renders 3:00 countdown | unit | `tests/components/timer/CountdownDisplay.test.jsx` |
| TIME-02 | Timer starts on playing event | unit | `tests/components/player/VideoPlayerScreen.test.jsx` (update) |
| TIME-03 | Timer uses performance.now() deltas | unit | `tests/stores/timerStore.test.js` |
| TIME-04 | Timer persists to sessionStorage | unit | `tests/stores/timerStore.test.js` |
| TIME-05 | Color shifts at 60s and 15s | unit | `tests/stores/timerStore.test.js` |
| TIME-06 | Auto-submit at 0:00 | integration | `tests/stores/timerStore.test.js` |
| TIME-07 | Selector prevents cascading re-renders | unit | `tests/stores/assessmentStore.test.js` |
| TIME-08 | Video pause does NOT pause timer | integration | `tests/components/player/VideoPlayerScreen.test.jsx` |
| TAG-01 | Multi-select L1 checkboxes | unit | `tests/components/tagging/TagPanel.test.jsx` |
| TAG-02 | L1 selection reveals L2 | unit | `tests/components/tagging/TagPanel.test.jsx` |
| TAG-03 | L2 scoped to parent L1 | unit | `tests/components/tagging/tagReducer.test.js` |
| TAG-04 | Deselect L1 drops L2 | unit | `tests/components/tagging/tagReducer.test.js` |
| TAG-05 | Zero L1 + Approve is valid | unit | `tests/components/tagging/TagPanel.test.jsx` |
| TAG-06 | L1 selected + no L2 is valid | unit | `tests/components/tagging/TagPanel.test.jsx` |
| TAG-07 | Data-driven from taxonomy.json | unit | `tests/components/tagging/TagPanel.test.jsx` |
| TAG-08 | Keyboard accessible (Space toggles) | unit | `tests/components/tagging/TagPanel.test.jsx` |
| VERDICT-01 | Approve/Decline buttons visible | unit | `tests/components/tagging/VerdictButtons.test.jsx` |
| VERDICT-02 | Click records verdict + advances | integration | `tests/components/RunnerScreen.test.jsx` |
| VERDICT-03 | Verdict required to advance | unit | `tests/components/tagging/VerdictButtons.test.jsx` |
| VERDICT-04 | Cannot edit previous answers | unit | `tests/stores/assessmentStore.test.js` |

### Store Unit Tests (Pure Logic)

Zustand stores are plain JS — test without React:

```javascript
// tests/stores/timerStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('timerStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useTimerStore.setState({
      remainingMs: 180000, startedAt: null, isRunning: false,
      isExpired: false, phase: 'green', rafId: null,
    })
  })

  it('start() sets isRunning and records startedAt', () => {
    const { start } = useTimerStore.getState()
    start()
    const state = useTimerStore.getState()
    expect(state.isRunning).toBe(true)
    expect(state.startedAt).toBeGreaterThan(0)
  })

  it('phase transitions: green → amber at 60s, red at 15s', () => {
    // Mock performance.now to simulate elapsed time
    const now = vi.spyOn(performance, 'now')
    const startTime = 100000
    now.mockReturnValue(startTime)
    useTimerStore.getState().start()
    now.mockReturnValue(startTime + 120001) // 120s elapsed, 60s remaining
    // Next RAF tick computes phase
    // ... trigger tick, assert phase === 'amber'
  })

  it('reset() clears timer state', () => {
    useTimerStore.setState({ remainingMs: 50000, isRunning: true, phase: 'amber' })
    useTimerStore.getState().reset()
    const state = useTimerStore.getState()
    expect(state.remainingMs).toBe(180000)
    expect(state.isRunning).toBe(false)
    expect(state.phase).toBe('green')
  })
})
```

### Timer Tick Logic Tests (Time Mocking)

Mock `performance.now()` and `requestAnimationFrame`:

```javascript
// Setup
let rafCallbacks = []
vi.stubGlobal('requestAnimationFrame', (cb) => {
  rafCallbacks.push(cb)
  return rafCallbacks.length
})
vi.stubGlobal('cancelAnimationFrame', vi.fn())

// Trigger tick
function tickFrames(count) {
  for (let i = 0; i < count; i++) {
    rafCallbacks.forEach(cb => cb())
  }
}
```

### Tag Reducer Tests

Pure function, no React needed:

```javascript
// tests/components/tagging/tagReducer.test.js
it('TOGGLE_L1 deselection drops child L2s', () => {
  const state = { selectedL1: ['1', '3'], selectedL2: ['1.1', '1.2', '3.1'] }
  const next = tagReducer(state, { type: 'TOGGLE_L1', id: '1' })
  expect(next.selectedL1).toEqual(['3'])
  expect(next.selectedL2).toEqual(['3.1']) // '1.1' and '1.2' dropped
})
```

### Integration Test: RunnerScreen

```javascript
// tests/components/RunnerScreen.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import RunnerScreen from '../../../src/components/RunnerScreen.jsx'

it('advances to next video on verdict click', async () => {
  render(<RunnerScreen />)
  // Simulate video loaded + playing
  // Select some tags
  // Click Approve
  // Assert: currentVideoIndex incremented, new video title shown
})
```

### Wave 0 Gaps

- [ ] `tests/stores/timerStore.test.js` — new (covers TIME-03, TIME-04, TIME-05, TIME-06)
- [ ] `tests/stores/assessmentStore.test.js` — new (covers TIME-07, VERDICT-04)
- [ ] `tests/components/tagging/tagReducer.test.js` — new (covers TAG-03, TAG-04)
- [ ] `tests/components/tagging/TagPanel.test.jsx` — new (covers TAG-01..TAG-08)
- [ ] `tests/components/tagging/VerdictButtons.test.jsx` — new (covers VERDICT-01, VERDICT-03)
- [ ] `tests/components/timer/CountdownDisplay.test.jsx` — new (covers TIME-01, TIME-05)
- [ ] `tests/components/RunnerScreen.test.jsx` — new (covers VERDICT-02, multi-video flow)
- [ ] `tests/components/player/VideoPlayerScreen.test.jsx` — update (TIME-02, TIME-08 playing event)

---

## 11. Standard Stack

### New Dependencies

| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| `zustand` | `^5.0.14` | Global state (timer + assessment + answers) | `npm install zustand` |

**No other new dependencies.** TagPanel uses native React `useReducer`. Timer uses native `requestAnimationFrame` + `performance.now()`. sessionStorage is native. Verdict buttons are plain `<button>` elements.

### Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zustand | npm | ~6 yrs | ~12M/wk | github.com/pmndrs/zustand | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

---

## 12. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Global state management | Custom Context + useReducer | Zustand `create()` with selectors | Selector pattern proven to prevent timer-induced cascade re-renders; Context would re-render all consumers |
| Timer display updates | `setInterval(fn, 1000)` | `requestAnimationFrame` + `performance.now()` delta | RAF immune to tab throttling, monotonic clock prevents drift |
| L1/L2 cascade logic | `useState` with manual cleanup | `useReducer` with `TOGGLE_L1`/`TOGGLE_L2` actions | Reducer ensures atomic updates and invariant enforcement |
| sessionStorage serialization | Raw JSON.parse/stringify | `safeReadTimer()`/`safeWriteTimer()` helpers (try/catch wrapper) | sessionStorage can be disabled in corp browsers; graceful degradation |
| Timer persistence key | Hardcoded string | `cma_timer_v1` namespaced constant | Multiple stores share sessionStorage; avoid key collisions |

**Key insight:** Timer accuracy and tab-throttle resilience cannot be hand-rolled with `setInterval`. The `performance.now()` + RAF pattern is the only defense against PITFALLS.md Pitfall 5.

---

## 13. Common Pitfalls

### Pitfall 3a: RAF loop not cleaned up on unmount

**What goes wrong:** Component unmounts (screen change) but RAF callback still fires, calling `set()` on a store whose component is gone. Wastes CPU, potential state corruption.

**Prevention:** `useEffect` cleanup calls `cancelAnimationFrame`. Store's `reset()` also cancels RAF.

### Pitfall 3b: Timer display not human-readable

**What goes wrong:** Displaying `remainingMs / 1000` as raw seconds (e.g., "147.238" instead of "2:27").

**Prevention:** Format function:
```javascript
function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}
```

### Pitfall 3c: TagPanel re-renders on every timer tick

**What goes wrong:** TagPanel reads from Zustand without selector → re-renders 60×/sec → kills performance.

**Prevention:** TagPanel uses local `useReducer` ONLY. Never calls `useAssessmentStore()` directly. Only VerdictButtons read `isRunning` via selector.

### Pitfall 3d: sessionStorage quota exceeded

**What goes wrong:** Storing large objects (taxonomy data, video buffers) alongside timer state hits 5-10 MB browser limit.

**Prevention:** Timer persistence stores only `{ startedAtWallClock, videoIndex, playbackPosition }` (~100 bytes). Never store taxonomy or video data.

### Pitfall 3e: Timer starts before video metadata loads

**What goes wrong:** Timer starts on `canplaythrough` but video has no duration yet → `mediaDuration` is `NaN` → zero-duration seeks.

**Prevention:** Timer starts on `playing`, which fires after metadata is loaded and playback actually begins (see Section 4 event sequencing).

### Pitfall 3f: Verdict button double-click

**What goes wrong:** User double-clicks Approve → two answers committed, video index skips by 2.

**Prevention:** Disable both verdict buttons immediately on first click (local state). Guard `commitAnswer` with check for `submitting` flag. Transition overlay prevents further interaction.

### Pitfall 3g: playlist.json has only 1 video

**What goes wrong:** Phase 2 shipped `playlist.json` with only `v01`. Multi-video loop breaks after video 1.

**Prevention:** Phase 3 must add the remaining 4 videos to `playlist.json` (CONTENT-02). If videos aren't ready, stub them with placeholders (same test video at different URLs, or duration-only entries with a "No video" fallback).

---

## 14. Code Examples

### Complete Timer Store (Reference Implementation)

```javascript
// src/stores/useAssessmentStore.js
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const TIMER_KEY = 'cma_timer_v1'
const VIDEO_DURATION_MS = 180000

function safeReadTimer() {
  try {
    const raw = sessionStorage.getItem(TIMER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.startedAtWallClock !== 'number') return null
    return parsed
  } catch { return null }
}

function safeWriteTimer(data) {
  try { sessionStorage.setItem(TIMER_KEY, JSON.stringify(data)) } catch { /* quota exceeded, degrade */ }
}

function safeClearTimer() {
  try { sessionStorage.removeItem(TIMER_KEY) } catch { /* ignore */ }
}

export const useAssessmentStore = create(
  devtools(
    (set, get) => {
      const stored = safeReadTimer()
      return {
        // ─── Timer State ───
        remainingMs: stored
          ? Math.max(0, VIDEO_DURATION_MS - (Date.now() - stored.startedAtWallClock))
          : VIDEO_DURATION_MS,
        startedAt: stored ? stored.startedAtWallClock : null,
        isRunning: stored ? true : false,
        isExpired: stored
          ? (Date.now() - stored.startedAtWallClock) >= VIDEO_DURATION_MS
          : false,
        phase: 'green',
        rafId: null,

        startTimer: () => {
          const now = performance.now()
          const wallClock = Date.now()
          set({ startedAt: now, isRunning: true, isExpired: false, phase: 'green' })

          safeWriteTimer({ startedAtWallClock: wallClock, videoIndex: get().currentVideoIndex })

          const tick = () => {
            const { startedAt } = get()
            if (!startedAt) return
            const elapsed = performance.now() - startedAt
            const remainingMs = Math.max(0, VIDEO_DURATION_MS - elapsed)
            const phase = remainingMs <= 15000 ? 'red' : remainingMs <= 60000 ? 'amber' : 'green'
            const isExpired = remainingMs <= 0
            set({ remainingMs: Math.floor(remainingMs), phase, isExpired })

            if (isExpired) {
              set({ isRunning: false })
              safeClearTimer()
              // Auto-submit: read tag state and commit
              const answer = get().buildAnswerSnapshot({ timedOut: true })
              get().commitAnswer(answer)
              get().nextVideo()
            } else {
              const nextRafId = requestAnimationFrame(tick)
              set({ rafId: nextRafId })
            }
          }
          const rafId = requestAnimationFrame(tick)
          set({ rafId })
        },

        stopTimer: () => {
          const { rafId } = get()
          if (rafId) cancelAnimationFrame(rafId)
          set({ isRunning: false, rafId: null })
          safeClearTimer()
        },

        resetTimer: () => {
          const { rafId } = get()
          if (rafId) cancelAnimationFrame(rafId)
          set({
            remainingMs: VIDEO_DURATION_MS, startedAt: null, isRunning: false,
            isExpired: false, phase: 'green', rafId: null,
          })
          safeClearTimer()
        },

        // ─── Assessment State ───
        currentVideoIndex: stored ? stored.videoIndex : 0,
        isComplete: false,

        nextVideo: () => {
          const next = get().currentVideoIndex + 1
          if (next >= 5) {
            set({ isComplete: true })
            // Transition to SCOREBOARD (Phase 4)
          } else {
            set({ currentVideoIndex: next })
          }
        },

        // ─── Answers State ───
        answers: [],
        tagSnapshot: null,  // ref to current TagPanel state for timer auto-submit

        setTagSnapshot: (snapshot) => set({ tagSnapshot: snapshot }),

        buildAnswerSnapshot: ({ timedOut, verdict } = {}) => {
          const { tagSnapshot, currentVideoIndex } = get()
          return {
            videoId: `v${String(currentVideoIndex + 1).padStart(2, '0')}`,
            selectedL1: tagSnapshot?.selectedL1 ?? [],
            selectedL2: tagSnapshot?.selectedL2 ?? [],
            verdict: verdict ?? tagSnapshot?.verdict ?? null,
            timedOut: timedOut ?? false,
            timeSpentMs: VIDEO_DURATION_MS - get().remainingMs,
            submittedAt: new Date().toISOString(),
          }
        },

        commitAnswer: (answer) =>
          set((s) => ({ answers: [...s.answers, answer] })),
      }
    },
    { name: 'cma-assessment' },
  ),
)
```

### CountdownDisplay Component

```jsx
// src/components/timer/CountdownDisplay.jsx
import { useAssessmentStore } from '../../stores/useAssessmentStore.js'

function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

export default function CountdownDisplay() {
  const remainingMs = useAssessmentStore((s) => s.remainingMs)
  const phase = useAssessmentStore((s) => s.phase)
  const isRunning = useAssessmentStore((s) => s.isRunning)

  return (
    <div
      className={`cma-timer cma-timer--${phase}`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(remainingMs)}`}
    >
      <span className="cma-timer-value">{formatTime(remainingMs)}</span>
      {!isRunning && <span className="cma-timer-status">Ready</span>}
    </div>
  )
}
```

### TagPanel Key Pattern

```jsx
// src/components/tagging/TagPanel.jsx
import { useReducer, useCallback } from 'react'
import taxonomy from '../../data/taxonomy.json'
import { useAssessmentStore } from '../../stores/useAssessmentStore.js'

function tagReducer(state, action) { /* ... see Section 5 ... */ }

export default function TagPanel() {
  const [state, dispatch] = useReducer(tagReducer, { selectedL1: [], selectedL2: [] })
  const isRunning = useAssessmentStore((s) => s.isRunning)
  const store = useAssessmentStore

  const handleSubmit = useCallback((verdict) => {
    store.getState().setTagSnapshot({ ...state, verdict })
    const answer = store.getState().buildAnswerSnapshot({ verdict })
    store.getState().commitAnswer(answer)
    store.getState().resetTimer()
    store.getState().nextVideo()
    dispatch({ type: 'RESET' })
  }, [state])

  return (
    <section className="cma-tag-panel" aria-label="Content moderation tags">
      <div className="cma-tag-l1-list">
        {taxonomy.categories.map((cat) => (
          <L1Chip
            key={cat.id}
            category={cat}
            isSelected={state.selectedL1.includes(cat.id)}
            selectedL2={state.selectedL2}
            onToggleL1={(id) => dispatch({ type: 'TOGGLE_L1', id })}
            onToggleL2={(id) => dispatch({ type: 'TOGGLE_L2', id })}
          />
        ))}
      </div>
      <div className="cma-verdict-bar">
        <button
          className="cma-verdict-btn cma-verdict-btn--approve"
          onClick={() => handleSubmit('APPROVE')}
          disabled={!isRunning}
        >
          Approve
        </button>
        <button
          className="cma-verdict-btn cma-verdict-btn--decline"
          onClick={() => handleSubmit('DECLINE')}
          disabled={!isRunning}
        >
          Decline
        </button>
      </div>
    </section>
  )
}
```

---

## 15. State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` timer | `requestAnimationFrame` + `performance.now()` | Always | Immune to tab throttling, monotonic, no drift |
| React Context for state | Zustand `create()` with selectors | v5 (2024) | Selector isolation prevents timer-induced cascade re-renders |
| Redux Toolkit | Zustand (1 KB) | Project decision in STACK.md | 40× less boilerplate for this scope |
| `Date.now()` for timing | `performance.now()` | Always | Monotonic, immune to system clock changes |
| Multiple Zustand stores | Single store with slices | Pattern | Simpler inter-slice communication |

**Deprecated/outdated:**
- `setInterval` for countdown timers — replaced by RAF + performance.now() everywhere
- `react-router-dom` — package removed in react-router v8; screen enum pattern is correct for this scope

---

## 16. Key Decisions for the Planner

1. **Use `performance.now()` + `requestAnimationFrame`, not `setInterval`** — non-negotiable per PITFALLS.md Pitfall 5. Determines the entire timer architecture.

2. **Single Zustand store, three slices (timer + assessment + answers)** — not multiple stores. Timer auto-submit must call `commitAnswer`; single store enables direct cross-slice access.

3. **TagPanel uses local `useReducer`, NOT Zustand** — per-video form state resets on advance; doesn't need cross-cutting. Only the committed answer goes into Zustand.

4. **Timer starts on `playing` event, not `canplaythrough`** — TIME-02 is explicit. Add `onPlaying` callback to VideoPlayerScreen alongside existing `onReady`.

5. **sessionStorage persistence via `startedAtWallClock`**, not `remainingMs` — survives unknown time between `beforeunload` and page reload. Write on `beforeunload` + debounced every 5s.

6. **Add `SCREENS.RUNNER` to screens.js** — new RunnerScreen composes player + timer + tags + verdict. Repurpose ASSESSMENT screen role.

7. **Add remaining 4 videos to `playlist.json`** — Phase 2 shipped only v01. Phase 3 must add v02–v05 (real or placeholder). Blocked by CONTENT-02.

8. **Verdict buttons disabled until `isRunning`** — prevents pre-clicking before playback. Guard against double-click via local `submitting` state.

9. **`currentVideoIndex` monotonically increasing** — no "previous" button, no answer editing. Satisfies VERDICT-04.

10. **No new npm dependencies besides zustand** — timer, sessionStorage, tagging, verdict are all native browser + React APIs.

---

## 17. Open Questions (RESOLVED)

1. **Are videos v02–v05 ready?** RESOLVED — Placeholder strategy. Add placeholder entries to `playlist.json` reusing v01.mp4 with different IDs/titles. Mark as `"_status": "placeholder"`.

2. **RunnerScreen layout: side-by-side or stacked?** RESOLVED — Side-by-side (player left, tags right) for desktop. Stack vertically if viewport < 768px. TagPanel scrollable within its column.

3. **Transition to SCOREBOARD (Phase 4 stub)?** RESOLVED — Add minimal `SCREENS.SCOREBOARD` stub that displays "Assessment complete — results coming in Phase 4" and the accumulated `answers[]` for debugging.

4. **`onExpire` callback wiring between timer and answers?** RESOLVED — TagPanel pushes snapshot to store via `setTagSnapshot()` on every reducer change (debounced). Timer reads `tagSnapshot` on expiry.

5. **sessionStorage key for answer persistence?** RESOLVED — Do NOT persist answers (ARCHITECTURE.md Anti-Pattern 5). Answers live in-memory in Zustand. Only the timer state persists for refresh survival. A refresh mid-video preserves the timer but resets current tag selections — acceptable tradeoff.

---

## 18. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| RAF loop leaks on unmount | MEDIUM | `useEffect` cleanup calls `cancelAnimationFrame`; store's `resetTimer()` also cancels |
| Timer display jitter at 60fps updates | LOW | `Math.ceil(ms / 1000)` for stable 1-second resolution display; only `remainingMs` changes trigger re-render |
| sessionStorage disabled in corp browsers | LOW | Wrap all sessionStorage access in try/catch; timer works without persistence (just no refresh survival) |
| 10 L1 categories overflow TagPanel height | MEDIUM | Scrollable tag panel; accordion/collapse pattern for L2s; CSS `max-height` with `overflow-y: auto` |
| Verdict double-click submits twice | MEDIUM | Disable both buttons on first click; guard `commitAnswer` with `submitting` ref; transition overlay blocks interaction |
| playlist.json has only 1 video | HIGH | Phase 3 must add 4 more entries; if real videos unavailable, placeholder entries using v01.mp4 |
| React 19 StrictMode double-invocation of RAF start | LOW | Store's `startTimer()` guards against double-start: check `isRunning` before creating new RAF loop |
| Candidates changing OS clock to bypass timer | LOW | `performance.now()` is monotonic — immune to system clock changes. `Date.now()` used only for wall-clock persistence anchor; if candidate changes clock during refresh, `startedAtWallClock` could be faked forward, but this only gives them MORE time (remainingMs clamped at 0), never less. |

---

## 19. Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| npm | Package install | ✓ | (bundled with Node) | — |
| zustand | Global state management | ✓ (npm registry) | 5.0.14 | — |
| react | UI framework | ✓ (already in package.json) | 19.2.0 | — |
| media-chrome | Video player | ✓ (already in package.json) | 4.19.2 | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

All dependencies are npm packages already available or installable. No system-level tools (ffmpeg, etc.) needed for this phase. No external services.

---

## 20. Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No authentication in this phase |
| V3 Session Management | No | No server-side sessions |
| V4 Access Control | No | Client-only phase; access control is Phase 5 concern |
| V5 Input Validation | Yes | TagPanel selections validated against taxonomy.json IDs; timer values are computed, not user-input |
| V6 Cryptography | No | No cryptography in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Candidate modifies Zustand store via DevTools | Tampering | Accept for v1 (client-side state is always inspectable); server-side validation in Phase 5 (SUBMIT) |
| Candidate edits sessionStorage to extend timer | Tampering | `startedAtWallClock` on reload recomputes actual elapsed; faking a future wall-clock only shortens timer |
| XSS via taxonomy.json injection | Tampering | `taxonomy.json` is imported at build time, not user-editable; React's JSX auto-escapes |
| Rapid verdict button clicks (race condition) | Denial of Service | Disable buttons on first click; `submitting` guard in store |

---

## Sources

### Primary (HIGH confidence)
- [github.com/pmndrs/zustand] — v5.0.14 API: `create()`, selectors, `set()`, `get()`, `useShallow`, middleware, devtools
- [media-chrome.org/docs/en/react/hooks] — MediaStore hooks: `useMediaSelector`, `useMediaDispatch`, `useMediaRef`, `MediaActionTypes`, `MediaState` properties
- [npm registry] — `zustand@5.0.14` confirmed, `media-chrome@4.19.2` confirmed
- `.planning/REQUIREMENTS.md` — TIME-01..08, TAG-01..08, VERDICT-01..04 requirements
- `.planning/research/PITFALLS.md` — Pitfall 5 (timer inaccuracy, F5 recovery)
- `src/App.jsx` — existing screen routing, onReady wiring
- `src/components/player/VideoPlayerScreen.jsx` — existing player component

### Secondary (MEDIUM confidence)
- [archived web content / practitioner knowledge] — `requestAnimationFrame` tab-throttling behavior, `performance.now()` monotonicity
- `.planning/research/ARCHITECTURE.md` — screen state machine pattern, reducer pattern for per-video answers

### Tertiary (LOW confidence)
- None — all critical claims verified against primary sources

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Videos v02–v05 will be available or can be stubbed | 13 (Pitfall 3g), 17 (OQ1) | MEDIUM — multi-video flow untestable with only 1 video; blockers for integration tests |
| A2 | TagPanel side-by-side layout is acceptable UX | 17 (OQ2) | LOW — layout is CSS; any layout that shows player + tags simultaneously works |
| A3 | `useShallow` from `zustand/react/shallow` ships in v5.0.14 | 8 | LOW — confirmed in v5 README; if missing, manual shallow-equal fallback works |

---

## Metadata

**Confidence breakdown:**
- Zustand API: HIGH — official README verified via WebFetch
- Timer pattern: HIGH — referenced in PITFALLS.md + practitioner knowledge confirmed
- media-chrome hooks: HIGH — official docs verified via WebFetch
- TagPanel UX: MEDIUM — multiple valid approaches; planner should pick one
- sessionStorage persistence: HIGH — well-established Web API pattern
- Testing strategy: HIGH — matches existing Vitest + happy-dom patterns

**Research date:** 2026-07-08
**Valid until:** 2026-08-07 (30 days; stable APIs, no fast-moving dependencies)

---

*Research for Phase 3: Timer + L1/L2 Tagging + Verdict*
*Completed: 2026-07-08*
