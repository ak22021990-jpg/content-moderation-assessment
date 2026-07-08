---
phase: 02-custom-video-player-media-chrome
artifact: RESEARCH.md
status: complete
researched: 2026-07-08
confidence: HIGH
sources:
  - https://www.media-chrome.org/docs/en/react/get-started
  - https://www.media-chrome.org/docs/en/components/media-time-range
  - https://www.media-chrome.org/docs/en/components/media-preview-thumbnail
  - https://www.media-chrome.org/docs/en/keyboard-shortcuts
  - https://www.media-chrome.org/docs/en/react/hooks
  - https://github.com/muxinc/media-chrome (README + examples)
  - .planning/research/ARCHITECTURE.md
  - .planning/research/STACK.md
  - .planning/research/PITFALLS.md
  - src/App.jsx (current shell)
  - src/state/screens.js (current enum)
  - src/hooks/useAssessmentState.js (current state hook)
  - .github/workflows/deploy.yml (current CI)
---

# Research — Phase 2: Custom Video Player (media-chrome)

## 1. media-chrome React API

### Package & Version

- **Version:** `media-chrome@^4.19.2` (published June 10, 2026)
- **Install:** `npm install media-chrome` (single package, no separate React wrapper)
- **Bundle:** ~30 KB gzip, tree-shakeable per component
- **Maintained by:** Mux (active, weekly releases)

### React Wrapper Conventions

Import from `media-chrome/react` (not a separate package):

```jsx
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaPlayButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaPreviewThumbnail,
} from 'media-chrome/react';
```

Conventions:
- PascalCase component names (`<media-controller>` → `<MediaController/>`)
- camelCase props (`seekoffset` → `seekOffset`, `showduration` → `showDuration`)
- `<video slot="media">` is the child pattern — web component slot for the actual media element

### Component Usage Pattern

```jsx
<MediaController>
  <video
    slot="media"
    src="/videos/test-video.mp4"
    playsInline
    preload="metadata"
    crossOrigin=""
  >
    <track default label="thumbnails" kind="metadata" src="/vtt/test-video.thumbs.vtt" />
    <track default kind="chapters" src="/vtt/test-video.chapters.vtt" />
  </video>
  <MediaControlBar>
    <MediaPlayButton />
    <MediaSeekBackwardButton seekOffset={5} />
    <MediaSeekForwardButton seekOffset={5} />
    <MediaTimeRange />
    <MediaTimeDisplay showDuration />
    <MediaMuteButton />
    <MediaVolumeRange />
    <MediaFullscreenButton />
  </MediaControlBar>
</MediaController>
```

### Key Attributes

- **No autoplay** — `playsInline` + `preload="metadata"` satisfies PLAY-07
- **`crossOrigin=""`** — required for VTT thumbnail tracks to function cross-origin (safe when same-origin LFS/GH Pages)
- **`seekOffset={5}`** — overrides default 10s seek-back/forward for PLAY-10 arrows requirement

### Available React Components (Confidence: HIGH)

| Component | Purpose | Required by |
|-----------|---------|-------------|
| `MediaController` | Root wrapper; owns state, keyboard shortcuts, VTT track parsing | PLAY-01, PLAY-09, PLAY-10 |
| `MediaControlBar` | Layout container for controls | PLAY-01 |
| `MediaTimeRange` | Seek bar with built-in hover preview + chapter segment rendering | PLAY-02, PLAY-03, PLAY-04 |
| `MediaTimeDisplay` | Current time display; `showDuration` prop adds /total | PLAY-05 |
| `MediaPlayButton` | Play/pause toggle | PLAY-01 |
| `MediaMuteButton` | Mute/unmute toggle | PLAY-06 |
| `MediaVolumeRange` | Volume slider | PLAY-06 |
| `MediaSeekBackwardButton` | Seek backward; `seekOffset` prop controls seconds | PLAY-10 |
| `MediaSeekForwardButton` | Seek forward; `seekOffset` prop controls seconds | PLAY-10 |
| `MediaFullscreenButton` | Fullscreen toggle (nice-to-have) | — |
| `MediaLoadingIndicator` | Spinner shown during buffering | UX |
| `MediaPreviewThumbnail` | Internal component used by MediaTimeRange; docs describe advanced usage | PLAY-03 |

