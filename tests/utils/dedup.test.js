import { describe, it, expect } from 'vitest'
import { normalizeEmail, hashEmail } from '../../src/utils/dedup.js'

describe('normalizeEmail', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeEmail('  Alice@Example.COM  ')).toBe('alice@example.com')
  })

  it('strips dots from Gmail local part', () => {
    expect(normalizeEmail('alice.doe@gmail.com')).toBe('alicedoe@gmail.com')
  })

  it('strips +alias suffix from Gmail', () => {
    expect(normalizeEmail('alice.doe+test@gmail.com')).toBe('alicedoe@gmail.com')
  })

  it('handles Gmail with dots AND +alias combined', () => {
    expect(normalizeEmail('Alice.Doe+test@GMAIL.com')).toBe('alicedoe@gmail.com')
  })

  it('strips dots from googlemail.com addresses', () => {
    expect(normalizeEmail('alice.doe@googlemail.com')).toBe('alicedoe@googlemail.com')
  })

  it('preserves dots for non-Gmail addresses', () => {
    expect(normalizeEmail('alice.doe@outlook.com')).toBe('alice.doe@outlook.com')
  })

  it('preserves dots for non-Gmail addresses (lowercase only)', () => {
    expect(normalizeEmail('Bob.Smith@Company.COM')).toBe('bob.smith@company.com')
  })

  it('returns empty string for null input', () => {
    expect(normalizeEmail(null)).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(normalizeEmail(undefined)).toBe('')
  })

  it('returns empty string for empty string input', () => {
    expect(normalizeEmail('')).toBe('')
  })

  it('does not throw on null/undefined/empty', () => {
    expect(() => normalizeEmail(null)).not.toThrow()
    expect(() => normalizeEmail(undefined)).not.toThrow()
    expect(() => normalizeEmail('')).not.toThrow()
  })
})

describe('hashEmail', () => {
  it('returns a 64-char hex string for valid email', async () => {
    const result = await hashEmail('test@gmail.com')
    expect(result).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is async (returns Promise)', () => {
    const result = hashEmail('test@example.com')
    expect(result).toBeInstanceOf(Promise)
  })

  it('produces same hash for same input (deterministic)', async () => {
    const h1 = await hashEmail('alice@gmail.com')
    const h2 = await hashEmail('alice@gmail.com')
    expect(h1).toBe(h2)
  })

  it('produces different hashes for different inputs', async () => {
    const h1 = await hashEmail('alice@gmail.com')
    const h2 = await hashEmail('bob@gmail.com')
    expect(h1).not.toBe(h2)
  })

  it('Gmail normalization produces same hash for aliased emails', async () => {
    const h1 = await hashEmail('alice.doe+tag@gmail.com')
    const h2 = await hashEmail('alicedoe@gmail.com')
    expect(h1).toBe(h2)
  })

  it('returns empty string for null input', async () => {
    const result = await hashEmail(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined input', async () => {
    const result = await hashEmail(undefined)
    expect(result).toBe('')
  })

  it('returns empty string for empty string input', async () => {
    const result = await hashEmail('')
    expect(result).toBe('')
  })

  it('does not throw for null/undefined/empty', async () => {
    await expect(hashEmail(null)).resolves.toBeDefined()
    await expect(hashEmail(undefined)).resolves.toBeDefined()
    await expect(hashEmail('')).resolves.toBeDefined()
  })
})
