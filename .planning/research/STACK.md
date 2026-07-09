# Technology Stack

**Project:** Content Moderation Assessment (browser-based SPA)
**Researched:** 2026-07-07
**Overall confidence:** HIGH (versions verified via npm registry + Context7 on 2026-07-07)

---

## Executive Recommendation

Mirror the flagmail1 stack (**React 19 + Vite 8 + GSAP 3 + Lottie**) with three deliberate upgrades and one deliberate demotion:

1. **Add `media-chrome`** as the custom video player. It is a Mux-maintained web-components library that ships first-class React wrappers, uses native `<video>` under the hood (so it works with any file URL — LFS, jsDelivr, R2), and gets both hover-thumbnail scrubbing and chapter markers "for free" via standard WebVTT tracks. This is the 2026 standards-aligned choice and dominates the alternatives for this workload.
2. **Drop `react-router` entirely.** The assessment is a linear 6-step wizard (Landing → Guidelines → Video 1..5 → Scoreboard). A single `useState`-driven step machine or a Zustand slice is dramatically simpler than any router and avoids the GitHub Pages SPA 404 problem entirely.
3. **Add `zustand@5`** for the small amount of cross-cutting state (candidate identity, per-video answers, elapsed times, current step). Do NOT use Redux Toolkit — 40x the boilerplate for a 6-screen app. Do NOT use raw Context alone — re-render fanout on every keystroke is a real trap for a timer-driven UI.
4. **Swap `lottie-react` → `@lottiefiles/dotlottie-react`.** The flagmail1 dependency (`lottie-react@2.4.1`) still works, but `.lottie` (dotLottie) files are ~50–80% smaller than raw JSON, and the LottieFiles-maintained React wrapper is now the default recommendation. Keep `lottie-react` only if the flagmail1 JSON assets are being reused as-is and re-authoring them is out of scope.

Below are the pinned versions, install commands, and rationale.

---

## Recommended Stack — Pinned Versions

All versions confirmed against the npm registry on 2026-07-07.

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `react` | `^19.2.0` | UI framework | Matches flagmail1; React 19 is stable and current; hooks-first API fits the wizard/timer pattern. |
| `react-dom` | `^19.2.0` | DOM renderer | Pair for React 19. |
| `vite` | `^8.1.0` | Dev server + bundler | Latest stable major (v8). flagmail1 uses v7 — bump to v8 for a fresh project; migration guide is minor. Rolldown-powered builds are faster and Node 20+ is baseline. |
| `@vitejs/plugin-react` | `^6.0.0` | React SWC/Babel plugin | Matches Vite 8; SWC-based fast refresh. |

**Verified:** `npm view react version` → `19.2.7`, `npm view vite version` → `8.1.3`, `npm view @vitejs/plugin-react version` → `6.0.3`, `npm view react-dom version` → `19.2.7`.

### Video Player (the critical decision)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `media-chrome` | `^4.19.2` | Custom video player (controls + scrub + chapters + thumbnail preview) | Web-components + native `media-chrome/react` wrappers; VTT-driven thumbnails and chapter markers are built-in; no proprietary CDN required; works with plain `<video src>` pointed at any file. See "Player Comparison" below for the tradeoff analysis. |

**Verified:** `npm view media-chrome version` → `4.19.2`, and Context7 confirms both `<media-time-range>` preview thumbnails (via `<track kind="metadata" label="thumbnails">`) and chapter segments (via `<track kind="chapters">`) work out of the box.

**Install:**
```bash
npm install media-chrome
```

**Usage pattern (React wrappers ship in-package):**
```jsx
import {
  MediaController, MediaControlBar, MediaTimeRange,
  MediaPlayButton, MediaTimeDisplay, MediaMuteButton,
  MediaFullscreenButton,
} from 'media-chrome/react';

<MediaController>
  <video slot="media" src="/videos/clip-1.mp4" playsInline crossOrigin="">
    <track default kind="chapters" src="/vtt/clip-1.chapters.vtt" />
    <track default kind="metadata" label="thumbnails" src="/vtt/clip-1.thumbs.vtt" />
  </video>
  <MediaControlBar>
    <MediaPlayButton /><MediaTimeRange /><MediaTimeDisplay showDuration />
    <MediaMuteButton /><MediaFullscreenButton />
  </MediaControlBar>
</MediaController>
```

