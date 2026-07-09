import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const CONFETTI_COLORS = [
  '#FFB4C2', '#A5D8FF', '#B5EAD7', '#FFE29A', '#C9B6FF',
  '#FF7A9C', '#E93A9A', '#7C5CFF', '#34C79A', '#F5B345',
]

function generateConfetti(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    dx: `${(Math.random() - 0.5) * 30}vw`,
    delay: Math.random() * 0.6,
    duration: 2.6 + Math.random() * 1.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
    size: 8 + Math.random() * 8,
  }))
}

export default function SubmitDoneScreen({ identity }) {
  const reduce = useReducedMotion()
  const [confetti] = useState(() => generateConfetti(32))

  useEffect(() => {
    try {
      sessionStorage.removeItem('cma_identity_v1')
    } catch {
      // sessionStorage may be blocked
    }
  }, [])

  const name = identity?.name ?? ''
  const heading = name ? `Thank you, ${name}` : 'Thank you'

  return (
    <main
      className="screen-container"
      style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', position: 'relative' }}
      data-testid="submit-done"
    >
      {/* Confetti burst */}
      {!reduce && (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 2 }}>
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-bit"
              style={{
                left: c.left,
                top: 0,
                width: c.size,
                height: c.size * 1.4,
                background: c.color,
                transform: `rotate(${c.rotate}deg)`,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                '--dx': c.dx,
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          gap: '1.25rem',
          maxWidth: '620px',
          width: '100%',
          zIndex: 3,
        }}
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.15 }}
          style={{
            position: 'relative',
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              'inset 0 2px 0 rgba(255,255,255,0.65), 0 20px 60px -12px rgba(233, 58, 154, 0.55), 0 0 48px rgba(255, 122, 156, 0.35)',
            marginBottom: '0.5rem',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <motion.path
              d="M18 33 L28 43 L46 22"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.55, delay: 0.5, ease: 'easeOut' }}
            />
          </svg>
          {/* Ring pulse */}
          {!reduce && (
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
              }}
            />
          )}
        </motion.div>

        <div>
          <div style={{ marginBottom: '0.75rem' }}>
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              All wrapped up
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 2.75rem)',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            {heading}
          </h1>
        </div>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '46ch' }}>
          Your assessment results have been sent securely to our review team. We&apos;ll be in touch soon.
          If anything looks off, contact your recruiter and we&apos;ll sort it out.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ marginTop: '1rem' }}
        >
          <span
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-glass-soft)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            You may now safely close this window.
          </span>
        </motion.div>
      </motion.div>
    </main>
  )
}
