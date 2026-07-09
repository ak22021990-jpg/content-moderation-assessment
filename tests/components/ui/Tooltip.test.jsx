import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Tooltip from '../../../src/components/ui/Tooltip.jsx'

describe('Tooltip', () => {
  let matchMediaStub

  beforeEach(() => {
    matchMediaStub = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    window.matchMedia = matchMediaStub
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows tooltip on mouse enter', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Definition text">
        <button>Hover me</button>
      </Tooltip>
    )
    await user.hover(screen.getByRole('button', { name: 'Hover me' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Definition text')
  })

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Definition text">
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByRole('button', { name: 'Hover me' })
    await user.hover(trigger)
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.unhover(trigger)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('shows tooltip on focus', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Focus definition">
        <button>Focus me</button>
      </Tooltip>
    )
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Focus definition')
  })

  it('hides tooltip on blur', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Focus definition">
        <button>Focus me</button>
      </Tooltip>
    )
    await user.tab()
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.tab()
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('respects reduced motion', async () => {
    matchMediaStub.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
    const user = userEvent.setup()
    render(
      <Tooltip content="Reduced motion">
        <button>Hover me</button>
      </Tooltip>
    )
    await user.hover(screen.getByRole('button', { name: 'Hover me' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Reduced motion')
  })
})
