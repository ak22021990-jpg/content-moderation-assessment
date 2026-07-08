const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateName(input) {
  const s = (input ?? '').trim()
  if (s.length === 0) return { valid: false, error: 'Please enter your full name.' }
  if (s.length > 100) return { valid: false, error: 'Name must be 100 characters or fewer.' }
  return { valid: true, error: null }
}

export function validateEmail(input) {
  const s = (input ?? '').trim()
  if (s.length === 0) return { valid: false, error: 'Please enter your email.' }
  if (s.length > 254) return { valid: false, error: 'Email is too long.' }
  if (!EMAIL_RE.test(s)) return { valid: false, error: 'Please enter a valid email address.' }
  return { valid: true, error: null }
}
