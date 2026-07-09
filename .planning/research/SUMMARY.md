# Research Synthesis — Content Moderation Assessment

**Synthesized:** 2026-07-07
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall confidence:** HIGH on stack + architecture + hiring-UX patterns; MEDIUM on exact platform L2 policy wording (needs client re-validation before launch); HIGH on the six critical failure modes and their mitigations.

---

## TL;DR (What the Roadmapper Needs to Know)

- **Product shape:** zero-backend static React SPA; screen state machine (LANDING → GUIDELINES → RUNNER → SCOREBOARD → SUBMIT_DONE); 5 videos × 3-min timer; L1/L2 tagging + Approve/Decline verdict; flagmail1-style scoreboard. GitHub Pages + Git LFS + Google Apps Script webhook.
- **Stack is locked and low-risk:** React 19.2 + Vite 8 + `media-chrome@4.19.2` + GSAP 3.15 + `@lottiefiles/dotlottie-react` + `zustand@5` (timer-slice only) + hook composition for everything else. All versions verified against npm registry 2026-07-07.
- **State-management conflict resolved:** hybrid — hook composition (mirrors flagmail1) is the default; Zustand carries **only the timer tick** so the per-second re-render doesn't cascade through the player and tag panel.
- **Player conflict resolved:** `media-chrome@^4.19.2` is the pick. ARCHITECTURE.md's `VideoPlayer` component boundaries hold verbatim — media-chrome is the implementation detail inside `VideoPlayer.jsx`, not a change to the component tree.
- **Phase numbering conflict resolved:** canonical 7-phase list (Phase 0 Foundations + 6 build phases).
- **Five cross-cutting concerns are non-negotiable roadmap constraints** (brand-leak defense, video production track, taxonomy client sign-off, 3-rater kappa calibration, CDN fallback pre-provisioning).
- **LFS bandwidth is the #1 architectural risk.** Free tier is **10 GiB/month**. At 250 MB/session that's ~40 sessions/month before LFS silently disables account-wide. jsDelivr proxy or Cloudflare R2 mirror MUST be pre-provisioned before first hiring cycle.
- **Brand-name leak is repo-lifetime irreversible.** Once a public commit exists, `git filter-repo` alone cannot fully purge (forks/caches persist). Pre-commit hook + CI grep gate MUST be commit-1 infrastructure.
- **Answer-key defensibility requires 3 raters, kappa ≥ 0.6, client sign-off.** Single-author keys cannot survive a rejected-candidate appeal. Pre-launch gate.
- **Ship the vertical slice first, videos last.** Stub content while the mechanism (player + timer + tagging + scoring + submission) hardens; drop final 5 videos in Phase 6.

---

## Locked Stack (Pinned Versions from STACK.md)

All versions verified on npm registry 2026-07-07.

| Layer | Package | Version | Notes |
|-------|---------|---------|-------|
| Framework | `react` / `react-dom` | `^19.2.0` | Matches flagmail1 |
| Build | `vite` | `^8.1.0` | Bump from flagmail1's v7 |
| Build | `@vitejs/plugin-react` | `^6.0.0` | SWC fast refresh |
| Video Player | `media-chrome` | `^4.19.2` | Mux-maintained; VTT chapters + hover thumbnails first-party |
| Animation | `gsap` | `^3.15.0` | Full plugin set now MIT-licensed |
| Animation | `@gsap/react` | `^2.1.2` | `useGSAP` — required for React 19 StrictMode |
| Animation | `@lottiefiles/dotlottie-react` | `^0.19.7` | Or keep `lottie-react@^2.4.1` if reusing flagmail1 JSON assets as-is |
| State (timer slice only) | `zustand` | `^5.0.14` | Selector-based subscriptions prevent every-second re-render cascade |
| Routing | (none) | — | Screen enum + conditional render. Do NOT add `react-router` |
| Forms | native `fetch` + `FormData` | built-in | Optional `@formspree/react@^3.0.0` |
| Testing | `vitest` / `@playwright/test` / `@testing-library/react` / `happy-dom` | `^4.1.10` / `^1.61.1` / `^16.3.0` / `^18.0.0` | Matches flagmail1 |
| Lint | `eslint` / `eslint-plugin-react-hooks` / `eslint-plugin-react-refresh` | `^9.39.1` / `^7.0.1` / `^0.4.24` | Flat config |
| CI | `actions/checkout@v6` (with `lfs: true`), `setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4` | | Do NOT use `peaceiris/actions-gh-pages` (legacy) |
| Hosting | GitHub Pages | — | `vite.config.js` `base: '/<repo>/'` |
| Storage | Git LFS | 3.x | Track `*.mp4`, `*.webm`, `*.lottie` |
| Video CDN (prod) | jsDelivr proxy of LFS OR Cloudflare R2 | — | **Must be pre-provisioned before first hiring cycle** |
| Backend | Google Sheets + Apps Script `doPost` | — | Preferred over Formspree (native dedup, higher quota) |