### MediaStore Hooks (for `canplaythrough`)

Import from `media-chrome/react/media-store`:

```jsx
import {
  MediaProvider,
  useMediaSelector,
  useMediaDispatch,
  useMediaRef,
  MediaActionTypes,
} from 'media-chrome/react/media-store';
```

Key state selectors:
- `useMediaSelector(state => state.mediaPaused)` — play/pause state
- `useMediaSelector(state => state.mediaCurrentTime)` — current playback position
- `useMediaSelector(state => state.mediaDuration)` — total duration
- `useMediaSelector(state => state.mediaLoading)` — buffering state
- `useMediaSelector(state => state.mediaHasPlayed)` — has played at least once
- `useMediaSelector(state => state.mediaEnded)` — ended state

For `canplaythrough` (PLAY-08), the MediaStore does NOT expose `canplaythrough` directly as a state property. Two strategies:

1. **Callback-based approach:** Listen on the `<video>` DOM element ref via `useMediaRef()`:
   ```jsx
   const mediaRef = useMediaRef();
   useEffect(() => {
     const video = mediaRef.current;
     if (!video) return;
     const handler = () => { /* timer can start */ };
     video.addEventListener('canplaythrough', handler);
     return () => video.removeEventListener('canplaythrough', handler);
   }, [mediaRef]);
   ```

2. **Observer approach:** Watch `mediaLoading` flip from `true` to `false` after initial load, combined with `mediaCurrentTime` and `mediaDuration` being populated. Not as precise as native `canplaythrough` but works within the MediaStore paradigm.

**Recommendation:** Strategy 1 (native DOM event via ref) — exact `canplaythrough` semantics. Expose via a callback prop on the player wrapper component that Phase 3 can subscribe to.

---

## 2. WebVTT Thumbnail Previews

### How media-chrome Consumes Thumbnails

`<media-time-range>` automatically renders preview thumbnails when a `<track>` element with `kind="metadata" label="thumbnails"` exists inside the `<video>`.

The `<media-preview-thumbnail>` component (internal to `<media-time-range>`) reads:
- `mediapreviewimage` — URL of the sprite sheet (populated from VTT cue)
- `mediapreviewcoords` — coordinates `[x, y, width, height]` within the sprite (populated from VTT cue)

### WebVTT Thumbnail Format (Sprite-Based)

Standard format used by Mux storyboards, JW Player, and media-chrome:

```
WEBVTT

00:00:00.000 --> 00:00:05.000
sprite.jpg#xywh=0,0,160,90

00:00:05.000 --> 00:00:10.000
sprite.jpg#xywh=160,0,160,90

00:00:10.000 --> 00:00:15.000
sprite.jpg#xywh=320,0,160,90
```

Key details:
- Each cue covers a time range (5s intervals typical for 120s video)
- `sprite.jpg#xywh=x,y,w,h` is the Media Fragments URI syntax
- Coordinates map to sprite tile positions (not pixel coordinates)
- The sprite image is typically one row or a grid of tiles

### Sprite Sheet Parameters

- Tile dimensions: 160×90 px (16:9 thumbnails at reasonable quality)
- Grid: e.g., `10×10` = 100 thumbnails for a ~100s video (1 thumbnail/sec)
- Interval: `duration / (COLS * ROWS)` seconds per thumbnail
- Total sprite dimensions: `160*COLS × 90*ROWS` pixels
- File size target: < 200 KB (JPEG q=70)

### CSS Customization

```css
media-time-range {
  --media-preview-thumbnail-max-width: 160px;
  --media-preview-thumbnail-max-height: 90px;
  --media-preview-thumbnail-object-fit: contain; /* default, preserves aspect ratio */
  --media-preview-thumbnail-border-radius: 4px;
  --media-preview-time-margin: 0 0 -10px;
}
```

