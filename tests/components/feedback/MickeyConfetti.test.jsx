import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MickeyConfetti from '../../../src/components/feedback/MickeyConfetti.jsx'

describe('MickeyConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders canvas when active', () => {
    render(<MickeyConfetti active={true} />)
    expect(document.querySelector('canvas')).toBeTruthy()
  })

  it('renders nothing when inactive', () => {
    render(<MickeyConfetti active={false} />)
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('skips animation under reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    render(<MickeyConfetti active={true} />)
    expect(document.querySelector('canvas')).toBeNull()
  })
})
