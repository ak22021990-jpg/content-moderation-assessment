import { useCallback } from 'react'
import { SCREENS } from './state/screens.js'
import { useAssessmentState } from './hooks/useAssessmentState.js'
import { useOneAttemptGuard } from './hooks/useOneAttemptGuard.js'
import useAssessmentStore from './stores/useAssessmentStore.js'
import LandingScreen from './components/LandingScreen.jsx'
import GuidelinesScreen from './components/GuidelinesScreen.jsx'
import RunnerScreen from './components/RunnerScreen.jsx'
import AlreadyCompletedScreen from './components/AlreadyCompletedScreen.jsx'
import ScoreboardScreen from './components/scoreboard/ScoreboardScreen.jsx'
import SubmitDoneScreen from './components/SubmitDoneScreen.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export default function App() {
  const state = useAssessmentState()
  const guard = useOneAttemptGuard()

  const handleDevReset = useCallback(() => {
    guard.clear()
    state.resetAttempt()
  }, [guard, state])

  function renderScreen() {
    switch (state.screen) {
      case SCREENS.LANDING:
        return (
          <LandingScreen
            onStart={state.startAssessment}
            hasAttempted={guard.hasAttempted}
          />
        )
      case SCREENS.GUIDELINES:
        return <GuidelinesScreen onBegin={state.enterAssessment} />
      case SCREENS.RUNNER:
      case SCREENS.ASSESSMENT:
        return (
          <RunnerScreen
            onReset={handleDevReset}
            onPlaying={() => {
              useAssessmentStore.getState().startTimer()
            }}
            onComplete={() => state.goToScreen(SCREENS.SCOREBOARD)}
          />
        )
      case SCREENS.SCOREBOARD:
        return <ScoreboardScreen />
      case SCREENS.SUBMIT_DONE:
        return <SubmitDoneScreen identity={state.identity} />
      case SCREENS.ALREADY_COMPLETED:
        return <AlreadyCompletedScreen />
      default:
        console.warn('[cma] unknown screen:', state.screen)
        return <AlreadyCompletedScreen />
    }
  }

  return <ErrorBoundary>{renderScreen()}</ErrorBoundary>
}
