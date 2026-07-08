# Requirements — Content Moderation Assessment

**Version:** v1
**Created:** 2026-07-07
**Sources:** `.planning/PROJECT.md`, `.planning/research/SUMMARY.md` + STACK/FEATURES/ARCHITECTURE/PITFALLS

---

## v1 Requirements

Grouped by category. Each requirement is atomic, testable, user-centric.

### Identity & Onboarding (IDENT)

- [ ] **IDENT-01**: User can enter their full name (required, non-empty, ≤ 100 chars) on the Landing screen
- [ ] **IDENT-02**: User can enter their email address (required, RFC-5322 basic validation) on the Landing screen
- [ ] **IDENT-03**: User cannot start the assessment until both name and email pass validation
- [ ] **IDENT-04**: User's name and email persist through the session (screen transitions do not lose identity)
- [ ] **IDENT-05**: Landing screen displays a short generic description of the assessment (no client brand name, no franchise name)

### Guidelines & Tutorial (GUIDE)

- [ ] **GUIDE-01**: User sees a full Guidelines page listing all L1 categories with 1–2 sentence definitions before video 1
- [ ] **GUIDE-02**: Each L1 shows its child L2 sub-categories with definitions and one concrete example
- [ ] **GUIDE-03**: Guidelines page explains the Approve vs Decline verdict rule and the multi-tag policy
- [ ] **GUIDE-04**: Guidelines page explains the 3-minute per-video timer and the auto-submit behavior on timeout
- [ ] **GUIDE-05**: User can only advance from Guidelines by clicking "Begin Assessment" (explicit acknowledgement)
- [ ] **GUIDE-06**: Guidelines content is served from `taxonomy.json` (single source of truth shared with TagPanel)

### Video Player (PLAY)

- [ ] **PLAY-01**: Player renders each video with visible play/pause controls
- [ ] **PLAY-02**: Player exposes a seek bar the user can drag to any point in the video
- [ ] **PLAY-03**: Seek bar shows a hover thumbnail preview (WebVTT `metadata` track + sprite JPEG) at the hovered timestamp
- [ ] **PLAY-04**: Seek bar shows chapter markers at author-defined timestamps of interest (WebVTT `chapters` track)
- [ ] **PLAY-05**: Player displays current time and total duration
- [ ] **PLAY-06**: Player supports volume control and mute toggle
- [ ] **PLAY-07**: Video uses click-to-start (no autoplay); `playsinline` and `preload="metadata"` set
- [ ] **PLAY-08**: Player reports `canplaythrough` before the countdown timer starts
- [ ] **PLAY-09**: Player is implemented with `media-chrome@^4.19` React exports (per SUMMARY.md decision)
- [ ] **PLAY-10**: Player is keyboard accessible (space = play/pause, arrows = ±5 s seek, M = mute)

### Timer (TIME)

- [x] **TIME-01**: Each video has a 3:00 countdown timer visible above the player
- [x] **TIME-02**: Timer starts on the `playing` event of that video (not on screen mount)
- [x] **TIME-03**: Timer uses `performance.now()` deltas anchored to a wall-clock start (per PITFALLS.md — not `setInterval`)
- [x] **TIME-04**: Timer persists to `sessionStorage` and survives page refresh mid-video (resumes at the correct remaining time)
- [x] **TIME-05**: Timer color shifts at 60 s (amber) and 15 s (red) remaining
- [x] **TIME-06**: At 0:00, the current video's answer auto-submits with whatever tags/verdict the user had selected
- [x] **TIME-07**: Timer lives in a Zustand slice with selector subscriptions to prevent per-second re-renders cascading through the player and tag panel
- [x] **TIME-08**: Pausing the video does NOT pause the timer (documented in Guidelines)

### L1 / L2 Tagging (TAG)

- [x] **TAG-01**: User can select one or more L1 categories per video (multi-select)
- [x] **TAG-02**: Selecting an L1 reveals its L2 sub-categories; user can select one or more L2 tags per selected L1
- [x] **TAG-03**: L2 selection is scoped to its parent L1 (cannot pick an L2 without its L1 being selected)
- [x] **TAG-04**: User can deselect any L1 or L2 at any time before verdict submission
- [x] **TAG-05**: If user selects zero L1 categories and clicks Approve, that is a valid submission (no violation flagged)
- [x] **TAG-06**: If user selects an L1 but no L2 under it, the submission is valid but the L2 portion of the rubric scores 0 for that L1
- [x] **TAG-07**: TagPanel is driven by `taxonomy.json` (data-driven, no hard-coded category names in JSX)
- [x] **TAG-08**: TagPanel is keyboard-accessible (tab traversal, space = toggle)

