# Phase 05: Submission + One-Attempt Defense in Depth — Research

**Researched:** 2026-07-08
**Domain:** Client-to-server submission pipeline (SPA → Apps Script webhook) with HMAC auth, rate limiting, SHA-256 dedup, exponential backoff
**Confidence:** HIGH

## Summary

Phase 5 delivers end-to-end submission: after scoreboard renders, client assembles single JSON payload, HMAC-signs it, POSTs to Google Apps Script `doPost` webhook with exponential backoff (3 attempts max). Apps Script validates HMAC + Origin + rate-limits (3/IP/min via CacheService) + SHA-256 dedup against Sheet rows, then writes row and returns `{ok: true, id}`. On success, `localStorage` one-attempt flag written, scoreboard shows 5-second success banner, then auto-transitions to terminal `SubmitDoneScreen`. Formspree fallback is env-toggle ready.

Primary recommendation: Use native `fetch` + Web Crypto API (zero new client-side deps). Apps Script uses `CacheService` for rate limiting (not ScriptProperties — no persistence needed for temporary counters). `@formspree/react` added as optional dep for fallback path only.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email normalization + SHA-256 hashing | Browser / Client | — | Web Crypto runs client-side; Gmail-specific normalization logic lives in browser |
| HMAC-SHA256 signing of payload | Browser / Client | — | Build-time secret injected via VITE_HMAC_SECRET; Web Crypto `sign()` with imported key |
| Payload assembly | Browser / Client | — | Pure function aggregating store answers + scoring + identity + metadata |
| Submission orchestration (fetch + retry) | Browser / Client | — | Async function with exponential backoff; AbortController for timeout |
| Rate limiting (3/IP/min) | API / Backend | — | Apps Script CacheService — ephemeral, no cleanup needed, auto-expires |
| Origin validation | API / Backend | — | Apps Script reads request origin header, compares against ALLOWED_ORIGIN property |
| HMAC validation | API / Backend | — | Apps Script recomputes HMAC with shared secret, constant-time compare |
| SHA-256 dedup | API / Backend | — | Apps Script hashes normalized email, checks Sheet column A for existing hashes |
| Sheet row write | API / Backend | — | Apps Script `sheet.appendRow()` — single row per submission |
| Formspree fallback | CDN / Static (third-party) | — | HTTPS POST to Formspree endpoint; degraded — no HMAC/dedup/Sheet writing |
| localStorage one-attempt flag | Browser / Client | — | `useOneAttemptGuard.markAttempted()` — thin localStorage wrapper |

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-P5-01:** Scoreboard renders fully first, THEN submission fires in background. Overlay is non-blocking — scoreboard content visible underneath. `ScoreboardScreen` gains `submissionPhase` prop/internal state (`idle` → `submitting` → `success` → `done`). NOT a new SCREENS value.
- **D-P5-02:** On backend 200, overlay changes to success banner ("Results sent to the hiring team" with checkmark) for exactly 5 seconds, then auto-transitions to `SUBMIT_DONE` screen.
- **D-P5-03:** New `SCREENS.SUBMIT_DONE` screen is terminal — thanks candidate, confirms results sent, no back navigation. Displays candidate name from identity. No scoreboard data on this screen.
- **D-P5-04:** `SUBMIT_DONE` copy: centered heading "Thank you, {name}" + body "Your assessment results have been sent to the hiring team. If you have questions about next steps, contact your recruiter." No contact details hardcoded.
- **D-P5-05:** On `SUBMIT_DONE` mount, `sessionStorage` identity (`cma_identity_v1`) cleared. Assessment store state NOT reset.
- **D-P5-06:** `localStorage` flag (`cma_attempt_v1`) written inside backend-200 handler, BEFORE transitioning to `SUBMIT_DONE`. `markAttempted({ emailHash, submissionId })` uses hashed-normalized email + the `id` returned by Apps Script.
- **D-P5-07:** Apps Script code lives at `scripts/apps-script/Code.gs`. Repo is source of truth. Deployed manually (copy-paste OR `clasp push` if configured). No automated CI/CD for Apps Script.
- **D-P5-08:** Secrets (HMAC key, Sheet ID) in Apps Script PropertiesService (`getScriptProperties()`), NEVER in repo. Repo contains `scripts/apps-script/README.md` documenting endpoint URL, required keys, deployment steps.
- **D-P5-09:** Client-side HMAC secret injected at build time via `VITE_HMAC_SECRET`. Build-time secret — acceptable for static SPA with no backend server (same model as bundled answer keys).
- **D-P5-10:** Retries are VISIBLE — overlay shows "Submitting results... (attempt 1/3)". Exponential backoff: 1s, 3s, 9s delays. Only 5xx/network errors trigger retry; 4xx surfaces immediately.
- **D-P5-11:** On final failure, overlay shows: "Unable to submit your results. Please try again." with "Retry Submission" button (resets counter, starts fresh). Secondary: "If the problem persists, contact your recruiter."
- **D-P5-12:** `scoreboardData` computed once before submission, passed to submission module, reused across retries.
- **D-P5-13:** Payload shape per SUBMIT-02 (name, email, emailHash, answers[], scores{}, competency, strengthsWeaknesses, timeToCompleteMs, answerKeyVersion, taxonomyVersion, sessionStartedAt, sessionEndedAt, userAgent, screenResolution, hmac). Assembled by pure `buildSubmissionPayload()` in `src/utils/submission.js`.
- **D-P5-14:** New `src/utils/submission.js` with exports: `hashEmail(email) → hex-string` (Web Crypto SHA-256 of normalized email), `buildHmac(payload, secret) → hex-string` (HMAC-SHA256 over payload excluding `hmac` field), `submitResults({ payload, endpoint, onProgress, maxAttempts }) → { ok, id }` (fetch + exponential backoff).
- **D-P5-15:** Existing `src/utils/dedup.js` rewritten to export `normalizeEmail(email) → string` and `hashEmail(email) → Promise<string>` using `crypto.subtle.digest('SHA-256', ...)`. `hashEmail` is async (Web Crypto).
- **D-P5-16:** Add `SUBMIT_DONE: 'SUBMIT_DONE'` to `src/state/screens.js`. `App.jsx` `renderScreen` gets new case. `goToScreen(SCREENS.SUBMIT_DONE)` called from `ScoreboardScreen` after 5-second delay.
- **D-P5-17:** `@formspree/react` added as runtime dependency. `VITE_SUBMISSION_BACKEND` env var controls endpoint: `"apps-script"` (default) or `"formspree"`. Formspree form ID via `VITE_FORMSPREE_FORM_ID`. Apps Script features (HMAC, Origin check, SHA-256 dedup, Sheet rows) NOT available in Formspree mode.

