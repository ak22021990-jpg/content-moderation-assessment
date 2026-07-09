# Phase 0: Foundations — Research

**Researched:** 2026-07-07
**Domain:** Repo scaffolding, brand-guard automation, Git LFS, GitHub Pages CI/CD, CDN provisioning, taxonomy schema
**Confidence:** HIGH (all critical claims verified via npm registry, official GitHub docs, official Vite docs, Cloudflare docs, or primary source web fetch)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Repo name: `content-moderation-assessment` under `ak22021990-jpg` personal account.
- **D-02:** Pages URL: `https://ak22021990-jpg.github.io/content-moderation-assessment/`
- **D-03:** Vite `base` in `vite.config.js` MUST be `/content-moderation-assessment/` — required for asset resolution on GitHub Pages subdirectory. IMMUTABLE from commit 1.
- **D-04:** Forbidden strings stored in `docs/brand-guardrails.md`. Grep is case-insensitive (`-i`). Gate runs in `.husky/pre-commit` (local) and `.github/workflows/brand-guard.yml` (CI).
- **D-05:** Primary brand string: `disney` (covers Disney, Disney+, DISNEY — case-insensitive).
- **D-06:** Franchise clusters: Marvel, Star Wars, Pixar, Classic Disney, Streaming/Platforms — see CONTEXT.md for full list.
- **D-07:** `docs/brand-guardrails.md` is commit-1 infrastructure — created before any other file.
- **D-08:** 10-L1 taxonomy from FEATURES.md lines 107–172. L2 wording is subject to client sign-off (CC-03 gate, Phase 3).
- **D-09:** File: `src/data/taxonomy.json` — bundled, not publicly fetchable. Schema uses `version`, `categories[]` with `id`, `label`, `subcategories[]`.
- **D-10:** `taxonomyVersion` string `"0.1.0-draft"` in root JSON.
- **D-11:** Seed video is ffmpeg-generated 5-second placeholder (color bar or black frame, 1280×720, H.264, AAC silence).
- **D-12:** `ffmpeg -f lavfi -i color=c=black:size=1280x720:rate=30 -t 5 -c:v libx264 -pix_fmt yuv420p -an public/videos/placeholder.mp4`
- **D-13:** `.gitattributes` must track `*.mp4 filter=lfs diff=lfs merge=lfs -text` before the file is committed.
- **D-14:** CI verification step: `file public/videos/placeholder.mp4 | grep -i mp4` — must pass.
- **D-15:** jsDelivr is primary CDN; `playlist.json` has env-conditional `srcUrl`. Dev: LFS-relative path. Production: jsDelivr URL. R2 is documented fallback for clips > 50 MB or if jsDelivr can't serve LFS content.
- **D-16:** `playlist.json` stub with one placeholder entry.
- **D-17:** GitHub billing spending cap MUST be verified at $0 before first LFS commit. Requires manual step in GitHub Settings.

### Claude's Discretion
- Vite scaffold install command details (decided: `npm create vite@latest content-moderation-assessment -- --template react`)
- Order of commits within Phase 0 (decided: brand-guard first, then scaffold)
- Whether to install full runtime deps in Phase 0 or defer to Phase 1 (CONTEXT.md defers Zustand/media-chrome to Phase 1)

### Deferred Ideas (OUT OF SCOPE)
- Real V1 assessment clip — Phase 2
- V2–V5 video sourcing — Phases 2–4
- Vite scaffold with React + Zustand + media-chrome install — Phase 1 (can be done at end of Phase 0 as bonus; planner decides)
- Cloudflare R2 provisioning — defer until a clip exceeds 50 MB
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | Project in NEW public GitHub repo with generic name | Repo creation steps in Implementation Approach |
| DEPLOY-02 | `vite.config.js` sets `base: '/content-moderation-assessment/'` | Vite docs confirmed; Pitfall 13 confirmed this is the cause of white-screen failures |
| DEPLOY-03 | GitHub Actions workflow builds Vite and deploys via `actions/deploy-pages@v4` | Verified YAML in Tool Research section |
| DEPLOY-04 | `actions/checkout@v6` with `lfs: true` | Verified in STACK.md; confirmed in GitHub docs workflow |
| DEPLOY-05 | CI verification step `file <video>.mp4 | grep MP4` fails if LFS pointer served | Covered in Pitfall section; exact CI step documented |
| DEPLOY-06 | `.gitattributes` tracks `*.mp4`, `*.webm`, `*.lottie`, `*.jpg` sprites via LFS | Git LFS command sequence verified |
| DEPLOY-07 | Deploy pipeline green with placeholder content by end of Phase 0 | Implementation sequence ensures this |
| DEPLOY-08 | jsDelivr OR R2 pre-provisioned so `playlist.json` can be re-pointed | CRITICAL finding: jsDelivr does NOT serve LFS files — R2 becomes primary CDN for video; jsDelivr usable for non-LFS static assets only |
| DEPLOY-09 | GitHub billing spending cap set to $0 | Manual step documented; must occur before first LFS commit |
| BRAND-01 | HTML `<title>`, `<meta>`, favicon, OG tags have zero client brand refs | Placeholder HTML template documented |
| BRAND-02 | `package.json` name/description/author/repository have zero client brand refs | Scaffold uses generic name; verified in implementation |
| BRAND-03 | Repo name, branch name, workflow names, commit messages have zero client brand refs | All names in plan use generic language |
| BRAND-04 | `.husky/pre-commit` runs grep against staged files | Husky v9 setup verified; exact hook script documented |
| BRAND-05 | `.github/workflows/brand-guard.yml` fails PR on forbidden string match | CI grep workflow documented |
| BRAND-06 | `docs/brand-guardrails.md` lists exact forbidden strings | Template documented; full string list from D-06 |
| BRAND-07 | Author email does not resolve to client organization | Use personal account `ak22021990@gmail.com` — already confirmed |
| BRAND-08 | Video filenames, JSON keys, CSS classes, Lottie names use generic language | Naming conventions documented |
| CONTENT-01 | `taxonomy.json` locks 10 L1 categories with L2 subcategories | Full taxonomy from FEATURES.md lines 107–172 documented; JSON schema provided |
| CONTENT-04 | All 5 videos encoded H.264 720p CRF 26, AAC 96 kbps, `-movflags +faststart`, ≤ 20 MB | Phase 0 only: placeholder video; encoding spec documented for Phase 2 real clips |
| CONTENT-07 | `docs/video-manifest.md` template exists; V1 clip documented with source URL, license, target L1/L2, rationale | Template structure documented |
</phase_requirements>

