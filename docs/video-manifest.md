# Video Manifest

This file documents each video used in the Content Moderation Assessment.
One entry per video. Update when adding or replacing a clip.

## Template

| Field | Description |
|-------|-------------|
| id | matches playlist.json `id` field |
| filename | file path under public/videos/ |
| source_url | original source (Pexels URL, AI gen tool, etc.) |
| license | CC0, CC-BY 4.0, AI-gen (tool + ToS date), original recording |
| model_release | n/a / yes / not-required (no identifiable persons) |
| target_l1 | Primary L1 category this clip tests (from taxonomy.json) |
| target_l2 | Target L2 subcategory (may be multiple) |
| correct_verdict | Approve / Decline |
| rationale | Why this verdict + these L1/L2 tags are correct |
| encoding | Resolution, codec, bitrate, file size |
| answer_key_version | Set when answer key is finalized (Phase 4) |

## Entries

### placeholder.mp4

| Field | Value |
|-------|-------|
| id | placeholder |
| filename | public/videos/placeholder.mp4 |
| source_url | Generated locally via ffmpeg (not sourced) |
| license | N/A — synthetic, not a real asset |
| model_release | N/A — no persons depicted |
| target_l1 | N/A — LFS verification placeholder only |
| target_l2 | N/A |
| correct_verdict | N/A |
| rationale | 5-second black-frame H.264 clip generated to verify Git LFS end-to-end retrieval in CI. Not used in candidate assessment. Will be replaced by V1 real clip in Phase 2. |
| encoding | 1280×720, H.264 baseline, ~10 KB |
| answer_key_version | N/A |

## Answer Key Rationale (QUALITY-01)

Each video's ground-truth answer key is authored with explicit written rationale. This rationale is also present in `src/data/answerKeys.json` for programmatic access.

### v01 — Copyright & IP + Spam

| Field | Value |
|-------|-------|
| id | v01 |
| filename | public/videos/v01.mp4 |
| source_url | TBD — Pexels/Pixabay CC0 base + synthetic overlays |
| license | CC0 (base) + AI-gen overlays |
| model_release | not-required (no identifiable persons) |
| target_l1 | 1 (Copyright & IP), 8 (Spam & Manipulation) |
| target_l2 | 1.4 (Trademark/logo infringement), 1.6 (Watermark removal/stripped credits), 8.3 (Scams/financial fraud) |
| correct_verdict | DECLINE |
| rationale | Visible trademark/logo placed next to an unrelated product implying false endorsement (1.4). A stock-photo watermark has been cropped out (1.6) — Copyright & IP violation. The video also describes a fraudulent investment scheme promising guaranteed returns (8.3) — financial scam. |
| encoding | H.264 720p, CRF 26, ≤ 20 MB |
| answer_key_version | 1.0.0-draft |

**Confidence:** HIGH — clear violations with visible evidence.

### v02 — Benign (No Violation)

| Field | Value |
|-------|-------|
| id | v02 |
| filename | public/videos/v02.mp4 |
| source_url | TBD — Pexels/Pixabay CC0 |
| license | CC0 |
| model_release | not-required (no identifiable persons) |
| target_l1 | None |
| target_l2 | None |
| correct_verdict | APPROVE |
| rationale | Generic lifestyle montage with no policy-violating elements. No hate speech, no copyright infringement, no regulated goods, no explicit content, no misinformation. Clean content suitable for all audiences. |
| encoding | H.264 720p, CRF 26, ≤ 20 MB |
| answer_key_version | 1.0.0-draft |

**Confidence:** HIGH — straightforward benign content.

### v03 — Hate & Harassment + Violence

| Field | Value |
|-------|-------|
| id | v03 |
| filename | public/videos/v03.mp4 |
| source_url | TBD — AI-generated (Runway/Veo/Sora) + synthetic text overlays |
| license | AI-gen (provider ToS verified) |
| model_release | N/A — AI-generated, no real persons |
| target_l1 | 2 (Hate & Harassment), 3 (Violence & Graphic Content) |
| target_l2 | 2.2 (Slurs/dehumanizing language), 3.4 (Incitement to violence) |
| correct_verdict | DECLINE |
| rationale | Contains recognized racial slurs directed at a specific ethnic group (2.2). The speaker explicitly calls for violent action against that group (3.4) — incitement. Combined hate speech + violence incitement. |
| encoding | H.264 720p, CRF 26, ≤ 20 MB |
| answer_key_version | 1.0.0-draft |