### Verdict (VERDICT)

- [x] **VERDICT-01**: User sees clear Approve and Decline buttons on the tagging panel
- [x] **VERDICT-02**: Clicking Approve or Decline records the verdict and advances to the next video
- [x] **VERDICT-03**: Verdict is required to advance (or timer auto-submits at 0:00)
- [x] **VERDICT-04**: After verdict is recorded for a video, user cannot go back and edit that video's answers (one-shot per video)

### Scoring Rubric (SCORE)

- [x] **SCORE-01**: Each video is scored on a 100-point rubric: verdict correct = 50 pts, L1 correct = 25 pts, L2 correct = 25 pts
- [x] **SCORE-02**: L1 scoring is set-based partial credit: `|user ∩ answer| / |answer|` × 25 (per PITFALLS.md tie-breaker: union of user tags accepted; scored on intersection with reference set)
- [x] **SCORE-03**: L2 scoring is set-based partial credit within selected L1s: `any-one-match` per L1 counts as full L2 credit for that L1 (proposed rule, client sign-off required)
- [x] **SCORE-04**: Overall assessment score is the mean of the 5 video scores, expressed as a percentage
- [x] **SCORE-05**: Per-L1 accuracy is computed across all 5 videos (denominator = number of videos where that L1 was in the answer key)
- [ ] **SCORE-06**: Competency title derived: `>= 80% = Advanced`, `>= 50% = Proficient`, `< 50% = Foundation`
- [x] **SCORE-07**: Scoring logic lives in pure functions in `utils/scoring.js` (unit-testable, no React dependencies)
- [ ] **SCORE-08**: Answer keys are bundled inside the JS build (not in `public/`) — accepts obscurity-not-security tradeoff per ARCHITECTURE.md
- [x] **SCORE-09**: Every submission carries an `answerKeyVersion` string so post-launch key edits don't corrupt cross-cohort comparisons

### Scoreboard (BOARD)

- [ ] **BOARD-01**: Scoreboard shows overall score percentage prominently
- [ ] **BOARD-02**: Scoreboard shows per-L1 accuracy breakdown (bar chart or accuracy row per L1 that appeared in the answer keys)
- [ ] **BOARD-03**: Scoreboard shows competency title (Advanced / Proficient / Foundation) and a 1–2 sentence strengths/weaknesses paragraph (reuse `generateCompetency` pattern from flagmail1)
- [ ] **BOARD-04**: Scoreboard shows time-to-complete and per-video timing summary
- [ ] **BOARD-05**: Scoreboard triggers a matching Lottie milestone animation on qualifying scores (PERFECT_EYE / SNIPER / ON_FIRE / ZONE_CLEAR / etc.)
- [ ] **BOARD-06**: Lottie assets are lazy-loaded on demand (not eager-imported)
- [ ] **BOARD-07**: Scoreboard shows per-video summary (verdict correct? L1 tags matched? L2 tags matched?) without revealing full answer keys

### One-Attempt Enforcement (ATTEMPT)

- [ ] **ATTEMPT-01**: On successful submission (backend 200), a flag is written to `localStorage` binding the assessment to that browser
- [ ] **ATTEMPT-02**: On Landing screen mount, if the `localStorage` flag is present, user sees a "You have already completed this assessment" screen and cannot start again
- [ ] **ATTEMPT-03**: Server (Apps Script `doPost`) computes SHA-256 of normalized email and rejects duplicates (per PITFALLS.md defense-in-depth)
- [ ] **ATTEMPT-04**: Email is normalized before dedup (lowercase, strip `+` aliases and dots for Gmail-family, trim whitespace)
- [ ] **ATTEMPT-05**: Guidelines page discloses the one-attempt policy honestly to the candidate

### Submission (SUBMIT)

