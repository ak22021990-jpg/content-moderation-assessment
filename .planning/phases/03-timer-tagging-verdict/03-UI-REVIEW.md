---
phase: 3
slug: timer-tagging-verdict
review_type: retroactive-ui-audit
audited: 2026-07-09
against: 02-UI-SPEC.md (Phase 2 dark-cinematic contract) + user brief
overall_score: 14 / 24
verdict: BLOCK — layout + player size + aesthetic drift do not match plan
---

# Phase 3 — UI-REVIEW

> Retroactive 6-pillar audit of the assessment runner (`RunnerScreen` + wrapped `VideoPlayerScreen` + tag panel + verdict). Triggered by user brief: "scrollable, desktop only; video player is too big; should look like a modern audit video player."

---

## Scorecard

| Pillar | Score | Verdict |
|---|---|---|
| 1. Copywriting | 3 / 4 | Pass with drift |
| 2. Visuals | 2 / 4 | BLOCK — candy-glass fights "audit" mental model |
| 3. Color | 2 / 4 | BLOCK — cinematic dark contract abandoned |
| 4. Typography | 3 / 4 | Pass |
| 5. Spacing / Layout | 1 / 4 | BLOCK — no scroll strategy, video stretches |
| 6. Experience Design | 3 / 4 | Passes with the video-size regression |

**Overall: 14 / 24 — BLOCK.** Three of six pillars fail because the assessment runner shipped the *Phase 4/5 candy-glass rebrand* on top of the Phase 2 dark-cinematic contract without ever revising the player. The player got stretched by the surrounding flex layout, and the pastel surround defeats the "focused moderation console" intent.

---

## User Brief — Reconciled

| User complaint | Root cause found | Pillar |
|---|---|---|
| "I want the screen to be scrollable" | Runner uses `minHeight: 100dvh` + inner `TagPanel` uses `overflowY: auto` on a `flex: 1` child of an unbounded flex column. When taxonomy expands, the panel and its sibling (the video card) both grow instead of scrolling. There is no page-level `overflow` policy and no bounded viewport for the two-column area. | Spacing / Layout |
| "The video player is so big" | `RunnerScreen.jsx:111` two-column row uses `alignItems: 'stretch'`, and the video wrapper has `minHeight: 360px` + **no `aspect-ratio`**. When the tag panel grows tall (5 L1 categories with L2 chips), stretch forces the video panel to match, so the `<video>` inside `media-controller` expands unbounded. Nested `.cma-player-container` also re-applies `max-width: 1400px` + `padding: 4rem 2.5rem` on top of the runner's own 1400px + 2.5rem padding. | Spacing / Layout |
| "Doesn't look like a modern audit video player" | Phase 2 UI-SPEC (dark cinematic, `#0A0B14`, blue accent, tight chrome, 960px max, single 8px focus card) was silently replaced by the candy-glass redesign shipped in the Scoreboard phase. The player now sits inside `.glass-panel` with `backdrop-filter: blur(28px) saturate(180%)`, wrapped by a purple-gradient inner frame, and surrounded by five animated pastel `.candy-shape` blobs. No timeline chapter markers are visible; the seek bar is stock media-chrome inside a lavender frame. | Visuals + Color |

---

## Pillar 1 — Copywriting — 3 / 4

Passes brand guard. Copy is inconsistent in tone across states.

Findings:
- **F1.1 (minor)** — Feedback overlay copy tips from professional to playful: "Nice call!" / "Not quite" / "Spot on. Moving to the next clip." reads like a language-learning app, not a hiring assessment. Phase 2 UI-SPEC copywriting contract does not cover feedback, so this is drift, not a regression against contract — but the user's "modern audit" brief expects flatter tone (e.g. "Recorded. Advancing to next clip.").
- **F1.2 (minor)** — Eyebrow chip label reads "Tag & decide" (`RunnerScreen.jsx:177`) which is cute but not the language of a moderation console. Audit tools use "Classify" or "Tag & verdict".
- **F1.3 (pass)** — Video title bar format "Video 1 of 5 — {title}" (`VideoPlayerScreen.jsx:104-105`) matches the Phase 2 copywriting contract exactly.
- **F1.4 (pass)** — Progress + Timer copy is neutral and correct ("Progress", "Optimal time" / "Almost there" / "Make a decision").

