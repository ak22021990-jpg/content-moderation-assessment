import React from 'react'
import useAssessmentStore from '../../stores/useAssessmentStore.js'
import { formatTime } from '../../utils/formatTime.js'

function CountdownDisplay() {
  const remainingMs = useAssessmentStore((s) => s.remainingMs)
  const phase = useAssessmentStore((s) => s.phase)
  const isRunning = useAssessmentStore((s) => s.isRunning)

  return (
    <div className={`cma-timer cma-timer--${phase}`} role="timer" aria-live="polite">
      <span className="cma-timer-value">
        {isRunning ? formatTime(remainingMs) : 'Ready'}
      </span>
      {isRunning && (
        <span className="cma-timer-status">
          {phase === 'green' && 'Plenty of time'}
          {phase === 'amber' && 'Time running'}
          {phase === 'red' && 'Hurry up'}
        </span>
      )}
    </div>
  )
}

export default CountdownDisplay
