import React from 'react'
import useAssessmentStore from '../../stores/useAssessmentStore.js'
import { formatTime } from '../../utils/formatTime.js'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const PHASE_STYLE = {
  green: {
    color: '#2B7A63',
    glow: 'rgba(52, 199, 154, 0.35)',
    ring: 'linear-gradient(135deg, #B5EAD7, #34C79A)',
  },
  amber: {
    color: '#9C6E1F',
    glow: 'rgba(245, 179, 69, 0.4)',
    ring: 'linear-gradient(135deg, #FFE29A, #F5B345)',
  },
  red: {
    color: '#B23A5E',
    glow: 'rgba(255, 107, 125, 0.4)',
    ring: 'linear-gradient(135deg, #FFB4C2, #FF6B7D)',
  },
}

export default function CountdownDisplay() {
  const remainingMs = useAssessmentStore((s) => s.remainingMs)
  const phase = useAssessmentStore((s) => s.phase)
  const isRunning = useAssessmentStore((s) => s.isRunning)
  const reduce = useReducedMotion()

  const isPulsing = isRunning && remainingMs <= 10000
  const style = PHASE_STYLE[phase] ?? PHASE_STYLE.green

  return (
    <div
      className={`cma-timer cma-timer--${phase}`}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        height: '64px',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
      role="timer"
      aria-live="polite"
    >
      <motion.div
        aria-hidden="true"
        animate={reduce || !isPulsing ? {} : { scale: [1, 1.06, 1], opacity: [1, 0.85, 1] }}
        transition={reduce || !isPulsing ? {} : { repeat: Infinity, duration: 1 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 800,
          color: isRunning ? style.color : 'var(--text-primary)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          textShadow: isRunning ? `0 0 24px ${style.glow}` : 'none',
          letterSpacing: '0.02em',
        }}
      >
        {isRunning ? formatTime(remainingMs) : 'Ready'}
      </motion.div>
      <AnimatePresence mode="wait">
        {isRunning && (
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              background: style.ring,
              color: '#fff',
              boxShadow: `0 6px 18px -4px ${style.glow}`,
            }}
          >
            {phase === 'green' && 'Optimal time'}
            {phase === 'amber' && 'Almost there'}
            {phase === 'red' && 'Make a decision'}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
