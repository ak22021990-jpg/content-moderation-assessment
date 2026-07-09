# Feature Research

**Domain:** Content-Moderation Video Hiring Assessment SPA (browser-based, single-attempt, 5-video test → scored report)
**Researched:** 2026-07-07
**Confidence:** MEDIUM–HIGH overall
- HIGH confidence on hiring-assessment UX patterns (Karat/Codility/HackerRank), on the shape of production T&S mod-queue tooling (well-established public writeups from Meta/YouTube/TikTok integrity teams, Trust & Safety Professional Association), and on the flagmail1 scoreboard pattern (read directly).
- MEDIUM confidence on the exact L2 policy wording of each platform's community guidelines — training-cutoff drift is possible; WebSearch and WebFetch were denied in this environment, so the taxonomy is synthesized from prior authoritative reading of TikTok, YouTube, Meta, Twitch, IAB/GARM public docs rather than freshly verified URLs. Client should validate against live docs before launch (flagged in gaps).

## Research Notes / Method Constraint

WebSearch and WebFetch tools were denied in this environment. The L1/L2 taxonomy is therefore synthesized from training-data knowledge of the following authoritative public documents (all publicly indexed, well-known, and stable in structure):

- TikTok Community Guidelines (public, restructured 2023 into 8 top-level areas)
- YouTube Community Guidelines & policy hub (support.google.com/youtube)
- Meta Community Standards (transparency.meta.com/policies/community-standards) — canonical 6-pillar structure
- Twitch Community Guidelines (safety.twitch.tv)
- IAB / GARM (Global Alliance for Responsible Media) Brand Safety Floor + Suitability Framework (11 sensitive categories)
- DMCA (17 U.S.C. § 512) & copyright industry norms (Content ID, Rights Manager)

Every L1 is grounded in at least one of these docs; each L2 is either a direct sub-policy or a synthesis where platforms converge. Confidence for the taxonomy structure itself is HIGH; confidence for exact policy wording per platform is MEDIUM. **Recruiter/client must sanity-check the taxonomy against currently-published guidelines before locking the answer keys** — this is documented as a required pre-launch step.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these means the product fails as a hiring test — either the candidate can't complete it, or the recruiter can't trust the signal.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Candidate identity capture (name + email) upfront, required | Recruiter needs to attribute score to a person; no anonymous submissions | LOW | Simple form; validated at boundary. Karat/Codility/HackerRank all gate on identity. |
| Guidelines page shown BEFORE first video | Candidate must be evaluated on trained recognition, not reading-comprehension-under-timer | LOW | Static content page with L1/L2 taxonomy + examples + verdict rubric. Client explicit ask. |
| Custom HTML5 video player with play/pause, seek, volume | Native `<video>` UI varies per browser and lacks affordances for scrub-review | MEDIUM | Wraps `<video>` element, exposes events. Must fire `timeupdate` for chapter highlighting. |
| Per-video countdown timer (3 min) with visible warning states | Simulates production BPO SLA; without timer this isn't a hiring test | LOW | Reuse `useTimer` hook pattern from flagmail1. Auto-submit on 0. |
| L1 multi-select + dependent L2 multi-select tagging UI | Real moderator work is multi-tag; single-select mis-models the job | MEDIUM | Dependent dropdowns/chips; L2 options must filter to selected L1s. Debounce persistence. |
| Approve / Decline verdict button per video | Primary hiring signal per rubric; without it there is no decision to grade | LOW | Two-button component; disabled until at least one L1 tagged OR explicitly acknowledged as "clean". |
| Per-video ground-truth answer key (documented, with rationale) | Client-side scoring needs the truth; recruiter needs defensibility | MEDIUM | JSON structure per video: correct verdict, correct L1 set, correct L2 set, human-readable rationale for each. |
| Scored result screen (overall % + per-category accuracy + competency title) | Direct manager ask; matches flagmail1; recruiter's whole deliverable | MEDIUM | Reuse `generateCompetency` and `getProgressTitle` logic pattern verbatim. |
| Backend submission on completion (Formspree or Google Sheets) | Recruiter must receive the result; without it the test is one-way | LOW | Single POST at end of flow; retry on failure with visible state. |
| One-attempt-only enforcement | Retakes contaminate hiring signal; industry standard for assessments | MEDIUM | localStorage flag (soft) + backend dedup on email (hard). Show "already completed" screen on re-entry. |
| Videos hosted alongside app (Git LFS) with JSON-config playlist | Client requested "on Pages including videos"; JSON config = zero-code content edits | LOW | Config drives player; each entry has {id, src, duration, poster, chapters}. |
| Chapter/timestamp markers on the seek bar highlighting suspicious moments | Real T&S mod tools (Meta's Community Review Tool, YouTube CMS, TikTok's reviewer UI) all surface pre-flagged timestamps to speed review | MEDIUM | Markers overlaid on seek bar; click seeks to timestamp. Fed by JSON config, not ML. |
| Auto-submit on timer expiry with current selections | Otherwise candidates game the timer or get penalized for click-latency | LOW | Timer at 0 → dispatch submit event with whatever is selected. |
| Progress indicator (Video 3 of 5) | Standard assessment UX; without it candidates feel lost | LOW | Simple header component. |
| Desktop-first responsive layout | Moderators work on desktops; candidates expect assessments to run on laptops | LOW | Constrained max-width; mobile-tolerable but not mobile-first per PROJECT.md. |
| Visible timer states (green > 2:00, amber 2:00–0:30, red < 0:30) | Standard hiring-test UX affordance (HackerRank, Codility) | LOW | CSS class swap based on remaining time. |
| Full guideline recall / reference during test (collapsible cheat-sheet) | Real moderators reference policy while working; not open-book memorization | LOW | Slide-out panel or modal; does not pause the timer. |

### Differentiators (Competitive Advantage / High-Signal Simulation)

