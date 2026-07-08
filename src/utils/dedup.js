/**
 * Email normalization + SHA-256 hashing for one-attempt dedup.
 * Uses Web Crypto API (crypto.subtle.digest) — requires secure context (HTTPS or localhost).
 *
 * Normalization per ATTEMPT-04:
 *   - Trim whitespace, lowercase
 *   - Gmail-family (@gmail.com, @googlemail.com): strip dots from local part, strip +alias suffix
 *   - Non-Gmail: lowercase + trim only, dots preserved
 */

export function normalizeEmail(email) {
  let e = (email ?? '').trim().toLowerCase()
  if (!e) return ''

  // Gmail-family: strip dots from local part, strip +alias suffix
  if (e.includes('@gmail.com') || e.includes('@googlemail.com')) {
    const atIndex = e.lastIndexOf('@')
    const local = e.slice(0, atIndex)
    const domain = e.slice(atIndex + 1)
    const stripped = local.replace(/\./g, '').replace(/\+.*$/, '')
    e = `${stripped}@${domain}`
  }

  return e
}

export async function hashEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return ''

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    // crypto.subtle may be unavailable (non-HTTPS origin)
    return ''
  }
}
