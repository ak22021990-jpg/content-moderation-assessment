# Phase 5: Submission + One-Attempt Defense in Depth — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 05-submission-one-attempt-defense-in-depth
**Areas discussed:** Submission screen flow, Post-submission experience, Apps Script deployment & secrets, Failure UX & retry visibility

---

## Submission Screen Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-submit after scoreboard | Scoreboard renders fully, submission fires automatically in background. Candidate sees scoreboard with "Submitting results..." overlay/banner. | ✓ |
| Explicit submit button on scoreboard | Scoreboard renders with a "Submit Results" CTA button. Candidate reviews their scores before deciding to submit. | |
| Dedicated submit screen between | New SCREENS.SUBMITTING screen. Shows progress indicator + attempt count. Most code. | |

**User's choice:** Auto-submit after scoreboard
**Notes:** Scoreboard always visible first, submission is a background operation with non-blocking overlay.

---

## Post-Submission Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated thank-you screen | New SCREENS.SUBMIT_DONE screen replaces scoreboard. Clean terminal state. Scoreboard gone. | |
| Scoreboard + confirmation banner | Scoreboard stays visible with success banner/overlay. Candidate can still see scores after submission. | |
| Both: banner first, then thank-you | Scoreboard shows with success banner for ~5 sec, then auto-transitions to thank-you screen. | ✓ |

**User's choice:** Both — banner first (~5 sec), then thank-you
**Notes:** Gives candidate time to screenshot their scores, then clean terminal state.

---

## Apps Script Deployment & Secrets

| Option | Description | Selected |
|--------|-------------|----------|
| Repo-tracked with manual deploy | Apps Script code in `scripts/apps-script/Code.gs`. Deployed manually via copy-paste. Secrets in Apps Script Properties. | ✓ |
| Repo-tracked with clasp CLI deploy | Code in repo, clasp configured with `.clasp.json`. Deploy via npm script. CI-friendly. | |
| Separate — Apps Script editor only | Code lives only in Google Apps Script editor. Repo documents contract in `docs/apps-script.md`. No clasp. | |

**User's choice:** Repo-tracked with manual deploy
**Notes:** Source of truth in the repo. Deploy is a manual step. Secrets never touch the repo.

---

## Failure UX & Retry Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Visible retry banner with attempt count | "Submitting... (attempt 1/3)" banner updates per attempt. Final failure: overlay with manual retry button. | ✓ |
| Silent retry, only show on final failure | Scoreboard renders normally. Retries silently. Only failure shows error. Cleaner UX — most candidates never see retries. | |
| Dedicated submitting screen with progress | New SCREENS.SUBMITTING screen with progress bar + attempt counter. Maximum visibility. | |

**User's choice:** Agent's discretion — "you decide which best suits us"
**Notes:** Agent selected Option 1 (Visible retry banner) — aligns with the auto-submit overlay pattern from area 1, transparent, gives candidate confidence the system is working. 4xx errors surface immediately without retry. Only 5xx/network errors retry.

---

## the agent's Discretion

- Exact exponential backoff delays (suggested: 1s, 3s, 9s)
- HMAC header placement and format
- Whether submission module is a hook (`useSubmission`) or plain async function
- `SubmitDoneScreen` exact layout/styling (tokens deferred to Phase 6)
- Retry delay jitter strategy
- Apps Script rate-limit implementation (CacheService vs ScriptProperties)
- Formspree fallback code-path architecture (shared vs separate module)
- 4xx errors (validation failure, duplicate) do NOT retry — only 5xx + network errors
- Email normalization for Gmail: lowercase, strip dots, strip `+alias`

## Deferred Ideas

- Google Sheets dashboard/recruiter UI
- Email notification on new submission
- Automated clasp CI/CD for Apps Script
- PDF export, shareable URL (v2)
- Browser-fingerprint dedup (v2)
- Submission analytics/telemetry
- Offline service-worker retry (v2)
- GSAP transitions + design tokens (Phase 6)
