import { describe, it, expect } from 'vitest'
import { SCREENS } from '../../src/state/screens.js'

describe('SCREENS enum', () => {
  it('has exactly 5 keys', () => {
    expect(Object.keys(SCREENS)).toHaveLength(5)
  })

  it('has the required keys', () => {
    expect(SCREENS).toHaveProperty('LANDING')
    expect(SCREENS).toHaveProperty('GUIDELINES')
    expect(SCREENS).toHaveProperty('ASSESSMENT')
    expect(SCREENS).toHaveProperty('ALREADY_COMPLETED')
    expect(SCREENS).toHaveProperty('SCOREBOARD')
  })

  it('each key maps to a string equal to the key name', () => {
    expect(SCREENS.LANDING).toBe('LANDING')
    expect(SCREENS.GUIDELINES).toBe('GUIDELINES')
    expect(SCREENS.ASSESSMENT).toBe('ASSESSMENT')
    expect(SCREENS.ALREADY_COMPLETED).toBe('ALREADY_COMPLETED')
    expect(SCREENS.SCOREBOARD).toBe('SCOREBOARD')
  })

  it('is immutable (Object.freeze applied)', () => {
    expect(Object.isFrozen(SCREENS)).toBe(true)
  })

  it('mutation is refused in strict mode', () => {
    expect(() => {
      SCREENS.NEW_KEY = 'test'
    }).toThrow()
  })
})
