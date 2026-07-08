import { describe, it, expect } from 'vitest'
// scoring.js doesn't exist yet — import will fail until Task 02 creates it
import { scoreVideo, scoreAssessment, computePerL1Accuracy } from '../../src/utils/scoring.js'

// ── Helper factories ──
function mkAnswer(overrides = {}) {
  return {
    videoId: 'v01',
    selectedL1: [],
    selectedL2: [],
    verdict: null,
    timedOut: false,
    timeSpentMs: 0,
    submittedAt: new Date().toISOString(),
    ...overrides,
  }
}

function mkKey(overrides = {}) {
  return {
    id: 'v01',
    verdict: 'APPROVE',
    l1Tags: [],
    l2Tags: [],
    ...overrides,
  }
}

// ── scoreVideo tests ──
describe('scoreVideo', () => {
  describe('verdict scoring (50 pts)', () => {
    it('awards 50 pts when verdict matches (APPROVE)', () => {
      const answer = mkAnswer({ verdict: 'APPROVE' })
      const key = mkKey({ verdict: 'APPROVE' })
      expect(scoreVideo(answer, key).verdictScore).toBe(50)
    })

    it('awards 50 pts when verdict matches (DECLINE)', () => {
      const answer = mkAnswer({ verdict: 'DECLINE' })
      const key = mkKey({ verdict: 'DECLINE' })
      expect(scoreVideo(answer, key).verdictScore).toBe(50)
    })

    it('awards 0 pts when verdict mismatches', () => {
      const answer = mkAnswer({ verdict: 'APPROVE' })
      const key = mkKey({ verdict: 'DECLINE' })
      expect(scoreVideo(answer, key).verdictScore).toBe(0)
    })

    it('case-insensitive verdict comparison', () => {
      const answer = mkAnswer({ verdict: 'approve' })
      const key = mkKey({ verdict: 'APPROVE' })
      expect(scoreVideo(answer, key).verdictCorrect).toBe(true)
    })

    it('null verdict treated as mismatch', () => {
      const answer = mkAnswer({ verdict: null })
      const key = mkKey({ verdict: 'APPROVE' })
      expect(scoreVideo(answer, key).verdictCorrect).toBe(false)
    })

    it('undefined verdict treated as mismatch', () => {
      const answer = mkAnswer({ verdict: undefined })
      const key = mkKey({ verdict: 'APPROVE' })
      expect(scoreVideo(answer, key).verdictCorrect).toBe(false)
    })

    it('verdictCorrect flag is true on match', () => {
      const r = scoreVideo(mkAnswer({ verdict: 'DECLINE' }), mkKey({ verdict: 'DECLINE' }))
      expect(r.verdictCorrect).toBe(true)
    })
  })

  describe('L1 partial credit (25 pts)', () => {
    it('awards full 25 pts when user tags all key L1s exactly', () => {
      const answer = mkAnswer({ selectedL1: ['1', '8'] })
      const key = mkKey({ l1Tags: ['1', '8'] })
      expect(scoreVideo(answer, key).l1Score).toBe(25)
    })

    it('awards partial credit when user tags subset of key L1s', () => {
      const answer = mkAnswer({ selectedL1: ['1'] })
      const key = mkKey({ l1Tags: ['1', '8'] }) // user matched 1 of 2
      expect(scoreVideo(answer, key).l1Score).toBe(12.5)
    })

    it('awards 25 pts for superset — extra user L1s ignored', () => {
      const answer = mkAnswer({ selectedL1: ['1', '8', '3'] })
      const key = mkKey({ l1Tags: ['1', '8'] }) // all key L1s matched
      expect(scoreVideo(answer, key).l1Score).toBe(25)
    })

    it('awards 0 pts when user selects disjoint L1s', () => {
      const answer = mkAnswer({ selectedL1: ['3', '5'] })
      const key = mkKey({ l1Tags: ['1', '8'] }) // zero intersection
      expect(scoreVideo(answer, key).l1Score).toBe(0)
    })

    it('awards 0 pts when user selects zero L1s and key has L1s', () => {
      const answer = mkAnswer({ selectedL1: [] })
      const key = mkKey({ l1Tags: ['1', '8'] })
      expect(scoreVideo(answer, key).l1Score).toBe(0)
    })

    it('awards 25 pts when user selects zero L1s and key has zero L1s', () => {
      const answer = mkAnswer({ selectedL1: [] })
      const key = mkKey({ l1Tags: [] })
      expect(scoreVideo(answer, key).l1Score).toBe(25)
    })

    it('handles undefined selectedL1 as empty array', () => {
      const answer = mkAnswer({ selectedL1: undefined })
      const key = mkKey({ l1Tags: ['1'] })
      expect(scoreVideo(answer, key).l1Score).toBe(0)
    })

    it('handles null selectedL1 as empty array', () => {
      const answer = mkAnswer({ selectedL1: null })
      const key = mkKey({ l1Tags: ['1'] })
      expect(scoreVideo(answer, key).l1Score).toBe(0)
    })

    it('returns matched L1 tags in l1Matched', () => {
      const r = scoreVideo(
        mkAnswer({ selectedL1: ['1', '3', '8'] }),
        mkKey({ l1Tags: ['1', '8'] })
      )
      expect(r.l1Matched).toEqual(['1', '8'])
    })
  })

  describe('L2 any-one-match scoring (25 pts)', () => {
    it('awards full 25 pts when user matches at least one L2 per key L1', () => {
      const answer = mkAnswer({ selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'] })
      const key = mkKey({ l1Tags: ['1', '8'], l2Tags: ['1.4', '1.6', '8.3'] })
      expect(scoreVideo(answer, key).l2Score).toBe(25)
    })

    it('awards partial L2 credit — 1 of 2 L1s matched', () => {
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: ['1.4'] })
      const key = mkKey({ l1Tags: ['1', '8'], l2Tags: ['1.4', '8.3'] })
      expect(scoreVideo(answer, key).l2Score).toBe(12.5)
    })

    it('awards 0 L2 pts when user matches zero L2s', () => {
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: ['2.1'] })
      const key = mkKey({ l1Tags: ['1'], l2Tags: ['1.4', '1.6'] })
      expect(scoreVideo(answer, key).l2Score).toBe(0)
    })

    it('awards 25 pts when no L2s expected in key', () => {
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: [] })
      const key = mkKey({ l1Tags: ['1'], l2Tags: [] })
      expect(scoreVideo(answer, key).l2Score).toBe(25)
    })

    it('awards 0 L2 pts when user selects zero L1s and key has L2s', () => {
      const answer = mkAnswer({ selectedL1: [], selectedL2: [] })
      const key = mkKey({ l1Tags: ['1'], l2Tags: ['1.4'] })
      expect(scoreVideo(answer, key).l2Score).toBe(0)
    })

    it('only L2s under key L1s count — L2 for unmatched L1s not credited', () => {
      // User selects L1 "1" with L2 "1.4". Key has L1s ["1","8"] with L2s ["1.4","8.3"].
      // keyL1 "1": user has 1.4 → matched. keyL1 "8": user doesn't have 8.3 → no match.
      // l1sWithL2s = 2 (both L1s have L2s in key). l2Score = (1/2) * 25 = 12.5.
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: ['1.4'] })
      const key = mkKey({ l1Tags: ['1', '8'], l2Tags: ['1.4', '8.3'] })
      expect(scoreVideo(answer, key).l2Score).toBe(12.5)
    })

    it('handles undefined selectedL2 as empty array', () => {
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: undefined })
      const key = mkKey({ l1Tags: ['1'], l2Tags: ['1.4'] })
      expect(scoreVideo(answer, key).l2Score).toBe(0)
    })
  })

  describe('total score computation', () => {
    it('perfect score = 100', () => {
      const answer = mkAnswer({ selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'], verdict: 'DECLINE' })
      const key = mkKey({ l1Tags: ['1', '8'], l2Tags: ['1.4', '8.3'], verdict: 'DECLINE' })
      expect(scoreVideo(answer, key).total).toBe(100)
    })

    it('total = verdictScore + l1Score + l2Score', () => {
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: [], verdict: 'APPROVE' })
      const key = mkKey({ l1Tags: ['1', '8'], l2Tags: [], verdict: 'DECLINE' })
      const r = scoreVideo(answer, key)
      expect(r.total).toBe(r.verdictScore + r.l1Score + r.l2Score)
    })

    it('scores rounded to 2 decimal places', () => {
      const answer = mkAnswer({ selectedL1: ['1'], selectedL2: [], verdict: 'APPROVE' })
      const key = mkKey({ l1Tags: ['1', '8', '3'], l2Tags: [], verdict: 'APPROVE' })
      // l1Score = (1/3) * 25 = 8.333... → rounded to 8.33
      const r = scoreVideo(answer, key)
      expect(r.l1Score).toBe(8.33)
    })
  })
})

