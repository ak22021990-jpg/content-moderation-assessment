import { describe, it, expect } from 'vitest'
import { getProgressTitle, generateCompetency } from '../../src/utils/competency.js'

describe('getProgressTitle', () => {
  it('returns Foundation for score < 50', () => {
    expect(getProgressTitle(0)).toBe('Foundation')
    expect(getProgressTitle(49)).toBe('Foundation')
  })

  it('returns Proficient for 50 <= score < 80', () => {
    expect(getProgressTitle(50)).toBe('Proficient')
    expect(getProgressTitle(79)).toBe('Proficient')
  })

  it('returns Advanced for score >= 80', () => {
    expect(getProgressTitle(80)).toBe('Advanced')
    expect(getProgressTitle(100)).toBe('Advanced')
  })
})

describe('generateCompetency', () => {
  it('returns empty-state message when no categories', () => {
    const result = generateCompetency({})
    expect(result).toContain('Complete the assessment')
  })

  it('returns all-strong message when all categories >= 70%', () => {
    const result = generateCompetency({
      '1': { correct: 5, total: 5 },
      '8': { correct: 4, total: 5 },
    })
    expect(result).toContain('Exceptional performance')
    expect(result).toContain('strong content moderation instincts')
  })

  it('returns all-weak message when all categories < 50%', () => {
    const result = generateCompetency({
      '1': { correct: 1, total: 5 },
      '8': { correct: 0, total: 5 },
    })
    expect(result).toContain('starts somewhere')
    expect(result).toContain('sharpen your detection skills')
  })

  it('returns mixed strengths/weaknesses for mixed accuracy', () => {
    const result = generateCompetency({
      '1': { correct: 4, total: 5 },  // 80% → strong
      '8': { correct: 1, total: 5 },  // 20% → weak
    })
    expect(result).toContain('strong foundation in')
    expect(result).toContain('Focus on building your skills in')
  })

  it('filters out categories with total = 0', () => {
    const result = generateCompetency({
      '1': { correct: 0, total: 0 },  // never appeared → excluded
      '8': { correct: 5, total: 5 },  // 100% → strong
    })
    expect(result).toContain('strong foundation in')
    expect(result).not.toContain('Focus on') // no weak categories
  })

  it('returns single-category strong message', () => {
    const result = generateCompetency({
      '1': { correct: 5, total: 5 },
    })
    expect(result).toContain('strong foundation in')
  })

  it('uses taxonomy labels, not raw IDs', () => {
    const result = generateCompetency({
      '1': { correct: 1, total: 5 },  // weak → "Copyright & IP"
    })
    expect(result).toContain('Copyright')
  })

  it('handles exactly 50% accuracy — not weak (<50) and not strong (≥70)', () => {
    const result = generateCompetency({
      '1': { correct: 2, total: 4 },  // 50% — neither strong nor weak
    })
    // Should mention "sharpening your skills" (the neither-strong-nor-weak fallback)
    expect(result).toContain('sharpen')
  })
})
