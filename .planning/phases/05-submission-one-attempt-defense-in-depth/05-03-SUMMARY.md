---
phase: 05-submission-one-attempt-defense-in-depth
plan: 03
subsystem: submission
tags: [formspree, env-toggle, fallback, vitest]
requires:
  - phase: 05-02
    provides: Apps Script doPost webhook + HMAC retry logic
  - phase: 04-scoring-scoreboard
    provides: scoreboard rendering + scoring engine
provides:
  - Formspree fallback submission path (env-toggled via VITE_SUBMISSION_BACKEND)
  - getSubmissionConfig() helper for endpoint resolution
  - Formspree mode strips HMAC from payload (shared secret not leaked)
  - Formspree-style submissionId (formspree-{timestamp})
affects:
  - Phase 6 (launch gates — CDN fallback swap uses same env-conditional pattern)
tech-stack:
  added:
    - "@formspree/react@^3.0.0 (installed as dependency; submitResults uses raw fetch, package available for future hook-based forms)"
  patterns:
    - "Module-level env var constants (BACKEND, FORMSPREE_FORM_ID) with typeof import.meta guard"
    - "getSubmissionConfig() returns { endpoint, isFormspree } — single source of truth for endpoint resolution"
    - "Formspree path: payload stripped of hmac field before POST (IIFE destructure)"
    - "Formspree on success: submissionId = formspree-{Date.now()} (no server-side rowId concept)"
key-files:
  created:
    - ".planning/phases/05-submission-one-attempt-defense-in-depth/05-03-SUMMARY.md"
  modified:
    - src/utils/submission.js — Added BACKEND/FORMSPREE_FORM_ID module constants + getSubmissionConfig()
    - src/components/scoreboard/ScoreboardScreen.jsx — Imports getSubmissionConfig; branches on isFormspree
    - package.json — Added @formspree/react@^3.0.0 dependency
    - tests/utils/submission.test.js — Added getSubmissionConfig unit tests (2 tests)
    - tests/components/scoreboard/ScoreboardScreen.test.jsx — Added Formspree integration test
key-decisions:
  - "getSubmissionConfig() centralizes endpoint resolution — callers don't read env vars directly"
  - "Formspree mode reuses submitResults with same retry logic (exponential backoff, 3 attempts)"
  - "Formspree has NO HMAC signing, NO dedup, NO Sheet writing — degraded fallback documented in code"
  - "When VITE_SUBMISSION_BACKEND=formspree and VITE_FORMSPREE_FORM_ID set: endpoint = https://formspree.io/f/{ID}"
  - "When neither Formspree nor Apps Script URL configured: simulated success for local dev (unchanged)"
patterns-established:
  - "Module-level env defaults with typeof import.meta guard pattern (compatible with test env)"
  - "IIFE destructure to strip hmac field: (() => { const { hmac, ...rest } = payload; return rest })()"
test-coverage:
  - "tests/utils/submission.test.js: 13 tests (2 new getSubmissionConfig tests)"
  - "tests/components/scoreboard/ScoreboardScreen.test.jsx: 15 tests (1 new Formspree test)"
  - "Full suite: 29 files, 425 tests, 0 failures"
---
