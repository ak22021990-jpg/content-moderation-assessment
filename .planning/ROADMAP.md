# Roadmap — Content Moderation Assessment

**Version:** v1
**Created:** 2026-07-07
**Granularity:** standard
**Mode:** mvp
**Sources:** `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/research/SUMMARY.md` (canonical 7-phase list)
**Coverage:** 106 / 106 v1 REQ-IDs mapped (100%)

---

## Phases

- [x] **Phase 0: Foundations (Repo + Anti-Leak + Infra Gates)** — Fresh repo with generic name; pre-commit + CI brand-name grep gate; LFS budget math + CDN provisioned; taxonomy schema locked; deploy pipeline green with placeholder
- [x] **Phase 1: App Shell + One-Attempt Gate** — Screen enum; Landing (name+email); Guidelines skeleton; one-attempt localStorage guard; deploys end-to-end
- [x] **Phase 2: Custom Video Player (media-chrome)** — media-chrome wired; one MP4 via LFS end-to-end; ffmpeg sprite + WebVTT thumb + chapters pipeline; `canplaythrough`-anchored ready state
- [x] **Phase 3: Timer + L1/L2 Tagging + Verdict** — Zustand timer slice; 3:00 countdown with amber/red thresholds; multi-select L1 + dependent L2 tagging; Approve/Decline verdict; auto-submit on timeout; taxonomy client sign-off gate
- [ ] **Phase 4: Scoring + Scoreboard (flagmail1 parity)** — Rubric scoring (50/25/25 partial credit); per-L1 accuracy; competency title; Lottie milestones; 3-rater kappa calibration begins
- [ ] **Phase 5: Submission + One-Attempt Defense in Depth** — Google Apps Script `doPost` deployed; HMAC + origin check + rate limit; SHA-256 email dedup on server; retry/backoff; Formspree fallback wired
- [ ] **Phase 6: Polish, Content Freeze & Launch Gates** — Final 5 videos committed; GSAP transitions; kappa ≥ 0.6 verified; client taxonomy + answer-key sign-off; CDN swap tested; browser matrix; brand-leak final audit

---

## Phase Details

### Phase 0: Foundations (Repo + Anti-Leak + Infra Gates)

**Goal:** Fresh repo with generic name; pre-commit + CI brand-name grep gate; LFS budget math + jsDelivr/R2 CDN provisioned; taxonomy schema locked; Vite scaffold; deploy pipeline green with placeholder content — before any UI complexity is added.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09, BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BRAND-07, BRAND-08, CONTENT-01, CONTENT-04, CONTENT-07
**Success Criteria** (what must be TRUE):

  1. `git push` to the new public repo is blocked by pre-commit hook if any forbidden brand string (per `docs/brand-guardrails.md`) appears in staged files, and CI `brand-guard.yml` fails a PR on the same match
  2. GitHub Actions deploy workflow is green on an empty-shell commit; Pages serves a placeholder page at `https://<user>.github.io/<generic-repo>/` with generic HTML `<title>` / meta / OG tags
  3. `actions/checkout@v6` with `lfs: true` retrieves the seed MP4 as a real MP4 (verified by `file <video>.mp4 | grep MP4` CI step), not an LFS pointer
  4. `taxonomy.json` schema (10 L1 categories + L2 placeholders) is committed; Cloudflare R2 is documented as the production video CDN in `playlist.json` `_cdnDocs` (jsDelivr excluded — cannot serve LFS files); `playlist.json` `r2Url` field and R2 bucket setup instructions exist in `docs/video-manifest.md`
  5. GitHub billing spending cap is verified at $0; `docs/video-manifest.md` template exists and V1 (first sourced clip) is documented with source URL, license, target L1/L2, and rationale

**Plans:** TBD
**Notes / Cross-Cutting:**

  - **CC-01 (Brand-leak defense)** — LANDS HERE. Pre-commit + CI grep gate MUST be commit-1 infrastructure; leaks are repo-lifetime irreversible.
  - **CC-02 (Video production track)** — V1 CC0 clip + license doc sourced in parallel; overlay tooling (ffmpeg `drawtext`) chosen.
  - **CC-05 (CDN fallback pre-provisioned)** — jsDelivr proxy OR Cloudflare R2 mirror provisioned; `playlist.json` `srcUrl` is env-conditional (CONTENT-03 wiring lands in Phase 6, but the plumbing is stubbed here).