---

## 3. WebVTT Chapters

### How media-chrome Consumes Chapters

`<media-time-range>` automatically renders chapter segments when a `<track kind="chapters">` exists inside the `<video>`.

Chapter markers appear as:
- Hoverable segments on the seek bar (visual indicators at correct offsets)
- Chapter labels in the hover preview when the pointer is over a chapter segment

### WebVTT Chapters Format

Standard VTT format, identical to what `<video>` text tracks use:

```
WEBVTT

00:00:00.000 --> 00:00:00.000
Suspicious watermark overlay at 0:42

00:00:10.000 --> 00:00:10.000
Brand-adjacent logo appears

00:00:55.000 --> 00:00:55.000
Hate speech glyph in background
```

Note: Chapters use zero-duration cues (start == end) — they mark instants, not ranges. The `text` part is the chapter label shown on hover.

### Chapter Data Source

Chapter timestamps and labels are author-defined per video. These are **not** in the VTT file alone — they should also live in `playlist.json` for the content pipeline:

```json
{
  "id": "v01",
  "chapters": [
    { "t": 42.5, "label": "Suspicious watermark overlay" },
    { "t": 55.0, "label": "Brand logo appears at bottom-right" }
  ]
}
```

The VTT file is generated from this data at build time. This keeps a single source of truth (`playlist.json`) and makes chapter authoring a JSON edit, not a VTT hand-edit.

---

## 4. ffmpeg Sprite Generation Script

### Script Design (`scripts/generate-sprites.mjs`)

Node.js script that:
1. Reads `playlist.json` for video list
2. For each video, shells out to `ffprobe` for duration
3. Shells out to `ffmpeg` for sprite sheet generation
4. Generates the companion `thumbs.vtt` file
5. Writes both files to `public/vtt/` and `public/sprites/`

### ffmpeg Command

```bash
ffmpeg -y \
  -i "public/videos/v01.mp4" \
  -vf "fps=1/1.2,scale=160:90,tile=10x10" \
  -frames:v 1 \
  "public/sprites/v01_sprite.jpg"
```

Breakdown:
- `fps=1/1.2` — one frame every 1.2 seconds (100 frames for 120s video into 10×10 grid)
- `scale=160:90` — resize each tile to 160×90
- `tile=10x10` — arrange into a 10×10 grid
- `-frames:v 1` — output exactly one frame (the tiled grid)
- `-y` — overwrite existing output

### ffprobe for Duration

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 "public/videos/v01.mp4"
```

Returns e.g. `105.236` (seconds as float).

### VTT Generation Logic (from script)

```javascript
const COLS = 10, ROWS = 10, TILE_W = 160, TILE_H = 90;
const interval = durationSec / (COLS * ROWS);

let vtt = 'WEBVTT\n\n';
for (let i = 0; i < COLS * ROWS; i++) {
  const startTime = formatTime(i * interval);
  const endTime = formatTime((i + 1) * interval);
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = col * TILE_W, y = row * TILE_H;
  vtt += `${startTime} --> ${endTime}\n`;
  vtt += `../sprites/${videoId}_sprite.jpg#xywh=${x},${y},${TILE_W},${TILE_H}\n\n`;
}
// write vtt to public/vtt/{videoId}.thumbs.vtt
```

### CI Integration

Add sprite generation step to `.github/workflows/deploy.yml` before `npm run build`:

```yaml
- name: Install ffmpeg
  run: sudo apt-get install -y ffmpeg

- name: Generate sprites + VTT
  run: node scripts/generate-sprites.mjs

- name: Verify sprites exist
  run: |
    test -f public/sprites/v01_sprite.jpg
    test -f public/vtt/v01.thumbs.vtt
    test -f public/vtt/v01.chapters.vtt
