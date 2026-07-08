# Phase 6: Polish, Content Freeze & Launch Gates — Research

**Researched:** 2026-07-08
**Domain:** Content moderation assessment SPA — video production, GSAP transitions, launch gates, brand audit
**Confidence:** HIGH

## Summary

Phase 6 is the launch-gate phase: all 5 real videos must ship, GSAP screen transitions must land, CDN fallback must be tested, kappa ≥ 0.6 must be verified, client sign-off obtained, and a final brand-leak audit must pass with zero hits. This is the riskiest phase in the roadmap — most success criteria depend on human actions (3-rater kappa calibration, client sign-off, video production from AI/CC0 sources) rather than code changes alone.

**Current state:** Only 1 of 5 videos (v01.mp4) is a real asset. The other 4 (`v02`–`v05`) are placeholders all pointing to `v01.mp4`. GSAP 3.15 + `@gsap/react` 2.1.2 are installed but only used on ScoreboardScreen for section fade-ins — no screen-to-screen transitions exist. The brand guardrails document is comprehensive (55 forbidden strings across Disney/Marvel/Star Wars/Pixar/classic clusters) but the pre-commit hook and CI workflow referenced in the doc do not yet exist on disk. Kappa calibration is at PLAN stage with zero data collected. Answer keys are authored for all 5 videos but only v01 has a real video backing it; `answerKeyVersion` exists only at the top-level `"version"` field — individual answer keys lack per-video `answerKeyVersion` per QUALITY-06.

**Primary recommendation:** Phase 6 must be structured as two parallel tracks: (1) video production + kappa calibration + client sign-off (human-gated, weeks-long timeline), and (2) code polish (GSAP transitions, VIDEO_BASE_URL env wiring, brand-guard infrastructure, answerKeyVersion fix). The code track can complete independently; the launch cannot happen until the human track gates clear.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GSAP screen transitions | Browser / Client | — | All transitions are client-side React state changes animated with GSAP in the DOM |
| `VIDEO_BASE_URL` env routing | Build (Vite) | CDN / Static | `import.meta.env.VITE_VIDEO_BASE_URL` is statically replaced at build time; the CDN itself serves static assets |
| Brand-leak grep gate | Git hooks (pre-commit) | CI (GitHub Actions) | Pre-commit blocks local commits; CI blocks PR merge |
| Kappa computation | N/A (offline) | N/A | Done in Google Sheets + `src/utils/kappa.js` utility; not a runtime app feature |
| Answer key versioning | Bundled JS (src/) | — | `answerKeys.json` is bundled in the JS build, not served from `public/` |
| Video asset serving | CDN / Static | — | Videos served from GitHub Pages (LFS) or CDN; env-conditional URL routing happens at build time |

## Standard Stack

### Core (already installed; verified versions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.15.0 | Screen transitions, stagger animations | Industry-standard animation library; already installed |
| @gsap/react | 2.1.2 | React 19 StrictMode-safe GSAP hooks | Official GSAP React integration; `useGSAP` with `scope` prevents double-fires |
| Vite | 8.1.0 | Build tool, env variable handling | Already configured; `import.meta.env.VITE_*` pattern established for VIDEO_BASE_URL |

### Existing Infrastructure (no new packages needed)
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| ffmpeg | system | Sprite/VTT generation, video encoding | `scripts/generate-sprites.mjs` already exists; encoding spec in `docs/video-manifest.md` |
| Git LFS | repo-configured | Video file storage | `.gitattributes` tracks `*.mp4`, `*.webm`, `*.lottie`, `*.jpg` |
| Cloudflare R2 | provisioned | CDN fallback | Bucket documented in `docs/video-manifest.md`; `r2Url` field absent from current playlist.json |

