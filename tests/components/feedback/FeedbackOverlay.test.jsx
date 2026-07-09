import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FeedbackOverlay from '../../../src/components/feedback/FeedbackOverlay.jsx'

describe('FeedbackOverlay', () => {
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

  const baseProps = {
    isCorrect: true,
    verdict: 'decline',
    matchedCategories: ['Copyright & IP'],
    matchedSubcategories: ['Franchise / character IP misuse'],
    breakdown: { verdict: 50, l1: 25, l2: 25, total: 100 },
    onContinue: vi.fn(),
    autoAdvanceMs: 2000,
  }

  it('renders correct headline and confetti', () => {
    render(<FeedbackOverlay {...baseProps} />)
    expect(screen.getByRole('heading', { name: /Correct — great eye/i })).toBeTruthy()
    expect(document.querySelector('canvas')).toBeTruthy()
  })

  it('renders wrong headline without confetti', () => {
    render(<FeedbackOverlay {...baseProps} isCorrect={false} />)
    expect(screen.getByRole('heading', { name: /Missed this one/i })).toBeTruthy()
    expect(document.querySelector('canvas')).toBeNull()
  })

  it('shows reason with matched category', () => {
    render(<FeedbackOverlay {...baseProps} />)
    expect(screen.getByText(/Correct: this clip contained Copyright & IP/i)).toBeTruthy()
  })

  it('shows wrong reason with correct verdict', () => {
    render(<FeedbackOverlay {...baseProps} isCorrect={false} verdict="approve" />)
    expect(screen.getByText(/Wrong: the correct verdict was Approve/i)).toBeTruthy()
  })

  it('calls onContinue when button clicked', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    render(<FeedbackOverlay {...baseProps} onContinue={onContinue} />)
    await user.click(screen.getByRole('button', { name: /Continue/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('auto-advances after timeout', () => {
    const onContinue = vi.fn()
    render(<FeedbackOverlay {...baseProps} onContinue={onContinue} />)
    vi.advanceTimersByTime(2500)
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('shows breakdown totals', () => {
    render(<FeedbackOverlay {...baseProps} />)
    expect(screen.getByText('100 / 100')).toBeTruthy()
    expect(screen.getByText('Verdict')).toBeTruthy()
    expect(screen.getByText('L1 categories')).toBeTruthy()
    expect(screen.getByText('L2 sub-categories')).toBeTruthy()
  })
})
