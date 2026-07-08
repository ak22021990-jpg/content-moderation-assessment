import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import useScoreboard from '../../hooks/useScoreboard.js'
import { useAssessmentState } from '../../hooks/useAssessmentState.js'
import { useOneAttemptGuard } from '../../hooks/useOneAttemptGuard.js'
import useAssessmentStore from '../../stores/useAssessmentStore.js'
import { SCREENS } from '../../state/screens.js'
import { hashEmail } from '../../utils/dedup.js'
import { buildSubmissionPayload, buildHmac, submitResults, getSubmissionConfig } from '../../utils/submission.js'
import taxonomy from '../../data/taxonomy.json'
import OverallScore from './OverallScore.jsx'
import PerL1Accuracy from './PerL1Accuracy.jsx'
import CompetencyParagraph from './CompetencyParagraph.jsx'
import MilestoneLottie from './MilestoneLottie.jsx'
import PerVideoBreakdown from './PerVideoBreakdown.jsx'
import TimeStats from './TimeStats.jsx'
import SubmissionOverlay from './SubmissionOverlay.jsx'

gsap.registerPlugin(useGSAP)

export default function ScoreboardScreen() {
  const containerRef = useRef(null)
  const scoring = useScoreboard()
  const { identity, goToScreen } = useAssessmentState()
  const guard = useOneAttemptGuard()
  const storeAnswers = useAssessmentStore((s) => s.answers)

  // Snapshot scoreboard data before submission starts (survives re-renders)
  const scoreboardData = useRef(null)

  const [submissionPhase, setSubmissionPhase] = useState('idle')
  const [attemptCount, setAttemptCount] = useState(0)

  // Capture scoreboard data snapshot on first render with answers
  if (scoring.hasAnswers && !scoreboardData.current) {
    scoreboardData.current = {
      identity: identity ? { ...identity } : null,
      answers: storeAnswers.map((a) => ({ ...a })),
      scoring: { ...scoring },
    }
  }

  useGSAP(() => {
    gsap.from('.sb-section', {
      opacity: 0,
      y: 20,
      duration: 0.35,
      stagger: 0.1,
      ease: 'power2.out',
    })
  }, { scope: containerRef })

  // Auto-submit after 500ms delay (scoreboard animation plays first)
  useEffect(() => {
    if (!scoring.hasAnswers || !identity || submissionPhase !== 'idle') return

    const timer = setTimeout(() => {
      handleSubmit()
    }, 500)

    return () => clearTimeout(timer)
    // Only fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit() {
    const data = scoreboardData.current
    if (!data) return

    setSubmissionPhase('submitting')
    setAttemptCount(0)

    try {
      // Hash the normalized email
      const emailHashVal = await hashEmail(data.identity?.email ?? '')

      // Assemble payload
      const payload = buildSubmissionPayload({
        identity: data.identity,
        answers: data.answers,
        scores: {
          overallPct: data.scoring.overallPct,
          perVideo: data.scoring.perVideo,
          perL1Accuracy: data.scoring.perL1Accuracy,
          answerKeyVersion: data.scoring.answerKeyVersion,
        },
        competency: {
          title: data.scoring.tier,
          strengthsWeaknesses: data.scoring.competencyText,
        },
        taxonomyVersion: taxonomy.version,
        hmac: '',
      })

      payload.emailHash = emailHashVal

      const subConfig = getSubmissionConfig()

      // HMAC sign only for Apps Script (Formspree has no HMAC validation)
      if (!subConfig.isFormspree) {
        const secret = import.meta.env?.VITE_HMAC_SECRET ?? ''
        payload.hmac = await buildHmac(payload, secret)
      }

      // If no endpoint configured, simulate success for local dev
      if (!subConfig.endpoint) {
        guard.markAttempted({ emailHash: emailHashVal, submissionId: 'simulated' })
        setSubmissionPhase('success')
        setTimeout(() => {
          goToScreen(SCREENS.SUBMIT_DONE)
        }, 5000)
        return
      }

      // Formspree: strip HMAC field from payload (shared secret must not leak)
      const body = subConfig.isFormspree
        ? (() => { const { hmac, ...rest } = payload; return rest })()
        : payload

      const result = await submitResults({
        payload: body,
        endpoint: subConfig.endpoint,
        onProgress: (p) => {
          setAttemptCount(p.attempt)
          if (p.phase === 'success') {
            // handled after result
          } else if (p.phase === 'error') {
            setSubmissionPhase('error')
          }
        },
        maxAttempts: 3,
      })

      if (result.ok) {
        const submissionId = subConfig.isFormspree
          ? `formspree-${Date.now()}`
          : result.id

        // Mark attempt in localStorage BEFORE screen transition (ATTEMPT-01)
        guard.markAttempted({ emailHash: emailHashVal, submissionId })

        setSubmissionPhase('success')

        // Auto-transition to SubmitDoneScreen after 5 seconds
        setTimeout(() => {
          goToScreen(SCREENS.SUBMIT_DONE)
        }, 5000)
      } else {
        // Error already set by onProgress callback
        setSubmissionPhase('error')
      }
    } catch {
      // If submission pipeline threw unexpectedly, show error
      setSubmissionPhase('error')
    }
  }

  function handleRetry() {
    setAttemptCount(0)
    setSubmissionPhase('idle')
    // Re-trigger submission after a tick
    setTimeout(() => {
      handleSubmit()
    }, 100)
  }

  if (!scoring.hasAnswers) {
    return (
      <div className="cma-screen sb-empty">
        <h2>Assessment Complete</h2>
        <p>Complete the assessment to see your results.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="cma-screen sb-screen" data-testid="scoreboard">
      <h2 className="sb-title">Your Results</h2>

      <div className="sb-section">
        <OverallScore overallPct={scoring.overallPct} tier={scoring.tier} />
      </div>

      <div className="sb-section">
        <MilestoneLottie score={scoring.overallPct} />
      </div>

      <div className="sb-section">
        <PerL1Accuracy perL1Accuracy={scoring.perL1Accuracy} />
      </div>

      <div className="sb-section">
        <CompetencyParagraph competencyText={scoring.competencyText} />
      </div>

      <div className="sb-section">
        <PerVideoBreakdown perVideo={scoring.perVideo} />
      </div>

      <div className="sb-section">
        <TimeStats totalTimeMs={scoring.totalTimeMs} perVideoTimes={scoring.perVideoTimes} />
      </div>

      {submissionPhase !== 'idle' && (
        <SubmissionOverlay
          phase={submissionPhase}
          attempt={attemptCount}
          totalAttempts={3}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