- [ ] **SUBMIT-01**: On completion, client POSTs a single JSON payload to a Google Apps Script `doPost` webhook (per SUMMARY.md — Sheets preferred over Formspree)
- [ ] **SUBMIT-02**: Payload includes: name, email, hashed-email-dedup-key, per-video answers (L1 set, L2 set, verdict, time-taken), overall score, per-L1 accuracy, competency title, `answerKeyVersion`, `taxonomyVersion`, session start/end timestamps, user-agent, screen resolution
- [ ] **SUBMIT-03**: Client retries with exponential backoff (3 attempts max) on 5xx or network error
- [ ] **SUBMIT-04**: Apps Script validates an HMAC token in the payload against a shared secret before writing the row
- [ ] **SUBMIT-05**: Apps Script validates the `Origin` header against the deployed Pages origin
- [ ] **SUBMIT-06**: Apps Script rate-limits to N submissions per IP per minute (default N = 3)
- [ ] **SUBMIT-07**: Apps Script writes to a Google Sheet with one row per submission and returns `{ok: true, id: <rowId>}` on success
- [ ] **SUBMIT-08**: SubmitDoneScreen thanks the candidate and confirms results were sent to the hiring team
- [ ] **SUBMIT-09**: On submission failure, user sees a "Please try again" message and a manual retry button
- [ ] **SUBMIT-10**: `@formspree/react` fallback endpoint is wired but disabled by default (env-toggled fallback if Apps Script quota hits)

### Content — Videos & Taxonomy (CONTENT)

- [ ] **CONTENT-01**: `taxonomy.json` locks 10 L1 categories with client-approved L2 sub-categories (per SUMMARY.md list)
- [ ] **CONTENT-02**: `playlist.json` describes each of the 5 videos: `id`, `title`, `srcUrl`, `spriteUrl`, `thumbsVttUrl`, `chaptersVttUrl`, `durationSec`, `answerKey`, `answerKeyRationale`
- [ ] **CONTENT-03**: `playlist.json` `srcUrl` is env-conditional so a CDN swap (LFS → jsDelivr → R2) is a one-line config change
- [ ] **CONTENT-04**: All 5 videos are 60–120 seconds each, encoded H.264 720p CRF 26, AAC 96 kbps, `-movflags +faststart`, target ≤ 20 MB per clip
- [ ] **CONTENT-05**: Each video ships with `chapters.vtt` marking suspicious moments (author-provided, 1–4 chapters per video)
- [ ] **CONTENT-06**: Each video ships with `thumbs.vtt` + `sprite.jpg` generated by `scripts/generate-sprites.mjs` (ffmpeg at build time)
- [ ] **CONTENT-07**: `docs/video-manifest.md` documents each video: source URL, license/model-release, target L1/L2, correct-verdict rationale
- [ ] **CONTENT-08**: Video content spans a mix of violation types (copyright/watermark simulation, brand-safety edge case, benign, hate-speech overlay, ambiguous)
- [ ] **CONTENT-09**: Video sourcing follows the Mix strategy: CC0 base clips (Pexels/Pixabay) + ffmpeg `drawtext` overlays, AI-generated clips (Runway/Sora/Veo — ToS-cleared), originally recorded material
- [ ] **CONTENT-10**: No real client-brand IP is used (no character faces, no franchise assets, no real trademarks); overlays use fictional trademarks/watermarks
- [ ] **CONTENT-11**: V5 is a deliberately ambiguous "clean-but-brand-adjacent" edge case whose answer key is documented pending client sign-off (open decision O-01)

### Deployment & Infrastructure (DEPLOY)

- [ ] **DEPLOY-01**: Project lives in a NEW public GitHub repo with a generic name (not this Disney directory, not any client-brand-adjacent name)
- [ ] **DEPLOY-02**: `vite.config.js` sets `base: '/<repo>/'` for GitHub Pages sub-path serving
- [ ] **DEPLOY-03**: GitHub Actions workflow (`.github/workflows/deploy.yml`) builds with Vite and deploys to Pages via `actions/deploy-pages@v4`
- [ ] **DEPLOY-04**: Workflow checkouts use `actions/checkout@v6` with `lfs: true`
- [ ] **DEPLOY-05**: Workflow includes a verification step (`file <video>.mp4 | grep MP4`) that fails CI loudly if LFS silently produced pointer files
- [ ] **DEPLOY-06**: `.gitattributes` tracks `*.mp4`, `*.webm`, `*.lottie`, `*.jpg` sprites via LFS
- [ ] **DEPLOY-07**: Deploy pipeline is green with placeholder content by end of Phase 0 (before any UI complexity is added)
- [ ] **DEPLOY-08**: jsDelivr proxy URL OR Cloudflare R2 bucket is pre-provisioned so `playlist.json` can be re-pointed with zero code change if LFS quota is exhausted
- [ ] **DEPLOY-09**: GitHub billing spending cap set to $0 to prevent surprise LFS overages

### Brand-Safety Enforcement (BRAND)