### Phase 1: App Shell + One-Attempt Gate

**Goal:** Users can land on the assessment, enter their name and email, read the full guidelines page, and are prevented from starting a second attempt from the same browser. Deploys end-to-end to Pages.
**Mode:** mvp
**Depends on:** Phase 0
**Requirements:** IDENT-01, IDENT-02, IDENT-03, IDENT-04, IDENT-05, GUIDE-01, GUIDE-02, GUIDE-03, GUIDE-04, GUIDE-05, GUIDE-06, ATTEMPT-01, ATTEMPT-02, ATTEMPT-05
**Success Criteria** (what must be TRUE):

  1. User can enter full name (required, ≤100 chars) and email (RFC-5322 basic validation) on the LandingScreen; "Start" is disabled until both pass validation
  2. User's identity persists across screen transitions (LANDING → GUIDELINES → RUNNER); refreshing the page mid-session does not lose name/email
  3. Guidelines screen renders all 10 L1 categories with definitions AND their L2 sub-categories with one concrete example each, sourced from `taxonomy.json` (no hard-coded category names in JSX)
  4. Guidelines screen explicitly discloses the one-attempt policy, the 3-minute per-video timer, the auto-submit-on-timeout behavior, and the Approve-vs-Decline + multi-tag rule; user can only advance by clicking "Begin Assessment"
  5. If `localStorage` contains the one-attempt flag on LandingScreen mount, the user sees an "already completed" screen and cannot start a second run

**Plans:** TBD
**UI hint:** yes
**Notes / Cross-Cutting:**

  - **CC-01 (Brand-leak defense)** — Ongoing: every commit passes through the Phase 0 pre-commit + CI grep gate. Landing / Guidelines copy MUST be generic ("Content Moderation Assessment"), no franchise/brand references.
  - **CC-02 (Video production track)** — V2 clip sourced in parallel with UI work.

### Phase 2: Custom Video Player (media-chrome)

**Goal:** Users see a single test video render via `media-chrome` with a fully working custom seek bar, hover thumbnail previews, chapter markers at author-defined suspicious moments, keyboard controls, and volume/mute — all loaded via Git LFS with a verifiable ready state.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07, PLAY-08, PLAY-09, PLAY-10, CONTENT-05, CONTENT-06
**Success Criteria** (what must be TRUE):

  1. One 60–120 s H.264 720p MP4 (served via LFS through GitHub Pages) plays in the browser with click-to-start (no autoplay), `playsinline`, and `preload="metadata"`; play/pause, volume, mute, current-time / total-duration all work
  2. Dragging the seek bar shows a WebVTT-driven thumbnail preview sprite at the hovered timestamp; author-defined chapter markers appear at the correct offsets on the seek bar (both driven by declarative `<track>` children of `<MediaController>`)
  3. `scripts/generate-sprites.mjs` (ffmpeg at build time) produces `sprite.jpg` + `thumbs.vtt` + `chapters.vtt` for the test video and is wired into CI; assets are LFS-tracked per `.gitattributes`
  4. The player reports `canplaythrough` before any timer would start (event exposed to parent so Phase 3 timer can subscribe); a `canplaythrough` handler placeholder is instrumented
  5. Keyboard controls work: space = play/pause, arrows = ±5 s seek, M = mute; verified in Chrome, Edge, Safari, Firefox latest

**Plans:** TBD
**UI hint:** yes
**Notes / Cross-Cutting:**

  - **CC-02 (Video production track)** — V3 clip sourced in parallel; chapter authoring against the V2 clip validates the workflow.
  - **CC-05 (CDN fallback)** — `playlist.json` `srcUrl` continues to be env-conditional; Phase 6 will test the LFS→CDN swap.

### Phase 3: Timer + L1/L2 Tagging + Verdict

