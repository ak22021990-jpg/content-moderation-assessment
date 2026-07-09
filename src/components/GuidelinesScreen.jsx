import { useState } from 'react'
import defaultTaxonomy from '../data/taxonomy.json'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { getL1Icon } from '../assets/icons/l1/index.js'

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
  const [expandedId, setExpandedId] = useState(null)
  const reduce = useReducedMotion()

  const expandedCategory = taxonomy.categories.find((c) => c.id === expandedId)
  const expandedTint = expandedCategory
    ? CANDY_TINTS[taxonomy.categories.indexOf(expandedCategory) % CANDY_TINTS.length]
    : null

  function handleToggle(id) {
    setExpandedId((current) => (current === id ? null : id))
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

      {/* Taxonomy grid with side panel */}
      <motion.section
        aria-labelledby="cma-guidelines-categories"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ width: '100%', maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto' }}
      >
        <h2
          id="cma-guidelines-categories"
          style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}
        >
          The taxonomy at a glance
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: collapsed cards */}
          <div
            role="tablist"
            aria-label="Taxonomy categories"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            {taxonomy.categories.map((l1, index) => {
              const tint = CANDY_TINTS[index % CANDY_TINTS.length]
              const inkColor = CANDY_INK[tint]
              const bgSolid = CANDY_BG_SOLID[tint]
              const isExpanded = expandedId === l1.id
              const Icon = getL1Icon(l1.iconKey)

              return (
                <motion.button
                  key={l1.id}
                  type="button"
                  role="tab"
                  aria-selected={isExpanded}
                  aria-controls={`cma-guideline-panel-${l1.id}`}
                  id={`cma-guideline-tab-${l1.id}`}
                  className={`glass-card candy-glass candy-glass--${tint}`}
                  onClick={() => handleToggle(l1.id)}
                  whileHover={reduce ? {} : { y: -2 }}
                  whileTap={reduce ? {} : { scale: 0.99 }}
                  animate={{
                    backgroundColor: isExpanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: '100%',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: `1.5px solid ${isExpanded ? inkColor : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: isExpanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: bgSolid,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: inkColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon width={20} height={20} />
                  </span>
                  <span style={{ flex: 1 }}>{l1.label}</span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: reduce ? 'none' : 'transform 0.2s',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ▼
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Right: detail panel */}
          <div
            className="glass-panel"
            style={{
              minHeight: '320px',
              maxHeight: 'calc(100dvh - 3rem)',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              position: 'sticky',
              top: '1.5rem',
            }}
          >
            <AnimatePresence mode="wait">
              {expandedCategory ? (
                <motion.div
                  key={expandedCategory.id}
                  id={`cma-guideline-panel-${expandedCategory.id}`}
                  role="tabpanel"
                  aria-labelledby={`cma-guideline-tab-${expandedCategory.id}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: reduce ? 0 : 0.25 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: CANDY_BG_SOLID[expandedTint],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: CANDY_INK[expandedTint],
                      }}
                    >
                      {(() => {
                        const Icon = getL1Icon(expandedCategory.iconKey)
                        return <Icon width={28} height={28} />
                      })()}
                    </span>
                    <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
                      {expandedCategory.label}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {expandedCategory.definition}
                  </p>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Sub-categories
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                    {expandedCategory.subcategories.map((l2) => (
                      <li
                        key={l2.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                          {l2.label}
                        </strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, display: 'block' }}>
                          {l2.definition}
                        </span>
                        {l2.example && (
                          <em style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.45, display: 'block', marginTop: '0.35rem' }}>
                            Example: {l2.example}
                          </em>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.2 }}
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    gap: '0.75rem',
                    minHeight: '280px',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '2.5rem', opacity: 0.5 }}>👆</span>
                  <p style={{ fontSize: '1.05rem', margin: 0 }}>
                    Select a category on the left to see its definition and sub-categories.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
