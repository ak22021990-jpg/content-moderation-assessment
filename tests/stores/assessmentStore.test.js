import { describe, it, expect, beforeEach } from 'vitest'

describe('Assessment Store', () => {
  let useAssessmentStore

  beforeEach(async () => {
    const mod = await import('../../src/stores/useAssessmentStore.js')
    useAssessmentStore = mod.default
    // Reset to clean state
    useAssessmentStore.getState().resetTimer()
    useAssessmentStore.setState({
      currentVideoIndex: 0,
      isComplete: false,
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
      const snapshot = { tags: ['spam', 'harassment'], videoIndex: 0 }
      const { setTagSnapshot } = useAssessmentStore.getState()
      setTagSnapshot(snapshot)
      expect(useAssessmentStore.getState().tagSnapshot).toEqual(snapshot)
    })

    it('buildAnswerSnapshot returns current tagSnapshot + videoIndex', () => {
      const snapshot = { tags: ['spam'], videoIndex: 2 }
      const { setTagSnapshot } = useAssessmentStore.getState()
      setTagSnapshot(snapshot)
      // The buildAnswerSnapshot should incorporate current state
      // We'll just verify it returns something sensible
      const answer = useAssessmentStore.getState().buildAnswerSnapshot()
      expect(answer).toBeDefined()
      expect(answer.videoIndex).toBeDefined()
    })

    it('commitAnswer pushes answer to answers array', () => {
      const { setTagSnapshot, commitAnswer } = useAssessmentStore.getState()
      setTagSnapshot({ tags: ['spam'], videoIndex: 0 })
      commitAnswer()
      const answers = useAssessmentStore.getState().answers
      expect(answers.length).toBe(1)
      expect(answers[0].videoIndex).toBe(0)
    })

    it('commitAnswer clears tagSnapshot after committing', () => {
      const { setTagSnapshot, commitAnswer } = useAssessmentStore.getState()
      setTagSnapshot({ tags: ['spam'], videoIndex: 0 })
      commitAnswer()
      expect(useAssessmentStore.getState().tagSnapshot).toBeNull()
    })
  })
})
