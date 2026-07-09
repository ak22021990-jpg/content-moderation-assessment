---
phase: 07-launch-monitor
plan: 01
type: summary
wave: 1
---

# 07-01 Summary: Apps Script Submission Pipeline Fix

## What Changed

- Rewrote `scripts/apps-script/Code.gs` to fix production submission failures:
  - Added `doOptions(e)` handler to answer browser CORS preflight requests.
  - Fixed Origin header lookup to read from `e.headers` (Apps Script canonical location) with legacy fallbacks.
  - Extracted helpers for JSON response, origin, IP, HMAC, SHA-256, and property loading.
  - Made HMAC field-stripping regex robust for both leading and trailing comma positions.
- Updated `scripts/apps-script/README.md`:
  - Added CORS deployment note.
  - Added Troubleshooting section for missing Sheet rows (ALLOWED_ORIGIN, HMAC_SECRET, SHEET_ID, redeploy, CORS errors).
- Updated `tests/scripts/apps-script.test.js`:
  - Added `function doOptions` to required patterns.
  - Added tests for `e.headers` origin access and doOptions handler presence.

## Root Cause

The previous `Code.gs` read the Origin header from `e.postData.headers.Origin`, which is not where Apps Script web apps expose request headers. When `ALLOWED_ORIGIN` was set, every cross-origin POST was rejected as `invalid-origin` before reaching validation or Sheet writing. Additionally, no `doOptions` handler existed, so browsers blocked the request at the CORS preflight stage.

## Verification

- `npx vitest run tests/scripts/apps-script.test.js` — 35/35 passing.
- `npm test` — full suite green (460 tests).
- **Manual step remaining:** redeploy the Apps Script web app, update `VITE_APPS_SCRIPT_URL`, rebuild/deploy the Pages site, and complete one assessment end-to-end to confirm a Sheet row is written.

## Files Modified

- `scripts/apps-script/Code.gs`
- `scripts/apps-script/README.md`
- `tests/scripts/apps-script.test.js`
