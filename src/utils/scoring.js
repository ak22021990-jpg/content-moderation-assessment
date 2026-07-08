/**
 * Scoring engine for Content Moderation Assessment.
 * Pure functions — no React dependencies. Unit-testable with import.
 *
 * Rubric (SCORE-01..03):
 *   Verdict correct = 50 pts
 *   L1 tags = 25 pts, set-based partial credit: |user ∩ key| / |key| × 25
 *   L2 tags = 25 pts, any-one-match per L1: full L2 credit for that L1
 *   Total = verdict + L1 + L2 (max 100)
 */

/**
 * Score a single video answer against its answer key.
 * @param {Object} answer - store answer shape { videoId, selectedL1[], selectedL2[], verdict, ... }
 * @param {Object} answerKey - { id, verdict, l1Tags[], l2Tags[] }
 * @returns {{ verdictCorrect, verdictScore, l1Score, l2Score, total, l1Matched, l2MatchedL1s }}
 */
export function scoreVideo(answer, answerKey) {
  // ── Verdict: 50 pts for correct (case-insensitive) ──
  const answerVerdict = (answer.verdict || '').toUpperCase()
  const keyVerdict = (answerKey.verdict || '').toUpperCase()
  const verdictCorrect = answerVerdict === keyVerdict && answerVerdict !== ''
  const verdictScore = verdictCorrect ? 50 : 0

  // ── L1: set-based partial credit ──
  const userL1 = Array.isArray(answer.selectedL1) ? answer.selectedL1 : []
  const keyL1 = Array.isArray(answerKey.l1Tags) ? answerKey.l1Tags : []
  const userL1Set = new Set(userL1)
  const keyL1Set = new Set(keyL1)
  const l1Intersection = [...userL1Set].filter(t => keyL1Set.has(t))

  let l1Score
  if (keyL1Set.size > 0) {
    l1Score = (l1Intersection.length / keyL1Set.size) * 25
  } else {
    // No L1s in answer key: full credit if user also selected none
    l1Score = userL1Set.size === 0 ? 25 : 0
  }

  // ── L2: any-one-match per L1 ──
  const userL2 = Array.isArray(answer.selectedL2) ? answer.selectedL2 : []
  const keyL2 = Array.isArray(answerKey.l2Tags) ? answerKey.l2Tags : []
  const userL2Set = new Set(userL2)
  let l1sWithL2s = 0
  const l2MatchedL1s = []

  for (const keyL1Tag of keyL1Set) {
    const keyL2ForL1 = keyL2.filter(l2 => l2.startsWith(keyL1Tag + '.'))
    if (keyL2ForL1.length === 0) continue
    l1sWithL2s++
    const anyMatch = keyL2ForL1.some(kl2 => userL2Set.has(kl2))
    if (anyMatch) l2MatchedL1s.push(keyL1Tag)
  }

  let l2Score
  if (l1sWithL2s > 0) {
    l2Score = (l2MatchedL1s.length / l1sWithL2s) * 25
  } else {
    // No L2s expected in answer key: full credit if none provided
    l2Score = 25
  }

  return {
    verdictCorrect,
    verdictScore,
    l1Score: round2(l1Score),
    l2Score: round2(l2Score),
    total: round2(verdictScore + l1Score + l2Score),
    l1Matched: l1Intersection,
    l2MatchedL1s,
  }
}

/**
 * Score all answers against bundled answer keys.
 * @param {Object[]} answers - store answers[] array
 * @param {Object} answerKeys - { version: string, videos: answerKey[] }
 * @returns {{ perVideo: Object[], overallPct: number, answerKeyVersion: string }}
 */
export function scoreAssessment(answers, answerKeys) {
  const keyMap = new Map(answerKeys.videos.map(k => [k.id, k]))
  const perVideo = answers.map(answer => {
    const key = keyMap.get(answer.videoId)
    if (!key) {
      return {
        videoId: answer.videoId,
        verdictCorrect: false,
        verdictScore: 0,
        l1Score: 0,
        l2Score: 0,
        total: 0,
        l1Matched: [],
        l2MatchedL1s: [],
        error: 'no-answer-key',
      }
    }
    return { videoId: answer.videoId, ...scoreVideo(answer, key) }
  })

  const overallPct = perVideo.length > 0
    ? perVideo.reduce((sum, v) => sum + v.total, 0) / perVideo.length
    : 0

  return {
    perVideo,
    overallPct: round2(overallPct),
    answerKeyVersion: answerKeys.version,
  }
}

/**
 * Compute per-L1 accuracy across all videos.
 * @param {Object[]} answers - store answers[]
 * @param {Object} answerKeys - { version, videos[] }
 * @returns {{ [categoryId]: { correct: number, total: number } }}
 */
export function computePerL1Accuracy(answers, answerKeys) {
  const keyMap = new Map(answerKeys.videos.map(k => [k.id, k]))
  const acc = {}

  for (const answer of answers) {
    const key = keyMap.get(answer.videoId)
    if (!key) continue
    const userL1Set = new Set(Array.isArray(answer.selectedL1) ? answer.selectedL1 : [])
    const keyL1 = Array.isArray(key.l1Tags) ? key.l1Tags : []
    for (const keyL1Tag of keyL1) {
      if (!acc[keyL1Tag]) acc[keyL1Tag] = { correct: 0, total: 0 }
      acc[keyL1Tag].total++
      if (userL1Set.has(keyL1Tag)) acc[keyL1Tag].correct++
    }
  }

  return acc
}

/** Round to 2 decimal places */
function round2(n) {
  return Math.round(n * 100) / 100
}
