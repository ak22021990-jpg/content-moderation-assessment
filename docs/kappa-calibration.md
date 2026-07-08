# Inter-Rater Reliability — Kappa Calibration

**Phase:** 4 (Scoring + Scoreboard)
**Status:** PLAN — data collection pending
**Target:** κ ≥ 0.6 (substantial agreement) per L1 category for all 5 videos
**Last updated:** 2026-07-08

---

## Methodology

### Raters

Three independent raters with content moderation domain knowledge tag each of 5 videos blindly. Raters do NOT see:

- The answer keys (`src/data/answerKeys.json`)
- Each other's ratings
- The scoring rubric beyond what's in the public Guidelines page

### Rating Task

For each video, each rater records:

1. **Verdict:** APPROVE or DECLINE
2. **L1 Tags:** Multi-select from 10 categories (taxonomy.json)
3. **L2 Tags:** Dependent multi-select under selected L1s
4. **Confidence:** Self-rated certainty (1-5 scale)

### Tooling

Google Sheet with columns:

| Rater ID | Video ID | L1 Tags (checkboxes: 1-10) | L2 Tags | Verdict | Confidence | Notes |

The sheet is shared with raters without revealing the answer key sheet.

### Computation

Kappa is computed per L1 category using `src/utils/kappa.js`:

- **Cohen's Kappa:** Pairwise kappa for each pair of raters (3 pairs: R1-R2, R2-R3, R1-R3). Mean of 3 pairwise kappas reported.
- **Fleiss' Kappa:** Multi-rater kappa for all 3 raters simultaneously. Used when all 3 raters have rated all 5 videos.

Formula: κ = (Po − Pe) / (1 − Pe)

- Po = observed agreement proportion
- Pe = expected agreement by chance

### Interpretation (Landis & Koch, 1977)

| κ Range | Agreement Level |
|---------|----------------|
| < 0.00 | No agreement |
| 0.00–0.20 | Slight |
| 0.21–0.40 | Fair |
| 0.41–0.60 | Moderate |
| 0.61–0.80 | Substantial |
| 0.81–1.00 | Almost perfect |

## Target

- **Goal:** κ ≥ 0.6 ("Substantial" agreement) for every L1 category across all 5 videos
- **Minimum acceptable:** κ ≥ 0.41 ("Moderate" agreement) — videos below this threshold are DROPPED from scoring
- **Flagged:** Portions not wholly clear — re-authored or re-shot in Phase 6

## Data Collection Status

- [ ] Rater 1 identified
- [ ] Rater 2 identified
- [ ] Rater 3 identified
- [ ] Rating sheet created and shared
- [ ] All 3 raters completed tagging
- [ ] Kappa computed per L1
- [ ] Results reviewed by client moderation lead

## Results (To Be Filled After Data Collection)

### Per-L1 Kappa Values

| Category | Cohen (mean) | Fleiss' | Interpretation | Status |
|----------|-------------|---------|----------------|--------|
| 1 — Copyright & IP | — | — | — | Pending |
| 2 — Hate & Harassment | — | — | — | Pending |
| 3 — Violence & Graphic Content | — | — | — | Pending |
| 4 — Sexual & Nudity | — | — | — | Pending |
| 5 — Minor Safety | — | — | — | Pending |
| 6 — Regulated Goods & Activities | — | — | — | Pending |
| 7 — Misinformation & Deceptive Sync | — | — | — | Pending |
| 8 — Spam & Manipulation | — | — | — | Pending |
| 9 — Brand Safety (GARM) | — | — | — | Pending |
| 10 — Community Standards | — | — | — | Pending |

### Flagged Videos

| Video ID | Low-Kappa Categories | Action |
|----------|---------------------|--------|
| — | — | — |

## Version

This document is versioned alongside `src/data/answerKeys.json`. When answer keys change (e.g., after kappa review), both documents are updated together.

- **Current answer key version:** 1.0.0-draft
- **Kappa calibration version:** 1.0.0-draft (pre-data-collection)
