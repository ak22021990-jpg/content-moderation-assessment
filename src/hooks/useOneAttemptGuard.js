import { useState, useCallback } from 'react'

const KEY = 'cma_attempt_v1'

function safeReadRecord() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.emailHash !== 'string' ||
      typeof parsed.completedAt !== 'string' ||
      typeof parsed.submissionId !== 'string'
    ) {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* swallow */
      }
      return null
    }
    return parsed
  } catch {
    // JSON.parse error (corrupt value) or SecurityError — defensively remove corrupt slot
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* swallow */
    }
    return null
  }
}

function safeWrite(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function safeRemove() {
  try {
    localStorage.removeItem(KEY)
    return true
  } catch {
    return false
  }
}

export function useOneAttemptGuard() {
  const [record, setRecord] = useState(() => safeReadRecord())

  const markAttempted = useCallback(({ emailHash, submissionId }) => {
    const value = {
      emailHash,
      submissionId,
      completedAt: new Date().toISOString(),
    }
    if (safeWrite(value)) setRecord(value)
  }, [])

  const clear = useCallback(() => {
    if (safeRemove()) setRecord(null)
  }, [])

  return {
    hasAttempted: record !== null,
    record,
    markAttempted,
    clear,
  }
}
