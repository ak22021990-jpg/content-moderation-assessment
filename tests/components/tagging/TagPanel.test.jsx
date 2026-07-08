import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TagPanel from '../../../src/components/tagging/TagPanel.jsx'

// Mock useAssessmentStore to prevent Zustand import issues
vi.mock('../../../src/stores/useAssessmentStore', () => ({
  default: vi.fn(() => ({ isRunning: true })),
}))

describe('TagPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 10 L1 category chips', () => {
    render(<TagPanel />)
    const chips = screen.getAllByRole('checkbox')
    // Initially only L1 chips are visible (10 categories)
    const l1Chips = chips.filter(c => c.className.includes('cma-tag-chip--l1'))
    expect(l1Chips).toHaveLength(10)
  })

  it('does NOT render L2 chips initially', () => {
    render(<TagPanel />)
    const chips = screen.getAllByRole('checkbox')
    const l2Chips = chips.filter(c => c.className.includes('cma-tag-chip--l2'))
    expect(l2Chips).toHaveLength(0)
  })

  it('clicking L1 reveals its L2 sub-categories', async () => {
    const user = userEvent.setup()
    render(<TagPanel />)
    const copyrightChip = screen.getByRole('checkbox', { name: /copyright & ip/i })
    await user.click(copyrightChip)
    // After clicking, L2 chips appear for Copyright & IP (7 subcategories)
    const allChips = screen.getAllByRole('checkbox')
    const l2Chips = allChips.filter(c => c.className.includes('cma-tag-chip--l2'))
    expect(l2Chips.length).toBeGreaterThan(0)
    expect(l2Chips).toHaveLength(7) // Copyright & IP has 7 subs
  })

  it('deselecting L1 hides L2 chips', async () => {
    const user = userEvent.setup()
    render(<TagPanel />)
    const copyrightChip = screen.getByRole('checkbox', { name: /copyright & ip/i })
    // Select
    await user.click(copyrightChip)
    let allChips = screen.getAllByRole('checkbox')
    let l2Chips = allChips.filter(c => c.className.includes('cma-tag-chip--l2'))
    expect(l2Chips).toHaveLength(7)
    // Deselect
    await user.click(copyrightChip)
    allChips = screen.getAllByRole('checkbox')
    l2Chips = allChips.filter(c => c.className.includes('cma-tag-chip--l2'))
    expect(l2Chips).toHaveLength(0)
  })

  it('Space key toggles L1 chip', () => {
    render(<TagPanel />)
    const hateChip = screen.getByRole('checkbox', { name: /hate & harassment/i })
    expect(hateChip).toHaveAttribute('aria-checked', 'false')
    fireEvent.keyDown(hateChip, { key: ' ' })
    const toggled = screen.getByRole('checkbox', { name: /hate & harassment/i })
    expect(toggled).toHaveAttribute('aria-checked', 'true')
  })

  it('Enter key toggles L1 chip', () => {
    render(<TagPanel />)
    const violenceChip = screen.getByRole('checkbox', { name: /violence & graphic content/i })
    expect(violenceChip).toHaveAttribute('aria-checked', 'false')
    fireEvent.keyDown(violenceChip, { key: 'Enter' })
    const toggled = screen.getByRole('checkbox', { name: /violence & graphic content/i })
    expect(toggled).toHaveAttribute('aria-checked', 'true')
  })

  it('zero L1 selection renders without error', () => {
    const { container } = render(<TagPanel />)
    expect(container.querySelector('.cma-tag-panel')).toBeTruthy()
    const chips = screen.getAllByRole('checkbox')
    const selectedChips = chips.filter(c => c.getAttribute('aria-checked') === 'true')
    expect(selectedChips).toHaveLength(0)
  })

  it('L1 chips have role="checkbox" and aria-checked', () => {
    render(<TagPanel />)
    const chips = screen.getAllByRole('checkbox')
    const l1Chips = chips.filter(c => c.className.includes('cma-tag-chip--l1'))
    for (const chip of l1Chips) {
      expect(chip).toHaveAttribute('role', 'checkbox')
      expect(chip).toHaveAttribute('aria-checked')
    }
  })

  it('L2 chips have role="checkbox" and aria-checked when visible', async () => {
    const user = userEvent.setup()
    render(<TagPanel />)
    // Click Copyright & IP to reveal L2s
    await user.click(screen.getByRole('checkbox', { name: /copyright & ip/i }))
    const allChips = screen.getAllByRole('checkbox')
    const l2Chips = allChips.filter(c => c.className.includes('cma-tag-chip--l2'))
    for (const chip of l2Chips) {
      expect(chip).toHaveAttribute('role', 'checkbox')
      expect(chip).toHaveAttribute('aria-checked')
    }
  })

  it('data-driven: renders taxonomy labels correctly', () => {
    render(<TagPanel />)
    // Verify presence of specific L1 labels from taxonomy
    expect(screen.getByRole('checkbox', { name: /copyright & ip/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /hate & harassment/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /violence & graphic content/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /sexual & nudity/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /minor safety/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /regulated goods & activities/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /misinformation & deceptive sync/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /spam & manipulation/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /brand safety \(garm\)/i })).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /community standards \(platform-specific\)/i })).toBeTruthy()
  })
})
