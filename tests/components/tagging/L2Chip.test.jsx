import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import L2Chip from '../../../src/components/tagging/L2Chip.jsx'

const subcategory = {
  id: 'A.1',
  label: 'SubA1',
  definition: 'D-A1',
  example: 'E-A1',
}

describe('L2Chip', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  })

  it('renders label as checkbox', () => {
    render(<L2Chip subcategory={subcategory} isSelected={false} onToggle={() => {}} />)
    expect(screen.getByRole('checkbox', { name: 'SubA1' })).toBeTruthy()
  })

  it('hover shows definition and example tooltip', async () => {
    const user = userEvent.setup()
    render(<L2Chip subcategory={subcategory} isSelected={false} onToggle={() => {}} />)
    await user.hover(screen.getByRole('checkbox', { name: 'SubA1' }))
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('D-A1')
    expect(tooltip).toHaveTextContent('E-A1')
  })

  it('focus shows tooltip', async () => {
    const user = userEvent.setup()
    render(<L2Chip subcategory={subcategory} isSelected={false} onToggle={() => {}} />)
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('D-A1')
  })

  it('unhover hides tooltip', async () => {
    const user = userEvent.setup()
    render(<L2Chip subcategory={subcategory} isSelected={false} onToggle={() => {}} />)
    const chip = screen.getByRole('checkbox', { name: 'SubA1' })
    await user.hover(chip)
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.unhover(chip)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })

  it('tooltip omits example when absent', async () => {
    const user = userEvent.setup()
    render(<L2Chip subcategory={{ ...subcategory, example: undefined }} isSelected={false} onToggle={() => {}} />)
    await user.hover(screen.getByRole('checkbox', { name: 'SubA1' }))
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('D-A1')
    expect(tooltip).not.toHaveTextContent('Example:')
  })
})
