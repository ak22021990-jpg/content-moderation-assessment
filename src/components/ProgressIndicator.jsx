import useAssessmentStore from '../stores/useAssessmentStore.js'
import playlist from '../data/playlist.json'
import { motion } from 'framer-motion'

export default function ProgressIndicator() {
  const currentVideoIndex = useAssessmentStore((s) => s.currentVideoIndex)
  const total = playlist.videos.length
  const step = currentVideoIndex + 1
  const progressPercent = (step / total) * 100

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '1.25rem',
        padding: '0.65rem 1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span className="eyebrow" style={{ margin: 0 }}>
            <span className="eyebrow-dot" />
          </span>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}
          aria-hidden="true"
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>/ {total}</span>
        </div>
        <span className="visually-hidden">{`Video ${step} of ${total}`}</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(42, 27, 61, 0.08)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: '100%',
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: '0 0 16px rgba(255, 122, 156, 0.55), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        />
      </div>
    </div>
  )
}
