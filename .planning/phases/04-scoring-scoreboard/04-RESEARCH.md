# Phase 4: Scoring + Scoreboard (flagmail1 parity) — Research

**Researched:** 2026-07-08
**Domain:** Scoring rubric computation, competency assessment, scoreboard UI, Lottie milestone animations, inter-rater reliability statistics
**Confidence:** HIGH

## Summary

Phase 4 implements the assessment's scoring engine and results display, modeled on flagmail1's pattern. Scoring is a set of pure functions operating on the `answers[]` array from the Phase 3 Zustand store against bundled answer keys. The scoreboard renders overall percentage, per-L1 accuracy bars, competency title with strengths/weaknesses paragraph, per-video timing breakdown, and lazy-loaded Lottie milestone animations. Kappa calibration begins: 3 blind raters tag 5 videos, Cohen/Fleiss kappa computed per L1, rubric committed to `docs/scoring-rubric.md` before candidate data.

**Critical gap: Phase 3 answers[] lacks timing metadata (`timedOut`, `timeSpentMs`, `submittedAt`).** These fields exist in the ARCHITECTURE.md state shape but were not implemented in the store. Phase 4 must either backfill them or accept limited BOARD-04 capability. Recommend backfilling as a Wave 0 task before scoring logic runs.

**Primary recommendation:** Implement `utils/scoring.js` as pure functions first (highest testability), wire into the store's `onComplete` flow, build `utils/competency.js` following flagmail1's `generateCompetency` pattern exactly, and only then build ScoreboardScreen UI with GSAP entrance animations. Lottie milestones load lazily per BOARD-06. Install `gsap`, `@gsap/react`, and `lottie-react` — all verified OK on npm registry.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCORE-01 | 100-point rubric per video: verdict 50 + L1 25 set-based partial credit + L2 25 any-one-match | `scoreVideo()` pure function design in §Scoring Module; edge-case table in §Common Pitfalls |
| SCORE-02 | L1 scoring = `|user ∩ answer| / |answer|` × 25 | Set intersection with partial credit; union tie-breaker per QUALITY-04 |
| SCORE-03 | L2 scoring = any-one-match per L1 counts as full L2 credit | Per-L1 match check; zero-L1-selected means zero L2 attempt → 0 L2 score |
| SCORE-04 | Overall score = mean of 5 video scores, percentage | `scoreAssessment()` aggregates per-video, divides by count |
| SCORE-05 | Per-L1 accuracy across all 5 videos | Denominator = number of videos where L1 appears in answer key |
| SCORE-06 | Competency: ≥80% Advanced, ≥50% Proficient, <50% Foundation | flagmail1's `getProgressTitle()` pattern; `generateCompetency()` for strengths/weaknesses paragraph |
| SCORE-07 | Pure functions in utils/scoring.js (no React deps) | All scoring functions take plain objects, return plain objects. Vitest unit-testable with import |
| SCORE-08 | answerKeys bundled in JS build (not public/) | `import answerKeys from '../data/answerKeys.json'` — Vite tree-shakes into hashed chunk |
| SCORE-09 | answerKeyVersion in every submission | `answerKeys.version` string field; included in score payload per ARCHITECTURE.md state shape |
| BOARD-01 | Overall score % prominently displayed | flagmail1 ResultsScreen pattern: large numeric display + competency badge pill |
| BOARD-02 | Per-L1 accuracy bar chart/row | flagmail1 CompetencySummary pattern: horizontal bars with % per category, sorted desc |
| BOARD-03 | Competency title + strengths/weaknesses paragraph | flagmail1 `generateCompetency()` pattern — strong categories listed first, weak second |
| BOARD-04 | Time-to-complete + per-video timing summary | **Blocked on Phase 3 gap**: answers[] lacks `timeSpentMs`. Must backfill or accept limited data |
| BOARD-05 | Lottie milestone animation on qualifying scores | Map score thresholds → animation IDs (PERFECT_EYE: 100%, SNIPER: ≥90%, ON_FIRE: ≥80%, ZONE_CLEAR: ≥70%) |
| BOARD-06 | Lottie assets lazy-loaded (dynamic import) | `const animData = await import('../assets/animation/SNIPER.json')` — not eager import |
| BOARD-07 | Per-video summary without full answer keys | Table: verdict correct?, L1 matched? (count, not list), L2 matched? (count). No answer key revealed |
| QUALITY-01 | Answer key rationale in docs/video-manifest.md | Rationale per-video: why this verdict, why these L1s, why these L2s |
| QUALITY-02 | 3 independent raters tag blindly; Cohen/Fleiss kappa per L1 | Cohen for 2-raters pairwise, Fleiss for 3-raters. Formula: κ = (Po − Pe) / (1 − Pe). Target ≥ 0.6 |
| QUALITY-04 | Tie-breaker rule committed to docs/scoring-rubric.md BEFORE candidate data | Union L1 / any-one-match L2 rule documented and locked |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Score computation (rubric math) | Browser (pure JS module) | — | Pure functions, no network, no DOM. `utils/scoring.js` runs entirely in-memory on answers[] |
| Competency title + paragraph | Browser (pure JS module) | — | `utils/competency.js` — string generation from accuracy object, no React deps |
| answerKeys storage & retrieval | Browser (bundled JS) | — | `src/data/answerKeys.json` imported at build time, tree-shaken into hashed chunk, not fetchable |
| Scoreboard UI rendering | Browser (React component) | — | ScoreboardScreen renders computed scoring state. GSAP entrance animations via useGSAP |
| Lottie milestone animations | Browser (lazy-loaded assets) | CDN/Static (asset files) | Dynamic `import()` pulls Lottie JSON on demand. flagmail1 pattern: 10 animation files each 50–200 KB |
| Kappa calibration (QUALITY-02) | Offline (docs + manual) | — | Raters tag via spreadsheet or tooling outside app. Kappa computed offline, results stored in docs/ |
| Timing data capture | Browser (Zustand store) | — | **Gap**: Phase 3 store lacks `timeSpentMs`/`timedOut` in answers[]. Must backfill in Phase 4 Wave 0 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` + `react-dom` | ^19.2.0 | UI framework for ScoreboardScreen | Already installed (Phase 0). React 19 StrictMode-safe with GSAP useGSAP hook |
| `zustand` | ^5.0.14 | Global store — answers[], scoring results | Already installed. Selector subscriptions prevent re-render cascades on scoreboard |
| `gsap` | ^3.15.0 | Entrance animations on scoreboard sections | flagmail1 pattern. MIT-licensed. Industry standard for web animation |
| `@gsap/react` | ^2.1.2 | `useGSAP()` hook — React 19 StrictMode-safe cleanup | Official GSAP React package. Wraps `gsap.context()` for automatic cleanup on unmount |
| `lottie-react` | ^2.4.1 | Lottie milestone animation rendering | flagmail1 uses this exact version. 2.7M weekly downloads. Stable, mature |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | ^4.1.10 | Unit tests for scoring.js, competency.js | Already installed. Pure functions are trivially testable |
| `@testing-library/react` | ^16.3.2 | ScoreboardScreen integration tests | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `lottie-react@2.4.1` | `@lottiefiles/dotlottie-react@0.19.7` | dotlottie has smaller bundles (~50-80% smaller .lottie format) but package flagged SUS (too-new: published 2026-07-03, 5 days ago). Use lottie-react which flagmail1 already vets. |
| `gsap` + `@gsap/react` | `framer-motion` | flagmail1 uses framer-motion for ResultsScreen but GSAP is more powerful for timeline-based entrance sequences. Use GSAP for consistency with project's STACK.md decision. |
| Pure functions in utils/scoring.js | Hook-based scoring (useScoring) | flagmail1 uses a `useScoring` hook. For this project, pure functions per SCORE-07 requirement. Hook wraps them for React integration. |

**Installation:**
```bash
npm install gsap@^3.15.0 @gsap/react@^2.1.2 lottie-react@^2.4.1
```

**Version verification (2026-07-08):**
- `gsap`: 3.15.0 ✓
- `lottie-react`: 2.4.1 ✓
- `@gsap/react`: 2.1.2 ✓

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| gsap | npm | ~10 yrs | 3.5M/wk | github.com/greensock/GSAP | OK | Approved |
| @gsap/react | npm | ~1.5 yrs | 980K/wk | github.com/greensock/react | OK | Approved |
| lottie-react | npm | ~4 yrs | 2.7M/wk | github.com/Gamote/lottie-react | OK | Approved |
| @lottiefiles/dotlottie-react | npm | 5 days | 1.0M/wk | github.com/LottieFiles/dotlottie-web | SUS | Flagged — too-new. Use lottie-react instead |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious [SUS]:** `@lottiefiles/dotlottie-react` — published 2026-07-03 (5 days old at research time). Despite 1M/wk downloads, too new for a hiring assessment. Planner should NOT install this. Fall back to verified `lottie-react@2.4.1`.

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RUNNER (Phase 3) completes                      │
│                    onComplete() → markComplete()                       │
│                              │                                         │
│                     answers[] = [{ videoId, selectedL1, selectedL2,    │
│                                    verdict } × 5]                      │
│                              │                                         │
│                     ┌────────▼────────┐                                │
│                     │  computeScoring  │  ← utils/scoring.js           │
│                     │  (answers,       │     pure function             │
│                     │   answerKeys)    │                                │
│                     └────────┬────────┘                                │
│                              │                                         │
│              ┌───────────────┼───────────────┐                         │
│              │               │               │                         │
│     ┌────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────┐              │
│     │ scoreVideo()  │ │scoreAssess()│ │computePerL1Acc()│              │
│     │ × 5 videos    │ │ overall %   │ │ per-category    │              │
│     │ 100-pt rubric │ │ mean of 5   │ │ { cat: {        │              │
│     └────────┬──────┘ └──────┬──────┘ │   correct,      │              │
│              │               │        │   total } }      │              │
│              │               │        └──────┬───────────┘              │
│              │               │               │                         │
│     ┌────────▼──────┐ ┌──────▼──────┐ ┌──────▼───────────┐              │
│     │ perVideoSummary│ │ competency │ │ perL1Accuracy    │              │
│     │ (BOARD-07)    │ │ title +     │ │ bars (BOARD-02)  │              │
│     │ verdict ✓/✗   │ │ paragraph   │ │                  │              │
│     │ L1 match count│ │ (BOARD-03)  │ │                  │              │
│     │ L2 match count│ │             │ │                  │              │
│     └────────┬──────┘ └──────┬──────┘ └──────┬───────────┘              │
│              │               │               │                         │
│              └───────────────┼───────────────┘                         │
│                              │                                         │
│                     ┌────────▼────────┐                                │
│                     │  scoring state  │  → Zustand store               │
│                     │  + screen:      │    setScoring(payload)         │
│                     │    SCOREBOARD   │                                │
│                     └────────┬────────┘                                │
│                              │                                         │
│                     ┌────────▼────────┐                                │
│                     │ ScoreboardScreen│  ← React component             │
│                     │                 │                                │
│                     │ ┌─────────────┐ │  GSAP useGSAP entrance anims  │
│                     │ │ Overall %   │ │                                │
│                     │ │ + Tier Badge│ │                                │
│                     │ └─────────────┘ │                                │
│                     │ ┌─────────────┐ │  Lottie milestone (dynamic     │
│                     │ │ Lottie Anim │ │  import, lazy)                 │
│                     │ └─────────────┘ │                                │
│                     │ ┌─────────────┐ │  Row-per-L1 accuracy bars      │
│                     │ │ Per-L1 Acc  │ │  sorted by accuracy desc       │
│                     │ │ Breakdown   │ │                                │
│                     │ └─────────────┘ │                                │
│                     │ ┌─────────────┐ │  Competency paragraph           │
│                     │ │ Strengths / │ │  generateCompetency() output   │
│                     │ │ Weaknesses  │ │                                │
│                     │ └─────────────┘ │                                │
│                     │ ┌─────────────┐ │  Verdict ✓/✗, L1 match count, │
│                     │ │ Per-Video   │ │  L2 match count per video      │
│                     │ │ Summary     │ │  NO answer keys revealed       │
│                     │ └─────────────┘ │                                │
│                     │ ┌─────────────┐ │  Total time + per-video        │
│                     │ │ Time Stats  │ │  (if data available)            │
│                     │ └─────────────┘ │                                │
│                     └────────────────┘                                │
│                                                                       │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │                      answerKeys.json                             │  │
│ │  { version: "1.0.0", videos: [{ id, verdict, l1Tags[],          │  │
│ │    l2Tags[], rationale }] }  ← import at build time, bundled     │  │
│ └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 4 additions)

```
src/
├── utils/
│   ├── scoring.js          # NEW: scoreVideo, scoreAssessment, computePerL1Accuracy
│   └── competency.js       # NEW: getProgressTitle, generateCompetency
│
├── data/
│   └── answerKeys.json     # NEW: { version, videos: [{ id, verdict, l1Tags, l2Tags, rationale }] }
│
├── assets/
│   └── animation/          # NEW: 10 Lottie JSON files from flagmail1
│       ├── PERFECT_EYE.json
│       ├── SNIPER.json
│       ├── ON_FIRE.json
│       ├── ZONE_CLEAR.json
│       ├── EAGLE_EYE.json
│       ├── LIGHTNING_READ.json
│       ├── BEAT_THE_CLOCK.json
│       ├── ICE_COLD.json
│       ├── GHOST_DETECTIVE.json
│       └── NO_HINTS_NEEDED.json
│
├── components/
│   └── scoreboard/         # NEW: scoreboard component subtree
│       ├── ScoreboardScreen.jsx    # main layout container
│       ├── OverallScore.jsx        # large % + competency badge pill
│       ├── PerL1Accuracy.jsx       # row-per-L1 with bar + %
│       ├── CompetencyParagraph.jsx # strengths/weaknesses text
│       ├── MilestoneLottie.jsx     # lazy dynamic import + Lottie render
│       ├── PerVideoBreakdown.jsx   # table: verdict ✓/✗, L1 match count, L2 match count
│       └── TimeStats.jsx           # total time + per-video timing
│
├── hooks/
│   └── useScoreboard.js    # NEW: orchestrates scoring computation, wraps utils/*.js
│
docs/
├── scoring-rubric.md       # NEW: tie-breaker rules committed (QUALITY-04)
└── kappa-calibration.md    # NEW: 3-rater kappa results (QUALITY-02)
```

### Pattern 1: Pure Scoring Functions (utils/scoring.js)

**What:** All rubric math lives in pure functions — no React imports, no side effects, no store access. Functions receive plain objects, return plain objects.

**When to use:** Any computation that must be unit-testable and independent of rendering lifecycle. SCORE-07 mandates this.

**Example:**
```javascript
// utils/scoring.js
// Source: derived from REQUIREMENTS.md SCORE-01..03 rubric spec