Features that make this test measurably closer to real moderator work than generic assessment platforms, and closer to real T&S mod tooling than generic video quizzes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Thumbnail preview on seek-bar hover (frame previews) | Real mod tools (YouTube CMS, TikTok reviewer) show sprite-strip previews for fast triage; distinguishes this from a generic YouTube embed | HIGH | Requires ffmpeg-generated sprite sheets checked into repo alongside videos; player renders `background-position` on hover. Can defer to v1.1 if timeline pressed. |
| Suspicious-moment markers linked to *possible* violation category hints | Mimics automated pre-flagging that real reviewers see (Content ID hits, hash matches, etc.) — candidate learns to verify not merely trust | MEDIUM | Chapters carry `{time, hint: "possible IP marker"}` — deliberately not the answer, just an attention cue. Adds realism. |
| Rubric-based partial credit (verdict 50 / L1 25 / L2 25) | Reflects that verdict is the primary hiring signal; tagging accuracy is secondary but graded — richer than binary pass/fail | LOW | Pure logic; scoring function takes answer key + candidate answer, returns weighted score. |
| Lottie milestone celebrations (PERFECT_EYE, SNIPER, ON_FIRE, ZONE_CLEAR) on qualifying scores | Direct flagmail1 parity + memorable candidate experience → candidates share screenshots → BPO gets employer-brand lift | LOW | Reuse Lottie assets and trigger logic from flagmail1. |
| Per-category accuracy heatmap on scoreboard | Recruiter can see WHERE the candidate is weak (e.g., strong on Copyright, weak on Minor Safety) — more hiring signal than one overall % | LOW | Reuses `generateCompetency` output structure. |
| Time-per-video histogram in results | Rushing = false signal; over-thinking = queue-throughput risk. Speed distribution matters as much as accuracy in mod work. | LOW | Track `startTime`/`submitTime` per video; render mini-histogram. |
| Verdict streak stat ("4 correct verdicts in a row") | flagmail1 parity + gamified feedback loop | LOW | Simple counter. |
| Confidence self-rating per video (optional slider) | Elite moderators know when they're guessing; calibration is a Netflix/Meta T&S KPI. Recruiter learns whether candidate is over/under-confident | LOW | Optional 1–5 slider; feeds into a Brier-score-lite calibration metric on scoreboard. |
| Multi-tag L1 + dependent L2 (already listed as table stakes) with visible "why this L2 is under this L1" tooltips | Reduces mis-tagging from taxonomy ambiguity; teaches during test | LOW | Tooltip content from same JSON that drives L2 options. |
| Chapter-marker-only affordance for suspicious moments (not full ML pre-flag) | Deliberately incomplete: forces candidate to actually watch, not skim to markers → higher signal | LOW | Ensure at least one video has NO markers, or markers that turn out to be red herrings. |
| Recruiter-facing shareable result URL (or PDF export) | flagmail1 has this pattern; BPO recruiter forwards result to client faster | MEDIUM | Client-side render → html2canvas or jsPDF; or backend echoes a signed URL. Formspree can't do URLs; Sheets + Apps Script can. Defer to v1.1 if scope pressed. |
| Camera / tab-switch anti-cheat signals (window blur count, right-click count) | Hiring-integrity signal without being invasive; HackerRank/Karat log this | LOW | `visibilitychange` listener + counter posted with results. Non-blocking, informational only. |
| "Attention check" micro-question after long clip (e.g. "Which of these did you see?") | Detects candidates who leave the tab open — standard in academic + hiring studies | LOW | One per test, randomized position. |
| Adaptive playlist: random 5-of-N from a bank | Prevents answer leak across candidates over time; PROJECT.md flagged as future | MEDIUM | v1 = fixed 5. v1.1 = random-5-of-N via JSON config `pool: []`. |

### Anti-Features (Deliberately NOT Built)

Features that seem good but create legal, ethical, integrity, or scope risk. Documented so they don't get re-added mid-build.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Realistic depictions of the worst violations (CSAM, terrorist propaganda, gore, non-consensual sexual content)** | "Realism" arguments; some competitors show blurred real content | Legal exposure (CSAM is illegal to possess/distribute regardless of context; graphic content triggers OSHA-style duty-of-care for real mods, worse for untrained candidates); reputational risk; violates client family-friendly ethos | Use *proxy* signals: text overlays ("simulated: gunshot"), cartoon-style depictions, verbal descriptions in on-screen captions, or narrative context. Test the *recognition skill*, not the *tolerance for exposure*. |
| **Real client-brand assets (logos, characters, franchise footage)** | Realism; makes test feel "on brand" | Explicit client rule per PROJECT.md; using their IP is itself a policy violation and creates legal exposure | Visual language only (palette, type, motion feel). Generic "Content Moderation Assessment" branding. |
| **Real production creator UGC (scraped from platforms)** | Cheap way to get realistic content | Rights/privacy/DMCA/GDPR — creators didn't consent to use in hiring tests; scraping TikTok/YouTube violates their ToS | CC0 stock + AI-generated + originally recorded, all with documented licenses (see Video Sourcing Playbook). |
| **Multiple retake attempts** | "Fair chance"; reduces candidate frustration | Contaminates hiring signal — candidates memorize answer key across attempts; one-shot is industry norm (Karat, HackerRank Certified) | One attempt. Clear "you have one attempt" messaging upfront. |
| **Free-form written justification per video (v1)** | Adds richness; catches candidates who tagged correctly by luck | Requires human grading OR LLM grading — both blow the "no backend server, static Pages" constraint. Grading rubric complexity explodes. | Defer to v2 (already in PROJECT.md). v1 uses closed-choice tagging + verdict only. |
| **Full CMS admin UI for videos** | Non-technical staff can add videos | Over-engineering for 5–50 videos; JSON config edit is a 30-second task for anyone who can use GitHub web editor | JSON config in repo. Add a README section on "how to add a video". |
| **Backend auth / login** | "Real product" feel | Overkill for a hiring test; adds user-account maintenance; blocks GitHub Pages static hosting | Identity captured once at start; one-attempt guard via localStorage + backend dedup. |
| **Leaderboard across candidates** | Gamification; recruiter comparison | Would require persistent backend + candidate PII display + fairness challenges (later candidates see earlier scores) | Recruiter's own Sheet is the leaderboard; not shown to candidates. |
| **Frame-by-frame scrubbing / annotation tools** | "Real mod tools have this" | BPO-tier-1 moderators don't do frame-level review — that's IH-2 or specialist tier. Adds complexity, doesn't match role. | Chapter markers only; matches BPO-1 job. |
| **AI-generated live "coach" feedback during test** | "Modern" feel | Contaminates the signal — test measures unaided judgment, not "candidate + AI" | Feedback only on scoreboard (post-hoc). |
| **Video download button** | Candidate wants a copy | Legal exposure (CC0 is fine, but AI-gen may have platform ToS restrictions, original recordings may have PII); no legitimate use case for a candidate | Not included. Videos stream, don't download. Add `Content-Disposition: inline` and disable right-click context menu on the player (informational deterrent only, not security). |
| **Long-form videos (>2 min)** | "More content to judge" | Candidates run out of time at ~1 min/video review at typical review speed; also inflates repo size beyond LFS free tier | 60–90s per video. See Video Sourcing Playbook. |
| **i18n / multi-language UI (v1)** | Global candidate pool | Scope blowout; taxonomies are language-specific; slang moderation is a specialist skill | English-only v1. |
| **Real-time collaborative review** | "Modern feel" | Contaminates signal (candidate could copy); not part of BPO-1 workflow | Solo test. |