**Goal:** Users watch each video under a visible 3-minute countdown, tag it with multi-select L1 + dependent L2 categories, and submit an Approve or Decline verdict — with auto-submit on timeout. Client moderation lead signs off L2 taxonomy wording before this phase closes.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, TIME-06, TIME-07, TIME-08, TAG-01, TAG-02, TAG-03, TAG-04, TAG-05, TAG-06, TAG-07, TAG-08, VERDICT-01, VERDICT-02, VERDICT-03, VERDICT-04
**Success Criteria** (what must be TRUE):

  1. 3:00 countdown starts on the video's `playing` event (NOT on screen mount), uses `performance.now()` deltas anchored to a wall-clock start, persists to `sessionStorage`, survives a page refresh mid-video (resumes at correct remaining time), and turns amber at 60 s / red at 15 s
  2. At 0:00 the current video auto-submits with whatever tags/verdict the user had selected; pausing the video does NOT pause the timer (documented in Guidelines)
  3. TagPanel renders L1 as a multi-select from `taxonomy.json`; selecting an L1 reveals its L2 sub-categories which can also be multi-selected; L2 selection is scoped to its parent L1 (cannot pick an L2 without its L1); deselecting is possible at any time before verdict submission
  4. Approve and Decline buttons are visible and clearly labeled; clicking either records the verdict AND advances to the next video; user cannot go back and edit a video's answers once verdict is recorded; zero-L1-selected + Approve is a valid submission
   5. Zustand timer slice with selector subscriptions is measurably preventing per-second re-renders of `VideoPlayer` and `TagPanel` (verified via React DevTools profiler on a 3-min run: player renders ≤ 5 times, tag panel renders only on user interaction)

**Plans:** 4/4 plans executed

Plans:

- [x] 03-01-PLAN.md — Zustand Timer Store + Persistence (TIME-01..08): install zustand, RAF+performance.now() timer slice, sessionStorage persistence, CountdownDisplay, amber/red thresholds, auto-submit on expiry
- [x] 03-02-PLAN.md — TagPanel Component + L1/L2 Cascade (TAG-01..08): data-driven multi-select L1 chips, dependent L2 reveal, useReducer cascade logic, keyboard accessibility
- [x] 03-03-PLAN.md — Verdict Buttons + RunnerScreen (VERDICT-01..04): Approve/Decline with double-click guard, multi-video loop, key-on-index remount, ProgressIndicator, side-by-side layout
- [x] 03-04-PLAN.md — Integration + Playlist Expansion: wire RunnerScreen into App.jsx, onPlaying timer start, playlist.json → 5 videos, scoreboard stub, integration test update, human-verify checkpoint

**UI hint:** yes
**Notes / Cross-Cutting:**

  - **CC-03 (Taxonomy client sign-off)** — GATE: Phase 3 cannot close until the client moderation lead reviews L2 wording against currently-published guidelines and signs off. Disagreed L2s are renamed or dropped from scoring (ungraded).
  - **CC-02 (Video production track)** — V4 clip sourced in parallel.

### Phase 4: Scoring + Scoreboard (flagmail1 parity)