/**
 * Score a single video answer against its answer key.
 * @param {Object} answer - { selectedL1: string[], selectedL2: string[], verdict: string }
 * @param {Object} answerKey - { id: string, verdict: string, l1Tags: string[], l2Tags: string[] }
 * @returns {{ verdictScore: number, l1Score: number, l2Score: number, total: number, verdictCorrect: boolean, l1Matched: string[], l2Matched: string[] }}
 */
export function scoreVideo(answer, answerKey) {
  const verdictCorrect = answer.verdict === answerKey.verdict;
  const verdictScore = verdictCorrect ? 50 : 0;

  // L1: set intersection partial credit — |user ∩ answer| / |answer| × 25
  const userL1Set = new Set(answer.selectedL1 || []);
  const keyL1Set = new Set(answerKey.l1Tags || []);
  const l1Intersection = [...userL1Set].filter(t => keyL1Set.has(t));
  const l1Score = keyL1Set.size > 0
    ? (l1Intersection.length / keyL1Set.size) * 25
    : (userL1Set.size === 0 ? 25 : 0); // empty answer key + empty user = full credit

  // L2: any-one-match per L1 — if any user L2 under a selected L1
  // matches any answer key L2 under that same L1, full L2 credit for that L1
  const userL2Set = new Set(answer.selectedL2 || []);
  const keyL2Set = new Set(answerKey.l2Tags || []);
  let l2Score = 0;
  const l2Matched = [];

  if (keyL2Set.size > 0) {
    // For each answer-key L1, check if any user L2 under that L1 matches
    // (L2 IDs are in "X.Y" format where X is the L1 parent)
    for (const keyL1 of keyL1Set) {
      const keyL2ForL1 = answerKey.l2Tags.filter(l2 => l2.startsWith(keyL1 + '.'));
      if (keyL2ForL1.length === 0) continue;

      const userL2ForL1 = (answer.selectedL2 || []).filter(l2 => l2.startsWith(keyL1 + '.'));
      const anyMatch = keyL2ForL1.some(kl2 => userL2Set.has(kl2));

      if (anyMatch) {
        l2Score += 25 / keyL1Set.size; // weighted by number of L1s with L2s
        l2Matched.push(keyL1);
      }
    }
    // Round to handle floating point
    l2Score = Math.round(l2Score * 100) / 100;
  } else if (userL2Set.size === 0 && keyL2Set.size === 0) {
    l2Score = 25; // no L2s expected, none provided = full credit
  }

  return {
    verdictScore,
    l1Score: Math.round(l1Score * 100) / 100,
    l2Score,
    total: verdictScore + l1Score + l2Score,
    verdictCorrect,
    l1Matched: l1Intersection,
    l2Matched,
  };
}

