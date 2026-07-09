import { useState, useRef, useEffect } from 'react'
import useAssessmentStore from '../stores/useAssessmentStore.js'
import VideoPlayerScreen from './player/VideoPlayerScreen.jsx'
import CountdownDisplay from './timer/CountdownDisplay.jsx'
import TagPanel from './tagging/TagPanel.jsx'
import VerdictButtons from './tagging/VerdictButtons.jsx'
import ProgressIndicator from './ProgressIndicator.jsx'
import FeedbackOverlay from './feedback/FeedbackOverlay.jsx'
import { computeFeedback } from './feedback/feedbackHelpers.js'
import playlist from '../data/playlist.json'
import { motion, AnimatePresence } from 'framer-motion'
import './RunnerScreen.css'

export default function RunnerScreen({ onComplete, onPlaying, onReset }) {
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const currentVideoIndex = useAssessmentStore((s) => s.currentVideoIndex)
  const isComplete = useAssessmentStore((s) => s.isComplete)
  const tagSelectionRef = useRef({ selectedL1: [], selectedL2: [] })
  const hasCalledComplete = useRef(false)

  function handleSelectionChange(l1, l2) {
    tagSelectionRef.current = { selectedL1: l1, selectedL2: l2 }
  }

  function finalize(verdict) {
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

  function handleVerdict(verdict) {
    setSubmitting(true)
    const currentVideo = playlist.videos[currentVideoIndex]
    const feedbackData = computeFeedback(
      currentVideo?.id,
      tagSelectionRef.current.selectedL1,
      tagSelectionRef.current.selectedL2,
      verdict
    )
    setFeedback({ ...feedbackData, verdict })
  }

  function handleContinue() {
    if (!feedback) return
    finalize(feedback.verdict)
  }

  useEffect(() => {
    if (isComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true
      onComplete?.()
    }
  }, [isComplete, onComplete])

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
            <TagPanel resetKey={currentVideoIndex} onSelectionChange={handleSelectionChange} />
            <VerdictButtons onVerdict={handleVerdict} submitting={submitting} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <FeedbackOverlay
            {...feedback}
            onContinue={handleContinue}
            autoAdvanceMs={2000}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