---

## L1 / L2 Content-Moderation Taxonomy

### Design Principles

1. **L1 = policy area** (what kind of harm); **L2 = specific violation** (what happened). Mirrors how TikTok, YouTube, and Meta structure their public policy hubs.
2. **L2s are mutually distinguishable within an L1** — a well-trained moderator should pick one L2 cleanly. Overlap between L1s is allowed (a video can be BOTH Hate AND Violence) — that's why L1 is multi-select.
3. **Every L1 is grounded in at least one platform's community guidelines OR the GARM/IAB framework OR U.S. copyright law.** Citations are consolidated at end of table.
4. **Copyright is L1-level, not squeezed under "IP" as a footnote.** For a family-friendly streaming client whose adjacency is IP-heavy fandom content, copyright violations are a first-class category, not a subset.
5. **Brand Safety is L1-level too.** Even if content is not policy-violating under community guidelines, it may be brand-unsafe for a family streamer (e.g., alcohol brand mentions on a kids-adjacent surface). GARM makes this distinction explicit.
6. **"Community Standards" is a catch-all L1** for platform-specific norms (spam, low-quality, off-topic) that don't cleanly land in the harm-based buckets.

### Taxonomy Table

| L1 (Policy Area) | L2 (Specific Violation) | Brief Definition | Primary Source |
|------------------|-------------------------|-------------------|----------------|
| **1. Copyright & IP** | 1.1 Unauthorized full-work reproduction | Full or substantial redistribution of a copyrighted work (movie clip >30s, full song, full episode) without license | DMCA §512; YouTube Content ID policy |
| | 1.2 Sync / soundtrack infringement | Copyrighted music used as bed/sync without license (very common on short-form video) | YouTube Content ID; TikTok Commercial Music Library policy |
| | 1.3 Franchise / character IP misuse | Unlicensed use of protected characters, costumes, iconography (Marvel/Disney/anime IP etc.) — including "AI-generated in the style of" that reproduces protected characters | Meta Respecting Intellectual Property; Content ID |
| | 1.4 Trademark / logo infringement | Confusing use of registered trademarks or logos (fake-branded merchandise, impersonating a brand) | Meta IP; Lanham Act norms |
| | 1.5 Counterfeit / bootleg sales | Selling or promoting counterfeit goods (fake jerseys, fake designer, unlicensed merch) | Meta Community Standards; TikTok Regulated Goods |
| | 1.6 Watermark removal / stripped credits | Reposting content with the original creator's watermark/credit removed | Platform-specific reupload policies; DMCA norms |
| | 1.7 Livestream / event piracy | Rebroadcasting live sports, concerts, or PPV events without license | DMCA; Twitch IP; industry norm |
| **2. Hate & Harassment** | 2.1 Hate speech targeting protected characteristics | Attacks on people based on race, ethnicity, national origin, religion, caste, sexual orientation, gender identity, disability, serious disease | Meta Hate Speech; YouTube Hate Speech policy; TikTok Hate Behaviors |
| | 2.2 Slurs / dehumanizing language | Use of slurs or comparisons of protected groups to sub-human entities | Meta Hate Speech Tier 1–3; TikTok policy |
| | 2.3 Targeted harassment / bullying of an individual | Directed insults, doxxing threats, coordinated pile-ons against a specific person | Meta Bullying & Harassment; YouTube Harassment; Twitch Civility |
| | 2.4 Doxxing / PII exposure | Publishing home address, phone, private ID docs, or unmasked private individual identity without consent | Meta Privacy Violations; TikTok Privacy & Security |
| | 2.5 Threats of violence | Explicit or credible threats of physical harm against a person or group | Meta Violence & Incitement; YouTube Harassment |
| | 2.6 Hateful groups / symbols / praise | Praise, support, or representation of designated hate groups; display of hateful symbols in supportive context | Meta Dangerous Orgs; YouTube Hate Speech |
| **3. Violence & Graphic Content** | 3.1 Graphic real-world violence | Real footage of assault, killings, torture, mutilation shown without policy-permitted context (news, awareness) | YouTube Violent/Graphic; Meta Violent & Graphic |
| | 3.2 Gore / injury / medical graphic imagery | Visible severe injury, exposed internal anatomy, extensive blood — outside educational/medical framing | Meta Violent & Graphic; TikTok Sensitive & Mature Themes |
| | 3.3 Animal abuse / cruelty | Deliberate harm, torture, or killing of animals for entertainment or shock | YouTube Violent/Graphic; Meta policy |
| | 3.4 Incitement to violence | Calls for others to commit violent acts (even without depicting the act) | Meta Violence & Incitement |
| | 3.5 Dangerous acts / stunts likely to cause injury | Choking games, "one-chip challenges", parkour on rooftops without safety framing — especially concerning when minors could imitate | YouTube Harmful/Dangerous; TikTok Dangerous Activities |
| | 3.6 Weapons — instructional / brandishing | Instructional 3D-printed firearms, silencer builds, brandishing to threaten | YouTube Firearms policy; Meta Restricted Goods |
| | 3.7 Terrorism / violent extremism | Content produced by, praising, or recruiting for designated terrorist organizations | Meta Dangerous Orgs; YouTube Violent Criminal Orgs |
| **4. Sexual & Nudity** | 4.1 Explicit sexual activity | Depiction of intercourse or genital sexual acts | Meta Adult Sexual Activity; YouTube Nudity/Sexual |
| | 4.2 Nudity (adult) | Fully or partially exposed genitalia, buttocks, or female nipples outside medical/educational/artistic exceptions | Meta Adult Nudity; TikTok Sexual Content |
| | 4.3 Sexually suggestive content | Sexualized posing, camera focus on intimate body parts, sexualized ASMR, absent explicit nudity | TikTok Sexual Content; YouTube Sexual Content policy |
| | 4.4 Non-consensual intimate imagery ("revenge porn") | Sharing intimate imagery of a person without their consent | Meta Sexual Exploitation of Adults; YouTube policy |
| | 4.5 Sexual solicitation / commercial sexual services | Offering/soliciting sexual services or content-for-payment | Meta Sexual Solicitation; TikTok policy |
| | 4.6 Fetish content likely to violate site policy | Content whose sole purpose is sexual gratification via fetish framing where the platform's policy prohibits it | Meta Sexual Solicitation; platform-specific |
| **5. Minor Safety** | 5.1 CSAM / suspected child sexual abuse material | Any sexualized depiction of a minor — categorical zero-tolerance, mandatory NCMEC reporting under 18 U.S.C. § 2258A | U.S. federal law; Meta Child Sexual Exploitation; every platform |
| | 5.2 Child sexualization (non-CSAM) | Sexualization of minors that doesn't meet CSAM legal threshold — captions, framing, dance choreography focus on minors | Meta Child Sexual Exploitation; TikTok Youth Safety |
| | 5.3 Grooming / predatory behavior toward minors | Adults soliciting personal contact, gifts, or relationships with minors | Meta Child Sexual Exploitation; TikTok Youth Safety |
| | 5.4 Minors in dangerous / harmful situations | Unsupervised minors in physically dangerous acts, minors depicted using regulated goods (alcohol, tobacco, firearms) | TikTok Youth Safety; YouTube Child Safety |
| | 5.5 Minors + adult themes co-appearance | Minors depicted alongside adult themes even if minor is not the subject (e.g., child in a bar-fight scene) | Meta child safety; TikTok policy |
| | 5.6 PII disclosure of a minor | Minor's full name, school, address, or unmasked face published without guardian consent | Meta Privacy; TikTok Youth Privacy; COPPA norms |
| **6. Regulated Goods & Activities** | 6.1 Firearms / weapons sales | Sales, transfer offers, or manufacturing instructions for firearms/ammunition/explosives | Meta Restricted Goods; YouTube Firearms; TikTok Regulated Goods |
| | 6.2 Illicit drugs — sale / promotion | Sale or promotional depiction of drugs illegal in the relevant jurisdiction | Meta Restricted Goods; TikTok Regulated Goods |
| | 6.3 Alcohol / tobacco / vape promotion (age-restricted) | Promotion or brand-integration for alcohol/tobacco/vapes on surfaces likely to reach minors | GARM; TikTok Alcohol/Tobacco; FTC norms |
| | 6.4 Gambling promotion (unlicensed) | Promotion of unlicensed sportsbooks, casinos, crypto gambling to unrestricted audiences | Meta Regulated Goods; TikTok policy |
| | 6.5 Prescription / pharmaceutical sales | Peer-to-peer sales of prescription drugs, opioids, controlled meds | Meta Restricted Goods; FDA norms |
| | 6.6 Human exploitation / trafficking | Content that recruits, transports, or promotes trafficking of persons | Meta Human Exploitation |
| | 6.7 Endangered wildlife / illegal animal trade | Sale or promotion of protected species | Meta Restricted Goods; CITES norms |
| **7. Misinformation & Deceptive Sync** | 7.1 Health misinformation with harm potential | False medical claims likely to cause physical harm (fake cures, anti-vaccine content contradicting public health authorities) | YouTube Medical Misinfo; Meta COVID/vaccine policy legacy |
| | 7.2 Election / civic integrity misinformation | False claims about voting procedures, candidate impersonation, voter suppression content | Meta Elections; YouTube Elections Misinfo; TikTok Integrity |
| | 7.3 Manipulated media / synthetic media undisclosed | Deepfakes, face swaps, AI-generated media of real people without disclosure, especially in political/harm contexts | Meta Manipulated Media; TikTok Synthetic Media policy; YouTube AI-content labeling |
| | 7.4 Impersonation of real people / brands | Accounts or content pretending to be a real public figure or brand without disclosure | TikTok Integrity & Authenticity; Meta Authenticity |
| | 7.5 Conspiracy content promoting real-world harm | Conspiracy narratives directly tied to real-world violence (QAnon-tier designations) | Meta Dangerous Orgs; YouTube Harmful Conspiracy |
| | 7.6 Deceptive edits / out-of-context clips | Misleadingly edited real footage that changes the meaning (dubbed audio, deceptive splices) | Meta Manipulated Media; TikTok |
| **8. Spam & Manipulation** | 8.1 Coordinated inauthentic behavior | Networks of fake accounts amplifying or attacking; sockpuppet operations | Meta Coordinated Inauthentic Behavior; TikTok Integrity |
| | 8.2 Engagement bait / click farming | "Comment YES if you love your mom" style engagement manipulation | YouTube Spam & Deceptive Practices |
| | 8.3 Scams / financial fraud | Investment scams, romance scams, crypto rug-pulls, phishing links | Meta Fraud & Deception; YouTube policy |
| | 8.4 Repetitive / low-quality reuploads | Same content posted many times; low-effort mass-produced content ("content farms") | YouTube Spam; TikTok Integrity |
| | 8.5 Off-platform link spam to malicious destinations | Videos existing solely to funnel viewers to malware/phish sites | YouTube Spam; Meta policy |
| | 8.6 Fake giveaways / lottery scams | "Comment to win an iPhone" fraudulent giveaways | Meta Fraud; consumer protection norms |
| **9. Brand Safety (GARM)** | 9.1 Adjacency to profanity / mature language | Heavy profanity on a family-tier surface | GARM Brand Safety Floor + Suitability Framework |
| | 9.2 Adjacency to violence (non-policy-violating) | Content within community guidelines but not brand-safe for a kids/family advertiser | GARM |
| | 9.3 Adjacency to adult / sexual themes (non-policy-violating) | Suggestive comedy, tasteful nudity in art context — allowed by platform but not family-brand-safe | GARM |
| | 9.4 Adjacency to sensitive social/political issues | Debate on divisive topics — content allowed but advertisers often demonetize | GARM |
| | 9.5 Adjacency to death / injury / military conflict | War footage, funerals, tragedy — often community-guidelines-compliant but brand-avoids | GARM |
| | 9.6 Adjacency to controversial IP / hate-adjacent aesthetics | Content that skirts hate policy without crossing it (e.g., ambiguous symbols in fashion) | GARM |
| **10. Community Standards (Platform-Specific)** | 10.1 Off-topic / wrong category | Content posted to a category surface it doesn't belong to (e.g., non-cooking content in a cooking hashtag) | Platform-specific; every UGC platform |
| | 10.2 Low production quality — vertical framing, unwatchable audio | Meets a family-streamer's baseline quality bar | Client-defined; typical family-streamer QA norm |
| | 10.3 Duplicate / cross-posted content | Same content already exists elsewhere on platform | Platform-specific |
| | 10.4 Metadata mismatch — title/tags don't match content | Clickbait titles that misrepresent content | YouTube Spam & Deceptive; TikTok policy |
| | 10.5 Community-tone violation (family-friendly surface) | Content technically allowed but off-tone for a family-friendly streaming brand | Client-defined |
| | 10.6 Age-gate / rating mismatch | Content that requires an age gate but was posted without one, or vice versa | Platform-specific rating systems |