**Goal:** Users completing all 5 videos see a scoreboard modeled on flagmail1: overall score %, per-L1 accuracy breakdown, competency title (Advanced / Proficient / Foundation), strengths/weaknesses paragraph, time-to-complete, per-video summary, and a Lottie milestone celebration on qualifying scores. Three independent raters begin kappa calibration on the 5 videos.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06, SCORE-07, SCORE-08, SCORE-09, BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06, BOARD-07, QUALITY-01, QUALITY-02, QUALITY-04
**Success Criteria** (what must be TRUE):

  1. `utils/scoring.js` is a pure module (no React deps) that computes per-video 100-point rubric (verdict = 50, L1 = 25 set-based partial credit `|user ∩ answer| / |answer|` × 25, L2 = 25 any-one-match per L1); Vitest unit tests cover all edge cases (empty tags, super-set, sub-set, disjoint, exact match, mixed)
  2. ScoreboardScreen renders overall score % prominently, per-L1 accuracy as a bar chart / row-per-L1, competency title + a 1–2 sentence strengths/weaknesses paragraph (reusing flagmail1's `generateCompetency` pattern), and a per-video summary (verdict correct? L1 matched? L2 matched?) WITHOUT revealing full answer keys
  3. `answerKeys.json` is bundled inside the JS build (not `public/`) and every submission carries an `answerKeyVersion` string; tie-breaker rule (union L1 / any-one-match L2) is committed to `docs/scoring-rubric.md` BEFORE any candidate data is collected
  4. Lottie milestone animations (PERFECT_EYE / SNIPER / ON_FIRE / ZONE_CLEAR / etc.) are lazy-loaded on demand (dynamic import, not eager) and fire on qualifying score thresholds
  5. Three independent raters have tagged each of the 5 videos blindly; Cohen (2 raters) or Fleiss (3+) kappa per L1 is computed and stored in `docs/kappa-calibration.md`; videos below kappa 0.6 are flagged for re-authoring in Phase 6

**Plans:** 2/5 plans executed

Plans:

- [x] 04-01-PLAN.md — Wave 0: Store Timing Backfill (pre-requisite — add videoId/timeSpentMs/timedOut/submittedAt to commitAnswer)
- [x] 04-02-PLAN.md — Wave 1: Scoring Engine (SCORE-01..05,07,09 — pure functions + exhaustive unit tests)
- [x] 04-03-PLAN.md — Wave 1: Competency Module + answerKeys + Rubric Doc (SCORE-06,08 + QUALITY-04)
- [ ] 04-04-PLAN.md — Wave 2: Scoreboard UI — Dependencies, Components, GSAP, Lottie (BOARD-01..07)
- [ ] 04-05-PLAN.md — Wave 3: App Integration + Answer Key Authoring + Kappa (QUALITY-01,02)

**UI hint:** yes
**Notes / Cross-Cutting:**

  - **CC-04 (3-rater kappa calibration)** — STARTS HERE. Phase 6 launch will be gated on kappa ≥ 0.6 for all 5 videos.
  - **CC-02 (Video production track)** — V5 (deliberately ambiguous clean-but-brand-adjacent clip) sourced in parallel; blocked on client decision O-01.

### Phase 5: Submission + One-Attempt Defense in Depth

**Goal:** On completion, a single JSON payload POSTs to a Google Apps Script `doPost` webhook with HMAC + origin + rate-limit + server-side SHA-256 email dedup; client retries with exponential backoff; candidate sees a thank-you screen; localStorage flag is set on success; a Formspree fallback endpoint is env-toggle ready.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** SUBMIT-01, SUBMIT-02, SUBMIT-03, SUBMIT-04, SUBMIT-05, SUBMIT-06, SUBMIT-07, SUBMIT-08, SUBMIT-09, SUBMIT-10, ATTEMPT-03, ATTEMPT-04
**Success Criteria** (what must be TRUE):

  1. Client POSTs a single JSON payload containing name, email, hashed-email-dedup-key, per-video answers (L1 set, L2 set, verdict, time-taken), overall score, per-L1 accuracy, competency title, `answerKeyVersion`, `taxonomyVersion`, session start/end timestamps, user-agent, screen resolution — verified end-to-end against a deployed Apps Script
  2. Apps Script `doPost` validates HMAC token against a shared secret, validates `Origin` header against the deployed Pages origin, rate-limits to 3 submissions/IP/min (configurable), and rejects duplicates by SHA-256 of normalized email (lowercase, strip `+` aliases and dots for Gmail-family, trim whitespace)
  3. On 5xx or network error, client retries with exponential backoff (3 attempts max); on final failure, user sees a "Please try again" screen with a manual retry button; on success, `{ok: true, id: <rowId>}` is returned and a Google Sheet row is written
  4. On backend 200, the one-attempt localStorage flag is written binding the assessment to that browser (paired with Phase 1's ATTEMPT-01/02 client-side guard)
  5. SubmitDoneScreen thanks the candidate and confirms results were sent; `@formspree/react` fallback endpoint is wired and env-toggle ready (disabled by default) so Apps Script quota exhaustion is a one-flag flip

**Plans:** TBD
**Notes / Cross-Cutting:**

  - **CC-01 (Brand-leak defense)** — Apps Script code and Sheet name are generic; secrets live in Apps Script Properties, never in the repo.

### Phase 6: Polish, Content Freeze & Launch Gates

**Goal:** All 5 real videos ship (kappa ≥ 0.6, client sign-off), GSAP transitions land, CDN fallback is tested via a one-line JSON swap, cross-browser matrix passes, brand-leak final audit is green, and the assessment is ready for the first hiring cycle.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** CONTENT-02, CONTENT-03, CONTENT-08, CONTENT-09, CONTENT-10, CONTENT-11, QUALITY-03, QUALITY-05, QUALITY-06
**Success Criteria** (what must be TRUE):

  1. All 5 videos (60–120 s, H.264 720p CRF 26, AAC 96 kbps, `-movflags +faststart`, ≤ 20 MB each) are committed with sprite/thumbs/chapters VTTs and answer keys; content mix spans copyright/watermark simulation, brand-safety edge case, benign, hate-speech overlay, and V5's deliberately ambiguous clean-but-brand-adjacent case (with O-01 resolved and documented)
  2. `playlist.json` `srcUrl` is env-conditional; swapping `VIDEO_BASE_URL` from LFS to jsDelivr (or R2) is a one-line config change verified end-to-end in a staging deploy; no client-brand IP appears in any filename, overlay, JSON key, CSS class, or Lottie name
  3. All 5 videos have L1 kappa ≥ 0.6 across 3 blind raters; client moderation lead has signed off `taxonomy.json` L2 wording AND per-video answer keys; `answerKeyVersion` is bumped on every post-launch edit
  4. GSAP transitions between screens use `useGSAP` with scope (React 19 StrictMode-safe); browser matrix (Chrome, Edge, Safari, Firefox latest) passes an end-to-end run of all 5 videos with correct scoring and successful submission
  5. Final brand-leak audit: full-repo `grep -riE` of the forbidden-strings list returns zero hits across code, HTML meta, package.json, commit log (`git log --all --format=%B`), workflow names, and repo settings

**Plans:** TBD
**UI hint:** yes
**Notes / Cross-Cutting:**

  - **CC-04 (3-rater kappa calibration)** — LAUNCH GATE. Videos below kappa 0.6 are re-authored, re-shot, or dropped from scoring before launch.
  - **CC-05 (CDN fallback pre-provisioned)** — LAUNCH GATE. Swap is explicitly tested in this phase.
  - **CC-03 (Taxonomy client sign-off)** — Final client sign-off on taxonomy L2 wording AND per-video answer keys.
  - **CC-01 (Brand-leak defense)** — Final full-history audit.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundations | 4/4 | Complete | 2026-07-08 |
| 1. App Shell + One-Attempt Gate | 4/4 | Complete | 2026-07-08 |
| 2. Custom Video Player | 4/4 | Complete | 2026-07-08 |
| 3. Timer + Tagging + Verdict | 4/4 | Complete | 2026-07-08 |
| 4. Scoring + Scoreboard | 2/5 | In Progress|  |
| 5. Submission + Defense in Depth | 0/? | Not started | — |
| 6. Polish + Content Freeze + Launch | 0/? | Not started | — |

---

## Cross-Cutting Concerns Map

| Concern | Lands In | Gated At | Notes |
|---------|----------|----------|-------|
| **CC-01** Brand-leak defense | Phase 0 | Phase 6 (final audit) | Pre-commit + CI grep gate is commit-1 infra; leaks are repo-lifetime irreversible |
| **CC-02** Video production parallel track | Phases 0–4 (one clip per phase) | Phase 6 | Chapter markers cannot be authored against placeholders |
| **CC-03** Taxonomy client sign-off | Phase 3 (L2 wording) | Phase 3 close + Phase 6 (final) | `taxonomyVersion` on every submission |
| **CC-04** 3-rater kappa calibration | Phase 4 (starts) | Phase 6 (kappa ≥ 0.6 for all 5) | Rubric committed BEFORE candidate data collected |
| **CC-05** CDN fallback pre-provisioned | Phase 0 (provision) | Phase 6 (swap tested) | jsDelivr proxy / R2 mirror; env-conditional `VIDEO_BASE_URL` |

---

## Coverage Verification

- **Total v1 REQ-IDs**: 106 (IDENT 5 + GUIDE 6 + PLAY 10 + TIME 8 + TAG 8 + VERDICT 4 + SCORE 9 + BOARD 7 + ATTEMPT 5 + SUBMIT 10 + CONTENT 11 + DEPLOY 9 + BRAND 8 + QUALITY 6)
- **Mapped**: 106 (100%)
- **Orphans**: 0
- **Duplicates**: 0

---

*Last updated: 2026-07-08 after Phase 3 completion*