```

This runs **at build time in CI**, not locally. Generated assets are gitignored (they're build artifacts from committed source videos). This avoids stale sprites (PITFALLS.md Pitfall 9).

### `.gitattributes` Updates

```
public/videos/*.mp4    filter=lfs diff=lfs merge=lfs -text
public/sprites/*.jpg   filter=lfs diff=lfs merge=lfs -text
```

Generated VTT files are text — no LFS needed.

---

## 5. Git LFS Video Delivery on GitHub Pages

### The Setup

- Video MP4s tracked via LFS (`.gitattributes`: `public/videos/*.mp4 filter=lfs diff=lfs merge=lfs -text`)
- GitHub Actions checkout uses `lfs: true` (already configured in deploy.yml line 23)
- LFS verification step (`git lfs ls-files`) already in deploy.yml line 26
- `vite.config.js` has `base: '/content-moderation-assessment/'` — assets resolve correctly
- Public URL pattern: `https://ak22021990-jpg.github.io/content-moderation-assessment/videos/v01.mp4`

### Range Request Support

GitHub Pages serves static files with `Accept-Ranges: bytes` — HTML5 `<video>` seeking works correctly. LFS-resolved files on Pages behave as normal static files. **No CORS issues** since video, VTT, and sprite files are all same-origin.

### `playlist.json` Env-Conditional `srcUrl`

```json
{
  "videos": [
    {
      "id": "v01",
      "srcUrl": "/videos/v01.mp4",
      "spriteUrl": "/sprites/v01_sprite.jpg",
      "thumbsVttUrl": "/vtt/v01.thumbs.vtt",
      "chaptersVttUrl": "/vtt/v01.chapters.vtt",
      "durationSec": 95
    }
  ]
}
```

For CDN fallback (Phase 6): `srcUrl` becomes env-conditional — `VIDEO_BASE_URL` env var prefix. For Phase 2, hardcoded relative paths are sufficient since we're only shipping one test video.

### LFS Bandwidth Budget (Relevant Context)

- Free tier: 10 GiB storage + 10 GiB bandwidth/month (per PITFALLS.md verified 2026 numbers)
- One test video at ~15 MB = negligible Phase 2 bandwidth consumption
- Phase 6 CDN swap (R2) is pre-provisioned per CONTENT-03
- No action needed for Phase 2 beyond confirming video is LFS-tracked and CI resolves it

---

## 6. `canplaythrough` Event Exposure

### Requirement (PLAY-08)

> The player reports `canplaythrough` before any timer would start (event exposed to parent so Phase 3 timer can subscribe); a `canplaythrough` handler placeholder is instrumented.

### Implementation Pattern

Two-layer approach:

**Layer 1: VideoPlayer component exposes an `onReady` callback**

```jsx
// components/player/VideoPlayer.jsx
import { useRef, useEffect } from 'react';

export default function VideoPlayer({ src, onReady }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => {
      onReady?.();
    };
    video.addEventListener('canplaythrough', handler);
    return () => video.removeEventListener('canplaythrough', handler);
  }, [onReady]);

  return (
    <MediaController>
      <video ref={videoRef} slot="media" src={src} playsInline preload="metadata">
        {/* tracks */}
      </video>
      {/* controls */}
    </MediaController>
  );
}
```

**Layer 2: RunnerScreen (Phase 3) subscribes**

```jsx
<VideoPlayer
  src={video.srcUrl}
  onReady={() => { /* Phase 3: timer.start() */ }}
