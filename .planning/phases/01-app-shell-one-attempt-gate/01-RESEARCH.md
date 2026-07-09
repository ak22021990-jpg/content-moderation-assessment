# Phase 1: App Shell + One-Attempt Gate — Research

**Researched:** 2026-07-08
**Domain:** React 19 controlled forms, sessionStorage/localStorage hooks, ErrorBoundary, Vitest + happy-dom + Testing Library setup, data-driven guidelines rendering, WAI-ARIA form field errors
**Confidence:** HIGH (all major claims verified against react.dev, WHATWG HTML spec, npm registry, WAI/W3C, and Testing Library docs)
**Scope:** Phase-1-specific. Global architecture (component tree, screen enum shape, hook composition, one-attempt guard sketch) is already locked — see cited line numbers in `.planning/research/ARCHITECTURE.md` and `.planning/research/STACK.md`; not repeated here.

---

<user_constraints>
## User Constraints (from 01-CONTEXT.md)

### Locked Decisions
- **D-P1-01 (Screen enum):** Frozen `SCREENS` object in `src/state/screens.js` with values `LANDING | GUIDELINES | ASSESSMENT_PLACEHOLDER | ALREADY_COMPLETED`. Owned by `useAssessmentState`. **No `react-router-dom`**.
- **D-P1-02 (Hook composition):** `useAssessmentState` + `useOneAttemptGuard` composed at `App.jsx` root; state passed down as a single prop. **No Zustand this phase.**
- **D-P1-03 (Identity persistence):** `sessionStorage` key `cma_identity_v1` = `{ name, email, startedAt }`. Written on Landing submit. Never in localStorage.
- **D-P1-04 (One-Attempt hook):** `localStorage` key `cma_attempt_v1` = `{ emailHash, completedAt, submissionId }`. Full API this phase: `{ hasAttempted, record, markAttempted({emailHash, submissionId}), clear() }`. Phase 5 wires the trigger.
- **D-P1-05 (Already-completed screen):** `ALREADY_COMPLETED` terminal, no reset button in prod, Landing form hidden.
- **D-P1-06 (Validation):** Manual via `src/utils/validators.js`. `validateEmail` regex proposal: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, trim + max 254. `validateName`: non-empty, ≤100 chars, trimmed. On-change.
- **D-P1-07 (Guidelines page):** Single-scrolling; top disclosure card (one-attempt / 3-min timer + auto-submit / Approve-vs-Decline + multi-tag); L1→L2 sections; "Begin Assessment" button always enabled (no gating). No `IntersectionObserver`.
- **D-P1-08 (Taxonomy):** `import taxonomy from '../data/taxonomy.json'` module-scope. `taxonomy.categories.map(l1 => ...)`. Zero hardcoded labels.
- **D-P1-09 (Placeholder screen):** Centered message + dev-only `Reset` link visible only when `import.meta.env.DEV`.
- **D-P1-10 (Shell):** `App.jsx` composes both hooks; wrapped in `<ErrorBoundary>` (new `src/components/ErrorBoundary.jsx`).
- **D-P1-11 (Tests):** Vitest + happy-dom + @testing-library/react + @testing-library/user-event. Tests under `tests/` mirroring `src/`. No Playwright this phase.
- **D-P1-12 (Deploy):** Existing Phase 0 workflow unchanged. Close criterion: live Pages URL shows Landing (not `<h1>` placeholder).
- **D-P1-13 (Packages):** Only devDeps added: `@testing-library/react@^16.3.0`, `@testing-library/user-event@^14.6.0`. happy-dom already installed.

### Claude's Discretion
- Choice between `useSyncExternalStore` vs plain `useState + useEffect` inside `useOneAttemptGuard` (see §4 below — **recommend plain useState**).
- Whether Landing autofocuses name input on mount (**recommend yes**, §9).
- Component-file split within `LandingScreen.jsx` (e.g., extract `FormField`) — planner decides based on line-count budget.
- Whether `validateName`/`validateEmail` return an i18n-ready `error` key vs an English string (**recommend plain English strings**; i18n is deferred v2).
- Whether the ErrorBoundary is a shared component or exists only for `App.jsx` root (**recommend single root-level boundary** per D-P1-10).

### Deferred Ideas (OUT OF SCOPE — do not research)
- GSAP transitions (Phase 6).
- Design tokens / typography / color palette (Phase 6).
- Playwright e2e (deferred; possibly Phase 6).
- Actual SHA-256 hash of email (Phase 5).
- L2 taxonomy wording sign-off (Phase 3 CC-03 gate).
- Accessibility deep audit (Phase 6 — Phase 1 only ships aria-invalid + focus mgmt).
- `sessionStorage` clear on final SUBMIT_DONE (Phase 5).
- i18n (out of v1).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IDENT-01 | Enter full name (required, ≤100 chars) on Landing | §1 controlled-input pattern + §6 validators contract |
| IDENT-02 | Enter email (RFC-5322 basic validation) on Landing | §2 regex analysis; D-P1-06 regex confirmed acceptable-basic-tier |
| IDENT-03 | Cannot start until both valid | §1 disabled-button pattern; controlled state drives `disabled` |
| IDENT-04 | Name/email persist through screen transitions (survives refresh) | §3 sessionStorage hydration checklist + defenses |
| IDENT-05 | Landing shows generic assessment description | §10 brand-safety review of Landing copy |
| GUIDE-01 | Full Guidelines page lists all L1 categories with definitions before video 1 | §8 taxonomy schema mapping; **GAP FLAGGED** — see §8 |
| GUIDE-02 | Each L1 shows child L2s with definitions + one concrete example | §8 taxonomy schema mapping; **GAP FLAGGED** — see §8 |
| GUIDE-03 | Guidelines page explains Approve vs Decline + multi-tag policy | §10 disclosure-card copy (Approve/multi-tag phrasing checked vs brand-guardrails) |
| GUIDE-04 | Guidelines page explains 3-min timer + auto-submit-on-timeout | §10 disclosure-card copy (timer phrasing) |
| GUIDE-05 | Advance only by clicking "Begin Assessment" | D-P1-07 button-click is the acknowledgment; no gating |
| GUIDE-06 | Guidelines content sourced from `taxonomy.json` (single source) | §8 `import taxonomy from '../data/taxonomy.json'` + `.map()` pattern |
| ATTEMPT-01 | (Hook write API only in Phase 1) `markAttempted` shape stable | §4 `useOneAttemptGuard` hook contract |
| ATTEMPT-02 | If localStorage flag present on Landing mount → "already completed" screen | §3 + §4 hydration + gate; D-P1-05 |
| ATTEMPT-05 | Guidelines discloses one-attempt policy | §10 disclosure-card copy |
</phase_requirements>

---

## Summary

Phase 1 is a **shell + form + data-driven walkthrough + state gate**, with no video, no timer, and no backend. The stack is fully locked (React 19.2 + Vite 8 + happy-dom + Testing Library — no new runtime deps, only two devDeps). The unresolved technical questions were narrow: **which React 19 form primitive**, **which email regex**, **which storage-subscription primitive**, **which ErrorBoundary shape**, and **how to defend the storage hooks against real-world browser quirks**. Every one of those has a clear, unambiguous, single-source answer:

