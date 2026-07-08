import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAssessmentState } from '../../src/hooks/useAssessmentState.js'
import { SCREENS } from '../../src/state/screens.js'

const IDENTITY_KEY = 'cma_identity_v1'

describe('useAssessmentState', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('initial screen is LANDING when sessionStorage is empty', () => {
    const { result } = renderHook(() => useAssessmentState())
    expect(result.current.screen).toBe(SCREENS.LANDING)
  })

  it('initial screen is GUIDELINES when sessionStorage has valid identity', () => {
    sessionStorage.setItem(IDENTITY_KEY, JSON.stringify({
      name: 'Alice',
      email: 'a@b.co',
      startedAt: new Date().toISOString(),
    }))
    const { result } = renderHook(() => useAssessmentState())
    expect(result.current.screen).toBe(SCREENS.GUIDELINES)
  })

  it('startAssessment transitions to GUIDELINES and writes sessionStorage', () => {
    const { result } = renderHook(() => useAssessmentState())

    act(() => {
      result.current.startAssessment({ name: 'Alice', email: 'a@b.co' })
    })

    expect(result.current.screen).toBe(SCREENS.GUIDELINES)

    const stored = JSON.parse(sessionStorage.getItem(IDENTITY_KEY))
    expect(stored.name).toBe('Alice')
    expect(stored.email).toBe('a@b.co')
    expect(typeof stored.startedAt).toBe('string')
  })

  it('enterAssessment transitions to ASSESSMENT', () => {
    const { result } = renderHook(() => useAssessmentState())

    act(() => {
      result.current.startAssessment({ name: 'Alice', email: 'a@b.co' })
    })
    act(() => {
      result.current.enterAssessment()
    })

    expect(result.current.screen).toBe(SCREENS.ASSESSMENT)
  })

  it('showAlreadyCompleted transitions to ALREADY_COMPLETED', () => {
    const { result } = renderHook(() => useAssessmentState())

    act(() => {
      result.current.showAlreadyCompleted()
    })

    expect(result.current.screen).toBe(SCREENS.ALREADY_COMPLETED)
  })

  it('resetAttempt returns to LANDING and clears sessionStorage', () => {
    const { result } = renderHook(() => useAssessmentState())

    act(() => {
      result.current.startAssessment({ name: 'Alice', email: 'a@b.co' })
    })
    act(() => {
      result.current.resetAttempt()
    })

    expect(result.current.screen).toBe(SCREENS.LANDING)
    expect(sessionStorage.getItem(IDENTITY_KEY)).toBeNull()
  })

  it('malformed JSON in sessionStorage: initial screen is LANDING, corrupt slot removed', () => {
    sessionStorage.setItem(IDENTITY_KEY, '{not json')
    const { result } = renderHook(() => useAssessmentState())
    expect(result.current.screen).toBe(SCREENS.LANDING)
    expect(sessionStorage.getItem(IDENTITY_KEY)).toBeNull()
  })

  it('sessionStorage.setItem throws: startAssessment does not throw, screen still transitions', () => {
    const spy = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    const { result } = renderHook(() => useAssessmentState())

    act(() => {
      result.current.startAssessment({ name: 'Alice', email: 'a@b.co' })
    })

    expect(result.current.screen).toBe(SCREENS.GUIDELINES)

    spy.mockRestore()
  })
})