### No New Packages Required
Phase 6 adds no new npm dependencies. All required tooling (GSAP, Vite env vars, ffmpeg) is already in place. This phase is about content creation, wiring, and quality gates — not library additions.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| gsap@3.15.0 | npm | ~10+ yrs | 2M+/wk | github.com/greensock/GSAP | OK | Already installed — no action |
| @gsap/react@2.1.2 | npm | ~2 yrs | 500K+/wk | github.com/greensock/react | OK | Already installed — no action |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** none
**Note:** Phase 6 adds zero new packages. All listed packages are already installed from prior phases.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTENT-02 | `playlist.json` describes each video with id, title, srcUrl, spriteUrl, thumbsVttUrl, chaptersVttUrl, durationSec, answerKey, answerKeyRationale | playlist.json structure exists; 4 of 5 entries are placeholders. Each video entry needs its own real MP4 + sprite + thumbs/chapters VTTs. |
| CONTENT-03 | `playlist.json` `srcUrl` is env-conditional (LFS → CDN swap) | Vite `import.meta.env.VITE_*` pattern already established (VITE_SUBMISSION_BACKEND, VITE_HMAC_SECRET). Add `VITE_VIDEO_BASE_URL` with relative fallback. |
| CONTENT-08 | Video content spans mix of violation types | v01 covers Copyright & IP (1) + Spam (8); answer keys define v02 (benign), v03 (Hate+Violence), v04 (Misinformation), v05 (Brand Safety). Actual video files for v02-v05 do not exist yet. |
| CONTENT-09 | Video sourcing follows Mix strategy (CC0 base + ffmpeg overlays, AI-gen, originally recorded) | Documented in `docs/video-manifest.md`. v02-v05 sourcing TBD — each needs CC0 base or AI-gen source per its violation type. |
| CONTENT-10 | No real client-brand IP in content | Brand guardrails document lists 55 forbidden strings. Each video overlay, watermark, and VTT text must be audited against this list. |
| CONTENT-11 | V5 is deliberately ambiguous "clean-but-brand-adjacent" edge case | V5 answer key is drafted with DECLINE verdict but marked "PENDING client decision O-01". This blocks launch — needs resolution. |
| QUALITY-03 | All 5 videos reach kappa ≥ 0.6 for L1 tags before launch | Kappa calibration doc is at PLAN stage. No raters identified, no data collected. This is the single highest-risk gate. |
| QUALITY-05 | Client moderation lead signs off taxonomy.json L2 wording + per-video answer keys | Answer keys drafted but marked "1.0.0-draft". `taxonomy.json` at "0.2.0-draft". Sign-off needed before launch. |
| QUALITY-06 | Answer keys have answerKeyVersion field; post-launch edits bump version | `answerKeys.json` has top-level `"version": "1.0.0-draft"` but individual video entries lack per-video `answerKeyVersion`. Must add per-video field. |

## Architecture Patterns

### Current Screen Architecture (No Transitions)
```
App.jsx
  └── switch(state.screen)
        ├── LANDING  → <LandingScreen/>
        ├── GUIDELINES → <GuidelinesScreen/>
        ├── RUNNER/ASSESSMENT → <RunnerScreen/>
        ├── SCOREBOARD → <ScoreboardScreen/>
        ├── SUBMIT_DONE → <SubmitDoneScreen/>
        └── ALREADY_COMPLETED → <AlreadyCompletedScreen/>
```

Screen changes are instant React re-renders. `useAssessmentState` provides `goToScreen(target)` which calls `setScreen(target)` — synchronous state update with zero transition animation.

### Recommended GSAP Transition Pattern
```
App.jsx (refactored)
  └── <div ref={containerRef}>
        {renderScreen()}  // current screen
      </div>

useGSAP(() => {
  // Animate IN: current screen fades/slides in
  gsap.from('.cma-screen', { opacity: 0, y: 30, duration: 0.4 })
}, { scope: containerRef, dependencies: [state.screen] })
```

The `dependencies: [state.screen]` option triggers the animation whenever `screen` changes. The `scope: containerRef` confines GSAP selectors to the app root. This pattern is validated by the existing ScoreboardScreen `useGSAP` usage (line 44-52) which uses the same `gsap.from` + stagger pattern.

### Screen Transition Data Flow
```
state.screen changes (via goToScreen)
  → App re-renders → new screen component mounts
  → useGSAP fires (triggered by dependencies: [state.screen])
  → gsap.from animates .cma-screen from 0 opacity / offset y → natural position
  → duration 0.3-0.4s with power2.out ease
```