export function scoreAssessment(answers, answerKeys) {
  const keyMap = new Map(answerKeys.videos.map(k => [k.id, k]));
  const perVideo = answers.map(answer => {
    const key = keyMap.get(answer.videoId);
    if (!key) return { videoId: answer.videoId, total: 0, error: 'no answer key' };
    return { videoId: answer.videoId, ...scoreVideo(answer, key) };
  });
  const overallPct = perVideo.length > 0
    ? perVideo.reduce((sum, v) => sum + v.total, 0) / perVideo.length
    : 0;
  return { perVideo, overallPct, answerKeyVersion: answerKeys.version };
}

export function computePerL1Accuracy(answers, answerKeys) {
  const keyMap = new Map(answerKeys.videos.map(k => [k.id, k]));
  const acc = {};

  for (const answer of answers) {
    const key = keyMap.get(answer.videoId);
    if (!key) continue;
    const userL1Set = new Set(answer.selectedL1 || []);
    for (const keyL1 of key.l1Tags) {
      if (!acc[keyL1]) acc[keyL1] = { correct: 0, total: 0 };
      acc[keyL1].total++;
      if (userL1Set.has(keyL1)) acc[keyL1].correct++;
    }
  }
  return acc;
}
```

### Pattern 2: Competency Generation (utils/competency.js)

**What:** flagmail1's `generateCompetency()` pattern — receives `{ [category]: { correct, total } }`, returns 1-2 sentence strengths/weaknesses paragraph. `getProgressTitle(score)` returns tier label.

**When to use:** BOARD-03 requires competency title + paragraph.

**Example:**
```javascript
// utils/competency.js
// Source: flagmail1/src/utils/competency.js — verified verbatim pattern

