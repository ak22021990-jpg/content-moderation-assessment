import { describe, it, expect } from 'vitest'
import { hashEmail } from '../../src/utils/dedup.js'

describe('hashEmail (Phase 1 stub)', () => {
  it('trims and lowercases', () => {
    expect(hashEmail('  Alice@Example.COM  ')).toBe('alice@example.com')
  })

  it('returns empty string for empty input', () => {
    expect(hashEmail('')).toBe('')
  })

  it('returns empty string for null without throwing', () => {
    expect(hashEmail(null)).toBe('')
  })

  it('returns empty string for undefined without throwing', () => {
    expect(hashEmail(undefined)).toBe('')
  })

  it('is idempotent', () => {
    const input = 'x@y.co'
    expect(hashEmail(hashEmail(input))).toBe(hashEmail(input))
  })
})