/>
```

### Alternate: MediaStore-Based Detection

Using `media-chrome/react/media-store`:
- `useMediaSelector(state => state.mediaHasPlayed)` → becomes `true` after `playing` event
- `useMediaSelector(state => state.mediaLoading)` → tracks buffering state
- Can watch the combination: `!mediaLoading && mediaDuration > 0` signals "ready enough"

This is less precise than native `canplaythrough` but avoids ref-to-DOM dance. The MediaStore does NOT expose a `mediaCanPlayThrough` boolean directly — the `mediaLoading` state tracks buffering but doesn't distinguish "enough data to play through" from "initial load."

**Decision:** Use Layer 1 (native DOM event via ref). It matches the requirement's exact semantic (`canplaythrough` not `loadedmetadata` or `playing`). The ref pattern is idiomatic in React + web components.

---

## 7. Keyboard Controls

### Built-in media-chrome Shortcuts

`<MediaController>` provides built-in keyboard shortcuts when focus is inside the controller:

| Key | Behavior | Relevant? |
|-----|----------|-----------|
| `Space` | Toggle play/pause | YES (PLAY-10) |
| `k` | Toggle play/pause | — |
| `m` | Toggle mute | YES (PLAY-10) |
| `f` | Toggle fullscreen | — |
| `c` | Toggle captions | — |
| `ArrowLeft` | Seek back **10s** | NEEDS OVERRIDE (requirement is ±5s) |
| `ArrowRight` | Seek forward **10s** | NEEDS OVERRIDE (requirement is ±5s) |
| `ArrowUp` | Volume up | — |
| `ArrowDown` | Volume down | — |
| `j` | Seek back 10s | — |
| `l` | Seek forward 10s | — |

### Customizing Seek Offset for Arrows

media-chrome's built-in arrow shortcuts seek ±10s hardcoded. Two options:

**Option A: Override keyboard handler with custom seek offset (recommended)**

Since `MediaController` dispatches `mediaseekrequest` with a time value when arrows are pressed, we can intercept and adjust:

```jsx
// Disable built-in arrow shortcuts, add custom handler
<MediaController
  ref={(el) => {
    if (el) {
      el.hotkeys?.add('noarrowleft', 'noarrowright');
      // Add custom keydown handler on the controller
      el.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          const currentTime = el.mediaCurrentTime ?? 0;
          el.dispatchEvent(new CustomEvent('mediaseekrequest', {
            detail: Math.max(0, currentTime - 5),
            bubbles: true
          }));
        } else if (e.key === 'ArrowRight') {
          const currentTime = el.mediaCurrentTime ?? 0;
          el.dispatchEvent(new CustomEvent('mediaseekrequest', {
            detail: currentTime + 5,
            bubbles: true
          }));
        }
      });
    }
  }}
