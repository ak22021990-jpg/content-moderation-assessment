---
name: video-moderator
description: Helps the user analyze video files, categorize them according to the taxonomy, and write descriptions for wrong attempts.
---

# Video Moderator Skill

This skill allows the agent to assist the user with content moderation by analyzing the videos located in the `public/videos/` or `src/data/playlist.json`. 

## Capabilities

1. **Video Taxonomy Alignment**: Use the taxonomy rules in `src/data/taxonomy.json` to categorize a video into the correct taxonomy labels.
2. **Reviewing Attempts**: Check if a user's attempt or taxonomy label for a specific video is correct. If it's a wrong attempt, provide a detailed description explaining *why* it is wrong according to the taxonomy guidelines.
3. **Drafting Answer Keys**: Help author or modify the `src/data/answerKeys.json` file for the assessment videos by providing the correct subcategory IDs and explanations.

## Usage

When the user asks you to moderate a video or check a taxonomy for a video:

1. Read the `src/data/playlist.json` to get the video's details.
2. If necessary, use Python or FFmpeg (if available) to extract frames or metadata from the video file (located in `public/videos/` or wherever the `srcUrl` points to) to "watch" the video and understand its content. Since you cannot directly watch videos, you can use frame sampling or ask the user for a textual description of the video if they prefer.
3. Cross-reference the video's content with `src/data/taxonomy.json` to find the exact subcategories (e.g., `1.1`, `3.4`) that apply.
4. If asked to write a description for a "wrong attempt", clearly explain which labels were missed or incorrectly applied, citing the definition in `taxonomy.json`.
5. Propose the updated `answerKeys.json` entry using the standard format.
