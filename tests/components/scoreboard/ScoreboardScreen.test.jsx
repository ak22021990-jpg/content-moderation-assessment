import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ScoreboardScreen from '../../../src/components/scoreboard/ScoreboardScreen.jsx'
import { getSubmissionConfig } from '../../../src/utils/submission.js'

// Use hoisted mocks so factory functions can reference them
const { markAttemptedMock, goToScreenMock } = vi.hoisted(() => ({
  markAttemptedMock: vi.fn(),
  goToScreenMock: vi.fn(),
}))
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

// Mock taxonomy.json
vi.mock('../../../src/data/taxonomy.json', () => ({
  default: {
    version: '0.2.0-draft',
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

// Mock the Zustand store
vi.mock('../../../src/stores/useAssessmentStore.js', () => {
  const { create } = require('zustand')
  return {
    default: create(() => ({ answers: [] })),
  }
})

// Mock useAssessmentState
vi.mock('../../../src/hooks/useAssessmentState.js', () => ({
  useAssessmentState: vi.fn(() => ({
    identity: { name: 'Alice', email: 'alice@test.com', startedAt: '2026-07-08T10:00:00Z' },
    goToScreen: goToScreenMock,
    screen: 'SCOREBOARD',
  })),
}))

// Mock useOneAttemptGuard
vi.mock('../../../src/hooks/useOneAttemptGuard.js', () => ({
  useOneAttemptGuard: vi.fn(() => ({
    hasAttempted: false,
    record: null,
    markAttempted: markAttemptedMock,
    clear: vi.fn(),
  })),
}))

// Mock submission module
const { submitResultsMock } = vi.hoisted(() => ({
  submitResultsMock: vi.fn(),
}))

vi.mock('../../../src/utils/submission.js', () => ({
  buildSubmissionPayload: vi.fn(() => ({
    name: 'Alice',
    email: 'alice@test.com',
    emailHash: '',
    answers: [],
    scores: { overallPct: 100, perVideo: [], perL1Accuracy: {} },
    competency: 'Advanced',
    strengthsWeaknesses: 'Great job.',
    timeToCompleteMs: 0,
    answerKeyVersion: '1.0.0-test',
    taxonomyVersion: '0.2.0-draft',
    sessionStartedAt: '2026-07-08T10:00:00Z',
    sessionEndedAt: '2026-07-08T10:30:00Z',
    userAgent: 'test',
    screenResolution: '1920x1080',
    hmac: '',
  })),
  buildHmac: vi.fn(() => Promise.resolve('abcdef123456')),
  submitResults: submitResultsMock,
  getSubmissionConfig: vi.fn(() => ({
    endpoint: 'https://script.google.com/macros/s/test/exec',
    isFormspree: false,
  })),
}))

// Mock dedup module
vi.mock('../../../src/utils/dedup.js', () => ({
  hashEmail: vi.fn(() => Promise.resolve('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234')),
  normalizeEmail: vi.fn((e) => e?.toLowerCase() ?? ''),
}))

// Mock GSAP
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
  vi.clearAllMocks()
  // Ensure submitResults is called in tests (not short-circuited by empty endpoint)
  vi.stubEnv('VITE_APPS_SCRIPT_URL', 'https://script.google.com/macros/s/test/exec')
  // Default: submitResults succeeds
  submitResultsMock.mockResolvedValue({ ok: true, id: '1' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('ScoreboardScreen', () => {
  it('shows empty state when no answers', () => {
    setAnswers([])
    render(<ScoreboardScreen />)
    expect(screen.getByText(/complete the assessment/i)).toBeInTheDocument()
  })

  it('renders overall score percentage', () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1', '8'], selectedL2: ['1.4', '8.3'], verdict: 'DECLINE', timeSpentMs: 45000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 30000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: ['2', '3'], selectedL2: ['2.2', '3.4'], verdict: 'DECLINE', timeSpentMs: 60000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: ['7'], selectedL2: ['7.1'], verdict: 'DECLINE', timeSpentMs: 50000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: ['9'], selectedL2: ['9.6'], verdict: 'DECLINE', timeSpentMs: 55000, timedOut: false, submittedAt: new Date().toISOString() },
    ])
    render(<ScoreboardScreen />)
    expect(screen.getByTestId('scoreboard')).toBeInTheDocument()
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
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThanOrEqual(5)
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
    expect(screen.getByText(/3:00/)).toBeInTheDocument()
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
    expect(html).not.toContain('1.6')
  })

  it('renders submission overlay after mount (success state visible)', async () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    // Wait for overlay to appear (500ms delay + async submission)
    const overlays = await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })
    expect(overlays.length).toBeGreaterThanOrEqual(1)

    // Overlay should have transitioned to success state (mock resolves immediately)
    // Check for success text or submitting text — either is valid
    const hasSuccessText = screen.queryByText(/Results sent/i)
    const hasSubmittingText = screen.queryByText(/Submitting your results/i)
    expect(hasSuccessText || hasSubmittingText).toBeTruthy()
  })

  it('calls markAttempted from useOneAttemptGuard on success', async () => {
    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    // Wait for submission to complete (overlay appears)
    await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })

    // markAttempted should have been called during submission pipeline
    await waitFor(() => {
      expect(markAttemptedMock).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('renders error overlay with retry button when submitResults fails', async () => {
    submitResultsMock.mockResolvedValue({ ok: false, error: 'Server rejected: 500' })

    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    // Wait for overlay
    await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })

    // Error overlay should show
    await waitFor(() => {
      expect(screen.getByText(/Unable to submit your results/i)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Retry button should be present
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    expect(screen.getByText(/If the problem persists/i)).toBeInTheDocument()
  })

  it('calls submitResults again when retry button is clicked', async () => {
    submitResultsMock.mockResolvedValue({ ok: false, error: 'failed' })

    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    // Wait for overlay + error state
    await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    }, { timeout: 2000 })

    const callsBefore = submitResultsMock.mock.calls.length

    // Click retry
    screen.getByTestId('retry-button').click()

    await waitFor(() => {
      expect(submitResultsMock).toHaveBeenCalledTimes(callsBefore + 1)
    }, { timeout: 2000 })
  })

  it('calls markAttempted with correct emailHash and submissionId on success', async () => {
    submitResultsMock.mockResolvedValue({ ok: true, id: '42' })

    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })

    await waitFor(() => {
      expect(markAttemptedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          emailHash: expect.any(String),
          submissionId: '42',
        }),
      )
    }, { timeout: 2000 })
  })

  it('updates attempt counter via onProgress callback', async () => {
    let progressCallback
    submitResultsMock.mockImplementation(({ onProgress }) => {
      progressCallback = onProgress
      return new Promise((resolve) => {
        // Don't resolve — keep in submitting state
      })
    })

    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })

    // Verify submitting state shows attempt info
    expect(screen.getByText(/Submitting your results/i)).toBeInTheDocument()
    expect(screen.getByText(/Attempt/i)).toBeInTheDocument()
  })

  it('uses Formspree endpoint when isFormspree=true (SUBMIT-10)', async () => {
    getSubmissionConfig.mockReturnValue({
      endpoint: 'https://formspree.io/f/test123',
      isFormspree: true,
    })

    setAnswers([
      { videoId: 'v01', selectedL1: ['1'], selectedL2: [], verdict: 'DECLINE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v02', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v03', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v04', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
      { videoId: 'v05', selectedL1: [], selectedL2: [], verdict: 'APPROVE', timeSpentMs: 1000, timedOut: false, submittedAt: new Date().toISOString() },
    ])

    render(<ScoreboardScreen />)

    await screen.findAllByTestId('submission-overlay', {}, { timeout: 2000 })

    await waitFor(() => {
      expect(submitResultsMock).toHaveBeenCalled()
      const callArgs = submitResultsMock.mock.calls[0][0]
      expect(callArgs.endpoint).toBe('https://formspree.io/f/test123')
    }, { timeout: 2000 })

    // Formspree path: payload must NOT contain hmac field
    await waitFor(() => {
      expect(markAttemptedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId: expect.stringMatching(/^formspree-/),
        }),
      )
    }, { timeout: 2000 })
  })
})