>
```

**Option B: Add `MediaSeekBackwardButton` + `MediaSeekForwardButton` with `seekOffset={5}` (simpler)**

These buttons provide the ±5s buttons visibly AND allow keyboard focus. However, they don't replace the arrow key shortcuts at the controller level. To also make arrow keys ±5s, we need Option A combined with Option B.

**Decision:** Use both:
1. Place `MediaSeekBackwardButton seekOffset={5}` and `MediaSeekForwardButton seekOffset={5}` in the control bar for visible ±5s buttons
2. Override ArrowLeft/ArrowRight via custom keydown handler for keyboard-only users
3. Space (play/pause) and m (mute) work out of the box — no changes needed

### hotkeys Property API

To disable specific built-in shortcuts programmatically:

```jsx
const controllerRef = useRef(null);
useEffect(() => {
  const mc = controllerRef.current;
  if (mc?.hotkeys) {
    mc.hotkeys.add('noarrowleft', 'noarrowright');
  }
}, []);
```

The `hotkeys` property is a DOMTokenList-like API. Adding `noarrowleft` disables the built-in ArrowLeft handler, enabling custom handling without conflicts.

---

## 8. Testing Strategy

### Testing media-chrome Components with Vitest + happy-dom

**Challenges:**
- Web components (`<media-controller>`, `<media-time-range>`, etc.) are custom elements — happy-dom has partial support
- `<video>` element has limited happy-dom support (`.play()`, `.pause()`, `.currentTime` are stubs)
- `HTMLMediaElement` events (`canplaythrough`, `loadedmetadata`, `playing`) won't fire in happy-dom
- Slot-based patterns (`<video slot="media">`) work if the slot attribute is recognized

**Strategy:**

**Unit tests (Vitest + happy-dom):**
- Test the React wrapper components (VideoPlayer, SeekBar — thin wrappers that compose media-chrome elements)
- Mock media-chrome components if needed: `vi.mock('media-chrome/react', () => ({ ... }))`
- Test `canplaythrough` callback wiring by mocking `addEventListener` on the ref
- Test `onReady` prop is called when the mock event fires
- Test VTT file generation logic (pure functions in `scripts/generate-sprites.mjs`)

```jsx
// Example: VideoPlayer unit test pattern
vi.mock('media-chrome/react', () => ({
  MediaController: ({ children }) => <div data-testid="mc">{children}</div>,
  MediaControlBar: ({ children }) => <div data-testid="bar">{children}</div>,
  MediaPlayButton: () => <button>Play</button>,
  MediaTimeRange: () => <input type="range" />,
  // etc.
}));
```

**Integration tests (Vitest + happy-dom):**
- Test that the App shell properly transitions from GUIDELINES to ASSESSMENT screen
- Test that VideoPlayerScreen mounts and renders the media-chrome tree
- Test playlist.json data is consumed correctly

**E2E tests (Playwright — deferred to Phase 6 per STACK.md):**
- Full video playback, keyboard controls, hover thumbnails — these require real browser
- media-chrome's web components work correctly in real browsers (Playwright covers Chrome + Firefox + Safari)

### What NOT to Test in Phase 2
- `canplaythrough` event timing from real video — tested manually
- Keyboard shortcuts in all 4 browsers — tested manually in Phase 2, automated in Phase 6 with Playwright
- Hover thumbnail appearance — CSS visual test, manual verification

### Current Test Infrastructure

From Phase 1:
- `vitest@^4.1.10` with `happy-dom@^20.10.6`
- `@testing-library/react@^16.3.2`, `@testing-library/user-event@^14.6.1`
- `tests/setup.js` with jest-dom matchers
- 113 tests green across 11 test files
- Conventional test pattern: TDD RED-GREEN, test file per module

---

## 9. React 19 + media-chrome Compatibility

### Web Components in React 19

React 19 improves web component interoperability:
- Custom element attributes/properties pass-through works correctly
- `ref` callback on custom elements receives the DOM node
- Event listeners attach normally via `addEventListener`

### StrictMode Concerns

- React 19 StrictMode double-invocation (dev only): `useEffect` fires twice, which means event listeners added in `useEffect` could be double-registered
- **Mitigation:** Always return cleanup function from `useEffect` that removes the event listener
- media-chrome's internal state is managed by its own store (not React state), so StrictMode double-fire won't cause UI glitches in the web components

### Known Issues

- No known compatibility issues between `media-chrome@4.19.2` and React 19.2 — both are current as of July 2026
- The `media-chrome/react` wrapper is the officially recommended path for React usage
- Some CSS custom property (`--media-*`) inheritance may behave differently when React re-renders parent components — use `!important` sparingly; prefer targeting `media-controller` or `media-time-range` directly

### Build Considerations

- Vite 8 resolves `media-chrome/react` correctly via the package's `exports` field
- No additional Vite config needed
- Tree-shaking: only imported components are bundled

---

## 10. Phase 1 Integration

### Current State (Phase 1 Deliverables)

**SCREENS enum** (`src/state/screens.js`):
```js
export const SCREENS = Object.freeze({
  LANDING: 'LANDING',
  GUIDELINES: 'GUIDELINES',
  ASSESSMENT_PLACEHOLDER: 'ASSESSMENT_PLACEHOLDER',
  ALREADY_COMPLETED: 'ALREADY_COMPLETED',
})
```

**useAssessmentState hook:**
- `enterAssessment()` → sets screen to `SCREENS.ASSESSMENT_PLACEHOLDER`
- Identity persists in sessionStorage
- Screen state machine pattern: single `screen` field drives App.jsx switch

**App.jsx** (`src/App.jsx`):
```jsx
case SCREENS.ASSESSMENT_PLACEHOLDER:
  return <AssessmentPlaceholderScreen onReset={handleDevReset} />
