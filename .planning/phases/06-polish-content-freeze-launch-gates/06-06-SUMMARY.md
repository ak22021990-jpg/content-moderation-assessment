# 06-06 Summary — Disable Brand Guard Rails

**Status:** Complete
**Executed:** 2026-07-09

## What Changed

- `docs/brand-guardrails.md` — marked guard as disabled, archived original forbidden-string list, added risk acceptance note.
- `.husky/pre-commit` — replaced brand scan with skip message and `exit 0`.
- `.github/workflows/brand-guard.yml` — replaced scan step with skip message.
- `.planning/PROJECT.md` — added Key Decision row for disabled guard; updated Constraints section.
- `.planning/REQUIREMENTS.md` — BRAND-* requirements marked deferred.

## Verification

- `.husky/pre-commit` exits 0.
- No forbidden-string scan runs in CI.

## Risks

- Legal/client exposure now possible since Disney/Mickey strings can be committed.
- Decision logged with `⚠️ Revisit` outcome in PROJECT.md.
