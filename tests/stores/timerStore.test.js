import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── RAF + performance.now mock ──
const rafCallbacks = []
vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
  rafCallbacks.push(cb)
  return rafCallbacks.length
}))
vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => {
  rafCallbacks[id - 1] = null
}))

function tickFrames(count = 1) {
  for (let i = 0; i < count; i++) {
    const cbs = [...rafCallbacks].filter(Boolean)
    cbs.forEach(cb => cb())
  }
}

// ── Tests ──
describe('Timer Store', () => {
  let useAssessmentStore
  let now

  beforeEach(async () => {
    // Reset RAF callback list
    rafCallbacks.length = 0
    vi.clearAllMocks()

    // Mock performance.now starting at 0
    now = 0
    vi.stubGlobal('performance', { now: () => now })

    // Re-import to get fresh store state
    const mod = await import('../../src/stores/useAssessmentStore.js')
    useAssessmentStore = mod.default
    // Reset store state
    useAssessmentStore.getState().resetTimer()
  })

  describe('initial state', () => {
    it('has remainingMs = 180000 (3 minutes)', () => {
      const state = useAssessmentStore.getState()
      expect(state.remainingMs).toBe(180000)
    })

    it('has startedAt = null', () => {
      const state = useAssessmentStore.getState()
      expect(state.startedAt).toBeNull()
    })

    it('has isRunning = false', () => {
      const state = useAssessmentStore.getState()
      expect(state.isRunning).toBe(false)
    })

    it('has isExpired = false', () => {
      const state = useAssessmentStore.getState()
      expect(state.isExpired).toBe(false)
    })

    it('has phase = "green"', () => {
      const state = useAssessmentStore.getState()
      expect(state.phase).toBe('green')
    })

    it('has rafId = null', () => {
      const state = useAssessmentStore.getState()
      expect(state.rafId).toBeNull()
    })
  })

  describe('startTimer', () => {
    it('sets isRunning to true', () => {
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      expect(useAssessmentStore.getState().isRunning).toBe(true)
    })

    it('sets startedAt to performance.now value', () => {
      now = 5000
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      expect(useAssessmentStore.getState().startedAt).toBe(5000)
    })

    it('registers a rAF callback', () => {
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      expect(vi.mocked(requestAnimationFrame)).toHaveBeenCalled()
      expect(rafCallbacks.filter(Boolean).length).toBe(1)
    })

    it('decreases remainingMs as frames tick', () => {
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      const initialMs = useAssessmentStore.getState().remainingMs
      // Advance time
      now = 16000
      tickFrames(1)
      const afterMs = useAssessmentStore.getState().remainingMs
      expect(afterMs).toBeLessThan(initialMs)
      // Should be ~164000 (180000 - 16000)
      expect(afterMs).toBe(164000)
    })
  })

  describe('stopTimer', () => {
    it('sets isRunning to false', () => {
      const { startTimer, stopTimer } = useAssessmentStore.getState()
      startTimer()
      stopTimer()
      expect(useAssessmentStore.getState().isRunning).toBe(false)
    })

    it('cancels the rAF callback', () => {
      const { startTimer, stopTimer } = useAssessmentStore.getState()
      startTimer()
      stopTimer()
      expect(vi.mocked(cancelAnimationFrame)).toHaveBeenCalled()
    })

    it('sets rafId to null', () => {
      const { startTimer, stopTimer } = useAssessmentStore.getState()
      startTimer()
      stopTimer()
      expect(useAssessmentStore.getState().rafId).toBeNull()
    })

    it('remainingMs does not change after stop', () => {
      const { startTimer, stopTimer } = useAssessmentStore.getState()
      startTimer()
      now = 10000
      tickFrames(1)
      stopTimer()
      const held = useAssessmentStore.getState().remainingMs
      now = 30000
      tickFrames(5)
      expect(useAssessmentStore.getState().remainingMs).toBe(held)
    })
  })

  describe('resetTimer', () => {
    it('resets remainingMs to 180000', () => {
      const { resetTimer } = useAssessmentStore.getState()
      useAssessmentStore.setState({ remainingMs: 50000 })
      resetTimer()
      expect(useAssessmentStore.getState().remainingMs).toBe(180000)
    })

    it('resets startedAt to null', () => {
      const { resetTimer } = useAssessmentStore.getState()
      useAssessmentStore.setState({ startedAt: 100 })
      resetTimer()
      expect(useAssessmentStore.getState().startedAt).toBeNull()
    })

    it('resets isRunning to false', () => {
      const { resetTimer } = useAssessmentStore.getState()
      useAssessmentStore.setState({ isRunning: true })
      resetTimer()
      expect(useAssessmentStore.getState().isRunning).toBe(false)
    })

    it('resets isExpired to false', () => {
      const { resetTimer } = useAssessmentStore.getState()
      useAssessmentStore.setState({ isExpired: true })
      resetTimer()
      expect(useAssessmentStore.getState().isExpired).toBe(false)
    })

    it('resets phase to green', () => {
      const { resetTimer } = useAssessmentStore.getState()
      useAssessmentStore.setState({ phase: 'red' })
      resetTimer()
      expect(useAssessmentStore.getState().phase).toBe('green')
    })
  })

  describe('phase transitions', () => {
    it('green when remainingMs > 60000', () => {
      useAssessmentStore.setState({ remainingMs: 120000 })
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      expect(useAssessmentStore.getState().phase).toBe('green')
    })

    it('amber when remainingMs between 15000 and 60000', () => {
      useAssessmentStore.setState({ remainingMs: 50000 })
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      now = 1000
      tickFrames(1)
      expect(useAssessmentStore.getState().phase).toBe('amber')
    })

    it('red when remainingMs < 15000', () => {
      useAssessmentStore.setState({ remainingMs: 10000 })
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      now = 1000
      tickFrames(1)
      expect(useAssessmentStore.getState().phase).toBe('red')
    })

    it('expired when remainingMs <= 0', () => {
      useAssessmentStore.setState({ remainingMs: 500 })
      const { startTimer } = useAssessmentStore.getState()
      startTimer()
      now = 500
      tickFrames(1)
      expect(useAssessmentStore.getState().isExpired).toBe(true)
    })
  })

  describe('no setInterval usage', () => {
    it('does not contain setInterval in store implementation', async () => {
      const fs = await import('fs')
      const path = await import('path')
      // Use a string check on the source
      const src = fs.readFileSync(
        path.resolve('src/stores/useAssessmentStore.js'),
        'utf-8'
      )
      expect(src).not.toContain('setInterval')
    })
  })
})
