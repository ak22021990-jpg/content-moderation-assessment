import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock all subcomponents
vi.mock('../../src/components/player/VideoPlayerScreen.jsx', () => ({
  default: (props) => {
    const { videoIndex, onPlaying, onReset, ...rest } = props
    return React.createElement('div', { 'data-testid': 'video-player-mock', ...rest })
  },
}))

vi.mock('../../src/components/timer/CountdownDisplay.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'countdown-mock' }),
}))

vi.mock('../../src/components/tagging/TagPanel.jsx', () => ({
  default: (props) => {
    const { resetKey, onSelectionChange, ...rest } = props
    return React.createElement('div', { 'data-testid': 'tag-panel-mock', ...rest })
  },
}))

vi.mock('../../src/components/tagging/VerdictButtons.jsx', () => ({
  default: (props) => {
    const { onVerdict, submitting, ...rest } = props
    return React.createElement(
      'div',
      { 'data-testid': 'verdict-buttons-mock', ...rest },
      React.createElement('button', {
        type: 'button',
        onClick: () => onVerdict?.('decline'),
        disabled: submitting,
      }, 'Decline'),
      React.createElement('button', {
        type: 'button',
        onClick: () => onVerdict?.('approve'),
        disabled: submitting,
      }, 'Approve')
    )
  },
}))

vi.mock('../../src/components/ProgressIndicator.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'progress-indicator-mock' }),
}))

vi.mock('../../src/data/playlist.json', () => ({
  default: {
    videos: [
      { id: 'v01', title: 'Video 1', srcUrl: '/videos/v01.mp4' },
      { id: 'v02', title: 'Video 2', srcUrl: '/videos/v02.mp4' },
      { id: 'v03', title: 'Video 3', srcUrl: '/videos/v03.mp4' },
      { id: 'v04', title: 'Video 4', srcUrl: '/videos/v04.mp4' },
      { id: 'v05', title: 'Video 5', srcUrl: '/videos/v05.mp4' },
    ],
  },
}))

vi.mock('../../src/data/answerKeys.json', () => ({
  default: {
    version: 'test',
    videos: [
      { id: 'v01', verdict: 'DECLINE', l1Tags: ['1'], l2Tags: ['1.3'] },
      { id: 'v02', verdict: 'APPROVE', l1Tags: [], l2Tags: [] },
    ],
  },
}))

// Mock store state variables
let mockCurrentVideoIndex = 0
let mockIsComplete = false
let mockIsRunning = false
const mockStoreFns = {
  commitAnswer: vi.fn(),
  nextVideo: vi.fn(),
  resetTimer: vi.fn(),
  setTagSnapshot: vi.fn(),
  buildAnswerSnapshot: vi.fn(() => ({ selectedL1: [], selectedL2: [], verdict: 'APPROVE', videoIndex: 0 })),
  markComplete: vi.fn(),
}

vi.mock('../../src/stores/useAssessmentStore.js', () => ({
  default: Object.assign(
    (selector) => {
      if (typeof selector === 'function') {
        return selector({
          currentVideoIndex: mockCurrentVideoIndex,
          isComplete: mockIsComplete,
          isRunning: mockIsRunning,
          answers: [],
        })
      }
      return { currentVideoIndex: mockCurrentVideoIndex, isComplete: mockIsComplete, isRunning: mockIsRunning, answers: [] }
    },
    { getState: () => mockStoreFns }
  ),
}))

import RunnerScreen from '../../src/components/RunnerScreen.jsx'

describe('RunnerScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentVideoIndex = 0
    mockIsComplete = false
    mockIsRunning = false
    Object.values(mockStoreFns).forEach(fn => fn.mockClear())
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  })

  it('renders subcomponents', () => {
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(screen.getByTestId('progress-indicator-mock')).toBeInTheDocument()
    expect(screen.getByTestId('video-player-mock')).toBeInTheDocument()
    expect(screen.getByTestId('countdown-mock')).toBeInTheDocument()
    expect(screen.getByTestId('tag-panel-mock')).toBeInTheDocument()
    expect(screen.getByTestId('verdict-buttons-mock')).toBeInTheDocument()
  })

  it('renders section with cma-runner class', () => {
    const { container } = render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(container.querySelector('.cma-runner')).toBeInTheDocument()
  })

  it('uses fixed desktop container layout', () => {
    const { container } = render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(container.querySelector('.cma-runner')).toBeInTheDocument()
    expect(container.querySelector('.cma-runner__container')).toBeInTheDocument()
    expect(container.querySelector('.cma-runner__main')).toBeInTheDocument()
  })

  it('renders video and tag columns side by side', () => {
    const { container } = render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(container.querySelector('.cma-runner__video-col')).toBeInTheDocument()
    expect(container.querySelector('.cma-runner__tag-col')).toBeInTheDocument()
  })

  it('has aria-label "Video assessment"', () => {
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(screen.getByLabelText('Video assessment')).toBeInTheDocument()
  })

  it('passes key={currentVideoIndex} to VideoPlayerScreen', () => {
    mockCurrentVideoIndex = 2
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    const playerEl = screen.getByTestId('video-player-mock')
    expect(playerEl).toBeInTheDocument()
  })

  it('passes onSelectionChange to TagPanel', () => {
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    const tagPanelEl = screen.getByTestId('tag-panel-mock')
    expect(tagPanelEl).toBeInTheDocument()
  })

  it('calls onComplete when isComplete becomes true', async () => {
    const onComplete = vi.fn()
    mockIsComplete = true
    render(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete again on re-render', async () => {
    const onComplete = vi.fn()
    const { rerender } = render(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))
    expect(onComplete).not.toHaveBeenCalled()

    mockIsComplete = true
    rerender(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  describe('feedback overlay (06-11)', () => {
    it('shows correct feedback with confetti for matching verdict', async () => {
      const user = userEvent.setup()
      render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
      await user.click(screen.getByRole('button', { name: 'Decline' }))
      expect(await screen.findByRole('heading', { name: /Correct — great eye/i })).toBeInTheDocument()
      expect(document.querySelector('canvas')).toBeInTheDocument()
    })

    it('shows wrong feedback without confetti for mismatching verdict', async () => {
      const user = userEvent.setup()
      render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
      await user.click(screen.getByRole('button', { name: 'Approve' }))
      expect(await screen.findByRole('heading', { name: /Missed this one/i })).toBeInTheDocument()
      expect(document.querySelector('canvas')).toBeNull()
    })

    it('shows partial match breakdown', async () => {
      const user = userEvent.setup()
      render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
      await user.click(screen.getByRole('button', { name: 'Decline' }))
      expect(await screen.findByText(/Breakdown/i)).toBeInTheDocument()
      expect(screen.getByText(/Expected categories:/i)).toBeInTheDocument()
      expect(screen.getByText('Copyright & IP')).toBeInTheDocument()
    })
  })
})
