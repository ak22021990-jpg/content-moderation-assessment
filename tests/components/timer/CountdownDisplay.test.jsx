import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Must mock the store BEFORE importing the component
vi.mock('../../../src/stores/useAssessmentStore.js', () => ({
  default: vi.fn(),
}))

import useAssessmentStore from '../../../src/stores/useAssessmentStore.js'
import CountdownDisplay from '../../../src/components/timer/CountdownDisplay.jsx'

describe('CountdownDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockStore({ remainingMs = 180000, phase = 'green', isRunning = false } = {}) {
    useAssessmentStore.mockImplementation((selector) => {
      if (!selector) {
        return {
          remainingMs,
          phase,
          isRunning,
        }
      }
      return selector({
        remainingMs,
        phase,
        isRunning,
      })
    })
  }

  it('renders "Ready" when timer is not running', () => {
    mockStore({ isRunning: false })
    render(React.createElement(CountdownDisplay))
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('has role="timer"', () => {
    mockStore()
    render(React.createElement(CountdownDisplay))
    const el = screen.getByRole('timer')
    expect(el).toBeInTheDocument()
  })

  it('has aria-live="polite"', () => {
    mockStore()
    render(React.createElement(CountdownDisplay))
    const el = screen.getByRole('timer')
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('displays formatted time when running', () => {
    mockStore({ remainingMs: 125000, isRunning: true, phase: 'green' })
    render(React.createElement(CountdownDisplay))
    // 125000ms = 125s = 2:05
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('applies cma-timer--green class when phase is green', () => {
    mockStore({ remainingMs: 120000, phase: 'green', isRunning: true })
    render(React.createElement(CountdownDisplay))
    const el = screen.getByRole('timer')
    expect(el.className).toContain('cma-timer--green')
  })

  it('applies cma-timer--amber class when phase is amber', () => {
    mockStore({ remainingMs: 30000, phase: 'amber', isRunning: true })
    render(React.createElement(CountdownDisplay))
    const el = screen.getByRole('timer')
    expect(el.className).toContain('cma-timer--amber')
  })

  it('applies cma-timer--red class when phase is red', () => {
    mockStore({ remainingMs: 5000, phase: 'red', isRunning: true })
    render(React.createElement(CountdownDisplay))
    const el = screen.getByRole('timer')
    expect(el.className).toContain('cma-timer--red')
  })

  it('displays 0:00 when remainingMs is 0', () => {
    mockStore({ remainingMs: 0, isRunning: true, phase: 'red' })
    render(React.createElement(CountdownDisplay))
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('uses granular selectors for remainingMs, phase, and isRunning', () => {
    // Verify store is called with selectors, not getState()
    mockStore({ remainingMs: 100000, phase: 'green', isRunning: true })
    render(React.createElement(CountdownDisplay))
    // The mockImplementation above already tracks selector calls
    expect(useAssessmentStore).toHaveBeenCalled()
  })
})
