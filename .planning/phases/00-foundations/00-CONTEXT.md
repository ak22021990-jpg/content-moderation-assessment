# Phase 0: Foundations — Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a deployable, brand-safe shell: new public GitHub repo with generic name; pre-commit + CI brand-guard grep gate blocking all Disney IP strings; `taxonomy.json` with full 10 L1 + L2 placeholder list committed; ffmpeg-generated placeholder MP4 in Git LFS verifying LFS retrieval works end-to-end; GitHub Pages deploy pipeline green; jsDelivr CDN stub documented in `playlist.json`. No UI components. No React app yet beyond Vite scaffold.

</domain>

<decisions>
## Implementation Decisions

### Repo Identity
- **D-01:** Repo name: `content-moderation-assessment` under `ak22021990-jpg` personal account.
- **D-02:** Pages URL: `https://ak22021990-jpg.github.io/content-moderation-assessment/`
- **D-03:** Vite `base` in `vite.config.js` MUST be `/content-moderation-assessment/` — required for asset resolution on GitHub Pages subdirectory.

### Brand Guard (O-10 resolved)
- **D-04:** Forbidden strings stored in `docs/brand-guardrails.md`. Grep is case-insensitive (`-i`). Gate runs in two places: `.husky/pre-commit` (local) and `.github/workflows/brand-guard.yml` (CI, fails PR on match).
- **D-05:** Primary brand string: `disney` (covers Disney, Disney+, DISNEY — case-insensitive).
- **D-06:** Franchise clusters to block (case-insensitive):
  - **Marvel:** `marvel`, `spider-man`, `spiderman`, `avengers`, `iron man`, `ironman`, `captain america`, `thor`, `black panther`, `hulk`, `wolverine`, `x-men`
  - **Star Wars:** `star wars`, `starwars`, `luke skywalker`, `darth vader`, `mandalorian`, `jedi`, `sith`, `han solo`, `chewbacca`, `yoda`, `lightsaber`
  - **Pixar:** `pixar`, `toy story`, `toystory`, `finding nemo`, `wall-e`, `walle`, `coco`, `buzz lightyear`, `woody`, `incredibles`
  - **Classic Disney:** `mickey mouse`, `minnie mouse`, `frozen`, `moana`, `encanto`, `elsa`, `anna`, `simba`, `lion king`, `cinderella`, `snow white`
  - **Streaming/Platforms:** `disney\+`, `hulu`, `espn\+`
- **D-07:** `docs/brand-guardrails.md` is the single source of truth; the CI grep reads the regex from that file (or the workflow inlines the pattern from there). This doc must be commit-1 infrastructure — created before any other file in the repo.

### Taxonomy Schema
- **D-08:** Use the research-synthesized 10-L1 industry taxonomy from `.planning/research/FEATURES.md` (lines 107–172). Full L2 list included as placeholders. L2 wording subject to client moderation lead sign-off (CC-03 gate at Phase 3 entry — do NOT block Phase 0 on this).
- **D-09:** File: `src/data/taxonomy.json` (inside `src/data/` not `public/` — bundled, not publicly fetchable as a raw endpoint). Schema:
  ```json
  {
    "version": "0.1.0-draft",
    "categories": [
      { "id": "1", "label": "Copyright & IP", "subcategories": [ ... ] },
      ...
    ]
  }
  ```
- **D-10:** `taxonomyVersion` string (`"0.1.0-draft"`) included in the root JSON — used in Phase 5 submission payload.

### Seed Video (LFS Verification)
- **D-11:** Seed video is a ffmpeg-generated 5-second placeholder (color bar or black frame, 1280×720, H.264, AAC silence). NOT the final V1 assessment clip — that comes in Phase 2.
- **D-12:** Generate command: `ffmpeg -f lavfi -i color=c=black:size=1280x720:rate=30 -t 5 -c:v libx264 -pix_fmt yuv420p -an public/videos/placeholder.mp4`
- **D-13:** `.gitattributes` must track `*.mp4 filter=lfs diff=lfs merge=lfs -text` before this file is committed. ffmpeg is installed locally — no CI ffmpeg setup needed for this step.
- **D-14:** CI verification step: `file public/videos/placeholder.mp4 | grep -i mp4` — must pass to confirm LFS retrieval returned a real file, not a pointer.

