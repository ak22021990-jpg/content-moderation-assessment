# Apps Script doPost Webhook — Deployment Guide

This directory contains the Google Apps Script backend for the **Content Moderation
Assessment** submission pipeline.

## Endpoint URL Format

```
https://script.google.com/macros/s/{deploymentId}/exec
```

The deployment ID is generated when you deploy the web app (Step 5 below).

> **CORS note:** The web app handles browser POSTs from your static site origin
> automatically. A `doOptions` handler is included in `Code.gs` to answer the
> preflight `OPTIONS` request. No additional CORS configuration is required.

---

## How to Deploy

### 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → New Spreadsheet
2. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Add a header row in **Row 1** with these columns (A through N):

| Col | Header              | Type   |
|-----|---------------------|--------|
| A   | Email Hash          | text   |
| B   | Name                | text   |
| C   | Email               | text   |
| D   | Answers (JSON)      | text   |
| E   | Scores (JSON)       | text   |
| F   | Competency          | text   |
| G   | Submitted At        | text   |
| H   | User Agent          | text   |
| I   | Screen Resolution   | text   |
| J   | Strengths/Weaknesses| text   |
| K   | Answer Key Version  | text   |
| L   | Taxonomy Version    | text   |
| M   | Session Started     | text   |
| N   | Time to Complete (ms)| number |

### 2. Create the Apps Script Project

1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Delete any default code in the editor
3. Copy the contents of `Code.gs` into the editor
4. Copy the contents of `appsscript.json` by clicking **Project Settings** →
   **Show "appsscript.json" manifest** checkbox → paste and save

### 3. Set Script Properties

In the Apps Script editor:

1. **File** → **Project Properties** → **Script Properties** tab
2. Add the following rows:

| Key                     | Description                     | Example Value                                  |
|-------------------------|---------------------------------|------------------------------------------------|
| `HMAC_SECRET`           | Shared 256-bit HMAC key (hex)   | `a1b2c3...` (64 hex chars)                     |
| `SHEET_ID`              | Google Sheet ID from Step 1     | `1AbCdEfGhIjKlMnOpQrStUvWxYz`                  |
| `ALLOWED_ORIGIN`        | GitHub Pages origin URL         | `https://your-username.github.io`              |
| `RATE_LIMIT_PER_IP`     | Max POSTs per IP per window     | `3`                                            |
| `RATE_LIMIT_WINDOW_SEC` | Rate-limit window in seconds    | `60`                                           |

### 4. Generate the HMAC Key

Run this command locally to generate a cryptographically random 256-bit key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`

**The same key must be set in both:**
- `VITE_HMAC_SECRET` in your `.env` file (client build-time secret)
- `HMAC_SECRET` in Apps Script Properties (Step 3)

### 5. Deploy as Web App

1. In the Apps Script editor, click **Deploy** → **New Deployment**
2. Type: **Web App**
3. Configure:
   - **Execute as:** Me (`{your-email}@gmail.com`)
   - **Who has access:** Anyone
4. Click **Deploy**
5. Authorize the app when prompted (Google OAuth consent screen)
6. Copy the **Deployment URL**:
   `https://script.google.com/macros/s/{deploymentId}/exec`

### 6. Configure the Client

In your project's `.env` file:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_HMAC_SECRET=the_same_64_char_hex_key_from_step_4
```

Then rebuild: `npm run build`

---

## Testing the Webhook

After deployment, test the endpoint with `curl`:

```bash
# Test 1: No HMAC → expect {"ok":false,"error":"invalid-hmac"}
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","hmac":"bad"}' \
  https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Test 2: Valid HMAC (compute with buildHmac first) → expect {"ok":true,"id":"2"}
# Use the client's buildHmac utility or a test script
```

---

## Security Notes

- **Never commit `HMAC_SECRET` to the repo.** The secret lives only in:
  - Apps Script Properties (`HMAC_SECRET`)
  - Your local `.env` file (`VITE_HMAC_SECRET`)
- Each deploy creates a new **Deployment ID**. Update `VITE_APPS_SCRIPT_URL` after
  each deploy.
- The `appsscript.json` specifies `access: "ANYONE_ANONYMOUS"` — the doPost
  handler performs its own HMAC + Origin authentication.
- All user-supplied strings written to the Sheet are prefixed with `'` (single
  quote) to prevent Google Sheets formula injection attacks.

## Alternative: clasp CLI (Optional)

If you install the [clasp CLI](https://github.com/google/clasp):

```bash
npm install -g @google/clasp
clasp login
clasp push
```

Clasp is **not required** for Phase 5 — manual copy-paste deploy is sufficient.

---

## Brand Safety (CC-01)

The Sheet name, Apps Script project name, and all code must use **generic naming**
only. No client brand references anywhere — not in Sheet tab names, project titles,
or Properties keys.

---

---

## Troubleshooting

### Submissions show success on the client but no rows appear in the Sheet

1. **Check `ALLOWED_ORIGIN`.** The server compares the request's `Origin`
   header to this Script Property. It must match your deployed site origin
   exactly (including `https://` and no trailing slash). If it mismatches,
   the client receives `{ "ok": false, "error": "invalid-origin" }`.
2. **Check `HMAC_SECRET` match.** The same 64-character hex key must be in
   both `VITE_HMAC_SECRET` (client `.env`) and Apps Script Properties
   (`HMAC_SECRET`). A mismatch returns `invalid-hmac`.
3. **Check the Sheet ID.** `SHEET_ID` must be the ID from the Sheet URL.
   If blank, the script writes to the spreadsheet attached to the script
   project, which may not be the Sheet you expect.
4. **Redeploy after every Code.gs edit.** Apps Script requires a new
   deployment (or "Manage deployments" → new version) for code changes to
   take effect. Copy the new Deployment URL into `VITE_APPS_SCRIPT_URL`.
5. **Browser console CORS errors.** If you see CORS errors, confirm the web
   app is deployed with **Execute as: Me** and **Who has access: Anyone**.
   The included `doOptions` handler answers the preflight request.

*Script: `scripts/apps-script/Code.gs`*
*Manifest: `scripts/apps-script/appsscript.json`*
*Last updated: 2026-07-09*