```

### Changes Needed for Phase 2

1. **Add `SCREENS.ASSESSMENT` to screens.js:**
   ```js
   export const SCREENS = Object.freeze({
     LANDING: 'LANDING',
     GUIDELINES: 'GUIDELINES',
     ASSESSMENT: 'ASSESSMENT',           // NEW — replaces ASSESSMENT_PLACEHOLDER
     ALREADY_COMPLETED: 'ALREADY_COMPLETED',
   })
   ```
   Also update `enterAssessment()` in `useAssessmentState` to use `SCREENS.ASSESSMENT` instead of `SCREENS.ASSESSMENT_PLACEHOLDER`.

2. **Create `src/components/VideoPlayerScreen.jsx`:**
   - Wraps `media-chrome` components
   - Reads first video from `playlist.json` (or accepts a video object as prop)
   - Exposes `onReady` callback for `canplaythrough`
   - Instrumented with `canplaythrough` handler placeholder

3. **Update `App.jsx`:**
   ```jsx
   import VideoPlayerScreen from './components/VideoPlayerScreen.jsx'
   // ...
   case SCREENS.ASSESSMENT:
     return <VideoPlayerScreen onReset={handleDevReset} />
   ```

4. **Remove `AssessmentPlaceholderScreen.jsx`** (or keep as fallback, rename imports)

5. **Add `src/data/playlist.json`** (v1 with single test video):
   ```json
   {
     "videos": [
       {
         "id": "v01",
         "title": "Test Video — Copyright Watermark",
         "srcUrl": "/videos/v01.mp4",
         "spriteUrl": "/sprites/v01_sprite.jpg",
         "thumbsVttUrl": "/vtt/v01.thumbs.vtt",
         "chaptersVttUrl": "/vtt/v01.chapters.vtt",
         "durationSec": 90
       }
     ]
   }
   ```

6. **Add `media-chrome` to `package.json`:**
   ```bash
   npm install media-chrome@^4.19.2
   ```

### Backward Compatibility

- Phase 1 tests that reference `ASSESSMENT_PLACEHOLDER` need updating (import path change, screen name change)
- The `enterAssessment()` callback contract stays the same — just the destination screen value changes
- Identity persistence (sessionStorage) unaffected — Phase 2 does not touch `useAssessmentState`

---

## 11. VTT File Generation Pipeline Summary

### Files Produced Per Video

| File | Location | Generated By | Format |
|------|----------|-------------|--------|
| `{id}.mp4` | `public/videos/` | Hand-authored/sourced | H.264 720p MP4 |
| `{id}_sprite.jpg` | `public/sprites/` | `scripts/generate-sprites.mjs` | JPEG sprite grid |
| `{id}.thumbs.vtt` | `public/vtt/` | `scripts/generate-sprites.mjs` | WebVTT (metadata thumbnails) |
| `{id}.chapters.vtt` | `public/vtt/` | `scripts/generate-sprites.mjs` | WebVTT (chapters) |

### Build Flow

```
[playlist.json + video MP4s + chapter data]
  → scripts/generate-sprites.mjs (CI only)
    → ffmpeg: sprite.jpg
    → compute: thumbs.vtt
    → generate: chapters.vtt
  → Vite build (copies public/ to dist/)
  → GitHub Pages deploy
