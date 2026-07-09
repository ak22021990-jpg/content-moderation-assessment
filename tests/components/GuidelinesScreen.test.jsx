import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fs from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import GuidelinesScreen from '../../src/components/GuidelinesScreen.jsx'
import taxonomy from '../../src/data/taxonomy.json'

const fixture = {
  categories: [
    {
      id: 'A',
      label: 'CatA',
      definition: 'DefA',
      iconKey: 'copyright',
      subcategories: [
        { id: 'A.1', label: 'SubA1', definition: 'D-A1', example: 'E-A1' },
      ],
    },
    {
      id: 'B',
      label: 'CatB',
      definition: 'DefB',
      iconKey: 'hate',
      subcategories: [
        { id: 'B.1', label: 'SubB1', definition: 'D-B1', example: 'E-B1' },
      ],
    },
  ],
}

describe('GuidelinesScreen', () => {
  describe('fixture-based rendering', () => {
    it('renders both L1 labels as tab buttons', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByRole('tab', { name: /CatA/i })).toBeTruthy()
      expect(screen.getByRole('tab', { name: /CatB/i })).toBeTruthy()
    })

    it('hides L2 details by default', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.queryByText('D-A1')).toBeNull()
      expect(screen.queryByText('D-B1')).toBeNull()
    })

    it('clicking an L1 tab reveals its definition and L2 details in side panel', async () => {
      const user = userEvent.setup()
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const catATab = screen.getByRole('tab', { name: /CatA/i })
      await user.click(catATab)
      expect(await screen.findByText('DefA')).toBeTruthy()
      expect(screen.getByText('SubA1')).toBeTruthy()
      expect(screen.getByText(/D-A1/)).toBeTruthy()
      expect(screen.getByText(/E-A1/)).toBeTruthy()
    })

    it('clicking a second tab switches panel content', async () => {
      const user = userEvent.setup()
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      await user.click(screen.getByRole('tab', { name: /CatA/i }))
      expect(await screen.findByText('DefA')).toBeTruthy()
      await user.click(screen.getByRole('tab', { name: /CatB/i }))
      expect(await screen.findByText('DefB')).toBeTruthy()
      await waitFor(() => expect(screen.queryByText('DefA')).toBeNull())
    })

    it('clicking the same tab collapses the panel', async () => {
      const user = userEvent.setup()
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const catATab = screen.getByRole('tab', { name: /CatA/i })
      await user.click(catATab)
      expect(await screen.findByText('DefA')).toBeTruthy()
      await user.click(catATab)
      await waitFor(() => expect(screen.queryByText('DefA')).toBeNull())
    })
  })

  describe('real taxonomy integration (GUIDE-01, GUIDE-02, GUIDE-06)', () => {
    it('uses imported taxonomy.json when no taxonomy prop supplied', () => {
      render(<GuidelinesScreen onBegin={() => {}} />)
      const firstLabel = taxonomy.categories[0].label
      expect(screen.getByRole('tab', { name: firstLabel })).toBeTruthy()
    })

    it('renders all 10 L1 tabs from taxonomy.json', () => {
      render(<GuidelinesScreen onBegin={() => {}} />)
      taxonomy.categories.forEach((cat) => {
        expect(screen.getByRole('tab', { name: cat.label })).toBeTruthy()
      })
    })

    it('renders icons for all L1 tabs', () => {
      const { container } = render(<GuidelinesScreen onBegin={() => {}} />)
      const svgs = container.querySelectorAll('[role="tab"] svg')
      expect(svgs.length).toBe(taxonomy.categories.length)
    })
  })

  describe('disclosure card (GUIDE-03, GUIDE-04, ATTEMPT-05)', () => {
    it('has section aria-labelledby="cma-guidelines-policy" with heading', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const section = document.querySelector(
        'section[aria-labelledby="cma-guidelines-policy"]'
      )
      expect(section).not.toBeNull()
      const heading = screen.getByRole('heading', { level: 2, name: 'Before you begin' })
      expect(heading).toBeTruthy()
    })

    it('contains "one-attempt assessment" (ATTEMPT-05)', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByText(/one-attempt assessment/i)).toBeTruthy()
    })

    it('contains "3-minute countdown" AND "submit automatically" (GUIDE-04)', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByText(/3-minute countdown/i)).toBeTruthy()
      expect(screen.getByText(/submit automatically/i)).toBeTruthy()
    })

    it('contains "Approve or Decline" AND "multi-select" (GUIDE-03)', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByText(/Approve or Decline/i)).toBeTruthy()
      expect(screen.getByText(/multi-select/i)).toBeTruthy()
    })
  })

  describe('advance path (GUIDE-05)', () => {
    it('Begin Assessment button is enabled on mount (no scroll gating)', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const button = screen.getByRole('button', { name: /Begin Assessment/i })
      expect(button.disabled).toBe(false)
    })

    it('clicking Begin Assessment invokes onBegin callback exactly once', async () => {
      const user = userEvent.setup()
      const onBegin = vi.fn()
      render(<GuidelinesScreen onBegin={onBegin} taxonomy={fixture} />)
      const button = screen.getByRole('button', { name: /Begin Assessment/i })
      await user.click(button)
      expect(onBegin).toHaveBeenCalledTimes(1)
    })

    it('no other element triggers onBegin', () => {
      const onBegin = vi.fn()
      render(<GuidelinesScreen onBegin={onBegin} taxonomy={fixture} />)
      expect(onBegin).not.toHaveBeenCalled()
    })
  })

  describe('no hardcoded labels (GUIDE-06)', () => {
    it('zero taxonomy L1 labels appear as hardcoded literals in source', () => {
      const src = fs.readFileSync('src/components/GuidelinesScreen.jsx', 'utf8')
      const realLabels = taxonomy.categories.map((c) => c.label)
      realLabels.forEach((label) => {
        expect(src).not.toContain(label)
      })
    })
  })
})
