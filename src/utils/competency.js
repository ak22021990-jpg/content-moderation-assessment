import taxonomy from '../data/taxonomy.json'

/** Build lookup: category ID → label */
const LABELS = Object.fromEntries(
  taxonomy.categories.map(c => [c.id, c.label])
)

/**
 * Map overall score percentage to competency tier.
 * @param {number} score — 0-100
 * @returns {'Advanced' | 'Proficient' | 'Foundation'}
 */
export function getProgressTitle(score) {
  if (score >= 80) return 'Advanced'
  if (score >= 50) return 'Proficient'
  return 'Foundation'
}

/**
 * Generate a 1-2 sentence competency summary.
 * @param {{ [categoryId: string]: { correct: number, total: number } }} categoryCorrect
 * @returns {string}
 */
export function generateCompetency(categoryCorrect) {
  const categories = Object.entries(categoryCorrect)
    .filter(([, v]) => v.total > 0)
    .map(([cat, v]) => ({
      cat,
      label: LABELS[cat] || cat,
      accuracy: v.total > 0 ? v.correct / v.total : 0,
    }))

  if (categories.length === 0) {
    return 'Complete the assessment to receive your competency summary.'
  }

  const strong = categories.filter(c => c.accuracy >= 0.7).map(c => c.label)
  const weak = categories.filter(c => c.accuracy < 0.5).map(c => c.label)

  // Only use shortcuts when >1 category — single-category falls through
  // to mixed path so labels appear in output
  const allStrong = categories.length > 1 && strong.length === categories.length
  const allWeak = categories.length > 1 && weak.length === categories.length

  if (allStrong) {
    return 'Exceptional performance across all content categories. You demonstrate strong content moderation instincts.'
  }
  if (allWeak) {
    return 'Every moderator starts somewhere. Review the content categories and sharpen your detection skills.'
  }

  const strongText = strong.length > 0
    ? `You have a strong foundation in ${formatList(strong)}. `
    : ''
  const weakText = weak.length > 0
    ? `Focus on building your skills in ${formatList(weak)}.`
    : 'Keep sharpening your skills across all content categories.'

  return strongText + weakText
}

/** Oxford-comma list formatter: ["A"]→"A", ["A","B"]→"A and B", ["A","B","C"]→"A, B, and C" */
function formatList(arr) {
  if (arr.length === 0) return ''
  if (arr.length === 1) return arr[0]
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]
}