export function getProgressTitle(score) {
  if (score >= 80) return 'Advanced';
  if (score >= 50) return 'Proficient';
  return 'Foundation';
}

export function generateCompetency(categoryCorrect) {
  const categories = Object.entries(categoryCorrect)
    .filter(([, v]) => v.total > 0)
    .map(([cat, v]) => ({
      cat,
      accuracy: v.total > 0 ? v.correct / v.total : 0,
    }));

  if (categories.length === 0) {
    return 'Complete the assessment to receive your competency summary.';
  }

  const strong = categories.filter(c => c.accuracy >= 0.7).map(c => c.cat);
  const weak = categories.filter(c => c.accuracy < 0.5).map(c => c.cat);

  const allStrong = strong.length === categories.length;
  const allWeak = weak.length === categories.length;

  if (allStrong) {
    return 'Exceptional performance across all content categories. You demonstrate strong content moderation instincts.';
  }
  if (allWeak) {
    return 'Every moderator starts somewhere. Review the content categories and sharpen your detection skills.';
  }

  const formatList = (arr) => {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  };

  const strongText = strong.length > 0
    ? `You have a strong foundation in ${formatList(strong)}. `
    : '';
  const weakText = weak.length > 0
    ? `Focus on building your skills in ${formatList(weak)}.`
    : 'Keep sharpening your skills across all content categories.';

  return strongText + weakText;
}
```

### Pattern 3: Dynamic Lottie Import (MilestoneLottie)

**What:** Lottie JSON files are NOT eagerly imported. They use dynamic `import()` triggered by milestone eligibility. Per BOARD-06.

**When to use:** Large optional assets (~50-200 KB each, 10 files). Only the earned milestone animates.

**Example:**
```jsx
// components/scoreboard/MilestoneLottie.jsx
// Source: flagmail1 BadgeCollection.jsx pattern + dynamic import adaptation
import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

// Score → milestone mapping (adapted from flagmail1 BADGES thresholds)
const MILESTONE_MAP = {
  PERFECT_EYE: { threshold: 100, file: () => import('../../assets/animation/PERFECT_EYE.json') },
  SNIPER:      { threshold: 90,  file: () => import('../../assets/animation/SNIPER.json') },
  ON_FIRE:     { threshold: 80,  file: () => import('../../assets/animation/ON_FIRE.json') },
  ZONE_CLEAR:  { threshold: 70,  file: () => import('../../assets/animation/ZONE_CLEAR.json') },
  EAGLE_EYE:   { threshold: 60,  file: () => import('../../assets/animation/EAGLE_EYE.json') },
};

function getMilestone(score) {
  return Object.entries(MILESTONE_MAP)
    .filter(([, v]) => score >= v.threshold)
    .sort((a, b) => b[1].threshold - a[1].threshold)[0]; // highest qualifying
}

