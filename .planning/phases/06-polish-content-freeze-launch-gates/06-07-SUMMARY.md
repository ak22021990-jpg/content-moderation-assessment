---
phase: 06-polish-content-freeze-launch-gates
plan: 07
type: summary
wave: 2
---

# 06-07 Summary: Guidelines Redesign

## What Changed

- Rewrote `src/components/GuidelinesScreen.jsx` as an accordion + sticky side-panel layout.
- Each L1 category renders as a collapsible card with a custom SVG icon.
- Expanded card reveals its definition and L2 sub-categories (with definitions and examples) in a right-hand detail panel.
- Only one L1 card expanded at a time; clicking again collapses.
- Added `iconKey` to every category in `src/data/taxonomy.json`.
- Fixed Framer Motion `borderColor` animation error by removing CSS-variable tween from `motion.button` animate (border color now set statically).
- Rewrote `tests/components/GuidelinesScreen.test.jsx` to cover accordion behavior, side-panel content, icon rendering, and no hard-coded labels.

## Verification

- `npx vitest run tests/components/GuidelinesScreen.test.jsx` — 16/16 passing.
- `npm test` — full suite green (430+ tests).

## Files Modified

- `src/components/GuidelinesScreen.jsx`
- `src/data/taxonomy.json`
- `tests/components/GuidelinesScreen.test.jsx`
