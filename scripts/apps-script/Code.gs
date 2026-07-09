/**
 * Content Moderation Assessment — doPost Webhook Handler
 *
 * Receives client POST with HMAC-signed JSON payload.
 * Validates: Origin header, rate limit (CacheService), HMAC-SHA256,
 * SHA-256 email dedup (Sheet column A), then writes a row to Google Sheet.
 *
 * Deployed manually per scripts/apps-script/README.md.
 * All secrets in PropertiesService.getScriptProperties() — never hardcoded.
 *
 * Required Script Properties:
 *   HMAC_SECRET           — shared 256-bit hex key (same as VITE_HMAC_SECRET)
 *   SHEET_ID              — Google Sheet ID (from Sheet URL)
 *   ALLOWED_ORIGIN         — GitHub Pages origin (e.g. https://user.github.io)
 *   RATE_LIMIT_PER_IP      — max POSTs per IP per window (default: 3)
 *   RATE_LIMIT_WINDOW_SEC  — rate-limit window in seconds (default: 60)
 */

function jsonResponse(obj) {
  return ContentService.createTextOutput(
    JSON.stringify(obj)
  ).setMimeType(ContentService.MimeType.JSON);
}

function getRequestOrigin(e) {
  // Apps Script web apps expose headers on e.headers (lowercased keys).
  if (e.headers) {
    if (e.headers['origin']) return e.headers['origin'];
    if (e.headers['Origin']) return e.headers['Origin'];
  }
  // Legacy / fallback: postData.headers is not the canonical location,
  // but keep for backwards compatibility with older deploys.
  if (e.postData && e.postData.headers) {
    if (e.postData.headers['origin']) return e.postData.headers['origin'];
    if (e.postData.headers['Origin']) return e.postData.headers['Origin'];
  }
  // Query-string fallback (client can pass ?origin=... if needed).
  if (e.parameter && e.parameter.origin) {
    return e.parameter.origin;
  }
  return '';
}

function getClientIp(e) {
  // Apps Script does not expose client IP. Trust a client-supplied ?ip=
  // only as a hint; fall back to 'unknown' so rate limiting still has a key.
  if (e.parameter && e.parameter.ip) return e.parameter.ip;
  return 'unknown';
}

function computeHexHmac(message, secret) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var byteVal = bytes[i] & 0xFF;
    hex += ('0' + byteVal.toString(16)).slice(-2);
  }
  return hex;
}

function computeHexSha256(input) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var byteVal = bytes[i] & 0xFF;
    hex += ('0' + byteVal.toString(16)).slice(-2);
  }
  return hex;
}

function loadProps() {
  var props = PropertiesService.getScriptProperties();
  return {
    HMAC_SECRET: props.getProperty('HMAC_SECRET') || '',
    ALLOWED_ORIGIN: props.getProperty('ALLOWED_ORIGIN') || '',
    SHEET_ID: props.getProperty('SHEET_ID') || '',
    RATE_LIMIT_PER_IP: parseInt(props.getProperty('RATE_LIMIT_PER_IP') || '3', 10),
    RATE_LIMIT_WINDOW_SEC: parseInt(props.getProperty('RATE_LIMIT_WINDOW_SEC') || '60', 10),
  };
}

/**
 * Handle CORS preflight requests from browsers.
 * ContentService responses from web-app deploys get CORS headers added
 * automatically by the Apps Script runtime, but the runtime needs a
 * doOptions handler to answer the OPTIONS preflight itself.
 */
function doOptions(e) {
  return jsonResponse({ ok: true });
}