---

## Locked Taxonomy (L1 List)

10 policy areas synthesized from TikTok/YouTube/Meta/Twitch + GARM + DMCA/COPPA. L2 detail lives in FEATURES.md (defer L2 lock to REQUIREMENTS.md).

1. **Copyright & IP**
2. **Hate & Harassment**
3. **Violence & Graphic Content**
4. **Sexual & Nudity**
5. **Minor Safety** (CSAM zero-tolerance)
6. **Regulated Goods & Activities**
7. **Misinformation & Deceptive Sync**
8. **Spam & Manipulation**
9. **Brand Safety (GARM)**
10. **Community Standards (Platform-Specific)**

Confidence: HIGH on L1 structure; MEDIUM on exact L2 wording (platforms rename quarterly). **Client validation of L2 wording is a Phase 3 gate.**

---

## Resolved Conflicts

### Conflict 1: State Management — Zustand vs. Hook Composition

**STACK.md said:** `zustand@^5` for global state (timer ticks every second; Context re-renders every consumer).
**ARCHITECTURE.md said:** Hook composition (`useAssessmentState`/`useVideoAnswer`/`useScoring`/`useTimer`) with NO Zustand (mirror flagmail1).

**Resolution — HYBRID:**
- **Default = hook composition** (matches ARCHITECTURE and flagmail1). `useAssessmentState` owns screen/identity/currentVideoIndex/answers[]. `useVideoAnswer` is a `useReducer` for one video's L1/L2/verdict state. `useScoring` is pure rubric math. `useOneAttemptGuard` wraps localStorage.
- **Zustand carries the timer tick ONLY** — a single `useTimerStore` slice exposes `remainingMs` and `phase` (`green|amber|red`). Consumers use selector subscriptions so the per-second update does NOT re-render `VideoPlayer` (would otherwise reconcile ~180 times over a 3-min video).
- Preserves manager-accepted mental model AND surgically prevents the re-render cascade both researchers agreed was the real risk. ~40 lines of Zustand total.
- **Do NOT** put identity/answers/scoring in Zustand — they don't tick.

Roadmapper implication: **Phase 1** builds `useAssessmentState`, `useOneAttemptGuard`, screen enum. **Phase 3** adds the Zustand timer slice with `useTimer` composed on top.

### Conflict 2: Video Player Library

**STACK.md said:** `media-chrome@^4.19.2`. **ARCHITECTURE.md said:** player-agnostic `VideoPlayer`/`SeekBar`/`ChapterMarker`/`HoverThumbnail` subtree.

**Resolution — ENDORSE media-chrome; ARCHITECTURE boundaries hold:**
- `player/` subtree is unchanged in shape — it composes media-chrome's React exports (`<MediaController>`, `<MediaControlBar>`, `<MediaTimeRange>`, `<MediaPlayButton>`) rather than hand-rolled controls.
- `SeekBar.jsx` becomes `<MediaTimeRange>` with chapter/thumbnail `<track>` children.
- `ChapterMarker.jsx` disappears (declarative `<track kind="chapters">` VTT).
- `HoverThumbnail.jsx` disappears (`<track kind="metadata" label="thumbnails">` handles it).
- ffmpeg sprite-generation script still runs; its output feeds a WebVTT file consumed by media-chrome.
- All other ARCHITECTURE patterns (ground-truth compiled into bundle, timer-on-`canplaythrough`, one-attempt guard, screen state machine) remain valid.

Roadmapper implication: **Phase 2** installs media-chrome, wires ffmpeg sprite/VTT pipeline, ships one test video end-to-end.

### Conflict 3: Phase Numbering (Canonical Reconciliation)

**ARCHITECTURE.md's 6 phases** starting at Phase 1: Foundations → Player → Tagging+Timer → Scoring+Scoreboard → Submission → Polish.
**FEATURES.md's 6 phases** starting with taxonomy: Taxonomy → Videos → Player+Timer+Tag → Scoring → Submission → Polish.
**PITFALLS.md** references a **"Phase 0 Foundations"** that must land before commit 1.

**Resolution — 7 canonical phases (Phase 0 + 6 build phases).** FEATURES's "Taxonomy" concern becomes a Phase 0 gate. FEATURES's "Videos" phase becomes a **parallel track from Day 1**. ARCHITECTURE's ordering is the correct mechanism build order and is preserved as Phases 1–6.

