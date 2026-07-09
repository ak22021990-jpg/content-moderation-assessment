# Phase 0: Foundations — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 00-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 0-Foundations
**Areas discussed:** Repo identity, Forbidden strings (O-10), L1 taxonomy seed, Seed video (V1)

---

## Repo Identity

| Option | Description | Selected |
|--------|-------------|----------|
| ak22021990-jpg (personal) | Current git user; Pages URL under personal account | ✓ |
| A different org/account | Separate org for project isolation | |

**User's choice:** ak22021990-jpg personal account

| Option | Description | Selected |
|--------|-------------|----------|
| content-moderation-assessment | Descriptive, generic industry term | ✓ |
| video-review-test | More neutral, less descriptive | |
| hiring-assessment-tool | Very generic, maximum ambiguity | |

**User's choice:** `content-moderation-assessment`
**Notes:** URL will be `https://ak22021990-jpg.github.io/content-moderation-assessment/`

---

## Forbidden Strings (O-10)

| Option | Description | Selected |
|--------|-------------|----------|
| Disney | Primary brand name | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Marvel + character names | Spider-Man, Avengers, Iron Man, etc. | ✓ |
| Star Wars + character names | Luke Skywalker, Darth Vader, Mandalorian, etc. | ✓ |
| Pixar titles | Toy Story, Nemo, WALL-E, Coco, etc. | ✓ |
| Classic Disney titles + characters | Mickey, Minnie, Frozen, Moana, Encanto, etc. | ✓ |

**User's choice:** All 4 franchise clusters selected

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add Disney+, Hulu, ESPN+ | Streaming platforms Disney owns | ✓ |
| No — core IP only | Skip platform names | |

**User's choice:** Include streaming platform names

| Option | Description | Selected |
|--------|-------------|----------|
| Case-insensitive (-i) | Catches all casing variants | ✓ |
| Case-sensitive (exact) | Faster but riskier | |

**User's choice:** Case-insensitive
**Notes:** O-10 is now fully resolved. Full string list goes in `docs/brand-guardrails.md`.

---

## L1 Taxonomy Seed

| Option | Description | Selected |
|--------|-------------|----------|
| Use research-synthesized industry list | 10 L1 from TikTok/YouTube/Meta/GARM; client signs off at Phase 3 | ✓ |
| Client has their own taxonomy | Use client internal list verbatim | |
| Start with research list, adjust now | View and edit L1 names before locking | |

**User's choice:** Research-synthesized industry list

| Option | Description | Selected |
|--------|-------------|----------|
| Full L2 list as placeholders | All L2s committed now; client signs off wording at Phase 3 | ✓ |
| L1-only, empty L2 arrays | Cleaner commit but needs stubs everywhere | |

**User's choice:** Full L2 list as placeholders
**Notes:** CC-03 (client sign-off gate) enforced at Phase 3 entry, not Phase 0. Do not block Phase 0 on L2 wording approval.

---

## Seed Video (V1)

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder MP4 (ffmpeg-generated) | 5s color bar/black, zero licensing risk, swapped in Phase 2 | ✓ |
| Download CC0 clip from Pexels now | Commits to V1 content in Phase 0 | |

**User's choice:** ffmpeg-generated placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, ffmpeg is installed | Can use ffmpeg directly in scripts and locally | ✓ |
| No / not sure | Would need CI or WASM fallback | |

**User's choice:** ffmpeg installed locally
**Notes:** Placeholder MP4 is for CI LFS verification only. Real V1 (CC0 dancing clip + copyright overlay) lands in Phase 2.

---

## Additional: Billing Cap

| Option | Description | Selected |
|--------|-------------|----------|
| Already set to $0 | No action needed | |
| Not sure / need to check | Planner should include verification step | ✓ |

**User's choice:** Not sure — planner will include step to verify GitHub Settings → Billing → Spending limits before first LFS commit.

---

## Claude's Discretion

- Exact ffmpeg generate command for placeholder MP4
- `docs/brand-guardrails.md` format (human-readable regex table + raw grep pattern)
- `playlist.json` location (`public/` vs `src/data/`) and full stub structure
- Whether Vite scaffold is done at Phase 0 end or Phase 1 start (planner decides)

## Deferred Ideas

- Real V1 assessment clip with copyright overlay — Phase 2
- V2–V5 video sourcing (one per phase) — Phases 2–4
- Cloudflare R2 provisioning — defer until clip exceeds 50 MB
- React app scaffold with full dependency install — can be Phase 0 bonus or Phase 1 start