**Fixes:**
1. Reword feedback overlay to neutral audit tone.
2. Replace "Tag & decide" eyebrow with "Classify" or drop the eyebrow entirely on the tag column.

---

## Pillar 2 — Visuals — 2 / 4  **BLOCK**

The visual system for the runner does not match either the plan or the user brief. Everything is candy-glass; nothing is "audit-console".

Findings:
- **F2.1 (blocker)** — Runner wraps the player in `.glass-panel` (`RunnerScreen.jsx:114`) which applies `backdrop-filter: blur(28px) saturate(180%)`, a 36px border radius (`--radius-xl`), and a translucent white fill. Inside that panel, the immediate video wrapper (`RunnerScreen.jsx:127-137`) adds `background: linear-gradient(135deg, rgba(42,27,61,0.9), rgba(78,45,110,0.9))` — a saturated purple. The video sits inside a lavender-blur wafer, which is the opposite of the "cinematic dark, focus on the frame" intent.
- **F2.2 (blocker)** — `App.jsx:59-64` renders the `.candy-scene` layer (five animated pastel blur blobs) behind the runner. These continue drifting during video review. An "audit" surface should be static and low-noise. Consider `display:none` on `.candy-scene` for the RUNNER screen only.
- **F2.3 (major)** — No visible chapter markers on the seek bar at runtime. Phase 2 UI-SPEC specified `--cma-warning` dots at chapter timestamps with hover tooltips ("Suspicious watermark overlay at 0:42"). `VideoPlayerScreen.jsx:130-131` loads `<track kind="chapters">` and `<track kind="metadata" label="thumbnails">`, but the CSS overrides for chapter markers are missing and playlist chapters are empty per STATE.md line 135. Reviewers cannot jump to suspicious moments — the core "audit" affordance is absent.
- **F2.4 (major)** — `.cma-player-container` in `VideoPlayer.css:1-5` still uses the *Phase 2 dark-theme tokens* (`--cma-bg-surface`, `--cma-text-primary`) which have been re-aliased in `index.css:76-87` to translucent whites. So `.cma-player-card` renders as a translucent white slab on top of the purple gradient — a stack of three visually noisy layers before the video even paints.
- **F2.5 (minor)** — Video error state retry button uses the coral-magenta `--accent-gradient` (`VideoPlayer.css:128-141`), which is inconsistent with the neutral surface of the rest of the player card.

**Fixes:**
1. Wrap the video in a single dark, low-radius card. Remove the outer `glass-panel` for the video column, or fork a `glass-panel--audit` variant with `background: #0A0B14`, `border-radius: 12px`, `backdrop-filter: none`.
2. Remove the purple gradient behind the `<video>`. Set `background: #000` on `.cma-player-card` and let the video letterbox against black.
3. Hide `.candy-scene` on the runner screen (`.cma-runner ~ .candy-scene { display: none }` or condition it in `App.jsx`).
4. Land chapter markers as CSS on `media-time-range` + populate at least one video's chapter track so the "audit" affordance is visible.
5. Restore the Phase 2 `--cma-bg-*` tokens as *actual* dark values, or delete `VideoPlayer.css` and re-author against the current candy-glass tokens intentionally.

---

## Pillar 3 — Color — 2 / 4  **BLOCK**

The Phase 2 UI-SPEC contract for color has been silently abandoned.

