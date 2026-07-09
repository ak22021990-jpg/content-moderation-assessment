import { useState, useRef, useEffect } from 'react'
import { validateName, validateEmail } from '../utils/validators.js'
import AlreadyCompletedScreen from './AlreadyCompletedScreen.jsx'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

function SparkleGlyph({ size = 22, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 L13.6 8.8 L20.4 10.4 L13.6 12 L12 18.8 L10.4 12 L3.6 10.4 L10.4 8.8 Z"
        fill={color}
      />
    </svg>
  )
}

function ShieldMark() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="markGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#FF9E7A" />
          <stop offset="55%" stopColor="#FF7A9C" />
          <stop offset="100%" stopColor="#E93A9A" />
        </linearGradient>
        <linearGradient id="markInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
        </linearGradient>
      </defs>
      <path
        d="M36 4 C30 8 22 11 12 12 C12 30 16 52 36 68 C56 52 60 30 60 12 C50 11 42 8 36 4 Z"
        fill="url(#markGrad)"
      />
      <path
        d="M36 4 C30 8 22 11 12 12 C12 30 16 52 36 68 C56 52 60 30 60 12 C50 11 42 8 36 4 Z"
        fill="url(#markInner)"
        opacity="0.55"
      />
      <path
        d="M28 34 L34 40 L46 26"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MagneticButton({ children, disabled, ...rest }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 14 })
  const sy = useSpring(y, { stiffness: 180, damping: 14 })

  const handleMove = (e) => {
    if (reduce || disabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set(relX * 0.18)
    y.set(relY * 0.28)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.button
      ref={ref}
      className="btn-primary"
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy, padding: '1.1rem 2rem', fontSize: '1.1rem', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export default function LandingScreen({ onStart, hasAttempted }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({ name: false, email: false })
  const nameRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (hasAttempted) return
    nameRef.current?.focus()
  }, [hasAttempted])

  if (hasAttempted) return <AlreadyCompletedScreen />

  const nameV = validateName(name)
  const emailV = validateEmail(email)
  const canSubmit = nameV.valid && emailV.valid

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    onStart({ name: name.trim(), email: email.trim() })
  }

  const containerV = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.08, delayChildren: 0.1 },
    },
  }
  const itemV = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  }

  const sparklePositions = [
    { top: '10%', left: '8%',  size: 18, delay: 0 },
    { top: '18%', right: '12%', size: 14, delay: 0.4 },
    { top: '78%', left: '14%',  size: 12, delay: 0.8 },
    { top: '72%', right: '10%', size: 20, delay: 1.2 },
    { top: '46%', left: '4%',   size: 10, delay: 1.6 },
    { top: '52%', right: '5%',  size: 16, delay: 2.0 },
  ]

  return (
    <main
      aria-labelledby="cma-landing-title"
      className="screen-container"
      style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}
    >
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="visible"
        className="glass-panel"
        style={{
          position: 'relative',
          maxWidth: '520px',
          width: '100%',
          padding: '3rem 2.5rem',
        }}
      >
        {/* Sparkle particles */}
        {!reduce && sparklePositions.map((s, i) => (
          <motion.span
            key={i}
            className="sparkle"
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              color: i % 2 === 0 ? 'var(--candy-sunshine)' : 'var(--accent-coral)',
            }}
          >
            <SparkleGlyph size={s.size} color="currentColor" />
          </motion.span>
        ))}

        <motion.div variants={itemV} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div
            animate={reduce ? {} : { y: [0, -8, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block', marginBottom: '1rem' }}
          >
            <ShieldMark />
          </motion.div>

          <div style={{ marginBottom: '0.75rem' }}>
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              A moderation challenge
            </span>
          </div>

          <h1
            id="cma-landing-title"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              lineHeight: 1.05,
              marginBottom: '0.75rem',
            }}
          >
            Content Moderation{' '}
            <span className="display-italic">Assessment</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '38ch', margin: '0 auto', lineHeight: 1.55 }}>
            A friendly, timed exercise — five clips, roughly 20 minutes, and a few tags. Take a breath and dive in.
          </p>
        </motion.div>

        <motion.form
          noValidate
          onSubmit={handleSubmit}
          variants={itemV}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label
              htmlFor="cma-name"
              style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              Full name
            </label>
            <input
              id="cma-name"
              className="input-glass"
              placeholder="e.g. Alex Rivera"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              aria-invalid={touched.name && !nameV.valid}
              aria-describedby={touched.name && !nameV.valid ? 'cma-name-error' : undefined}
              maxLength={100}
              autoComplete="name"
              required
            />
            {touched.name && !nameV.valid && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                id="cma-name-error"
                style={{ color: 'var(--status-violation)', fontSize: '0.85rem', fontWeight: 600 }}
                role="alert"
              >
                {nameV.error}
              </motion.span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label
              htmlFor="cma-email"
              style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.02em' }}
            >
              Email address
            </label>
            <input
              id="cma-email"
              type="email"
              className="input-glass"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={touched.email && !emailV.valid}
              aria-describedby={touched.email && !emailV.valid ? 'cma-email-error' : undefined}
              maxLength={254}
              autoComplete="email"
              required
            />
            {touched.email && !emailV.valid && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                id="cma-email-error"
                style={{ color: 'var(--status-violation)', fontSize: '0.85rem', fontWeight: 600 }}
                role="alert"
              >
                {emailV.error}
              </motion.span>
            )}
          </div>

          <motion.div variants={itemV} style={{ marginTop: '0.5rem' }}>
            <MagneticButton type="submit" disabled={!canSubmit}>
              <span>Start the challenge</span>
              <motion.span
                aria-hidden="true"
                animate={reduce || !canSubmit ? {} : { x: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block' }}
              >
                →
              </motion.span>
            </MagneticButton>
          </motion.div>
        </motion.form>

        <motion.p
          variants={itemV}
          style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}
        >
          One attempt · Auto-saved · Your data stays with our review team
        </motion.p>
      </motion.div>
    </main>
  )
}