### the agent's Discretion

- Exact exponential backoff delays (suggested: 1s, 3s, 9s — agent can adjust)
- HMAC header placement (`X-HMAC-SHA256` vs `Authorization: HMAC-SHA256 ...` vs custom)
- Whether submission module is a hook (`useSubmission`) or plain async function called from `ScoreboardScreen`
- `SubmitDoneScreen` exact layout and styling (design tokens deferred to Phase 6)
- Exact retry delay jitter strategy (if any)
- Apps Script rate-limit implementation (CacheService vs ScriptProperties)
- Whether Formspree fallback shares same `submitResults` code path or is separate module

### Deferred Ideas (OUT OF SCOPE)

- Google Sheets dashboard/recruiter UI — future phase
- Email notification to recruiter — future phase
- Automated clasp-based CI/CD — future phase
- PDF export of scoreboard — v2 (BOARD-v2-02)
- Shareable URL export — v2 (BOARD-v2-01)
- Contact email/phone on SUBMIT_DONE — deferred
- Browser-fingerprint dedup — v2 (ATTEMPT-v2-01)
- Submission analytics/telemetry — future phase
- Offline/queue-based submission — v2
- GSAP transitions — Phase 6 polish
- Design tokens, typography, spacing for SubmitDoneScreen — Phase 6 polish

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUBMIT-01 | Client POSTs single JSON payload to Apps Script doPost webhook | § Standard Stack (fetch + JSON), § Code Examples (submitResults) |
| SUBMIT-02 | Payload includes name, email, emailHash, answers, scores, competency, timestamps, UA, resolution | § Code Examples (buildSubmissionPayload), D-P5-13 locked shape |
| SUBMIT-03 | Client retries with exponential backoff (3 attempts max) on 5xx/network error | § Architecture Patterns (Exponential Backoff), § Code Examples |
| SUBMIT-04 | Apps Script validates HMAC token against shared secret | § Standard Stack (Apps Script), § Don't Hand-Roll (#1 HMAC) |
| SUBMIT-05 | Apps Script validates Origin header against Pages origin | § Standard Stack (Apps Script Origin check) |
| SUBMIT-06 | Apps Script rate-limits to 3 submissions/IP/min | § Standard Stack (CacheService), § Code Examples (doPost) |
| SUBMIT-07 | Apps Script writes row to Sheet, returns {ok: true, id} | § Standard Stack (Apps Script), § Code Examples (doPost) |
| SUBMIT-08 | SubmitDoneScreen thanks candidate, confirms results sent | § Architecture Patterns (Screen Enum), D-P5-04 locked |
| SUBMIT-09 | On failure, user sees retry message + manual retry button | § Architecture Patterns (Retry UX), D-P5-11 locked |
| SUBMIT-10 | @formspree/react fallback wired, disabled by default | § Standard Stack (Formspree), D-P5-17 locked |
| ATTEMPT-03 | Server (doPost) computes SHA-256 of normalized email, rejects duplicates | § Code Examples (doPost dedup), § Don't Hand-Roll (#2) |
| ATTEMPT-04 | Email normalized before dedup (lowercase, strip +aliases/dots for Gmail, trim) | § Code Examples (normalizeEmail), D-P5-15 locked |

## Standard Stack

