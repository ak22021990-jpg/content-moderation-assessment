import { useCallback } from 'react'
import { SCREENS } from './state/screens.js'
import { useAssessmentState } from './hooks/useAssessmentState.js'
import { useOneAttemptGuard } from './hooks/useOneAttemptGuard.js'
import LandingScreen from './components/LandingScreen.jsx'
import GuidelinesScreen from './components/GuidelinesScreen.jsx'
import VideoPlayerScreen from './components/player/VideoPlayerScreen.jsx'
import AlreadyCompletedScreen from './components/AlreadyCompletedScreen.jsx'
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
      case SCREENS.ASSESSMENT:
        return (
          <VideoPlayerScreen
            onReset={handleDevReset}
            onReady={() => {
              // TODO(Phase 3): wire timer.start() here once Zustand timer slice lands
              console.log('[cma] video ready (canplaythrough) — timer start target');
            }}
          />
        )
      case SCREENS.ALREADY_COMPLETED:
        return <AlreadyCompletedScreen />
      default:
        console.warn('[cma] unknown screen:', state.screen)
        return <AlreadyCompletedScreen />
    }
  }

  return <ErrorBoundary>{renderScreen()}</ErrorBoundary>
}