// ── scoreAssessment tests ──
describe('scoreAssessment', () => {
  const answerKeys = {
    version: '1.0.0',
    videos: [
      { id: 'v01', verdict: 'DECLINE', l1Tags: ['1', '8'], l2Tags: ['1.4', '8.3'] },
      { id: 'v02', verdict: 'APPROVE', l1Tags: ['3'], l2Tags: [] },
    ],
  }

  it('returns overallPct as mean of perVideo totals', () => {
    // Perfect v01 (100) + perfect v02 (100) = 100
    const answers = [
      mkAnswer({ videoId: 'v01', selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'], verdict: 'DECLINE' }),
      mkAnswer({ videoId: 'v02', selectedL1: ['3'], selectedL2: [], verdict: 'APPROVE' }),
    ]
    const r = scoreAssessment(answers, answerKeys)
    expect(r.overallPct).toBe(100)
  })

  it('returns perVideo array with scoreVideo results', () => {
    const answers = [
      mkAnswer({ videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE' }),
    ]
    const r = scoreAssessment(answers, answerKeys)
    expect(r.perVideo).toHaveLength(1)
    expect(r.perVideo[0].videoId).toBe('v01')
    expect(r.perVideo[0].verdictCorrect).toBe(true)
  })

  it('includes answerKeyVersion in result', () => {
    const r = scoreAssessment([], answerKeys)
    expect(r.answerKeyVersion).toBe('1.0.0')
  })

  it('handles missing answer key gracefully', () => {
    const answers = [mkAnswer({ videoId: 'v99' })]
    const r = scoreAssessment(answers, answerKeys)
    expect(r.perVideo[0].error).toBeDefined()
    expect(r.perVideo[0].total).toBe(0)
  })

  it('overallPct includes missing-key entries as 0 total', () => {
    const answers = [
      mkAnswer({ videoId: 'v01', selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'], verdict: 'DECLINE' }),
      mkAnswer({ videoId: 'v99' }), // no answer key → total 0
    ]
    const r = scoreAssessment(answers, answerKeys)
    expect(r.overallPct).toBe(50) // (100 + 0) / 2
  })

  it('returns answerKeyVersion when no answers', () => {
    const r = scoreAssessment([], answerKeys)
    expect(r.answerKeyVersion).toBe('1.0.0')
    expect(r.overallPct).toBe(0)
    expect(r.perVideo).toEqual([])
  })
})

// ── computePerL1Accuracy tests ──
describe('computePerL1Accuracy', () => {
  const answerKeys = {
    version: '1.0.0',
    videos: [
      { id: 'v01', verdict: 'DECLINE', l1Tags: ['1', '8'], l2Tags: ['1.4', '8.3'] },
      { id: 'v02', verdict: 'APPROVE', l1Tags: ['1', '3'], l2Tags: [] },
    ],
  }

  it('accumulates correct/total per L1 across videos', () => {
    const answers = [
      mkAnswer({ videoId: 'v01', selectedL1: ['1', '8'] }), // both correct
      mkAnswer({ videoId: 'v02', selectedL1: ['3'] }),       // missed '1'
    ]
    const acc = computePerL1Accuracy(answers, answerKeys)
    expect(acc['1']).toEqual({ correct: 1, total: 2 })
    expect(acc['8']).toEqual({ correct: 1, total: 1 })
    expect(acc['3']).toEqual({ correct: 1, total: 1 })
  })

  it('returns empty object for empty answers', () => {
    expect(computePerL1Accuracy([], answerKeys)).toEqual({})
  })

  it('returns empty object for empty answer keys', () => {
    const keys = { version: '1.0.0', videos: [] }
    expect(computePerL1Accuracy([mkAnswer({ videoId: 'v01' })], keys)).toEqual({})
  })

  it('skips answers with no matching answer key', () => {
    const answers = [mkAnswer({ videoId: 'v99', selectedL1: ['1'] })]
    expect(computePerL1Accuracy(answers, answerKeys)).toEqual({})
  })

  it('handles null selectedL1 gracefully', () => {
    const answers = [
      mkAnswer({ videoId: 'v01', selectedL1: null }),
    ]
    const acc = computePerL1Accuracy(answers, answerKeys)
    expect(acc['1']).toEqual({ correct: 0, total: 1 })
    expect(acc['8']).toEqual({ correct: 0, total: 1 })
  })
})