export default function MilestoneLottie({ score }) {
  const [animData, setAnimData] = useState(null);
  const milestone = getMilestone(score);

  useEffect(() => {
    if (!milestone) return;
    let cancelled = false;
    milestone[1].file().then(mod => {
      if (!cancelled) setAnimData(mod.default);
    });
    return () => { cancelled = true; };
  }, [milestone]);

  if (!milestone || !animData) return null;

  return (
    <Lottie
      animationData={animData}
      loop={false}
      autoplay
      style={{ width: '100%', maxWidth: 320 }}
    />
  );
}
```

### Pattern 4: GSAP Entrance Animations (ScoreboardScreen)

**What:** Each scoreboard section (Overall, L1 accuracy, competency, per-video, timing) enters with staggered GSAP animations using `useGSAP()` from `@gsap/react` for React 19 StrictMode-safe cleanup.

**When to use:** ScoreboardScreen mount. Per ARCHITECTURE.md Phase 6 deferred GSAP to polish, but flagmail1 uses framer-motion in ResultsScreen — GSAP provides similar effect with project's chosen stack.

**Example:**
```jsx
// components/scoreboard/ScoreboardScreen.jsx
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function ScoreboardScreen({ scoring }) {
  const container = useRef();

  useGSAP(() => {
    gsap.from('.scoreboard-section', {
      opacity: 0,
      y: 24,
      duration: 0.4,
      stagger: 0.12,
      ease: 'power2.out',
    });
  }, { scope: container });

  return (
    <div ref={container} className="scoreboard">
      <div className="scoreboard-section"><OverallScore scoring={scoring} /></div>
      <div className="scoreboard-section"><MilestoneLottie score={scoring.overallPct} /></div>
      <div className="scoreboard-section"><PerL1Accuracy accuracy={scoring.perL1Accuracy} /></div>
      <div className="scoreboard-section"><CompetencyParagraph categoryCorrect={scoring.perL1Accuracy} /></div>
      <div className="scoreboard-section"><PerVideoBreakdown perVideo={scoring.perVideo} /></div>
    </div>
  );
}
```

### Pattern 5: answerKeys.json Schema

**What:** Bundled ground-truth data for 5 videos. Imported by JS at build time, never fetchable.

**Schema:**
```json
{
  "version": "1.0.0",
  "videos": [
    {
      "id": "v01",
      "verdict": "DECLINE",
      "l1Tags": ["1", "8"],
      "l2Tags": ["1.4", "1.6", "8.3"],
      "rationale": "Video contains visible trademark logo (1.4) and stripped watermark (1.6). Also promotes a fraudulent investment scheme (8.3)."
    }
  ]
}
```

**Key design decisions:**
- `id` matches `playlist.json` video IDs (v01-v05)
- `l1Tags` and `l2Tags` use taxonomy IDs (not labels) — locale-independent, stable across renames
- `verdict` is "APPROVE" or "DECLINE" — matches store answer format
- `rationale` feeds QUALITY-01 (docs/video-manifest.md) and helps raters during kappa calibration
- `version` is the `answerKeyVersion` per SCORE-09

### Anti-Patterns to Avoid

- **Anti-pattern: Eager-importing all 10 Lottie files.** Adds ~800 KB to bundle, most never shown. Use dynamic import per BOARD-06.
- **Anti-pattern: Putting answerKeys.json in public/.** Candidate can `curl` it. Bundled import only per SCORE-08.
- **Anti-pattern: Computing scores inside React components.** Violates SCORE-07. Scoring must be pure functions, components only read results.
- **Anti-pattern: Revealing full answer keys in per-video summary.** BOARD-07 says summary only (verdict correct?, L1 matched count, L2 matched count). Never show `answerKey.l1Tags` or `answerKey.l2Tags` on scoreboard.
- **Anti-pattern: Using `setInterval` for GSAP animations in React 19 StrictMode.** Use `useGSAP()` from `@gsap/react` which handles double-mount cleanup automatically.
- **Anti-pattern: Hard-coding L1 category names in competency.js.** Use taxonomy.json IDs. The `computePerL1Accuracy` returns data keyed by taxonomy IDs; CompetencyParagraph resolves labels from taxonomy.json at render time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entrance animations | Custom CSS keyframes + IntersectionObserver timing | `gsap` + `@gsap/react` `useGSAP()` | GSAP handles cleanup, stagger sequencing, React 19 StrictMode double-mount. 10× less code. |
| Lottie rendering | Canvas-based custom animation renderer | `lottie-react` `<Lottie>` component | Tested in flagmail1. Handles autoplay, loop, resize. 2.7M weekly downloads. |
| Cohen/Fleiss kappa math | Custom statistics implementation | Pure functions in `utils/kappa.js` with Wikipedia-verified formulas | Formula is well-defined. Implement directly. Do NOT pull a stats library (simple-linear-regression, jStat) — overkill for one formula. |
| Per-L1 accuracy bars | Canvas-drawn chart or chart library (recharts, chart.js) | CSS `width: X%` on divs | 10 categories max. CSS bars are simpler, zero deps, match flagmail1 CompetencySummary pattern. |
| Number counter animation | Custom RAF loop | `gsap.to(counterRef, { innerText: targetScore, duration: 1.5, snap: { innerText: 1 } })` | GSAP's snap plugin handles count-up animation in one line. |

**Key insight:** The scoring engine is 3 pure functions (~100 lines total). Lottie rendering is one `<Lottie>` component call. GSAP entrance animation is 5 lines. Do not over-engineer. The complexity lives in getting the rubric math right (edge cases) and making the scoreboard visually clear — not in library choices.

## Runtime State Inventory

> Phase 4 is NOT a rename/refactor/migration phase. Scoring + scoreboard is additive (new modules, new screen). No existing runtime state needs migration.

**All 5 categories:**
- **Stored data:** None — answers[] is in-memory only, lost on refresh by design
- **Live service config:** None — no external services configured yet (submission is Phase 5)
- **OS-registered state:** None — no OS registrations
- **Secrets/env vars:** None — no secrets needed for client-side scoring
- **Build artifacts:** None to migrate — new `answerKeys.json` is a new file in `src/data/`

## Common Pitfalls

### Pitfall 1: Zero-L1-Selected Edge Case in L2 Scoring
**What goes wrong:** When user selects zero L1 tags, `selectedL2` is also empty. Scoring function divides by `keyL1Set.size` which could be a different value than expected.
**Why it happens:** The rubric says "any-one-match per L1" but doesn't explicitly define the case where no L1s are selected.
**How to avoid:** When `keyL1Set.size > 0` but `userL1Set.size === 0`, L1 score = 0 (no intersection), L2 score = 0 (no L1s to match against). When `keyL1Set.size === 0`, both L1 and L2 full credit if user also empty.
**Warning signs:** Test `{ selectedL1: [], selectedL2: [], verdict: 'APPROVE' }` against various answer keys.

### Pitfall 2: L2 "Any-One-Match" Per-L1 Weighting
**What goes wrong:** L2 rubric awards "full L2 credit for that L1" when any-one-match is found. But if answer key has 3 L1s with L2 tags and only 1 matches, what's the L2 score?
**Why it happens:** Ambiguity in "full L2 credit for that L1" — does "that L1" mean the specific L1 that matched, or all L1s?
**How to avoid:** Per REQUIREMENTS.md SCORE-03: "any-one-match per L1 counts as full L2 credit for that L1." Weight by number of L1s with L2 tags: if 2 of 3 L1s have L2 tags and only 1 matches, L2 score = 25 × (1/2) = 12.5. If all 3 match, L2 = 25. Document this weighting in `docs/scoring-rubric.md`.
**Warning signs:** Test videos where answer key has L2 tags under 2+ L1s, user matches only some.

### Pitfall 3: Verdict Case Sensitivity
**What goes wrong:** Store uses "APPROVE"/"DECLINE" (uppercase), but answerKeys or future submissions might use lowercase.
**Why it happens:** No normalization step in the answer pipeline.
**How to avoid:** `scoreVideo()` normalizes both sides: `answer.verdict?.toUpperCase() === answerKey.verdict?.toUpperCase()`. Document in rubric.
**Warning signs:** Test with mixed-case verdict strings.

### Pitfall 4: answerKeyVersion Not Propagated
**What goes wrong:** Scoring runs but `answerKeyVersion` is not attached to the scoring result. Phase 5 submission can't tag payload with version.
**Why it happens:** Forgetting to thread the version field through `scoreAssessment()`.
**How to avoid:** `scoreAssessment()` return value MUST include `answerKeyVersion: answerKeys.version`. The store's scoring state MUST include this field.

### Pitfall 5: Lottie Dynamic Import Fails Silently
**What goes wrong:** Dynamic `import()` for Lottie JSON throws, component renders nothing with no error feedback.
**Why it happens:** File path typo, missing asset, or build tool not configured for dynamic imports of JSON from `src/assets/`.
**How to avoid:** Wrap dynamic import in try/catch, render fallback (static icon or placeholder). Verify Vite handles `import('../../assets/animation/*.json')` correctly — test in dev AND production build.

### Pitfall 6: Per-Video Summary Accidentally Reveals Answer Keys
**What goes wrong:** Developer passes `answerKey.l1Tags` to the per-video summary component, exposing ground truth on scoreboard.
**Why it happens:** Convenience — answer key object is already in scope.
**How to avoid:** PerVideoBreakdown receives only: `{ videoId, verdictCorrect, l1MatchCount, l1TotalCount, l2MatchCount, l2TotalCount }`. Never pass the raw `answerKey` object. Code review gate: grep for `answerKey` in scoreboard component files.

### Pitfall 7: Phase 3 Missing Timing Data
**What goes wrong:** `answers[]` in Zustand store does not capture `timedOut`, `timeSpentMs`, or `submittedAt`. BOARD-04 requires per-video timing summary.
**Why it happens:** Phase 3 implemented `commitAnswer()` but did not include timing metadata from the timer.
**How to avoid:** Phase 4 Wave 0 MUST backfill these fields. Add `timedOut`, `timeSpentMs`, `submittedAt` to the tag snapshot before `commitAnswer()`. The store's `setTagSnapshot` already accepts a snapshot object — RunnerScreen's `handleVerdict` must include timing data from the timer store.

## Code Examples

Verified patterns from official sources:

### Scoring: scoreVideo() Complete Implementation
```javascript
// Source: REQUIREMENTS.md SCORE-01..03 rubric specification, verified against taxonomy.json L2 "X.Y" ID format
export function scoreVideo(answer, answerKey) {
  const verdictCorrect = (answer.verdict || '').toUpperCase() === (answerKey.verdict || '').toUpperCase();
  const verdictScore = verdictCorrect ? 50 : 0;

  const userL1Set = new Set(answer.selectedL1 || []);
  const keyL1Set = new Set(answerKey.l1Tags || []);

  // L1 partial credit
  const l1Intersection = [...userL1Set].filter(t => keyL1Set.has(t));
  const l1Score = keyL1Set.size > 0
    ? (l1Intersection.length / keyL1Set.size) * 25
    : (userL1Set.size === 0 ? 25 : 0);

  // L2 any-one-match per L1
  const userL2Set = new Set(answer.selectedL2 || []);
  const keyL2Set = new Set(answerKey.l2Tags || []);
  let l2Score = 0;
  const l2MatchedL1s = [];
  let l1sWithL2s = 0;

  for (const keyL1 of keyL1Set) {
    const keyL2ForL1 = (answerKey.l2Tags || []).filter(l2 => l2.startsWith(keyL1 + '.'));
    if (keyL2ForL1.length === 0) continue;
    l1sWithL2s++;
    const anyMatch = keyL2ForL1.some(kl2 => userL2Set.has(kl2));
    if (anyMatch) l2MatchedL1s.push(keyL1);
  }

  if (l1sWithL2s > 0) {
    l2Score = (l2MatchedL1s.length / l1sWithL2s) * 25;
  } else if (keyL2Set.size === 0) {
    l2Score = 25; // no L2s expected, none provided
  }

  return {
    verdictScore,
    l1Score: Math.round(l1Score * 100) / 100,
    l2Score: Math.round(l2Score * 100) / 100,
    total: Math.round((verdictScore + l1Score + l2Score) * 100) / 100,
    verdictCorrect,
    l1Matched: l1Intersection,
    l2MatchedL1s,
  };
}
```

### GSAP: Scoreboard Entrance Stagger with useGSAP
```javascript
// Source: gsap.com/resources/React (official GSAP docs, verified via WebFetch 2026-07-08)
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP);

