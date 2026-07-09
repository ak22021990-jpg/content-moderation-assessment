function formatDuration(ms) {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

export default function TimeStats({ totalTimeMs, perVideoTimes }) {
  const hasTiming = totalTimeMs > 0

  return (
    <div className="sb-time-stats">
      <h2 className="sb-section-title">Timing</h2>
      {hasTiming && (
        <p className="sb-total-time">
          Total time: <strong>{formatDuration(totalTimeMs)}</strong>
        </p>
      )}
      {perVideoTimes?.length > 0 && (
        <div className="sb-time-grid">
          {perVideoTimes.map((v, i) => (
            <div key={v.videoId || i} className="sb-time-item">
              <span className="sb-time-label">Video {i + 1}</span>
              <span className="sb-time-value">
                {formatDuration(v.timeSpentMs || 0)}
                {v.timedOut && <span className="sb-timeout-badge">Timed out</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      {!hasTiming && (
        <p className="sb-na">Timing data unavailable</p>
      )}
    </div>
  )
}