```

### Chapter Data Flow

1. Author defines chapters in `playlist.json` per video
2. Build script reads `playlist.json`, generates `.chapters.vtt` from chapter data
3. Player consumes `.chapters.vtt` via `<track kind="chapters">`
4. `media-chrome` renders chapter segments on the seek bar

---

## 12. Key Decisions for the Planner

1. **Use `media-chrome/react` wrappers, not plain web components** — PascalCase imports, camelCase props. Simplest integration with existing React codebase.

2. **Use `canplaythrough` DOM event via `video` ref, not MediaStore state** — MediaStore doesn't expose `canplaythrough` directly. The ref pattern is idiomatic and precise.

3. **Disable built-in ArrowLeft/ArrowRight (10s) via `hotkeys` API, replace with custom ±5s handler** — satisfies PLAY-10 requirement while preserving Space and M shortcuts.

4. **Generate sprites + VTT in CI (build-time), not locally** — avoids stale sprite problem (Pitfall 9). Generated assets are `public/` artifacts, gitignored except for the source MP4s.

5. **Rename `SCREENS.ASSESSMENT_PLACEHOLDER` to `SCREENS.ASSESSMENT`** — replaces the placeholder screen with the real video player screen.

6. **Single test video for Phase 2** — `playlist.json` with one entry. Phase 3 adds the remaining 4 videos (CONTENT-02).

7. **Keep default `media-chrome` styling initially** — CSS custom properties (`--media-*`) can be themed later. Phase 2 focus is functional completeness, not visual design.

8. **Mock media-chrome components for unit tests** — happy-dom can't render custom elements fully. Integration tests verify composition, manual tests verify real behavior.

9. **Use existing deploy workflow** — already has `lfs: true` + `git lfs ls-files` verification. Add ffmpeg install + sprite generation step before Vite build.

10. **`crossOrigin=""` on `<video>` required for VTT tracks** — even same-origin, some browsers require explicit `crossOrigin` for `TextTrack` to load VTT with image URLs.

---

## 13. Open Questions (for Planner)

1. **Test video source:** Is the V1 or V2 clip ready? Phase 2 only needs ONE 60-120s H.264 720p MP4. If no real clip is available, a placeholder with `drawtext` overlays can suffice for now (mark it as placeholder in `playlist.json`).

2. **Chapter content for test video:** Who defines the suspicious moments? These should be authored in `playlist.json` per the CONTENT-05 requirement. Placeholder: 2-3 generic chapter markers for the test video.

3. **Sprite regeneration on video change:** Should `scripts/generate-sprites.mjs` run on every CI build (always), or only when videos change (hash-checked)? Recommendation: always run — ffmpeg on a single 90s video takes ~2s, it's not a bottleneck.

4. **`playlist.json` import strategy:** Import as static JSON (`import playlist from '../data/playlist.json'`) or fetch at runtime? Per ARCHITECTURE.md Anti-Pattern 4 and STACK.md, import is correct — avoids network request, tree-shaken, no config surface leak.

5. **Fullscreen button:** Include or not? Not required by any PLAY-* REQ. Recommendation: include it — zero cost, nice UX, `media-chrome` gives it for free.

6. **Keyboard shortcut for ±5s on ArrowUp/ArrowDown conflict:** ArrowUp/ArrowDown currently control volume. Overriding them for seek would break volume. Keep volume behavior; only ArrowLeft/ArrowRight need the 5s override.

---

## 14. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| media-chrome + React 19 StrictMode double-fire bugs | LOW | media-chrome uses custom elements internally, not React state; cleanup functions in `useEffect` handle double-registration |
| Stale sprites when video is re-encoded but sprites not regenerated | MEDIUM | CI always regenerates sprites — stale local files don't reach production |
| ffmpeg not available in GitHub Actions Ubuntu runner | LOW | `ubuntu-latest` includes ffmpeg by default; explicit `apt-get install -y ffmpeg` as belt-and-suspenders |
| LFS bandwidth for test video in dev | LOW | One 15 MB video × small team = negligible; CDN fallback is Phase 6 gate |
| Keyboard shortcuts conflict with browser defaults (e.g., Space scrolls page) | MEDIUM | media-chrome's built-in shortcut handler calls `preventDefault()`; custom handler must do the same |
| VTT tracks not loading if `crossOrigin` attribute is missing | MEDIUM | Explicitly set `crossOrigin=""` on `<video>`; document in component |
| happy-dom can't render web components → tests can't verify media-chrome integration | MEDIUM | Mock media-chrome components; manual browser testing for real behavior; Playwright E2E tests in Phase 6 |

---

*Research for Phase 2: Custom Video Player (media-chrome)*
*Completed: 2026-07-08*
