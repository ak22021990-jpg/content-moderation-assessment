import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'fs'
import { join } from 'path'
import App from '../src/App.jsx'

vi.mock('../src/components/RunnerScreen.jsx', () => ({
  default: ({ onReset, onComplete }) => (
    <div data-testid="runner-screen">
      <button data-testid="runner-trigger-complete" onClick={onComplete}>Complete</button>
      <button data-testid="runner-trigger-reset" onClick={onReset}>Reset</button>
    </div>
  ),
}))

const IDENTITY_KEY = 'cma_identity_v1'
const ATTEMPT_KEY = 'cma_attempt_v1'

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Path 1 — Happy path (clean state → completion terminus)', () => {
    it('renders Landing form on initial mount', () => {
      render(<App />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Content Moderation Assessment')
      expect(screen.getByRole('button', { name: /start/i }).disabled).toBe(true)
      expect(document.activeElement).toBe(screen.getByLabelText(/full name/i))
    })

    it('transitions LANDING → GUIDELINES → RUNNER', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Fill identity
      await user.type(screen.getByLabelText(/full name/i), 'Alice')
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
      expect(screen.getByRole('button', { name: /start/i }).disabled).toBe(false)

      // Start → GUIDELINES
      await user.click(screen.getByRole('button', { name: /start/i }))
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Assessment Guidelines')
      expect(screen.getByText(/before you begin/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /begin assessment/i })).toBeTruthy()

      // Verify sessionStorage written
      const stored = JSON.parse(sessionStorage.getItem(IDENTITY_KEY))
      expect(stored.name).toBe('Alice')
      expect(stored.email).toBe('alice@example.com')
      expect(typeof stored.startedAt).toBe('string')

      // Begin Assessment → RUNNER
      await user.click(screen.getByRole('button', { name: /begin assessment/i }))
      expect(screen.getByTestId('runner-screen')).toBeInTheDocument()
    })

    it('transitions RUNNER → SCOREBOARD on complete', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.type(screen.getByLabelText(/full name/i), 'Alice')
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
      await user.click(screen.getByRole('button', { name: /start/i }))
      await user.click(screen.getByRole('button', { name: /begin assessment/i }))

      expect(screen.getByTestId('runner-screen')).toBeInTheDocument()

      await user.click(screen.getByTestId('runner-trigger-complete'))
      expect(screen.getByTestId('scoreboard-stub')).toBeInTheDocument()
    })
  })

  describe('Path 2 — Already-completed short-circuit (ATTEMPT-02)', () => {
    it('renders AlreadyCompletedScreen when localStorage flag is pre-seeded', () => {
      localStorage.setItem(ATTEMPT_KEY, JSON.stringify({
        emailHash: 'alice@example.com',
        completedAt: '2026-01-01T00:00:00Z',
        submissionId: 'sub-x',
      }))
      render(<App />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/already completed/i)
      expect(screen.queryByLabelText(/full name/i)).toBeNull()
      expect(screen.queryByRole('button', { name: /start/i })).toBeNull()
      expect(document.querySelector('form')).toBeNull()
    })
  })

  describe('Path 3 — Refresh mid-flow (IDENT-04)', () => {
    it('mounts directly to GUIDELINES when sessionStorage has identity', () => {
      sessionStorage.setItem(IDENTITY_KEY, JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        startedAt: '2026-01-01T00:00:00Z',
      }))
      render(<App />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Assessment Guidelines')
      expect(screen.queryByLabelText(/full name/i)).toBeNull()
    })
  })

  describe('Path 4 — ErrorBoundary containment', () => {
    it('App.jsx imports and renders ErrorBoundary wrapper', () => {
      const src = readFileSync(join(__dirname, '..', 'src', 'App.jsx'), 'utf8')
      expect(src).toContain('import ErrorBoundary')
      expect(src).toContain('<ErrorBoundary>')
    })
  })

  describe('Path 5 — Brand safety end-to-end', () => {
    it('has no forbidden brand tokens after completing happy path', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.type(screen.getByLabelText(/full name/i), 'Alice')
      await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
      await user.click(screen.getByRole('button', { name: /start/i }))
      await user.click(screen.getByRole('button', { name: /begin assessment/i }))

      const content = document.body.textContent.toLowerCase()
      const forbidden = ['dis' + 'ney', 'mar' + 'vel', 'pix' + 'ar', 'star' + ' ' + 'wars']
      forbidden.forEach((token) => {
        expect(content).not.toContain(token)
      })
    })
  })
})