### Taxonomy Citations (Public Sources)

- **TikTok Community Guidelines** — tiktok.com/community-guidelines (8 top-level pillars: Safety & Civility, Mental & Behavioral Health, Sensitive & Mature Themes, Integrity & Authenticity, Regulated Goods & Commercial Activities, Privacy & Security, Youth Safety & Well-Being, Intellectual Property)
- **YouTube Community Guidelines** — support.google.com/youtube (Spam & Deceptive Practices; Sensitive Content; Violent or Dangerous Content; Regulated Goods; Misinformation)
- **Meta Community Standards** — transparency.meta.com/policies/community-standards (six pillars: Violence & Criminal Behavior; Safety; Objectionable Content; Integrity & Authenticity; Respecting Intellectual Property; Content-Related Requests & Decisions)
- **Twitch Community Guidelines** — safety.twitch.tv (Safety, Civility & Respect, Authenticity, Sensitive Content, Regulated Goods, IP)
- **GARM (Global Alliance for Responsible Media) Brand Safety Floor & Suitability Framework** — wfanet.org/garm — 11 sensitive-content categories used across the ad industry
- **DMCA — 17 U.S.C. § 512** — for copyright takedown structure; **17 U.S.C. § 2258A** for CSAM mandatory reporting
- **COPPA** — 15 U.S.C. §§ 6501–6506 — for minor-PII framing

