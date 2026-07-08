import useAssessmentStore from '../../stores/useAssessmentStore.js'

export default function VerdictButtons({ onVerdict, submitting = false }) {
  const isRunning = useAssessmentStore((s) => s.isRunning)

  return (
    <div className="cma-verdict-bar">
      <button
        type="button"
        className="cma-verdict-btn cma-verdict-btn--approve"
        aria-label="Approve this video"
        disabled={!isRunning || submitting}
        onClick={() => onVerdict('APPROVE')}
      >
        Approve
      </button>
      <button
        type="button"
        className="cma-verdict-btn cma-verdict-btn--decline"
        aria-label="Decline this video"
        disabled={!isRunning || submitting}
        onClick={() => onVerdict('DECLINE')}
      >
        Decline
      </button>
    </div>
  )
}
