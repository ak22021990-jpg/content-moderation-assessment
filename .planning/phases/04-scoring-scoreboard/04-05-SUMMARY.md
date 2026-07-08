---
phase: 04-scoring-scoreboard
plan: 05
subsystem: scoring
tags: [kappa, scoreboard, answer-keys, inter-rater-reliability, cohens-kappa, fleiss-kappa, gsap, lottie]

# Dependency graph
requires:
  - phase: 04-04
    provides: ScoreboardScreen component, useScoreboard hook, GSAP animations, Lottie milestones
  - phase: 04-03
    provides: answerKeys.json, taxonomy.json, scoring.js, competency.js
  - phase: 03-04
    provides: App.jsx SCOREBOARD stub, RunnerScreen onComplete flow
provides:
  - ScoreboardScreen wired into App.jsx SCOREBOARD case (replaces Phase 3 stub)
  - docs/video-manifest.md updated with per-video answer key rationale (QUALITY-01)
  - src/utils/kappa.js: cohensKappa, fleissKappa, interpretKappa pure functions
  - tests/utils/kappa.test.js: 18 tests covering perfect agreement, chance, systematic disagreement, edge cases
  - docs/kappa-calibration.md: methodology, data collection plan, target thresholds (QUALITY-02)
affects:
  - Phase 5 (submission) — scoreboard reachable after assessment completion
  - Phase 6 (polish/launch) — kappa calibration results feed into content freeze

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function kappa module: no React deps, trivially unit-testable"
    - "App shell mocking: ScoreboardScreen mocked in integration tests like RunnerScreen"
    - "Docs-code sync: video-manifest.md rationale mirrors answerKeys.json rationale field"

key-files:
  created:
    - src/utils/kappa.js
    - tests/utils/kappa.test.js
    - docs/kappa-calibration.md
  modified:
    - src/App.jsx
    - tests/App.integration.test.jsx
    - docs/video-manifest.md

key-decisions:
  - "ScoreboardScreen mocked in App.integration.test.jsx (like RunnerScreen) — keeps shell routing test decoupled from store state"
  - "Cohen's kappa implemented as binary per-(video,category) agreement — handles multi-tag raters correctly"
  - "Fleiss' kappa takes raterMatrix[i][j] = count of raters assigning category j to video i"

patterns-established:
  - "Kappa: 3 pure functions, no framework deps, 18 tests — pattern for future stats modules"
  - "Video manifest: per-video rationale with confidence level, encoding specs, version tracking"

requirements-completed:
  - QUALITY-01
  - QUALITY-02

# Metrics
duration: 8min
completed: 2026-07-08
status: complete
---

# Phase 4 Plan 5: App Integration + Answer Key Authoring + Kappa Summary

**ScoreboardScreen wired into App.jsx, per-video answer key rationale documented, Cohen's/Fleiss' kappa pure functions with 18 tests, kappa calibration methodology documented.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-08T19:55:00Z
- **Completed:** 2026-07-08T20:03:00Z
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- App.jsx SCOREBOARD case now renders `<ScoreboardScreen />` — the full flagmail1-style scoreboard replaces the Phase 3 placeholder stub
- docs/video-manifest.md updated with per-video rationale for all 5 videos (v01–v05), each with confidence level, target L1/L2, verdict, and encoding specs — QUALITY-01 satisfied
- src/utils/kappa.js: 3 pure functions — `cohensKappa()` (pairwise), `fleissKappa()` (3+ raters), `interpretKappa()` (Landis & Koch thresholds) — QUALITY-02 computation utilities
- tests/utils/kappa.test.js: 18 tests including perfect agreement (κ=1), worse-than-chance (κ=−1.0), empty input, null safety, partial overlap, Fleiss' multi-rater, and all 11 interpretKappa boundary values
- docs/kappa-calibration.md: methodology (3 blind raters, Google Sheet), computation plan (Cohen pairwise + Fleiss' overall), target κ ≥ 0.6 per L1, results tracking table — QUALITY-02 calibration plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire ScoreboardScreen into App.jsx** — `649c59a` (feat)
2. **Task 2: Video manifest rationale + kappa.js + tests + kappa-calibration.md** — `15b6b03` (feat)

## Files Created/Modified

- `src/utils/kappa.js` — (NEW) cohensKappa, fleissKappa, interpretKappa pure functions
- `tests/utils/kappa.test.js` — (NEW) 18 unit tests for kappa computation + interpretation
- `docs/kappa-calibration.md` — (NEW) inter-rater reliability methodology, data collection plan, target thresholds
- `src/App.jsx` — (MODIFIED) Added ScoreboardScreen import, replaced SCOREBOARD case stub with `<ScoreboardScreen />`
- `tests/App.integration.test.jsx` — (MODIFIED) Mocked ScoreboardScreen, updated test assertion from `scoreboard-stub` to `scoreboard`
- `docs/video-manifest.md` — (MODIFIED) Added per-video answer key rationale for v01–v05 with confidence levels, encoding specs, answer key version tracking

## Decisions Made

- ScoreboardScreen mocked in App.integration.test.jsx (like RunnerScreen pattern) — keeps shell routing test decoupled from store state
- Cohen's kappa treats each (video, category) as a binary judgment — handles multi-tag raters correctly (not single-label assignment)
- Fleiss' kappa uses raterMatrix[i][j] = count of raters assigning category j to video i
- Test expectation for "systematic disagreement" was wrong — 3-category non-overlap gives κ = 0.333 (positive). Fixed to use 2-category cross-rater scenario yielding κ = −1.0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect test expectation for negative kappa**
- **Found during:** Task 2 (kappa test execution)
- **Issue:** Test "returns negative for systematic disagreement" expected 3-category non-overlap to produce negative kappa. Actual κ = 0.333 — positive. Math is correct; test expectation was based on a simpler single-label kappa model rather than the binary per-(video,category) implementation.
- **Fix:** Replaced test with proper 2-category cross-rater scenario (r1 picks cat 1 for video 0 & cat 2 for video 1; r2 picks opposite). po = 0, pe = 0.5 → κ = −1.0.
- **Files modified:** tests/utils/kappa.test.js
- **Verification:** 18/18 tests pass after fix. Math verified: κ = (0 − 0.5) / (1 − 0.5) = −1.0.
- **Committed in:** `15b6b03` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test expectation bug)
**Impact on plan:** Test fix aligns expectation with correct multi-tag kappa math. Core kappa implementation was correct on first write.

## Issues Encountered

None — plan executed with one test-expectation fix (documented above). No architectural changes needed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ScoreboardScreen now reachable after assessment completion — App.jsx routing complete
- Kappa utilities ready for offline calibration (Phase 4 quality gate)
- Video manifest rationale documented — ready for rater calibration and client review
- Ready for Phase 5 (Submission — backend webhook, Google Sheets integration)

---

*Phase: 04-scoring-scoreboard*
*Completed: 2026-07-08*
