/**
 * Submission overlay renders over the scoreboard during submission.
 * States: idle (hidden), submitting (spinner), success (checkmark), error (retry).
 *
 * Error state with retry button is the contract for Plan 05-02 fallback.
 * In this plan (05-01), only idle/submitting/success are wired; error renders null placeholder.
 */
export default function SubmissionOverlay({ phase, attempt, totalAttempts, onRetry }) {
  if (phase === 'idle') return null

  return (
    <div className="cma-overlay" data-testid="submission-overlay">
      <div className="cma-overlay-card">
        {phase === 'submitting' && (
          <>
            <div className="cma-spinner" />
            <h2
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
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--cma-destructive)',
              }}
            >
              Unable to submit your results
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--cma-text-secondary)',
              }}
            >
              Something went wrong while sending your data. Please try again.
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--cma-text-secondary)',
              }}
            >
              If the problem persists, contact your recruiter.
            </p>
            {onRetry && (
              <button
                className="cma-btn cma-btn-primary"
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