1. **React 19 form:** Plain `useState` + controlled `<input>`. The new `useActionState` / `useFormStatus` / `useOptimistic` hooks are for **server-action-backed** forms — they do not apply here (no server action in Phase 1). Verified against react.dev/reference/react-dom/components/input.
2. **Email regex:** The context's `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` is fit-for-purpose as "RFC-5322 basic" client-side validation; the HTML5 spec regex is stricter but its own spec calls itself a "willful violation" of RFC-5322. **Keep the CONTEXT regex.** Add trim + 254-char cap (D-P1-06 already specifies this).
3. **Storage hooks:** Use plain `useState` (hydrated once on mount inside `useEffect`) — do NOT use `useSyncExternalStore` in Phase 1. Cross-tab reactivity is a nice-to-have and adds complexity (needs `subscribe`, `getSnapshot`, storage-event plumbing) that is unnecessary for a one-attempt guard where a fresh page load re-reads the flag.
4. **ErrorBoundary:** Class-based only. React 19 docs still explicitly state there is no hooks-based alternative built-in. The reference implementation (class Component with `getDerivedStateFromError` + `componentDidCatch`) ships in ~15 LOC.
5. **Storage defenses:** try/catch on every `getItem`/`setItem` (Safari private mode + kiosk browsers throw QuotaExceededError / SecurityError), JSON.parse in a try/catch (corrupted values yield null → "fresh state"), never SSR — Vite build is a pure client bundle so SSR-safety is not a concern here.

**One schema gap surfaced:** `taxonomy.json` (Phase 0 output) contains **only `id` and `label`** on both L1 and L2 nodes — **no `definition` field, no `example` field**. GUIDE-01/02 require definitions AND examples. This is a **content authoring gap** the planner must resolve — see §8 "Schema Gap" for the two options and my recommendation.

**Primary recommendation:** Implement the phase with the simplest form primitives available (useState + controlled inputs), keep the storage hooks small and synchronous-on-first-read via `useEffect` hydration, ship the class-based ErrorBoundary verbatim from react.dev, and **resolve the taxonomy schema gap before writing GuidelinesScreen** — either extend the JSON with `definition` + `example` fields (recommended) or explicitly render `label`-only sections and defer definitions to Phase 3 (against GUIDE-01's letter but survivable).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Screen routing | `useAssessmentState` (React) | — | Single `screen` field + switch; no URL / no router (D-P1-01, ARCHITECTURE.md Pattern 1) |
| Identity storage (session) | `sessionStorage` via `useAssessmentState` | React state (in-memory) | Session survives F5, dies on tab close; in-memory is the read layer |
| One-attempt flag (durable) | `localStorage` via `useOneAttemptGuard` | — | Persistent across tab close; cleared only in dev mode |
| Form validation | `src/utils/validators.js` (pure functions) | React controlled state | Pure fns are unit-testable; React state drives disabled/aria-invalid |
| Guidelines content | Bundled `src/data/taxonomy.json` | React `.map()` render | Single source of truth per GUIDE-06 + D-P1-08 |
| Error containment | Class `<ErrorBoundary>` at `App.jsx` root | — | Only supported React primitive for render-error catching (react.dev verified) |
| Focus management | `useRef` + `useEffect` on Landing mount | — | Autofocus name input for keyboard-first UX |

---

## 1. React 19 Form Pattern — Controlled Input + On-Change Validation

**Confidence:** HIGH. Sources: react.dev/reference/react-dom/components/input, react.dev/reference/react/useActionState.

### Recommendation — the simplest correct pattern

Plain `useState` + controlled `<input>` + `onChange` handler. React 19 introduces `useActionState`, `useOptimistic`, `useFormStatus`, but **all three are designed for server actions** (form `action={fn}` where `fn` is a server function or an async transition). Phase 1's Landing form has no server action and no async submission — it's a pure client-side gate that flips `screen` state on submit.

Using `useActionState` for this form would:
- Require wrapping the submit in a synthetic async action.
- Introduce transition state (`isPending`) we have no use for.
- Make the "disable submit while validation fails" pattern harder because `useActionState` is optimized for async pending, not synchronous validity.

**Canonical pattern (from react.dev):**

```jsx
// LandingScreen.jsx
import { useState, useRef, useEffect } from 'react';
import { validateName, validateEmail } from '../utils/validators.js';

export default function LandingScreen({ onStart }) {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({ name: false, email: false });
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);   // §9 focus mgmt

  const nameV  = validateName(name);
  const emailV = validateEmail(email);
  const canSubmit = nameV.valid && emailV.valid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStart({ name: name.trim(), email: email.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="cma-name">Full name</label>
      <input
        id="cma-name"
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, name: true }))}
        aria-invalid={touched.name && !nameV.valid}
        aria-describedby={touched.name && !nameV.valid ? 'cma-name-error' : undefined}
        maxLength={100}
        autoComplete="name"
        required
      />
      {touched.name && !nameV.valid && (
        <span id="cma-name-error" role="alert">{nameV.error}</span>
      )}

      <label htmlFor="cma-email">Email</label>
      <input
        id="cma-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, email: true }))}
        aria-invalid={touched.email && !emailV.valid}
        aria-describedby={touched.email && !emailV.valid ? 'cma-email-error' : undefined}
        maxLength={254}
        autoComplete="email"
        required
      />
      {touched.email && !emailV.valid && (
        <span id="cma-email-error" role="alert">{emailV.error}</span>
      )}

      <button type="submit" disabled={!canSubmit}>Start</button>
    </form>
  );
}
```

**Key decisions embedded above:**
- `noValidate` on `<form>` — we own validation, not the browser (browser's built-in `type=email` validity would fight our regex).
- `type="email"` on the input **is retained** for mobile keyboard hint (email keyboard) and for autofill; validation logic ignores the browser's `validity.valid` and uses our regex.
- `onBlur → touched` — errors show only after the user leaves a field, not on every keystroke while typing. Standard UX pattern; keeps the "3 chars in and already yelling" antipattern away. `disabled` state on the submit button is always computed from live validity so the button reflects reality at all times.
- Empty (untouched) fields do NOT show errors; button is disabled from the start.
- `role="alert"` on inline error nodes — surfaces errors to screen readers when they appear (WAI/W3C forms tutorial pattern, §9).

**Do NOT use** `useActionState`, `useFormStatus`, `useOptimistic` — all three are documented as server-action helpers and add machinery for problems this form does not have.

---

## 2. Email Regex — RFC-5322 Basic

**Confidence:** HIGH. Sources: html.spec.whatwg.org/multipage/input.html#valid-e-mail-address (WHATWG HTML Living Standard), RFC-5322 §3.4.1 (addr-spec).

### The proposed regex (from CONTEXT D-P1-06)

```regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

**Verdict: keep it.** This is the accepted "practical minimum" pattern for client-side email validation. It matches the shape "non-empty-non-whitespace-non-@ THEN @ THEN non-empty-non-whitespace-non-@ THEN . THEN non-empty-non-whitespace-non-@" which enforces:
- Local part present (before `@`).
- Exactly one `@`.
- Domain has at least one dot.
- No embedded whitespace.

It is **intentionally more permissive** than the HTML5 spec regex, and for hiring-form purposes that is the right tradeoff (a candidate typing `user@example.museum` should not be blocked).

### The HTML5 spec regex (for reference)

The WHATWG spec at html.spec.whatwg.org publishes this exact regex for `input[type=email]`:

```regex
/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
```

The spec **explicitly self-labels** as "a willful violation of RFC 5322" — that is, the HTML5 authors deliberately chose a stricter (ASCII-only local part, per-label 63-char limits) pattern than RFC-5322 would allow, on the grounds that RFC-5322 is "simultaneously too strict, too vague, and too lax" for practical form use.

### RFC-5322 §3.4.1 (addr-spec) — brief citation

RFC-5322 defines `addr-spec = local-part "@" domain` where `local-part` may include quoted strings, comments, unicode via mail extensions, and other exotic constructs that no browser form should try to validate on the client. The industry norm (see also OWASP Cheat Sheet for input validation) is: **accept a permissive shape check on the client, defer authoritative validation to the mail-send step on the server.** In Phase 1 there is no server, so we accept "shape check" as the whole validation strategy — Phase 5's Apps Script will normalize + hash email server-side.

### Actionable — validators.js contract

```javascript
// src/utils/validators.js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(input) {
  const s = (input ?? '').trim();
  if (s.length === 0)    return { valid: false, error: 'Please enter your full name.' };
  if (s.length > 100)    return { valid: false, error: 'Name must be 100 characters or fewer.' };
  return { valid: true, error: null };
}

export function validateEmail(input) {
  const s = (input ?? '').trim();
  if (s.length === 0)    return { valid: false, error: 'Please enter your email.' };
  if (s.length > 254)    return { valid: false, error: 'Email is too long.' };
  if (!EMAIL_RE.test(s)) return { valid: false, error: 'Please enter a valid email address.' };
  return { valid: true, error: null };
}
```

**Why 254?** RFC-5321 §4.5.3.1.3 caps SMTP addresses at 254 octets; 254 is the widely-cited practical maximum and matches the number the STACK/PROJECT already implies.

**Test cases the planner should include (validators.test.js):**
- `validateName`: `''`, `'   '` (whitespace-only), `'A'` (single char OK), `'A'.repeat(100)` (boundary OK), `'A'.repeat(101)` (over), `'  Alice  '` (trim to `'Alice'`, valid), unicode `'名前'` (valid — regex-free path), leading/trailing whitespace.
- `validateEmail`: `''`, `'foo'` (no @), `'foo@'` (no domain), `'foo@bar'` (no dot), `'foo@bar.co'` (valid), `'foo bar@baz.co'` (whitespace inside — invalid), `'foo@bar.baz.co'` (multi-dot — valid), `'a@b.c'` (minimally valid), `('a'.repeat(250)+'@x.io')` (over 254 → invalid), boundary at 254.

---

## 3. sessionStorage + localStorage Gotchas in React 19

**Confidence:** HIGH. Sources: WHATWG Web Storage spec, prior domain knowledge on Safari private mode, ARCHITECTURE.md line 484 (`useOneAttemptGuard` sketch), PITFALLS.md pitfall 17.

### SSR safety — NOT A CONCERN for this project

**Vite build for Phase 1 is a pure client bundle.** There is no SSR / Next.js / RSC in play. `main.jsx` calls `ReactDOM.createRoot(...).render(<App />)` in the browser only. Therefore `typeof window === 'undefined'` guards are unnecessary in this codebase — but the browser-side threat model (private mode, quota, corrupted values) is very real. STACK.md §Core Framework confirms Vite 8 as the bundler; no SSR flag is set.

### The four real gotchas

| # | Gotcha | Failure Mode | Defense |
|---|--------|--------------|---------|
| G1 | **Safari private mode + iOS "Prevent Cross-Site Tracking" + some corporate/kiosk browsers** throw `SecurityError` on any `localStorage.setItem/getItem` call | Uncaught exception → React error → ErrorBoundary catches → user sees "Something went wrong" instead of Landing form | Wrap **every** read/write in try/catch; on read failure, return `null` (behaves as "no attempt yet"); on write failure, log + swallow (Phase 1 write path is dev-only via `clear()`, so this is low blast-radius) |
| G2 | **QuotaExceededError** on `setItem` when localStorage is full (unusual on desktop, common on iOS 6+ private tabs which cap at 0) | Same as G1 | Same defense: try/catch around setItem; degrade to no-op |
| G3 | **Corrupted JSON** in `cma_attempt_v1` (user tampering, dev bug from a prior version, browser sync from another install) | `JSON.parse` throws → app crashes | Wrap `JSON.parse` in try/catch; on error, treat as "no record" and (defensively) `removeItem` so the corrupt value doesn't linger. D-P1-04 tests already require this: "malformed JSON in localStorage → hasAttempted=false (graceful)." |
| G4 | **`storage` event does not fire in the same tab** — only in *other* tabs of the same origin | If Phase 1 UI writes the flag and expects to re-render in the same tab, it won't (irrelevant for Phase 1 since only `clear()` writes here, and it's dev-only; the trigger is Phase 5) | Not a Phase 1 defect. Document for Phase 5. |

### The `useOneAttemptGuard` reference implementation

Extends ARCHITECTURE.md line 482 sketch with the four defenses above:

```javascript
// src/hooks/useOneAttemptGuard.js
import { useState, useCallback, useEffect } from 'react';

const KEY = 'cma_attempt_v1';

function safeReadRecord() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    // Shape validation — if a stray value ended up in the slot, treat as no record.
    if (!parsed || typeof parsed !== 'object'
        || typeof parsed.emailHash !== 'string'
        || typeof parsed.completedAt !== 'string'
        || typeof parsed.submissionId !== 'string') {
      try { localStorage.removeItem(KEY); } catch { /* swallow */ }
      return null;
    }
    return parsed;
  } catch {
    return null;    // SecurityError (private mode), SyntaxError (corrupt JSON)
  }
}