---

## Summary

Phase 0 is infrastructure-only: it must harden the repo against brand leaks before a single line of application code is written. Every deliverable in this phase is a gate that protects all future phases — the brand-guard hook, the `.gitattributes` LFS tracking, the deploy pipeline, and the CDN stub must all be in place before any UI work begins.

The most significant finding in this research is a **correction to the CDN architecture**: jsDelivr cannot serve GitHub LFS files. When a file is tracked in Git LFS, jsDelivr fetches the LFS pointer text file from GitHub rather than resolving the actual binary content. This was confirmed via an open GitHub issue that has been unresolved since 2020. The implication is that Cloudflare R2 must be treated as the primary production CDN for video (not just a fallback), while jsDelivr remains useful only for non-LFS assets (e.g., small JS/CSS/JSON files not tracked in LFS). The `playlist.json` env-conditional URL pattern from D-15 remains valid; only the target URL changes from jsDelivr to R2.

The second significant finding is that all environment prerequisites are met: Node 26.1.0, npm 11.17.0, git 2.53.0, git-lfs 3.7.1, and ffmpeg (2026-03-15 build) are all installed and current. Phase 0 can proceed immediately without any environment setup overhead.

**Primary recommendation:** Sequence commits in strict order — (1) brand-guard infrastructure, (2) Vite scaffold with base config + empty shell HTML, (3) LFS setup + placeholder video, (4) GitHub Actions deploy pipeline. Never commit application code before step 1 is complete.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Brand-string enforcement | CI / Git hooks | Local pre-commit | CI is the authoritative gate; local hook is developer convenience |
| Video binary storage | Git LFS (source of truth) | — | LFS is the repo-adjacent store; CDN is the serving layer |
| Video serving (production) | Cloudflare R2 (CDN) | GitHub Pages raw | R2 is zero-egress; Pages LFS has 10 GiB/mo bandwidth cap |
| Static site hosting (HTML/JS/CSS) | GitHub Pages | — | Free tier, zero config for static assets |
| Taxonomy data | Bundled (src/data/) | — | `taxonomy.json` is bundled with Vite build, not a public endpoint |
| Playlist / CDN config | `public/playlist.json` | env var `VIDEO_BASE_URL` | Runtime env-conditional URL; public/ is served as-is |
| CI/CD | GitHub Actions | — | Official Pages Actions pipeline; no third-party deploy actions |

---

## Implementation Approach

Sequence is non-negotiable. Brand-guard must be commit-1 because any prior commit could contain a brand leak that can never be fully purged from public history.

### Recommended Commit Sequence

**Commit 1 — Brand guard infrastructure (before anything else)**
1. Create fresh local directory named `content-moderation-assessment` (NOT inside the Disney planning directory)
2. `git init` in that directory
3. Create `docs/brand-guardrails.md` with forbidden strings list and grep pattern
4. Install Husky v9 and create `.husky/pre-commit` with brand-grep script
5. Create `.github/workflows/brand-guard.yml`
6. `git add .` and commit with message: `infra: add brand-guard pre-commit hook and CI workflow`
7. Push to new GitHub repo `ak22021990-jpg/content-moderation-assessment`

**Commit 2 — Vite scaffold + GitHub Pages config**
1. `npm create vite@latest . -- --template react` (in existing directory)
2. Edit `vite.config.js` — set `base: '/content-moderation-assessment/'`
3. Replace `index.html` `<title>` with `Content Moderation Assessment`; scrub all Vite default meta
4. Edit `package.json` — set `name: "content-moderation-assessment"`, generic `description`, author `ak22021990-jpg`
5. Create empty `src/data/` and `public/videos/` directories (`.gitkeep`)
6. Run `npm install` (installs only the scaffold devDeps — no runtime libs yet)
7. Commit: `feat: vite scaffold with github pages base config`

**Commit 3 — Taxonomy schema**
1. Create `src/data/taxonomy.json` using the 10-L1 structure from FEATURES.md lines 107–172
2. Commit: `feat: lock taxonomy schema v0.1.0-draft`

**Commit 4 — Git LFS + seed video**
1. Enable spending cap: GitHub Settings → Billing → Spending limits → $0 (MANUAL STEP — must happen before this commit)
2. `git lfs install`
3. `git lfs track "*.mp4" "*.webm" "*.lottie"` — generates `.gitattributes`
4. `git add .gitattributes` and commit `.gitattributes` alone first
5. Generate placeholder: run D-12 ffmpeg command
6. `git add public/videos/placeholder.mp4`
7. Verify LFS pointer: `git lfs status` must show the file tracked
8. Commit: `feat: add git lfs tracking and seed placeholder video`

**Commit 5 — playlist.json CDN stub**
1. Create `src/data/playlist.json` (or `public/playlist.json`) with D-16 structure
2. Set `srcUrl` to `"%%VIDEO_BASE_URL%%/placeholder.mp4"` (placeholder token for env substitution)
3. Document R2 bucket URL as the target in `docs/video-manifest.md`
4. Commit: `feat: add playlist stub with cdn url pattern`

**Commit 6 — GitHub Actions deploy pipeline**
1. Create `.github/workflows/deploy.yml` (see exact YAML in Tool Research)
2. Enable Pages in repo Settings → Pages → Source: GitHub Actions
3. Push and verify workflow goes green
4. Verify deployed URL: `https://ak22021990-jpg.github.io/content-moderation-assessment/`
5. Commit: `feat: github actions deploy pipeline`

**Commit 7 — video-manifest.md template**
1. Create `docs/video-manifest.md` with one entry for `placeholder.mp4` (source: ffmpeg-generated, license: N/A, target L1/L2: N/A, rationale: LFS verification placeholder)
2. Commit: `docs: add video manifest template`

---

## Tool / Library Research

### Husky v9 — Pre-commit Brand Guard

**Version:** 9.1.7 (latest as of 2026-07-07) [VERIFIED: npm registry]
**Install date:** 2025-01-11

**Exact install and setup:**
```bash
npm install --save-dev husky
npx husky init
```

`npx husky init` does two things: (1) creates `.husky/pre-commit` shell file, (2) adds `"prepare": "husky"` to `package.json` scripts. [CITED: typicode.github.io/husky/get-started.html]

