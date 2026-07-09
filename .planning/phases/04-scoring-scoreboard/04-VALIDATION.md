---
phase: 04-scoring-scoreboard
artifact: VALIDATION.md
status: verified
verified: 2026-07-08
plans: 5 (04-01 through 04-05)
---

# VALIDATION — Phase 4: Scoring + Scoreboard (flagmail1 parity)

## Requirement Coverage

| REQ | 04-01 | 04-02 | 04-03 | 04-04 | 04-05 | Status |
|-----|:-----:|:-----:|:-----:|:-----:|:-----:|--------|
| SCORE-01 | — | YES | — | — | — | COVERED |
| SCORE-02 | — | YES | — | — | — | COVERED |
| SCORE-03 | — | YES | — | — | — | COVERED |
| SCORE-04 | — | YES | — | — | — | COVERED |
| SCORE-05 | — | YES | — | — | — | COVERED |
| SCORE-06 | — | — | YES | — | — | COVERED |
| SCORE-07 | — | YES | — | — | — | COVERED |
| SCORE-08 | — | — | YES | — | — | COVERED |
| SCORE-09 | — | YES | — | — | — | COVERED |
| BOARD-01 | — | — | — | YES | — | COVERED |
| BOARD-02 | — | — | — | YES | — | COVERED |
| BOARD-03 | — | — | — | YES | — | COVERED |
| BOARD-04 | — | — | — | YES | — | COVERED |
| BOARD-05 | — | — | — | YES | — | COVERED |
| BOARD-06 | — | — | — | YES | — | COVERED |
| BOARD-07 | — | — | — | YES | — | COVERED |
| QUALITY-01 | — | — | — | — | YES | COVERED |
| QUALITY-02 | — | — | — | — | YES | COVERED |
| QUALITY-04 | — | — | YES | — | — | COVERED |

**Coverage:** 19/19 = 100%

## Wave Dependency Graph

```
Wave 0:  04-01 (timing backfill — no deps)
            │
     ┌──────┴──────┐
     ▼              ▼
Wave 1: 04-02 (scoring) → 04-03 (competency/keys/rubric)  [serial: 04-03 depends on 04-02]
            │              │
     └──────┴──────┘
            ▼
Wave 2:  04-04 (scoreboard UI + GSAP + Lottie)
            │
            ▼
Wave 3:  04-05 (App integration + kappa + manifest)
```

## Aborted Plans

None.

## Success Criteria → Task Mapping

| ROADMAP SC | Description | Primary Task |
|------------|-------------|-------------|
| SC1 | scoring.js pure module, 100-pt rubric, Vitest edge cases | 04-02-01, 04-02-02 |
| SC2 | ScoreboardScreen: overall%, per-L1 accuracy, competency paragraph, per-video summary (no keys) | 04-04-02 |
| SC3 | answerKeys.json bundled (not public/), answerKeyVersion, tie-breaker in scoring-rubric.md | 04-03-02 |
| SC4 | Lottie milestones lazy-loaded on qualifying scores | 04-04-02 |
| SC5 | 3 raters tag blindly; Cohen/Fleiss kappa per L1; kappa >= 0.6 gate | 04-05-02 |

## Aggregated Nyquist Signals (30 total)

### Wave 0 (04-01) — 6 signals
1. Timing fields populated in answer: videoId, timedOut, submittedAt with ISO timestamp
2. npm test -- tests/stores/assessmentStore.test.js --run — all green including 6 new timing tests
3. npm test -- --run — full suite green, no regressions
4. Store source has videoId, timeSpentMs, submittedAt fields and playlist import
5. buildAnswerSnapshot({ timedOut: true }) wired for timer expiry auto-submit
6. 2 atomic commits

### Wave 1 (04-02) — 6 signals
1. scoring.test.js — all rubric math tests green
2. scoreVideo, scoreAssessment, computePerL1Accuracy — all 3 exports exist
3. Zero React imports in scoring.js — SCORE-07 compliant
4. answerKeyVersion propagated in scoreAssessment output
5. Perfect match → total = 100 pts
6. 2 atomic commits (RED + GREEN)

### Wave 1 (04-03) — 5 signals
1. competency.test.js — all 8 tests green
2. answerKeys.json has 5 videos, version "1.0.0-draft"
3. answerKeys.json in src/data/ not public/ — SCORE-08 compliant
4. docs/scoring-rubric.md exists
5. 2 atomic commits

### Wave 2 (04-04) — 7 signals
1. ScoreboardScreen.test.jsx — all 8 tests green
2. PerVideoBreakdown imports cleanly
3. Zero answerKeys imports in scoreboard components — BOARD-07 compliant
4. Dynamic Lottie import only in MilestoneLottie.jsx — BOARD-06 compliant
5. npm test -- --run — full suite green
6. gsap, @gsap/react, lottie-react all in package.json dependencies
7. 2 atomic commits

### Wave 3 (04-05) — 6 signals
1. App.jsx wired to ScoreboardScreen (not scoreboard-stub)
2. kappa.test.js — all 12 tests green
3. docs/video-manifest.md exists — QUALITY-01
4. docs/kappa-calibration.md exists — QUALITY-02
5. npm test -- --run — full suite green
6. cohensKappa, fleissKappa, interpretKappa — all 3 exports exist

## Key Decisions (from RESEARCH.md)

| ID | Decision | Rationale |
|----|----------|-----------|
| D-01 | lottie-react@2.4.1 (not @lottiefiles/dotlottie-react) | flagmail1 vets lottie-react; dotlottie-react flagged SUS (published 5 days ago) |
| D-02 | Wave 0 backfills timing fields into Phase 3 store | commitAnswer() lacks timeSpentMs/timedOut/submittedAt; BOARD-04 blocked without |
| D-03 | Scoring in pure functions (utils/scoring.js) | No React deps; unit-testable; flagmail1 pattern |
| D-04 | answerKeys.json imported at build time (not public/) | Bundled into JS; SCORE-08 accepts obscurity-not-security tradeoff |
| D-05 | Lottie dynamic import per BOARD-06 | Lazy-loaded on demand; not eager-bundled |
| D-06 | GSAP useGSAP hook (@gsap/react) | React 19 StrictMode-safe scoping; flagmail1 pattern |

## Known Warnings (non-blocking)

| Warning | Plan | Description |
|---------|------|-------------|
| Wave labeling | 04-03 | Declares wave:1 but depends on 04-02 (also wave:1). Executor serializes via depends_on. |
| Scope high | 04-04 | Task 04-04-02 modifies 8 files + CSS. Components are tightly related; cognitive coherence preserved. |

## Verification Decision

**PASS** — 19/19 REQ-IDs covered, 30 observable nyquist signals across 5 plans. Correct wave dependency chain. Research resolved. Plans implement all research directives.

---

*Last updated: 2026-07-08*