function doPost(e) {
  var cfg = loadProps();

  // ── 1. Origin check ──────────────────────────────────────────────
  var origin = getRequestOrigin(e);

  if (cfg.ALLOWED_ORIGIN && origin !== cfg.ALLOWED_ORIGIN) {
    return jsonResponse({ ok: false, error: 'invalid-origin' });
  }

  // ── 2. Parse JSON body ───────────────────────────────────────────
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'invalid-json' });
  }

  // ── 3. Rate limit ────────────────────────────────────────────────
  // IP is not available server-side; rate-limit key falls back to
  // 'unknown'. In practice the email-hash dedup below is the stronger
  // duplicate-submission defense.
  var ip = getClientIp(e);
  var cache = CacheService.getScriptCache();
  var rlKey = 'rl:' + ip;
  var count = parseInt(cache.get(rlKey) || '0', 10);

  if (count >= cfg.RATE_LIMIT_PER_IP) {
    return jsonResponse({ ok: false, error: 'rate-limited' });
  }

  cache.put(rlKey, String(count + 1), cfg.RATE_LIMIT_WINDOW_SEC);

  // ── 4. Validate HMAC ─────────────────────────────────────────────
  // Pitfall 1 avoidance: recompute HMAC over raw body string with hmac
  // field removed (regex strip), NOT over JSON.stringify(parsedPayload).
  // This avoids key-order / whitespace mismatches between client V8
  // and Apps Script V8.
  var clientHmac = payload.hmac || '';
  var bodyStr = e.postData.contents;

  // Strip the "hmac":"<hex>" field from the raw body string.
  // Handles leading comma (,"hmac":"...") and trailing comma
  // ("hmac":"...",) so the field position in the object does not matter.
  var bodyWithoutHmac = bodyStr
    .replace(/,"hmac":"[a-fA-F0-9]*"/, '')
    .replace(/"hmac":"[a-fA-F0-9]*",/, '');

  var serverHmacHex = computeHexHmac(bodyWithoutHmac, cfg.HMAC_SECRET);

  if (clientHmac !== serverHmacHex) {
    return jsonResponse({ ok: false, error: 'invalid-hmac' });
  }

  // ── 5. Dedup by SHA-256 of email ─────────────────────────────────
  var emailToHash = (payload.email || '').trim().toLowerCase();
  var emailHashHex = computeHexSha256(emailToHash);

  // Open the Sheet
  var sheet;
  if (cfg.SHEET_ID) {
    sheet = SpreadsheetApp.openById(cfg.SHEET_ID).getActiveSheet();
  } else {
    sheet = SpreadsheetApp.getActiveSheet();
  }

  // Scan column A for existing hash (initial MVP: full column scan)
  var existingHashes = sheet.getRange('A:A').getValues().flat().filter(Boolean);
  if (existingHashes.indexOf(emailHashHex) !== -1) {
    return jsonResponse({ ok: false, error: 'duplicate' });
  }

  // ── 6. Write row (formula injection defense: prefix strings with ') ──
  var row = sheet.getLastRow() + 1;

  // Column A — emailHash
  sheet.getRange(row, 1).setValue("'" + emailHashHex);

  // Column B — name
  sheet.getRange(row, 2).setValue("'" + (payload.name || ''));

  // Column C — email
  sheet.getRange(row, 3).setValue("'" + (payload.email || ''));

  // Column D — answers (JSON blob)
  sheet.getRange(row, 4).setValue(JSON.stringify(payload.answers || []));

  // Column E — scores (JSON blob)
  sheet.getRange(row, 5).setValue(JSON.stringify(payload.scores || {}));

  // Column F — competency
  sheet.getRange(row, 6).setValue(payload.competency || '');

  // Column G — sessionEndedAt
  sheet.getRange(row, 7).setValue(payload.sessionEndedAt || new Date().toISOString());

  // Column H — userAgent
  sheet.getRange(row, 8).setValue(payload.userAgent || '');

  // Column I — screenResolution
  sheet.getRange(row, 9).setValue(payload.screenResolution || '');

  // Column J — strengthsWeaknesses
  sheet.getRange(row, 10).setValue("'" + (payload.strengthsWeaknesses || ''));

  // Column K — answerKeyVersion
  sheet.getRange(row, 11).setValue(payload.answerKeyVersion || '');

  // Column L — taxonomyVersion
  sheet.getRange(row, 12).setValue(payload.taxonomyVersion || '');

  // Column M — sessionStartedAt
  sheet.getRange(row, 13).setValue(payload.sessionStartedAt || '');

  // Column N — timeToCompleteMs
  sheet.getRange(row, 14).setValue(payload.timeToCompleteMs != null ? payload.timeToCompleteMs : 0);

  // ── 7. Return success ────────────────────────────────────────────
  return jsonResponse({ ok: true, id: String(row) });
}
