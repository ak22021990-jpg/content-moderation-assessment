import defaultTaxonomy from '../data/taxonomy.json'
import { motion, useReducedMotion } from 'framer-motion'

const CANDY_TINTS = ['blush', 'sky', 'mint', 'sunshine', 'plum']
const CANDY_INK = {
  blush:    'var(--candy-blush-ink)',
  sky:      'var(--candy-sky-ink)',
  mint:     'var(--candy-mint-ink)',
  sunshine: 'var(--candy-sunshine-ink)',
  plum:     'var(--candy-plum-ink)',
}
const CANDY_BG_SOLID = {
  blush:    'var(--candy-blush)',
  sky:      'var(--candy-sky)',
  mint:     'var(--candy-mint)',
  sunshine: 'var(--candy-sunshine)',
  plum:     'var(--candy-plum)',
}

export default function GuidelinesScreen({ onBegin, taxonomy = defaultTaxonomy }) {
  const reduce = useReducedMotion()

  const containerV = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }

  const cardV = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <main className="screen-container" style={{ flexDirection: 'column', paddingBottom: '5rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '740px', marginLeft: 'auto', marginRight: 'auto' }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Your playbook
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)', lineHeight: 1.05, marginBottom: '0.75rem' }}>
          Assessment{' '}
          <span className="display-italic">Guidelines</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6 }}>
          A quick tour of how the challenge works, and the categories you&apos;ll be tagging.
        </p>
      </motion.div>

      {/* "Before you begin" — locked heading text for tests */}
      <motion.section
        aria-labelledby="cma-guidelines-policy"
        className="glass-panel"
        style={{ padding: '2.5rem', marginBottom: '3rem', maxWidth: '860px', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2
          id="cma-guidelines-policy"
          style={{ fontSize: '1.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.2rem', fontWeight: 800,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            ✦
          </span>
          Before you begin
        </h2>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingLeft: 0, listStyle: 'none' }}>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ marginTop: '0.55rem', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-blush)', flexShrink: 0 }} />
            <span>
              This is a one-attempt assessment. You cannot restart it from this browser once submitted.
            </span>
          </li>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ marginTop: '0.55rem', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-sky)', flexShrink: 0 }} />
            <span>
              Each video runs on a 3-minute countdown. When the timer hits zero, your current tags and verdict submit automatically.
            </span>
          </li>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ marginTop: '0.55rem', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--candy-mint)', flexShrink: 0 }} />
            <span>
              For each video, tag every category and sub-category that applies (multi-select), then choose Approve or Decline. Approving with zero categories selected is a valid submission.
            </span>
          </li>
        </ul>
      </motion.section>

      {/* Taxonomy grid */}
      <motion.section
        aria-labelledby="cma-guidelines-categories"
        variants={containerV}
        initial="hidden"
        animate="visible"
        style={{ width: '100%' }}
      >
        <h2
          id="cma-guidelines-categories"
          style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}
        >
          The taxonomy at a glance
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {taxonomy.categories.map((l1, index) => {
            const tint = CANDY_TINTS[index % CANDY_TINTS.length]
            const inkColor = CANDY_INK[tint]
            const bgSolid = CANDY_BG_SOLID[tint]

            return (
              <motion.div
                key={l1.id}
                className={`glass-card candy-glass candy-glass--${tint}`}
                variants={cardV}
                whileHover={reduce ? {} : { y: -6, boxShadow: 'var(--shadow-lift)' }}
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: '44px', height: '44px', borderRadius: '14px',
                      background: bgSolid,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: inkColor,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                      flexShrink: 0,
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 id={`cat-${l1.id}`} style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    {l1.label}
                  </h3>
                </div>

                {l1.definition && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55 }}>
                    {l1.definition}
                  </p>
                )}

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', listStyle: 'none', paddingLeft: 0, marginTop: '0.25rem' }}>
                  {l1.subcategories.map((l2) => (
                    <li
                      key={l2.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        fontSize: '0.9rem',
                        paddingLeft: '0.85rem',
                        borderLeft: `3px solid ${bgSolid}`,
                      }}
                    >
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {l2.label}
                      </strong>
                      {l2.definition && (
                        <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {l2.definition}
                        </span>
                      )}
                      {l2.example && (
                        <em style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                          Example: {l2.example}
                        </em>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.div
        style={{ textAlign: 'center', marginTop: '3.5rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <motion.button
          type="button"
          className="btn-primary"
          onClick={onBegin}
          style={{ padding: '1.25rem 3rem', fontSize: '1.15rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
          whileHover={reduce ? {} : { scale: 1.03 }}
          whileTap={reduce ? {} : { scale: 0.97 }}
        >
          <span>Begin Assessment</span>
          <motion.span
            aria-hidden="true"
            animate={reduce ? {} : { x: [0, 4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block' }}
          >
            →
          </motion.span>
        </motion.button>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.85rem' }}>
          The timer starts on the first video.
        </p>
      </motion.div>
    </main>
  )
}
