# Content Moderation Assessment

## What This Is

A browser-based hiring assessment that simulates real-world video content moderation work. Candidates watch 5 short creator-style videos (1–2 min each), tag each with L1/L2 violation categories (multi-select), issue an Approve/Decline verdict under a 3-minute-per-video timer, and receive a graded scoreboard modeled on the flagmail1 pattern (competency title, per-category accuracy, Lottie milestone celebrations, overall score). Built for a BPO partner selection flow to a large family-friendly streaming operator; the product must NEVER reference the client brand by name, only its visual language.

## Core Value

**Give hiring managers a defensible, industry-aligned signal that a candidate can moderate creator video content correctly and consistently.** If everything else fails, the 5-video test → verdict + L1/L2 tagging → scored report must work end-to-end and produce a shareable result for the recruiter.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

**Candidate onboarding**
- [ ] Landing page collects candidate name + email upfront (required) before test starts
- [ ] Full guidelines page presents L1/L2 taxonomy with examples before video 1
- [ ] One-attempt-only enforcement (localStorage flag + backend duplicate detection)

**Video moderation flow**
- [ ] 5-video hiring test, each 1–2 minutes long, loaded from JSON config (scalable to 50+ later, random-5-of-N optional)
- [ ] Custom video player with seek bar, thumbnail preview on scrub, and chapter/timestamp markers highlighting suspicious moments
- [ ] Per-video 3-minute countdown timer with visible warning states; timeout auto-submits current selections
- [ ] Multi-select L1 category tagging + dependent L2 sub-category tagging per video
- [ ] Approve / Decline verdict button per video
- [ ] Optional short reasoning notes field (future — v2)

**Scoring & report (full flagmail1 clone)**
- [ ] Per-category accuracy breakdown (accuracy% per L1)
- [ ] Competency title (Advanced / Proficient / Foundation) + strengths/weaknesses paragraph
- [ ] Overall score % + time-to-complete + correct-verdict streak stats
- [ ] Lottie milestone celebrations (PERFECT_EYE, SNIPER, ON_FIRE, ZONE_CLEAR, etc.) on qualifying scores
- [ ] Rubric-friendly per-video scoring: verdict correct (50%), L1 correct (25%), L2 correct (25%) — partial credit
- [ ] Ground-truth answer keys documented per video with reasoning

**Results delivery**
- [ ] Backend submission on completion — Formspree OR Google Sheets webhook (single POST from client)
- [ ] Candidate sees own scoreboard onscreen
- [ ] Recruiter receives full submission (identity + per-video answers + scores) in Sheet/Formspree inbox

**Design & branding**
- [ ] Visual language mirrors the reference streaming brand (typography, palette, spacing, motion feel) WITHOUT ever printing the brand name, logo, franchise names, or characters anywhere in UI, code, meta tags, or repo names
- [ ] Product surface reads as generic "Content Moderation Assessment"
- [ ] Motion parity with flagmail1 (GSAP transitions + Lottie assets)

**Content taxonomy (industry-aligned, researched)**
- [ ] L1/L2 taxonomy covers: Copyright & IP, Trust & Safety (Hate/Harassment, Violence/Graphic, Sexual/Nudity, Minor Safety, Regulated Goods, Misinfo/Deceptive, Spam/Manipulation), Brand Safety, Community Standards
- [ ] Taxonomy source docs cited (TikTok, YouTube, Meta community guidelines synthesized) so client can validate before launch

**Infrastructure**
- [ ] Deployed to a **new** public GitHub repo, Pages served from `/docs` or `gh-pages` branch via GitHub Actions
- [ ] Videos hosted via Git LFS in the same repo (5 videos now, sized to stay within LFS free tier); JSON config drives playlist
- [ ] Vite + React 19 + GSAP + Lottie stack mirroring flagmail1

**Video sourcing (client asked for help)**
- [ ] Mix strategy: (a) CC0 stock clips from Pexels/Pixabay with synthetic overlays to simulate violations, (b) AI-generated clips (Runway/Veo/Sora) for controllable violation types, (c) originally recorded material where useful
- [ ] Each of the 5 videos ships with documented source, license, and the specific violation category it targets

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Real client-brand assets** (logos, character IP, franchise footage) — Explicitly requested: brand name must not appear anywhere; using their IP would violate the rule
- **Real production creator-uploaded content** — Rights/privacy risk; assessment uses curated synthetic/CC0 mix
- **Leaderboard across candidates** — Would require persistent backend + candidate PII handling; out of v1 scope
- **CMS admin UI for videos** — JSON config is enough; heavy backend admin is over-engineered
- **Frame-by-frame scrubbing** — Chapter markers already surface suspicious moments; frame-level is beyond BPO-1 moderator workflow
- **Multiple retake attempts** — Fair hiring signal requires one attempt; contradicts assessment intent
- **Free-form written explanation per video (v1)** — Adds grading complexity; deferred to v2
- **Backend auth / login system** — Overkill for a hiring test; identity captured once at start
- **Mobile-first design (v1)** — Desktop-first (moderators work on desktops); mobile responsive is nice-to-have not blocker
- **i18n / multi-language UI** — English-only for v1
- **Video transcript / subtitle overlay** — Not standard in real mod queues at this tier

## Context