### Per-Video answerKeyVersion Schema Addition
Current `answerKeys.json` structure:
```json
{
  "version": "1.0.0-draft",
  "videos": [
    { "id": "v01", "verdict": "DECLINE", ... }
  ]
}
```
Required per QUALITY-06:
```json
{
  "version": "1.0.0",
  "videos": [
    { "id": "v01", "verdict": "DECLINE", "answerKeyVersion": "1.0.0", ... }
  ]
}
```
Each video entry also needs `answerKeyRationale` per CONTENT-02 (currently only top-level `rationale` exists).

### VIDEO_BASE_URL Env-Conditional Pattern
Current `playlist.json` `srcUrl`:
```json
"srcUrl": "/videos/v01.mp4"
```
Proposed env-conditional pattern:
```json
// playlist.json — static fallback
"srcUrl": "/videos/v01.mp4",
"srcUrlBase": "VITE_VIDEO_BASE_URL"
```
Runtime resolution in component:
```javascript
const baseUrl = import.meta.env.VITE_VIDEO_BASE_URL || ''
const resolvedSrc = baseUrl ? `${baseUrl}${video.srcUrl}` : video.srcUrl
```
Set in `.env.production`:
```
VITE_VIDEO_BASE_URL=https://pub-<hash>.r2.dev
```
This makes CDN swap a one-line `.env` change with zero code modification to playlist.json entries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screen transition animations | Custom React animation hooks | GSAP + `@gsap/react` `useGSAP` with `scope` and `dependencies` | GSAP handles timing, easing, stagger, and React 19 StrictMode double-fire safety |
| Video encoding | Manual ffmpeg per video | `scripts/generate-sprites.mjs` (exists) extended for batch encoding | Consistent H.264 720p CRF 26 output; already integrated with CI |
| Brand-string scanning | Manual `grep` before commits | `.husky/pre-commit` + `.github/workflows/brand-guard.yml` | Automated gate prevents human error; scans staged diffs only |
| Kappa computation | Manual spreadsheet formula errors | `src/utils/kappa.js` (exists) — Cohen + Fleiss implementations | Pure-function implementations already tested; verifiable offline |
| CDN URL resolution | Conditional logic in every component | Single `getVideoUrl()` utility consuming `import.meta.env.VITE_VIDEO_BASE_URL` | One place to change; tree-shaken at build time |

**Key insight:** Every infrastructure piece Phase 6 needs already has a stub or utility in the codebase. The work is wiring + content creation + human gating, not building new mechanisms.

## Runtime State Inventory

> This is NOT a rename/refactor phase. No string replacement or migration. This section documents state that must be validated before launch, not state that needs changing.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — this is a read-only deployment of static assets | No migration needed |
| Live service config | Cloudflare R2 bucket must be provisioned with public access; Apps Script `doPost` already deployed | Verify R2 bucket contents match playlist.json entries |
| OS-registered state | None | N/A |
| Secrets/env vars | `.env` contains `VITE_HMAC_SECRET`, `VITE_APPS_SCRIPT_URL`, `VITE_SUBMISSION_BACKEND` — these pre-date Phase 6 | Add `VITE_VIDEO_BASE_URL` to `.env.production` and `.env.example` |
| Build artifacts | `dist/` contains previous build output; stale after any Phase 6 changes | `npm run build` will regenerate |

## Common Pitfalls

### Pitfall 1: Video Placeholder Deception (CRITICAL)
**What goes wrong:** `playlist.json` has 5 entries but 4 point to `v01.mp4`. A developer running the app sees 5 videos playing and assumes content is complete. Only by inspecting `public/videos/` does the placeholder status become obvious.
**Why it happens:** Placeholder entries added in Phase 3 to test multi-video flow without waiting for content.
**How to avoid:** Add a `_status: "real"` vs `_status: "placeholder"` field to each playlist entry. CI step checks that all entries have `_status: "real"` before allowing deploy to production.
**Warning signs:** `ls public/videos/` shows fewer files than `playlist.json` entries.

### Pitfall 2: GSAP Double-Fire in React StrictMode
**What goes wrong:** In development (StrictMode), `useGSAP` callbacks fire twice. Without `scope`, selectors may target wrong elements or animations may overlap.
**Why it happens:** React 19 StrictMode double-mounts components in development.
**How to avoid:** Always use `useGSAP(() => { ... }, { scope: containerRef })` pattern. The `scope` confines GSAP to that container's DOM subtree. This is the exact pattern already verified on ScoreboardScreen (line 44-52).
**Warning signs:** Animations stutter, elements animate from wrong positions, or console shows "GSAP target not found" warnings.

