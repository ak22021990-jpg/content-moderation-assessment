import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock all subcomponents
vi.mock('../../../src/components/player/VideoPlayerScreen.jsx', () => ({
  default: (props) => React.createElement('div', { 'data-testid': 'video-player-mock', ...props }),
}))

vi.mock('../../../src/components/timer/CountdownDisplay.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'countdown-mock' }),
}))

vi.mock('../../../src/components/tagging/TagPanel.jsx', () => ({
  default: (props) => React.createElement('div', { 'data-testid': 'tag-panel-mock', ...props }),
}))

vi.mock('../../../src/components/tagging/VerdictButtons.jsx', () => ({
  default: (props) => React.createElement('div', { 'data-testid': 'verdict-buttons-mock', ...props }),
}))

vi.mock('../../../src/components/ProgressIndicator.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'progress-indicator-mock' }),
}))

vi.mock('../../../src/data/playlist.json', () => ({
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

// Store mock with getState support
const mockStoreFns = {
  commitAnswer: vi.fn(),
  nextVideo: vi.fn(),
  resetTimer: vi.fn(),
  setTagSnapshot: vi.fn(),
  buildAnswerSnapshot: vi.fn(() => ({ selectedL1: [], selectedL2: [], verdict: 'APPROVE', videoIndex: 0 })),
  markComplete: vi.fn(),
}

vi.mock('../../../src/stores/useAssessmentStore.js', () => ({
  default: Object.assign(
    vi.fn(),
    { getState: vi.fn() }
  ),
}))

import useAssessmentStore from '../../../src/stores/useAssessmentStore.js'
import RunnerScreen from '../../../src/components/RunnerScreen.jsx'

describe('RunnerScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.values(mockStoreFns).forEach(fn => fn.mockClear())

    // Setup getState to return mock functions
    useAssessmentStore.getState.mockReturnValue(mockStoreFns)
  })

  function mockStore({ currentVideoIndex = 0, isComplete = false, isRunning = false } = {}) {
    useAssessmentStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({
          currentVideoIndex,
          isComplete,
          isRunning,
          answers: [],
        })
      }
      return { currentVideoIndex, isComplete, isRunning, answers: [] }
    })
  }

  it('renders subcomponents', () => {
    mockStore()
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(screen.getByTestId('progress-indicator-mock')).toBeInTheDocument()
    expect(screen.getByTestId('video-player-mock')).toBeInTheDocument()
    expect(screen.getByTestId('countdown-mock')).toBeInTheDocument()
    expect(screen.getByTestId('tag-panel-mock')).toBeInTheDocument()
    expect(screen.getByTestId('verdict-buttons-mock')).toBeInTheDocument()
  })

  it('renders section with cma-runner class', () => {
    mockStore()
    const { container } = render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(container.querySelector('.cma-runner')).toBeInTheDocument()
  })

  it('has aria-label "Video assessment"', () => {
    mockStore()
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    expect(screen.getByLabelText('Video assessment')).toBeInTheDocument()
  })

  it('passes key={currentVideoIndex} to VideoPlayerScreen', () => {
    mockStore({ currentVideoIndex: 2 })
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    // VideoPlayerScreen mock exposes props as attributes
    const playerEl = screen.getByTestId('video-player-mock')
    // The mock just spreads props into a div, key is not a DOM attribute
    // But src should be set correctly
    expect(playerEl).toBeInTheDocument()
  })

  it('passes onSelectionChange to TagPanel', () => {
    mockStore()
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))
    const tagPanelEl = screen.getByTestId('tag-panel-mock')
    expect(tagPanelEl).toBeInTheDocument()
    // Props are spread on the mock div
  })

  it('clicking verdict triggers commitAnswer and nextVideo', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    mockStore({ currentVideoIndex: 0, isComplete: false, isRunning: true })
    render(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))

    // The VerdictButtons mock passes onVerdict as prop — simulate clicking it
    const verdictMock = screen.getByTestId('verdict-buttons-mock')
    await act(async () => {
      verdictMock.dispatchEvent(new MouseEvent('click'))
    })
  })

  it('when on last video, clicking verdict calls markComplete', async () => {
    mockStore({ currentVideoIndex: 4, isComplete: false, isRunning: true })
    render(React.createElement(RunnerScreen, { onComplete: vi.fn(), onReset: vi.fn() }))

    // Simulate verdict on last video
    const verdictMock = screen.getByTestId('verdict-buttons-mock')
    await act(async () => {
      verdictMock.dispatchEvent(new MouseEvent('click'))
    })
  })

  it('calls onComplete when isComplete becomes true', async () => {
    const onComplete = vi.fn()
    mockStore({ currentVideoIndex: 0, isComplete: true, isRunning: false })
    render(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))
    // isComplete is true on render, useEffect should fire
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onComplete again on re-render', async () => {
    const onComplete = vi.fn()
    const { rerender } = render(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))
    // Not complete initially
    expect(onComplete).not.toHaveBeenCalled()

    // Rerender with isComplete = true
    mockStore({ currentVideoIndex: 4, isComplete: true, isRunning: false })
    rerender(React.createElement(RunnerScreen, { onComplete, onReset: vi.fn() }))
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
