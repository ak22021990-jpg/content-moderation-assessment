import { useState, useRef, useEffect } from 'react'
import useAssessmentStore from '../stores/useAssessmentStore.js'
import VideoPlayerScreen from './player/VideoPlayerScreen.jsx'
import CountdownDisplay from './timer/CountdownDisplay.jsx'
import TagPanel from './tagging/TagPanel.jsx'
import VerdictButtons from './tagging/VerdictButtons.jsx'
import ProgressIndicator from './ProgressIndicator.jsx'
import playlist from '../data/playlist.json'

export default function RunnerScreen({ onComplete, onPlaying, onReset }) {
  const [submitting, setSubmitting] = useState(false)
  const currentVideoIndex = useAssessmentStore((s) => s.currentVideoIndex)
  const isComplete = useAssessmentStore((s) => s.isComplete)
  const currentVideo = playlist.videos[currentVideoIndex]
  const tagSelectionRef = useRef({ selectedL1: [], selectedL2: [] })
  const hasCalledComplete = useRef(false)

  function handleSelectionChange(l1, l2) {
    tagSelectionRef.current = { selectedL1: l1, selectedL2: l2 }
  }

  function handleVerdict(verdict) {
    setSubmitting(true)
    const { selectedL1, selectedL2 } = tagSelectionRef.current
    const store = useAssessmentStore.getState()
    store.setTagSnapshot({ selectedL1, selectedL2, verdict })
    store.commitAnswer()

    if (currentVideoIndex >= playlist.videos.length - 1) {
      store.markComplete()
    } else {
      store.resetTimer()
      store.nextVideo()
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (isComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true
      onComplete?.()
    }
  }, [isComplete, onComplete])

  return (
    <section className="cma-runner" aria-label="Video assessment">
      <ProgressIndicator />
      <div className="cma-runner-main">
        <div className="cma-runner-player-col">
          <VideoPlayerScreen key={currentVideoIndex} src={currentVideo?.srcUrl} videoIndex={currentVideoIndex} onPlaying={onPlaying} onReset={onReset} />
          <CountdownDisplay />
        </div>
        <div className="cma-runner-tags-col">
          <TagPanel onSelectionChange={handleSelectionChange} />
          <VerdictButtons onVerdict={handleVerdict} submitting={submitting} />
        </div>
      </div>
    </section>
  )
}