- [ ] **BRAND-01**: HTML `<title>`, `<meta name="description">`, favicon, and OG tags contain zero client brand references
- [ ] **BRAND-02**: `package.json` `name`, `description`, `author`, and `repository` fields contain zero client brand references
- [ ] **BRAND-03**: Repo name, default branch name, workflow names, and commit messages contain zero client brand references
- [ ] **BRAND-04**: `.githooks/pre-commit` runs `grep -riE '<forbidden-strings>'` against staged files and blocks any match
- [ ] **BRAND-05**: `.github/workflows/brand-guard.yml` runs the same grep against the full diff and fails the PR
- [ ] **BRAND-06**: `docs/brand-guardrails.md` lists the exact forbidden strings (brand + franchise + character names — populated per open decision O-10) and the process to update the list
- [ ] **BRAND-07**: Author email used for commits does NOT resolve to the client organization
- [ ] **BRAND-08**: Video filenames, JSON keys, CSS class names, and Lottie file names use generic language (`assessment-*`, `verdict-*`, `milestone-*`) — no brand-adjacent names

### Ground-Truth Quality (QUALITY)

- [ ] **QUALITY-01**: Each video's answer key is authored with explicit written rationale in `docs/video-manifest.md`
- [ ] **QUALITY-02**: 3 independent raters tag each video blindly during Phase 4; Cohen/Fleiss kappa is computed per L1
- [ ] **QUALITY-03**: All 5 videos must reach kappa ≥ 0.6 for their L1 tags before Phase 6 launch — videos below the threshold are re-authored, re-shot, or dropped from scoring
- [ ] **QUALITY-04**: Tie-breaker rule (union L1 / any-one-match L2) is committed to `docs/scoring-rubric.md` BEFORE any candidate data is collected
- [ ] **QUALITY-05**: Client moderation lead signs off on `taxonomy.json` L2 wording and on the per-video answer keys before Phase 6 launch
- [ ] **QUALITY-06**: Answer keys have an `answerKeyVersion` field; any post-launch edit bumps the version

---

## v2 (Deferred — nice-to-have not blocker)

- **CONTENT-v2-01**: Random 5-of-N video sampling from a larger pool (defeats screen-record answer sharing)
- **BOARD-v2-01**: Shareable-URL export of scoreboard (hashed results in URL, no backend)
- **BOARD-v2-02**: PDF export of scoreboard branded generically
- **TAG-v2-01**: Free-form reasoning notes field per video (adds text-analysis dimension)
- **BOARD-v2-03**: Confidence self-rating per video (candidate rates own certainty; correlated with accuracy)
- **ATTEMPT-v2-01**: Browser-fingerprint dedup as additional signal (client-side, no cookies)
- **BOARD-v2-04**: Leaderboard across candidates (requires persistent backend + PII policy)
- **GUIDE-v2-01**: Interactive walkthrough with 1 practice video (currently deferred; full guidelines page ships in v1)
- **PLAY-v2-01**: Frame-by-frame scrubbing (arrow keys advance 1 frame)
- **CONTENT-v2-02**: Expand from 5 to 20+ videos with categorized pool
- **DEPLOY-v2-01**: Custom domain with client-agnostic subdomain

---

## Out of Scope (v1 explicit exclusions)

- **Real client-brand assets** (logos, character IP, franchise footage) — Client explicit rule + legal exposure
- **Real production creator-uploaded content** — Rights/privacy risk; assessment uses curated synthetic/CC0 mix
- **CMS admin UI for videos** — JSON config is enough; heavy backend admin is over-engineered
- **Multiple retake attempts** — Fair hiring signal requires one attempt; contradicts assessment intent
- **Backend auth / login system** — Identity captured once; overkill for a hiring test
- **Mobile-first design** — Desktop-first (moderators work on desktops); v1 is responsive-tolerable, not mobile-optimized
- **i18n / multi-language UI** — English-only for v1
- **Video transcript / subtitle overlay for accessibility** — Not standard in real mod queues at this tier; consider for v2
- **CSAM or realistic-abuse imagery in test videos** — Zero-tolerance categorical anti-feature; violation categories are represented by overlays / AI-gen / staged fake UI
- **Real deepfakes of real people** — Categorical anti-feature; legal exposure
- **Realistic simulated suicide/self-harm content** — Categorical anti-feature; ethics + platform ToS
- **Router library** (`react-router-dom` etc.) — Screen enum is enough; Pages sub-path deep-linking is a 404 trap otherwise
- **Redux / Redux Toolkit** — 40× overkill; hook composition + tiny Zustand timer slice covers scope
- **Server-side scoring** — v1 accepts obscurity-not-security tradeoff (answer keys bundled); server-side scoring is v2 if cheating becomes measurable