function ScoreboardScreen({ scoring }) {
  const container = useRef();
  useGSAP(() => {
    gsap.from('.sb-section', {
      opacity: 0,
      y: 20,
      duration: 0.35,
      stagger: 0.1,
      ease: 'power2.out',
    });
  }, { scope: container });

  return <div ref={container}>...</div>;
}
```

### Cohen's Kappa: Pure Function
```javascript
// Source: Wikipedia "Cohen's kappa" (verified via WebFetch 2026-07-08)
// κ = (po − pe) / (1 − pe)
export function cohensKappa(rater1Tags, rater2Tags, allCategories) {
  const N = rater1Tags.length;
  const C = allCategories.length;

  // Build confusion matrix O[c1][c2]
  const O = {};
  for (const c1 of allCategories) {
    O[c1] = {};
    for (const c2 of allCategories) O[c1][c2] = 0;
  }

  for (let i = 0; i < N; i++) {
    const c1 = rater1Tags[i];
    const c2 = rater2Tags[i];
    if (O[c1] && O[c2] !== undefined) O[c1][c2]++;
  }

  // po = sum of diagonal / N
  let po = 0;
  for (const c of allCategories) po += O[c][c];
  po /= N;

  // pe = sum over categories of (row_total * col_total) / N²
  let pe = 0;
  for (const c of allCategories) {
    const rowTotal = allCategories.reduce((s, c2) => s + O[c][c2], 0);
    const colTotal = allCategories.reduce((s, c1) => s + O[c1][c], 0);
    pe += (rowTotal * colTotal);
  }
  pe /= (N * N);

  if (pe === 1) return 1;
  return (po - pe) / (1 - pe);
}

// Interpretation per Landis & Koch (1977):
// <0: No agreement, 0-0.20: Slight, 0.21-0.40: Fair
// 0.41-0.60: Moderate, 0.61-0.80: Substantial, 0.81-1.0: Almost perfect
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| flagmail1 `useScoring` hook (React-coupled) | Pure functions `utils/scoring.js` (framework-agnostic) | Phase 4 design decision | Easier unit testing, reusable outside React context |
| flagmail1 eager-imports all 10 Lottie files in BadgeCollection | Dynamic `import()` per milestone | BOARD-06 requirement | Reduces initial bundle by ~800 KB |
| flagmail1 `framer-motion` for ResultsScreen animations | GSAP `useGSAP()` for ScoreboardScreen | Aligns with STACK.md decision | Consistent animation approach across project |
| `@lottiefiles/dotlottie-react` (STACK.md recommendation) | `lottie-react@2.4.1` | Package SUS verdict (too-new) | Proven stable version from flagmail1, 2.7M weekly downloads |

