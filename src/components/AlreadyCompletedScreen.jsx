import { motion, useReducedMotion } from 'framer-motion'

export default function AlreadyCompletedScreen() {
  const reduce = useReducedMotion()

  return (
    <main
      aria-labelledby="cma-completed-title"
      className="screen-container"
      style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}
    >
      <motion.div
        className="glass-panel"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: '#fff',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5), 0 20px 40px -8px rgba(233, 58, 154, 0.5)',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4 10-10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <div>
          <span className="eyebrow" style={{ marginBottom: '0.75rem' }}>
            <span className="eyebrow-dot" />
            One attempt policy
          </span>
        </div>

        <h1
          id="cma-completed-title"
          style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', lineHeight: 1.1 }}
        >
          Assessment already completed
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '44ch' }}>
          You have already completed this assessment. If you believe this is an error,
          contact your recruiter and we&apos;ll help sort it out.
        </p>

        {!reduce && (
          <motion.div
            aria-hidden="true"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-blush)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-sky)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-mint)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-sunshine)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-plum)' }} />
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