**Confidence:** HIGH on L1 structure, MEDIUM on exact L2 wording (platforms rename periodically). Recommend client review against currently-published guidelines within 30 days of launch as a documented gate.

---

## Video-Sourcing Playbook (5 Test Videos)

### Principles

1. **All videos must have clean licenses** — CC0/CC-BY, AI-generated with commercial rights, or originally recorded by us with releases. A copyright-moderation test cannot itself infringe (see PROJECT.md).
2. **No realistic depictions of the worst violations** (CSAM, terror content, real gore, real non-consensual imagery). Use proxy signals — overlays, captions, cartoon framing, or narrative context.
3. **Each of the 5 videos should probe a distinct L1** — with at least 2 videos having multi-L1 overlap (real content is rarely single-issue). This tests both recognition and disambiguation.
4. **One video should be a "clean" or "brand-unsafe-but-policy-compliant" edge case** — separates candidates who over-flag from those who calibrate.
5. **Video length 60–90 seconds** each — fits 3-min-review timer with headroom, keeps repo under LFS free tier (~200–300 MB total re-encoded to H.264 720p).

### Per-Video Plan

| # | Target Primary L1 | Secondary L1(s) | Correct Verdict | Sourcing Strategy | Rationale |
|---|-------------------|-----------------|-----------------|-------------------|-----------|
| **V1** | Copyright & IP (1.2 Sync infringement + 1.3 Franchise misuse) | 10.4 Metadata mismatch | **Decline** | CC0 Pexels/Pixabay short-form vertical clip (someone dancing, generic room) + overlaid burned-in "watermark" reading `© SAMPLE STUDIOS` + audio replaced with a Creative-Commons-licensed track that we then overlay a synthetic "COPYRIGHT MATCH" ribbon on (as if a Content-ID pre-flag hit). Optional: chapter marker at second 12 labeled "possible IP marker". | Copyright is the most common real BPO reject. The overlay signals are unambiguous ground truth; the underlying clip stays legal. Distinguishes "real copyright violation" from "just looks copyrighted". |
| **V2** | Violence & Graphic (3.5 Dangerous acts) | 5.4 Minors in dangerous situations, 3.3 Animal cruelty (RED HERRING — none actually) | **Decline** | AI-generated (Runway Gen-3 or Sora) short clip depicting a stylized/animated dangerous stunt (e.g., animated character doing a rooftop stunt without safety gear) with a synthesized off-screen child voice cheering (TTS). Optionally originally-recorded parkour on flat ground with an overlaid "kids don't try this" caption removed — but the animated route is safer. | Tests recognition of dangerous-acts + minor-safety intersection. AI-gen avoids the ethical problem of filming real dangerous acts and avoids using real minors. Red herring for animal cruelty tests whether candidate over-flags. |
| **V3** | Sexual & Nudity (4.3 Sexually suggestive) OR Minor Safety (5.2 Child sexualization edge case) | 9.3 Brand-safety adjacency to adult themes | **Decline** | CC0 dance/fashion clip of clearly adult performers (verifiable age via Pexels model release), re-edited with **camera-focus framing on intimate body parts** through crop overlay + suggestive title-card overlay. **DO NOT** use minors, real or AI-generated, for any suggestive framing — this is a categorical line. If the goal is to probe candidate ability to distinguish "adult suggestive" from "policy-violating", V3 should be adult-only-suggestive with a chapter marker at the peak-framing moment. | Sexual/suggestive is a high-stakes reject category and a common miscall. Using verifiably-adult CC0 talent with re-framing is legal; using AI-gen minors is not (categorical). See CSAM-legal-line note below. |
| **V4** | Hate & Harassment (2.3 Targeted harassment / 2.4 Doxxing) | 8.1 Coordinated inauthentic behavior | **Decline** | Originally-recorded screen recording of a fake social-media feed (built in HTML/CSS or Figma → recorded via OBS) showing pile-on comments on a fictional target — target's full fake name + fake address visible on-screen. All names are fictitious (use `.example.com`-style clearly-fake identifiers). | Screen-recording gives us full control of on-screen text (harassment is often text-in-video). Fictional identifiers avoid defamation risk. Doxxing signal (address on-screen) is unambiguous. |
| **V5** | Community Standards / Brand Safety edge case — deliberately AMBIGUOUS | 9.4 Sensitive social/political adjacency; 10.5 Community tone | **Approve** (or Decline with a brand-safety-tag only) — see calibration note | CC0 Pexels clip of a peaceful protest / crowd / rally (generic, no identifiable people or banners with real slogans) — content is fully policy-compliant but sits in GARM's "sensitive social issue" bucket. No overlays, no fake watermarks. | The one "clean but adjacency-risky" video. Separates candidates who over-flag anything ambiguous (bad for creator relations) from candidates who tag brand-safety-adjacency correctly without rejecting outright. This is the highest-signal video for hiring. |

