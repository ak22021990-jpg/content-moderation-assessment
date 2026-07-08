/**
 * Inter-rater reliability statistics for content moderation assessment.
 * Pure functions — no React dependencies. Unit-testable.
 *
 * Cohen's Kappa: pairwise agreement metric for 2 raters.
 * Fleiss' Kappa: generalization for 3+ raters.
 * Interpretation: Landis & Koch (1977) thresholds.
 */

/**
 * Compute Cohen's kappa for two raters tagging N videos with binary per-category decisions.
 *
 * Each rater's tags are represented as sets of L1 tag IDs per video.
 * Cohen's kappa treats each (video, category) as a judgment: does the rater assign this
 * category to this video? Agreement/disagreement is counted over all (video × category) pairs.
 *
 * κ = (po − pe) / (1 − pe)
 *
 * @param {string[][]} rater1Tags — rater1Tags[i] = set of L1 tag IDs for video i
 * @param {string[][]} rater2Tags — rater2Tags[i] = set of L1 tag IDs for video i
 * @param {string[]} allCategories — all possible category IDs (e.g., ['1','2',...,'10'])
 * @returns {number} κ value between -1 and 1
 */
export function cohensKappa(rater1Tags, rater2Tags, allCategories) {
  const N = rater1Tags.length
  if (N === 0 || allCategories.length === 0) return 0

  // For each (video, category) pair, check agreement and accumulate marginals
  let poSum = 0
  const r1Marginals = {}
  const r2Marginals = {}

  for (const cat of allCategories) {
    r1Marginals[cat] = 0
    r2Marginals[cat] = 0
  }

  for (let i = 0; i < N; i++) {
    const r1Set = new Set(rater1Tags[i] || [])
    const r2Set = new Set(rater2Tags[i] || [])
    for (const cat of allCategories) {
      const r1Has = r1Set.has(cat)
      const r2Has = r2Set.has(cat)
      if (r1Has === r2Has) poSum++
      if (r1Has) r1Marginals[cat]++
      if (r2Has) r2Marginals[cat]++
    }
  }

  const totalDecisions = N * allCategories.length
  const po = poSum / totalDecisions

  // pe = Σ_c (r1_proportion_c × r2_proportion_c)
  let pe = 0
  for (const cat of allCategories) {
    pe += (r1Marginals[cat] / N) * (r2Marginals[cat] / N)
  }

  if (pe === 1) return 1
  return (po - pe) / (1 - pe)
}

/**
 * Compute Fleiss' kappa for 3+ raters.
 *
 * Generalization of Cohen's kappa for multiple raters. Each rater assigns
 * exactly one category per video (or equivalently, counts are accumulated).
 *
 * κ = (P̄ − Pe) / (1 − Pe)
 *
 * @param {number[][]} raterMatrix — raterMatrix[i][j] = number of raters who assigned category j to video i
 * @param {number} nRaters — total number of raters
 * @param {string[]} allCategories — all possible category IDs
 * @returns {number} Fleiss' κ value
 */
export function fleissKappa(raterMatrix, nRaters, allCategories) {
  const N = raterMatrix.length // number of videos
  const k = allCategories.length // number of categories
  if (N === 0 || k === 0 || nRaters < 2) return 0

  // Pi = proportion of agreeing pairs for video i
  const Pi = []
  for (let i = 0; i < N; i++) {
    let sumSq = 0
    for (let j = 0; j < k; j++) {
      const nij = raterMatrix[i]?.[j] || 0
      sumSq += nij * nij
    }
    Pi.push((sumSq - nRaters) / (nRaters * (nRaters - 1)))
  }

  const Pbar = Pi.reduce((s, p) => s + p, 0) / N

  // pj = proportion of all assignments to category j
  const pj = []
  const totalAssignments = N * nRaters
  for (let j = 0; j < k; j++) {
    let sum = 0
    for (let i = 0; i < N; i++) {
      sum += raterMatrix[i]?.[j] || 0
    }
    pj.push(sum / totalAssignments)
  }

  const Pe = pj.reduce((s, p) => s + p * p, 0)

  if (Pe === 1) return 1
  return (Pbar - Pe) / (1 - Pe)
}

/**
 * Interpret kappa value per Landis & Koch (1977).
 * @param {number} kappa
 * @returns {string} interpretation label
 */
export function interpretKappa(kappa) {
  if (kappa < 0) return 'No agreement'
  if (kappa < 0.21) return 'Slight'
  if (kappa < 0.41) return 'Fair'
  if (kappa < 0.61) return 'Moderate'
  if (kappa < 0.81) return 'Substantial'
  return 'Almost perfect'
}