### CDN Stub
- **D-15 (revised 2026-07-08):** Cloudflare R2 is the production video CDN (O-03 revised). jsDelivr cannot serve GitHub LFS files — it fetches raw GitHub URLs which return the 128-byte LFS pointer, not the binary (confirmed open issue, unfixed since 2020). `playlist.json` has an `r2Url` field for production and a `_cdnDocs` block documenting R2 setup. Dev: `srcUrl` is empty (Vite dev server serves `public/videos/` directly). Production: set `srcUrl` to the R2 `r2.dev` URL after bucket provisioning. No jsDelivr video URL appears in any configuration file.
- **D-16:** `playlist.json` stub structure (one entry for placeholder, to be replaced in Phase 2):
  ```json
  {
    "videos": [
      { "id": "placeholder", "srcUrl": "PLACEHOLDER", "duration": 5, "poster": "", "chapters": [] }
    ]
  }
  ```

### GitHub Billing
- **D-17:** Billing spending cap must be verified at $0 before the first LFS commit. Planner must include a manual step: GitHub Settings → Billing & plans → Spending limits → set to $0. Not yet confirmed by user.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Decisions & Constraints
- `.planning/PROJECT.md` — project scope, non-negotiables, brand rule, tech decisions
- `.planning/STATE.md` — locked stack decisions (React 19.2 + Vite 8 + pinned versions), non-negotiables
- `.planning/REQUIREMENTS.md` — Phase 0 REQ-IDs: DEPLOY-01–09, BRAND-01–08, CONTENT-01, CONTENT-04, CONTENT-07; open decisions O-01–O-10

### Phase 0 Deliverables
- `.planning/ROADMAP.md` §"Phase 0" — 5 success criteria that must all be TRUE for phase close
- `.planning/research/STACK.md` — pinned package versions (Vite 8, React 19.2, etc.) — use exact versions
- `.planning/research/PITFALLS.md` — pitfall-to-phase mapping; check Phase 0 rows before planning

### Taxonomy
- `.planning/research/FEATURES.md` lines 107–172 — full L1/L2 taxonomy table to transcribe into `taxonomy.json`
- `.planning/research/FEATURES.md` lines 231–250 — ground-truth answer key JSON schema (for reference; answer keys land in Phase 4 but schema informs taxonomy structure)

### Cross-Cutting Concerns
- `.planning/ROADMAP.md` §"Cross-Cutting Concerns Map" — CC-01 (brand guard), CC-02 (video parallel track), CC-05 (CDN fallback) all land here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — Phase 0 creates the repo from scratch.

### Established Patterns
- `flagmail1` reference implementation at `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1` — scoreboard, Lottie, useTimer patterns. Relevant to Phases 2–4, not Phase 0. Note for downstream phases.

### Integration Points
- `vite.config.js` `base` must be `/content-moderation-assessment/` from commit 1 — every subsequent phase inherits this.
- `src/data/taxonomy.json` path must be stable from Phase 0 — Phase 1 Guidelines and Phase 3 TagPanel both import it.
- `public/videos/` is the LFS-tracked video directory — Phase 2 adds real clips here.

</code_context>

<specifics>
## Specific Ideas

- Brand guard should be commit-1 (the very first commit to the new repo) per CC-01 — pre-commit hook and CI workflow go in before any source code.
- `docs/brand-guardrails.md` format: a human-readable regex table + the raw grep pattern string so CI can source it directly. Keep the pattern maintainable — one alternation group per franchise cluster.
- Placeholder video filename: `placeholder.mp4` (renamed to `v1.mp4` in Phase 2 when real V1 is sourced).
- Phase 0 GitHub Actions deploy shows a generic `<title>Content Moderation Assessment</title>` placeholder page — no React app yet, just `index.html` with that string and zero franchise references.

</specifics>

<deferred>
## Deferred Ideas

- Real V1 assessment clip (CC0 Pexels dancing + copyright overlay) — Phase 2
- V2–V5 video sourcing — Phases 2–4 (one clip per phase, CC-02 parallel track)
- Vite scaffold with React + Zustand + media-chrome install — technically Phase 1 setup, but can be done at end of Phase 0 as a bonus if time allows; planner can decide
- Cloudflare R2 provisioning — defer until a clip exceeds 50 MB (O-03 resolution); Phase 0 only documents R2 as a named swap target

</deferred>

---

*Phase: 0-Foundations*
*Context gathered: 2026-07-07*
