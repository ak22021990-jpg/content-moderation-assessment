import { describe, it, expect } from 'vitest'
import { cohensKappa, fleissKappa, interpretKappa } from '../../src/utils/kappa.js'

const CATS = ['1', '2', '3']

describe('cohensKappa', () => {
  it('returns 1 for perfect agreement', () => {
    const r1 = [['1'], ['2'], ['3']]
    const r2 = [['1'], ['2'], ['3']]
    expect(cohensKappa(r1, r2, CATS)).toBeCloseTo(1, 5)
  })

  it('returns 1 for perfect agreement on all empty', () => {
    const r1 = [[], [], []]
    const r2 = [[], [], []]
    expect(cohensKappa(r1, r2, CATS)).toBeCloseTo(1, 5)
  })

  it('returns 1 for perfect multi-tag agreement', () => {
    const r1 = [['1', '2'], ['2'], ['3']]
    const r2 = [['1', '2'], ['2'], ['3']]
    expect(cohensKappa(r1, r2, CATS)).toBeCloseTo(1, 5)
  })

  it('returns negative for worse-than-chance agreement', () => {
    // 2 categories, 2 videos — raters systematically pick opposite answers
    // po = 0 (never agree), pe = 0.5 (each category 50% per rater)
    // κ = (0 − 0.5) / (1 − 0.5) = −1.0
    const r1 = [['1'], ['2']]
    const r2 = [['2'], ['1']]
    const k = cohensKappa(r1, r2, ['1', '2'])
    expect(k).toBeLessThan(0)
    expect(k).toBeCloseTo(-1, 2)
  })

  it('returns approximately 0 for random agreement', () => {
    const r1 = [['1'], ['2'], ['3']]
    const r2 = [['2'], ['3'], ['1']]
    const k = cohensKappa(r1, r2, CATS)
    // With 3 categories and 3 videos, disagreement is high
    expect(k).toBeLessThan(0.5)
  })

  it('handles empty input gracefully', () => {
    expect(cohensKappa([], [], CATS)).toBe(0)
    expect(cohensKappa([['1']], [['1']], [])).toBe(0)
  })

  it('handles null/undefined rater tags as empty', () => {
    const r1 = [['1'], null, ['2']]
    const r2 = [['1'], [], ['2']]
    const k = cohensKappa(r1, r2, CATS)
    expect(k).toBeCloseTo(1, 5) // all agree
  })

  it('handles partial overlap', () => {
    // R1: [1,2], [1], [2]
    // R2: [1],   [1], [2]
    const r1 = [['1', '2'], ['1'], ['2']]
    const r2 = [['1'], ['1'], ['2']]
    const k = cohensKappa(r1, r2, CATS)
    // Should be high but not perfect (category 2 on video 0 is the disagreement)
    expect(k).toBeGreaterThan(0.5)
    expect(k).toBeLessThan(1.0)
  })

  it('works with single category', () => {
    const r1 = [['1'], [], ['1']]
    const r2 = [['1'], ['1'], ['1']]
    const k = cohensKappa(r1, r2, ['1'])
    // po = 2/3 (video 0 agree=1, video 1 agree=0, video 2 agree=1)
    // r1 marginal 1: 2/3, r2 marginal 1: 3/3 → pe = 6/9 = 0.667
    // κ = (0.667 - 0.667) / (1 - 0.667) = 0
    expect(k).toBeCloseTo(0, 2)
  })

  it('handles identical empty tags (both have no violations)', () => {
    const r1 = [[], [], []]
    const r2 = [[], [], []]
    expect(cohensKappa(r1, r2, CATS)).toBeCloseTo(1, 5)
  })

  it('handles single video', () => {
    const r1 = [['1']]
    const r2 = [['1']]
    expect(cohensKappa(r1, r2, ['1'])).toBeCloseTo(1, 5)
  })
})

describe('fleissKappa', () => {
  it('returns 1 for perfect agreement (all raters agree)', () => {
    // 3 videos, 3 raters, 2 categories
    // All raters assign cat 0 to video 0, cat 1 to video 1, cat 1 to video 2
    const matrix = [
      [3, 0], // video 0: all 3 raters picked cat 0
      [0, 3], // video 1: all 3 raters picked cat 1
      [0, 3], // video 2: all 3 raters picked cat 1
    ]
    expect(fleissKappa(matrix, 3, ['A', 'B'])).toBeCloseTo(1, 5)
  })

  it('returns 0 for no agreement beyond chance', () => {
    // 3 videos, 3 raters, 2 categories — random-ish distribution
    const matrix = [
      [2, 1],
      [1, 2],
      [2, 1],
    ]
    const k = fleissKappa(matrix, 3, ['A', 'B'])
    expect(k).toBeLessThan(0.3)
  })

  it('handles empty input', () => {
    expect(fleissKappa([], 3, ['A'])).toBe(0)
  })

  it('returns 0 for fewer than 2 raters', () => {
    expect(fleissKappa([[1]], 1, ['A'])).toBe(0)
  })

  it('returns 0 for no categories', () => {
    expect(fleissKappa([[1]], 2, [])).toBe(0)
  })

  it('handles 3 raters 3 categories partial agreement', () => {
    const matrix = [
      [2, 1, 0],
      [1, 1, 1],
      [0, 0, 3],
    ]
    const k = fleissKappa(matrix, 3, ['A', 'B', 'C'])
    // Should be between -1 and 1
    expect(k).toBeGreaterThan(-1)
    expect(k).toBeLessThan(1)
  })
})

describe('interpretKappa', () => {
  it('interprets boundary values per Landis & Koch', () => {
    expect(interpretKappa(-0.1)).toBe('No agreement')
    expect(interpretKappa(0)).toBe('Slight')
    expect(interpretKappa(0.2)).toBe('Slight')
    expect(interpretKappa(0.21)).toBe('Fair')
    expect(interpretKappa(0.4)).toBe('Fair')
    expect(interpretKappa(0.41)).toBe('Moderate')
    expect(interpretKappa(0.6)).toBe('Moderate')
    expect(interpretKappa(0.61)).toBe('Substantial')
    expect(interpretKappa(0.8)).toBe('Substantial')
    expect(interpretKappa(0.81)).toBe('Almost perfect')
    expect(interpretKappa(1.0)).toBe('Almost perfect')
  })
})
