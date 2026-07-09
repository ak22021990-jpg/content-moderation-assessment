import { scoreVideo } from '../../utils/scoring.js'
import taxonomy from '../../data/taxonomy.json'
import answerKeys from '../../data/answerKeys.json'

const categoryById = new Map(taxonomy.categories.map((c) => [c.id, c]))
const subcategoryById = new Map(
  taxonomy.categories.flatMap((c) => c.subcategories.map((s) => [s.id, s]))
)

export function getAnswerKey(videoId) {
  return answerKeys.videos.find((v) => v.id === videoId) || null
}

export function getMatchedCategoryLabels(l1Tags = []) {
  return l1Tags
    .map((id) => categoryById.get(id)?.label)
    .filter(Boolean)
}

export function getMatchedSubcategoryLabels(l2Tags = []) {
  return l2Tags
    .map((id) => subcategoryById.get(id))
    .filter(Boolean)
    .map((s) => s.label)
}

export function computeFeedback(videoId, selectedL1, selectedL2, verdict) {
  const key = getAnswerKey(videoId)
  if (!key) {
    return {
      isCorrect: false,
      verdict,
      matchedCategories: [],
      matchedSubcategories: [],
      breakdown: { verdict: 0, l1: 0, l2: 0, total: 0 },
    }
  }

  const score = scoreVideo(
    { selectedL1, selectedL2, verdict },
    key
  )

  return {
    isCorrect: score.verdictCorrect,
    verdict,
    matchedCategories: getMatchedCategoryLabels(key.l1Tags),
    matchedSubcategories: getMatchedSubcategoryLabels(key.l2Tags),
    breakdown: {
      verdict: score.verdictScore,
      l1: score.l1Score,
      l2: score.l2Score,
      total: score.total,
    },
  }
}