### Animation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `gsap` | `^3.15.0` | Transitions between wizard steps + scoreboard reveal | Matches flagmail1 pattern; GSAP is now MIT-licensed on all plugins as of GSAP 3.13 (2025) — no more paywall for ScrollTrigger/SplitText. |
| `@gsap/react` | `^2.1.2` | `useGSAP` hook | Official React helper — handles cleanup on unmount, correctly scopes selectors. flagmail1 does not use it; recommend adding for correctness under React 19 StrictMode. |
| `@lottiefiles/dotlottie-react` | `^0.19.7` | Milestone celebration animations (PERFECT_EYE, SNIPER, etc.) | Successor to `lottie-react`. Smaller `.lottie` bundles, ThorVG canvas renderer, official LottieFiles package. If existing flagmail1 JSON assets are being reused, keep `lottie-react@^2.4.1` instead — do not do both. |

**Verified:** `npm view gsap version` → `3.15.0`, `npm view @gsap/react version` → `2.1.2`, `npm view @lottiefiles/dotlottie-react version` → `0.19.7`.

**Lottie migration note:** Convert existing `.json` Lottie assets to `.lottie` with the LottieFiles converter or `dotlottie-js`. Do this once; do not ship both formats.

### Routing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **(none)** | — | Step-state wizard | Linear flow; a single `currentStep` variable in Zustand + a `switch` statement in `<App>` is simpler, ships zero KB of router code, and eliminates the GitHub Pages SPA deep-link 404 problem. |

**Do NOT use `react-router-dom`.** It was retired in react-router v8 (released 2025) — the package no longer exists, imports must come from `react-router` and `react-router/dom`. More importantly: routers on GitHub Pages require 404.html fallback hacks (`spa-github-pages` trick) because Pages does not do server-side rewrites. A stateful wizard is strictly better here.

**Do NOT use `wouter`.** Tempting for its small size (~2KB), but the same "no deep links needed" argument applies. Skip the dependency entirely.

If routing is added later (e.g., a `/results/:id` shareable link), use `react-router@^8.1.0` and note that the `<base>` tag or `basename` prop must be set to match Vite's `base` config for GitHub Pages subpath deployment.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `zustand` | `^5.0.14` | Global store for candidate identity, current step, per-video answers, timer state | Tiny (~1 KB), hook-based, no Provider boilerplate, selector-based subscriptions prevent timer re-render cascades. Slices pattern documented in Context7 fits the 4–5 domain sections cleanly. |

**Do NOT use Redux Toolkit** — massive boilerplate for a 6-screen assessment; the store surface here is <200 lines total.

**Do NOT rely on React Context alone.** The 3-minute countdown ticks every second; a Context value change re-renders every consumer. Zustand's selector `useStore(s => s.currentStep)` only re-renders when that specific slice changes. This matters because the video player, timer, and tag pickers are all mounted simultaneously.

**Component-local state** (`useState`) is still correct for form inputs, hover states, animation triggers. Global store is only for **things that survive step transitions** (candidate identity, accumulated answers, timers).

**Verified:** `npm view zustand version` → `5.0.14`; Context7 confirms slices pattern is the idiomatic composition strategy for v5.

### Forms & Submission

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `fetch` + `FormData` | (built-in) | Landing-page name/email capture + final submission to Formspree/Sheets webhook | Zero dependencies; one POST at start (identity) + one POST at end (results). No form framework is warranted. |
| `@formspree/react` | `^3.0.0` (optional) | `useForm()` hook if Formspree is chosen as backend | Handy for handling submission state (idle/submitting/succeeded/errored) without hand-rolling. Otherwise plain `fetch` to the webhook URL is fine. |

**Recommendation:** Start with plain `fetch` (JSON body → Formspree endpoint or Google Apps Script webhook URL). Only add `@formspree/react` if error-state UI grows complex enough to justify a hook. Both work with either backend — Formspree accepts JSON, Apps Script webhooks accept anything the doPost handler parses.

