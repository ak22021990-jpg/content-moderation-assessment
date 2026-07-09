/**
 * Client-side submission pipeline per SUBMIT-01, SUBMIT-02, SUBMIT-10.
 *
 * - buildSubmissionPayload: assembles payload from identity + answers + scores + competency
 * - buildHmac: HMAC-SHA256 signs the payload (excluding the hmac field) via Web Crypto
 * - getSubmissionConfig: resolves endpoint + mode from VITE_SUBMISSION_BACKEND env var
 * - submitResults: POSTs payload with exponential backoff retry
 *
 * All fields use null for missing data, never undefined (JSON.stringify drops undefined).
 */

const BACKEND =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUBMISSION_BACKEND) ||
  'apps-script'

const FORMSPREE_FORM_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FORMSPREE_FORM_ID) || ''

/**
 * Returns submission endpoint and mode based on VITE_SUBMISSION_BACKEND env var.
 *
 * apps-script: primary path with HMAC + dedup + Sheet row (default)
 * formspree: degraded fallback — no HMAC validation, no dedup, no Google Sheet row.
 *   For temporary Apps Script quota overflow only. Disabled by default.
 */
export function getSubmissionConfig() {
  const appsScriptUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APPS_SCRIPT_URL) || ''

  if (BACKEND === 'formspree' && FORMSPREE_FORM_ID) {
    return {
      endpoint: `https://formspree.io/f/${FORMSPREE_FORM_ID}`,
      isFormspree: true,
    }
  }

  return {
    endpoint: appsScriptUrl,
    isFormspree: false,
  }
}

export function buildSubmissionPayload({
  identity,
  answers,
  scores,
  competency,
  taxonomyVersion,
  hmac,
}) {
  const totalTimeMs = (answers ?? []).reduce((sum, a) => sum + (a.timeSpentMs || 0), 0)

  const ans = (answers ?? []).map((a) => ({
    videoId: a.videoId ?? '',
    selectedL1: a.selectedL1 ?? [],
    selectedL2: a.selectedL2 ?? [],
    verdict: a.verdict ?? null,
    timeSpentMs: a.timeSpentMs ?? 0,
    timedOut: a.timedOut ?? false,
  }))

  const scoresObj = {
    overallPct: scores?.overallPct ?? null,
    perVideo: scores?.perVideo ?? [],
    perL1Accuracy: scores?.perL1Accuracy ?? {},
  }

  return {
    name: identity?.name ?? null,
    email: identity?.email ?? null,
    emailHash: '', // filled by caller after async hashEmail
    answers: ans,
    scores: scoresObj,
    competency: competency?.title ?? null,
    strengthsWeaknesses: competency?.strengthsWeaknesses ?? null,
    timeToCompleteMs: totalTimeMs,
    answerKeyVersion: scores?.answerKeyVersion ?? '',
    taxonomyVersion: taxonomyVersion ?? '',
    sessionStartedAt: identity?.startedAt ?? null,
    sessionEndedAt: new Date().toISOString(),
    userAgent:
      typeof navigator !== 'undefined' ? (navigator.userAgent ?? '') : '',
    screenResolution:
      typeof window !== 'undefined'
        ? `${window.screen.width}x${window.screen.height}`
        : '',
    hmac: hmac ?? '',
  }
}

export async function buildHmac(payload, secretHex) {
  if (!secretHex) return ''

  try {
    const hexBytes = secretHex.match(/.{1,2}/g)
    if (!hexBytes) return ''

    const secretBytes = new Uint8Array(hexBytes.map((b) => parseInt(b, 16)))

    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    // Sign payload WITHOUT the hmac field (PITFALLS.md Pitfall 1: HMAC mismatch)
    const { hmac: _hmac, ...payloadWithoutHmac } = payload
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(JSON.stringify(payloadWithoutHmac)),
    )

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    // crypto.subtle may be unavailable (non-HTTPS origin) or importKey/sign may fail
    return ''
  }
}

/**
 * Posts payload to Apps Script webhook with exponential backoff.
 *
 * Retries on 5xx and network errors only (3 attempts max).
 * 4xx errors surface immediately without retry.
 * Calls onProgress({ attempt, total, phase }) on each state change.
 *
 * Delays: 1s, 3s, 9s between retries.
 */
export async function submitResults({ payload, endpoint, onProgress, maxAttempts = 3 }) {
  const delays = [1000, 3000, 9000]

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'submitting' })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'success' })
        return { ok: true, id: data.id }
      }

      // 4xx — do not retry (client error: validation, duplicate, rate-limited)
      if (response.status >= 400 && response.status < 500) {
        const data = await response.json().catch(() => ({}))
        onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'error' })
        return { ok: false, error: data.error || `Server rejected: ${response.status}` }
      }

      // 5xx — retry if attempts remain
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delays[attempt]))
      }
    } catch (err) {
      // Network error — retry if attempts remain
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delays[attempt]))
      } else {
        onProgress?.({ attempt: attempt + 1, total: maxAttempts, phase: 'error' })
        return { ok: false, error: err.message || 'Network error' }
      }
    }
  }

  onProgress?.({ attempt: maxAttempts, total: maxAttempts, phase: 'error' })
  return { ok: false, error: 'All retry attempts exhausted' }
}
