import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import L1Chip from '../../../src/components/tagging/L1Chip.jsx'

const category = {
  id: 'A',
  label: 'CatA',
  definition: 'DefA',
  subcategories: [
    { id: 'A.1', label: 'SubA1', definition: 'D-A1', example: 'E-A1' },
  ],
}

describe('L1Chip', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  })

  it('renders label as checkbox', () => {
    render(<L1Chip category={category} isSelected={false} selectedL2={[]} onToggleL1={() => {}} onToggleL2={() => {}} />)
    expect(screen.getByRole('checkbox', { name: 'CatA' })).toBeTruthy()
  })

  it('hover shows definition tooltip', async () => {
    const user = userEvent.setup()
    render(<L1Chip category={category} isSelected={false} selectedL2={[]} onToggleL1={() => {}} onToggleL2={() => {}} />)
    await user.hover(screen.getByRole('checkbox', { name: 'CatA' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('DefA')
  })

  it('focus shows definition tooltip', async () => {
    const user = userEvent.setup()
    render(<L1Chip category={category} isSelected={false} selectedL2={[]} onToggleL1={() => {}} onToggleL2={() => {}} />)
    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('DefA')
  })

  it('unhover hides tooltip', async () => {
    const user = userEvent.setup()
    render(<L1Chip category={category} isSelected={false} selectedL2={[]} onToggleL1={() => {}} onToggleL2={() => {}} />)
    const chip = screen.getByRole('checkbox', { name: 'CatA' })
    await user.hover(chip)
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.unhover(chip)
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull())
  })
})
