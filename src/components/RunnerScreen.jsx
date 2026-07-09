import { useState, useRef, useEffect } from 'react'
import useAssessmentStore from '../stores/useAssessmentStore.js'
import VideoPlayerScreen from './player/VideoPlayerScreen.jsx'
import CountdownDisplay from './timer/CountdownDisplay.jsx'
import TagPanel from './tagging/TagPanel.jsx'
import VerdictButtons from './tagging/VerdictButtons.jsx'
import ProgressIndicator from './ProgressIndicator.jsx'
import playlist from '../data/playlist.json'
import answerKeys from '../data/answerKeys.json'
import { motion, AnimatePresence } from 'framer-motion'
import './RunnerScreen.css'

export default function RunnerScreen({ onComplete, onPlaying, onReset }) {
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const currentVideoIndex = useAssessmentStore((s) => s.currentVideoIndex)
  const isComplete = useAssessmentStore((s) => s.isComplete)
  const tagSelectionRef = useRef({ selectedL1: [], selectedL2: [] })
  const hasCalledComplete = useRef(false)
  const transitionTimerRef = useRef(null)
  const finalizeRef = useRef(null)
  const overlayRef = useRef(null)

  function handleSelectionChange(l1, l2) {
    tagSelectionRef.current = { selectedL1: l1, selectedL2: l2 }
  }

  function handleVerdict(verdict) {
    setSubmitting(true)
    const currentVideo = playlist.videos[currentVideoIndex]
    const key = answerKeys.videos.find((v) => v.id === currentVideo?.id)
    const isCorrect = !!key && key.verdict === verdict
    setFeedback(isCorrect ? 'correct' : 'incorrect')

    const finalize = () => {
      transitionTimerRef.current = null
      finalizeRef.current = null
      const { selectedL1, selectedL2 } = tagSelectionRef.current
      const store = useAssessmentStore.getState()
      store.setTagSnapshot({ selectedL1, selectedL2, verdict })
      store.commitAnswer()

      if (currentVideoIndex >= playlist.videos.length - 1) {
        store.markComplete()
      } else {
        store.resetTimer()
        store.nextVideo()
      }
      setSubmitting(false)
      setFeedback(null)
    }
    finalizeRef.current = finalize
    transitionTimerRef.current = setTimeout(finalize, 2000)
  }

  function handleContinue() {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
    finalizeRef.current?.()
  }

  useEffect(() => {
    if (isComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true
      onComplete?.()
    }
  }, [isComplete, onComplete])

  useEffect(() => {
    if (!feedback) return
    overlayRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        handleContinue()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [feedback])

  useEffect(() => () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
  }, [])

  const feedbackTint = feedback === 'correct'
    ? { primary: 'var(--status-safe)', accent: 'var(--status-safe)' }
    : { primary: 'var(--status-violation)', accent: 'var(--status-violation)' }

  return (
    <section className="cma-runner" aria-label="Video assessment">
      <div className="cma-runner__container">
        <header className="cma-runner__header">
          <ProgressIndicator />
        </header>

        <div className="cma-runner__main">
          <motion.div
            className="cma-runner__video-col"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cma-runner__video-wrapper">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentVideoIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.35 }}
                  style={{ width: '100%', height: '100%', display: 'flex' }}
                >
                  <VideoPlayerScreen
                    videoIndex={currentVideoIndex}
                    onPlaying={onPlaying}
                    onReset={onReset}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <CountdownDisplay />
          </motion.div>

          <motion.div
            className="cma-runner__tag-col"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <TagPanel onSelectionChange={handleSelectionChange} />
            <VerdictButtons onVerdict={handleVerdict} submitting={submitting} />
          </motion.div>
        </div>
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
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
                minWidth: '360px',
                maxWidth: '520px',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
              }}
              initial={{ scale: 0.6, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 220, damping: 16 } }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              {/* Tinted halo */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 50% 0%, ${feedbackTint.primary}, transparent 70%)`,
                  opacity: 0.6,
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
              />
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                style={{
                  width: '96px',
                  height: '96px',
                  margin: '0 auto 1.25rem',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${feedbackTint.primary}, ${feedbackTint.accent})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 20px 40px -8px ${feedbackTint.accent}66`,
                }}
              >
                {feedback === 'correct' ? (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 7l10 10M17 7L7 17" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </motion.div>
              <h2 id="cma-feedback-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {feedback === 'correct' ? 'Recorded' : 'Recorded — miss'}
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {feedback === 'correct'
                  ? 'Advancing to next clip.'
                  : 'Advancing to next clip. Review the taxonomy on scoreboard.'}
              </p>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleContinue}
                style={{ marginTop: '1.5rem' }}
              >
                Continue →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