- **Reference implementation:** `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1` — React 19 + Vite email phishing hiring test. Uses per-category accuracy scoring (`src/utils/competency.js`), Lottie milestone animations (11 JSON files in `src/assets/animation/`), GSAP motion, `useTimer` hook. Scoreboard concept is the direct pattern to replicate.
- **Client business context:** A BPO is being evaluated to moderate creator-generated video content (movies + franchise fandom) on the client's new short-form vertical-video sub-platform (TikTok-style). Client retains ownership of operating model, escalation, quality, governance; BPO handles at-scale operational moderation.
- **Prior exploration:** No spikes/sketches yet. `flagmail1` is the visual/UX blueprint but the domain is video moderation, not email phishing.
- **User feedback theme:** Manager explicitly asked to replicate the flagmail1 scoreboard — this is a stakeholder ask, not a design suggestion.
- **Content moderation industry norms researched separately in `.planning/research/` before requirements are locked.

## Constraints

- **Brand rule**: Client brand name, logo, franchise names, character names must NEVER appear in UI, code, meta tags, repo names, commits, or any deliverable — Non-negotiable client instruction. Visual language allowed; identity is not. **REVISED 2026-07-09**: project owner disabled automated guardrails and approved Disney-related references for assessment videos and UI theme; legal risk retained by project owner.
- **Tech stack**: Vite + React 19 + GSAP + Lottie (match `flagmail1`) — Reuses proven patterns, minimizes ramp time, and manager's mental model already anchored on flagmail1.
- **Hosting**: GitHub Pages + Git LFS in a new public repo, deploy via GitHub Actions — Zero-cost, meets "put on Pages including videos" requirement.
- **Bandwidth**: GitHub Free LFS tier is 10 GiB storage + 10 GiB bandwidth per month (verified 2026-07-07 via research/PITFALLS.md); at ~250 MB/session that's ~40 sessions/mo — CDN fallback (jsDelivr / Cloudflare R2) must be pre-provisioned before real hiring cycle. Total video payload budget ~200 MB across 5 videos; re-encode with H.264 720p if needed. Over-quota disables LFS for the entire account until next billing cycle — treat as launch blocker.
- **Timeline**: Manager wants a working demo comparable to flagmail1 quickly (assume weeks not months) — Prioritize vertical-slice MVP.
- **Budget**: No paid infra. Free tiers only (GitHub Pages, LFS free tier, Formspree free / Google Sheets Apps Script).
- **Legal**: All test videos must have clean license (CC0/CC-BY, AI-generated, or originally recorded) — Ironic-but-real: a copyright-moderation test cannot itself infringe.
- **Compatibility**: Modern evergreen browsers (Chrome, Edge, Safari, Firefox latest) — Candidates take test on modern desktops; no IE support.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Generic "Content Moderation Assessment" branding, no brand name anywhere | Explicit client rule; using brand IP would violate the rule and create legal exposure | — Pending |
| Disabled brand-name guardrails; Disney/Mickey references allowed in UI/code | Project owner accepted legal risk; assessment videos and UI theme reference Disney content | ⚠️ Revisit |
| Reuse flagmail1 stack (React 19 + Vite + GSAP + Lottie) instead of Next.js or vanilla | Manager wants scoreboard parity; reusing patterns is fastest path | — Pending |
| Video hosting via Git LFS in same repo (not external CDN, not YouTube) | Simplicity, single-repo deploy, no third-party dependency, avoids YouTube branding/ads | — Pending |
| Video-source mix: CC0 clips + AI-gen + originally recorded | Legally safe, controllable violation coverage, avoids infringement in a copyright-moderation product | — Pending |
| Timed per video (3 min max) | Simulates real BPO queue SLA; matches production moderator workflow | — Pending |
| Multi-tag L1+L2 per video, then Approve/Decline | Real content often violates multiple policies; single-tag would misrepresent moderator work | — Pending |
| Full flagmail1 scoreboard clone (accuracy + competency + Lottie + score) | Direct manager request | — Pending |
| Name + email required upfront (no anonymous) | Backend submission needs identity; recruiter dashboard requires attribution | — Pending |
| Backend submission via Formspree or Google Sheets webhook | Zero-infra, free, meets "no backend server" constraint of GitHub Pages | — Pending |
| One-attempt-only (localStorage guard + backend dedup) | Assessment integrity; retakes contaminate the hiring signal | — Pending |
| Ground-truth: I research + propose per-video answer keys with rationale | Manager expects this from me; documented keys allow client-side scoring w/o server | — Pending |
| Rubric-based partial credit (verdict 50% / L1 25% / L2 25%) | Reflects that verdict is the primary hiring signal; tagging accuracy is secondary | — Pending |
| Custom video player + chapter/timestamp markers on suspicious moments | Native `<video>` lacks scrub thumbnails; chapters mimic real mod-tool affordances | — Pending |
| Full guidelines page shown before test (not just tooltips) | Client wants candidates evaluated on trained recognition, not reading comprehension mid-test | — Pending |
| JSON-config-driven video playlist | Easy to add videos later without code changes; supports future random-N-of-M sampling | — Pending |
| New public GitHub repo (not this Disney dir) | Repo name must not include client brand; clean starting point | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-07 after initialization*
