export default function PerVideoBreakdown({ perVideo }) {
  if (!perVideo || perVideo.length === 0) return null

  return (
    <div className="sb-video-breakdown">
      <h3 className="sb-section-title">Per-Video Summary</h3>
      <table className="sb-video-table">
        <thead>
          <tr>
            <th>Video</th>
            <th>Verdict</th>
            <th>L1 Tags Matched</th>
            <th>L2 Categories Matched</th>
          </tr>
        </thead>
        <tbody>
          {perVideo.map((v, i) => (
            <tr key={v.videoId || i}>
              <td>Video {i + 1}</td>
              <td>
                {v.error ? (
                  <span className="sb-na">&mdash;</span>
                ) : v.verdictCorrect ? (
                  <span className="sb-check">&#10003;</span>
                ) : (
                  <span className="sb-cross">&#10007;</span>
                )}
              </td>
              <td>{v.error ? '\u2014' : `${v.l1Matched?.length ?? 0} matched`}</td>
              <td>{v.error ? '\u2014' : `${v.l2MatchedL1s?.length ?? 0} matched`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
