import { useEffect } from 'react'

/**
 * Terminal thank-you screen shown after successful submission.
 * Clears sessionStorage identity on mount per D-P5-05.
 * No navigation, no buttons — the assessment is complete.
 */
export default function SubmitDoneScreen({ identity }) {
  useEffect(() => {
    try {
      sessionStorage.removeItem('cma_identity_v1')
    } catch {
      // sessionStorage may be blocked — graceful degradation
    }
  }, [])

  const name = identity?.name ?? ''
  const heading = name ? `Thank you, ${name}` : 'Thank you'

  return (
    <div className="cma-screen" data-testid="submit-done">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 'var(--cma-space-lg)',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--cma-text-primary)',
          }}
        >
          {heading}
        </h1>
        <p
          style={{
            fontSize: '1rem',
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--cma-text-secondary)',
            maxWidth: '560px',
          }}
        >
          Your assessment results have been sent to the hiring team. If you have
          questions about next steps, contact your recruiter.
        </p>
      </div>
    </div>
  )
}