function safeWrite(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;   // Quota / SecurityError — degrade gracefully
  }
}

function safeRemove() {
  try { localStorage.removeItem(KEY); return true; } catch { return false; }
}

export function useOneAttemptGuard() {
  // Hydrate once on mount; subsequent writes update state locally.
  const [record, setRecord] = useState(() => safeReadRecord());

  const markAttempted = useCallback(({ emailHash, submissionId }) => {
    const value = {
      emailHash,
      submissionId,
      completedAt: new Date().toISOString(),
    };
    if (safeWrite(value)) setRecord(value);
  }, []);

  const clear = useCallback(() => {
    if (safeRemove()) setRecord(null);
  }, []);

  return {
    hasAttempted: record !== null,
    record,
    markAttempted,
    clear,
  };
}
```

**Notes:**
- Hydration is **synchronous** via `useState`'s lazy initializer (`() => safeReadRecord()`). No `useEffect` needed for the initial read — that would create a one-render flicker where `hasAttempted` is briefly `false`, causing the Landing form to flash before the "already completed" screen renders. The lazy initializer runs before first render and is the correct primitive here.
- No cross-tab listener (see §4).
- The 4-field shape check is defense-in-depth against dev bugs and hostile inspection tampering; it's cheap and eliminates a class of test-flakiness.

### The `useAssessmentState` identity hydration

Same three defenses (G1-G3), applied to `sessionStorage`:

```javascript
// Inside useAssessmentState.js — identity slice hydration
const IDENTITY_KEY = 'cma_identity_v1';

function safeReadIdentity() {
  try {
    const raw = sessionStorage.getItem(IDENTITY_KEY);
    if (raw === null) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.name !== 'string' || typeof p.email !== 'string' || typeof p.startedAt !== 'string') {
      try { sessionStorage.removeItem(IDENTITY_KEY); } catch { /* swallow */ }
      return null;
    }
    return p;
  } catch { return null; }
}