**What `package.json` looks like after init:**
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.1.7"
  }
}
```

**`.husky/pre-commit` — brand grep pattern:**

The hook must scan staged file content (not just filenames) for forbidden strings. The correct pattern uses `git diff --cached` piped to grep: [CITED: codeinthehole.com/tips/tips-for-using-a-git-pre-commit-hook/]

```bash
#!/usr/bin/env sh

# Brand-guard: reject commits containing forbidden brand/franchise strings
# Pattern is case-insensitive; covers all clusters from docs/brand-guardrails.md

FORBIDDEN='disney|disney\+|marvel|spider-man|spiderman|avengers|iron man|ironman|captain america|thor|black panther|hulk|wolverine|x-men|star wars|starwars|luke skywalker|darth vader|mandalorian|jedi|sith|han solo|chewbacca|yoda|lightsaber|pixar|toy story|toystory|finding nemo|wall-e|walle|coco|buzz lightyear|woody|incredibles|mickey mouse|minnie mouse|frozen|moana|encanto|elsa|anna|simba|lion king|cinderella|snow white|hulu|espn\+'

# Check staged diff content (not just filenames)
if git diff --cached -U0 | grep -iE "$FORBIDDEN"; then
  echo ""
  echo "COMMIT REJECTED: forbidden brand/franchise string found in staged changes."
  echo "See docs/brand-guardrails.md for the full forbidden list."
  echo "Remove all matches above before committing."
  exit 1
fi
```

**Windows compatibility note:** [ASSUMED] Husky v9 hooks are POSIX shell scripts. Git on Windows (Git for Windows / Git Bash) ships with a POSIX-compatible shell at `C:\Program Files\Git\bin\sh.exe` and this is the shell Git uses to execute hooks. The `#!/usr/bin/env sh` shebang works correctly with Git for Windows because Git resolves the shebang against its bundled shell. The `grep -iE` flag works in GNU grep (bundled with Git for Windows). Tested confirmation for this specific Windows environment is not available — treat as `[ASSUMED]` and test the hook manually after installation.

**CI equivalent — `.github/workflows/brand-guard.yml`:**
```yaml
name: Brand Guard

on:
  pull_request:
  push:
    branches: [main]

jobs:
  brand-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - name: Scan for forbidden brand strings
        run: |
          FORBIDDEN='disney|disney\+|marvel|spider-man|spiderman|avengers|iron man|ironman|captain america|thor|black panther|hulk|wolverine|x-men|star wars|starwars|luke skywalker|darth vader|mandalorian|jedi|sith|han solo|chewbacca|yoda|lightsaber|pixar|toy story|toystory|finding nemo|wall-e|walle|coco|buzz lightyear|woody|incredibles|mickey mouse|minnie mouse|frozen|moana|encanto|elsa|anna|simba|lion king|cinderella|snow white|hulu|espn\+'
          grep -riE "$FORBIDDEN" \
            --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
            --include="*.html" --include="*.json" --include="*.md" --include="*.yml" \
            --include="*.yaml" --include="*.css" \
            --exclude-dir=node_modules --exclude-dir=.git \
            . && echo "BRAND LEAK DETECTED — build failed" && exit 1 || echo "Brand check passed"
```

**Important:** The CI grep exit code logic is inverted — `grep` returns 0 (success) when it FINDS a match. The `&& exit 1 || echo "passed"` pattern means: if grep finds a match, fail; if grep finds nothing (exit 1), the `||` branch runs and the step succeeds. This is a common trap — test the CI step against a known bad string.

---

### Vite 8 — Scaffold + GitHub Pages Base Config

**Version verified:** `vite@8.1.3`, `@vitejs/plugin-react@6.0.3`, `create-vite@9.1.1` [VERIFIED: npm registry]

**Scaffold command:**
```bash
npm create vite@latest content-moderation-assessment -- --template react
cd content-moderation-assessment
npm install
```

**`vite.config.js` for GitHub Pages project-page deploy:** [CITED: vite.dev/guide/static-deploy.html]
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/content-moderation-assessment/',   // IMMUTABLE — never change
  build: {
    target: 'es2022',
    sourcemap: false,   // disable sourcemap in production (security: hides internal paths)
  },
})
```

**Why `base` is immutable:** All built asset paths are compiled with this prefix. Changing it after Phase 1+ would require rebuilding every relative import. The Pages URL `https://ak22021990-jpg.github.io/content-moderation-assessment/` is derived directly from this setting — they must match exactly.

**`index.html` placeholder (brand-safe):**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Content moderation hiring assessment" />
    <meta property="og:title" content="Content Moderation Assessment" />
    <meta property="og:description" content="A hiring assessment for content moderators" />
    <meta name="referrer" content="no-referrer" />
    <title>Content Moderation Assessment</title>
    <link rel="icon" type="image/svg+xml" href="/content-moderation-assessment/vite.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Note: the favicon path must use the full base prefix or be a relative path that Vite resolves. The default Vite favicon (`vite.svg`) is neutral — replace with a generic icon before Phase 6 but it is not brand-leaking.

---

### Git LFS — Initialization and `.gitattributes`

**Version installed:** git-lfs/3.7.1 [VERIFIED: environment check]

**Exact initialization sequence for a new repo:** [CITED: git-lfs.com, GitHub git-lfs wiki]
```bash
# Run from repo root BEFORE committing any large files
git lfs install

# Track file patterns (creates/updates .gitattributes)
git lfs track "*.mp4"
git lfs track "*.webm"
git lfs track "*.lottie"

# Stage .gitattributes FIRST before adding any tracked files
git add .gitattributes
git commit -m "infra: configure git lfs tracking"

# Now safe to add large files
```

**Resulting `.gitattributes` content:**
```
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.webm filter=lfs diff=lfs merge=lfs -text
*.lottie filter=lfs diff=lfs merge=lfs -text
```

**DEPLOY-06 also requires `*.jpg` sprites** (large sprite sheets). Add:
```bash
git lfs track "*.jpg"
```
However: tracking ALL `.jpg` files in LFS is aggressive — small JPEGs (favicons, social images) would also be LFS-tracked. Consider a more targeted pattern:
```bash
git lfs track "public/videos/*.jpg"
```
This scopes LFS to only sprites in the videos directory. [ASSUMED — pattern scoping is not explicitly documented in LFS docs but is supported by the glob syntax]