**Calibration note for V5:** The client should decide the "correct" answer per their tolerance:
- If the client wants **strict brand safety**: correct verdict = **Decline** with L1=9 Brand Safety, L2=9.4.
- If the client wants **community-guideline-only enforcement**: correct verdict = **Approve** with optional L1=9 tag as a soft-flag.
Documented as a client decision in the answer-key JSON — do not lock either interpretation without confirmation.

### Overlay / Cue Techniques (How to Signal Violations Legally)

To simulate a violation on a CC0 clean clip without actually creating harmful content:

1. **Burned-in fake copyright watermarks** — `© SAMPLE STUDIOS — ALL RIGHTS RESERVED` corner text, or a fake broadcaster bug. Use a made-up entity name (`Sample`, `Placeholder`, `Kappa`) to avoid trademark issues.
2. **Fake "Content ID matched" ribbon** — top-of-frame banner reading `⚠ COPYRIGHT MATCH — Sample Studios OST` at the moment music starts. Tools: ffmpeg `drawtext` filter, or After Effects.
3. **On-screen captions describing (not depicting) an off-camera violation** — e.g., "[SOUND OF THREATS OFF CAMERA]" — tests recognition of the violation category without depicting the harm.
4. **Overlay "posted-by" metadata card** — e.g., a fake TikTok-style upload card showing `@user_1234 · 14 y/o` to inject a minor-safety context without using real minors.
5. **Voice-over TTS narration** — for harassment/threats, use a TTS engine to synthesize threatening text with clear watermark ("simulated audio for training") — verify TTS provider ToS permits training/assessment use.
6. **Screen-recording of fake UI** — for text-heavy violations (doxxing, harassment comments, misinformation captions), build fake platform UI in HTML/CSS, record with OBS. Zero real-content risk.
7. **AI-generated animated depictions** — for anything requiring "in-scene" violation context, prefer stylized/animated AI-gen over photorealistic (both easier to license and less traumatizing for candidates). Runway Gen-3 and Sora both allow commercial use of generated content under their current ToS (verify per generation).

### Legal / Ethical Lines (Categorical)

- **CSAM**: never generate, never overlay, never suggest — including AI-generated. U.S. federal law criminalizes AI-generated CSAM. If a video needs to probe Minor Safety, use context signals only (a fake platform card showing "age: 14", cartoonish characters with adult narration) — never depict a minor in a sexualized frame, real or synthetic.
- **Real people impersonation**: no deepfakes of real public figures for the misinformation/deepfake video — use obviously-synthetic AI-gen faces.
- **Real trademarks / logos**: never use real brand logos even as "violation cue" — use fabricated brands (Sample Studios, Placeholder Corp).
- **Real identifiable people**: CC0 clips from Pexels/Pixabay come with model releases; verify per clip. Do not use random screengrabs.

### Ground-Truth Answer Key Structure (per video)

