import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOneAttemptGuard } from '../../src/hooks/useOneAttemptGuard.js'

const KEY = 'cma_attempt_v1'

describe('useOneAttemptGuard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('fresh state: hasAttempted is false, record is null', () => {
    const { result } = renderHook(() => useOneAttemptGuard())
    expect(result.current.hasAttempted).toBe(false)
    expect(result.current.record).toBeNull()
  })

  it('after markAttempted: hasAttempted is true, record has correct shape', () => {
    const { result } = renderHook(() => useOneAttemptGuard())

    act(() => {
      result.current.markAttempted({ emailHash: 'a@b.co', submissionId: 'sub-1' })
    })

    expect(result.current.hasAttempted).toBe(true)
    expect(result.current.record.emailHash).toBe('a@b.co')
    expect(result.current.record.submissionId).toBe('sub-1')
    expect(typeof result.current.record.completedAt).toBe('string')
    expect(() => new Date(result.current.record.completedAt)).not.toThrow()
  })

  it('after clear: hasAttempted is false, record is null, localStorage cleared', () => {
    const { result } = renderHook(() => useOneAttemptGuard())

    act(() => {
      result.current.markAttempted({ emailHash: 'a@b.co', submissionId: 'sub-1' })
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.hasAttempted).toBe(false)
    expect(result.current.record).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('malformed JSON in localStorage: hasAttempted is false, corrupt slot removed', () => {
    localStorage.setItem(KEY, '{not json')
    const { result } = renderHook(() => useOneAttemptGuard())
    expect(result.current.hasAttempted).toBe(false)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('missing shape fields: hasAttempted is false, corrupt slot removed', () => {
    localStorage.setItem(KEY, JSON.stringify({ emailHash: 'x' }))
    const { result } = renderHook(() => useOneAttemptGuard())
    expect(result.current.hasAttempted).toBe(false)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('localStorage.setItem throws: markAttempted does not throw, hook stays functional', () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    const { result } = renderHook(() => useOneAttemptGuard())

    act(() => {
      result.current.markAttempted({ emailHash: 'a@b.co', submissionId: 'sub-1' })
    })

    expect(result.current.hasAttempted).toBe(false)

    spy.mockRestore()
  })
})
