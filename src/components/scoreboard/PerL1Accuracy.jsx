import taxonomy from '../../data/taxonomy.json'

const LABELS = Object.fromEntries(
  taxonomy.categories.map(c => [c.id, c.label])
)

export default function PerL1Accuracy({ perL1Accuracy }) {
  const entries = Object.entries(perL1Accuracy)
    .map(([catId, v]) => ({
      catId,
      label: LABELS[catId] || catId,
      pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      correct: v.correct,
      total: v.total,
    }))
    .sort((a, b) => b.pct - a.pct)

  if (entries.length === 0) return null

  return (
    <div className="sb-l1-accuracy">
      <h3 className="sb-section-title">Category Accuracy</h3>
      {entries.map(e => (
        <div key={e.catId} className="sb-l1-row">
          <span className="sb-l1-label">{e.label}</span>
          <div className="sb-l1-bar-track">
            <div
              className="sb-l1-bar-fill"
              style={{ width: `${e.pct}%` }}
            />
          </div>
          <span className="sb-l1-pct">{e.pct}%</span>
        </div>
      ))}
    </div>
  )
}