```json
{
  "videoId": "V1",
  "correctVerdict": "decline",
  "correctL1": ["1"],
  "correctL2": ["1.2", "1.3"],
  "acceptableAlternateL1": ["10"],
  "rationale": {
    "verdict": "Watermark and copyright-match overlay indicate unauthorized reproduction of a third-party work; audio track matches Content ID against Sample Studios OST.",
    "l1": "Copyright & IP is the primary violation (multiple signals in-frame).",
    "l2": "1.2 sync infringement (music) + 1.3 franchise character overlay."
  },
  "chapterMarkers": [
    { "time": 12.0, "hint": "possible IP marker", "isTrueSignal": true },
    { "time": 34.0, "hint": "possible IP marker", "isTrueSignal": true }
  ],
  "sourceLicense": "Pexels CC0 clip #XXXXX + overlay by [our team]",
  "clientReviewStatus": "pending"
}
```

Every video ships with this JSON block. Recruiter/client validates every `rationale.verdict` before test goes live.

---

## Feature Dependencies

```
[Video Player component]
    └──requires──> [JSON video config schema locked]
    └──requires──> [Chapter/marker data model]
              └──requires──> [Timeline component that consumes player events]

[Per-video Timer]
    └──requires──> [Video player `play`/`pause`/`ended` events exposed]
    └──requires──> [Auto-submit dispatcher]
                       └──requires──> [Selection state (L1/L2/verdict) persistently accessible]

[L1/L2 tagging UI]
    └──requires──> [Taxonomy JSON (L1→L2 mapping) locked]
    └──requires──> [Ground-truth answer-key JSON schema locked]

[Scoreboard]
    └──requires──> [Scoring function (rubric weights)]
    └──requires──> [Per-category accuracy computation]
              └──requires──> [Ground-truth answer keys per video]
    └──requires──> [Lottie milestone trigger logic]
              └──requires──> [Overall score computed]

[Backend submission]
    └──requires──> [Complete result object serialized]
    └──requires──> [Formspree or Sheets endpoint configured]

[One-attempt guard]
    └──requires──> [localStorage flag on completion]
    └──requires──> [Backend dedup on email (Sheet Apps Script or Formspree filter)]

[Recruiter shareable URL / PDF export]
    ──enhances──> [Scoreboard]
    ── depends on──> [Backend that can echo a signed URL] — Sheets/Apps Script only

[Anti-cheat signals]
    ──enhances──> [Backend submission]
    ── conflicts with──> [i18n multi-tab documentation viewer] — window blur count would be polluted

[Multi-select L1 + dependent L2]
    ── conflicts with──> [Single-select radio UX] — chose multi per PROJECT.md decision
```

### Dependency Notes

- **Taxonomy JSON must be locked before ANY UI can be built** — L1/L2 codes, human-readable labels, and L1→L2 dependency map. It also drives the guidelines page. Client sign-off on taxonomy is a hard gate.
- **Ground-truth answer key JSON must be locked before scoring function can be tested end-to-end.**
- **Chapter markers depend on final video files** — can't author markers against a placeholder. Video sourcing must ship before chapter authoring.
- **Backend submission must be provisioned before end-to-end test** — Formspree free tier limits (50 submissions/month) may bite; Sheets webhook (Apps Script) has better ceiling.
- **Lottie milestone triggers depend on the score bands defined** — reuse flagmail1's bands verbatim to avoid re-tuning.

---

## MVP Definition

### Launch With (v1) — Vertical Slice

Everything below is required for a defensible hiring signal. Ruthless cut.

- [ ] Landing page with candidate name + email (required, validated)
- [ ] Guidelines page with full L1/L2 taxonomy + verdict rubric + "you have one attempt" notice
- [ ] 5-video test flow (JSON-config-driven)
- [ ] Custom HTML5 video player with seek bar + volume + play/pause
- [ ] Chapter/timestamp markers on seek bar (from JSON, not ML)
- [ ] Per-video 3-min countdown with green/amber/red states + auto-submit on 0
- [ ] Multi-select L1 tagging + dependent L2 tagging UI
- [ ] Approve/Decline verdict button (disabled until at least one interaction)
- [ ] Rubric-based scoring (verdict 50 / L1 25 / L2 25) with partial credit
- [ ] Per-video ground-truth answer keys in JSON with rationale
- [ ] Scoreboard: overall %, per-category accuracy, competency title, time-to-complete
- [ ] Lottie milestone celebrations (reuse flagmail1 triggers)
- [ ] Backend submission on completion (Formspree v1; Sheets webhook if scope allows)
- [ ] One-attempt guard (localStorage + backend dedup)
- [ ] Progress indicator (Video X of 5)
- [ ] Generic branding — no client brand name, logo, or franchise references anywhere

### Add After Validation (v1.1)

- [ ] Thumbnail preview on seek-bar hover (sprite-sheet generated by ffmpeg)
- [ ] Verdict streak stat + time-per-video histogram on scoreboard
- [ ] Confidence self-rating slider per video (calibration metric on scoreboard)
- [ ] Recruiter-facing shareable URL / PDF export
- [ ] Anti-cheat signals (tab-blur count, right-click count) in submission payload
- [ ] Attention-check micro-question after one video
- [ ] Random-5-of-N playlist sampling from a larger bank (via JSON `pool`)

### Future Consideration (v2+)

- [ ] Optional free-form reasoning notes per video (requires human or LLM grading — deferred)
- [ ] Additional video banks per role level (BPO-1 vs specialist)
- [ ] i18n (English + at least one localization)
- [ ] Multi-language taxonomy (slang moderation)
- [ ] Frame-by-frame scrubbing (out of BPO-1 workflow scope)
- [ ] Mobile-first responsive redesign
- [ ] CMS admin UI (only if video count exceeds ~50)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 5-video flow + custom player + timer | HIGH | MEDIUM | P1 |
| L1/L2 tagging + verdict + rubric scoring | HIGH | MEDIUM | P1 |
| Ground-truth JSON answer keys | HIGH | MEDIUM (research-heavy) | P1 |
| Scoreboard (per-category + competency + Lottie) | HIGH | MEDIUM (reuse flagmail1) | P1 |
| Backend submission (Formspree) | HIGH | LOW | P1 |
| One-attempt guard | HIGH | LOW | P1 |
| Chapter markers on seek bar | HIGH | LOW | P1 |
| Guidelines page (taxonomy + rubric) | HIGH | LOW | P1 |
| Generic branding (no client IP) | HIGH | LOW (discipline) | P1 |
| Thumbnail preview on hover (sprite sheet) | MEDIUM | HIGH | P2 |
| Recruiter shareable URL / PDF | MEDIUM | MEDIUM | P2 |
| Anti-cheat signals | MEDIUM | LOW | P2 |
| Confidence self-rating slider | MEDIUM | LOW | P2 |
| Random-5-of-N playlist | MEDIUM | LOW | P2 |
| Free-form reasoning notes | HIGH | HIGH (grading) | P3 |
| Frame-by-frame scrubbing | LOW | HIGH | P3 (drop) |
| Mobile-first redesign | LOW | HIGH | P3 |
| i18n | LOW | HIGH | P3 |
| CMS admin UI | LOW | HIGH | P3 (drop unless N > 50) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration (or drop)

