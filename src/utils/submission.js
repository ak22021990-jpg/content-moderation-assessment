/**
 * Client-side submission pipeline per SUBMIT-01, SUBMIT-02.
 *
 * - buildSubmissionPayload: assembles payload from identity + answers + scores + competency
 * - buildHmac: HMAC-SHA256 signs the payload (excluding the hmac field) via Web Crypto
 *
 * All fields use null for missing data, never undefined (JSON.stringify drops undefined).
 */

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