**Confidence:** MEDIUM-HIGH — slurs and incitement are typically unambiguous, but edge-case rhetoric may be debated.

### v04 — Misinformation (Health)

| Field | Value |
|-------|-------|
| id | v04 |
| filename | public/videos/v04.mp4 |
| source_url | TBD — CC0 base + synthetic text/overlay |
| license | CC0 (base) + AI-gen overlays |
| model_release | not-required (no identifiable persons) |
| target_l1 | 7 (Misinformation & Deceptive Sync) |
| target_l2 | 7.1 (Health misinformation with harm potential) |
| correct_verdict | DECLINE |
| rationale | Video makes a false medical claim that a common household product cures a serious illness (7.1). The claim could lead viewers to delay or avoid proven medical treatment — clear harm potential. |
| encoding | H.264 720p, CRF 26, ≤ 20 MB |
| answer_key_version | 1.0.0-draft |

**Confidence:** MEDIUM — health misinformation requires subject-matter expertise to verify the claim's falsity. Key should be reviewed by someone with medical-domain knowledge.

### v05 — Brand Safety (GARM) — Ambiguous

| Field | Value |
|-------|-------|
| id | v05 |
| filename | public/videos/v05.mp4 |
| source_url | TBD — AI-generated (Runway/Veo/Sora) |
| license | AI-gen (provider ToS verified) |
| model_release | N/A — AI-generated, no real persons |
| target_l1 | 9 (Brand Safety — GARM) |
| target_l2 | 9.6 (Adjacency to controversial IP / hate-adjacent aesthetics) |
| correct_verdict | DECLINE (DRAFT — pending client decision O-01) |
| rationale | Deliberately ambiguous brand-adjacent case. Music video uses visual imagery stylistically similar to a recognized extremist symbol (9.6). The content itself is not policy-violating (no hate speech, no violence), but its aesthetic borrows from controversial IP. **PENDING O-01:** strict brand-safe interpretation = DECLINE; community-guideline-only interpretation = APPROVE. This key WILL change based on client decision. |
| encoding | H.264 720p, CRF 26, ≤ 20 MB |
| answer_key_version | 1.0.0-draft |

**Confidence:** LOW — deliberately ambiguous. Kappa calibration will reveal inter-rater disagreement. May be dropped from scoring if agreement is poor.

## Answer Key Version

- Current version: `1.0.0-draft`
- All keys subject to revision after kappa calibration (QUALITY-02) and client sign-off (Phase 6).
- Post-launch edits MUST bump the version in both this document AND `src/data/answerKeys.json`.

## Encoding Specification for Real Clips (V1-V5)

Target encoding for all assessment clips (CONTENT-04):

| Setting | Value |
|---------|-------|
| Resolution | 1280×720 (720p) |
| Video codec | H.264 (libx264), CRF 26, preset medium |
| Audio | AAC 96 kbps (-b:a 96k) |
| Container | MP4 with -movflags +faststart |
| Target size | ≤ 20 MB per clip |
| Duration | 60–120 seconds |

ffmpeg command template:

```
ffmpeg -i input.mp4 -c:v libx264 -crf 26 -preset medium -vf scale=1280:720 -c:a aac -b:a 96k -movflags +faststart output.mp4
```

## Cloudflare R2 Setup (Required before Phase 2)

1. Create Cloudflare account at cloudflare.com (free; no credit card required for R2 free tier)
2. Navigate to R2 → Create bucket → Name: `content-moderation-assessment`
3. Enable public access: bucket → Settings → Public Development URL (r2.dev subdomain)
4. Note the r2.dev URL: `https://pub-{hash}.r2.dev`
5. Upload `placeholder.mp4` to the bucket
6. Update `playlist.json` `r2Url` field: `https://pub-{hash}.r2.dev/placeholder.mp4`
7. For production: configure custom domain via Cloudflare DNS (Phase 6)

**DO NOT use jsDelivr for LFS-tracked video files.** jsDelivr proxies raw GitHub URLs. For LFS objects, GitHub serves the 128-byte pointer file at the raw URL — not the binary. jsDelivr therefore caches and serves the pointer, not the video. This is a confirmed open issue (github.com/jsdelivr/jsdelivr/issues/18235). See `playlist.json` `_cdnDocs.jsDelivrWarning`.