**Do NOT add `react-hook-form` or `formik`.** The entire form is 2 fields (name, email) captured once. Framework overkill.

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `vitest` | `^4.1.10` | Unit + component tests (competency scoring, taxonomy validation, timer hook) | Matches flagmail1; Vite-native, fast, Jest-compatible API. |
| `@playwright/test` | `^1.61.1` | End-to-end tests (full 5-video flow, timeout auto-submit, one-attempt-only guard) | Cross-browser, handles video element interactions well, records video traces for CI debugging. |
| `@testing-library/react` | `^16.x` | Component testing helpers | Standard React 19 companion for Vitest. |
| `jsdom` or `happy-dom` | latest | Vitest DOM env | `happy-dom` is faster; either works. |

**Verified:** `npm view vitest version` → `4.1.10`, `npm view @playwright/test version` → `1.61.1`.

**Do NOT use Jest.** Vitest is strictly faster in Vite projects and already in flagmail1.

**Do NOT use Cypress.** Playwright handles video-element interactions and CI parallelization better in 2026.

### Linting & Quality

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `eslint` | `^9.39.1` | Flat-config linting | Matches flagmail1 (`eslint.config.js`); flat config is the only supported format in v9. |
| `@eslint/js` | `^9.39.1` | Base recommended rules | Standard. |
| `eslint-plugin-react-hooks` | `^7.0.1` | Hook rules (exhaustive-deps critical for timer effect) | Non-negotiable for React 19 correctness. |
| `eslint-plugin-react-refresh` | `^0.4.24` | HMR safety | Matches flagmail1. |
| `globals` | `^16.5.0` | Browser globals for ESLint env | Matches flagmail1. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **GitHub Pages** | — | Static hosting | Free, meets constraint. |
| **Git LFS** | (git-lfs 3.x) | Track `*.mp4`, `*.webm`, `*.vtt` (large thumbnail sprites only), Lottie `.lottie` if >10 MB | Simplest single-repo model; matches project decision. Bandwidth caveats below. |
| `actions/checkout@v6` | v6 | Pull source (with `lfs: true`) | Standard. |
| `actions/setup-node@v4` | v4 | Node 20+ toolchain | Standard. |
| `actions/configure-pages@v5` | v5 | Configure Pages build | Standard. |
| `actions/upload-pages-artifact@v3` | v3 | Upload built `dist/` | Standard. |
| `actions/deploy-pages@v4` | v4 | Publish to Pages | Standard. This is the modern flow — do NOT use `peaceiris/actions-gh-pages` or `gh-pages` npm package; those pre-date the official GitHub Pages Action and are now legacy patterns. |

**Reference workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          lfs: true                     # CRITICAL: pull LFS pointers → real files
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Vite config for a project-page deploy** (`vite.config.js`):
```js
export default defineConfig({
  plugins: [react()],
  base: '/<repo-name>/',   // e.g., '/content-moderation-assessment/'
  build: { target: 'es2022', sourcemap: true },
})
```

---

## Player Comparison — Why media-chrome Wins

Requirements: **seek bar + hover-thumbnail scrubbing + chapter/timestamp markers**, React 19 compatible, works with a plain MP4 file URL (no proprietary CDN), maintained.

