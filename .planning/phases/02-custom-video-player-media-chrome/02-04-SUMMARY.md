# Wave 4 Summary: Integration — App.jsx Wiring + Placeholder Removal

**Date:** 2026-07-08
**Commit:** `4dbb948` — `feat(app): wire VideoPlayerScreen at SCREENS.ASSESSMENT slot, remove placeholder screen`
**Status:** COMPLETE (automated)

## Task 02-04-01: App.jsx Wiring + Placeholder Removal

### Changes

| File | Action |
|------|--------|
| `src/App.jsx` | Replaced `AssessmentPlaceholderScreen` import with `VideoPlayerScreen`. SCREENS.ASSESSMENT case now renders `<VideoPlayerScreen onReset={handleDevReset} onReady={...} />` with TODO(Phase 3) placeholder for timer integration |
| `src/components/AssessmentPlaceholderScreen.jsx` | DELETED |
| `tests/components/AssessmentPlaceholderScreen.test.jsx` | DELETED |
| `tests/App.integration.test.jsx` | Added `vi.mock` for VideoPlayerScreen; updated happy-path assertion to verify `data-testid="video-player-screen"` renders at ASSESSMENT screen |

### Verification Results

| Signal | Result |
|--------|--------|
| `npm test -- --run` — 170 tests, 14 files | ALL GREEN |
| `npm run build` — Vite production build | SUCCESS |
| Placeholder file deleted | CONFIRMED |
| App.jsx imports VideoPlayerScreen, no AssessmentPlaceholderScreen ref | CONFIRMED |
| TODO(Phase 3) + canplaythrough anchor present | CONFIRMED |
| Integration test: LANDING → GUIDELINES → ASSESSMENT verifies player mock | PASSING |
| Brand safety: no forbidden strings in modified files | CLEAN |

### Key Wiring

- **App.jsx → VideoPlayerScreen**: `onReset={handleDevReset}`, `onReady` placeholder logs `[cma] video ready (canplaythrough) — timer start target`
- **canplaythrough → onReady flow**: `<video>` event → VideoPlayerScreen useEffect handler → `onReady?.()` → App.jsx console.log placeholder → Phase 3 timer.start()
- **Dev reset**: `handleDevReset` (guard.clear + state.resetAttempt) passed via `onReset`; VideoPlayerScreen renders `[dev] Reset` button only in `import.meta.env.DEV`

## Task 02-04-02: Human-Verify Cross-Browser

### Status: PENDING (manual)

Manual verification checklist — requires `npm run dev` and real browsers.

#### Local Verification (18 items)

Run `npm run dev`, navigate Landing → Guidelines → Begin Assessment, verify:

- [ ] Video renders with dark theme
- [ ] No autoplay — poster/black frame until click
- [ ] Play button starts playback
- [ ] Play/pause toggles
- [ ] Seek bar click seeks
- [ ] Seek bar drag scrubs
- [ ] Time display updates
- [ ] Volume slider adjusts
- [ ] Mute button toggles
- [ ] Hover thumbnail preview (requires VTT)
- [ ] Chapter markers on seek bar
- [ ] Space = play/pause
- [ ] ArrowLeft seeks back ~5s
- [ ] ArrowRight seeks forward ~5s
- [ ] M = mute toggle
- [ ] "Video 1 of 5" title bar renders
- [ ] Error state shows on bad video src
- [ ] No React/media-chrome console errors

#### Cross-Browser

- [ ] Chrome latest (Windows)
- [ ] Edge latest (Windows)
- [ ] Firefox latest (Windows)
- [ ] Safari latest (macOS/BrowserStack)

#### Live Deploy

- [ ] GitHub Pages URL serves player
- [ ] Video loads (Content-Type: video/mp4, Content-Length > 0)
- [ ] Sprite image loads (sprite.jpg)
- [ ] VTT files load (thumbs.vtt, chapters.vtt — 200 OK)

## Requirements Verified

| REQ-ID | Status | Evidence |
|--------|--------|----------|
| PLAY-07 | AUTOMATED | `playsInline`, `preload="metadata"` in VideoPlayerScreen; no autoplay attribute |
| PLAY-08 | AUTOMATED | onReady callback with canplaythrough listener + TODO(Phase 3) placeholder |
| PLAY-09 | AUTOMATED | VideoPlayerScreen composed via App.jsx SCREENS.ASSESSMENT slot |
| PLAY-01–06, PLAY-10 | PENDING | Manual browser verification (Task 02-04-02) |
| CONTENT-05, CONTENT-06 | PENDING | VTT/chapter markers + sprite preview (manual) |
| Integration | AUTOMATED | Integration test verifies player renders at ASSESSMENT screen |

## Threat Model

| Threat | Disposition |
|--------|-------------|
| T-02-14: Dev reset visible in production | MITIGATED — VideoPlayerScreen guards reset button behind `import.meta.env.DEV` |
| T-02-15: onReady fires before user intent | ACCEPTED — expected browser behavior; timer starts on canplaythrough |
| T-02-16: canplaythrough never fires | NOTED — onError callback passed; timeout fallback deferred to Phase 3 |

## Risks

1. **Integration test mock drift** — Mock in integration test may diverge from real VideoPlayerScreen API. Mitigation: manual browser verification (Task 02-04-02) covers real component.
2. **canplaythrough timing edge case** — If video loads from cache faster than React mounts useEffect, event may be missed. Current code attaches listener in useEffect which runs after mount. Mitigation: check `video.readyState >= HAVE_ENOUGH_DATA` in the useEffect — not implemented yet, low priority (rare with `preload="metadata"` on first visit).