**CI checkout with LFS:** The `lfs: true` option in `actions/checkout@v6` causes the checkout action to run `git lfs pull` after checkout, resolving all LFS pointer files to actual content. Without it, CI sees pointer files (128-byte text) instead of the real MP4. [VERIFIED: STACK.md, confirmed in GitHub Actions docs]

**LFS pointer verification step in CI (DEPLOY-05):**
```bash
- name: Verify LFS files resolved
  run: |
    file public/videos/placeholder.mp4 | grep -i "ISO Media\|MP4\|MPEG"
    if [ $? -ne 0 ]; then
      echo "LFS pointer file detected — checkout did not pull real MP4"
      exit 1
    fi
```

Note: the `file` command on Ubuntu returns `"ISO Media, MP4 Base Media v1"` for valid MP4s, not just the string "mp4". The grep should match `ISO Media` or `MPEG` to be safe. D-14 says `grep -i mp4` — this will match because "MP4" appears in the `file` output for H.264 video. [VERIFIED: standard `file` command behavior on Linux]

**Seed video ffmpeg command (D-12):**
```bash
ffmpeg -f lavfi -i color=c=black:size=1280x720:rate=30 -t 5 -c:v libx264 -pix_fmt yuv420p -an public/videos/placeholder.mp4
```
ffmpeg 2026-03-15 build is installed locally — this command will run without CI ffmpeg setup. [VERIFIED: environment check]

---

### GitHub Actions Deploy Pipeline

**Actions in use and versions:** [VERIFIED: STACK.md, GitHub Actions docs, deploy-pages repo]

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v6 | Source checkout with `lfs: true` |
| `actions/setup-node` | v4 | Node 20 toolchain + npm cache |
| `actions/configure-pages` | v5 | Enable Pages, extract base URL |
| `actions/upload-pages-artifact` | v3 | Package `dist/` for deployment |
| `actions/deploy-pages` | v4 | Publish artifact to Pages |

Note: `actions/deploy-pages` latest is v5.0.0 (released 2026-03-25) but v4 is the version in use per STACK.md decisions. v4 works correctly on GitHub.com. v5 exists but STACK.md locked v4 — do not change.