Findings:
- **F3.1 (blocker)** — Phase 2 UI-SPEC declared the runner surface as `--cma-bg-deepest: #0A0B14` with blue accent `#0085FF`. Current `index.css:76-87` remaps `--cma-bg-surface` → `rgba(255,255,255,0.78)` and `--cma-accent` → `#E93A9A` (candy magenta). Every `--cma-*` token used by `VideoPlayer.css` now resolves to translucent pastel. Player contrast ratios in the Phase 2 spec (WCAG AAA for `#F5F5F7 on #0A0B14`) no longer hold — `--cma-text-primary` is now `#2A1B3D` on a translucent white surface, which passes contrast but is *not the contract*.
- **F3.2 (major)** — Feedback overlay uses `--candy-mint` / `--candy-blush` tints for correct / incorrect (`RunnerScreen.jsx:88-90`). For a moderation-competency screen these are ambiguous — mint reads "success" but blush is often read as "warning" not "error". Consider aligning to `--status-safe` / `--status-violation` (already defined in `index.css:45,47`) with clearer semantic labels.
- **F3.3 (minor)** — Focus ring is `--accent-magenta` globally (`index.css:91`). On the video player (previously specced with blue focus rings) the magenta ring on top of a lavender card is low-contrast. WCAG focus visible requires 3:1 against adjacent colors — spot-check `#E93A9A` on `rgba(78,45,110,0.9)`.

**Fixes:**
1. Decide whether the runner keeps the candy-glass system or reverts the player card only to the Phase 2 dark contract. Document the decision in a new CONTEXT.md; either way, delete the dead legacy alias block in `index.css:69-87` after the decision.
2. Swap correct/incorrect halos to `--status-safe` / `--status-violation`.
3. Increase focus-ring contrast on the player card, or add `outline-color: var(--cma-text-primary)` scoped to `.cma-player-card`.

---

## Pillar 4 — Typography — 3 / 4

Passes with one weight-hierarchy issue.

Findings:
- **F4.1 (pass)** — Timer at `clamp(2.5rem, 6vw, 4rem)` (`CountdownDisplay.jsx:57`) with JetBrains Mono and `font-variant-numeric: tabular-nums` — good.
- **F4.2 (pass)** — Video title bar `20px / 600 / 1.3` (`VideoPlayer.css:22-25`) matches Phase 2 UI-SPEC Table row "Video title" exactly.
- **F4.3 (minor)** — Feedback overlay heading uses `fontSize: '2.25rem'` (`RunnerScreen.jsx:264`) — larger than the Phase 2 screen-heading scale (28px = 1.75rem). Not a bug, but inconsistent with the established scale.
- **F4.4 (minor)** — Eyebrow chip labels use 0.75rem uppercase (`index.css:259-261`) which is fine, but the runner has two competing chip styles (progress eyebrow inside a card and "Tag & decide" eyebrow next to the tag column), producing typographic redundancy.

**Fixes:**
1. Drop the feedback heading to 1.75–2rem to match the established `h2` scale.
2. Remove one of the two eyebrow chips on the runner.

---

## Pillar 5 — Spacing / Layout — 1 / 4  **BLOCK**

This is the pillar the user explicitly called out. Multiple concrete bugs.

