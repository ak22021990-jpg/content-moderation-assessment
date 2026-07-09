# Pitfalls Research

**Domain:** Content-moderation video hiring assessment (React 19 + Vite SPA, GitHub Pages + Git LFS, Formspree/Sheets webhook, custom video player, ground-truth scoring)
**Researched:** 2026-07-07
**Confidence:** HIGH (Git LFS billing, Pages limits, autoplay policy, GSAP React cleanup — all verified via Context7/official docs). MEDIUM (integrity/anti-cheating and inter-rater reliability — verified via general reference material; specific implementation choices carry residual risk).

## Executive summary

Six failure modes have destroyed similar projects: (1) leaking the client brand name into git history (which cannot be scrubbed once a fork exists — you MUST restart from a fresh repo), (2) blowing the Git LFS bandwidth quota mid-hiring-cycle (which silently disables LFS for the whole account for the rest of the month), (3) autoplaying unmuted video and failing silently in Chrome/Safari, (4) shipping a "one-attempt" flag that any candidate defeats in 10 seconds, (5) building subjective scoring against a single expert's opinion (which cannot survive a candidate appeal), and (6) trusting Formspree/Sheets webhooks with no rate limit, spam trap, or origin binding. Each is called out below with concrete prevention and phase mapping.

---

## Critical Pitfalls

### Pitfall 1: Client brand name leaked into git history (BLOCKER, non-recoverable)

**What goes wrong:**
Brand name (or franchise name / character name / logo filename) appears in:
- Repo name (`disney-mod-test`, `magic-kingdom-assessment`, etc.)
- Commit message ("Add Disney color palette", "Match Disney+ typography")
- README, CLAUDE.md, PROJECT.md
- HTML `<title>`, `<meta>`, OG tags, favicon filename
- Asset filenames (`disney-blue.png`, `mickey-thumb.jpg`)
- Author/committer email or Co-Authored-By trailer referencing client
- `package.json` `name`/`description`/`keywords`
- CI logs, GitHub Actions workflow names
- Deployed URL path (`/disney-test/`)
- Video ground-truth doc referencing "Disney standards"

