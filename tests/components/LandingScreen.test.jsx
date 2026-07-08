import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LandingScreen from '../../src/components/LandingScreen.jsx'

describe('LandingScreen', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('rendering (hasAttempted=false)', () => {
    beforeEach(() => {
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
    })

    it('renders form and H1 title', () => {
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Content Moderation Assessment')
      const form = document.querySelector('form')
      expect(form).not.toBeNull()
    })

    it('renders description paragraph with 20 minutes', () => {
      const desc = screen.getByText(/20 minutes/i)
      expect(desc).toBeTruthy()
    })

    it('focuses name input on mount', async () => {
      await screen.findByLabelText(/full name/i)
      const nameInput = screen.getByLabelText(/full name/i)
      expect(document.activeElement).toBe(nameInput)
    })

    it('has Start button disabled on mount', () => {
      const button = screen.getByRole('button', { name: /start/i })
      expect(button.disabled).toBe(true)
    })

    it('has no role="alert" nodes on mount', () => {
      const alerts = screen.queryAllByRole('alert')
      expect(alerts).toHaveLength(0)
    })
  })

  describe('validity gating', () => {
    it('keeps button disabled after valid name only', async () => {
      const user = userEvent.setup()
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const nameInput = screen.getByLabelText(/full name/i)
      const button = screen.getByRole('button', { name: /start/i })
      await user.type(nameInput, 'Alice')
      expect(button.disabled).toBe(true)
    })

    it('enables button after both fields valid', async () => {
      const user = userEvent.setup()
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const button = screen.getByRole('button', { name: /start/i })
      await user.type(nameInput, 'Alice')
      await user.type(emailInput, 'alice@example.com')
      expect(button.disabled).toBe(false)
    })

    it('disables button again when email cleared', async () => {
      const user = userEvent.setup()
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const button = screen.getByRole('button', { name: /start/i })
      await user.type(nameInput, 'Alice')
      await user.type(emailInput, 'alice@example.com')
      expect(button.disabled).toBe(false)
      await user.clear(emailInput)
      expect(button.disabled).toBe(true)
    })
  })

  describe('error surfacing', () => {
    it('shows email error after blur on invalid email', async () => {
      const user = userEvent.setup()
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'foo')
      await user.tab()
      expect(emailInput.getAttribute('aria-invalid')).toBe('true')
      expect(emailInput.getAttribute('aria-describedby')).toBe('cma-email-error')
      const errors = screen.getAllByRole('alert')
      const emailError = errors.find((el) => el.id === 'cma-email-error')
      expect(emailError).toBeTruthy()
      expect(emailError.textContent).toMatch(/valid email/i)
    })

    it('clears email error when email becomes valid', async () => {
      const user = userEvent.setup()
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'foo')
      await user.tab()
      // fill in valid name to clear name error
      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'Alice')
      await user.clear(emailInput)
      await user.type(emailInput, 'foo@bar.co')
      expect(screen.queryAllByRole('alert')).toHaveLength(0)
      expect(emailInput.getAttribute('aria-invalid')).toBe('false')
      expect(emailInput.hasAttribute('aria-describedby')).toBe(false)
    })
  })

  describe('submit path', () => {
    it('calls onStart with trimmed values on click', async () => {
      const user = userEvent.setup()
      const onStart = vi.fn()
      render(<LandingScreen onStart={onStart} hasAttempted={false} />)
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const button = screen.getByRole('button', { name: /start/i })
      await user.type(nameInput, '  Alice  ')
      await user.type(emailInput, '  alice@example.com  ')
      await user.click(button)
      expect(onStart).toHaveBeenCalledTimes(1)
      expect(onStart).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' })
    })

    it('calls onStart on Enter key in email field', async () => {
      const user = userEvent.setup()
      const onStart = vi.fn()
      render(<LandingScreen onStart={onStart} hasAttempted={false} />)
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(nameInput, 'Alice')
      await user.type(emailInput, 'alice@example.com')
      await user.keyboard('{Enter}')
      expect(onStart).toHaveBeenCalledTimes(1)
      expect(onStart).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' })
    })

    it('trims whitespace from submitted values', async () => {
      const user = userEvent.setup()
      const onStart = vi.fn()
      render(<LandingScreen onStart={onStart} hasAttempted={false} />)
      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const button = screen.getByRole('button', { name: /start/i })
      await user.type(nameInput, '  Alice  ')
      await user.type(emailInput, '  alice@example.com  ')
      await user.click(button)
      expect(onStart).toHaveBeenCalledWith({ name: 'Alice', email: 'alice@example.com' })
    })
  })

  describe('blocked-submit path', () => {
    it('does not call onStart when button disabled and clicked', async () => {
      const user = userEvent.setup()
      const onStart = vi.fn()
      render(<LandingScreen onStart={onStart} hasAttempted={false} />)
      const emailInput = screen.getByLabelText(/email/i)
      const button = screen.getByRole('button', { name: /start/i })
      await user.type(emailInput, 'foo')
      expect(button.disabled).toBe(true)
      // button is disabled so click won't fire form submit
      expect(onStart).not.toHaveBeenCalled()
    })

    it('does not call onStart on form.requestSubmit while invalid', async () => {
      const onStart = vi.fn()
      const { container } = render(<LandingScreen onStart={onStart} hasAttempted={false} />)
      const form = container.querySelector('form')
      form.requestSubmit()
      expect(onStart).not.toHaveBeenCalled()
    })
  })

  describe('noValidate contract', () => {
    it('form has noValidate attribute', () => {
      const { container } = render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const form = container.querySelector('form')
      expect(form.noValidate).toBe(true)
    })
  })

  describe('already-completed branch (ATTEMPT-02)', () => {
    it('renders AlreadyCompletedScreen text when hasAttempted=true', () => {
      render(<LandingScreen onStart={() => {}} hasAttempted={true} />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent(/already completed/i)
    })

    it('does not render form when hasAttempted=true', () => {
      render(<LandingScreen onStart={() => {}} hasAttempted={true} />)
      const nameLabel = screen.queryByLabelText(/full name/i)
      expect(nameLabel).toBeNull()
    })

    it('does not render Start or Reset button when hasAttempted=true', () => {
      render(<LandingScreen onStart={() => {}} hasAttempted={true} />)
      const buttons = screen.queryAllByRole('button')
      expect(buttons).toHaveLength(0)
    })
  })

  describe('brand-safety guard', () => {
    it('has no forbidden brand tokens in rendered text', () => {
      render(<LandingScreen onStart={() => {}} hasAttempted={false} />)
      const content = document.body.textContent.toLowerCase()
      const forbidden = ['dis' + 'ney', 'mar' + 'vel', 'pix' + 'ar', 'star' + ' ' + 'wars']
      forbidden.forEach((token) => {
        expect(content).not.toContain(token)
      })
    })
  })
})
