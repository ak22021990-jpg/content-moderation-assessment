import useAssessmentStore from '../../stores/useAssessmentStore.js'
import { motion, useReducedMotion } from 'framer-motion'

export default function VerdictButtons({ onVerdict, submitting = false }) {
  const isRunning = useAssessmentStore((s) => s.isRunning)
  const reduce = useReducedMotion()
  const disabled = !isRunning || submitting

  const baseStyle = {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    filter: disabled ? 'saturate(0.5)' : 'none',
    transition: 'transform 0.2s, box-shadow 0.3s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    letterSpacing: '0.01em',
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.85rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid rgba(42, 27, 61, 0.08)',
        marginTop: 'auto',
        marginBottom: '0.25rem',
      }}
    >
      <motion.button
        type="button"
        aria-label="Approve this video"
        disabled={disabled}
        onClick={() => onVerdict('APPROVE')}
        whileHover={disabled || reduce ? {} : { scale: 1.03, y: -1 }}
        whileTap={disabled || reduce ? {} : { scale: 0.96 }}
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, #7EE0C4, #34C79A)',
          boxShadow: disabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 24px -6px rgba(52, 199, 154, 0.55)',
        }}
      >
        <span aria-hidden="true">✓</span>
        Approve
      </motion.button>

      <motion.button
        type="button"
        aria-label="Decline this video"
        disabled={disabled}
        onClick={() => onVerdict('DECLINE')}
        whileHover={disabled || reduce ? {} : { scale: 1.03, y: -1 }}
        whileTap={disabled || reduce ? {} : { scale: 0.96 }}
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, #FFA5B4, #FF6B7D)',
          boxShadow: disabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 24px -6px rgba(255, 107, 125, 0.55)',
        }}
      >
        <span aria-hidden="true">✕</span>
        Decline
      </motion.button>
    </div>
  )
}
