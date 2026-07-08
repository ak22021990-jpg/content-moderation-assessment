import { useState, useCallback } from 'react'
import { SCREENS } from '../state/screens.js'

const IDENTITY_KEY = 'cma_identity_v1'

function safeReadIdentity() {
  try {
    const raw = sessionStorage.getItem(IDENTITY_KEY)
    if (raw === null) return null
    const p = JSON.parse(raw)
    if (
      !p ||
      typeof p.name !== 'string' ||
      typeof p.email !== 'string' ||
      typeof p.startedAt !== 'string'
    ) {
      try {
        sessionStorage.removeItem(IDENTITY_KEY)
      } catch {
        /* swallow */
      }
      return null
    }
    return p
  } catch {
    // JSON.parse error (corrupt value) or SecurityError — defensively remove corrupt slot
    try {
      sessionStorage.removeItem(IDENTITY_KEY)
    } catch {
      /* swallow */
    }
    return null
  }
}

function safeWriteIdentity(value) {
  try {
    sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function safeRemoveIdentity() {
  try {
    sessionStorage.removeItem(IDENTITY_KEY)
    return true
  } catch {
    return false
  }
}

export function useAssessmentState() {
  const [identity, setIdentity] = useState(() => safeReadIdentity())
  const [screen, setScreen] = useState(() =>
    safeReadIdentity() !== null ? SCREENS.GUIDELINES : SCREENS.LANDING
  )

  const startAssessment = useCallback(({ name, email }) => {
    const v = {
      name: name.trim(),
      email: email.trim(),
      startedAt: new Date().toISOString(),
    }
    safeWriteIdentity(v)
    setIdentity(v)
    setScreen(SCREENS.GUIDELINES)
  }, [])

  const enterGuidelines = useCallback(() => {
    setScreen(SCREENS.GUIDELINES)
  }, [])

  const enterAssessment = useCallback(() => {
    setScreen(SCREENS.ASSESSMENT_PLACEHOLDER)
  }, [])

  const showAlreadyCompleted = useCallback(() => {
    setScreen(SCREENS.ALREADY_COMPLETED)
  }, [])

  const resetAttempt = useCallback(() => {
    safeRemoveIdentity()
    setIdentity(null)
    setScreen(SCREENS.LANDING)
  }, [])

  return {
    screen,
    identity,
    startAssessment,
    enterGuidelines,
    enterAssessment,
    showAlreadyCompleted,
    resetAttempt,
  }
}
