export default function OverallScore({ overallPct, tier }) {
  const tierColors = {
    Advanced: 'var(--cma-success)',
    Proficient: 'var(--cma-warning)',
    Foundation: 'var(--cma-destructive)',
  }

  return (
    <div className="sb-overall-score">
      <span className="sb-score-value">{Math.round(overallPct)}%</span>
      <span
        className="sb-tier-badge"
        style={{ backgroundColor: tierColors[tier] || 'var(--cma-text-secondary)' }}
      >
        {tier}
      </span>
    </div>
  )
}
