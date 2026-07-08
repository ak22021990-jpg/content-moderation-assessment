import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Assessment Store', () => {
  let useAssessmentStore

  beforeEach(async () => {
    vi.restoreAllMocks()
    const mod = await import('../../src/stores/useAssessmentStore.js')
    useAssessmentStore = mod.default
    // Reset to clean state
    useAssessmentStore.getState().resetTimer()
    useAssessmentStore.setState({
      currentVideoIndex: 0,
      isComplete: false,
      isExpired: false,
      answers: [],
      tagSnapshot: null,
    })
  })

  describe('assessment slice', () => {
    it('initial currentVideoIndex is 0', () => {
      expect(useAssessmentStore.getState().currentVideoIndex).toBe(0)
    })

    it('initial isComplete is false', () => {
      expect(useAssessmentStore.getState().isComplete).toBe(false)
    })

    it('nextVideo increments currentVideoIndex', () => {
      const { nextVideo } = useAssessmentStore.getState()
      nextVideo()
      expect(useAssessmentStore.getState().currentVideoIndex).toBe(1)
    })

    it('markComplete sets isComplete to true', () => {
      const { markComplete } = useAssessmentStore.getState()
      markComplete()
      expect(useAssessmentStore.getState().isComplete).toBe(true)
    })
  })

  describe('answers slice', () => {
    it('initial answers is empty array', () => {
      expect(useAssessmentStore.getState().answers).toEqual([])
    })

    it('initial tagSnapshot is null', () => {
      expect(useAssessmentStore.getState().tagSnapshot).toBeNull()
    })

    it('setTagSnapshot stores a snapshot', () => {
      const snapshot = { selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE' }
      const { setTagSnapshot } = useAssessmentStore.getState()
      setTagSnapshot(snapshot)
      expect(useAssessmentStore.getState().tagSnapshot).toEqual(snapshot)
    })

    it('buildAnswerSnapshot returns answer with videoId from playlist', () => {
      const { setTagSnapshot } = useAssessmentStore.getState()
      setTagSnapshot({ selectedL1: ['1'], selectedL2: [], verdict: 'APPROVE' })
      const answer = useAssessmentStore.getState().buildAnswerSnapshot()
      expect(answer.videoId).toBe('v01')
      expect(answer.videoIndex).toBe(0)
      expect(answer.selectedL1).toEqual(['1'])
      expect(answer.verdict).toBe('APPROVE')
      expect(answer.timedOut).toBe(false)
      expect(answer.timeSpentMs).toBe(0)
      expect(answer.submittedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
    })

    it('commitAnswer pushes answer with timing fields to answers array', () => {
      const { setTagSnapshot, commitAnswer } = useAssessmentStore.getState()
      setTagSnapshot({ selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE' })
      commitAnswer()
      const answers = useAssessmentStore.getState().answers
      expect(answers.length).toBe(1)
      expect(answers[0].videoId).toBe('v01')
      expect(answers[0].videoIndex).toBe(0)
      expect(answers[0].verdict).toBe('DECLINE')
      expect(answers[0].timedOut).toBe(false)
      expect(answers[0].submittedAt).toBeDefined()
    })

    it('commitAnswer clears tagSnapshot after committing', () => {
      const { setTagSnapshot, commitAnswer } = useAssessmentStore.getState()
      setTagSnapshot({ selectedL1: ['1'], selectedL2: [], verdict: 'APPROVE' })
      commitAnswer()
      expect(useAssessmentStore.getState().tagSnapshot).toBeNull()
    })
  })

  describe('commitAnswer timing fields', () => {
    it('stores videoId from playlist for current index', () => {
      const store = useAssessmentStore.getState()
      store.setTagSnapshot({ selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE' })
      store.commitAnswer()
      const answers = useAssessmentStore.getState().answers
      expect(answers[0].videoId).toBe('v01')
    })

    it('stores timeSpentMs as elapsed since timer start', () => {
      const store = useAssessmentStore.getState()
      const nowSpy = vi.spyOn(performance, 'now')
      nowSpy.mockReturnValue(50000)
      store.startTimer()
      nowSpy.mockReturnValue(65000)
      store.setTagSnapshot({ selectedL1: [], selectedL2: [], verdict: 'APPROVE' })
      store.commitAnswer()
      const answers = useAssessmentStore.getState().answers
      expect(answers[0].timeSpentMs).toBe(15000)
    })

    it('stores timeSpentMs = 0 when timer never started', () => {
      const store = useAssessmentStore.getState()
      store.setTagSnapshot({ selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE' })
      store.commitAnswer()
      expect(useAssessmentStore.getState().answers[0].timeSpentMs).toBe(0)
    })

    it('stores timedOut = true when isExpired is true', () => {
      const store = useAssessmentStore.getState()
      useAssessmentStore.setState({ isExpired: true })
      store.setTagSnapshot({ selectedL1: [], selectedL2: [], verdict: 'APPROVE' })
      store.commitAnswer()
      expect(useAssessmentStore.getState().answers[0].timedOut).toBe(true)
    })

    it('stores timedOut = false on normal verdict submit', () => {
      const store = useAssessmentStore.getState()
      useAssessmentStore.setState({ isExpired: false })
      store.setTagSnapshot({ selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE' })
      store.commitAnswer()
      expect(useAssessmentStore.getState().answers[0].timedOut).toBe(false)
    })

    it('stores submittedAt as ISO-8601 string', () => {
      const store = useAssessmentStore.getState()
      store.setTagSnapshot({ selectedL1: [], selectedL2: [], verdict: 'APPROVE' })
      store.commitAnswer()
      const submittedAt = useAssessmentStore.getState().answers[0].submittedAt
      expect(submittedAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
    })

    it('handles null tagSnapshot with safe defaults', () => {
      useAssessmentStore.setState({ tagSnapshot: null })
      const snapshot = useAssessmentStore.getState().buildAnswerSnapshot()
      expect(snapshot.selectedL1).toEqual([])
      expect(snapshot.selectedL2).toEqual([])
      expect(snapshot.verdict).toBeNull()
    })
  })
})
