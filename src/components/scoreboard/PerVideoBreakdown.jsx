export default function PerVideoBreakdown({ perVideo }) {
  if (!perVideo || perVideo.length === 0) return null

  return (
    <div className="sb-video-breakdown">
      <h2 className="sb-section-title">Per-Video Summary</h2>
      <table className="sb-video-table">
        <caption className="visually-hidden">Per-video verdict and tag match summary</caption>
        <thead>
          <tr>
            <th scope="col">Video</th>
            <th scope="col">Verdict</th>
            <th scope="col">L1 Tags Matched</th>
            <th scope="col">L2 Categories Matched</th>
          </tr>
        </thead>
        <tbody>
          {perVideo.map((v, i) => (
            <tr key={v.videoId || i}>
              <td>Video {i + 1}</td>
              <td>
                {v.error ? (
                  <span className="sb-na" aria-label="Not scored">&mdash;</span>
                ) : v.verdictCorrect ? (
                  <span className="sb-check" aria-label="Correct">&#10003;</span>
                ) : (
                  <span className="sb-cross" aria-label="Incorrect">&#10007;</span>
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