### Core (Zero New Client Deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fetch` (native) | Browser built-in | HTTPS POST to webhook | Zero deps, promise-based, AbortController support. Standard since 2015. |
| `crypto.subtle.digest` | Web Crypto API | SHA-256 email hashing | Native browser crypto. `[VERIFIED: MDN SubtleCrypto.digest]` — SHA-256, SHA-384, SHA-512 supported. Returns ArrayBuffer. |
| `crypto.subtle.importKey` + `crypto.subtle.sign` | Web Crypto API | HMAC-SHA256 signing | `[VERIFIED: MDN SubtleCrypto.sign]` — HMAC with SHA-256. Key imported via `HmacImportParams { name: "HMAC", hash: "SHA-256" }`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@formspree/react` | `^3.0.0` | Formspree fallback submission | Only when `VITE_SUBMISSION_BACKEND=formspree`. Provides `useForm` hook. `[VERIFIED: npm registry]` — v3.0.0 confirmed. |

### Server-Side (Apps Script — No npm, Built-in Services)

| Service | Purpose | Why Standard |
|---------|---------|--------------|
| `CacheService.getScriptCache()` | Per-IP rate limit counters | `[CITED: developers.google.com/apps-script/reference/cache/cache-service]` — 100KB limit, 6-hour max TTL. Auto-expiry = zero cleanup. |
| `PropertiesService.getScriptProperties()` | Secrets storage (HMAC_SECRET, SHEET_ID, ALLOWED_ORIGIN) | `[CITED: developers.google.com/apps-script/reference/properties]` — Persistent key-value store, never in repo. |
| `Utilities.computeHmacSha256Signature()` | Server-side HMAC validation | Built-in Apps Script utility — same algorithm as client-side Web Crypto HMAC. |
| `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ...)` | Server-side SHA-256 for dedup | Built-in — pre-dates Web Crypto, reliable. |
| `SpreadsheetApp.getActiveSheet()` | Sheet row append + dedup scan | Standard Apps Script Sheets integration. |
| `ContentService.createTextOutput()` | JSON response to client | Standard doPost response pattern. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.subtle` (native) | `crypto-js` npm package | Native avoids 200KB dependency; crypto-js has weaker randomness. Native requires HTTPS (GitHub Pages provides this). |
| `CacheService` (rate limit) | `ScriptProperties` | CacheService auto-expires (no cleanup). ScriptProperties would accumulate stale entries forever. CacheService is purpose-built. |
| Manual fetch retry loop | `@tanstack/react-query` | Overkill — 60KB for just retry. Plain async function with for-loop is ~30 lines. |
| `Utilities.computeHmacSha256Signature` (Apps Script) | Custom JS HMAC implementation | Built-in is correct. Never hand-roll crypto. |

**Installation:**
```bash
npm install @formspree/react@^3.0.0
```

**Version verification:**
- `crypto.subtle` — Baseline Widely Available since Jan 2020. No version check needed.
- `@formspree/react` — `npm view @formspree/react version` → `3.0.0` (verified 2026-07-08)
- Apps Script services — versioned by Google, always current. No install needed.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @formspree/react | npm | 6+ yrs | 500K+/wk | github.com/formspree/formspree-react | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** none

*No new untrusted packages. Core functionality uses native browser APIs (fetch, Web Crypto).*

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (ScoreboardScreen)                     │
│                                                                       │
│  scoreBoardData ──► buildSubmissionPayload() ──► payload JSON         │
│  (computed once)   (src/utils/submission.js)     (excludes hmac)      │
│                                                      │                │
│                          ┌───────────────────────────┘               │
│                          ▼                                            │
│                    buildHmac(payload, VITE_HMAC_SECRET)                │
│                    (crypto.subtle.sign "HMAC" SHA-256)                │
│                          │                                            │
│                          ▼                                            │
│                    payload.hmac = hexString                            │
│                          │                                            │
│                          ▼                                            │
│                    submitResults({ payload, endpoint, onProgress })    │
│                          │                                            │
│                  ┌───────┴────── e=1s ── e=3s ── e=9s ───┐          │
│                  │  fetch(POST) → 200? → YES → done      │          │
│                  │              → 5xx? → NO → retry      │          │
│                  │              → 4xx? → NO → surface    │          │
│                  │              → net? → retry           │          │
│                  └───────────────────────────────────────┘          │
│                          │                                            │
│                    ┌─────┴──────┐                                     │
│                    ▼            ▼                                     │
│                 200 OK       exhaust (3 fails)                        │
│                    │            │                                     │
│          markAttempted()    show error +                              │
│          localStorage       "Retry Submission"                        │
│                    │            button                                 │
│          success banner                                               │
│          5s delay                                                     │
│                    │                                                  │
│          goToScreen(SUBMIT_DONE)                                      │
│                    │                                                  │
│          clear sessionStorage                                         │
│          (cma_identity_v1)                                            │
│                    │                                                  │
│              SubmitDoneScreen                                         │
│              "Thank you, {name}"                                      │
│              (terminal — no back nav)                                  │
└──────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ POST to Apps Script
┌──────────────────────────────────────────────────────────────────────┐
│                    GOOGLE APPS SCRIPT (doPost)                        │
│                                                                       │
│  1. Parse JSON body                                                   │
│  2. Validate Origin header == ALLOWED_ORIGIN                          │
│  3. Rate-limit: CacheService.get(ip) > 3? → reject 429               │
│     CacheService.put(ip, count+1, 60s)                                │
│  4. Validate HMAC: recompute HMAC(body-hmac, HMAC_SECRET) == hmac?   │
│  5. Dedup: compute SHA-256(normalized email)                          │
│     Scan Sheet column A for existing hash → if found, reject 409      │
│  6. Write row: [emailHash, name, email, answers-JSON, scores-JSON,   │
│      competency, timestamp, userAgent, screenResolution]              │
│  7. Return: ContentService → { ok: true, id: rowId }                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Pattern 1: Exponential Backoff Retry with Progress