---

## Canonical Phase List

| # | Phase | Goal (1-line) | Parallel Tracks |
|---|-------|---------------|-----------------|
| **0** | **Foundations (Repo + Anti-Leak + Infra Gates)** | Fresh repo with generic name; pre-commit + CI brand-name grep gate; LFS budget math + jsDelivr/R2 CDN provisioned; taxonomy schema locked; Vite scaffold; deploy pipeline green with placeholder | Video sourcing kickoff (V1 CC0 clip + license doc) |
| **1** | **App Shell + One-Attempt Gate** | `App.jsx` screen enum; `LandingScreen` (name+email); `useAssessmentState`; `useOneAttemptGuard`; `GuidelinesScreen` skeleton; deploys end-to-end to Pages | V2 sourcing draft |
| **2** | **Custom Video Player (media-chrome)** | Install media-chrome; wire one MP4 via LFS; ffmpeg sprite + VTT thumb + VTT chapters pipeline; `VideoPlayer` wrapper; `canplaythrough`-anchored ready state; verify autoplay-blocked fallback; test Safari seek accuracy | V3 sourcing draft |
| **3** | **Timer + L1/L2 Tagging + Verdict** | Zustand timer slice; `useTimer` composed on top; `TagPanel` with multi-select L1 + dependent L2 (`useReducer`); Approve/Decline verdict; auto-submit on timeout; taxonomy.json; **taxonomy client sign-off gate** | V4 sourcing draft |
| **4** | **Scoring + Scoreboard (flagmail1 parity)** | `utils/scoring.js` rubric (50/25/25 with partial credit); `useScoring`; `ScoreboardScreen`; `CategoryAccuracy`; `CompetencyBadge`; lazy Lottie milestones; answerKeys.json bundled; **3-rater kappa calibration begins** | V5 sourcing draft (deliberate-ambiguity clip) |
| **5** | **Submission + One-Attempt Defense in Depth** | Google Apps Script `doPost` deployed; HMAC token + origin check + rate limit; SHA-256 email dedup on server; retry/backoff; `SubmitDoneScreen`; localStorage flag on 200; Formspree fallback wired | Content finalization; overlay production |
| **6** | **Polish, Content Freeze & Launch Gates** | GSAP transitions (`useGSAP` scope); final 5 videos + sprites + VTT + answer keys committed; **kappa ≥ 0.6 verified**; **client taxonomy + answer-key sign-off**; **CDN fallback tested (one-line JSON swap)**; browser matrix; accessibility pass; brand-leak final audit; PII grep of git log | Legal review of all 5 video licenses |

Build-order rationale: player is highest-risk custom component → de-risk after foundations; scoring is highest-testability (pure functions) → build once inputs stabilize in Phase 3; submission is highest-blocking-external → do last; content is cheapest to defer.

---

## Critical Cross-Cutting Concerns (Flagged for Roadmap)

### Concern 1: Brand-Name Leak (Repo-Lifetime Blocker) — Phase 0 landing
Once client brand hits public git history, `git filter-repo` alone cannot fully purge (forks/caches persist). Recovery = delete-and-recreate + GitHub Support to purge refs. **Phase 0 must ship:** pre-commit hook grep, CI grep gate, generic HTML from commit 1, fresh directory + neutral repo name, `.planning/` gitignored or split, non-client-linked author identity.

### Concern 2: Video Production — Parallel Track from Day 1 — Phases 0–6
Chapter markers, VTT files, sprite sheets, and answer keys cannot be authored against placeholders. One video per phase (V1 in Phase 0 through V5 in Phase 4). Overlay tools chosen in Phase 0 (ffmpeg `drawtext` preferred — scriptable). Per-video documentation shipped alongside (source URL, license, model-release status, target L1/L2, correct-verdict rationale). V5 is the deliberately ambiguous clean-but-brand-adjacent clip (highest-signal for hiring; requires client decision).

### Concern 3: Taxonomy Client Sign-Off — Gate Before Phase 3
Phase 0 locks the taxonomy JSON SCHEMA. Phase 3 entry is gated on client's moderation lead reviewing L2 wording against currently-published guidelines and signing off. Any L2 the client disagrees with is renamed OR dropped from scoring (accepted as ungraded). `answerKeyVersion` field on every submission.

