import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreboardScreen from '../../../src/components/scoreboard/ScoreboardScreen.jsx'

// Mock answerKeys.json — must not leak to DOM (BOARD-07)
vi.mock('../../../src/data/answerKeys.json', () => ({
  default: {
    version: '1.0.0-test',
    videos: [
      { id: 'v01', verdict: 'DECLINE', l1Tags: ['1', '8'], l2Tags: ['1.4', '1.6', '8.3'] },
      { id: 'v02', verdict: 'APPROVE', l1Tags: [], l2Tags: [] },
      { id: 'v03', verdict: 'DECLINE', l1Tags: ['2', '3'], l2Tags: ['2.2', '3.4'] },
      { id: 'v04', verdict: 'DECLINE', l1Tags: ['7'], l2Tags: ['7.1'] },
      { id: 'v05', verdict: 'DECLINE', l1Tags: ['9'], l2Tags: ['9.6'] },
    ],
  },
}))

// Mock taxonomy.json — needed for PerL1Accuracy label resolution
vi.mock('../../../src/data/taxonomy.json', () => ({
  default: {
    categories: [
      { id: '1', label: 'Copyright & IP' },
      { id: '2', label: 'Hate & Harassment' },
      { id: '3', label: 'Violence & Graphic' },
      { id: '7', label: 'Misinformation' },
      { id: '8', label: 'Spam & Manipulation' },
      { id: '9', label: 'Brand Safety' },
    ],
  },
}))

// Mock the Zustand store — hook reads via useAssessmentStore
vi.mock('../../../src/stores/useAssessmentStore.js', () => {
  const { create } = require('zustand')
  return {
    default: create(() => ({ answers: [] })),
  }
})

// Mock GSAP — don't animate in tests
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    from: vi.fn(),
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: (fn) => { fn?.() },
}))

// Mock dynamic Lottie imports
vi.mock('lottie-react', () => ({
  default: () => null,
}))

import useAssessmentStore from '../../../src/stores/useAssessmentStore.js'

function setAnswers(answers) {
  useAssessmentStore.setState({ answers })
}

beforeEach(() => {
  useAssessmentStore.setState({ answers: [] })
})

describe('ScoreboardScreen', () => {
  it('shows empty state when no answers', () => {
    setAnswers([])
    render(<ScoreboardScreen />)
    expect(screen.getByText(/complete the assessment/i)).toBeInTheDocument()
  })

  it('renders overall score percentage', () => {
    // Perfect score on all 5 videos
    setAnswers([
      { videoId: 'v01', selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'], verdict: 'DECLINE', timeSpentMs: 45000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 30000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: ['2', '3'], selectedL2: ['2.2', '3.4'], verdict: 'DECLINE', timeSpentMs: 60000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: ['7'], selectedL2: ['7.1'], verdict: 'DECLINE', timeSpentMs: 50000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: ['9'], selectedL2: ['9.6'], verdict: 'DECLINE', timeSpentMs: 55000, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    render(<ScoreboardScreen />)
    expect(screen.getByTestId('scoreboard')).toBeInTheDocument()
    // Overall score value and L1 bars may both show 100% — at least one 100% present
    const pctElements = screen.getAllByText(/^100%$/)
    expect(pctElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders competency tier badge', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    const { container } = render(<ScoreboardScreen />)
    // Tier badge pill contains one of Advanced/Proficient/Foundation
    // Competency paragraph may also contain "foundation" — target badge only
    const badges = container.querySelectorAll('.sb-tier-badge')
    expect(badges.length).toBe(1)
    expect(badges[0].textContent).toMatch(/ADVANCED|PROFICIENT|FOUNDATION/i)
  })

  it('renders per-L1 accuracy rows', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'], verdict: 'DECLINE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    render(<ScoreboardScreen />)
    expect(screen.getByText(/Category Accuracy/i)).toBeInTheDocument()
  })

  it('renders per-video summary table', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    render(<ScoreboardScreen />)
    expect(screen.getByText(/Per-Video Summary/i)).toBeInTheDocument()
    // Check table rendered with rows
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThanOrEqual(5) // header + 5 data rows
  })

  it('renders timing stats', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 30000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 45000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 20000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 50000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 35000, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    render(<ScoreboardScreen />)
    expect(screen.getByText(/Timing/i)).toBeInTheDocument()
    expect(screen.getByText(/3:00/)).toBeInTheDocument() // 180000ms = 3:00 total
  })

  it('shows timed-out badge on per-video breakdown', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 180000, timedOut: true, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    render(<ScoreboardScreen />)
    expect(screen.getByText(/Timed out/i)).toBeInTheDocument()
  })

  it('does NOT reveal answer key data in DOM (BOARD-07)', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: ['1.4'], verdict: 'DECLINE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 0, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    const { container } = render(<ScoreboardScreen />)
    const html = container.innerHTML
    // answerKeys.json v01 DECLINE has l2Tags ["1.4","1.6","8.3"]
    // "1.6" must never appear as raw key data in DOM
    expect(html).not.toContain('1.6')
  })
})