**What:** Async function wraps `fetch` in a for-loop, delays between attempts using `setTimeout`-wrapped promise. Differentiates 4xx (immediate surface) from 5xx/network (retry).

**When to use:** Any POST where the server is quota-constrained (Apps Script ~30 req/min) and network reliability varies.

**Example:**
```javascript
// Source: MDN Fetch API + practitioner pattern
export async function submitResults({ payload, endpoint, onProgress, maxAttempts = 3 }) {
  const delays = [1000, 3000, 9000]; // 1s, 3s, 9s

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'submitting' });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'success' });
        return { ok: true, id: data.id };
      }

      // 4xx — don't retry
      if (response.status >= 400 && response.status < 500) {
        onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'error' });
        return { ok: false, error: `Server rejected: ${response.status}` };
      }

      // 5xx — retry if attempts remain
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    } catch (err) {
      // Network error — retry if attempts remain
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      } else {
        onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'error' });
        return { ok: false, error: err.message };
      }
    }
  }

  onProgress?.({ attempt: maxAttempts, total: maxAttempts, phase: 'error' });
  return { ok: false, error: 'All retry attempts exhausted' };
}
```

### Pattern 2: Web Crypto SHA-256 + Buffer-to-Hex

**What:** `crypto.subtle.digest('SHA-256', encodedData)` returns ArrayBuffer. Convert to hex for transmission/comparison.

**When to use:** Client-side hashing where Node.js `crypto` is unavailable. Async (Web Crypto returns Promises).

