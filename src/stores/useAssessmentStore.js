import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const STORAGE_KEY = 'cma_timer_v1'
const TOTAL_MS = 180000

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToSession(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // graceful degradation — sessionStorage may be blocked
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function computePhase(remainingMs) {
  if (remainingMs <= 0) return 'red'
  if (remainingMs < 15000) return 'red'
  if (remainingMs <= 60000) return 'amber'
  return 'green'
}

const useAssessmentStore = create(
  devtools(
    (set, get) => ({
      // ── Timer slice ──
      remainingMs: TOTAL_MS,
      startedAt: null,
      isRunning: false,
      isExpired: false,
      phase: 'green',
      rafId: null,

      startTimer: () => {
        const state = get()
        if (state.isRunning) return

        const startTime = performance.now()
        const sessionData = loadFromSession()

        set({
          isRunning: true,
          startedAt: startTime,
          rafId: null,
        })

        saveToSession({
          startedAtWallClock: Date.now(),
          videoIndex: state.currentVideoIndex,
        })

        let internalRafId = null

        function tick() {
          const s = get()
          if (!s.isRunning || s.isExpired) return

          const elapsed = performance.now() - s.startedAt
          const remaining = Math.max(0, TOTAL_MS - elapsed)
          const newPhase = computePhase(remaining)
          const expired = remaining <= 0

          set({
            remainingMs: remaining,
            phase: newPhase,
            isExpired: expired,
          })

          if (expired) {
            set({ isRunning: false, rafId: null })
            return
          }

          internalRafId = requestAnimationFrame(tick)
          set({ rafId: internalRafId })
        }

        internalRafId = requestAnimationFrame(tick)
        set({ rafId: internalRafId })
      },

      stopTimer: () => {
        const state = get()
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId)
        }
        set({
          isRunning: false,
          rafId: null,
        })
      },

      resetTimer: () => {
        const state = get()
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId)
        }
        clearSession()
        set({
          remainingMs: TOTAL_MS,
          startedAt: null,
          isRunning: false,
          isExpired: false,
          phase: 'green',
          rafId: null,
        })
      },

      // ── Assessment slice ──
      currentVideoIndex: 0,
      isComplete: false,

      nextVideo: () => {
        set((s) => ({ currentVideoIndex: s.currentVideoIndex + 1 }))
      },

      markComplete: () => {
        set({ isComplete: true })
      },

      // ── Answers slice ──
      answers: [],
      tagSnapshot: null,

      setTagSnapshot: (snapshot) => {
        set({ tagSnapshot: snapshot })
      },

      buildAnswerSnapshot: () => {
        const state = get()
        return {
          ...state.tagSnapshot,
          videoIndex: state.currentVideoIndex,
        }
      },

      commitAnswer: () => {
        const snapshot = get().buildAnswerSnapshot()
        set((s) => ({
          answers: [...s.answers, snapshot],
          tagSnapshot: null,
        }))
      },
    }),
    { name: 'cma-assessment' }
  )
)

export default useAssessmentStore
