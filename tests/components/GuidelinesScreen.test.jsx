import { render, screen } from '@testing-library/react'
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
      subcategories: [
        { id: 'A.1', label: 'SubA1', definition: 'D-A1', example: 'E-A1' },
      ],
    },
    {
      id: 'B',
      label: 'CatB',
      definition: 'DefB',
      subcategories: [
        { id: 'B.1', label: 'SubB1', definition: 'D-B1', example: 'E-B1' },
      ],
    },
  ],
}

describe('GuidelinesScreen', () => {
  describe('fixture-based rendering', () => {
    it('renders both L1 labels', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByRole('heading', { level: 3, name: 'CatA' })).toBeTruthy()
      expect(screen.getByRole('heading', { level: 3, name: 'CatB' })).toBeTruthy()
    })

    it('renders L1 definitions', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByText('DefA')).toBeTruthy()
      expect(screen.getByText('DefB')).toBeTruthy()
    })

    it('renders L2 labels, definitions, and examples', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      expect(screen.getByText('SubA1')).toBeTruthy()
      expect(screen.getByText(/D-A1/)).toBeTruthy()
      expect(screen.getByText(/E-A1/)).toBeTruthy()
      expect(screen.getByText('SubB1')).toBeTruthy()
      expect(screen.getByText(/D-B1/)).toBeTruthy()
      expect(screen.getByText(/E-B1/)).toBeTruthy()
    })

    it('renders L1 headers as h3 with correct id for aria-labelledby', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const catA = screen.getByRole('heading', { level: 3, name: 'CatA' })
      expect(catA.id).toBe('cat-A')
      const catB = screen.getByRole('heading', { level: 3, name: 'CatB' })
      expect(catB.id).toBe('cat-B')
    })

    it('renders L2 as li with strong wrapping label', () => {
      const { container } = render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const strongA1 = container.querySelector('li strong')
      expect(strongA1).toBeTruthy()
      expect(strongA1.textContent).toBe('SubA1')
    })
  })

  describe('real taxonomy integration (GUIDE-01, GUIDE-02, GUIDE-06)', () => {
    it('uses imported taxonomy.json when no taxonomy prop supplied', () => {
      render(<GuidelinesScreen onBegin={() => {}} />)
      const firstLabel = taxonomy.categories[0].label
      expect(screen.getByRole('heading', { level: 3, name: firstLabel })).toBeTruthy()
    })

    it('renders all 10 L1 labels from taxonomy.json', () => {
      render(<GuidelinesScreen onBegin={() => {}} />)
      taxonomy.categories.forEach((cat) => {
        expect(screen.getByRole('heading', { level: 3, name: cat.label })).toBeTruthy()
      })
    })

    it('renders all 65 L2 li nodes', () => {
      const { container } = render(<GuidelinesScreen onBegin={() => {}} />)
      const expectedCount = taxonomy.categories.reduce(
        (sum, cat) => sum + cat.subcategories.length,
        0
      )
      const lis = container.querySelectorAll(
        'section[aria-labelledby="cma-guidelines-categories"] li'
      )
      expect(lis.length).toBe(expectedCount)
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

  describe('brand safety', () => {
    it('rendered textContent contains no forbidden brand tokens', () => {
      render(<GuidelinesScreen onBegin={() => {}} taxonomy={fixture} />)
      const content = document.body.textContent.toLowerCase()
      const forbidden = ['dis' + 'ney', 'mar' + 'vel', 'pix' + 'ar', 'star' + ' ' + 'wars']
      forbidden.forEach((token) => {
        expect(content).not.toContain(token)
      })
    })
  })
})
