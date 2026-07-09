---
phase: 06-polish-content-freeze-launch-gates
plan: 10
type: summary
wave: 3
---

# 06-10 Summary: Runner Hover Tooltips

## What Changed

- Created reusable accessible `Tooltip` component (`src/components/ui/Tooltip.jsx`):
  - Renders through a portal attached to `document.body`.
  - Triggers on mouse enter/leave and focus/blur.
  - Positions above/below/left/right of trigger and clamps to viewport.
  - Respects `prefers-reduced-motion`.
- Added `src/styles/tooltip.css` for tooltip chrome and arrow.
- Imported tooltip styles in `src/main.jsx`.
- Wrapped `L1Chip` button in `Tooltip` showing `category.definition`.
- Wrapped `L2Chip` button in `Tooltip` showing `subcategory.definition` + `example`.
- Removed the old visually-hidden description span from `L2Chip`; tooltip now provides the accessible description via `aria-describedby`.
- Added tests:
  - `tests/components/ui/Tooltip.test.jsx` — hover, focus, hide, reduced motion.
  - `tests/components/tagging/L1Chip.test.jsx` — label render + definition tooltip.
  - `tests/components/tagging/L2Chip.test.jsx` — label render + definition/example tooltip.

## Verification

- `npx vitest run tests/components/ui/Tooltip.test.jsx` — 5/5 passing.
- `npx vitest run tests/components/tagging/L1Chip.test.jsx tests/components/tagging/L2Chip.test.jsx` — 9/9 passing.
- `npm test` — full suite green (444 tests).

## Files Modified

- `src/components/ui/Tooltip.jsx` (new)
- `src/styles/tooltip.css` (new)
- `src/main.jsx`
- `src/components/tagging/L1Chip.jsx`
- `src/components/tagging/L2Chip.jsx`
- `tests/components/ui/Tooltip.test.jsx` (new)
- `tests/components/tagging/L1Chip.test.jsx` (new)
- `tests/components/tagging/L2Chip.test.jsx` (new)