| Library | Version | Thumbnail preview | Chapter markers | React 19 | Bundle | Maintained | Verdict |
|---------|---------|-------------------|-----------------|----------|--------|------------|---------|
| **`media-chrome`** | **4.19.2** | **Yes** — auto via `<track kind="metadata" label="thumbnails">` (VTT) | **Yes** — auto via `<track kind="chapters">` (VTT); segmented time range with hover labels | **Yes** — first-class `media-chrome/react` wrappers exported from same package | ~30 KB gzip (tree-shakeable) | Very active (Mux) | **CHOSEN** |
| `video.js` (v10) | 8.23.9 (npm)  / v10 preview | Yes — plugin `videojs-thumbnails` or metadata track (v10) | Yes — plugin `videojs-chapters` or metadata track | v10 has React skin (`@videojs/react`), v8 needs manual wrapping | ~100 KB gzip base + plugins | Active | Too heavy; plugin sprawl. Only pick if HLS/DASH streaming were needed. |
| `plyr` + `plyr-react` | plyr 3.8.4, plyr-react 6.0.0 | Yes — `previewThumbnails: { src: 'thumbs.vtt' }` | Yes — `markers: { points: [...] }` (label + time), API-defined not VTT | `plyr-react@6.0.0` supports React 19 | ~30 KB gzip | Moderate (plyr core last major release 2023) | Solid #2 pick. Markers are label-based (nice for "suspicious moment" tooltips), but web-components model of media-chrome is more future-proof. |
| `vidstack` / `@vidstack/react` | 0.6.15 (last publish **April 2024**) | Yes — `<SliderThumbnail>` | Yes — `<SliderChapters>` | Beautiful React API | ~40 KB gzip | **STALE — no releases in ~2 years; primary npm scope inactive** | **DO NOT USE.** Feature-rich but the canonical npm packages (`vidstack`, `@vidstack/react`) have not been updated since v0.6.15 in 2024. Active development appears to have forked to third-party namespaces. Too risky for a hiring product. |
| Plain `<video>` + custom UI | native | **No** — would require building VTT-parser + hover-canvas from scratch (~200 LOC) | **No** — would require rendering markers over a custom seek bar | Trivial | 0 KB | Native | Skip. The custom-lift is exactly what media-chrome exists to save. |

**Bottom-line rationale for media-chrome:**
1. **Standards-native:** thumbnails and chapters are just standard `<track>` elements — the same VTT files you'd use with any HTML5 video work here, so the moderation-clip content pipeline (video → sprite sheet → VTT) is portable.
2. **No lock-in:** it's just a custom-element skin around `<video>`. Videos can move from LFS to R2 to jsDelivr with zero player-side changes.
3. **First-party React support:** `media-chrome/react` is in the same package — no separate wrapper repo, no version-skew risk.
4. **Maintained by Mux:** the same team that ships hls.js and the reference `<mux-player>` — active repo, weekly releases, funded.
5. **Small:** ~30 KB gzip, tree-shakeable, only ship the buttons you use.

### Building the thumbnail sprite + VTT

Both `media-chrome` and `plyr` consume the same WebVTT thumbnail format. Generate once per clip with:
- **`ffmpeg` + a shell script** (documented in media-chrome examples), or
- **`video-thumbnail-generator`** (npm CLI), or
- **`mt` (movie thumbnailer)** for sprite sheets.

Ship the resulting `clip-N.thumbs.vtt` + `clip-N.sprite.jpg` alongside `clip-N.mp4`.

---

## Git LFS Bandwidth — Real Warning + Mitigations

### The problem

GitHub's free Git LFS quota is **1 GB storage + 1 GB bandwidth per month per account**. Every candidate who loads the assessment downloads all 5 videos through GitHub Pages. If each video is ~50 MB (720p H.264, 90 sec), the full playlist is ~250 MB per candidate. **That's 4 candidates before you hit the free bandwidth cap.** Once exceeded, LFS objects return 403 and the videos silently break — **the assessment breaks silently in production** with no visible error message on the Pages site itself.

