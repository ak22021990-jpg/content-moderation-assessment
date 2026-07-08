import { describe, it, expect } from 'vitest'
import { validateName, validateEmail } from '../../src/utils/validators.js'

describe('validateName', () => {
  it('rejects empty string', () => {
    const result = validateName('')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Please enter your full name/i)
  })

  it('rejects whitespace-only string', () => {
    const result = validateName('   ')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Please enter/i)
  })

  it('accepts single character', () => {
    const result = validateName('A')
    expect(result.valid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('accepts 100-char name', () => {
    const result = validateName('A'.repeat(100))
    expect(result.valid).toBe(true)
  })

  it('rejects 101-char name', () => {
    const result = validateName('A'.repeat(101))
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/100 characters/i)
  })

  it('trims whitespace before length check', () => {
    const result = validateName('  Alice  ')
    expect(result.valid).toBe(true)
  })

  it('accepts unicode characters', () => {
    const result = validateName('名前')
    expect(result.valid).toBe(true)
  })

  it('handles null input without throwing', () => {
    const result = validateName(null)
    expect(result.valid).toBe(false)
  })

  it('handles undefined input without throwing', () => {
    const result = validateName(undefined)
    expect(result.valid).toBe(false)
  })
})

describe('validateEmail', () => {
  it('rejects empty string', () => {
    const result = validateEmail('')
    expect(result.valid).toBe(false)
  })

  it('rejects string without @', () => {
    const result = validateEmail('foo')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/valid email/i)
  })

  it('rejects string without domain', () => {
    const result = validateEmail('foo@')
    expect(result.valid).toBe(false)
  })

  it('rejects string without dot', () => {
    const result = validateEmail('foo@bar')
    expect(result.valid).toBe(false)
  })

  it('accepts valid email', () => {
    const result = validateEmail('foo@bar.co')
    expect(result.valid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('rejects email with whitespace', () => {
    const result = validateEmail('foo bar@baz.co')
    expect(result.valid).toBe(false)
  })

  it('accepts multi-dot domain', () => {
    const result = validateEmail('foo@bar.baz.co')
    expect(result.valid).toBe(true)
  })

  it('accepts minimally shaped email', () => {
    const result = validateEmail('a@b.c')
    expect(result.valid).toBe(true)
  })

  it('rejects email over 254 chars', () => {
    const result = validateEmail('a'.repeat(250) + '@x.io')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/too long/i)
  })

  it('trims whitespace before validation', () => {
    const result = validateEmail('  alice@example.com  ')
    expect(result.valid).toBe(true)
  })

  it('handles null input without throwing', () => {
    const result = validateEmail(null)
    expect(result.valid).toBe(false)
  })
})
