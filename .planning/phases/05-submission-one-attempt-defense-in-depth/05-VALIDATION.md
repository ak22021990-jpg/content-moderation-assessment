---
phase: 05
slug: submission-one-attempt-defense-in-depth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-08
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 |
| **Config file** | vitest.config.js |
| **Quick run command** | `npx vitest run tests/utils/submission.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** `npx vitest run`
- **After every plan wave:** `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-T1 | 01 | 1 | ATTEMPT-04 | T-05-01 | SHA-256 email hash via Web Crypto, no plaintext email in localStorage | unit | `npx vitest run tests/utils/dedup.test.js` | ✅ | ⬜ pending |
| 05-01-T2 | 01 | 1 | SUBMIT-01, SUBMIT-02, ATTEMPT-04 | T-05-02, T-05-03 | JSON payload assembly, HMAC-SHA256 signing, VITE_HMAC_SECRET from build-time env | unit | `npx vitest run tests/utils/submission.test.js` | ❌ W0 | ⬜ pending |
| 05-01-T3 | 01 | 1 | SUBMIT-01, SUBMIT-02, SUBMIT-08, ATTEMPT-01 | T-05-04, T-05-05, T-05-SC | Screen transitions, overlay states, localStorage flag on 200, identity clear on done | component + integration | `npx vitest run tests/components/SubmitDoneScreen.test.jsx tests/components/scoreboard/ScoreboardScreen.test.jsx` | ❌ W0 (SubmitDoneScreen) / ✅ (ScoreboardScreen) | ⬜ pending |
| 05-02-T1 | 02 | 2 | SUBMIT-04, SUBMIT-05, SUBMIT-06, SUBMIT-07, ATTEMPT-03 | T-05-06..T-05-10 | HMAC validation, Origin check, rate-limit, SHA-256 dedup, Sheet write with formula injection defense | manual | Manual Apps Script deploy + curl test | ❌ W0 (manual only) | ⬜ pending |
| 05-02-T2 | 02 | 2 | SUBMIT-03, SUBMIT-09 | T-05-11, T-05-12 | Exponential backoff (1s/3s/9s), 4xx immediate, 5xx/network retry, error overlay with retry button | unit + component | `npx vitest run tests/utils/submission.test.js tests/components/scoreboard/ScoreboardScreen.test.jsx` | ❌ W0 / ✅ (extend) | ⬜ pending |
| 05-03-T1 | 03 | 3 | SUBMIT-10 | T-05-13, T-05-14 | VITE_SUBMISSION_BACKEND env toggle, Formspree endpoint, hmac field stripped | unit + manual | `npx vitest run tests/utils/submission.test.js` | ❌ W0 | ⬜ pending |
| 05-03-T2 | 03 | 3 | — | — | Full test suite green, brand guard scan passes | test suite | `npx vitest run && npx eslint .` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/utils/submission.test.js` — stubs for buildSubmissionPayload, buildHmac, submitResults, hashEmail
- [ ] `tests/components/SubmitDoneScreen.test.jsx` — stubs for render with identity, no back nav, terminal state
- [ ] `tests/utils/dedup.test.js` — update from placeholder hash (trim+lowercase) to real Web Crypto SHA-256 tests
- [ ] `tests/state/screens.test.js` — bump expected key count from 6 to 7 (add SUBMIT_DONE)
- [ ] `scripts/apps-script/Code.gs` — manual deploy gate (not automated testable)
- [ ] `scripts/apps-script/README.md` — deployment documentation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Apps Script HMAC validation | SUBMIT-04 | Server-side; no local Apps Script runtime | Deploy Code.gs via copy-paste, POST test payload with valid/expired HMAC, verify 200/403 |
| Apps Script Origin validation | SUBMIT-05 | Requires deployed endpoint | POST from wrong origin, verify 403 |
| Apps Script rate limiting | SUBMIT-06 | Requires real IP traffic | Send 4 rapid requests from same IP, verify 429 on 4th |
| Apps Script SHA-256 dedup | ATTEMPT-03 | Requires Sheet state | POST same hashed email twice, verify 409 on second |
| Sheet row written | SUBMIT-07 | Requires live Sheet | Verify row appears in Google Sheet with correct columns |
| Formspree fallback | SUBMIT-10 | Third-party endpoint | Set VITE_SUBMISSION_BACKEND=formspree, complete assessment, verify Formspree dashboard shows submission |
| End-to-end submission | SUBMIT-01, SUBMIT-02 | Requires deployed Apps Script | Complete full 5-video assessment, verify POST succeeds, verify Sheet row |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
