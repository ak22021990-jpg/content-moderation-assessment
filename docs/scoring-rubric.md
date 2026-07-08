# Scoring Rubric — Content Moderation Assessment

**Version:** 1.0.0-draft
**Status:** COMMITTED BEFORE CANDIDATE DATA COLLECTION (QUALITY-04 gate)
**Last updated:** 2026-07-08

---

## 1. Per-Video Scoring (100 Points)

Each video is scored on a 100-point rubric with three components:

| Component | Max Points | Rule |
|-----------|-----------|------|
| **Verdict** | 50 | Exact match (case-insensitive): `APPROVE` or `DECLINE` |
| **L1 Tags** | 25 | Set-based partial credit: `|user ∩ key| / |key| × 25` |
| **L2 Tags** | 25 | Any-one-match per L1: one matching L2 per L1 earns full L2 credit for that L1 |

### 1.1 Verdict (50 pts)

- Full 50 points if candidate's verdict matches answer key exactly (case-insensitive: `approve` = `APPROVE`).
- 0 points on mismatch.
- Null or missing verdict = mismatch → 0 points.

### 1.2 L1 Tags — Partial Credit (25 pts)

L1 scoring uses **set-based partial credit**:
```
L1 Score = (|user_selected ∩ key_tags| / |key_tags|) × 25
```

**Tie-breaker rule (UNION L1):** The scoring uses **intersection** of user-selected tags with the reference (answer key) set. Extra user tags beyond the reference set do **not** penalize the candidate — they are simply ignored. Missing reference tags reduce the score proportionally.

Examples:
- Key = [1, 8], User = [1, 8] → L1 = 25 (exact match)
- Key = [1, 8], User = [1] → L1 = 12.5 (1/2 matched)
- Key = [1, 8], User = [1, 8, 3] → L1 = 25 (all key tags matched, extra "3" ignored)
- Key = [1, 8], User = [] → L1 = 0 (no intersection)
- Key = [], User = [] → L1 = 25 (no tags expected, none provided)
- Key = [], User = [1] → L1 = 0 (no tags expected, user tagged unnecessarily)

### 1.3 L2 Tags — Any-One-Match Per L1 (25 pts)

L2 scoring uses **any-one-match per L1**:
- For each L1 in the answer key that has L2 sub-tags:
  - If the user selected **at least one** L2 tag that matches **any** key L2 under that L1 → that L1 earns full L2 credit.
- The L2 score is weighted by the number of L1s that have L2 tags:
```
L2 Score = (L1s_with_at_least_one_L2_match / L1s_with_L2_tags_in_key) × 25
```

**Tie-breaker rule (ANY-ONE-MATCH L2):** Only **one** correct L2 per L1 is needed for full credit on that L1. This is intentionally lenient — recognizes that a candidate who identifies the correct category (L1) and any correct sub-category (L2) demonstrates sufficient understanding.

Examples:
- Key L1s = [1, 8], Key L2s = [1.4, 1.6, 8.3], User L2s = [1.4, 8.3] → L2 = 25 (both L1s matched)
- Key L1s = [1, 8], Key L2s = [1.4, 8.3], User L2s = [1.4] → L2 = 12.5 (1/2 L1s matched)
- Key L1s = [1], Key L2s = [], User L2s = [] → L2 = 25 (no L2s expected)
- Key L1s = [1, 8], Key L2s = [1.4, 8.3], User selected L1s = [1] only, User L2s = [8.3] → L2 = 0 (L2 8.3 is under L1 "8" which user did not select — cannot match)

## 2. Overall Assessment Score

Overall Score = mean of all 5 per-video total scores, expressed as a percentage (0-100).

## 3. Competency Tiers

| Score Range | Tier |
|-------------|------|
| ≥ 80% | **Advanced** — Exceptional content moderation instincts |
| ≥ 50% | **Proficient** — Solid foundation with room to grow |
| < 50% | **Foundation** — Review content categories and sharpen skills |

## 4. Zero-L1 Policy

Selecting **zero L1 tags** and submitting `APPROVE` is a valid submission ("I found no violations"). In this case:
- If the answer key also has zero L1s → full L1 credit (25 pts) and full L2 credit (25 pts).
- If the answer key has L1s → zero L1 credit (0 pts) and zero L2 credit (0 pts — no L1 context to match L2s against).

## 5. Versioning Policy

- Every answer key file carries a `version` field (semver).
- Every candidate submission includes `answerKeyVersion`.
- **Post-launch key edits MUST bump the version.** Scores are only comparable within the same version.
- This document is committed to the repository BEFORE any candidate data is collected (QUALITY-04 gate). Rule changes after data collection require explicit cohort separation.

## 6. Kappa Calibration

Three independent raters tag each video blindly. Cohen's kappa (pairwise) or Fleiss' kappa (3-raters) is computed per L1 category. Target: κ ≥ 0.6 (substantial agreement per Landis & Koch, 1977). Videos below threshold are flagged for re-authoring before launch (Phase 6).

Kappa results and rater data are stored in `docs/kappa-calibration.md`.