---

## Competitor / Adjacent-Product Feature Analysis

| Feature | Karat / Codility / HackerRank (hiring tests) | Real T&S mod queue (Meta / YouTube / TikTok reviewer tools) | Our Approach |
|---------|--------------------------------|-----------------|------|
| Identity capture | Required upfront (SSO or form) | N/A (mods authenticated to workforce) | Name + email form upfront (no SSO — free-tier constraint) |
| Timer per task | Yes (HackerRank per problem, Codility per task) | Yes (SLA seconds/item) | Yes, 3-min per video with visible bands |
| One-attempt-only | Yes (Karat, HackerRank Certified) | N/A | Yes — localStorage + backend dedup |
| Tagging taxonomy | N/A | Yes — L1/L2 policy tree | Yes — synthesized L1/L2 taxonomy |
| Verdict / decision | Pass/fail submission | Approve/Remove/Escalate/Age-restrict | Approve/Decline (BPO-1 scope) |
| Chapter markers | N/A | Yes — pre-flagged timestamps | Yes — from JSON, not ML |
| Thumbnail sprite preview | N/A | Yes (YouTube CMS, TikTok reviewer) | v1.1 |
| Anti-cheat (tab blur, screen record) | Yes (HackerRank Proctoring) | N/A | v1.1, informational only |
| Score breakdown by category | Yes | N/A (mods graded via QA sampling) | Yes — per-L1 accuracy |
| Competency title / band | Yes (Karat "Recommend/Do not recommend") | N/A | Yes — flagmail1 pattern |
| Confidence self-rating | Rare (some Karat variants) | Yes — some workflows | v1.1 optional |
| Reasoning notes | Yes (Karat, HackerRank) | Yes — always | v2 (deferred) |
| Recruiter dashboard / share | Yes (all) | N/A | v1.1 |
| Retakes | No | N/A | No |
| Reference/cheat-sheet during test | Sometimes (open-book) | Always (policy DB) | Yes — collapsible in-panel guidelines |
| Video content | Typically none (coding only) | Yes — user-uploaded UGC | Yes — 5 curated, licensed |

---

## Open Questions / Gaps

Flagged for downstream requirement definition and client validation:

1. **Client taxonomy sign-off** — the synthesized L1/L2 must be validated against currently-published TikTok/YouTube/Meta policies at time of launch (they update quarterly). Recommend a documented review gate.
2. **V5 answer-key ambiguity** — "brand-safe strict" vs "community-guideline strict" verdict interpretation must be a client decision.
3. **Formspree vs Sheets webhook** — Formspree is simpler but has 50-submission/month free-tier cap and can't echo a signed URL for shareable results. Sheets + Apps Script is more capable, more setup. Client should confirm expected candidate volume before deciding.
4. **Video overlay authoring tool** — ffmpeg vs After Effects vs Descript. Recommend ffmpeg for repeatability (scriptable overlays) but this is a build-time-only decision.
5. **AI-gen video provider ToS** — Runway Gen-3, Sora, Veo commercial-use terms differ. Whichever is picked, verify per-generation ToS supports use in a paid hiring product. Document in-repo.
6. **Video length calibration** — 60–90s per video is a hypothesis. Once V1 is built, pilot with 3 candidates to check timer feel; adjust if candidates consistently run out or finish >60s early.

---

## Sources

- **TikTok Community Guidelines** — public policy hub
- **YouTube Community Guidelines** (support.google.com/youtube/answer/9288567 and related)
- **Meta Community Standards** — transparency.meta.com/policies/community-standards
- **Twitch Community Guidelines** — safety.twitch.tv
- **GARM Brand Safety Floor & Suitability Framework** — wfanet.org/garm
- **DMCA — 17 U.S.C. § 512**; **18 U.S.C. § 2258A** (CSAM mandatory reporting)
- **COPPA** — 15 U.S.C. §§ 6501–6506
- **Hiring assessment norms** — Karat, Codility, HackerRank Certified public product pages (known patterns)
- **flagmail1 reference implementation** — read at `C:\Users\anoop\OneDrive\Desktop\apple\flagmail1\src\utils\competency.js` (scoring rubric pattern for reuse)
- **PROJECT.md** — `.planning/PROJECT.md` (constraints, decisions, out-of-scope)

**Confidence caveats:**
- L1 taxonomy structure: HIGH (stable across platforms)
- L2 exact wording per platform: MEDIUM (platforms rename periodically; recommend live-doc verification before launch)
- Hiring assessment feature patterns: HIGH (Karat/HackerRank/Codility public products)
- Real mod-queue UX affordances (chapter markers, thumbnail sprites): MEDIUM–HIGH (from published integrity-team writeups; exact UI details vary)
- Video-sourcing playbook legal claims: MEDIUM — the client's counsel should ratify overlay-on-CC0 + AI-gen approach before shooting. Categorical CSAM/deepfake/trademark lines are HIGH-confidence hard-nos.

---
*Feature research for: Content-moderation video hiring assessment SPA*
*Researched: 2026-07-07*
