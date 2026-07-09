import { useEffect, useRef } from 'react'

/**
 * Submission overlay renders over the scoreboard during submission.
 * States: idle (hidden), submitting (spinner), success (checkmark), error (retry).
 *
 * Error state with retry button is the contract for Plan 05-02 fallback.
 * In this plan (05-01), only idle/submitting/success are wired; error renders null placeholder.
 */
export default function SubmissionOverlay({ phase, attempt, totalAttempts, onRetry }) {
  const retryRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    if (phase === 'error' && retryRef.current) {
      retryRef.current.focus()
    } else if (phase !== 'idle' && cardRef.current) {
      cardRef.current.focus()
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'error' || !onRetry) return
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        onRetry()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onRetry])

  if (phase === 'idle') return null

  const titleId = 'cma-submission-title'

  return (
    <div className="cma-overlay" data-testid="submission-overlay">
      <div
        ref={cardRef}
        className="cma-overlay-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        {phase === 'submitting' && (
          <>
            <div className="cma-spinner" />
            <h2
              id={titleId}
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--cma-text-primary)',
              }}
            >
              Submitting your results
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--cma-text-secondary)',
              }}
            >
              Please wait while we send your assessment data.
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--cma-text-secondary)',
              }}
            >
              Attempt {attempt} of {totalAttempts}
            </p>
          </>
        )}

        {phase === 'success' && (
          <>
            <span
              data-testid="overlay-checkmark"
              style={{
                fontSize: '48px',
                color: 'var(--cma-success)',
                lineHeight: 1,
              }}
            >
              ✓
            </span>
            <h2
              id={titleId}
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--cma-success)',
              }}
            >
              Results sent
            </h2>
            <p
              style={{
                fontSize: '1rem',
                fontWeight: 400,
                color: 'var(--cma-text-secondary)',
              }}
            >
              Your assessment results have been sent to the hiring team.
            </p>
          </>
        )}

        {phase === 'error' && (
          <>
            <span
              style={{
                fontSize: '48px',
                color: 'var(--cma-destructive)',
                lineHeight: 1,
              }}
            >
              ⚠
            </span>
            <h2
              id={titleId}
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--cma-text-primary)',
              }}
            >
              Unable to submit your results
            </h2>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 400,
                color: 'var(--cma-text-secondary)',
              }}
            >
              Something went wrong while sending your data. Please try again.
            </p>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--cma-text-secondary)',
              }}
            >
              If the problem persists, contact your recruiter.
            </p>
            {onRetry && (
              <button
                ref={retryRef}
                className="cma-overlay-btn-retry"
                onClick={onRetry}
                data-testid="retry-button"
              >
                Retry Submission
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