### Pitfall 3: Kappa Calibration is a Human Gate, Not Code
**What goes wrong:** Assuming kappa ≥ 0.6 will be achieved assumes agreement among raters. In practice, ambiguous categories (Brand Safety, Misinformation) may yield κ < 0.6, requiring video or answer key re-authoring.
**Why it happens:** The assessment deliberately includes edge cases (v05 is "deliberately ambiguous" per CONTENT-11). Raters will disagree on ambiguity by design.
**How to avoid:** Run a pilot kappa round with 2 raters on v01 (highest confidence) first. If κ < 0.6 on the easiest video, rubric or answer key definitions need tightening before rating all 5.
**Warning signs:** Any rater asks "what exactly counts as [category]?" — taxonomy definitions need clarity.

### Pitfall 4: Brand Leak from Video Content Itself
**What goes wrong:** The pre-commit grep gate scans text files, not binary video content. An AI-generated overlay or spoken word in a video could contain a forbidden brand string that no grep will catch.
**Why it happens:** Video content is opaque to text-based grep.
**How to avoid:** Manual review of each video's visible overlays, spoken text, and chapter VTT labels against the full forbidden-strings list. Add a `video-brand-audit.md` checklist.
**Warning signs:** Any video uses a well-known brand color scheme, logo silhouette, or audio jingle.

### Pitfall 5: answerKeyVersion Missing from Individual Keys
**What goes wrong:** The current `answerKeys.json` has a top-level `"version": "1.0.0-draft"` but individual `videos[]` entries lack `answerKeyVersion`. Post-launch, if one answer key changes (e.g., v05 after O-01 resolution), the version bump doesn't identify which key changed.
**Why it happens:** QUALITY-06 requires `answerKeyVersion` on answer keys, but the current schema only has `version` at root. The scoring engine reads `answerKeys.version` for the submission payload (ScoringScreen line 86).
**How to avoid:** Add `answerKeyVersion` to each `videos[]` entry matching the root `version`. The scoring engine's `answerKeyVersion` in submissions should report the root version (which bumps when any key changes). Per-video versions enable granular tracking.

## Code Examples

### GSAP Screen Transition in App.jsx
```javascript
// Source: existing ScoreboardScreen pattern (line 44-52) + GSAP React docs
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export default function App() {
  const containerRef = useRef(null)
  const state = useAssessmentState()

  useGSAP(() => {
    // Animate current screen in on every screen change
    gsap.from('.cma-screen', {
      opacity: 0,
      y: 20,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, { scope: containerRef, dependencies: [state.screen] })

  return (
    <div ref={containerRef}>
      {renderScreen()}
    </div>
  )
}
```

### Vite Env-Conditional Video URL Resolution
```javascript
// Source: Vite docs env-and-mode + existing VITE_SUBMISSION_BACKEND pattern (submission.js line 13)
// New file: src/utils/videoUrl.js
const BASE_URL = import.meta.env.VITE_VIDEO_BASE_URL || ''

export function resolveVideoUrl(relativePath) {
  if (!BASE_URL) return relativePath
  // Ensure no double-slash when joining
  const base = BASE_URL.replace(/\/+$/, '')
  const path = relativePath.replace(/^\/+/, '')
  return `${base}/${path}`
}
```

### Per-Video answerKeyVersion Schema
```json
// Source: QUALITY-06 + existing answerKeys.json structure
{
  "version": "1.0.0",
  "_note": "version bumps when ANY answer key changes. Per-video answerKeyVersion tracks individual edits.",
  "videos": [
    {
      "id": "v01",
      "answerKeyVersion": "1.0.0",
      "verdict": "DECLINE",
      "l1Tags": ["1", "8"],
      "l2Tags": ["1.4", "1.6", "8.3"],
      "answerKeyRationale": "Visible trademark/logo infringement..."
    }
  ]
}
```