### Concern 4: 3-Rater Ground-Truth Calibration — Gate Before Deploy
Single-author keys are undefendable in appeals. **Phase 4 begins** 3 independent raters tagging each of 5 videos blindly; compute Cohen's kappa (2) or Fleiss' kappa (3+) per L1. Ship only videos with L1 kappa ≥ 0.6. Tie-breaker rule picked BEFORE seeing candidate data (proposed: union of L1 tags accepted; L2 scored on any-one-match). Rubric written into GuidelinesScreen. V5 documented explicitly as "both Approve and Decline accepted per client tolerance." **Phase 6 launch requires kappa ≥ 0.6 for all 5 videos + client sign-off on rubric.**

### Concern 5: CDN Fallback Pre-Provisioning — Gate Before Launch
GitHub Free LFS bandwidth is 10 GiB/month. At 250 MB/session = ~40 sessions before LFS silently disables account-wide. **Phase 0 provisions** jsDelivr proxy URLs OR Cloudflare R2 bucket. Video JSON supports env-conditional `VIDEO_BASE_URL`. Aggressive re-encode (H.264 720p, CRF 26, AAC 96 kbps, `-movflags +faststart`) targeting ≤ 20 MB per 60–90s clip. GitHub billing spending cap = $0. `actions/checkout@v6` uses `lfs: true` for deploy job. **Phase 6 tests the CDN swap explicitly.**

---

## Open Decisions Still Requiring Client Input

1. **V5 verdict interpretation** — Approve (community-guideline strict) or Decline (brand-safety strict)? Answer keys blocked without this.
2. **Formspree vs. Google Sheets webhook** — Sheets recommended; confirm expected candidate volume.
3. **CDN choice — jsDelivr vs. Cloudflare R2** — jsDelivr for MVP; R2 fallback if any clip > 50 MB.
4. **AI-generation provider ToS** — Runway Gen-3 vs. Sora vs. Veo — verify commercial-use terms per generation; document in-repo.
5. **Expected candidate volume** — determines LFS math and CDN swap urgency.
6. **Random-5-of-N** — bring forward from v1.1 if screen-record leak is a real concern.
7. **Recruiter-facing shareable URL / PDF export** — v1 or v1.1?
8. **Confidence self-rating per video** — v1 or v1.1?
9. **Anti-cheat signals** — v1 or v1.1?
10. **Explicit forbidden-strings list** for Phase 0 pre-commit grep (brand name + franchise names + character names).

---

## Confidence Level Overall

**HIGH** on stack, architecture, and the six critical failure modes. **MEDIUM** on exact L2 policy wording (client re-validation gated in Phase 3) and Formspree's exact current free-tier cap. All version numbers verified against npm registry on 2026-07-07.

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (versions, media-chrome capabilities) | HIGH | npm + Context7 verified 2026-07-07 |
| Architecture (state machine, hook composition, LFS pipeline) | HIGH | Grounded in flagmail1 code inspection |
| Features (hiring-UX patterns) | HIGH | Karat/Codility/HackerRank + flagmail1 scoreboard |
| Taxonomy L1 structure | HIGH | Cross-referenced 5 platforms + GARM + DMCA/COPPA |
| Taxonomy L2 exact wording | MEDIUM | Platforms rename quarterly; WebSearch/WebFetch denied |
| Pitfalls (LFS, autoplay, brand-leak recovery, kappa) | HIGH | Primary sources via Context7 |
| Formspree free-tier cap | MEDIUM | "50/mo" not primary-sourced; verify at signup |
| Video-sourcing legal claims (overlay-on-CC0, AI-gen) | MEDIUM | Categorical CSAM/deepfake lines are HIGH; overlay approach needs client counsel sign-off |
| Apps Script quota | MEDIUM | Verify current published quotas before promising volume |

---

## Sources (Aggregated)

- **Reference implementation:** `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1`
- **Context7:** `/muxinc/media-chrome`, `/sampotts/plyr`, `/videojs/v10`, `/vidstack/player`, `/pmndrs/zustand`, `/remix-run/react-router`, `/formspree/formspree-js`, `/websites/github_en_actions`, `/greensock/react`, GitHub docs (LFS billing, Pages limits, removing sensitive data), Vite deploy docs, `cran.r-project.org/web/packages/irrCAC`
- **npm registry (2026-07-07)** — version verification
- **Public policy hubs:** TikTok, YouTube, Meta, Twitch community guidelines; GARM Brand Safety Framework
- **U.S. law:** DMCA 17 U.S.C. § 512; 18 U.S.C. § 2258A (CSAM); COPPA 15 U.S.C. §§ 6501–6506
- **Hiring norms:** Karat, Codility, HackerRank Certified public product pages
- **Project docs:** `.planning/PROJECT.md`

---

### Ready for Requirements

Content ready for REQUIREMENTS.md scoping and ROADMAP.md generation (7 phases: Phase 0 + Phases 1–6).