---

## Cross-Cutting Constraints (from SUMMARY.md — non-negotiable roadmap constraints)

- **CC-01 (Brand-leak defense)**: Phase 0 must land pre-commit + CI grep gate; generic HTML from commit 1; fresh repo not this Disney dir. Non-recoverable if leaked to a public commit.
- **CC-02 (Video production track)**: One video per phase from Phase 0 through Phase 4 (parallel with mechanism build). Chapter markers can't be authored against placeholders.
- **CC-03 (Taxonomy client sign-off)**: Phase 3 entry is gated on client moderation lead signing off L2 wording.
- **CC-04 (3-rater kappa calibration)**: Phase 4 starts calibration; Phase 6 launch requires kappa ≥ 0.6 for all 5 videos + rubric sign-off.
- **CC-05 (CDN fallback pre-provisioned)**: Phase 0 provisions jsDelivr / R2; Phase 6 explicitly tests the swap.

---

## Open Decisions Requiring Client Input (Pre-Launch)

- **O-01**: V5 verdict interpretation — strict brand-safe (Decline) vs community-guideline-only (Approve). Answer key blocked without this.
- **O-02**: Formspree vs Google Sheets webhook — Sheets recommended pending volume confirmation.
- **O-03**: CDN choice — jsDelivr for MVP; R2 fallback if any clip > 50 MB.
- **O-04**: AI-generation provider ToS (Runway / Sora / Veo) — commercial-use verification per generation.
- **O-05**: Expected candidate volume — determines LFS math and CDN urgency.
- **O-06**: Random-5-of-N — bring forward from v2 if screen-record answer sharing is a real concern.
- **O-07**: Shareable URL / PDF export — v1 or v2?
- **O-08**: Confidence self-rating per video — v1 or v2?
- **O-09**: Anti-cheat additional signals — v1 or v2?
- **O-10**: Exact forbidden-strings list for pre-commit grep gate (brand name + franchise names + character names).

---

## Traceability

_Requirements → Phases (populated by roadmapper 2026-07-07)_

| Phase | REQ-IDs |
|-------|---------|
| 0 — Foundations | DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09, BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BRAND-07, BRAND-08, CONTENT-01, CONTENT-04, CONTENT-07 |
| 1 — App Shell + One-Attempt | IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05, GUIDE-01, GUIDE-02, GUIDE-03, GUIDE-04, GUIDE-05, GUIDE-06, ATTEMPT-01, ATTEMPT-02, ATTEMPT-05 |
| 2 — Custom Video Player | PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07, PLAY-08, PLAY-09, PLAY-10, CONTENT-05, CONTENT-06 |
| 3 — Timer + Tagging + Verdict | TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, TIME-06, TIME-07, TIME-08, TAG-01, TAG-02, TAG-03, TAG-04, TAG-05, TAG-06, TAG-07, TAG-08, VERDICT-01, VERDICT-02, VERDICT-03, VERDICT-04 |
| 4 — Scoring + Scoreboard | SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06, SCORE-07, SCORE-08, SCORE-09, BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06, BOARD-07, QUALITY-01, QUALITY-02, QUALITY-04 |
| 5 — Submission | SUBMIT-01, SUBMIT-02, SUBMIT-03, SUBMIT-04, SUBMIT-05, SUBMIT-06, SUBMIT-07, SUBMIT-08, SUBMIT-09, SUBMIT-10, ATTEMPT-03, ATTEMPT-04 |
| 6 — Polish + Content Freeze + Launch | CONTENT-02, CONTENT-03, CONTENT-08, CONTENT-09, CONTENT-10, CONTENT-11, QUALITY-03, QUALITY-05, QUALITY-06 |

**Coverage**: 106 / 106 v1 REQ-IDs mapped (100%). No orphans. No duplicates.

**Coverage-check note on CONTENT-01**: The `taxonomy.json` schema + initial content lock is delivered in Phase 0; the L2 wording is subject to client sign-off (CC-03) which is a Phase 3 entry gate. CONTENT-01 belongs to Phase 0 as the delivered artifact; the sign-off gate is enforced at Phase 3 without a separate REQ.

---

*Last updated: 2026-07-07 — traceability populated by roadmapper*