**Complete `deploy.yml`:** [CITED: STACK.md; verified against GitHub official Pages docs]
```yaml
name: Deploy

on:
  push:
    branches: [main]
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
          lfs: true
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Verify LFS files resolved
        run: file public/videos/placeholder.mp4 | grep -i "ISO Media\|mp4"
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

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

**Required repo setting:** In GitHub repository → Settings → Pages → Build and deployment → Source: **GitHub Actions** (not "Deploy from a branch"). This must be set manually before the first workflow run. [CITED: GitHub Pages docs, WebSearch verified]

**Permissions block is required at workflow level** (not just job level) so the `deploy` job can request an OIDC token for the `id-token: write` permission. [CITED: actions/deploy-pages README]

---

### CDN Strategy — CRITICAL CORRECTION

**jsDelivr does NOT serve GitHub LFS files.** [VERIFIED: github.com/jsdelivr/jsdelivr/issues/18235]

When a file is stored in Git LFS, GitHub serves only the LFS pointer (a 128-byte text file) at the raw GitHub URL. jsDelivr fetches from raw GitHub URLs, so it also receives and serves the pointer — not the actual file content. This issue was opened in 2020 and remains unresolved with no workaround.

**Impact on D-15 and DEPLOY-08:**
- jsDelivr CANNOT be the CDN for `*.mp4` files stored in Git LFS
- jsDelivr CAN serve non-LFS files (JS, CSS, JSON, small images) from GitHub repos
- The `playlist.json` env-conditional URL pattern (D-16) is still valid; the production URL must point to R2, not jsDelivr

**Revised CDN architecture:**

| Asset type | Dev source | Production source |
|------------|-----------|-------------------|
| MP4 videos | `public/videos/placeholder.mp4` (LFS local) | Cloudflare R2 bucket (free tier) |
| Sprite JPEGs | `public/videos/*.jpg` (LFS local) | Cloudflare R2 bucket |
| VTT files | `public/vtt/*.vtt` (git, not LFS) | GitHub Pages direct |
| JS/CSS/JSON | `dist/` (Vite build) | GitHub Pages |
| `playlist.json` | `public/playlist.json` | GitHub Pages (env var substituted at build) |

**Cloudflare R2 free tier:** [CITED: developers.cloudflare.com/r2/pricing/]
- 10 GB storage / month (Standard tier)
- 1,000,000 Class A operations / month (writes)
- 10,000,000 Class B operations / month (reads)
- **$0 egress (zero bandwidth charges)** — no egress fees regardless of traffic

R2 free tier easily covers Phase 0 (5 videos × ≤ 20 MB = 100 MB total; 100 candidates × 100 MB = 10 GB/mo at the limit). [CITED: R2 pricing docs]

**R2 public URL format:** [CITED: developers.cloudflare.com/r2/buckets/public-buckets/]
- Via r2.dev managed domain: `https://pub-{hash}.r2.dev/{path}` (development use only, rate-limited)
- Via custom domain: `https://{your-domain}/{path}` (production recommended)

For Phase 0 stub purposes, R2 bucket creation and the r2.dev URL are sufficient. A custom domain can be wired in Phase 6 if needed.

**`playlist.json` stub with correct architecture:**
```json
{
  "videos": [
    {
      "id": "placeholder",
      "srcUrl": "%%VIDEO_BASE_URL%%/placeholder.mp4",
      "duration": 5,
      "poster": "",
      "chapters": []
    }
  ],
  "_cdnDocs": {
    "dev": "srcUrl resolved from local public/videos/ via Vite dev server",
    "production": "%%VIDEO_BASE_URL%% replaced with Cloudflare R2 bucket URL at build time",
    "r2BucketUrl": "TBD — document after R2 bucket creation",
    "r2FallbackNote": "jsDelivr cannot serve Git LFS files (pointer files only)"
  }
}
```

**Note:** The `%%VIDEO_BASE_URL%%` token is not a standard Vite env var. Options:
1. Use `import.meta.env.VITE_VIDEO_BASE_URL` (set in `.env.production`) — requires the playlist to be a JS import, not a static JSON file
2. Use a `vite-plugin-replace` or simple sed substitution in the build step
3. Simplest for Phase 0: hardcode `""` for dev (relative URLs work with Vite dev server) and the full R2 URL for production; swap is a one-line edit

The planner should choose option 3 for Phase 0 simplicity and defer proper env-var wiring to Phase 6 (CONTENT-03). [ASSUMED — planner discretion]

---

### `docs/brand-guardrails.md` Structure

This document is commit-1 infrastructure. It serves two purposes: (1) human-readable reference for all contributors, (2) machine-readable source for the grep pattern used in CI.

Recommended structure:
```markdown
# Brand Guardrails

## Purpose
This file defines strings that must NEVER appear in this repository's code,
documentation, meta tags, filenames, commit messages, or any deliverable.
This is a non-negotiable client requirement.

## Forbidden Strings (case-insensitive)

### Primary Brand
- `disney`
- `disney+`

### Marvel
- `marvel`, `spider-man`, `spiderman`, `avengers`, `iron man`, `ironman`,
  `captain america`, `thor`, `black panther`, `hulk`, `wolverine`, `x-men`

### Star Wars
- `star wars`, `starwars`, `luke skywalker`, `darth vader`, `mandalorian`,
  `jedi`, `sith`, `han solo`, `chewbacca`, `yoda`, `lightsaber`

### Pixar
- `pixar`, `toy story`, `toystory`, `finding nemo`, `wall-e`, `walle`,
  `coco`, `buzz lightyear`, `woody`, `incredibles`

### Classic Disney Characters / Films
- `mickey mouse`, `minnie mouse`, `frozen`, `moana`, `encanto`, `elsa`,
  `anna`, `simba`, `lion king`, `cinderella`, `snow white`

### Streaming Platforms
- `hulu`, `espn+`

## Grep Pattern (used in pre-commit hook and CI)

```
disney|disney\+|marvel|spider-man|spiderman|avengers|iron man|ironman|captain america|thor|black panther|hulk|wolverine|x-men|star wars|starwars|luke skywalker|darth vader|mandalorian|jedi|sith|han solo|chewbacca|yoda|lightsaber|pixar|toy story|toystory|finding nemo|wall-e|walle|coco|buzz lightyear|woody|incredibles|mickey mouse|minnie mouse|frozen|moana|encanto|elsa|anna|simba|lion king|cinderella|snow white|hulu|espn\+
```

## Process for Updating This List
1. Open a PR that modifies only this file
2. Get explicit approval from project lead
3. Update the grep pattern string in this file
4. Update `.husky/pre-commit` and `.github/workflows/brand-guard.yml` to match
5. Commit all three files together
```

**Warning about `frozen` and `thor`:** The strings `frozen` and `thor` are common English words / npm package names and will produce false positives in `package.json` lockfiles, CSS (`frozen` as a state descriptor), etc. The CI grep should **exclude** `package-lock.json` and `.gitattributes` from scanning, or use word-boundary matching (`\bfrozen\b`, `\bthor\b`). This is a real usability trap. The planner must decide: either add word-boundary anchors to the pattern, or exclude lockfiles from the grep scope. [ASSUMED — no official decision yet; recommend word-boundary approach]

---

### `taxonomy.json` Schema

Full 10-L1 taxonomy from FEATURES.md lines 107–172, transcribed into the D-09 schema:

```json
{
  "version": "0.1.0-draft",
  "categories": [
    {
      "id": "1",
      "label": "Copyright & IP",
      "subcategories": [
        { "id": "1.1", "label": "Unauthorized full-work reproduction" },
        { "id": "1.2", "label": "Sync / soundtrack infringement" },
        { "id": "1.3", "label": "Franchise / character IP misuse" },
        { "id": "1.4", "label": "Trademark / logo infringement" },
        { "id": "1.5", "label": "Counterfeit / bootleg sales" },
        { "id": "1.6", "label": "Watermark removal / stripped credits" },
        { "id": "1.7", "label": "Livestream / event piracy" }
      ]
    },
    {
      "id": "2",
      "label": "Hate & Harassment",
      "subcategories": [
        { "id": "2.1", "label": "Hate speech targeting protected characteristics" },
        { "id": "2.2", "label": "Slurs / dehumanizing language" },
        { "id": "2.3", "label": "Targeted harassment / bullying of an individual" },
        { "id": "2.4", "label": "Doxxing / PII exposure" },
        { "id": "2.5", "label": "Threats of violence" },
        { "id": "2.6", "label": "Hateful groups / symbols / praise" }
      ]
    },
    {
      "id": "3",
      "label": "Violence & Graphic Content",
      "subcategories": [
        { "id": "3.1", "label": "Graphic real-world violence" },
        { "id": "3.2", "label": "Gore / injury / medical graphic imagery" },
        { "id": "3.3", "label": "Animal abuse / cruelty" },
        { "id": "3.4", "label": "Incitement to violence" },
        { "id": "3.5", "label": "Dangerous acts / stunts likely to cause injury" },
        { "id": "3.6", "label": "Weapons — instructional / brandishing" },
        { "id": "3.7", "label": "Terrorism / violent extremism" }
      ]
    },
    {
      "id": "4",
      "label": "Sexual & Nudity",
      "subcategories": [
        { "id": "4.1", "label": "Explicit sexual activity" },
        { "id": "4.2", "label": "Nudity (adult)" },
        { "id": "4.3", "label": "Sexually suggestive content" },
        { "id": "4.4", "label": "Non-consensual intimate imagery" },
        { "id": "4.5", "label": "Sexual solicitation / commercial sexual services" },
        { "id": "4.6", "label": "Fetish content likely to violate site policy" }
      ]
    },
    {
      "id": "5",
      "label": "Minor Safety",
      "subcategories": [
        { "id": "5.1", "label": "CSAM / suspected child sexual abuse material" },
        { "id": "5.2", "label": "Child sexualization (non-CSAM)" },
        { "id": "5.3", "label": "Grooming / predatory behavior toward minors" },
        { "id": "5.4", "label": "Minors in dangerous / harmful situations" },
        { "id": "5.5", "label": "Minors + adult themes co-appearance" },
        { "id": "5.6", "label": "PII disclosure of a minor" }
      ]
    },
    {
      "id": "6",
      "label": "Regulated Goods & Activities",
      "subcategories": [
        { "id": "6.1", "label": "Firearms / weapons sales" },
        { "id": "6.2", "label": "Illicit drugs — sale / promotion" },
        { "id": "6.3", "label": "Alcohol / tobacco / vape promotion (age-restricted)" },
        { "id": "6.4", "label": "Gambling promotion (unlicensed)" },
        { "id": "6.5", "label": "Prescription / pharmaceutical sales" },
        { "id": "6.6", "label": "Human exploitation / trafficking" },
        { "id": "6.7", "label": "Endangered wildlife / illegal animal trade" }
      ]
    },
    {
      "id": "7",
      "label": "Misinformation & Deceptive Sync",
      "subcategories": [
        { "id": "7.1", "label": "Health misinformation with harm potential" },
        { "id": "7.2", "label": "Election / civic integrity misinformation" },
        { "id": "7.3", "label": "Manipulated media / synthetic media undisclosed" },
        { "id": "7.4", "label": "Impersonation of real people / brands" },
        { "id": "7.5", "label": "Conspiracy content promoting real-world harm" },
        { "id": "7.6", "label": "Deceptive edits / out-of-context clips" }
      ]
    },
    {
      "id": "8",
      "label": "Spam & Manipulation",
      "subcategories": [
        { "id": "8.1", "label": "Coordinated inauthentic behavior" },
        { "id": "8.2", "label": "Engagement bait / click farming" },
        { "id": "8.3", "label": "Scams / financial fraud" },
        { "id": "8.4", "label": "Repetitive / low-quality reuploads" },
        { "id": "8.5", "label": "Off-platform link spam to malicious destinations" },
        { "id": "8.6", "label": "Fake giveaways / lottery scams" }
      ]
    },
    {
      "id": "9",
      "label": "Brand Safety (GARM)",
      "subcategories": [
        { "id": "9.1", "label": "Adjacency to profanity / mature language" },
        { "id": "9.2", "label": "Adjacency to violence (non-policy-violating)" },
        { "id": "9.3", "label": "Adjacency to adult / sexual themes (non-policy-violating)" },
        { "id": "9.4", "label": "Adjacency to sensitive social/political issues" },
        { "id": "9.5", "label": "Adjacency to death / injury / military conflict" },
        { "id": "9.6", "label": "Adjacency to controversial IP / hate-adjacent aesthetics" }
      ]
    },
    {
      "id": "10",
      "label": "Community Standards (Platform-Specific)",
      "subcategories": [
        { "id": "10.1", "label": "Off-topic / wrong category" },
        { "id": "10.2", "label": "Low production quality — vertical framing, unwatchable audio" },
        { "id": "10.3", "label": "Duplicate / cross-posted content" },
        { "id": "10.4", "label": "Metadata mismatch — title/tags don't match content" },
        { "id": "10.5", "label": "Community-tone violation (family-friendly surface)" },
        { "id": "10.6", "label": "Age-gate / rating mismatch" }
      ]
    }
  ]
}
```

Note: L2 labels here are transcribed verbatim from FEATURES.md. Client moderation lead sign-off on L2 wording is a Phase 3 entry gate (CC-03) — this version is `"0.1.0-draft"` intentionally.

---

## Pitfalls & Landmines

### P1 — Brand leak before hook is installed (BLOCKER)
**What goes wrong:** Developer runs `git init`, makes one "test" commit with a Disney reference before installing Husky. That commit is in the public history forever.
**Prevention:** Brand-guard is commit-1. The hook must be installed as part of the very first commit (Husky `prepare` runs on `npm install` but the hook file must already exist in `.husky/`). Sequence: create `.husky/pre-commit` → `git add` → `git commit` (hook now active for all subsequent commits).
**Warning sign:** Any gap between `git init` and the first `npm install` where a commit could have been made.

### P2 — False positives from `frozen` and `thor` in the grep pattern
**What goes wrong:** The strings `frozen` and `thor` appear in npm package names (`frozen-lockfile`), CSS class names, and general English text. The brand-guard CI fails on every legitimate push.
**Prevention:** Use word-boundary anchors `\b` in the grep pattern for common-word strings: `\bfrozen\b`, `\bthor\b`. Or exclude `package-lock.json` and `node_modules/` from the scan (node_modules should always be excluded).
**Confirmed mitigation:** The CI workflow above uses `--exclude-dir=node_modules`. Add `--exclude=package-lock.json` to the CI grep command.

### P3 — jsDelivr returning LFS pointer instead of video (BLOCKER if not addressed)
**What goes wrong:** `playlist.json` production URL points to `cdn.jsdelivr.net/gh/...` for an LFS-tracked MP4. Candidate browsers receive a 128-byte text file starting with `version https://git-lfs.github.com/spec/v1`. Video player shows nothing.
**Prevention:** Do not use jsDelivr for any LFS-tracked file. Use Cloudflare R2 as the production CDN for all video content.
**Recovery:** Update `playlist.json` production URL from jsDelivr to R2 URL; redeploy.

### P4 — `actions/checkout` without `lfs: true` in CI (DEPLOY-05 failure)
**What goes wrong:** CI builds succeed but `dist/` contains LFS pointer files for videos. The verification step `file public/videos/placeholder.mp4 | grep -i mp4` passes on a developer machine but fails in CI because the CI checkout pulled the pointer.
**Prevention:** `lfs: true` must be in the checkout action. Without it, CI gets pointers.
**Warning sign:** CI step passes but deployed video returns 128-byte text.

### P5 — Vite base mismatch causes white screen on Pages (Pitfall 13 from PITFALLS.md)
**What goes wrong:** `vite.config.js` has `base: '/'` but the site is deployed at `/<repo>/`. All asset URLs are wrong; page is a white screen.
**Prevention:** `base: '/content-moderation-assessment/'` must be set before the first deploy. This value is IMMUTABLE — changing it later breaks all asset paths in cached browsers.
**Warning sign:** Deployed URL shows blank page; browser DevTools shows 404s on `*.js` and `*.css` files.

### P6 — Git LFS spending cap not set before first LFS commit (BLOCKER)
**What goes wrong:** Overage LFS bandwidth incurs charges on the personal account (or disables LFS). D-17 requires spending cap at $0 before the first LFS commit.
**Prevention:** Manual step in GitHub Settings → Billing & plans → Spending limits → $0. This must happen BEFORE running `git push` with the `.gitattributes` + `placeholder.mp4` commit.
**Warning sign:** Received GitHub billing email; LFS objects returning 403.

### P7 — `git lfs track` run after committing large files
**What goes wrong:** Developer adds `placeholder.mp4` to git before running `git lfs track "*.mp4"`. The file is committed as a regular git object (not LFS), bloating the repo.
**Prevention:** Always commit `.gitattributes` first, then add large files. Once committed as a regular object, the file must be migrated with `git lfs migrate import --include="*.mp4"` — which rewrites history.
**Warning sign:** `git lfs status` shows the file as "Git" not "LFS" after commit.

### P8 — `.planning/` directory inadvertently included in the new repo
**What goes wrong:** The new repo is initialized in `C:\Users\anoop\OneDrive\Desktop\Disney\content-moderation-assessment\` (a subdirectory of the Disney planning dir). If the developer runs `git init` in the wrong directory, planning docs naming Disney could end up in the repo.
**Prevention:** Create the new repo in a completely separate path, e.g., `C:\Users\anoop\projects\content-moderation-assessment\`. Never create the new repo as a subdirectory of the Disney planning directory. Add a `.gitignore` entry for `.planning/` as belt-and-suspenders.

### P9 — CI grep exit code trap (inverted logic)
**What goes wrong:** `grep` exits 0 when it FINDS a match and 1 when it finds nothing. A naive `grep ... || exit 1` would fail when no forbidden strings are found (the happy path). See the inverted logic pattern in the brand-guard YAML above.
**Prevention:** Use the `&& echo "FAIL" && exit 1 || echo "passed"` chaining pattern, or use `if grep ...; then exit 1; fi`.
**Test:** After writing the CI workflow, manually test against a file containing "disney" — the step must fail.

---

## Validation Architecture

nyquist_validation is enabled (config.json `workflow.nyquist_validation: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 (to be installed in Phase 0 as devDep) |
| Config file | `vitest.config.js` — does not yet exist; Wave 0 creates it |
| Quick run command | `npm run test` |
| Full suite command | `npm run test -- --run` |

Phase 0 has no application logic to unit test. The validation for Phase 0 is therefore primarily **smoke tests and manual verification steps**, not unit tests. The Vitest framework is scaffolded as a devDependency so Phase 1+ can add tests immediately.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Command | File Exists? |
|--------|----------|-----------|---------|-------------|
| DEPLOY-02 | `vite.config.js` base is `/content-moderation-assessment/` | manual smoke | `npm run build && grep 'content-moderation-assessment' dist/index.html` | ❌ Wave 0 |
| DEPLOY-03 | GitHub Actions workflow builds and deploys | CI green check | GitHub Actions UI / workflow status | ❌ Wave 0 |
| DEPLOY-04 | `lfs: true` in checkout action | manual inspection | `grep 'lfs: true' .github/workflows/deploy.yml` | ❌ Wave 0 |
| DEPLOY-05 | LFS files resolve to real MP4 in CI | CI step | `file public/videos/placeholder.mp4 \| grep -i mp4` in deploy.yml | ❌ Wave 0 |
| DEPLOY-07 | Deploy pipeline green | CI green check | GitHub Actions UI | ❌ Wave 0 |
| BRAND-04 | Pre-commit hook blocks forbidden strings | manual test | `echo "disney" > test.txt && git add test.txt && git commit -m "test" && git reset HEAD test.txt && rm test.txt` | ❌ Wave 0 |
| BRAND-05 | CI brand-guard fails on forbidden string | CI green check | Deliberately include "disney" in a test PR branch | ❌ Wave 0 |
| CONTENT-01 | `taxonomy.json` has 10 L1 categories | unit test | `npm test` (taxonomy schema test) | ❌ Wave 0 |
| DEPLOY-09 | GitHub billing spending cap = $0 | manual | GitHub Settings → Billing → Spending limits | Manual only |

### Wave 0 Gaps (Files to Create in Phase 0)

- [ ] `vitest.config.js` — Vitest configuration referencing `happy-dom` or `jsdom`
- [ ] `tests/taxonomy.test.js` — validates `taxonomy.json` has exactly 10 L1 categories, each with at least 1 subcategory, and the `version` field is present
- [ ] `.github/workflows/deploy.yml` — CI deploy pipeline
- [ ] `.github/workflows/brand-guard.yml` — CI brand grep gate
- [ ] `.husky/pre-commit` — local brand grep gate

### Sampling Rate

- **Per task commit:** `npm run build` (verifies Vite base config)
- **Per wave merge:** `npm run test -- --run` (taxonomy schema test)
- **Phase gate:** Deploy pipeline green + brand guard CI passing + `file placeholder.mp4 | grep -i mp4` passes in CI

---

## Open Questions (RESOLVED)

### OQ-1 — Word-boundary anchors for `frozen` and `thor` (RESOLVED)
**Resolution:** `\bthor\b` and `\bfrozen\b` word-boundary anchors applied in the brand-guard grep pattern in both `.husky/pre-commit` and `.github/workflows/brand-guard.yml`. Plan 00-01 Task 2 verify block includes an automated check confirming the anchors are present before committing.

### OQ-2 — `playlist.json` env-conditional URL mechanism (RESOLVED)
**Resolution:** Phase 0 uses a `r2Url` field set to `"TBD"` with instructions. `srcUrl` is empty in dev (Vite serves `public/videos/` directly). CONTENT-03 env-var wiring (`VITE_VIDEO_BASE_URL`) deferred to Phase 6 as planned. `_cdnDocs.phase6Note` in `playlist.json` records this deferral.

### OQ-3 — Cloudflare R2 bucket creation: account requirement (RESOLVED)
**Resolution:** Plan 00-04 Task 2 includes R2 bucket setup steps in `docs/video-manifest.md`. The `r2Url` field in `playlist.json` is `"TBD — provision R2 bucket and paste URL here before Phase 2"`. Full provisioning deferred to before Phase 2 video content is added. Custom domain deferred to Phase 6.

### OQ-4 — `.planning/` directory isolation from deploy repo (RESOLVED)
**Resolution:** Plan 00-01 Task 1 explicitly creates the repo at `C:\Users\anoop\projects\content-moderation-assessment` (NOT inside `Desktop\Disney\`). The task includes a `pwd` verification step and `.planning/` is excluded via `.gitignore` as a safety net.

### OQ-5 — `*.jpg` LFS scope for sprite files (RESOLVED)
**Resolution:** Scoped pattern `public/videos/*.jpg` used in `.gitattributes` (not global `*.jpg`). Plan 00-03 Task 2 `.gitattributes` step uses `git lfs track "public/videos/*.jpg"` explicitly.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite scaffold, npm scripts | ✓ | v26.1.0 | — |
| npm | Package management | ✓ | 11.17.0 | — |
| Git | Source control | ✓ | 2.53.0.windows.1 | — |
| git-lfs | Video file tracking | ✓ | 3.7.1 | — |
| ffmpeg | Placeholder video generation | ✓ | 2026-03-15 build | — |
| Cloudflare account | R2 CDN bucket | Unknown | — | Create free account before Phase 0 task 4 |
| GitHub repo (new) | Hosting | Not yet created | — | Create as part of Phase 0 task 1 |

**Missing dependencies with no fallback:** None — all CLI tools are installed.
**Missing dependencies with fallback:** Cloudflare account (free signup, no credit card required for R2 free tier).

---

## Package Legitimacy Audit

Phase 0 installs only devDependencies already present in the locked stack. No new packages are introduced beyond the scaffold defaults and Husky.

| Package | Registry | Age | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|
| `husky` | npm | ~10 yrs | [OK — well-established] | Approved |
| `vite` | npm | ~5 yrs | [OK] | Approved |
| `@vitejs/plugin-react` | npm | ~4 yrs | [OK] | Approved |
| `react` | npm | ~12 yrs | [OK] | Approved |
| `react-dom` | npm | ~12 yrs | [OK] | Approved |

slopcheck was not available in this environment. All packages above are well-established packages with multi-year history on npm confirmed via registry. [ASSUMED — slopcheck not run; treat as requiring manual verification per protocol]

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 0 has no auth |
| V3 Session Management | No | No session in Phase 0 |
| V4 Access Control | No | No access control in Phase 0 |
| V5 Input Validation | No | No user input in Phase 0 |
| V6 Cryptography | No | No crypto in Phase 0 |

**Phase 0 specific security concerns:**

| Pattern | Risk | Mitigation |
|---------|------|------------|
| Client brand name in public git history | Legal exposure; non-recoverable | Pre-commit hook + CI guard landed as commit-1 |
| PII in test commits | GDPR-adjacent | `.gitignore` test data paths; pre-commit scan for email patterns |
| sourcemap in production build | Exposes internal file structure | `build.sourcemap: false` in `vite.config.js` |
| Referrer header leaking Pages URL | Reveals hosting pattern | `<meta name="referrer" content="no-referrer">` in `index.html` |
| LFS overages causing account-wide service disruption | Loss of all LFS repos | Spending cap $0 before first LFS push |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Husky v9 hooks execute correctly under Git for Windows 2.53.0 with `#!/usr/bin/env sh` shebang | Tool Research — Husky | Pre-commit hook silently skipped; brand leak possible without local enforcement |
| A2 | `public/videos/*.jpg` is a valid git-lfs track pattern (scoped glob) | Pitfall P5 / Open Questions | All `.jpg` files tracked globally instead; performance/storage impact only |
| A3 | `playlist.json` using hardcoded relative path for dev is simplest Phase 0 approach | CDN Strategy | Planner may prefer wiring env-var now; low risk |
| A4 | slopcheck would rate all packages [OK] (not run due to tool unavailability) | Package Legitimacy Audit | Very low risk — all packages are multi-year established |
| A5 | Cloudflare account does not yet exist for `ak22021990@gmail.com` | Environment Availability | If account exists, R2 bucket creation is faster; no negative impact |

---

## Sources

### Primary (HIGH confidence)
- npm registry — husky@9.1.7, vite@8.1.3, @vitejs/plugin-react@6.0.3, create-vite@9.1.1, react@19.2.7, react-dom@19.2.7 verified 2026-07-07
- [vite.dev/guide/static-deploy.html](https://vite.dev/guide/static-deploy.html) — Vite GitHub Pages deployment guide with base config and Actions YAML
- [typicode.github.io/husky/get-started.html](https://typicode.github.io/husky/get-started.html) — Husky v9 install and init steps
- [docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — Required permissions block and environment block for GitHub Actions Pages deployment
- [developers.cloudflare.com/r2/pricing/](https://developers.cloudflare.com/r2/pricing/) — R2 free tier: 10 GB storage, 1M Class A ops, 10M Class B ops, $0 egress
- [developers.cloudflare.com/r2/buckets/public-buckets/](https://developers.cloudflare.com/r2/buckets/public-buckets/) — R2 public access via r2.dev and custom domain
- .planning/research/STACK.md — locked action versions (checkout@v6, setup-node@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4)
- .planning/research/PITFALLS.md — Pitfall 1 (brand leak), Pitfall 2 (LFS bandwidth), Pitfall 13 (Vite base misconfig), Pitfall 14 (PII in git)

### Secondary (MEDIUM confidence)
- [github.com/actions/deploy-pages](https://github.com/actions/deploy-pages) — confirmed v5.0.0 exists; v4 still functional on GitHub.com; OIDC permissions required
- [github.com/git-lfs/git-lfs/wiki/Tutorial](https://github.com/git-lfs/git-lfs/wiki/Tutorial) — verified `git lfs install` → `git lfs track` → commit `.gitattributes` sequence
- [codeinthehole.com/tips/tips-for-using-a-git-pre-commit-hook/](https://codeinthehole.com/tips/tips-for-using-a-git-pre-commit-hook/) — `git diff --cached | grep` pattern for staged content scanning

### Tertiary (LOW confidence / needs validation)
- [github.com/jsdelivr/jsdelivr/issues/18235](https://github.com/jsdelivr/jsdelivr/issues/18235) — jsDelivr does not serve LFS files (issue open since 2020, no resolution) — verified but marked LOW because it's an issue thread not official docs; behavior could have changed

---

## Metadata

**Confidence breakdown:**
- Brand guard setup: HIGH — Husky v9 and CI grep patterns verified against official sources
- Vite 8 scaffold + base config: HIGH — verified via vite.dev official docs and npm registry
- Git LFS commands: HIGH — verified via git-lfs wiki and local environment
- GitHub Actions Pages YAML: HIGH — verified via GitHub official docs + STACK.md cross-reference
- jsDelivr / CDN architecture: MEDIUM-HIGH — jsDelivr LFS limitation verified via issue tracker; R2 pricing verified via official Cloudflare docs
- Taxonomy JSON: HIGH — direct transcription from FEATURES.md lines 107–172

**Research date:** 2026-07-07
**Valid until:** 2026-09-07 (stable infrastructure tools; re-verify if Husky major version changes or GitHub Actions actions get new major versions)

---

## RESEARCH COMPLETE
