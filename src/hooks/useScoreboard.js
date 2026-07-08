import { useMemo } from 'react'
import useAssessmentStore from '../stores/useAssessmentStore.js'
import { scoreAssessment, computePerL1Accuracy } from '../utils/scoring.js'
import { getProgressTitle, generateCompetency } from '../utils/competency.js'
import answerKeys from '../data/answerKeys.json'

/**
 * Orchestrates scoring computation from store answers + bundled answer keys.
 * Returns computed scoring state for ScoreboardScreen consumption.
 */
export default function useScoreboard() {
  const answers = useAssessmentStore((s) => s.answers)

  return useMemo(() => {
    const hasAnswers = answers.length > 0

    if (!hasAnswers) {
      return {
        hasAnswers: false,
        overallPct: 0,
        tier: 'Foundation',
        competencyText: 'Complete the assessment to receive your competency summary.',
        perL1Accuracy: {},
        perVideo: [],
        totalTimeMs: 0,
        perVideoTimes: [],
        answerKeyVersion: answerKeys.version,
      }
    }

    const scoring = scoreAssessment(answers, answerKeys)
    const perL1Accuracy = computePerL1Accuracy(answers, answerKeys)
    const tier = getProgressTitle(scoring.overallPct)
    const competencyText = generateCompetency(perL1Accuracy)

    const totalTimeMs = answers.reduce((sum, a) => sum + (a.timeSpentMs || 0), 0)
    const perVideoTimes = answers.map(a => ({
      videoId: a.videoId || '',
      timeSpentMs: a.timeSpentMs || 0,
      timedOut: a.timedOut || false,
    }))

    return {
      hasAnswers: true,
      overallPct: scoring.overallPct,
      tier,
      competencyText,
      perL1Accuracy,
      perVideo: scoring.perVideo,
      totalTimeMs,
      perVideoTimes,
      answerKeyVersion: scoring.answerKeyVersion,
    }
  }, [answers])
}
