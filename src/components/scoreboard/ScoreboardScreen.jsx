import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import useScoreboard from '../../hooks/useScoreboard.js'
import OverallScore from './OverallScore.jsx'
import PerL1Accuracy from './PerL1Accuracy.jsx'
import CompetencyParagraph from './CompetencyParagraph.jsx'
import MilestoneLottie from './MilestoneLottie.jsx'
import PerVideoBreakdown from './PerVideoBreakdown.jsx'
import TimeStats from './TimeStats.jsx'

gsap.registerPlugin(useGSAP)

export default function ScoreboardScreen() {
  const containerRef = useRef(null)
  const scoring = useScoreboard()

  useGSAP(() => {
    gsap.from('.sb-section', {
      opacity: 0,
      y: 20,
      duration: 0.35,
      stagger: 0.1,
      ease: 'power2.out',
    })
  }, { scope: containerRef })

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
    </div>
  )
}
