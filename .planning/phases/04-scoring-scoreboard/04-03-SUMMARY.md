---
phase: 04-scoring-scoreboard
plan: 03
subsystem: scoring
tags: [competency, answer-keys, rubric, vitest, taxonomy]

# Dependency graph
requires:
  - phase: 04-01
    provides: timing fields in assessment store
  - phase: 04-02
    provides: scoring.js pure functions (scoreVideo, scoreAssessment, computePerL1Accuracy)
provides:
  - competency.js: getProgressTitle tier function + generateCompetency strengths/weaknesses paragraph
  - answerKeys.json: 5-video ground-truth answer keys (versioned, bundled in src/data/)
  - scoring-rubric.md: 6-section rubric doc with tie-breaker rules
affects: [04-04-scoreboard-ui, 05-submission, kappa-calibration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure functions for scoring domain (no React deps, import taxonomy.json for label resolution)
    - TDD: RED (test-only commit) → GREEN (implementation commit)
    - Oxford-comma list formatting for competency text
    - Bundled answer keys in src/data/ (not public/) — Vite tree-shakes into hashed chunk

key-files:
  created:
    - src/utils/competency.js
    - tests/utils/competency.test.js
    - src/data/answerKeys.json
    - docs/scoring-rubric.md
  modified: []

key-decisions:
  - "Competency.js uses taxonomy.json for label resolution (not hardcoded strings)"
  - "allStrong/allWeak shortcuts guarded with categories.length > 1 — single-category falls through to mixed path so labels appear in output"
  - "answerKeys.json versioned 1.0.0-draft — all keys flagged for refinement after kappa calibration and client sign-off"
  - "V05 verdict marked DECLINE pending O-01 client decision; rationale documents ambiguity"

patterns-established:
  - "Pattern 2 (competency): getProgressTitle thresholds at 50/80; generateCompetency filters total>0, buckets strong≥70%/weak<50%, Oxford-comma list format"
  - "Pattern 5 (answerKeys): id matches playlist.json, l2Tags use X.Y format matching taxonomy, version field for cohort separation"

requirements-completed: [SCORE-06, SCORE-08, QUALITY-04]

# Metrics
duration: 3min
completed: 2026-07-08
status: complete
---

# Phase 4 Plan 3: Competency Module + answerKeys + Rubric Doc Summary

**Competency.js with taxonomy-label resolution, 5-video ground-truth answer keys (bundled not public), and QUALITY-04 scoring rubric locked before any candidate data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-08T14:09:51Z
- **Completed:** 2026-07-08T14:13:31Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- `getProgressTitle(score)`: ≥80 → Advanced, ≥50 → Proficient, <50 → Foundation — boundary-tested at 0/49/50/79/80/100
- `generateCompetency(categoryCorrect)`: resolves taxonomy labels from taxonomy.json, filters zero-total categories, buckets strong (≥70%) / weak (<50%), produces 3 output paths (all-strong, all-weak, mixed with Oxford-comma lists)
- 5-video answerKeys.json with id/verdict/l1Tags/l2Tags/rationale per video, versioned 1.0.0-draft, stored in src/data/ (SCORE-08 — not fetchable)
- docs/scoring-rubric.md: 6 sections covering 100-pt breakdown, UNION L1 partial-credit rule, any-one-match L2 rule, zero-L1 policy, versioning policy, kappa calibration

## Task Commits

Each task was committed atomically:

1. **Task 04-03-01: Create competency.js + tests (TDD)** — `1b9e71d` (RED: test), `f3bd396` (GREEN: feat)
2. **Task 04-03-02: Create answerKeys.json + docs/scoring-rubric.md** — `103b139` (feat)

**Plan metadata:** Pending final commit for SUMMARY + STATE + ROADMAP.

## Files Created
- `src/utils/competency.js` — getProgressTitle + generateCompetency with taxonomy label resolution
- `tests/utils/competency.test.js` — 11 tests: 3 tier boundary + 8 competency paragraph scenarios
- `src/data/answerKeys.json` — 5 video answer keys (v01-v05) with version 1.0.0-draft
- `docs/scoring-rubric.md` — 6-section rubric doc with tie-breaker rules (QUALITY-04 gate)

## Decisions Made
- Competency.js imports taxonomy.json to resolve category labels at runtime — NOT hardcoded strings. Ensures label changes in taxonomy propagate automatically.
- allStrong/allWeak shortcuts guarded with `categories.length > 1` so single-category results include the category label in output text. Without guard, single strong category would produce generic "Exceptional performance across ALL categories" — misleading for single-category assessment.
- answerKeys.json version is 1.0.0-draft — explicitly signals pre-calibration status. V05 verdict is DECLINE pending O-01 client decision; rationale documents ambiguity.
- Rubric doc committed NOW (before any Phase 5 candidate data) — QUALITY-04 gate satisfied. Rule changes after data collection require explicit cohort separation per rubric §5.
- Oxford-comma list format: "A" / "A and B" / "A, B, and C" — follows flagmail1 pattern exactly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan code/test mismatch — allStrong/allWeak shortcuts suppressed category labels for single-category input**
- **Found during:** Task 04-03-01 (competency.js GREEN phase)
- **Issue:** Plan's implementation code used `allStrong = strong.length === categories.length` and `allWeak = weak.length === categories.length` without a `> 1` guard. With a single category at 100%, this triggered the allStrong shortcut ("Exceptional performance across all content categories...") instead of the mixed path that includes the category label. Three tests failed: "filters out categories with total = 0", "returns single-category strong message", and "uses taxonomy labels, not raw IDs".
- **Fix:** Added `categories.length > 1` guard to both `allStrong` and `allWeak` conditions. Single-category cases now fall through to the mixed path which includes category labels via `formatList()`. This matches the test expectations in the plan (which expected labels in output for single-category cases).
- **Files modified:** src/utils/competency.js
- **Verification:** All 11 tests green. Single-category strong → "You have a strong foundation in Copyright & IP. Keep sharpening...". Single-category weak → "Focus on building your skills in Copyright & IP."
- **Committed in:** f3bd396 (GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug was in the plan's own implementation code — code and tests in the plan contradicted each other. Fix is minimal (1 guard condition) and makes both label visibility and all-strong shortcut work correctly. No scope creep.

## Issues Encountered
None — plan executed smoothly beyond the single auto-fixed code/test mismatch.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Competency module ready for ScoreboardScreen (plan 04-04) — `getProgressTitle` and `generateCompetency` are pure functions, importable directly
- answerKeys.json ready for scoring engine integration — `scoreAssessment()` already imports from `../data/answerKeys.json`
- Rubric doc committed — QUALITY-04 gate satisfied. Ready for kappa calibration (QUALITY-02) and Phase 6 client sign-off
- Plan 04-04 (ScoreboardScreen + Lottie) can wire competency output into UI immediately

---
## Self-Check: PASSED

- [x] src/utils/competency.js exists
- [x] tests/utils/competency.test.js exists
- [x] src/data/answerKeys.json exists
- [x] docs/scoring-rubric.md exists
- [x] Commit 1b9e71d (RED) confirmed in git log
- [x] Commit f3bd396 (GREEN) confirmed in git log
- [x] Commit 103b139 (answerKeys + rubric) confirmed in git log

---
*Phase: 04-scoring-scoreboard*
*Completed: 2026-07-08*
