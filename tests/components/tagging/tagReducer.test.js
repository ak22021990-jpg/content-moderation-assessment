import { describe, it, expect } from 'vitest'
import { tagReducer, initialTagState } from '../../../src/components/tagging/tagReducer.js'

describe('tagReducer', () => {
  it('initialTagState has empty selection arrays', () => {
    expect(initialTagState.selectedL1).toEqual([])
    expect(initialTagState.selectedL2).toEqual([])
  })

  describe('TOGGLE_L1', () => {
    it('adds L1 id when not currently selected', () => {
      const next = tagReducer(initialTagState, { type: 'TOGGLE_L1', id: '1' })
      expect(next.selectedL1).toEqual(['1'])
    })

    it('removes L1 id when already selected', () => {
      const state = { selectedL1: ['1'], selectedL2: [] }
      const next = tagReducer(state, { type: 'TOGGLE_L1', id: '1' })
      expect(next.selectedL1).toEqual([])
    })

    it('drops child L2s when parent L1 deselected', () => {
      const state = { selectedL1: ['1', '2'], selectedL2: ['1.1', '1.2', '2.1'] }
      const next = tagReducer(state, { type: 'TOGGLE_L1', id: '1' })
      expect(next.selectedL1).toEqual(['2'])
      // Only L2s whose parent (before dot) remains in selectedL1 survive
      expect(next.selectedL2).toEqual(['2.1'])
    })

    it('keeps sibling L1 L2s when a different L1 deselected', () => {
      const state = { selectedL1: ['1', '2'], selectedL2: ['1.1', '2.1'] }
      const next = tagReducer(state, { type: 'TOGGLE_L1', id: '2' })
      expect(next.selectedL1).toEqual(['1'])
      expect(next.selectedL2).toEqual(['1.1'])
    })
  })

  describe('TOGGLE_L2', () => {
    it('adds L2 id when not currently selected', () => {
      const state = { selectedL1: ['1'], selectedL2: [] }
      const next = tagReducer(state, { type: 'TOGGLE_L2', id: '1.1' })
      expect(next.selectedL2).toEqual(['1.1'])
    })

    it('removes L2 id when already selected', () => {
      const state = { selectedL1: ['1'], selectedL2: ['1.1'] }
      const next = tagReducer(state, { type: 'TOGGLE_L2', id: '1.1' })
      expect(next.selectedL2).toEqual([])
    })

    it('does not affect selectedL1 when toggling L2', () => {
      const state = { selectedL1: ['1'], selectedL2: ['1.1'] }
      const next = tagReducer(state, { type: 'TOGGLE_L2', id: '1.2' })
      expect(next.selectedL1).toEqual(['1'])
    })
  })

  describe('RESET', () => {
    it('clears all selections back to initial state', () => {
      const state = { selectedL1: ['1', '2'], selectedL2: ['1.1', '2.1'] }
      const next = tagReducer(state, { type: 'RESET' })
      expect(next).toEqual(initialTagState)
    })
  })
})