**Confidence: HIGH** — this is well-documented GitHub billing behavior and the exact reason most static sites move video off LFS. (Note: WebFetch was denied during research, so this is stated from prior knowledge and the project's own `.planning/PROJECT.md` constraint acknowledgment — validate the current free-tier numbers on GitHub billing docs before launch.)

### Mitigations, in order of preference

1. **Aggressively re-encode to hit ~20 MB per clip.** H.264 baseline profile, 720p, CRF 26, AAC 96 kbps, 30 fps. Five clips × 20 MB = 100 MB per full playthrough → **~10 candidates per month** on the free tier. Still fragile.

2. **Serve videos via jsDelivr CDN (free, LFS-aware).** jsDelivr can proxy public GitHub repo files (including LFS) at CDN speed, cached globally, **and does not consume GitHub LFS bandwidth on cache hits**. URL pattern:
   ```
   https://cdn.jsdelivr.net/gh/<user>/<repo>@<branch>/path/to/video.mp4
   ```
   jsDelivr has file-size limits (~50 MB per file) — align encoding with that cap. **This is the recommended production choice.** Ship the JSON video manifest with jsDelivr URLs; keep GitHub Pages purely for HTML/JS/CSS.

3. **Cloudflare R2 + Cloudflare Pages CDN.** R2 has 10 GB free storage and free egress (zero bandwidth charges within Cloudflare's network). Upload videos to R2, front with a Worker or Pages custom domain, reference from the SPA. More setup than jsDelivr but no size caps and full control. **Second choice if jsDelivr file-size limits bite.**

4. **YouTube unlisted / Vimeo unlisted.** Rejected — the project charter explicitly disallows YouTube branding and third-party player chrome.

5. **Cloudinary free tier (25 GB bandwidth).** Adds vendor lock-in and their branding on the free tier; skip unless the above three all fail.

### Recommended default

- **Store videos in LFS** (single-repo source of truth, versioned) but **serve from jsDelivr** in production. The video manifest JSON has environment-conditional URLs: LFS-relative in dev, jsDelivr in production build. This gives editability (commit new clip → jsDelivr picks it up on next purge) with production-safe bandwidth.
- **Fall back to Cloudflare R2** if any single clip exceeds jsDelivr's per-file limit or if purge latency causes ops pain.

Document the chosen CDN in `PROJECT.md` before Phase 2.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | React 19 + Vite | Next.js 15 | Server-only features (SSR, RSC) are wasted on a static SPA. Vite is lighter, matches flagmail1, and deploys as pure static files. |
| Video player | media-chrome | vidstack | Vidstack's official npm packages (`vidstack`, `@vidstack/react`) have not shipped a release since April 2024 (v0.6.15). Stale dependencies are a launch risk for a hiring product. |
| Video player | media-chrome | video.js | Overkill for 5 short MP4s; plugin sprawl for thumbnails + chapters; skin customization is CSS-in-JS-shaped for the older API. |
| Video player | media-chrome | plyr + plyr-react | Fine second choice. Marker API is programmatic (nice) but framework model is older than web-components; less future-proof. |
| Router | none | react-router-dom | Package removed in react-router v8. Also unnecessary for a linear wizard. |
| Router | none | wouter | 2 KB is still 2 KB the app doesn't need. |
| State | Zustand | Redux Toolkit | ~40× more boilerplate for a 6-screen scope; nothing here benefits from RTK's devtools story. |
| State | Zustand | React Context only | Timer ticks re-render all consumers; selector-based Zustand avoids the cascade. |
| State | Zustand | Jotai | Great library but atoms-everywhere pays off in bigger apps; slices-of-Zustand is a simpler mental model for this scope. |
| Forms | fetch (+ optional `@formspree/react`) | react-hook-form | Two form fields captured once; framework overkill. |
| Lottie | `@lottiefiles/dotlottie-react` | `lottie-react` | dotlottie assets are smaller; official LottieFiles wrapper. Keep `lottie-react@^2.4.1` only if flagmail1 JSON assets are reused as-is. |
| Deploy action | `actions/deploy-pages` | `peaceiris/actions-gh-pages` | Legacy third-party. Official Action is now first-class and supports environment protection rules. |
| Deploy target | GitHub Pages (HTML/CSS/JS) + jsDelivr (videos) | GitHub Pages serving LFS videos directly | LFS bandwidth cap will kill the site after ~10 candidates on the free tier. |

---

## Complete Install Command

Fresh scaffold from scratch:

```bash
# 1. Scaffold
npm create vite@latest content-moderation-assessment -- --template react
cd content-moderation-assessment

# 2. Runtime deps
npm install \
  react@^19.2.0 react-dom@^19.2.0 \
  media-chrome@^4.19.2 \
  gsap@^3.15.0 @gsap/react@^2.1.2 \
  @lottiefiles/dotlottie-react@^0.19.7 \
  zustand@^5.0.14

# 3. Optional: Formspree hook (only if backend state gets non-trivial)
# npm install @formspree/react@^3.0.0

# 4. Dev deps
npm install -D \
  vite@^8.1.0 @vitejs/plugin-react@^6.0.0 \
  vitest@^4.1.10 @vitest/ui@^4.1.10 \
  @testing-library/react@^16.3.0 @testing-library/user-event@^14.6.0 \
  happy-dom@^18.0.0 \
  @playwright/test@^1.61.1 \
  eslint@^9.39.1 @eslint/js@^9.39.1 \
  eslint-plugin-react-hooks@^7.0.1 eslint-plugin-react-refresh@^0.4.24 \
  globals@^16.5.0

# 5. LFS
git lfs install
git lfs track "*.mp4" "*.webm" "*.lottie"
git add .gitattributes
```

Then wire `.github/workflows/deploy.yml` (see Infrastructure table above) and set `base: '/<repo-name>/'` in `vite.config.js`.

---

## Confidence Assessment

| Choice | Confidence | Source |
|--------|------------|--------|
| React 19.2 + Vite 8 + `@vitejs/plugin-react` 6 | HIGH | npm registry versions verified 2026-07-07 |
| `media-chrome` for player (chapters + thumbs support) | HIGH | Context7 docs confirm both features via VTT tracks + `media-chrome/react` wrappers |
| `vidstack` = risky | HIGH | npm shows `vidstack@0.6.15` last published 2024-04-19; over 2 years stale |
| `react-router-dom` retired in v8 | HIGH | Context7 changelog confirms package removal |
| Zustand 5 for state | HIGH | npm version + Context7 slices pattern docs |
| GSAP 3.15 + `@gsap/react` 2.1.2 | HIGH | npm registry |
| `@lottiefiles/dotlottie-react` 0.19.7 | HIGH | npm registry; ThorVG canvas rendering standard |
| Vitest 4 + Playwright 1.61 | HIGH | npm registry; matches flagmail1 direction |
| `actions/deploy-pages@v4` workflow | HIGH | Documented in GitHub Actions docs (via Context7) — pattern is stable since 2023 |
| Git LFS 1 GB/month free tier + bandwidth exhaustion behavior | MEDIUM | Well-established GitHub billing behavior, but WebFetch was denied during research — validate the current numbers on GitHub billing docs before launch |
| jsDelivr as production CDN for GitHub-hosted LFS videos | MEDIUM | Common pattern; verify current jsDelivr file-size limits before finalizing encoding settings |

---

## Sources

- **Context7 (`/muxinc/media-chrome`)** — confirmed `<media-time-range>` supports both preview thumbnails (via `<track kind="metadata" label="thumbnails">`) and chapter segments (via `<track kind="chapters">`) with a single VTT file each; confirmed `media-chrome/react` wrappers ship in the same package.
- **Context7 (`/sampotts/plyr`)** — confirmed `previewThumbnails` and `markers` API for plyr; both features exist, VTT-based for thumbs and JS-object-based for markers.
- **Context7 (`/videojs/v10`)** — confirmed video.js v10 has React skin (`@videojs/react`) with chapters slice and Thumbnail component (metadata track).
- **Context7 (`/vidstack/player`)** — confirmed SliderThumbnail component exists, but see npm date-check below.
- **npm registry (verified 2026-07-07)** — pinned all recommended versions; discovered `vidstack@0.6.15` last published 2024-04-19 (stale).
- **Context7 (`/remix-run/react-router`)** — confirmed v8 removes `react-router-dom` re-export.
- **Context7 (`/pmndrs/zustand`)** — confirmed slices pattern is idiomatic for v5.
- **Context7 (`/formspree/formspree-js`)** — confirmed `useForm` hook signature and v3.0.0 error-handling improvements.
- **Context7 (`/websites/github_en_actions`)** — confirmed `actions/checkout@v6`, `actions/upload-artifact@v4`, `actions/deploy-pages@v4` are current.
- **Prior domain knowledge** — Git LFS free-tier quota specifics and jsDelivr GitHub LFS caching behavior (WebFetch was denied during this research pass; recommend a final verification pass on GitHub billing docs + jsDelivr docs before Phase 2 kickoff).
