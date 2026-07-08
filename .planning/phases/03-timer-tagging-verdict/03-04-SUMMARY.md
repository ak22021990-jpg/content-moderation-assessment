---
phase: 03-timer-tagging-verdict
plan: 04
subsystem: integration
tags: [runner-screen, app-wiring, timer, scoreboard, playlist, integration-tests, tdd]
requires: [03-01, 03-02, 03-03]
provides: [assessment-flow]
affects: [app-shell, screens-enum, video-player, runner-screen]
tech-stack:
  added: []
  patterns: [tdd, zustand-selector, mock-driven-testing]
key-files:
  created: []
  modified:
    - src/App.jsx
    - src/components/RunnerScreen.jsx
    - src/components/player/VideoPlayerScreen.jsx
    - src/hooks/useAssessmentState.js
    - src/state/screens.js
    - src/data/playlist.json
    - tests/App.integration.test.jsx
    - tests/data/playlist.test.js
    - tests/hooks/useAssessmentState.test.js
    - tests/state/screens.test.js
decisions:
  - "SCREENS.RUNNER added as primary assessment screen key (ASSESSMENT retained as fallback alias)"
  - "Timer starts on HTML5 playing event (not canplaythrough, not screen mount) via onPlaying callback"
  - "VideoPlayerScreen accepts optional videoIndex prop for dynamic multi-video title rendering"
  - "SCOREBOARD stub rendered as plain div with data-testid for Phase 4 wiring"
  - "Integration tests mock RunnerScreen instead of VideoPlayerScreen to isolate shell wiring"
metrics:
  duration_sec: 480
  completed_date: "2026-07-08"
status: complete
---

# Phase 03 Plan 04: Integration — App wiring, playlist expansion, onPlaying, end-to-end tests

Wired RunnerScreen, timer via onPlaying, scoreboard stub, and expanded playlist into the App shell. Followed TDD (RED → GREEN) with 2 task commits.

## One-Liner

App.jsx integration: RunnerScreen replaces direct VideoPlayerScreen, timer fires on HTML5 `playing` event, playlist expands to 5 videos, and assessment flow reaches SCOREBOARD stub.

## Task Summary

| Task | Type | Commit | Description |
|------|------|--------|-------------|
| 1 | test (RED) | `1c94ecf` | Expand playlist to 5 videos; replace VideoPlayerScreen mock with RunnerScreen mock in integration tests; add scoreboard transition test |
| 2 | feat (GREEN) | `d2245cc` | Add RUNNER to screens.js; add goToScreen + change enterAssessment to RUNNER; add onPlaying/videoIndex to VideoPlayerScreen; wire App.jsx with RunnerScreen, startTimer, SCOREBOARD stub |

## Verification Results

- **Tests:** 251/251 pass (22 test files, 0 failures)
- **Build:** `npm run build` succeeds (95 modules, 415 KB JS bundle)
- **Verification commands:** All 4 inline checks pass (APPJSX OK, PLAYER OK, HOOK OK, PLAYLIST OK)

## Deviations from Plan

None — plan executed exactly as written. TDD RED phase confirmed 2 integration test failures before GREEN implementation resolved them.

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| `src/App.jsx` | 44-49 | SCOREBOARD case renders plain placeholder div with `data-testid="scoreboard-stub"` — Phase 4 wires real ScoreboardScreen |

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

- [x] All 10 modified files exist on disk
- [x] Commit `1c94ecf` (RED) exists in git log
- [x] Commit `d2245cc` (GREEN) exists in git log
- [x] `npm test -- --run` passes 251/251
- [x] `npm run build` succeeds
