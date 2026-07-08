import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('AssessmentPlaceholderScreen', () => {
  let AssessmentPlaceholderScreen

  beforeEach(async () => {
    const mod = await import(
      '../../src/components/AssessmentPlaceholderScreen.jsx'
    )
    AssessmentPlaceholderScreen = mod.default
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('base rendering (all environments)', () => {
    it('renders main landmark with h1 "Assessment placeholder"', () => {
      vi.stubEnv('DEV', false)
      render(<AssessmentPlaceholderScreen />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Assessment placeholder')
    })

    it('renders placeholder terminus paragraph', () => {
      vi.stubEnv('DEV', false)
      render(<AssessmentPlaceholderScreen />)
      expect(
        screen.getByText(/Assessment videos load in Phase 2/)
      ).toBeTruthy()
      expect(screen.getByText(/placeholder terminus/)).toBeTruthy()
    })

    it('rendered textContent contains no forbidden brand tokens', () => {
      vi.stubEnv('DEV', false)
      render(<AssessmentPlaceholderScreen />)
      const content = document.body.textContent.toLowerCase()
      const forbidden = [
        'dis' + 'ney',
        'mar' + 'vel',
        'pix' + 'ar',
        'star' + ' ' + 'wars',
      ]
      forbidden.forEach((token) => {
        expect(content).not.toContain(token)
      })
    })
  })

  describe('dev-mode branch', () => {
    it('renders [dev] Reset button when DEV=true and onReset passed', () => {
      vi.stubEnv('DEV', true)
      render(<AssessmentPlaceholderScreen onReset={() => {}} />)
      const button = screen.getByRole('button', { name: /\[dev\] Reset/i })
      expect(button).toBeTruthy()
    })

    it('clicking [dev] Reset invokes onReset callback exactly once', async () => {
      vi.stubEnv('DEV', true)
      const user = userEvent.setup()
      const onReset = vi.fn()
      render(<AssessmentPlaceholderScreen onReset={onReset} />)
      const button = screen.getByRole('button', { name: /\[dev\] Reset/i })
      await user.click(button)
      expect(onReset).toHaveBeenCalledTimes(1)
    })

    it('does NOT render [dev] Reset when DEV=true but onReset not passed', () => {
      vi.stubEnv('DEV', true)
      render(<AssessmentPlaceholderScreen />)
      const button = screen.queryByRole('button', { name: /\[dev\] Reset/i })
      expect(button).toBeNull()
    })
  })

  describe('prod-mode branch', () => {
    it('does NOT render [dev] Reset when DEV=false even if onReset passed', () => {
      vi.stubEnv('DEV', false)
      render(<AssessmentPlaceholderScreen onReset={() => {}} />)
      const button = screen.queryByRole('button', { name: /\[dev\] Reset/i })
      expect(button).toBeNull()
    })
  })
})