Findings:
- **F5.1 (blocker — "screen should be scrollable")** — `RunnerScreen.jsx:104` sets `minHeight: '100dvh'` on the `<section>`. Body has `overflow-x: hidden` and no explicit `overflow-y`, so vertical scroll relies on the document's default. That works only while runner content <= viewport. When the tag panel expands (5 L1 categories, each opening 4–8 L2 chips), the section grows past 100dvh — but the *inner* two-column row uses `alignItems: 'stretch'` and the tag column uses `flex: 1` + inner `overflowY: 'auto'` (`TagPanel.jsx:16`). The tag panel's inner scroll never activates because its parent flex-column has no bounded height, so the whole page grows instead of the taxonomy list scrolling internally. Net: the page *does* scroll at the document level, but the video and timer scroll off-screen with it — the reviewer loses the frame while classifying. This is the opposite of the intended audit UX.
- **F5.2 (blocker — "video player is so big")** — Same row uses `alignItems: 'stretch'` (`RunnerScreen.jsx:111`). The video wrapper has `minHeight: '360px'` with **no `aspect-ratio`** (`RunnerScreen.jsx:127-137`). When the sibling tag column grows to fit its content, stretch forces the video wrapper to grow with it. The `<video>` inside `media-controller` fills that height, producing the "too big" appearance. On a 1080p desktop with 5 categories expanded, the video card easily crosses 720px tall.
- **F5.3 (blocker — nested max-widths)** — Runner section is `maxWidth: '1400px', padding: '2rem 2.5rem'`. Inside it, `.cma-player-container` also applies `max-width: var(--cma-max-content-width)` (now 1400px, was 960px in Phase 2 UI-SPEC) *and* `padding: var(--cma-space-xl) var(--cma-space-lg)` = `4rem 2.5rem` (`VideoPlayer.css:1-5`). Double padding + double centering. The Phase 2 spec's `960px` player container was the design intent — it has been overwritten to `1400px`, killing the "cinematic focused frame".
- **F5.4 (major)** — Two-column row uses `flexWrap: 'wrap'` with `flex: '1 1 65%'` + `flex: '1 1 30%'` + `minWidth: '320px'` on the tag column. Sum 95% + gap. On viewports 1024–1180px, the tag column wraps below the video, breaking the intended side-by-side audit workflow. Since the user says this is *desktop only*, we can safely target `min-width: 1180px` and drop the wrap fallback.
- **F5.5 (minor)** — CountdownDisplay sits inside the same glass-panel as the video (`RunnerScreen.jsx:113-157`), stacked underneath, so the timer scales with video height. A modern audit console places the timer as a small persistent chip in the header/corner, not stacked with the video.

**Fixes (prioritized):**
1. **Constrain the video card.** Replace `minHeight: '360px'` with `aspectRatio: '16/9'` on the video wrapper, and remove `alignItems: 'stretch'` from the row (use `alignItems: 'flex-start'`). This alone fixes complaints #1 and #2.
2. **Give the runner a bounded viewport.** Change `.cma-runner` to `height: 100dvh; overflow: hidden;` with a header row (progress + timer) at fixed height, and the two-column body at `flex: 1; min-height: 0` so inner scroll actually works.
3. **Move the taxonomy scroll inside the tag column.** With F5.2 fixed, the tag column height is bounded by the video's 16:9 height + timer — `TagPanel`'s inner `overflowY: auto` finally has a bounded parent and scrolls independently.
4. **Undo the nested max-width.** In `VideoPlayer.css`, delete the `.cma-player-container` centering/padding block. Let the runner own layout; the player card just fills the video column.
5. **Restore Phase 2's 960px feel** by capping the two-column row (not the section) at e.g. `max-width: 1240px` and letting the tag column fill the remainder.
6. Drop `flex-wrap: wrap` on the runner row per the desktop-only decision.

---

## Pillar 6 — Experience Design — 3 / 4

Interaction model is sound; execution is dragged down by the layout regression.

Findings:
- **F6.1 (pass)** — Timer starts on `playing` event (correct per Decision `[Phase 03-04]`), pulses under 10s, phase-color gradient. Good motion vocabulary.
- **F6.2 (pass)** — Feedback overlay has focus trap ref, keyboard shortcuts (Esc / Enter to continue), and a Continue button. Auto-dismiss at 2s.
- **F6.3 (pass)** — Video keyboard shortcuts ArrowLeft/Right → 5s seek in `VideoPlayerScreen.jsx:71-83`. Modern audit players expect this.
- **F6.4 (major)** — No visible keyboard shortcut affordance. Modern audit UIs surface "J/K/L", "arrow ±5s", "Space play/pause" in a legend chip or tooltip. Currently only Space + arrows work; users don't know.
- **F6.5 (major)** — No chapter/scrub markers visible → users cannot jump to suspicious moments (F2.3). This is the single biggest UX gap versus the "modern audit player" brief.
- **F6.6 (minor)** — Dev `[dev] Reset` button (`VideoPlayerScreen.jsx:145-149`) renders under the player in dev builds. Consider moving to a corner or gating behind a URL param so it doesn't add layout height in dev screenshots the design team reviews.
- **F6.7 (minor)** — Countdown announces via `aria-live="polite"`. Good. But the seconds-remaining chip animates + text-shadows; ensure that under `prefers-reduced-motion` the pulse ring is disabled (index.css:425-437 does cover this).

