# 06-09 Summary — Tag State Reset Per Video

**Status:** Complete
**Executed:** 2026-07-09

## What Changed

- `src/components/tagging/TagPanel.jsx` now accepts a `resetKey` prop.
- Added `useEffect` that dispatches `RESET` when `resetKey` changes.
- `src/components/RunnerScreen.jsx` passes `currentVideoIndex` as `resetKey` to `TagPanel`.
- `tagReducer.js` already had `RESET` action support.
- Added test in `tests/components/tagging/TagPanel.test.jsx` verifying selections clear on `resetKey` change.

## Verification

- `npx vitest run tests/components/tagging/TagPanel.test.jsx` passes.

## Notes

- Each video now starts with a clean tag panel.
- The `onSelectionChange` callback fires with empty arrays after reset, so the runner's `tagSelectionRef` is updated correctly.