**Deprecated/outdated:**
- `@lottiefiles/dotlottie-react@0.19.7`: Flagged SUS — too new (5 days old). Do not install. Use `lottie-react@2.4.1`.
- `useGSAP()` without `gsap.registerPlugin(useGSAP)`: GSAP docs require registration call to avoid React version discrepancies.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 3 answers[] lacks `timedOut`, `timeSpentMs`, `submittedAt` — these fields were in ARCHITECTURE.md state shape but not implemented | Common Pitfalls #7 | BOARD-04 blocked; timing summary cannot render without time data. Phase 4 must backfill |
| A2 | L2 IDs use "X.Y" format (e.g., "1.4") matching taxonomy.json | Pattern 1: scoreVideo | If L2 IDs use different format, scoring `startsWith()` logic breaks |
| A3 | answerKeys.json l2Tags are in "X.Y" format with X being the L1 parent | answerKeys Schema | L2 any-one-match per-L1 scoring relies on parsing L1 from L2 ID prefix |
| A4 | Score → milestone threshold mapping: PERFECT_EYE 100%, SNIPER 90%, ON_FIRE 80%, ZONE_CLEAR 70%, EAGLE_EYE 60% | Pattern 3: MilestoneLottie | flagmail1 used different badge criteria (per-round, not per-assessment). Thresholds need user confirmation |
| A5 | 10 milestone animations from flagmail1 are reusable as-is for this project | Pattern 3: MilestoneLottie | Animation themes (email phishing) may not fit content moderation context. May need replacement |
| A6 | GSAP `@gsap/react` `useGSAP()` hook is compatible with Vite 8 | Pattern 4: GSAP | Vite version mismatch could cause build issues. Both are current major versions — low risk |

## Open Questions (RESOLVED)

1. **What are the correct score-to-milestone thresholds?** RESOLVED — Ship with A4 thresholds (PERFECT_EYE 100%, SNIPER 90%, ON_FIRE 80%, ZONE_CLEAR 70%, EAGLE_EYE 60%). Mark as configurable constants in `utils/competency.js`. Adjust after stakeholder review.

2. **How should Phase 3 timing data gap be resolved?** RESOLVED — Phase 4 Wave 0 backfills timing fields into `commitAnswer()`. Compute `timeSpentMs = 180000 - remainingMs`, capture `timedOut` from `isExpired`, record `submittedAt` from `Date.now()`. ~10 lines of code.

3. **Which Lottie animations from flagmail1 are applicable?** RESOLVED — Start with 5 mapped milestones using flagmail1's generic animations (PERFECT_EYE, SNIPER, ON_FIRE, ZONE_CLEAR, EAGLE_EYE). If animations feel off-theme, swap in Phase 6 polish.