**Fixes:**
1. Add a small "shortcuts" chip: `Space` play/pause, `←/→` ±5s, `M` mute.
2. Land chapter markers (F2.3 fix).

---

## Top Fixes (in order of user impact)

1. **Fix video card sizing** — remove `alignItems: stretch`, add `aspect-ratio: 16/9`, delete nested `.cma-player-container` max-width/padding. → resolves "video player is so big".
2. **Give runner a proper bounded viewport** — `.cma-runner { height: 100dvh; overflow: hidden }`, header row fixed, two-column body `flex: 1; min-height: 0`, tag panel scrolls internally. → resolves "screen should be scrollable" as "video and timer stay visible while the taxonomy list scrolls independently".
3. **Rebuild the video card as an audit surface** — drop the outer candy `.glass-panel`, drop the purple gradient background behind the video, use a flat `#0A0B14` card with a 12px radius, restore chapter markers on the seek bar. Hide `.candy-scene` on the runner. → resolves "should look like a modern audit video player".
4. **Reconcile the color contract** — either revert the player only to Phase 2 dark tokens, or intentionally re-author `VideoPlayer.css` against candy-glass. Delete the dead legacy `--cma-*` alias block once decided. → unblocks Pillar 3.
5. **Ship chapter markers** — populate at least one video's chapter track and land the marker CSS on `media-time-range` per Phase 2 UI-SPEC §"Seek Bar & Chapter Markers".
6. **Add a shortcut legend** — small chip listing `Space`, `←/→ ±5s`, `M`. Neutral audit-console signal.
7. **Neutralize feedback overlay copy and hierarchy** — swap "Nice call!" / "Not quite", drop heading to 1.75rem, use `--status-safe` / `--status-violation` halos.

---

## Files to Change

| File | Change |
|---|---|
| `src/components/RunnerScreen.jsx` | Remove `alignItems: stretch`; wrap two-column row with `aspect-ratio: 16/9` on the video wrapper; convert `.cma-runner` to `height: 100dvh; overflow: hidden` with `header` + `main` structure; drop the outer `.glass-panel` for the video column; neutral feedback copy. |
| `src/components/player/VideoPlayer.css` | Delete `.cma-player-container` max-width/padding block; rebuild `.cma-player-card` as `background: #0A0B14; border-radius: 12px`; add chapter marker CSS on `media-time-range`. |
| `src/App.jsx` | Conditionally omit `.candy-scene` for `SCREENS.RUNNER` / `SCREENS.ASSESSMENT`. |
| `src/index.css` | Decide fate of `--cma-*` alias block (lines 69-87). If keeping candy-glass runner, delete the aliases and use candy tokens directly in `VideoPlayer.css`. If reverting to Phase 2 dark, restore real `#0A0B14` / `#141725` / `#0085FF` values here. |
| `src/data/playlist.json` | Populate chapters for at least v01 so markers are visible in QA. |
| `src/components/tagging/TagPanel.jsx` | No change once F5.1 lands — the existing `overflowY: auto` will start working under a bounded parent. |

---

## Checker Sign-Off

- [x] Pillar 1 Copywriting: PASS (minor drift)
- [ ] Pillar 2 Visuals: **BLOCK**
- [ ] Pillar 3 Color: **BLOCK**
- [x] Pillar 4 Typography: PASS
- [ ] Pillar 5 Spacing / Layout: **BLOCK**
- [x] Pillar 6 Experience Design: PASS (major gap on chapter markers)

**Overall: 14 / 24 — BLOCK.** Land Top Fixes 1–3 before re-review; those alone will move Visuals + Color + Layout to at least 3/4 each.

## UI REVIEW COMPLETE