### Pre-commit Brand Guard Hook
```bash
#!/bin/sh
# Source: docs/brand-guardrails.md grep pattern (line 87-89)
# Place at: .husky/pre-commit
PATTERN='disney|disney\+|marvel|spider-man|spiderman|avengers|iron man|ironman|captain america|\bthor\b|black panther|hulk|wolverine|x-men|star wars|starwars|luke skywalker|darth vader|mandalorian|jedi|sith|han solo|chewbacca|yoda|lightsaber|pixar|toy story|toystory|finding nemo|wall-e|walle|\bcoco\b|buzz lightyear|woody|incredibles|mickey mouse|minnie mouse|\bfrozen\b|moana|encanto|elsa|anna|simba|lion king|cinderella|snow white|hulu|espn\+'

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -v -E '(docs/brand-guardrails\.md|\.github/workflows/brand-guard\.yml|\.husky/pre-commit|package-lock\.json|\.planning/)' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

MATCHES=$(echo "$STAGED_FILES" | xargs grep -liE "$PATTERN" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "BRAND GUARD FAILED: Forbidden brand strings found in:"
  echo "$MATCHES"
  echo "See docs/brand-guardrails.md for the full list."
  exit 1
fi
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Screen switches via `setScreen()` with no animation | `useGSAP` with `dependencies: [screen]` triggers transition on state change | Phase 6 | Smoother UX; candidates perceive higher production quality |
| Relative video paths hardcoded in playlist.json | `import.meta.env.VITE_VIDEO_BASE_URL` prefix resolved at build time | Phase 6 | One-line CDN swap; no code changes needed for LFS → R2 migration |
| Per-video answer keys lack individual version field | `answerKeyVersion` added to each `videos[]` entry | Phase 6 | Granular tracking of which keys changed post-launch |
| No automated brand guard (doc only) | `.husky/pre-commit` + `.github/workflows/brand-guard.yml` implemented | Phase 6 | Prevents accidental brand leaks in future commits |

**Deprecated/outdated:**
- The `_cdnDocs` note in playlist.json mentioning the Phase 6 env-conditional wiring is now obsolete — this phase implements it.
- Placeholder `_status` entries (v02-v05) must be removed or marked `"real"` before production deploy.
- The `_note` in answerKeys.json saying "all keys will be refined after kappa calibration" must be replaced with actual calibrated values.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudflare R2 bucket is provisioned and the r2.dev public URL is known | CDN Fallback | Cannot test CDN swap; launch blocked on bucket setup |
| A2 | 3 independent raters can be identified and will complete tagging within Phase 6 timeline | Kappa Calibration | Launch permanently blocked — kappa ≥ 0.6 is non-negotiable per CC-04 |
| A3 | Client moderation lead is available to sign off taxonomy L2 wording + answer keys | Client Sign-Off | Launch blocked on QUALITY-05; assessment cannot ship with draft answer keys |
| A4 | Open decision O-01 (v05 verdict: strict brand-safe vs community-guideline-only) resolves before answer key finalization | V5 Answer Key | v05 remains "PENDING" and cannot be scored; either drops to 4 videos or blocks launch |
| A5 | AI-generated video content (Runway/Sora/Veo) for v03 and v05 can be produced within project timeline and budget | Video Production | Video gaps force placeholder videos into production; assessment is invalid |
| A6 | The 55-string forbidden list in `docs/brand-guardrails.md` is the definitive set (matches O-10 resolution) | Brand Audit | Incomplete pattern misses brand leaks; audit passes but leaks still exist |
| A7 | GitHub Pages with LFS can serve all 5 videos without hitting bandwidth/storage limits | Deployment | May need CDN swap sooner than planned; LFS quota exhaustion is a silent failure mode |

## Open Questions

1. **O-01: V5 verdict interpretation**
   - What we know: Answer key drafted as DECLINE (strict brand-safe), but marked "PENDING client decision." The video is a music video with imagery stylistically similar to extremist symbols — no actual hate speech or policy violation.
   - What's unclear: Client's risk tolerance. Strict interpretation = DECLINE (brands don't want adjacency). Community-guideline-only = APPROVE (no policy violation, purely brand sensitivity).
   - Recommendation: Force resolution before any v05 video production begins. If unresolved at launch, v05 is dropped from scoring (assessment becomes 4-video).

2. **O-05: Expected candidate volume**
   - What we know: Informs LFS math and CDN urgency. No volume estimate exists.
   - What's unclear: Whether GitHub LFS bandwidth (1 GB/month free) is sufficient for the expected candidate count. Each full assessment serves ~100 MB of video. At 1 GB/month, that's ~10 candidates/month.
   - Recommendation: If > 10 candidates/month expected, CDN swap is mandatory, not optional. Get volume estimate early in Phase 6.

3. **O-04: AI-gen provider ToS verification**
   - What we know: v03 (hate speech overlay) and v05 (brand-safety edge case) are spec'd as AI-generated per `docs/video-manifest.md`. Provider ToS verification is required per CONTENT-09.
   - What's unclear: Which provider (Runway, Sora, Veo) is used for each clip. Each has different commercial-use terms.
   - Recommendation: Document provider + ToS date per clip in video-manifest.md before committing video files.

4. **Kappa rater recruitment**
   - What we know: 3 raters needed with content moderation domain knowledge. Methodology doc exists in `docs/kappa-calibration.md`. Rating sheet template defined.
   - What's unclear: Whether raters have been identified. Timeline for completing tagging of all 5 videos.
   - Recommendation: Identify raters and schedule calibration round before any Phase 6 code work starts. Kappa data collection is a 1-2 week process minimum.

5. **Pre-commit hook + CI workflow existence gap**
   - What we know: `docs/brand-guardrails.md` references `.husky/pre-commit` and `.github/workflows/brand-guard.yml` as if they exist. Neither directory exists on disk. The doc says these must be in sync with the grep pattern.
   - What's unclear: Were they expected to be created in Phase 0 but never implemented? Or deferred to Phase 6 intentionally?
   - Recommendation: Create both in Phase 6. The pre-commit hook is the primary defense — without it, a single `git commit` with a brand string in a new file leaks irreversibly into git history.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, GSAP, npm | ✓ | system | — |
| npm | Package management | ✓ | system | — |
| ffmpeg | Video encoding, sprite generation | ? | Unknown | Manual encoding via external tool; documented in video-manifest.md |
| Git LFS | Video file storage | ✓ | repo-configured | — |
| Cloudflare R2 | CDN fallback for videos | ? | Unknown | Serve from GitHub Pages LFS directly (bandwidth-limited) |
| Git | Pre-commit hooks, version control | ✓ | repo-configured | — |
| GitHub Actions | CI brand guard, deploy | ? | Unknown | Manual audit replaces CI scan |

**Missing dependencies with no fallback:**
- **Cloudflare R2** (assumed provisioned but unverified) — If R2 is not set up, the CDN swap cannot be tested. This is a hard gate (CC-05).

**Missing dependencies with fallback:**
- **ffmpeg** — If not available on developer's machine, sprite/VTT generation can be done once and committed as static assets. Regeneration is CI-only if CI has ffmpeg.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | `vite.config.js` (inline test config) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTENT-02 | playlist.json validates against schema (all required fields present, URLs resolve) | unit | `npx vitest run tests/playlist.test.js` | ❌ Wave 0 |
| CONTENT-03 | VIDEO_BASE_URL env resolution produces correct URLs for relative and absolute base | unit | `npx vitest run tests/videoUrl.test.js` | ❌ Wave 0 |
| QUALITY-06 | answerKeys.json per-video answerKeyVersion matches root version after sign-off | unit | `npx vitest run tests/answerKeys.test.js` | ❌ Wave 0 |
| BRAND-* | Pre-commit hook blocks forbidden strings in staged files | integration | `bash .husky/pre-commit` (manual) | ❌ Wave 0 |
| GSAP transitions | Screen transitions trigger on screen state change without double-fire in StrictMode | integration | `npx vitest run tests/transitions.test.jsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run` (sub-10s for unit tests)
- **Per wave merge:** `npx vitest run` + manual GSAP visual check in dev server
- **Phase gate:** Full suite green + brand-leak audit zero hits + kappa ≥ 0.6 verified

### Wave 0 Gaps
- ❌ `tests/playlist.test.js` — validates all playlist entries have required fields, all video files exist on disk
- ❌ `tests/videoUrl.test.js` — tests resolveVideoUrl with and without VITE_VIDEO_BASE_URL
- ❌ `tests/answerKeys.test.js` — validates per-video answerKeyVersion, all L1/L2 tags reference taxonomy.json
- ❌ `tests/transitions.test.jsx` — verifies GSAP useGSAP fires on screen change (mock GSAP)
- ❌ `.husky/pre-commit` — brand guard hook file does not exist
- ❌ `.github/workflows/brand-guard.yml` — CI brand guard workflow does not exist
- ❌ `tests/kappa.test.js` — existing kappa.js already has tests in prior phases; verify still green

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth system; one-attempt browser-local guard only |
| V3 Session Management | No | Stateless SPA; sessionStorage for identity only |
| V4 Access Control | No | Public static site; no access tiers |
| V5 Input Validation | Yes | Landing form validation (existing `validateName`, `validateEmail` in `utils/validators.js`) |
| V6 Cryptography | Yes | HMAC-SHA256 for submission payload signing (existing `buildHmac` in `utils/submission.js`); SHA-256 for email dedup (existing `hashEmail` in `utils/dedup.js`) |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Video file contains forbidden brand IP in overlay/spoken text | Information Disclosure | Manual audit of all video assets against `docs/brand-guardrails.md` grep pattern; VTT text included in grep scan |
| Answer key modification post-launch without version bump corrupts cross-cohort scoring | Tampering | `answerKeyVersion` field in submission payload ties each result to its answer key version; `version` bump on every edit |
| CDN URL injection via `.env` manipulation | Tampering | `VITE_VIDEO_BASE_URL` is build-time constant; runtime injection not possible. Production `.env` is not committed. |
| Candidate accesses answer keys via bundled JS | Information Disclosure | Accepted per SCORE-08 (obscurity-not-security tradeoff); keys bundled in JS build — this is a known limitation, not a Phase 6 concern |

## Sources

### Primary (HIGH confidence)
- Codebase analysis (22+ files read): App.jsx, all screen components, Zustand store, scoring engine, kappa utility, submission pipeline, playlist.json, answerKeys.json, taxonomy.json, vite.config.js, .env, package.json
- `docs/video-manifest.md` — video encoding spec, per-video sourcing, answer key rationale
- `docs/kappa-calibration.md` — methodology, target thresholds, data collection status
- `docs/brand-guardrails.md` — 55-string forbidden list, grep pattern, scan exclusions
- `.planning/ROADMAP.md` — Phase 6 success criteria, requirements, cross-cutting concerns
- `.planning/REQUIREMENTS.md` — CONTENT-02..11, QUALITY-03..06, open decisions O-01..O-10
- [VERIFIED: npm registry] GSAP 3.15.0, @gsap/react 2.1.2 — confirmed via `npm view`
- [CITED: vite.dev/guide/env-and-mode] — Vite env variable pattern, `import.meta.env.VITE_*` prefix rule

### Secondary (MEDIUM confidence)
- [CITED: vite.dev/guide/env-and-mode] — build-time static replacement of `import.meta.env` for tree-shaking
- Training knowledge: GSAP `useGSAP` with `scope` and `dependencies` pattern for React 19 StrictMode

### Tertiary (LOW confidence)
- [ASSUMED] Cloudflare R2 bucket is provisioned — referenced in docs but not verified via R2 dashboard
- [ASSUMED] 3 raters available for kappa calibration — methodology defined but recruitment status unknown
- [ASSUMED] ffmpeg available on developer machine — encoding spec exists but binary presence unverified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed and verified; no new packages
- Architecture: HIGH — codebase fully analyzed; patterns documented from existing implementation
- Pitfalls: HIGH — identified from concrete codebase state and documented gaps
- Human gates: LOW — kappa, client sign-off, video production all depend on external actors; timeline uncertain

**Research date:** 2026-07-08
**Valid until:** 2026-08-07 (30 days — video production timeline may extend this)

---

## Appendix: File-by-File Implementation Plan

### Track 1: Code Polish (can complete independently)

| File | Action | Dependencies |
|------|--------|-------------|
| `src/utils/videoUrl.js` | CREATE — `resolveVideoUrl()` using `import.meta.env.VITE_VIDEO_BASE_URL` | CONTENT-03 |
| `src/components/player/VideoPlayerScreen.jsx` | MODIFY — use `resolveVideoUrl(src)` instead of raw `src` prop | videoUrl.js |
| `src/App.jsx` | MODIFY — add `containerRef`, `useGSAP` with `dependencies: [state.screen]` for transitions | GSAP already installed |
| `src/data/answerKeys.json` | MODIFY — add `answerKeyVersion` to each `videos[]` entry; add `answerKeyRationale` per CONTENT-02 | QUALITY-06 |
| `.husky/pre-commit` | CREATE — brand guard grep hook from `docs/brand-guardrails.md` pattern | BRAND-04 |
| `.github/workflows/brand-guard.yml` | CREATE — CI brand scan with exclusions | BRAND-05 |
| `.env.example` | MODIFY — add `VITE_VIDEO_BASE_URL=` line | CONTENT-03 |
| `.env.production` | CREATE — set `VITE_VIDEO_BASE_URL=https://pub-<hash>.r2.dev` | R2 bucket provisioned |
| `tests/playlist.test.js` | CREATE — validate all entries have real files, required fields | playlist.json complete |
| `tests/videoUrl.test.js` | CREATE — test URL resolution with/without base | videoUrl.js |
| `tests/answerKeys.test.js` | CREATE — validate per-video version, taxonomy references | answerKeys.json updated |
| `tests/transitions.test.jsx` | CREATE — verify GSAP triggers on screen change | App.jsx refactored |