**Why it happens:**
- Developer knows the client, uses their name naturally in commits during exploration
- Copy-pasted design tokens keep original variable names (`--disney-blue`)
- `<title>` tag set once during scaffolding and forgotten
- Reference docs (`.planning/PROJECT.md`) may name the client internally — if leaked publicly, exposes the relationship
- Repo initialised in a directory named after the client (this repo lives at `Desktop\Disney\`)

**Consequences:**
- Legal exposure: unauthorised association with the brand
- Breach of the explicit client instruction ("must NEVER appear anywhere")
- **Git history cannot be safely rewritten once anyone has cloned/forked** — `git filter-repo` rewrites SHAs; if a collaborator or GitHub cache/fork already has the old history, the brand name persists there forever
- Even after `filter-repo`, GitHub may retain unreachable commits accessible via commit SHA URLs unless the repo is deleted and recreated (GitHub Support case required to purge)

**How to avoid:**
1. **New repo, new directory** — do NOT initialise in `Desktop\Disney\`. Create a fresh dir named e.g. `content-moderation-assessment` and `git init` there. Never `git remote add` the current dir's history to the deploy repo.
2. **Codename lockdown** — pick a neutral internal codename (e.g. "Moderator Test", "MOD-1") and enforce via a pre-commit hook that greps commit messages and staged diffs for the forbidden name(s), franchise names, and character names. Reject the commit if found. Ship this in Phase 0.
3. **CI grep gate** — GitHub Actions workflow that runs `grep -riE '(forbidden|words|here)' --exclude-dir=node_modules --exclude-dir=.git .` on every push and fails the build. Applies to source, HTML meta, and manifest files.
4. **Design tokens rename** — before importing any palette/typography from flagmail1 or a client reference, rename CSS variables to neutral names (`--brand-primary` not `--disney-blue`).
5. **`.planning/` is `.gitignore`'d** or scrubbed — planning docs may name the client internally; either exclude the whole `.planning/` directory from the deploy repo, or ship a separate planning repo and only deploy `src/` + `public/`.
6. **HTML `<title>`, `<meta name="description">`, OG tags, favicon** — all generic ("Content Moderation Assessment") and audited in Phase 0.
7. **Author identity** — commit as a generic username / repo-scoped email, not one that clearly ties to client engagement.
8. **If leaked anyway** — delete the repo entirely (not just the commit), recreate under a new name, force-push fresh history. Coordinate with anyone who cloned. Contact GitHub Support to purge cached refs. Do NOT rely on `filter-repo` alone in a public repo.

**Warning signs:**
- Any pre-commit hook grep hit
- Any CI grep failure
- `git log --all --oneline | grep -i <forbidden>` returns anything
- `git grep -i <forbidden> $(git rev-list --all)` returns anything in history

**Phase to address:** **Phase 0 (Foundations)** — must be in place before the first commit. Recovery cost after the fact is HIGH (repo destruction + recreation).

**Severity:** BLOCKER

---

### Pitfall 2: Git LFS bandwidth quota exceeded mid-cycle → LFS disabled for the entire account for the rest of the month

**What goes wrong:**
GitHub Free plan includes **10 GiB/month LFS bandwidth** (verified via GitHub docs, source: `docs.github.com/en/billing/concepts/product-billing/git-lfs`). When exceeded without a payment method on file, **Git LFS is disabled on the entire account until the next month** — every LFS pointer file across every repo owned by that account returns errors instead of the actual asset. GitHub Pages serves LFS pointer text files instead of videos, so candidates get gibberish where the video should be.

Note: PROJECT.md constraints line 96 states "Git LFS free tier is 1 GB storage / 1 GB bandwidth per month" — this appears to be outdated. Current GitHub docs (verified 2026) show **10 GiB / 10 GiB for Free tier**. Even so, the trap is real: 200-300 MB of videos × ~35 candidate sessions = 10 GiB burned; a single popular sharing moment can burn it in a day.

**Why it happens:**
- LFS bandwidth is charged **per download** — every candidate loads every video (5 × ~50 MB = 250 MB per candidate session)
- **GitHub Pages requests for LFS-tracked files count against LFS bandwidth**, not against the 100 GB/mo Pages soft limit (the Pages limit and the LFS limit are separate buckets)
- **GitHub Actions builds that fetch LFS also count** — CI redeploys eat bandwidth every push
- **Repository archive downloads count** if LFS-in-archives is enabled (docs verified)
- **Forks pushing LFS content bill against the parent repo's quota** (docs verified: "Pushing large files to forks of a repository count against the parent repository's bandwidth and storage quotas")
- Every re-push of the same video (bug fix, re-encode) creates a new blob and burns **storage** even if the file looks unchanged (LFS is content-addressed; a 1-byte change to a 500 MB file adds 500 MB to storage)

**Consequences:**
- Videos 404 (pointer text instead of MP4) mid-hiring-cycle
- All other LFS repos on the same account also break
- No automatic recovery until the next billing cycle
- Candidates who started the test cannot finish; recruiter loses confidence in the tool

**How to avoid:**
1. **Budget the math up front** — 5 videos × target size × expected candidate count × 1.5 (retries/repeats). At 250 MB/session and 10 GiB/mo quota → ~40 sessions/mo max. If expected candidate flow exceeds that, LFS-on-Pages is the wrong architecture.
2. **Aggressive re-encode** — H.264 720p, CRF 26-28, AAC 96 kbps, `-movflags +faststart`. Target ≤ 20 MB per 1-2 min clip. 5 × 20 MB = 100 MB per session → 100 sessions per 10 GiB.
3. **Enable HTTP caching** — Pages sends `Cache-Control` for static assets; verify LFS-served files get long-lived cache headers. Repeat-view same-candidate is free after first load.
4. **CDN in front for scale** — jsDelivr proxies GitHub raw content free; for LFS at scale, consider Cloudflare R2 or Bunny CDN (free tier). Fall back to LFS as origin.
5. **Do NOT enable "Include Git LFS objects in archives"** in repo settings — archive downloads (someone clicks "Download ZIP") will silently eat quota.
6. **Disable Actions-triggered LFS pulls** in CI — set `lfs: false` in `actions/checkout` and only fetch LFS in the deploy step if strictly needed (Pages builds usually don't need to touch LFS since files are served from the checkout).
7. **Monitor** — GitHub billing page shows LFS usage; check weekly. Configure a spending limit at $0 so overage errors instead of silently billing.
8. **Never re-push the same asset with a small edit** — re-encoding a video creates a new 20 MB blob every time. Batch changes; keep video revisions rare.
9. **Fallback plan documented** — if LFS is exhausted, switch to a CDN mirror by updating a single `VIDEO_BASE_URL` in the JSON config. Have the CDN pre-provisioned.

**Warning signs:**
- Billing page shows >50% bandwidth used before mid-month
- CI logs show `smudge` operations pulling LFS content on every build
- Video 404s or "This repository is over its data quota" errors
- LFS pointer text served instead of MP4 (view source of failing video URL: it's a 128-byte text file starting `version https://git-lfs.github.com/spec/v1`)

**Phase to address:** **Phase 0 (Foundations) + Phase 4 (Deploy)** — architecture decision belongs in foundations; monitoring and CDN fallback belong in deploy.

**Severity:** BLOCKER

---

### Pitfall 3: Autoplay silently blocked; player shows a broken/frozen frame

**What goes wrong:**
Chrome, Safari, and Firefox block `<video autoplay>` with sound unless the user has interacted with the domain (Media Engagement Index in Chrome, "user gesture" requirement everywhere). The `play()` promise rejects, but if the code doesn't `.catch()` it, the video appears frozen on the poster frame with no error surface. Some browsers silently mute; some don't play at all.

**Why it happens:**
- Developer tests locally where autoplay policies are more lenient in dev sessions with prior interaction
- `<video autoplay>` "just works" in dev, then fails on the first candidate's clean-profile browser
- Custom player wires `videoEl.play()` inside a `useEffect` that runs before the user has clicked anything
- Safari on iOS requires `playsinline` attribute or it goes fullscreen involuntarily
- Muted autoplay works, but the assessment is about **judging content**, which usually needs audio

**Consequences:**
- Candidate stares at a poster frame for 3 minutes, times out, submits nothing
- Timer starts on load but video hasn't started → unfair time pressure
- Recruiter sees a submission with 0% and can't distinguish "candidate failed" from "player broken"

**How to avoid:**
1. **Do not autoplay.** Show a poster + "Click to start Video 1" overlay. The click satisfies the user-gesture requirement AND starts the timer at the moment playback begins.
2. **Always attach `.catch()` to `play()`** — surface autoplay rejection as a user-visible "Click to play" fallback:
   ```js
   videoEl.play().catch(() => setNeedsUserGesture(true));
   ```
3. **`playsinline` attribute** on the `<video>` element (iOS Safari otherwise takes over the screen).
4. **`preload="metadata"`** so the seek bar and duration render immediately, but the video bytes only load on gesture.
5. **Timer starts on `playing` event, not on component mount.** Anchoring the timer to actual playback prevents "timer ran while candidate clicked around" fairness complaints.
6. **Test in a fresh Chrome profile** with no prior media engagement — Chrome grants autoplay to sites you've watched video on before, masking the bug in dev.
7. **Explicit "play sound" affordance** — some browsers/OS combinations mute cross-origin video by default. Show a visible speaker icon in the UI so candidates can tell.

**Warning signs:**
- Any use of `<video autoplay>` in JSX
- Any `videoEl.play()` call without `.catch()`
- Timer state initialised in `useEffect(() => setStart(Date.now()), [])` rather than tied to a `playing` event
- Testing only in the developer's normal browser session

**Phase to address:** **Phase 2 (Custom Video Player)**

**Severity:** HIGH

---

### Pitfall 4: One-attempt enforcement is trivially bypassable, so it's fake

**What goes wrong:**
"One attempt only" is enforced via `localStorage.setItem('attempted', true)`. Any candidate defeats this in 10 seconds:
- Open DevTools → Application → clear site data
- Incognito/private window
- Different browser
- Different email address (candidate uses `firstname+2@gmail.com`, `firstname@outlook.com`, etc.)
- Different device
- Different IP (mobile hotspot)

Result: the "hiring signal" is contaminated — motivated candidates run the test 5 times to learn the answer key, then submit a perfect score.

**Why it happens:**
- Static-site architecture (Pages) has no server to authenticate against
- localStorage is per-origin per-browser, easy to clear
- Email dedup on the recruiter side catches only exact string matches — Gmail `+` aliases and dots (`first.name@` vs `firstname@`) evade naive checks
- No cost to a bad-faith candidate for retrying

**Consequences:**
- Hiring signal is worthless — top-scoring candidates may be the ones who cheated hardest
- Recruiter deploys the tool, promotes the wrong candidate, loses trust in the assessment
- Answer keys leak (recorded via screen capture) and appear on Glassdoor/Reddit

**How to avoid:** (defense in depth — no single measure is enough)
1. **Email normalisation on submit** — lowercase, strip Gmail `+aliases`, remove dots in Gmail addresses, canonicalise before dedup check.
2. **Browser fingerprint hash** — SHA-256 of `userAgent + screen.width + screen.height + timezone + language + canvas fingerprint`, submitted with the answer. Recruiter-side dedup on fingerprint + email + IP.
3. **Server-side dedup at the webhook** — Google Apps Script `doPost` checks the Sheet for existing (email OR fingerprint OR IP) before accepting; returns 409 for duplicates. Rejects at write time, not just at UI time.
4. **Randomise 5 of N video pool** — if the pool grows to 20+ videos and each session picks a different 5, memorising answer keys becomes uneconomic (matches PROJECT.md's "random-5-of-N optional" future goal — bring it forward).
5. **Shuffle L1/L2 option order per session** — makes screen-recorded answers less transferable.
6. **Unique short-lived invite links** — recruiter generates a per-candidate URL with a signed token; the token is single-use and expires. Adds friction but this is what real hiring platforms do (Codility, HackerRank).
7. **Time-bound assessment window** — invite link valid for 24-48h from send; expired attempts are rejected server-side.
8. **Rate-limit at the webhook** — same IP submitting >2 completed assessments in 24h is flagged.
9. **Be honest with candidates** — "This assessment can only be taken once. Duplicate attempts are automatically detected and flagged to the recruiter." Deterrent is real even if the technical enforcement is imperfect.
10. **Explicit anti-pattern:** do NOT rely on localStorage alone. It is UX-friendly but zero-security.

**Warning signs:**
- One-attempt logic lives entirely on the client
- No fingerprint or IP data captured on submit
- Recruiter dedup is `exact-string-match(email)` only
- Answer keys stored in the SPA bundle in plaintext (any candidate can `view-source` and read them)

**Phase to address:** **Phase 3 (Scoring & Submission)** — also informs **Phase 1 (Foundations)** which must not preclude these mitigations (e.g. must capture email + fingerprint upfront).

**Severity:** HIGH — the entire assessment's validity depends on this.

**Related trap: Answer keys in the bundle.** With client-side scoring, the ground-truth JSON is downloadable. Any candidate opens Network tab, sees `answers.json`, copy-pastes into their submission. **Mitigation:** obfuscate (not encrypt — no client-side crypto is secure against a determined attacker), or move scoring to the Apps Script `doPost` (server-side), or accept the risk and rely on secondary signals (time-to-answer patterns, tag ordering). The last is the pragmatic choice given the "no backend server" constraint; document it explicitly.

---

### Pitfall 5: Timer inaccuracy and clock-tampering

**What goes wrong:**
- `setInterval(tick, 1000)` drifts under CPU load, tab throttling, or when the tab is backgrounded (browsers throttle timers in inactive tabs to ≥1 minute intervals in Chrome/Firefox)
- Candidate opens DevTools, freezes JS execution, thinks, resumes — timer paused
- Candidate changes system clock — if timer uses `Date.now()` naively, it can be rewound
- Component remounts (React StrictMode double-invocation in dev, or route change) resets the timer to 3 minutes
- Timer uses local component state; a page refresh resets it to 3:00 and lets the candidate replay the video from scratch

**Why it happens:**
- `setInterval` is the obvious API but drifts and pauses on hidden tabs
- Reference implementation `flagmail1` uses a `useTimer` hook — its exact fidelity to these edge cases is unverified
- Server-authoritative timing is out of scope (no backend)
- No one tests "candidate hits F5" or "candidate switches tabs for 2 minutes"

**Consequences:**
- Fairness complaints ("timer ran while I wasn't looking")
- Candidates who know the trick get unlimited time; honest candidates get 3 minutes
- Recruiter cannot defend the score against an appeal

**How to avoid:**
1. **Anchor timer to `performance.now()` deltas** — read on every render, don't accumulate via `setInterval`. Elapsed = `performance.now() - videoStartTs`. Immune to tab throttling and clock changes (`performance.now()` is monotonic).
2. **Persist `videoStartTs` and per-video state to `sessionStorage`** — F5 does NOT reset the timer; restoring reads the original start timestamp. If elapsed > 3:00 on restore, auto-submit blank.
3. **Anchor start to `playing` event, not mount** (also fixes Pitfall 3).
4. **Include a monotonic `Page Visibility API` audit trail** — log `visibilitychange` events with timestamps into the submission payload. Recruiter can see if the candidate spent 90 seconds with the tab hidden.
5. **Detect DevTools open** (imperfect but signals bad faith) — check `window.outerHeight - window.innerHeight > threshold` or the `debugger` statement trick. Log to submission, don't block.
6. **Ignore React StrictMode double-mount** — timer start logic must be idempotent. Use `useRef` for `videoStartTs`, not `useState`, so double-invocation doesn't reset.
7. **Ceiling with server-side sanity check** — Apps Script `doPost` compares `videoStartTs` and `submitTs` from the payload against `receivedAt` — impossibly fast submissions (< 30s per video) are flagged.
8. **Explicit "session in progress" lock** — on navigation-away or `beforeunload`, warn and keep the timer running.

**Warning signs:**
- Any `setInterval(fn, 1000)` for elapsed-time tracking
- Timer state in `useState` without a ref-backed start timestamp
- No `sessionStorage` persistence
- Timer starts in `useEffect(() => {...}, [])` with `mount` semantics
- Testing only happy-path (no F5, no tab-switch)

**Phase to address:** **Phase 2 (Custom Video Player)** (start-on-`playing`) and **Phase 3 (Scoring & Submission)** (audit trail, server-side ceiling)

**Severity:** HIGH

---

### Pitfall 6: Ground-truth answer keys are one person's opinion — no defensibility

**What goes wrong:**
Author writes the L1/L2 answer key based on their own reading of each video. Six months later:
- Candidate scores 40%, appeals: "I called this Hate Speech; you say Harassment. Both are legitimate reads." Recruiter has no principled response.
- Client's actual moderation team disagrees with 2 of 5 answers → the assessment is measuring the wrong thing.
- Two candidates give the same answers and get different scores because the scoring engine has an edge case.
- The taxonomy has overlapping definitions (Harassment vs Hate Speech vs Cyberbullying) that reasonable reviewers disagree on — measured inter-rater reliability (Cohen's kappa) would be < 0.4 (poor).
- The answer key gets updated after some candidates already took the test → scores are not comparable across cohorts.

**Why it happens:**
- Answer keys feel objective ("this obviously contains nudity") but taxonomy application is famously subjective (documented low agreement in academic content-moderation research)
- Single-author keys have no calibration signal
- "Correct" answer is what the author thinks the model answer is — not what a trained moderator team converges on
- Client hasn't validated the taxonomy yet

**Consequences:**
- Rejected candidates appeal and the tool cannot defend the score
- Client's actual moderators score below "Foundation" on the test they're supposed to design → client loses confidence
- Legal risk: if a rejected candidate claims the assessment is arbitrary/discriminatory, unvalidated keys are the smoking gun

**How to avoid:**
1. **Three independent raters per video, minimum** — you + 2 external reviewers with moderation domain knowledge tag each video blindly. Compute Cohen's kappa (2 raters) or Fleiss' kappa (3+) per L1 category. Only ship videos with kappa ≥ 0.6 (substantial agreement) for the L1 dimension; L2 can be looser but document it.
2. **Tie-breaker rule documented up front** — e.g. "when raters disagree, the union of L1 tags is accepted; L2 is scored on any-one-match." Rules must be picked BEFORE seeing candidate data.
3. **Rubric with explicit criteria per L1 category** — not "this is hate speech because I say so" but "hate speech = protected-class targeting + dehumanising language + calls for exclusion." Written in the guidelines page so candidates and appeals reviewers reference the same rubric.
4. **Partial credit is the default, not the exception** — PROJECT.md already sets verdict 50% / L1 25% / L2 25%. Extend: any L1 tag in the accepted-answer set earns full L1 credit (multi-select tolerance). Any L2 that's a child of a correct L1 earns partial.
5. **Version the answer key** — every candidate submission includes `answerKeyVersion`. If the key updates, scores are only compared within a version.
6. **Client review gate before launch** — client's actual moderation lead reviews the 5 answer keys and signs off. Any category they disagree on is either fixed or dropped from scoring (accepted as un-graded).
7. **Explicit "we scored this way and here's why" per-video in the report** — recruiter and appealing candidate can see the rationale, not just a score.
8. **Calibration set** — reserve 1 of the 5 videos as a "well-established" case (obvious copyright violation, e.g.) where all raters agreed easily. If a candidate misses that one, the signal is very strong. Ambiguous videos differentiate top scorers.
9. **Document known-ambiguous videos** in the ground-truth doc: "Video 3 is deliberately borderline; we accept both Approve+Warning and Decline+Trust&Safety."
10. **Never modify keys post-launch without incrementing the version.**

**Warning signs:**
- Answer keys authored by one person with no second review
- No documented tie-breaker rules
- No kappa/agreement computation on the ground truth
- Categories with fuzzy definitions ("Brand Safety" is famously ill-defined) with no rubric
- Answer key edited after first candidate has submitted

**Phase to address:** **Phase 0 (Foundations)** — taxonomy sign-off — and **Phase 3 (Scoring)** — rubric, partial-credit rules, versioning. Second-rater calibration is a pre-launch gate before **Phase 4 (Deploy)**.

**Severity:** HIGH — measurement validity issue; without this the whole product is theatre.

---

### Pitfall 7: Formspree / Google Sheets webhook abused → hiring pipeline poisoned

**What goes wrong:**
Formspree free-tier has ~50 submissions/month cap (verify current cap at signup — historically 50, may vary). Google Apps Script `doPost` published as `ANYONE_ANONYMOUS` accepts any POST from any origin, no auth. A bad actor:
- Discovers the endpoint URL (it's in the shipped JS bundle — trivial to extract)
- Scripts thousands of fake submissions, exhausting Formspree quota mid-cycle
- Poisons the recruiter's inbox/Sheet with junk, hiding real candidate submissions
- Or worse: submits an XSS payload in the "name" field that fires when the recruiter opens the Sheet in a browser

**Why it happens:**
- No server means no rate-limiting layer between the SPA and the sink
- Free-tier form services don't provide origin binding or per-IP throttling out of the box (Formspree has some spam protection; Sheets `doPost` has none)
- Endpoint URL cannot be secret in a client-only architecture
- Google Apps Script has generous free-tier quotas but they're PER USER, and a runaway loop can hit them (URL Fetch is 20 000 calls/day for free accounts)

**Consequences:**
- Legitimate candidates submit → 429 rate-limited or lost in noise
- Formspree quota exhausted → account disabled or email spam-throttled
- Recruiter sees 500 submissions overnight, can't find real ones, loses trust
- Sheet corrupted (XSS in name field, HYPERLINK() injection in email field)

**How to avoid:**
1. **Formspree specifics** — enable built-in reCAPTCHA/hCaptcha honeypot; enable file-attachment blocking (nothing to attach here anyway); set an explicit allowed-domain list to the Pages URL only. Do NOT rely on free-tier defaults.
2. **Apps Script `doPost` should NOT be `ANYONE_ANONYMOUS` without a shared secret** — include a rotating time-based token in the POST body computed via `HMAC(sharedSecret, timestamp)`. `doPost` verifies. Not cryptographically strong (secret ships in the bundle) but blocks trivial replay/scraping bots.
3. **Origin check in `doPost`** — read `e.parameter.origin` (or a client-attested origin) and reject non-Pages origins. Bypassable but raises the bar.
4. **Rate limit per fingerprint** — Apps Script keeps a Sheet tab of `{fingerprint, timestamp}`; reject if same fingerprint submitted < 12h ago.
5. **Sanitise on read, not write** — assume any field contains hostile input. In the Sheet, never treat cell values as formulas; prefix any user string with `'` (Sheets literal marker) or use `Utilities.formatString` when composing recruiter emails.
6. **Honeypot field** — hidden `<input name="website" tabindex="-1" style="display:none">` in the form. Real users leave it empty; bots fill it. Reject non-empty on server.
7. **Client-side minimum-time gate** — reject submissions that arrive < 60 seconds after page load (impossibly fast = bot).
8. **Alert on burst** — Apps Script sends recruiter an email if >10 submissions arrive in 1 hour. Recruiter can pause the endpoint.
9. **Have a Plan B endpoint** — a second Sheet + doPost URL pre-configured, so if the primary is poisoned, ops can swap in via one JSON config change and redeploy.
10. **Never log PII to CI/console** — full candidate name + email in a GitHub Actions log is a GDPR-adjacent leak.

**Warning signs:**
- `doPost` accepts requests with no token
- No rate-limiting anywhere in the pipeline
- Endpoint URL used unchanged for months (no rotation plan)
- Recruiter's Sheet has never been audited for injection
- No monitoring on submission volume

**Phase to address:** **Phase 3 (Scoring & Submission)** — endpoint hardening; **Phase 4 (Deploy)** — monitoring and Plan B endpoint.

**Severity:** HIGH

---

## Moderate Pitfalls

### Pitfall 8: Custom seek bar seeks to the wrong frame

**What goes wrong:** HTML5 `video.currentTime = X` snaps to the nearest keyframe in most browsers, not the exact millisecond. If chapter markers point at suspicious moments and clicking a marker lands 2 seconds early or late, moderators miss the frame.

**Prevention:**
- Re-encode source videos with a keyframe interval of 1s (`-g 30` at 30fps) so seek granularity is 1s worst-case.
- For frame-accurate marker positioning, seek to `X - 0.1` then step forward via `requestVideoFrameCallback` (Chromium 83+, Safari 15.4+).
- Test seek accuracy on Safari specifically — its seek behaviour differs from Chrome.

**Phase:** Phase 2 (Custom Video Player)

### Pitfall 9: Thumbnail sprite generation is ad-hoc and breaks when videos change

**What goes wrong:** Devs generate sprites once via `ffmpeg` locally; when a video is re-encoded, sprites are stale. Or sprites are 4K images inflating page load. Or the WebVTT sprite mapping drifts from the sprite image.

**Prevention:**
- Script the sprite generation (ffmpeg + Python script in `scripts/gen-thumbnails.sh`) and commit both the sprite AND a JSON mapping `{video: 'v1.mp4', sprite: 'v1-sprite.jpg', tiles: 100, tileW: 160, tileH: 90, interval: 1.0}`. Regenerate from source on every video change; never hand-edit.
- Sprite image should be 160×90 tiles at JPEG q=70; total file typically < 200 KB per video.
- WebP over JPEG if browser support is fine (evergreen only).

**Phase:** Phase 2

### Pitfall 10: Chapter markers hardcoded per-video → adding videos is a code change

**What goes wrong:** Marker positions and labels live in JSX instead of the JSON config. Adding video 6 requires a code change and rebuild.

**Prevention:** Chapter markers in the same JSON that defines the playlist. Player consumes `{ id, src, duration, markers: [{ t: 42.5, label: 'Suspicious cut', category: 'graphic' }] }`. Aligns with PROJECT.md's JSON-driven playlist decision.

**Phase:** Phase 2

### Pitfall 11: GSAP animations leak memory on route changes

**What goes wrong:** GSAP tweens/timelines created in `useEffect` without cleanup persist after unmount. Over 5 videos + result screen, animations accumulate, framerate drops.

**Prevention:** Use `useGSAP` from `@gsap/react` (verified via Context7 — automatic cleanup via `context.revert()` on unmount). NEVER call `gsap.to`/`gsap.timeline` directly in `useEffect` without a manual `return () => tl.kill()`. Scope selectors via `useGSAP(() => {...}, { scope: containerRef })` to avoid cross-component selector collisions.

**Phase:** Phase 5 (Polish / GSAP integration)

### Pitfall 12: Lottie assets bloat bundle; play on unmounted component

**What goes wrong:** Milestone Lottie JSONs (11 files in flagmail1) can be 100-500 KB each. Bundled together they inflate the initial JS payload, slowing first candidate load. `lottie-web` also throws warnings when parent unmounts mid-animation.

**Prevention:**
- Load Lottie JSONs dynamically (`await import('...')`) only on the result screen, not the video screens.
- Use `lottie-react`'s `useLottie` and always call `destroy()` on unmount.
- Compress Lottie JSONs with `lottie-optimize` — often 40-70% reduction.

**Phase:** Phase 5

### Pitfall 13: Vite `base` misconfiguration → white screen on Pages

**What goes wrong:** Deployed to `https://user.github.io/repo-name/` but `vite.config.js` `base: '/'`. Assets 404, page is white. Or SPA client-side routing breaks on refresh because Pages returns 404 for `/repo-name/results` (no server rewrites).

**Prevention:**
- Set `base: '/<repo-name>/'` in `vite.config.js` (verified via Vite docs).
- Use HashRouter, not BrowserRouter — no server-side rewrites on Pages.
- Ship a `404.html` that redirects to `index.html` as a fallback (spa-github-pages pattern).

**Phase:** Phase 0 / Phase 4 (Deploy)

### Pitfall 14: PII stored in GitHub commit history

**What goes wrong:** Developer accidentally commits a test submission with real candidate name/email while debugging. Now in public git history forever. GDPR concern even in a hiring context.

**Prevention:**
- `.gitignore` any `submissions/`, `test-data/`, `*.local.json` paths.
- Pre-commit hook grep for `@` character in strings + email pattern.
- Never paste real recruiter/candidate PII into repro-case bug reports.

**Phase:** Phase 0

### Pitfall 15: Video sourcing violates the license constraint

**What goes wrong:** CC0 clip pulled from Pexels turns out to have a recognisable person who did NOT sign a model release (CC0 covers the video license, not the depicted individuals' right of publicity). Or an AI-generated clip includes a training-data-memorised likeness. Or a Runway/Sora clip is used commercially outside the tool's TOS.

**Prevention:**
- License per source: Pexels/Pixabay CC0 is fine BUT prefer clips with no clearly identifiable people or use scenes (landscapes, objects, animations).
- AI-gen: use tools with commercial-use permission on the plan you're paying for; avoid celebrity/copyrighted-character prompts.
- Document per-video: source URL, license text, model-release status, "why safe to use." Bake into the ground-truth doc.
- Legal review of the final 5 before launch.

**Phase:** Phase 0 (video sourcing) and pre-launch gate

---

## Minor Pitfalls

### Pitfall 16: React 19 StrictMode double-invocation confuses timer/video logic
Dev-only double mount fires `useEffect` twice; naive video-play or timer-start logic runs twice. **Prevention:** all such logic must be idempotent (guard with refs); test in StrictMode locally.

### Pitfall 17: `localStorage` disabled in some enterprise browsers
Some corporate/kiosk browsers disable localStorage. `useEffect(() => localStorage.setItem(...))` throws. **Prevention:** wrap in try/catch; degrade gracefully; use `sessionStorage` for per-tab state (usually more permissive).

### Pitfall 18: Video preload eats mobile data
`preload="auto"` on 5 videos = 100 MB pre-fetched before the candidate starts. **Prevention:** `preload="metadata"` on all, load bytes only when the current video's play button is clicked.

### Pitfall 19: JSON config not validated → runtime crash on typo
A missing `duration` or malformed marker crashes the player. **Prevention:** Zod schema validation at app bootstrap; fail with a human-readable error if the config is malformed.

### Pitfall 20: Scoreboard formula bugs slip past review
Off-by-one on partial credit (verdict wrong but tag right earns 25% instead of 0%). **Prevention:** unit tests on the scoring function with hand-computed expected scores for 10 permutations.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Answer keys hardcoded in JS file, not JSON | Fast iteration | Every key edit = redeploy; leakable via view-source (already leakable — see Pitfall 4) | MVP only; move to JSON at Phase 3 |
| Client-side scoring only | No backend needed | Answer keys downloadable; no server-side integrity | Accept for v1; document limitation; move to Apps Script scoring at v2 |
| localStorage-only one-attempt | Simple UI | Trivial bypass (Pitfall 4) | Never acceptable as sole defence; must be combined with server-side dedup |
| Ad-hoc thumbnail generation | Faster to spike | Sprites go stale when videos change | Never for shipped videos; script it |
| Single-rater ground truth | Ship faster | Cannot defend appeals; measurement invalidity | Never for a hiring signal that matters |
| `setInterval` timer | Familiar API | Drifts, throttled in bg tabs, resets on refresh | Never for anything user-visible in an assessment |
| Videos re-pushed with small edits | "Just fix it" workflow | Storage quota bleeds; 500 MB per re-push (Pitfall 2) | Never; treat video revisions as expensive |
| Formspree defaults, no hardening | Zero config | Endpoint DDoS/spam (Pitfall 7) | Never in a public-facing form that gates hiring |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **GitHub Pages + Vite** | `base: '/'` at root instead of `/<repo>/` | Set base to repo name; use HashRouter |
| **GitHub Pages + LFS** | Assumes bandwidth is unmetered like Pages itself | LFS has separate 10 GiB/mo quota; Pages requests for LFS files bill against LFS |
| **GitHub Actions + LFS** | `actions/checkout` pulls LFS on every build | Set `lfs: false` unless build genuinely needs the assets |
| **Formspree** | Ship with defaults | Enable captcha, honeypot, domain allowlist, spending cap |
| **Google Apps Script `doPost`** | `ANYONE_ANONYMOUS` with no token | Add HMAC token check, origin check, per-fingerprint rate limit |
| **HTML5 `<video>`** | Autoplay unmuted | Never autoplay; user gesture starts playback + timer |
| **HTML5 `<video>` on iOS** | Missing `playsinline` | Always include `playsinline` |
| **GSAP + React 19** | `gsap.to` in `useEffect` without cleanup | Use `useGSAP({ scope })` for auto-revert |
| **Lottie in React** | Load all animations upfront | Dynamic import on the result screen only |
| **Google Sheets webhook** | Trust field values as-is | Prefix `'` on user strings to prevent formula injection |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All 5 videos preloaded on landing | Slow initial paint, mobile-hostile | `preload="metadata"`; fetch bytes on user gesture | Immediately on mobile/slow connections |
| Lottie 500 KB × 11 in initial bundle | 3+ s TTI | Dynamic import per animation, only on result screen | First candidate on 3G |
| Thumbnail sprites at 4K | 5 MB per video, slow scrub | 160×90 tiles at JPEG q=70 | Every scrub interaction |
| GSAP timelines accumulate across routes | Framerate drops after video 3 | `useGSAP` scope + auto-revert | ~10 min into session |
| Re-render entire scoreboard on every timer tick | Chart re-renders 1×/sec | Timer in separate component; scoreboard reads `performance.now()` on demand | Any session with animations |
| LFS bandwidth quota | Videos 404 mid-cycle | See Pitfall 2 | Session ~40 in month (at 250 MB/session, 10 GiB budget) |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Client brand name in git history | Legal exposure, breach of client instruction | Pre-commit grep gate; fresh repo; delete-and-recreate if leaked (Pitfall 1) |
| Answer keys in bundle | Any candidate can view-source and cheat | Accept with disclosure, or move scoring to `doPost` |
| PII in commit history | GDPR-adjacent, forever exposure | `.gitignore` test data; pre-commit email regex |
| CSV/formula injection in Sheet | Recruiter's browser executes when opening Sheet | Prefix user strings with `'` in Apps Script |
| Unbounded `doPost` endpoint | Endpoint scraped and abused | HMAC token, origin check, rate limit |
| XSS via candidate name field | Persistent XSS if names displayed | Escape on render; never `dangerouslySetInnerHTML` on user input |
| Referrer leak of Pages URL | Reveals client-brand-linked hosting patterns | `Referrer-Policy: no-referrer` meta tag |
| Detailed source-map in production | Reveals internal file structure | Disable Vite `build.sourcemap` for production |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Timer visible from before video starts | Anxiety; candidate races to click play | Start timer on `playing` event; show "Ready" state pre-play |
| No indication timer is about to expire | Panic auto-submit | Colour + shake at 30s remaining; sound at 10s |
| Video can be skipped by clicking end of seek bar | Trivial cheating | Lock seek bar until first play; or accept scrubbing but require min-view-time before verdict enables |
| L1/L2 taxonomy shown without examples | Wrong tag from misunderstanding | Full guidelines page with per-category examples (already in PROJECT.md scope) |
| Multi-select L1 with no "None" option | Forced to tag violation on clean video | Include explicit "No violation" tag; Approve verdict does not require L1 selection |
| Result page reveals answer key on completion | Answer key leaks after every candidate | Show category breakdown ("You missed 2/5 in Copyright") without revealing per-video correct answer |
| No way to save-and-resume | Any network glitch = losing an attempt | Persist to sessionStorage on every state change; resume on reload |
| Confusing verdict semantics ("Approve" vs "Publish" vs "Allow") | Wrong verdict from ambiguous label | Use one consistent verb in guidelines and player: Approve / Decline. Include examples in guidelines. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Brand-name scrub:** run `grep -riE '(client|brand|franchise|characters)' src/ public/ *.html *.json` and inspect git log. Verify HTML `<title>`, `<meta>`, favicon.
- [ ] **Autoplay:** verified in a fresh Chrome profile with no media engagement; player shows "Click to start" fallback when `play()` rejects.
- [ ] **Timer:** verified across page refresh, tab-switch (2 min hidden), DevTools JS-pause, system-clock change.
- [ ] **One-attempt:** verified against incognito, clear-storage, different browser, `+` alias, dotted-alias, different IP.
- [ ] **Answer keys:** ≥ 3 raters, Cohen/Fleiss kappa computed per L1, tie-breaker rules documented, client signed off.
- [ ] **Ground-truth doc:** every video has source URL, license, model-release status, tagged categories with rationale, kappa scores.
- [ ] **LFS bandwidth:** budget math done for expected candidate flow; CDN fallback pre-provisioned; billing spending cap = $0.
- [ ] **Formspree/Sheets endpoint:** captcha enabled, domain allowlist set, honeypot present, HMAC token check in `doPost`, burst-alert email.
- [ ] **Video accessibility:** captions/transcript available for audio-content categories (may not be a hard v1 requirement per PROJECT.md, but check).
- [ ] **Mobile fallback:** page tells mobile candidates "please take on desktop" rather than shipping a broken experience.
- [ ] **Result submission:** candidate sees confirmation with a submission ID; recruiter receives PII + answers + fingerprint + timing audit.
- [ ] **Vite base path:** deployed URL loads without white screen; assets 200 not 404.
- [ ] **404 fallback:** SPA client-side routes work after refresh (`404.html` → `index.html` redirect).
- [ ] **StrictMode:** app behaves identically in StrictMode double-invocation dev mode.
- [ ] **Zod validation:** video config schema validated at bootstrap; malformed config fails with human-readable error.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Brand name in git history (already pushed) | HIGH | Delete repo entirely; recreate with new name; force-push scrubbed history; ask GitHub Support to purge cached refs; notify anyone who cloned |
| LFS bandwidth exhausted | MEDIUM | Immediately swap `VIDEO_BASE_URL` in JSON config to a pre-provisioned CDN mirror; redeploy; wait for next-month reset; upgrade plan if flow requires it |
| Formspree quota exhausted | LOW-MEDIUM | Swap to pre-provisioned second endpoint (Sheets doPost); redeploy with new URL |
| Answer key wrong post-launch | MEDIUM | Bump answer-key version; re-score affected submissions (all versioned); communicate to recruiter which cohorts are v1 vs v2 |
| Autoplay bug reported by candidate | LOW | Push "Click to start" fallback; hotfix and redeploy in < 1h |
| Timer bug allowing extra time | MEDIUM | Add `performance.now()` audit; flag existing submissions with anomalous timing for manual recruiter review |
| Endpoint spammed | MEDIUM | Rotate `doPost` URL; enable stricter rate limit; audit Sheet for injection; notify recruiter |
| Video license issue discovered post-launch | HIGH | Take down affected video immediately; re-source and re-encode replacement; re-run ground-truth rating; version key |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Brand name leak | **Phase 0 (Foundations)** | Pre-commit hook active; CI grep gate green; audit script passes on every push |
| 2. LFS bandwidth | **Phase 0 + Phase 4 (Deploy)** | Budget math documented; CDN fallback provisioned; billing spending cap = $0 |
| 3. Autoplay blocked | **Phase 2 (Custom Video Player)** | Manual test in fresh Chrome/Safari profiles; fallback UI verified |
| 4. One-attempt bypass | **Phase 1 (Foundations) + Phase 3 (Scoring)** | Test suite for incognito/multi-browser/alias-email bypass; server-side dedup active |
| 5. Timer inaccuracy | **Phase 2 + Phase 3** | Manual test: F5 mid-video, background tab, DevTools pause; `performance.now()` anchoring verified |
| 6. Ground-truth subjectivity | **Phase 0 (taxonomy sign-off) + Phase 3 (rubric) + pre-launch gate** | 3-rater kappa ≥ 0.6 per L1; client sign-off; tie-breaker rules committed to repo |
| 7. Webhook abuse | **Phase 3 + Phase 4** | HMAC token verified; origin check active; rate limit tested; burst alert configured |
| 8. Seek accuracy | **Phase 2** | Manual test on Safari; keyframe interval verified in source encoding |
| 9. Thumbnail staleness | **Phase 2** | Sprite generation scripted; regeneration on video change verified in CI |
| 10. Hardcoded chapters | **Phase 2** | Adding a 6th video is a JSON edit, not a code change |
| 11. GSAP memory leak | **Phase 5 (Polish)** | `useGSAP` used everywhere; no bare `gsap.to` in `useEffect` (lint rule) |
| 12. Lottie bundle bloat | **Phase 5** | Bundle analyser shows Lottie in async chunks only |
| 13. Vite base misconfig | **Phase 0 + Phase 4** | Deployed URL loads assets; SPA routes resolve after refresh |
| 14. PII in git | **Phase 0** | Pre-commit hook for email regex; `.gitignore` covers submission fixtures |
| 15. Video licensing | **Phase 0 (sourcing) + pre-launch legal review** | Per-video license/model-release documented; final review before launch |

---

## Sources

- **GitHub Docs — Git LFS billing** (via Context7, `docs.github.com/en/billing/concepts/product-billing/git-lfs`): confirmed 10 GiB/mo Free-tier LFS bandwidth, download-billed model, storage counts on every push (500 MB re-push = 500 MB storage), fork downloads bill parent repo, archives count if LFS-in-archives enabled, over-quota = LFS disabled account-wide until next month. **HIGH confidence.**
- **GitHub Docs — Pages usage limits** (via Context7, `docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits`): confirmed 1 GB repo/published-site limit, 100 GB/mo soft bandwidth (separate from LFS bucket), 10 builds/hr soft limit, 10-min build timeout. **HIGH confidence.**
- **GitHub Docs — Removing sensitive data** (via Context7): confirmed `git filter-repo` mechanism; note that `git revert` does NOT purge history. **HIGH confidence.**
- **Video.js docs — autoplay** (via Context7, `docs.videojs.com/player`, `docs.videojs.com/tutorial-options.html`): confirmed browser autoplay policy interactions and `'muted'` autoplay fallback pattern. **HIGH confidence** for the underlying browser behaviour, which Video.js documents accurately.
- **Vite docs — deploying to GitHub Pages** (via Context7, `github.com/vitejs/vite/blob/main/docs/guide/static-deploy.md`): confirmed `base: '/<REPO>/'` requirement for project pages. **HIGH confidence.**
- **GSAP React docs — useGSAP cleanup** (via Context7, `github.com/greensock/react`): confirmed automatic `context.revert()` cleanup, ScrollTrigger cleanup, and scope-based selector isolation. **HIGH confidence.**
- **Google Apps Script — Web app configuration** (via Context7, `developers.google.com/apps-script/manifest/web-app-api-executable`, `.../guides/web`): confirmed `ANYONE_ANONYMOUS` access model and `doPost` requirement; UrlFetch quota history. **HIGH confidence** for the platform mechanics; specific free-tier submission cap on Formspree is not cited from primary source and should be verified at signup — **MEDIUM confidence** for the "50/mo" figure quoted in Pitfall 7.
- **Formspree JS** (via Context7, `github.com/formspree/formspree-js`): confirmed the `data` extension mechanism for appending fingerprint/token payloads; free-tier limits not enumerated in code docs. **MEDIUM confidence** on the specific tier limits.
- **Inter-rater reliability (Cohen's kappa, Fleiss' kappa)** (via Context7, `cran.r-project.org/web/packages/irrCAC`): confirmed methodology, interpretation ranges (0.6 = substantial), and multi-rater extension (Fleiss). **HIGH confidence** on methodology; **MEDIUM confidence** on the ≥ 0.6 cutoff recommendation (industry-standard but debated; some domains use ≥ 0.4 as acceptable).
- **Personal / practitioner knowledge:** cheating patterns in remote assessments (Codility/HackerRank reference), Chrome autoplay policy edge cases, React 19 StrictMode double-invocation, `setInterval` background throttling, `performance.now()` monotonicity, CSV/formula injection into Sheets. **MEDIUM-HIGH confidence** (not cited to primary source in this doc but well-established web-development lore).

**Confidence note:** items marked HIGH have primary-source Context7 verification. Items marked MEDIUM are practitioner knowledge and should be re-verified against a current source before being treated as gospel — flagged in-line where relevant.

---
*Pitfalls research for: content-moderation video hiring assessment*
*Researched: 2026-07-07*