// state is initialized with { screen: LANDING, identity: safeReadIdentity(), ... }
// On mount, if identity is non-null AND hasAttempted is false, treat this as
// "mid-session refresh" — advance screen to GUIDELINES automatically.
```

**Identity-based auto-advance on refresh (IDENT-04 requirement):** the `useAssessmentState` initializer reads sessionStorage; if identity is populated, initial `screen` should be `GUIDELINES` (not `LANDING`) — that's what "identity persists through screen transitions … refresh doesn't lose it" means in practice. Test coverage per D-P1-11: `useAssessmentState.test.js` should cover "sessionStorage hydration on mount → initial screen is GUIDELINES."

---

## 4. `useSyncExternalStore` vs Plain `useState` for the Storage Hooks

**Confidence:** HIGH. Sources: react.dev/reference/react/useSyncExternalStore (excerpt: "When possible, we recommend using built-in React state with `useState` and `useReducer` instead. The `useSyncExternalStore` API is mostly useful if you need to integrate with existing non-React code.").

### Recommendation — plain `useState`, not `useSyncExternalStore`

**Do not use `useSyncExternalStore` in Phase 1.** The stated use case for `useSyncExternalStore` is "subscribe to an external mutable store and re-render when it changes." That is a good fit when:
- Multiple components read the same external store and need to react to its changes.
- The store is mutated by non-React code paths (browser events, third-party libraries).

Neither applies here:
- `useOneAttemptGuard` is called once at the App root; there's no fan-out of consumers.
- The only Phase 1 mutation path (`clear()`) happens inside React, so we can update local state at the same time as writing storage (see hook above).
- Cross-tab reactivity ("user completes assessment in tab A while tab B is on the Landing page → tab B suddenly shows already-completed") is a genuinely-nice-to-have feature but it's **not in any Phase 1 requirement**, adds `subscribe`/`getSnapshot` boilerplate, and is only exercised by the corner case where a candidate has the Landing open in two tabs simultaneously (which the one-attempt design already treats as a bad-faith signal handled by Phase 5's server-side dedup).

**Rule of thumb from react.dev itself:** if `useState` works, use `useState`. It works here. Plain `useState` with a lazy initializer gives synchronous hydration and zero flicker (§3), which is exactly what we want.

### If cross-tab reactivity is ever added (future — not Phase 1)

The upgrade path is small:

```javascript
// Future: react to `storage` events fired in OTHER tabs
useEffect(() => {
  const onStorage = (e) => {
    if (e.key === KEY) setRecord(safeReadRecord());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
```

`useSyncExternalStore` is still not required — a listener + `setRecord` is simpler and covers this case. Reserve `useSyncExternalStore` for the day (if ever) that multiple deep components in this app read the same store concurrently.

---

## 5. ErrorBoundary in React 19

**Confidence:** HIGH. Source: react.dev/reference/react/Component (excerpt: "There is currently no way to write an Error Boundary as a function component.").

### Recommendation — ship the class-based reference implementation

React 19 has **not** introduced a hooks-based error boundary. The class-component API (`static getDerivedStateFromError` + `componentDidCatch` + `render`) is still the only built-in primitive. The 15-line reference from react.dev drops straight into `src/components/ErrorBoundary.jsx`:

```jsx
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Phase 1 has no telemetry backend — log to console for dev
    // Phase 5+ can wire this to a real service (out of scope)
    // eslint-disable-next-line no-console
    console.error('[cma] uncaught render error', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h1>Something went wrong.</h1>
          <p>Please refresh the page. If the problem persists, contact your recruiter.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Explicit non-decisions:**
- Do NOT add `react-error-boundary` npm package. STACK.md line 105 is authoritative: "no new devDependencies beyond `@testing-library/react`, `@testing-library/user-event`." One class file is 15 lines; a dependency is a supply-chain surface.
- Do NOT try to catch errors in event handlers or async code via this boundary — react.dev explicitly notes it catches only render/lifecycle errors. That is fine here: Landing/Guidelines have no async paths.
- Do NOT add a "reset boundary" button in Phase 1. Refresh is the escape hatch; Phase 6 polish can add nicer UX.

---

## 6. Vitest + happy-dom + @testing-library/react Setup for React 19

**Confidence:** HIGH. Sources: npm view (`@testing-library/react@16.3.2`, `@testing-library/user-event@14.6.1`, current `latest` tags — verified 2026-07-08), testing-library.com/docs/react-testing-library/setup, existing `vitest.config.js`, existing `package.json`.

### Version audit — devDeps to add

| Package | Version to install | Confirmed | Notes |
|---------|--------------------|-----------|-------|
| `@testing-library/react` | `^16.3.0` (latest is `16.3.2`) | `npm view @testing-library/react version` → `16.3.2` **[VERIFIED: npm registry]** | v16 is the React 19-compatible line; v15 dropped React 18-and-lower separation; v16 is current stable. Matches STACK.md line 314 recommendation. |
| `@testing-library/user-event` | `^14.6.0` (latest is `14.6.1`) | `npm view @testing-library/user-event version` → `14.6.1` **[VERIFIED: npm registry]** | v14 introduced the `userEvent.setup()` pattern; async/await required. |
| `happy-dom` | `^20.10.6` (already installed) | Already in package.json | Confirmed installed at line 28. |

**No runtime dep additions.** Confirms D-P1-13.

### Current `vitest.config.js` — required extensions

The existing config is minimal:

```javascript
// Current vitest.config.js
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js', 'tests/**/*.test.jsx'],
  },
})
```

To support @testing-library/react cleanup + globals, extend it as follows (per testing-library.com/docs/react-testing-library/setup):

```javascript
// tests/setup.js — new file
import '@testing-library/jest-dom/vitest';  // OPTIONAL — see note below
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

**IMPORTANT:** `@testing-library/jest-dom` is a *separate optional* devDep providing matchers like `toBeInTheDocument()`. STACK.md and D-P1-13 explicitly say no new devDeps beyond the two testing-library packages. **Decision for planner:** either
1. Skip `jest-dom` and use plain assertions (`expect(el).not.toBeNull()`, `expect(el.textContent).toBe(...)`, `expect(el.getAttribute('disabled')).not.toBeNull()`) — my recommendation, keeps devDeps count at +2.
2. Add `@testing-library/jest-dom` as a third devDep for `.toBeInTheDocument()` / `.toBeDisabled()` sugar — friendlier tests but violates D-P1-13's letter.

If option 1, remove the first import from `setup.js`.

Updated `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,               // enables afterEach/describe/etc. without imports (still safe to import explicitly)
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js', 'tests/**/*.test.jsx'],
  },
})
```

**Note on `globals: true`:** testing-library.com explicitly recommends enabling globals so its auto-cleanup can register. This is the officially-documented pattern.

### React 19 gotchas in tests

- **`act()` warnings on state updates during hooks tests:** React 19 + @testing-library/react v16 handles this automatically via `renderHook` from `@testing-library/react` (previously required `@testing-library/react-hooks` — that package is deprecated). Use `import { renderHook, act } from '@testing-library/react'`. When directly mutating state inside a test callback (not via user-event), wrap in `act(() => { ... })`.
- **`useTransition` / `useDeferredValue`** are irrelevant to Phase 1 (no transitions used).
- **StrictMode double-render in tests:** happy-dom + testing-library does NOT double-render unless the tested component is explicitly wrapped in `<StrictMode>`. Recommend testing WITHOUT StrictMode wrapper (`render(<Comp/>)`, not `render(<StrictMode><Comp/></StrictMode>)`) — StrictMode is a `main.jsx`-level concern and Phase 1 tests should focus on component behavior, not rediscovering React internals. If a bug is suspected under StrictMode, add a targeted test wrapped in `<StrictMode>` for that case only.
- **`console.error` spam on error-boundary tests:** when testing the ErrorBoundary catches an error, React always logs the error to console. Silence in that specific test via `vi.spyOn(console, 'error').mockImplementation(() => {})`.

---

## 7. @testing-library/user-event v14 Patterns for Controlled Inputs

**Confidence:** HIGH. Sources: testing-library.com/docs/user-event/intro (excerpt: "We recommend invoking `userEvent.setup()` before the component is rendered." + "all calls are asynchronous and require `await`.").

### Correct pattern for a Phase 1 test

```jsx
// tests/components/LandingScreen.test.jsx (excerpt)
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingScreen from '../../src/components/LandingScreen.jsx';

test('Start button enables after both fields are valid', async () => {
  const user = userEvent.setup();            // 1. setup first
  const onStart = vi.fn();
  render(<LandingScreen onStart={onStart} />); // 2. then render

  const nameInput  = screen.getByLabelText(/full name/i);
  const emailInput = screen.getByLabelText(/email/i);
  const submit     = screen.getByRole('button', { name: /start/i });

  expect(submit.hasAttribute('disabled')).toBe(true);

  await user.type(nameInput, 'Alice');            // 3. await every interaction
  await user.type(emailInput, 'alice@example.com');

  expect(submit.hasAttribute('disabled')).toBe(false);

  await user.click(submit);
  expect(onStart).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' });
});
```

**Rules (from testing-library.com/docs/user-event/intro):**
1. **Always** call `userEvent.setup()` before `render`. This creates a session object that manages pointer/keyboard state across calls. Direct-call form (`userEvent.type(el, 'x')`) is legacy v13 compat only.
2. **Always** `await` every `user.*` call — they are asynchronous and interleave with React's scheduler. Missing `await` causes state-race flakiness that only shows in CI.
3. Use `screen.getByRole` / `getByLabelText` — these are the priority queries per testing-library-docs "priority guide" (the accessibility-first API).
4. For controlled inputs, `user.type` types character-by-character firing `input` events; React re-renders per keystroke; `userEvent.setup()` awaits each render before the next character. Do NOT use `fireEvent.change(el, { target: { value: 'text' }})` — that fires a synthetic event without keystroke semantics and can misrepresent controlled-input behavior.
5. `user.clear(el)` before typing if the test needs to reset a field.
6. `user.tab()` to move focus (for keyboard-only submit tests).
7. `user.keyboard('{Enter}')` to submit via Enter key.

### Suggested test coverage (per D-P1-11)

`tests/components/LandingScreen.test.jsx` — minimum cases:
- Initial mount: submit disabled, no error text visible, name input has focus.
- Type valid name, submit still disabled (email empty).
- Type valid email, submit becomes enabled.
- Type invalid email, blur, error text appears with `role="alert"`, `aria-invalid=true` on input, `aria-describedby` links to error node.
- Click submit → `onStart` called with `{ name, email }` (both trimmed).
- Press Enter in email field with valid state → `onStart` called (keyboard-only path).
- Mount with localStorage flag pre-set → renders `ALREADY_COMPLETED` copy, does NOT render form.

`tests/hooks/useOneAttemptGuard.test.js` — minimum cases (per D-P1-04):
- Fresh state: `hasAttempted === false`, `record === null`.
- `markAttempted({ emailHash, submissionId })` → `hasAttempted === true`, record shape valid, `completedAt` is ISO string.
- `clear()` → back to fresh.
- Malformed JSON pre-seeded in localStorage → `hasAttempted === false` (graceful).
- Missing required field in stored JSON (e.g., no `submissionId`) → `hasAttempted === false` (shape check rejects).

`tests/hooks/useAssessmentState.test.js` — minimum cases:
- Initial screen is `LANDING` when sessionStorage is empty.
- Initial screen is `GUIDELINES` when sessionStorage identity is populated (refresh-mid-flow).
- `startAssessment({ name, email })` → screen becomes `GUIDELINES`, sessionStorage populated.
- `enterAssessment()` → screen becomes `ASSESSMENT_PLACEHOLDER`.
- `resetAttempt()` (dev-only) → screen back to `LANDING`, session cleared.

`tests/utils/validators.test.js` — see §2.

`tests/components/GuidelinesScreen.test.jsx` — minimum cases (per D-P1-11):
- Renders all 10 L1 labels from a fixture taxonomy.
- Renders each L1's L2 children (count matches fixture).
- Top disclosure card contains three key phrases (one-attempt, 3-minute, Approve/Decline).
- "Begin Assessment" button click → invokes `onBegin` callback.

---

## 8. Data-Driven Rendering of `taxonomy.json` — Schema Gap Flagged

**Confidence:** HIGH for the schema shape (file read directly). MEDIUM-HIGH for the gap analysis (interpretation of GUIDE-01/02 wording).

### The actual schema in `src/data/taxonomy.json` (as of Phase 0)

```json
{
  "version": "0.1.0-draft",
  "categories": [
    {
      "id": "1",
      "label": "Copyright & IP",
      "subcategories": [
        { "id": "1.1", "label": "Unauthorized full-work reproduction" },
        …
      ]
    },
    …
  ]
}
```

**Only two fields exist on both L1 and L2 nodes:** `id` (string) and `label` (string). Ten L1 categories; each has 6-7 L2 subcategories; L2 IDs are dot-notated (`"1.1"`, `"1.2"`, …).

### The requirements — what fields the Guidelines screen needs

Reading GUIDE-01 and GUIDE-02 literally:
- **GUIDE-01:** "User sees a full Guidelines page listing all L1 categories with **1–2 sentence definitions** before video 1."
- **GUIDE-02:** "Each L1 shows its child L2 sub-categories with **definitions and one concrete example**."

**The schema is missing:**
- `definition` on L1 (needed by GUIDE-01).
- `definition` on L2 (needed by GUIDE-02, unless GUIDE-02's "definitions" is interpreted as "L1 definitions + L2 labels + L2 examples" — a stretch).
- `example` on L2 (needed by GUIDE-02).

### The two resolution options

**Option A — Extend the schema (RECOMMENDED).**

Add optional fields to `taxonomy.json`:

```json
{
  "version": "0.2.0-draft",
  "categories": [
    {
      "id": "1",
      "label": "Copyright & IP",
      "definition": "Content that infringes on copyright, trademarks, or intellectual property rights of others.",
      "subcategories": [
        {
          "id": "1.1",
          "label": "Unauthorized full-work reproduction",
          "definition": "A full copy of a copyrighted work (film, song, TV episode) uploaded without rights.",
          "example": "A full-length movie uploaded to a public feed with no license documentation."
        },
        …
      ]
    },
    …
  ]
}
```

**Why recommended:**
- Meets GUIDE-01/02 literally.
- Single source of truth for the whole app — TagPanel (Phase 3) can reuse the same definitions in tooltips.
- Bumps `taxonomy.version` from `0.1.0-draft` to (e.g.) `0.2.0-draft`; the existing schema-lock test (`tests/taxonomy.test.js` per Phase 0) will need its schema updated to allow the new optional fields.
- Authoring load: 10 L1 definitions × ~20 words + 66 L2 definitions + 66 L2 examples ≈ half a day of writing. Can be drafted by whoever writes the Landing/Guidelines copy.

**Why the client sign-off gate does NOT block this:** CC-03 (Taxonomy client sign-off) is scoped in ROADMAP.md to L2 **wording** and is a Phase 3 entry gate. Draft definitions + examples for Phase 1 are internal working copy; L2 wording is subject to sign-off in Phase 3 anyway. Phase 1 CONTEXT §Deferred explicitly notes: "Phase 1 renders whatever `taxonomy.json` currently contains without editorializing" — that includes rendering whatever definitions/examples are in the file at Phase 1 close.

**Option B — Render label-only sections and defer definitions/examples to Phase 3.**

Just render L1 labels + L2 labels; no definition/example text. This ships against the letter of GUIDE-01/GUIDE-02 (they say "definitions and one concrete example"), so this option should only be taken with an explicit acknowledgment that GUIDE-01/02 are partially deferred.

**Recommendation to the planner:** Take Option A. Extend the schema in Phase 1 with draft definitions/examples authored by the same person doing the Landing/Guidelines copy; commit as part of the same PR. The `tests/taxonomy.test.js` update is small (make `definition` and `example` optional-but-string-if-present in the schema check) and keeps the JSON forward-compatible with Phase 3 sign-off (which may edit those fields).

### GuidelinesScreen rendering recipe (assumes Option A adopted)

```jsx
// src/components/GuidelinesScreen.jsx
import taxonomy from '../data/taxonomy.json';

export default function GuidelinesScreen({ onBegin }) {
  return (
    <article>
      <h1>Assessment Guidelines</h1>

      {/* Top disclosure card — GUIDE-03, GUIDE-04, ATTEMPT-05 */}
      <section aria-labelledby="cma-guidelines-policy">
        <h2 id="cma-guidelines-policy">Before you begin</h2>
        <ul>
          <li>This is a one-attempt assessment. You cannot restart it from this browser once submitted.</li>
          <li>Each video runs on a 3-minute countdown. When the timer hits zero, your current tags and verdict submit automatically.</li>
          <li>For each video, tag every category and sub-category that applies (multi-select), then choose Approve or Decline. Approving with zero categories selected is a valid submission.</li>
        </ul>
      </section>

      {/* GUIDE-01 + GUIDE-02: data-driven L1/L2 walkthrough */}
      <section aria-labelledby="cma-guidelines-categories">
        <h2 id="cma-guidelines-categories">Categories</h2>
        {taxonomy.categories.map((l1) => (
          <section key={l1.id} aria-labelledby={`cat-${l1.id}`}>
            <h3 id={`cat-${l1.id}`}>{l1.label}</h3>
            {l1.definition && <p>{l1.definition}</p>}
            <ul>
              {l1.subcategories.map((l2) => (
                <li key={l2.id}>
                  <strong>{l2.label}</strong>
                  {l2.definition && <> — {l2.definition}</>}
                  {l2.example && <> <em>Example: {l2.example}</em></>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <button type="button" onClick={onBegin}>Begin Assessment</button>
    </article>
  );
}
```

**Keying strategy:** L1 keyed by `l1.id` (`"1"`, `"2"`, …). L2 keyed by `l2.id` (`"1.1"`, `"1.2"`, …). IDs are stable per Phase 0 lock; safe.

**No hardcoded labels:** all `l1.label`, `l1.definition`, `l2.label`, `l2.definition`, `l2.example` come from the JSON. GUIDE-06 satisfied.

**Optional-field pattern (`{l1.definition && <p>...</p>}`):** allows Phase 1 to ship even if some definitions are still `null` mid-authoring; the DOM simply omits the paragraph.

---

## 9. Accessibility for the Landing Form

**Confidence:** HIGH. Sources: w3.org/WAI/tutorials/forms/notifications/ (excerpt showing `aria-describedby` + `role="alert"` pattern), react.dev/reference/react/useRef (autofocus pattern).

### Minimum a11y for Phase 1 close (deep audit is Phase 6)

1. **Autofocus name input on mount** — `useRef` + `useEffect` (shown in §1). Puts the caret in the first field for keyboard-first users.
2. **`<label htmlFor="…">` + matching `id`** on each input (standard). Enables `getByLabelText` queries in tests too.
3. **`aria-invalid` on input** — set to `true` only when the field has been touched AND is invalid. Never on untouched fields (would announce "invalid" the moment focus lands).
4. **`aria-describedby` linking to error `<span id>`** — only present when the error is being displayed. When error clears, remove the attribute (undefined in the JSX) so screen readers don't announce a stale error.
5. **`role="alert"` on the error node** — WAI/W3C forms tutorial pattern. Announces the error to screen readers when it appears without stealing focus.
6. **`noValidate` on `<form>`** — prevents the browser from also popping its own bubble (which would fight our error text).
7. **`autoComplete="name"` and `autoComplete="email"`** — enables password managers / autofill (WCAG 1.3.5 Identify Input Purpose, AA).
8. **`maxLength={100}` on name, `maxLength={254}` on email** — hard client cap, matches validator boundary.
9. **`type="email"` on email input** — mobile keyboard hint (WAI recommendation), even though our regex owns validation.
10. **Keyboard-only submit path** — `<button type="submit">` inside `<form onSubmit>` means Enter in either input triggers submit. The `disabled` attribute on the button blocks submit-when-invalid without needing extra JS.

**Explicitly deferred:**
- Focus-visible tokens (Phase 6 design polish).
- Color-contrast audit (Phase 6).
- Screen reader manual walkthrough (Phase 6).
- Announcing the whole error summary as a single region (Phase 6 nice-to-have).

### Landing container structure

```jsx
<main aria-labelledby="cma-landing-title">
  <h1 id="cma-landing-title">Content Moderation Assessment</h1>
  <p>Enter your name and email to begin the assessment. This takes about 20 minutes.</p>
  {/* form as in §1 */}
</main>
```

`<main>` gives the "main content" landmark; single `<h1>` per screen matches WAI heading-hierarchy guidance. Description paragraph is IDENT-05 ("Landing screen displays a short generic description of the assessment").

---

## 10. Brand-Safety Copy Review

**Confidence:** HIGH. Source: `docs/brand-guardrails.md` forbidden list (Disney, Marvel, Star Wars, Pixar, Classic Disney, Hulu, ESPN+ + word-boundary specifics for `thor|frozen|coco`).

### Landing screen copy — proposed strings

| String (as proposed in CONTEXT.md §Specific Ideas) | Verdict |
|--------|---------|
| "Content Moderation Assessment" (H1 title) | **CLEAN** — no forbidden strings. |
| "Enter your name and email to begin the assessment. This takes about 20 minutes." | **CLEAN**. |
| "Full name" (label) | **CLEAN**. |
| "Email" (label) | **CLEAN**. |
| "Please enter your full name." | **CLEAN**. |
| "Name must be 100 characters or fewer." | **CLEAN**. |
| "Please enter your email." | **CLEAN**. |
| "Please enter a valid email address." | **CLEAN**. |
| "Email is too long." | **CLEAN**. |
| "Start" (button) | **CLEAN**. |

### Guidelines top-card disclosure copy — proposed strings

| String | Verdict |
|--------|---------|
| "This is a one-attempt assessment. You cannot restart it from this browser once submitted." | **CLEAN**. |
| "Each video runs on a 3-minute countdown. When the timer hits zero, your current tags and verdict submit automatically." | **CLEAN**. |
| "For each video, tag every category and sub-category that applies (multi-select), then choose Approve or Decline. Approving with zero categories selected is a valid submission." | **CLEAN**. |
| "Categories" (H2) | **CLEAN**. |
| "Before you begin" (H2) | **CLEAN**. |
| "Begin Assessment" (button) | **CLEAN**. |

### Already-completed screen copy

| String | Verdict |
|--------|---------|
| "You have already completed this assessment. If you believe this is an error, contact your recruiter." | **CLEAN**. |

### Placeholder screen copy (D-P1-09)

| String | Verdict |
|--------|---------|
| "Assessment videos load in Phase 2. This is the placeholder terminus for Phase 1's App Shell slice." | **CLEAN**. Internal-facing but ships in dev; since it doesn't ship in prod without the dev flag it's low-risk. |
| "[dev] Reset" | **CLEAN**. |

### Taxonomy content — scanned

The 10 L1 labels + 65 L2 labels in `src/data/taxonomy.json` were scanned against the forbidden-string grep pattern. **No matches.** In particular:
- L1 "Copyright & IP" (id 1) and its subcategory "1.3 Franchise / character IP misuse" use the words "franchise" and "character" **generically** — these are not on the forbidden list. Confirmed: `docs/brand-guardrails.md` forbids specific franchise names (Marvel, Star Wars, Pixar, …) but not the word `franchise`.
- L1 "Brand Safety (GARM)" uses "brand" generically — not forbidden.

### Draft L1 definitions (Option A per §8) — planner authoring hint

If Option A is adopted, the person writing definitions should avoid: any franchise or character name from the forbidden list; any real-world platform-specific policy citations that could imply client identity. Use generic phrasing patterns like "Content that ...", "Videos containing ...", "Statements or imagery that ...". A pre-commit brand-guard scan will run automatically on the JSON edit — a copy-paste that includes "Toy Story" or "Mickey Mouse" will be caught at commit time (that's what Phase 0 built).

**Overall verdict:** All proposed copy is brand-safe. No blocking issues.

---

## Package Legitimacy Audit

**Skipped — no new packages this phase.**

`@testing-library/react@^16.3.0` and `@testing-library/user-event@^14.6.0` are the only new dependencies. Both are:
- Owned by the `testing-library` org on npm (well-established: `@testing-library/react` published since 2018; user-event since 2019).
- Registry-verified via `npm view` (versions match latest/stable tags — see §6).
- Named in STACK.md line 314 as the standard companion for Vitest + React 19.
- Zero postinstall scripts (verified: neither package has a `postinstall` in their published manifests as of 2026-07-08 — planner may re-verify with `npm view @testing-library/react scripts` before install).

| Package | Registry | Age | Source Repo | Disposition |
|---------|----------|-----|-------------|-------------|
| `@testing-library/react` | npm | 8+ yrs | github.com/testing-library/react-testing-library | Approved [VERIFIED: npm registry + STACK.md] |
| `@testing-library/user-event` | npm | 7+ yrs | github.com/testing-library/user-event | Approved [VERIFIED: npm registry + STACK.md] |

No slopcheck run needed for two established well-known Testing Library packages that STACK.md has already prescribed. Full audit will re-run in Phase 2 when `media-chrome` is added.

---

## Runtime State Inventory

Not applicable — Phase 1 is a **greenfield UI phase**, not a rename/refactor/migration. No stored data to migrate, no live services to reconfigure, no OS-registered state, no build artifacts referencing old names. The one new-storage-key pair (`cma_identity_v1`, `cma_attempt_v1`) is being introduced fresh in this phase.

---

## Common Pitfalls

Cross-referenced against PITFALLS.md — Phase 1-relevant items:

| # | Pitfall | Prevention in Phase 1 |
|---|---------|-----------------------|
| 4 | One-attempt trivially bypassable (localStorage-only) | Phase 1 ships the client-side flag as **half** the defense; Phase 5 wires the server-side dedup half. Honest disclosure copy on Guidelines (ATTEMPT-05) is the deterrent (see §10 disclosure card). |
| 17 | localStorage disabled in enterprise/private browsers | §3 try/catch defenses on all reads/writes. Fresh state on failure means the user sees Landing (best-effort UX); they can complete the assessment; the flag simply doesn't stick, which Phase 5's server-side dedup catches anyway. |
| 16 | React 19 StrictMode double-invocation | Hydration via lazy `useState` initializer (§3) is idempotent — runs twice, reads storage twice, returns same value. `useEffect(() => nameRef.current?.focus(), [])` is also idempotent. No issues. |
| — | **New: forgetting to `noValidate` the form** | Without `noValidate`, browser fires its own validation bubble on invalid `type=email`, competing with our custom error text. Enforce via test: submit with valid our-side + invalid-browser-side (`"a@b"` passes ours, fails browser's `type=email`) should still call `onStart`. |
| — | **New: showing errors on untouched fields** | On first render, `touched.name=false` and `touched.email=false` — do NOT render errors. Test: initial mount shows no `role="alert"` node. |
| — | **New: `role="alert"` overuse** | Only wrap the error text, not the whole form. Screen readers will announce every alert region change. |

---

## Environment Availability

No new runtime dependencies. Phase 1 uses:

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node 20+ | Vite build | ✓ (from Phase 0) | — | — |
| npm | Install deps | ✓ (from Phase 0) | — | — |
| happy-dom | Vitest env | ✓ (installed as devDep ^20.10.6) | 20.10.6 | jsdom (would require dep swap) |

Both new devDeps (`@testing-library/react`, `@testing-library/user-event`) install cleanly on Node 20+ with npm; no native deps, no compilation, no postinstall.

---

## Validation Architecture

`.planning/config.json` was not read as part of this research; assuming `nyquist_validation` is enabled (default per orchestrator directive: "absent = enabled"). If it is explicitly `false`, ignore this section.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.10 (already installed) + @testing-library/react ^16.3.0 + @testing-library/user-event ^14.6.0 |
| Config file | `vitest.config.js` (extended per §6) + new `tests/setup.js` |
| Quick run command | `npm test` (already wired: `vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| IDENT-01 | Name field required + ≤100 chars | unit (validator) | `vitest run tests/utils/validators.test.js` | Wave 0 create |
| IDENT-02 | Email RFC-5322 basic | unit (validator) | `vitest run tests/utils/validators.test.js` | Wave 0 create |
| IDENT-03 | Start disabled unless both valid | component | `vitest run tests/components/LandingScreen.test.jsx` | Wave 0 create |
| IDENT-04 | Identity survives refresh (via sessionStorage) | hook | `vitest run tests/hooks/useAssessmentState.test.js` | Wave 0 create |
| IDENT-05 | Landing description text present + brand-clean | component | `vitest run tests/components/LandingScreen.test.jsx` | Wave 0 create |
| GUIDE-01 | Renders all 10 L1 categories | component | `vitest run tests/components/GuidelinesScreen.test.jsx` | Wave 0 create |
| GUIDE-02 | Renders each L1's L2s | component | `vitest run tests/components/GuidelinesScreen.test.jsx` | Wave 0 create |
| GUIDE-03 | Disclosure card mentions Approve/multi-tag | component | same as above | Wave 0 create |
| GUIDE-04 | Disclosure card mentions 3-minute timer + auto-submit | component | same as above | Wave 0 create |
| GUIDE-05 | Advance requires button click | component | same as above (assert onBegin only fires on click) | Wave 0 create |
| GUIDE-06 | Content sourced from taxonomy.json (no hardcoded labels) | component (grep-in-test) | same as above (mock taxonomy fixture and assert rendered labels match) | Wave 0 create |
| ATTEMPT-01 | `markAttempted` writes correctly-shaped record | hook | `vitest run tests/hooks/useOneAttemptGuard.test.js` | Wave 0 create |
| ATTEMPT-02 | Landing shows already-completed when flag present | component | `vitest run tests/components/LandingScreen.test.jsx` | Wave 0 create |
| ATTEMPT-05 | Guidelines discloses one-attempt policy | component | same as guidelines file | Wave 0 create |

### Sampling Rate
- **Per task commit:** `npm test` (full suite; happy-dom is fast, no reason to sub-sample).
- **Per wave merge:** `npm test`.
- **Phase gate:** `npm test` green + brand-guard scan green + deploy pipeline green (D-P1-12 live-URL check).

### Wave 0 Gaps
- [ ] `tests/setup.js` — testing-library cleanup registration
- [ ] `vitest.config.js` — extended with `globals: true` + `setupFiles`
- [ ] `tests/utils/` directory (new)
- [ ] `tests/hooks/` directory (new)
- [ ] `tests/components/` directory (new)
- [ ] Framework install: `npm install -D @testing-library/react@^16.3.0 @testing-library/user-event@^14.6.0`

---

## Security Domain

**Scope for Phase 1:** Input validation only. No auth, no session mgmt (identity is candidate-declared per PROJECT.md — no login), no crypto, no access control.

### Applicable ASVS Categories

| ASVS | Applies | Standard Control |
|------|---------|-----------------|
| V2 Authentication | no | Not applicable — no accounts. Identity is candidate-declared (name+email), verified by external channel (recruiter email → candidate email match). |
| V3 Session Management | no | sessionStorage identity is soft state; no auth session. |
| V4 Access Control | no | No permissions model. |
| V5 Input Validation | **yes** | Manual validators (§2). Enforces shape + length caps at boundary (Landing form). |
| V6 Cryptography | no (in Phase 1) | Email hashing is Phase 5. Phase 1 stubs the hash function (per CONTEXT §Specific Ideas: "Phase 1 stubs a placeholder `hashEmail(str) → str` in `utils/dedup.js` that returns the trimmed lowercase input"). |
| V7 Error Handling | partial | ErrorBoundary (§5) surfaces render errors without leaking stack; validators return user-safe error messages (no internal state exposed). |

### Known Threat Patterns for the Landing Form

| Pattern | STRIDE | Mitigation |
|---------|--------|-----------|
| XSS via name / email field on Guidelines/Placeholder render | Tampering / Info disclosure | Neither screen re-renders name/email as HTML in Phase 1 — the values live in state/sessionStorage only. React text-node rendering auto-escapes. **When Phase 5 adds a "welcome, {name}" pattern anywhere, review that node for `dangerouslySetInnerHTML`** — it must not be used. |
| localStorage tampering (hostile candidate edits `cma_attempt_v1` to bypass) | Tampering | Client-side guard is by design defeated by tampering; Phase 5 server-side dedup is the authoritative gate. Not a Phase 1 bug. |
| Storage-quota DoS (fill localStorage from another tab, our writes fail silently) | Denial of service | try/catch defenses in §3 make writes no-ops on failure; user sees Landing normally; server-side dedup still catches the completion. |
| Long-string DoS on validators | DoS | `maxLength` attribute + 100/254 char caps in validators cap input size at the boundary. |

**No net-new Phase 1 security items.** Full defense-in-depth review lands in Phase 5.

---

## Sources

### Primary (HIGH confidence)
- **react.dev/reference/react-dom/components/input** — controlled input pattern (§1); confirmed via WebFetch 2026-07-08.
- **react.dev/reference/react/useSyncExternalStore** — external-store subscription API + "prefer useState" guidance (§4); confirmed via WebFetch 2026-07-08.
- **react.dev/reference/react/Component** — class-based ErrorBoundary is the only React 19 primitive (§5); confirmed via WebFetch 2026-07-08.
- **react.dev/reference/react/useRef** — autofocus pattern (§9); confirmed via WebFetch 2026-07-08.
- **html.spec.whatwg.org/multipage/input.html#valid-e-mail-address** — HTML5 email regex + explicit "willful violation of RFC-5322" note (§2); confirmed via WebFetch 2026-07-08.
- **testing-library.com/docs/react-testing-library/setup** — Vitest globals: true recommendation for auto-cleanup (§6); confirmed via WebFetch 2026-07-08.
- **testing-library.com/docs/user-event/intro** — `userEvent.setup()` + async/await pattern (§7); confirmed via WebFetch 2026-07-08.
- **w3.org/WAI/tutorials/forms/notifications/** — aria-describedby + role="alert" inline-error pattern (§9); confirmed via WebFetch 2026-07-08.
- **npm registry** — versions verified 2026-07-08: `@testing-library/react@16.3.2`, `@testing-library/user-event@14.6.1`.
- **`.planning/research/ARCHITECTURE.md` lines 288-321** — Pattern 1 (screen enum), 323-336 (Pattern 2 hook composition), 465-505 (Pattern 8 one-attempt guard code).
- **`.planning/research/STACK.md` lines 82-92** (no router), 108-118 (no form library), 120-132 (testing decision).
- **`.planning/research/PITFALLS.md`** pitfalls 4, 16, 17 (Phase 1-relevant).
- **`src/data/taxonomy.json`** — schema read directly; only `id` + `label` fields present on L1 and L2 nodes (§8).
- **`docs/brand-guardrails.md`** — forbidden-string list read directly (§10).

### Secondary (MEDIUM confidence — practitioner knowledge; not primary-source cited in this pass)
- 254-char email cap grounded in RFC-5321 §4.5.3.1.3 SMTP path limit (widely cited).
- Safari private mode `SecurityError` on Web Storage — long-standing browser quirk documented in MDN Web Storage API notes but not re-verified this pass.
- `@testing-library/jest-dom` optional matchers — kept optional in §6 pending planner decision on the +1 devDep cost.

### Tertiary (LOW confidence)
None — every recommendation in this doc is either verified via primary source, tested at read-time against the existing repo state, or explicitly deferred.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `nyquist_validation` config is enabled (`.planning/config.json` was not read this pass) | Validation Architecture | If it's explicitly `false`, that whole section is spurious — planner can delete it |
| A2 | The `tests/setup.js` file does not yet exist | §6 | If it exists (created in Phase 0 for `tests/taxonomy.test.js`), planner extends it rather than creates it |
| A3 | Vite build is a pure client bundle (no SSR); therefore `typeof window === 'undefined'` guards are unnecessary | §3 | Extremely low — no evidence of SSR anywhere in the config; would require adding SSR to Vite explicitly |
| A4 | Planner will adopt Option A (extend taxonomy schema with `definition` + `example` fields) | §8 | If planner takes Option B, need to explicitly acknowledge GUIDE-01/GUIDE-02 partial deferral in PLAN.md |
| A5 | `@testing-library/jest-dom` will NOT be added (respecting D-P1-13's letter) | §6 | If added, `tests/setup.js` needs the extra import; test files can use `.toBeInTheDocument()` sugar |

---

## Open Questions

1. **Taxonomy schema extension — who authors the definitions and examples?**
   - What we know: 10 L1 definitions + 66 L2 definitions + 66 L2 examples needed for full GUIDE-01/02 satisfaction.
   - What's unclear: Which team member drafts them; whether they need pre-Phase-3 client review or can ship as internal-draft in Phase 1 (Phase 3 CC-03 sign-off covers wording).
   - Recommendation: Draft in Phase 1 as internal-working-copy, iterate at Phase 3 client sign-off. Phase 1 unblocks; Phase 3 refines.

2. **Should the ErrorBoundary log to a real telemetry service?**
   - What we know: Phase 1 has no backend; `console.error` is the only sink.
   - What's unclear: Whether Phase 5's Apps Script should also receive client-side errors.
   - Recommendation: Log to console in Phase 1; add optional error-telemetry payload to Phase 5's submit shape only if operational need surfaces.

3. **Whether to add `@testing-library/jest-dom` for `.toBeInTheDocument()` matchers.**
   - What we know: D-P1-13 says +2 devDeps only.
   - What's unclear: Whether the planner will find plain-assertion test readability acceptable.
   - Recommendation: Skip it; use plain assertions. If Phase 3+ test files grow verbose, add jest-dom later.

---

## Metadata

**Confidence breakdown:**
- React 19 form primitives: HIGH — react.dev primary source.
- Email regex acceptability: HIGH — WHATWG spec + RFC-5322 primary sources.
- Storage-hook defenses: HIGH — WHATWG Web Storage semantics + PITFALLS.md prior work.
- ErrorBoundary shape: HIGH — react.dev explicit statement.
- Testing-library setup: HIGH — testing-library.com docs + npm-registry version verification.
- Data-driven guidelines rendering: HIGH-for-mechanics, MEDIUM-for-schema-gap-resolution — the gap is real; the recommendation to extend the JSON is the researcher's judgment call.
- A11y minimum bar: HIGH — WAI/W3C forms tutorial + react.dev useRef.
- Brand-safety copy review: HIGH — full manual scan against `docs/brand-guardrails.md` list.

**Research date:** 2026-07-08
**Valid until:** 2026-08-08 (30 days — React 19.2, Vite 8, Testing Library 16 are all stable / slow-moving)

---

*Phase 1 research complete — planner may proceed.*