### Track 2: Content + Quality Gates (human-dependent)

| Task | Action | Gated By |
|------|--------|----------|
| v02.mp4 production | Create benign lifestyle montage (CC0 sourced, 60-120s) | CC0 source availability |
| v03.mp4 production | Create hate speech overlay video (AI-gen, 60-120s) | AI-gen provider ToS, ffmpeg |
| v04.mp4 production | Create health misinformation video (CC0 + synthetic overlay, 60-120s) | CC0 source + ffmpeg |
| v05.mp4 production | Create brand-safety edge case video (AI-gen, 60-120s) | O-01 resolution, AI-gen provider |
| Sprite/VTT generation | Run `scripts/generate-sprites.mjs` for v02-v05 | ffmpeg available, video files complete |
| playlist.json | Replace placeholder entries with real asset paths | All video files + sprites committed |
| Kappa calibration | Recruit 3 raters, run tagging round, compute kappa per L1 | Raters available, answer keys frozen |
| Answer key finalization | Bump version to `1.0.0`, remove "draft" notes | Kappa ≥ 0.6 verified |
| Client sign-off | Moderation lead reviews taxonomy L2 + per-video answer keys | Answer keys finalized |
| Brand-leak final audit | Full repo `grep -riE` of forbidden strings; manual video review | All content committed |
| CDN swap test | Deploy with `VITE_VIDEO_BASE_URL` pointing to R2; verify all 5 videos play | R2 bucket populated |
| Browser matrix E2E | Run assessment in Chrome, Edge, Safari, Firefox | All content + transitions complete |
| R2 bucket upload | Upload all 5 videos + sprites + VTTs to Cloudflare R2 | R2 bucket provisioned |

### Risk Assessment: What Could Block Launch

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Kappa < 0.6 for v05 (ambiguous edge case) | HIGH | HIGH | Pre-agree with client: if v05 cannot reach κ ≥ 0.6, drop it from scoring and run 4-video assessment |
| Kappa < 0.6 for v04 (health misinformation) | MEDIUM | HIGH | Have a backup v04 variant ready; or tighten answer key wording to reduce ambiguity |
| AI-gen video production delays | MEDIUM | MEDIUM | Start video production immediately; have manual ffmpeg overlay fallback for each clip |
| Client sign-off delays | MEDIUM | HIGH | Ship code changes independently; sign-off gates deployment, not code completion |
| GitHub LFS bandwidth exhaustion during testing | LOW | MEDIUM | Use R2 CDN for all pre-launch testing; only use LFS for git storage |
| Brand string leaks from video content | LOW | CRITICAL | Manual frame-by-frame review of all 5 videos before commit; include VTT text in grep scan |
| Pre-commit hook not installed (`husky prepare` never run) | MEDIUM | MEDIUM | Add `"prepare": "husky"` to package.json scripts (already present); verify `.husky/pre-commit` is executable |


