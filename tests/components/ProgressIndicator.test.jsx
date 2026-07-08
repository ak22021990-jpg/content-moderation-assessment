import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../../../src/stores/useAssessmentStore.js', () => ({
  default: vi.fn(),
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

import useAssessmentStore from '../../../src/stores/useAssessmentStore.js'
import ProgressIndicator from '../../../src/components/ProgressIndicator.jsx'

describe('ProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockStore({ currentVideoIndex = 0 } = {}) {
    useAssessmentStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector({ currentVideoIndex })
      }
      return { currentVideoIndex }
    })
  }

  it('renders "Video 2 of 5" when currentVideoIndex is 1', () => {
    mockStore({ currentVideoIndex: 1 })
    render(React.createElement(ProgressIndicator))
    expect(screen.getByText('Video 2 of 5')).toBeInTheDocument()
  })

  it('renders "Video 1 of 5" when currentVideoIndex is 0', () => {
    mockStore({ currentVideoIndex: 0 })
    render(React.createElement(ProgressIndicator))
    expect(screen.getByText('Video 1 of 5')).toBeInTheDocument()
  })

  it('renders "Video 5 of 5" at last index', () => {
    mockStore({ currentVideoIndex: 4 })
    render(React.createElement(ProgressIndicator))
    expect(screen.getByText('Video 5 of 5')).toBeInTheDocument()
  })
})
