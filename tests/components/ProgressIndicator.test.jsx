import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

let mockCurrentVideoIndex = 0

vi.mock('../../src/stores/useAssessmentStore.js', () => ({
  default: (selector) => {
    if (typeof selector === 'function') {
      return selector({ currentVideoIndex: mockCurrentVideoIndex })
    }
    return { currentVideoIndex: mockCurrentVideoIndex }
  },
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

import ProgressIndicator from '../../src/components/ProgressIndicator.jsx'

describe('ProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentVideoIndex = 0
  })

  it('renders "Video 2 of 5" when currentVideoIndex is 1', () => {
    mockCurrentVideoIndex = 1
    render(React.createElement(ProgressIndicator))
    expect(screen.getByText('Video 2 of 5')).toBeInTheDocument()
  })

  it('renders "Video 1 of 5" when currentVideoIndex is 0', () => {
    mockCurrentVideoIndex = 0
    render(React.createElement(ProgressIndicator))
    expect(screen.getByText('Video 1 of 5')).toBeInTheDocument()
  })

  it('renders "Video 5 of 5" at last index', () => {
    mockCurrentVideoIndex = 4
    render(React.createElement(ProgressIndicator))
    expect(screen.getByText('Video 5 of 5')).toBeInTheDocument()
  })
})