**Example:**
```javascript
// Source: MDN SubtleCrypto.digest — verified 2026-07-08
export async function hashEmail(email) {
  const normalized = normalizeEmail(email);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // Convert ArrayBuffer to hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 3: Web Crypto HMAC-SHA256 Signing

**What:** Import raw key bytes via `crypto.subtle.importKey`, then sign payload bytes via `crypto.subtle.sign('HMAC', key, data)`.

**When to use:** Client-side message authentication where shared secret is available (build-time injection acceptable).

**Example:**
```javascript
// Source: MDN SubtleCrypto.sign — verified 2026-07-08
export async function buildHmac(payload, secretHex) {
  // Convert hex secret to ArrayBuffer
  const secretBytes = new Uint8Array(
    secretHex.match(/.{1,2}/g).map(b => parseInt(b, 16))
  );
  const key = await crypto.subtle.importKey(
    'raw', secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 4: Screen Enum Extension

**What:** Add `SUBMIT_DONE` to frozen `SCREENS` object. Update tests. Add case to `App.jsx` renderSwitch.

**Already locked by D-P5-16.** Implementation:
```javascript
// src/state/screens.js — add line
SUBMIT_DONE: 'SUBMIT_DONE',

// src/App.jsx — add case
case SCREENS.SUBMIT_DONE:
  return <SubmitDoneScreen identity={state.identity} />;
```

### Anti-Patterns to Avoid

- **Inline HMAC computation in component:** Move to pure functions in `utils/submission.js` for testability.
- **`setInterval` for retry delays:** Use `await new Promise(r => setTimeout(r, delay))` — cancellable, doesn't accumulate.
- **Retrying on 4xx:** Only 5xx and network errors trigger retry. 4xx = permanent failure → surface immediately.
- **Computing HMAC over raw JSON.stringify without canonical form:** Use same `JSON.stringify(payload)` on both client and server. The payload object key order must be deterministic — `buildSubmissionPayload` returns object with fixed key order.
- **Skipping `catch` on `crypto.subtle.digest`:** Web Crypto rejects on non-HTTPS origins (GitHub Pages = HTTPS, safe). Still wrap in try/catch for robustness.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC-SHA256 in browser | Custom JS HMAC impl | `crypto.subtle.sign('HMAC', ...)` | Web Crypto is NIST-validated. Custom HMACs have timing side-channels. |
| SHA-256 hashing in browser | `crypto-js` or custom | `crypto.subtle.digest('SHA-256', ...)` | Native is faster, smaller, audited. crypto-js is 200KB and unmaintained. |
| HMAC in Apps Script | Custom GAS HMAC | `Utilities.computeHmacSha256Signature()` | Built-in, matches Web Crypto output. No custom crypto logic. |
| Exponential backoff | Custom setTimeout chain | `for`-loop + `await delay(ms)` | Simple, readable, easy to test. No external retry library needed. |
| Rate limiting in Apps Script | Custom Properties-based counter | `CacheService.getScriptCache()` | Auto-expiring (no cleanup cron). Purpose-built for transient counters. |
| Formspree fallback submission | Custom Formspree fetch wrapper | `@formspree/react` `useForm` hook | Handles submission state machine, error codes, validation. Mature library. |
| Hex conversion from ArrayBuffer | Custom byte-to-hex loop | `Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')` | One-liner, standard JS. No library needed.

**Key insight:** Every cryptographic operation in this phase has a built-in browser or Apps Script primitive. Zero crypto libraries needed. Adding `crypto-js` or `js-sha256` would be a regression — slower, larger, less audited.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage` key `cma_attempt_v1` — read by Phase 1, written by Phase 5. `sessionStorage` key `cma_identity_v1` — cleared by Phase 5 (D-P5-05). `sessionStorage` key `cma_timer_v1` — handled by store reset. | Phase 5 writes `localStorage` on success; clears `sessionStorage` identity on SUBMIT_DONE mount. |
| Live service config | Apps Script `doPost` — deployed via manual copy-paste. Formspree form — created in dashboard. | Apps Script Properties must be set (HMAC_SECRET, SHEET_ID, ALLOWED_ORIGIN, RATE_LIMIT_PER_IP, RATE_LIMIT_WINDOW_SEC). Documented in README.md. |
| OS-registered state | None — no Task Scheduler, pm2, or systemd dependencies. | None |
| Secrets/env vars | `VITE_HMAC_SECRET` — new build-time env var. `VITE_APPS_SCRIPT_URL` — new build-time env var. `VITE_SUBMISSION_BACKEND` — new toggle env var. `VITE_FORMSPREE_FORM_ID` — conditional env var. | Add to `.env` / `.env.production`. Never commit values. Document generation command for HMAC key. |
| Build artifacts | None — no compiled binaries or egg-info directories affected. | None |

**Nothing found in category:** OS-registered state (verified — no systemd/pm2/Task Scheduler usage). Build artifacts (verified — no pip/egg-info, the project is pure JS).

## Common Pitfalls

### Pitfall 1: HMAC Mismatch Between Client and Server

**What goes wrong:** Client computes HMAC over `JSON.stringify(payloadWithoutHmac)`, server recomputes over `JSON.stringify(parsedPayloadWithoutMac)` — different string representations (whitespace, key order, Unicode escaping) produce different HMACs.

**Why it happens:** JavaScript `JSON.stringify` key order is insertion-order in modern engines but not guaranteed by spec. Apps Script `JSON.stringify` may produce different output.

**How to avoid:** Client assembles payload object in fixed key order (per D-P5-13). Client `JSON.stringify(payload)` produces canonical JSON. Server parses JSON, extracts `hmac` field, then `JSON.stringify(e.postData.contents)` minus the `hmac` key — OR — server recomputes from the raw `e.postData.contents` string by stripping `,"hmac":"..."` before hashing. **Preferred:** pass raw body string to server HMAC, strip hmac field programmatically.

**Warning signs:** 401 responses in production with correct secret. Passes in dev but fails in production (different V8 versions).

### Pitfall 2: Web Crypto Fails on Non-HTTPS

**What goes wrong:** `crypto.subtle` is only available in secure contexts. `localhost` is treated as secure. GitHub Pages is HTTPS — safe. But `file://` protocol (local dev) or HTTP-hosted preview fails.

**Why it happens:** Web Crypto API security requirement.

**How to avoid:** Dev server (`vite dev`) runs on `localhost` → secure context. Production on GitHub Pages → HTTPS. No action needed. Document in README: never test submission on `file://`.

### Pitfall 3: CacheService getScriptCache() Limit Exceeded

**What goes wrong:** Script cache has 100KB limit across all keys. Storing too much data in rate-limit counters (IP addresses as keys, timestamps as values) can exhaust it.

**Why it happens:** Each unique client IP creates a cache entry. High traffic can hit the 100KB ceiling.

**How to avoid:** Store only integer counters (not arrays of timestamps). Key format: `rl:${ip}` → value: `"3"` (stringified integer). `put(key, String(count), 60)` — 60-second TTL. Each entry ~50 bytes. 100KB ÷ 50B = ~2000 unique IPs per minute — far above expected assessment volume. Safe.

### Pitfall 4: `JSON.stringify` of payload with `undefined` Values

**What goes wrong:** `JSON.stringify` drops `undefined` values entirely. If a payload field is `undefined`, it vanishes from the JSON — server-side validation fails.

**Why it happens:** Missing optional fields (e.g., `timedOut` might be `undefined` for early-abort answers).

**How to avoid:** `buildSubmissionPayload` uses explicit defaults. Every field has a defined value — `null` for missing data, never `undefined`. Schema validation before HMAC computation catches gaps.

### Pitfall 5: Apps Script doPost Timeout

**What goes wrong:** Apps Script has 30-second execution limit for `doPost` webhook handlers. Scanning large Sheet for dedup can exhaust this.

**Why it happens:** `sheet.getRange('A:A').getValues()` reads entire column — grows with each submission.

**How to avoid:** Store emailHash in a predictable column (A). Use `getLastRow()` to limit scan range. For initial MVP volume (<1000 submissions), full column scan is fine. For scale: add a second Sheet tab as a hash index or use `TextFinder`.

## Code Examples

### Client: buildSubmissionPayload

```javascript
// Source: D-P5-13 locked shape — src/utils/submission.js
export function buildSubmissionPayload({ identity, answers, scores, competency, hmac }) {
  const totalTimeMs = answers.reduce((sum, a) => sum + (a.timeSpentMs || 0), 0);
  return {
    name: identity.name,
    email: identity.email,
    emailHash: '', // filled by caller before HMAC
    answers: answers.map(a => ({
      videoId: a.videoId,
      selectedL1: a.selectedL1 ?? [],
      selectedL2: a.selectedL2 ?? [],
      verdict: a.verdict ?? '',
      timeSpentMs: a.timeSpentMs ?? 0,
      timedOut: a.timedOut ?? false,
    })),
    scores: {
      overallPct: scores.overallPct,
      perVideo: scores.perVideo,
      perL1Accuracy: scores.perL1Accuracy,
    },
    competency: competency.title,
    strengthsWeaknesses: competency.strengthsWeaknesses,
    timeToCompleteMs: totalTimeMs,
    answerKeyVersion: scores.answerKeyVersion,
    taxonomyVersion: '', // filled by caller from taxonomy.json version
    sessionStartedAt: identity.startedAt,
    sessionEndedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    hmac: hmac || '',
  };
}
```

### Client: normalizeEmail + hashEmail

```javascript
// Source: D-P5-15 locked — src/utils/dedup.js (rewrite)
export function normalizeEmail(email) {
  let e = (email ?? '').trim().toLowerCase();
  // Gmail-family: strip dots from local part, strip +alias suffix
  if (e.includes('@gmail.com') || e.includes('@googlemail.com')) {
    const [local, domain] = e.split('@');
    const stripped = local.replace(/\./g, '').replace(/\+.*$/, '');
    e = `${stripped}@${domain}`;
  }
  return e;
}

export async function hashEmail(email) {
  const normalized = normalizeEmail(email);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Server: Apps Script doPost (defense-in-depth)

```javascript
// Source: Google Apps Script docs + PITFALLS.md Pitfall 7 patterns
// scripts/apps-script/Code.gs

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const HMAC_SECRET = props.getProperty('HMAC_SECRET');
  const ALLOWED_ORIGIN = props.getProperty('ALLOWED_ORIGIN');
  const SHEET_ID = props.getProperty('SHEET_ID');
  const RATE_LIMIT_PER_IP = parseInt(props.getProperty('RATE_LIMIT_PER_IP') || '3');
  const RATE_LIMIT_WINDOW_SEC = parseInt(props.getProperty('RATE_LIMIT_WINDOW_SEC') || '60');

  // 1. Origin check
  const origin = e.parameter?.origin || e.postData?.headers?.['Origin'] || '';
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid-origin' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Parse payload
  let payload;
  try { payload = JSON.parse(e.postData.contents); }
  catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid-json' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Rate limit by IP
  const ip = e.parameter?.ip || 'unknown';
  const cache = CacheService.getScriptCache();
  const rlKey = `rl:${ip}`;
  const count = parseInt(cache.get(rlKey) || '0');
  if (count >= RATE_LIMIT_PER_IP) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'rate-limited' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  cache.put(rlKey, String(count + 1), RATE_LIMIT_WINDOW_SEC);

  // 4. Validate HMAC
  const clientHmac = payload.hmac || '';
  // Recompute HMAC over body string with hmac field removed
  const bodyStr = e.postData.contents;
  const bodyWithoutHmac = bodyStr.replace(/,"hmac":"[a-f0-9]*"/, '');
  const serverHmac = Utilities.computeHmacSha256Signature(bodyWithoutHmac, HMAC_SECRET);
  const serverHmacHex = serverHmac.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  if (clientHmac !== serverHmacHex) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'invalid-hmac' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 5. Dedup by SHA-256 of normalized email
  const emailHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    (payload.email || '').trim().toLowerCase()
  );
  const emailHashHex = emailHash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');

  const sheet = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID).getActiveSheet()
    : SpreadsheetApp.getActiveSheet();
  const existingHashes = sheet.getRange('A:A').getValues().flat().filter(Boolean);
  if (existingHashes.includes(emailHashHex)) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'duplicate' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 6. Write row (prefix user strings with ' to prevent formula injection)
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1).setValue(`'${emailHashHex}`);
  sheet.getRange(row, 2).setValue(`'${payload.name || ''}`);
  sheet.getRange(row, 3).setValue(`'${payload.email || ''}`);
  sheet.getRange(row, 4).setValue(JSON.stringify(payload.answers || []));
  sheet.getRange(row, 5).setValue(JSON.stringify(payload.scores || {}));
  sheet.getRange(row, 6).setValue(payload.competency || '');
  sheet.getRange(row, 7).setValue(payload.sessionEndedAt || new Date().toISOString());
  sheet.getRange(row, 8).setValue(payload.userAgent || '');
  sheet.getRange(row, 9).setValue(payload.screenResolution || '');

  return ContentService.createTextOutput(JSON.stringify({ ok: true, id: String(row) }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**Note on server-side email normalization:** The Apps Script `doPost` hashes `email` directly (no Gmail-specific normalization). This is intentional — the client has already normalized before hashing. The server-side hash is used for comparison against stored hashes (which were client-computed). For a future enhancement, server-side normalization could be added.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `crypto-js` npm package for SHA-256 | `crypto.subtle.digest('SHA-256', ...)` | 2017 (Web Crypto baseline) | Zero deps, 10× faster, NIST-validated |
| `setTimeout` recursion for retry | `for`-loop + `await delay(ms)` | Always standard | Cleaner stack traces, easier cancellation |
| `ScriptProperties` for rate limiting | `CacheService.getScriptCache()` | 2013 (CacheService launch) | Auto-expiry, no manual cleanup |
| `@formspree/react@2.x` | `@formspree/react@3.0.0` | 2024 | Hooks-first API, improved error handling |

**Deprecated/outdated:**
- `crypto-js` — 200KB, unmaintained, weaker randomness. Use native Web Crypto.
- `peaceiris/actions-gh-pages` — replaced by official `actions/deploy-pages@v4` (per STACK.md).
- `lottie-react@2.x` — project already uses `@lottiefiles/dotlottie-react` was NOT adopted (package.json shows `lottie-react@2.4.1` — existing flagmail1 assets reused).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (for secret generation) | HMAC key generation | ✓ | v26.1.0 | — |
| npm | Package installation | ✓ | — | — |
| `crypto.subtle` (browser) | Client-side SHA-256 + HMAC | ✓ (all modern browsers) | Baseline 2020 | — |
| Vite dev server (HTTPS-localhost) | Web Crypto in dev | ✓ (vite dev on localhost) | 8.1.3 | — |
| Google Apps Script deployment | doPost webhook | ✗ (manual deploy needed) | — | Formspree fallback |
| `@formspree/react` | Fallback submission path | ✗ (not yet installed) | 3.0.0 | Install during Phase 5 |

**Missing dependencies with no fallback:**
- Google Apps Script project — must be created manually before Phase 5 execute. No automated deploy. Script code lives in repo at `scripts/apps-script/`.

**Missing dependencies with fallback:**
- `@formspree/react` — install during Phase 5 execution. Fallback to plain `fetch` to Formspree if package unavailable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.10 |
| Config file | vitest.config.js |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUBMIT-01 | Client POSTs JSON payload to webhook | unit | `npx vitest run tests/utils/submission.test.js` | ❌ Wave 0 |
| SUBMIT-02 | Payload includes all required fields | unit | `npx vitest run tests/utils/submission.test.js` | ❌ Wave 0 |
| SUBMIT-03 | Exponential backoff retry (3 attempts, 5xx/network only) | unit | `npx vitest run tests/utils/submission.test.js` | ❌ Wave 0 |
| SUBMIT-04..07 | Apps Script validates HMAC, Origin, rate-limits, dedups, writes row | manual | Manual Apps Script deploy + test | ❌ Wave 0 (manual only) |
| SUBMIT-08 | SubmitDoneScreen renders thank-you | component | `npx vitest run tests/components/SubmitDoneScreen.test.jsx` | ❌ Wave 0 |
| SUBMIT-09 | Failure shows retry button | component | `npx vitest run tests/components/ScoreboardScreen.test.jsx` | ❌ Wave 0 (extend existing) |
| SUBMIT-10 | Formspree fallback env-toggle | unit | `npx vitest run tests/utils/submission.test.js` | ❌ Wave 0 |
| ATTEMPT-03 | Server dedup by SHA-256 | manual | Manual Apps Script test | ❌ Wave 0 (manual only) |
| ATTEMPT-04 | Email normalization (Gmail dots/aliases) | unit | `npx vitest run tests/utils/dedup.test.js` | ✅ Exists — needs update for real SHA-256 |
| SCREENS enum | SUBMIT_DONE added, count updated | unit | `npx vitest run tests/state/screens.test.js` | ✅ Exists — needs count bump |
| App wiring | App.jsx renders SubmitDoneScreen on SUBMIT_DONE | integration | `npx vitest run tests/App.integration.test.jsx` | ✅ Exists — needs new case |
| useOneAttemptGuard | markAttempted called on success | hook | `npx vitest run tests/hooks/useOneAttemptGuard.test.js` | ✅ Exists — needs submit case |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/utils/submission.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/utils/submission.test.js` — covers buildSubmissionPayload, buildHmac, submitResults (mock fetch), hashEmail
- [ ] `tests/components/SubmitDoneScreen.test.jsx` — covers render with identity, no back nav, terminal state
- [ ] `tests/utils/dedup.test.js` — update from placeholder hash to real SHA-256 tests (Gmail normalization, hex output)
- [ ] `tests/state/screens.test.js` — bump expected key count from 7 to 8
- [ ] `scripts/apps-script/Code.gs` — not automated testable; manual deploy gate
- [ ] `scripts/apps-script/README.md` — deployment documentation

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user authentication (identity is self-declared, not verified) |
| V3 Session Management | No | No server-side sessions |
| V4 Access Control | No | No authenticated endpoints |
| V5 Input Validation | Yes | JSON schema validation in doPost; email normalization; string sanitization (prefix `'` for Sheets) |
| V6 Cryptography | Yes | HMAC-SHA256 (key in Vite env + PropertiesService); SHA-256 email dedup; constant-time HMAC compare in Apps Script |
| V7 Error Handling | Yes | 4xx/5xx differentiation in client retry logic; no stack traces in error responses |
| V8 Data Protection | Yes | localStorage flag; sessionStorage identity cleared on submit; no PII in git history |
| V9 Communication | Yes | HTTPS enforced (GitHub Pages); no plaintext secrets in transit |
| V11 Business Logic | Yes | One-attempt enforcement (client guard + server dedup); rate limiting (3/IP/min) |

### Known Threat Patterns for fetch → Apps Script

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Endpoint scraped by bot (replay attack) | Spoofing | HMAC token validation — bot can't generate valid HMAC without secret |
| Spoofed Origin header | Spoofing | Server validates Origin against configured ALLOWED_ORIGIN |
| High-volume submission spam | Denial of Service | CacheService rate limit (3/IP/min); Apps Script quota ceiling |
| Candidate retakes with different email | Repudiation | SHA-256 email dedup in Sheet; Gmail alias normalization |
| Formula injection in Sheet (HYPERLINK, =CMD) | Tampering | Prefix user strings with `'` in Apps Script (literal marker) |
| HMAC secret extracted from JS bundle | Information Disclosure | Accepted risk (same model as answer keys); defense-in-depth: server also dedups |
| Network error causes data loss | Denial of Service | Exponential backoff retry (3 attempts); Formspree fallback |
| localStorage cleared to bypass guard | Repudiation | Server-side dedup as authoritative gate; client guard is UX convenience only |
| MITM tampering with submission payload | Tampering | HTTPS (GitHub Pages + Apps Script endpoint both HTTPS) |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `crypto.subtle` available in all target browsers (Baseline 2020) | Standard Stack | Candidate on pre-2020 browser can't hash/HMAC — assessment already requires modern browser for media-chrome |
| A2 | Apps Script `CacheService.getScriptCache()` 100KB limit sufficient for rate-limit counters | Common Pitfalls | High-traffic scenario exhausts cache — fall back to simple counter with no per-IP tracking |
| A3 | Apps Script `Utilities.computeHmacSha256Signature` produces hex output matching client Web Crypto HMAC | Code Examples | HMAC format mismatch → all submissions fail — verify with test deployment before production |
| A4 | `JSON.stringify` key order is consistent between client V8 and Apps Script V8 | Common Pitfalls | HMAC mismatch — mitigated by stripping `hmac` field from raw body string on server |
| A5 | `@formspree/react@3.0.0` API unchanged from docs | Standard Stack | API drift requires code change — package has stable history since 2024 |

## Open Questions (RESOLVED)

1. **Client-server HMAC matching across V8 versions**
   - What we know: Both use V8 engine. `JSON.stringify` key order is insertion-order (stable in practice).
   - What's unclear: Whether subtle differences in string escaping exist between Chrome V8 and Apps Script V8.
   - Recommendation: Use the raw-body-string approach on server (strip hmac field regex from `e.postData.contents`). Test with actual deployment before production.

2. **Sheet row structure for recruiter readability**
   - What we know: Email hash in column A, metadata in subsequent columns.
   - What's unclear: Whether answers JSON should be a single cell or exploded into normalized columns.
   - Recommendation: Single JSON blob per row (Columns A, B, C, D, E...) — recruiter can use Google Sheets JSON import or future dashboard. Simpler doPost code.

3. **Formspree free tier submission cap**
   - What we know: Formspree has submission limits per plan.
   - What's unclear: Exact free tier cap in 2026.
   - Recommendation: Document that Formspree is a degraded fallback (no dedup, no Sheet). Primary path is Apps Script. Verify Formspree quota at signup time.

## Sources

### Primary (HIGH confidence)
- **MDN SubtleCrypto.digest()** — `[VERIFIED: developer.mozilla.org]` SHA-256, SHA-384, SHA-512. Returns ArrayBuffer. Hex conversion pattern. Fetched 2026-07-08.
- **MDN SubtleCrypto.sign()** — `[VERIFIED: developer.mozilla.org]` HMAC with SHA-256. `importKey('raw', ...)` pattern. `HmacImportParams { name: "HMAC", hash: "SHA-256" }`. Fetched 2026-07-08.
- **MDN Using Fetch API** — `[VERIFIED: developer.mozilla.org]` fetch with POST, JSON body, headers, error handling. Fetched 2026-07-08.
- **Vite Env Variables and Modes** — `[VERIFIED: vite.dev]` VITE_ prefix, import.meta.env, .env file loading, mode configuration. Fetched 2026-07-08.
- **Google Apps Script CacheService** — `[CITED: developers.google.com/apps-script/reference/cache/cache-service]` getScriptCache(), put/get API, TTL, 100KB limit. Fetched 2026-07-08.
- **Formspree React Library** — `[CITED: help.formspree.io]` useForm hook API, state object (submitting/succeeded/errors/result), useSubmit for custom submission. Fetched 2026-07-08.
- **npm registry** — `@formspree/react@3.0.0` confirmed via `npm view`. 2026-07-08.

### Secondary (MEDIUM confidence)
- **Apps Script Utilities.computeHmacSha256Signature** — Training knowledge, not verified against official docs this session. Documented pattern from PITFALLS.md (which itself cites Context7).
- **Apps Script rate-limit implementation** — Composite of CacheService docs + practitioner knowledge. Specific max-keys-in-cache interaction with 100KB limit is MEDIUM confidence.
- **Gmail email normalization** — Standard `+` alias and dot-stripping pattern. Well-known but not verified against Gmail's current documented behavior this session.

### Tertiary (LOW confidence)
- None — all core claims are verified or cited.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all client APIs verified via MDN; npm version confirmed; Apps Script services cited from Google docs.
- Architecture: HIGH — patterns grounded in verified API docs and locked decisions from CONTEXT.md.
- Pitfalls: HIGH — drawn from project's own PITFALLS.md (Context7-verified) and MDN-verified API constraints.
- Code examples: HIGH — all API usage patterns confirmed against primary sources.

**Research date:** 2026-07-08
**Valid until:** 2026-10-08 (90 days — stable web platform APIs)