4. **Kappa calibration: How to collect 3 raters' tags?** RESOLVED — Use a Google Sheet with columns: Rater ID, Video ID, L1 Tags (checkbox per category), L2 Tags, Verdict. Share without answer key sheet. Compute kappa offline via `utils/kappa.js`. Store in `docs/kappa-calibration.md`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, Vitest tests | ✓ | (project already builds) | — |
| npm | Package installation | ✓ | (project already uses npm) | — |
| GSAP (npm) | Scoreboard entrance animations | ✗ | — | Install via `npm install gsap` — no system-level dep |
| @gsap/react (npm) | useGSAP hook | ✗ | — | Install via `npm install @gsap/react` — no system-level dep |
| lottie-react (npm) | Milestone animations | ✗ | — | Install via `npm install lottie-react` — no system-level dep |
| flagmail1 Lottie JSON files | Milestone animation assets | ✗ | — | Copy from `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\src\assets\animation\` |
| ffmpeg | (not needed for Phase 4) | — | — | n/a |

**Missing dependencies with no fallback:**
- None — all deps are npm installs or file copies. No system-level dependencies required.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + @testing-library/react 16.3.2 |
| Config file | vitest.config.js or vite.config.js (Vitest reuses Vite config) |
| Quick run command | `npx vitest run src/utils/scoring.test.js` |
| Full suite command | `npm test` (vitest run) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | 100-pt rubric per video: verdict 50 + L1 25 + L2 25 | unit | `npx vitest run src/utils/scoring.test.js -t "scoreVideo"` | ❌ Wave 0 |
| SCORE-02 | L1 set-based partial credit | unit | `npx vitest run src/utils/scoring.test.js -t "L1 partial credit"` | ❌ Wave 0 |
| SCORE-03 | L2 any-one-match per L1 | unit | `npx vitest run src/utils/scoring.test.js -t "L2 any-one-match"` | ❌ Wave 0 |
| SCORE-04 | Overall score = mean of 5 videos | unit | `npx vitest run src/utils/scoring.test.js -t "scoreAssessment"` | ❌ Wave 0 |
| SCORE-05 | Per-L1 accuracy across all videos | unit | `npx vitest run src/utils/scoring.test.js -t "computePerL1Accuracy"` | ❌ Wave 0 |
| SCORE-06 | Competency thresholds + paragraph | unit | `npx vitest run src/utils/competency.test.js` | ❌ Wave 0 |
| SCORE-07 | No React deps in scoring.js | static | Grep `src/utils/scoring.js` for `import.*react` — must be 0 | n/a |
| SCORE-08 | answerKeys.json not in public/ | static | `Test-Path public/answerKeys.json` → false | n/a |
| SCORE-09 | answerKeyVersion in scoring result | unit | `npx vitest run src/utils/scoring.test.js -t "answerKeyVersion"` | ❌ Wave 0 |
| BOARD-01 | Overall score % rendered | integration | `npx vitest run src/components/scoreboard/ScoreboardScreen.test.jsx -t "overall score"` | ❌ Wave 0 |
| BOARD-02 | Per-L1 accuracy bars rendered | integration | `npx vitest run src/components/scoreboard/ScoreboardScreen.test.jsx -t "per-L1"` | ❌ Wave 0 |
| BOARD-03 | Competency title + paragraph | integration | `npx vitest run src/components/scoreboard/ScoreboardScreen.test.jsx -t "competency"` | ❌ Wave 0 |
| BOARD-05 | Lottie milestone renders on qualifying score | integration | `npx vitest run src/components/scoreboard/ScoreboardScreen.test.jsx -t "lottie"` | ❌ Wave 0 |
| BOARD-06 | Lottie lazy-loaded (not eager) | static | Check no top-level `import ... from '../assets/animation'` in scoreboard | n/a |
| BOARD-07 | Per-video summary without answer keys | integration | `npx vitest run src/components/scoreboard/ScoreboardScreen.test.jsx -t "per-video"` | ❌ Wave 0 |
| QUALITY-04 | Tie-breaker rule in docs/scoring-rubric.md | manual | `Test-Path docs/scoring-rubric.md` → true + content review | n/a |

### Sampling Rate
- **Per task commit:** `npx vitest run src/utils/scoring.test.js src/utils/competency.test.js`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** All unit tests green + scoreboard integration tests green + docs/scoring-rubric.md committed

### Wave 0 Gaps
- [ ] `src/utils/scoring.test.js` — covers SCORE-01..05, SCORE-09 (scoreVideo, scoreAssessment, computePerL1Accuracy, edge cases)
- [ ] `src/utils/competency.test.js` — covers SCORE-06 (getProgressTitle thresholds, generateCompetency output)
- [ ] `src/utils/kappa.test.js` — covers QUALITY-02 (Cohen's kappa, Fleiss' kappa)
- [ ] `src/components/scoreboard/ScoreboardScreen.test.jsx` — covers BOARD-01..03, BOARD-05, BOARD-07
- [ ] `src/utils/scoring.js` — new file (pure scoring functions)
- [ ] `src/utils/competency.js` — new file (competency logic)
- [ ] `src/utils/kappa.js` — new file (inter-rater reliability)
- [ ] `src/data/answerKeys.json` — new file (answer keys)
- [ ] `src/components/scoreboard/` — new directory with 7 components
- [ ] `src/assets/animation/` — new directory with Lottie JSON files
- [ ] `docs/scoring-rubric.md` — new file (QUALITY-04)
- [ ] Backfill timing data in Zustand store — add `timeSpentMs`, `timedOut`, `submittedAt` to answer snapshot

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this phase |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No multi-user access |
| V5 Input Validation | yes | Scoring functions must validate input shapes. `scoreVideo()` should handle null/missing fields gracefully. answerKeys.json validated at build time. |
| V6 Cryptography | no | No crypto in this phase |

### Known Threat Patterns for Scoring

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Candidate inspects bundle to extract answerKeys.json content | Information Disclosure | Bundling in hashed chunk (SCORE-08). Acknowledged obscurity-not-security per ARCHITECTURE.md. Determined candidate can extract — reputational deterrent. |
| Malformed answer object causes scoring crash (NaN scores) | Denial of Service | Input validation in scoreVideo: coerce arrays, default missing fields to empty arrays/empty string. Unit tests cover null/undefined inputs. |
| Scoreboard reveals answer keys through error messages or debug logging | Information Disclosure | PerVideoBreakdown receives ONLY correct/incorrect booleans and match counts. Code review gate: no answerKey references in scoreboard components. |
| Lottie dynamic import loads malicious JSON if path traversal possible | Tampering | Static file paths only (hardcoded). No user-supplied file paths in import(). Vite build restricts to src/ tree. |

## Sources

### Primary (HIGH confidence)
- **flagmail1 reference implementation** (`C:\Users\anoop\OneDrive\Desktop\apple\flagmail1`) — Verified: `src/utils/competency.js` (generateCompetency, getProgressTitle), `src/components/ResultsScreen.jsx` (scoreboard layout), `src/components/CompetencySummary.jsx` (per-category accuracy bars), `src/components/BadgeCollection.jsx` (Lottie milestone rendering), `src/hooks/useBadges.js` (badge definitions and triggers), `src/config/game.js` (timing thresholds). Direct code inspection.
- **Zustand store** (`src/stores/useAssessmentStore.js`) — Verified answers[] shape: `{ selectedL1, selectedL2, verdict, videoIndex }`. Missing timing fields confirmed.
- **taxonomy.json** (`src/data/taxonomy.json`) — Verified: 10 L1 categories with IDs "1"–"10", 63 L2 subcategories with IDs in "X.Y" format.
- **playlist.json** (`src/data/playlist.json`) — Verified: 5 video IDs (v01–v05). v02–v05 are placeholders reusing v01 assets.
- **npm registry** (verified 2026-07-08) — `gsap@3.15.0`, `lottie-react@2.4.1`, `@gsap/react@2.1.2` all confirmed OK via `gsd-tools query package-legitimacy check`.
- **GSAP official docs** (`gsap.com/resources/React`) — Verified via WebFetch 2026-07-08. `useGSAP()` hook API, config object (`{ scope, dependencies, revertOnUpdate }`), `contextSafe()` for interaction handlers, React 19 StrictMode compatibility.

### Secondary (MEDIUM confidence)
- **Wikipedia "Cohen's kappa"** — Verified via WebFetch 2026-07-08. Formula: κ = (po − pe) / (1 − pe). Interpretation: Landis & Koch thresholds. WebFetch URL confirmed.
- **flagmail1 `src/components/BadgeCollection.jsx`** — Verified 10 Lottie animation file names and eager-import pattern (converted to lazy for this project).
- **STACK.md** (`C:\Users\anoop\projects\content-moderation-assessment\.planning\research\STACK.md`) — Verified package recommendations. `@lottiefiles/dotlottie-react` recommendation overridden by SUS verdict.

### Tertiary (LOW confidence)
- **lottie-react dynamic import behavior** — Documentation URL returned 404. Pattern inferred from flagmail1's eager-import approach and general React dynamic import knowledge. [ASSUMED] dynamic import of `.json` works identically.
- **Score-to-milestone thresholds** — Not present in flagmail1 (different badge system). Assigned per A4. [ASSUMED] need stakeholder confirmation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry verified, flagmail1 vets lottie-react, GSAP docs confirmed via WebFetch
- Architecture: HIGH — scoring flow derived from REQUIREMENTS.md rubric, flagmail1 ResultsScreen pattern, existing store structure
- Pitfalls: HIGH — edge cases identified from rubric spec, existing code gaps confirmed by reading store source
- Lottie thresholds: LOW — assumed per A4, need stakeholder confirmation

**Research date:** 2026-07-08
**Valid until:** 2026-08-07 (30 days — stable domain, no fast-moving external deps)
