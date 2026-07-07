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
