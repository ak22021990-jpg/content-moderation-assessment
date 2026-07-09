import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import MickeyConfetti from './MickeyConfetti.jsx'

export default function FeedbackOverlay({
  isCorrect,
  verdict,
  matchedCategories = [],
  matchedSubcategories = [],
  breakdown = { verdict: 0, l1: 0, l2: 0, total: 0 },
  onContinue,
  autoAdvanceMs = 2500,
}) {
  const reduce = useReducedMotion()
  const overlayRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    overlayRef.current?.focus()
  }, [])

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onContinue?.()
    }, autoAdvanceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onContinue, autoAdvanceMs])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        onContinue?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onContinue])

  const verdictLabel = verdict === 'approve' ? 'Approve' : 'Decline'
  const headline = isCorrect ? 'Correct — great eye' : 'Missed this one'
  const reason = isCorrect
    ? `Correct: this clip contained ${matchedCategories.join(', ') || 'no flagged categories'}`
    : `Wrong: the correct verdict was ${verdictLabel}`

  const accent = isCorrect ? 'var(--status-safe)' : 'var(--status-violation)'
  const glow = isCorrect
    ? '0 24px 60px -16px rgba(52, 199, 154, 0.45)'
    : '0 24px 60px -16px rgba(239, 68, 68, 0.45)'

  return (
    <>
      <MickeyConfetti active={isCorrect} />
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(42, 27, 61, 0.35)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          ref={overlayRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cma-feedback-title"
          className="glass-panel"
          style={{
            padding: '3rem 3.5rem',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            minWidth: '380px',
            maxWidth: '560px',
            width: '90%',
            position: 'relative',
            overflow: 'hidden',
            outline: 'none',
            boxShadow: glow,
            border: `1.5px solid ${accent}`,
          }}
          initial={reduce ? {} : isCorrect ? { scale: 0.6, y: 40, opacity: 0 } : { x: [-20, 20, -20, 20, 0], opacity: 0 }}
          animate={{ scale: 1, x: 0, y: 0, opacity: 1 }}
          transition={reduce ? { duration: 0 } : isCorrect ? { type: 'spring', stiffness: 220, damping: 16 } : { duration: 0.45 }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)`,
              opacity: 0.12,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            style={{
              width: '96px',
              height: '96px',
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}, ${accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 20px 40px -8px ${accent}66`,
            }}
          >
            {isCorrect ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 7l10 10M17 7L7 17" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </motion.div>

          <h2 id="cma-feedback-title" style={{ fontSize: '1.85rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {headline}
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
            {reason}
          </p>

          <div
            style={{
              textAlign: 'left',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Breakdown
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span>Verdict</span>
                <span style={{ fontWeight: 700, color: breakdown.verdict > 0 ? 'var(--status-safe)' : 'var(--status-violation)' }}>
                  {breakdown.verdict > 0 ? '✓' : '✗'} {breakdown.verdict} pts
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span>L1 categories</span>
                <span style={{ fontWeight: 700 }}>{breakdown.l1} pts</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span>L2 sub-categories</span>
                <span style={{ fontWeight: 700 }}>{breakdown.l2} pts</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 800, color: accent }}>{breakdown.total} / 100</span>
              </li>
            </ul>

            {matchedCategories.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Expected categories:
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {matchedCategories.join(', ')}
                </p>
                {matchedSubcategories.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Expected sub-categories: {matchedSubcategories.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={onContinue}
            style={{ marginTop: '0.25rem' }}
          >
            Continue →
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            Auto-advancing in a moment. Press Enter or Escape to skip.
          </p>
        </motion.div>
      </motion.div>
    </>
  )
}
