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

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var HMAC_SECRET = props.getProperty('HMAC_SECRET');
  var ALLOWED_ORIGIN = props.getProperty('ALLOWED_ORIGIN');
  var SHEET_ID = props.getProperty('SHEET_ID');
  var RATE_LIMIT_PER_IP = parseInt(props.getProperty('RATE_LIMIT_PER_IP') || '3', 10);
  var RATE_LIMIT_WINDOW_SEC = parseInt(props.getProperty('RATE_LIMIT_WINDOW_SEC') || '60', 10);

  // ── 1. Origin check ──────────────────────────────────────────────
  // Apps Script passes request headers inside e.postData.headers
  var origin = '';
  if (e.postData && e.postData.headers && e.postData.headers.Origin) {
    origin = e.postData.headers.Origin;
  }
  // Also check e.parameter.origin for query-string origin fallback
  if (!origin && e.parameter && e.parameter.origin) {
    origin = e.parameter.origin;
  }

  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'invalid-origin' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // ── 2. Parse JSON body ───────────────────────────────────────────
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'invalid-json' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // ── 3. Rate limit by IP ──────────────────────────────────────────
  var ip = (e.parameter && e.parameter.ip) ? e.parameter.ip : 'unknown';
  var cache = CacheService.getScriptCache();
  var rlKey = 'rl:' + ip;
  var count = parseInt(cache.get(rlKey) || '0', 10);

  if (count >= RATE_LIMIT_PER_IP) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'rate-limited' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  cache.put(rlKey, String(count + 1), RATE_LIMIT_WINDOW_SEC);

  // ── 4. Validate HMAC ─────────────────────────────────────────────
  // Pitfall 1 avoidance: recompute HMAC over raw body string with hmac
  // field removed (regex strip), NOT over JSON.stringify(parsedPayload).
  // This avoids key-order / whitespace mismatches between client V8
  // and Apps Script V8.
  var clientHmac = payload.hmac || '';
  var bodyStr = e.postData.contents;

  // Strip the ,"hmac":"<hex>" field from the raw body string.
  // The regex handles the last field case (no trailing comma) and
  // the mid-object field case.
  var bodyWithoutHmac = bodyStr.replace(/,"hmac":"[a-f0-9]*"/, '');

  var serverHmacBytes = Utilities.computeHmacSha256Signature(
    bodyWithoutHmac,
    HMAC_SECRET
  );

  // Convert signed byte array to hex string
  var serverHmacHex = '';
  for (var i = 0; i < serverHmacBytes.length; i++) {
    var byteVal = serverHmacBytes[i] & 0xFF;
    serverHmacHex += ('0' + byteVal.toString(16)).slice(-2);
  }

  if (clientHmac !== serverHmacHex) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'invalid-hmac' })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // ── 5. Dedup by SHA-256 of email ─────────────────────────────────
  // Hash the client-supplied email. The client already normalizes
  // (Gmail dots/+alias) before hashing; server hashes the raw email
  // from the payload for comparison against stored hashes.
  var emailToHash = (payload.email || '').trim().toLowerCase();
  var emailHashBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    emailToHash
  );

  var emailHashHex = '';
  for (var j = 0; j < emailHashBytes.length; j++) {
    var bv = emailHashBytes[j] & 0xFF;
    emailHashHex += ('0' + bv.toString(16)).slice(-2);
  }

  // Open the Sheet
  var sheet;
  if (SHEET_ID) {
    sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  } else {
    sheet = SpreadsheetApp.getActiveSheet();
  }

  // Scan column A for existing hash (initial MVP: full column scan)
  var existingHashes = sheet.getRange('A:A').getValues().flat().filter(Boolean);
  if (existingHashes.indexOf(emailHashHex) !== -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'duplicate' })
    ).setMimeType(ContentService.MimeType.JSON);
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
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, id: String(row) })
  ).setMimeType(ContentService.MimeType.JSON);
}
