import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('media-chrome/react', () => ({
  MediaController: ({ children }) => <div data-testid="media-controller">{children}</div>,
  MediaControlBar: ({ children }) => <div data-testid="control-bar">{children}</div>,
  MediaPlayButton: () => <button data-testid="play-btn">Play</button>,
  MediaTimeRange: () => <input type="range" data-testid="time-range" readOnly />,
  MediaTimeDisplay: ({ showDuration }) => (
    <span data-testid="time-display">{showDuration ? '0:00 / 0:00' : '0:00'}</span>
  ),
  MediaMuteButton: () => <button data-testid="mute-btn">Mute</button>,
  MediaVolumeRange: () => <input type="range" data-testid="volume-range" readOnly />,
  MediaFullscreenButton: () => <button data-testid="fullscreen-btn">Fullscreen</button>,
  MediaLoadingIndicator: ({ slot }) => (
    <div data-testid="loading-indicator" data-slot={slot}>Loading...</div>
  ),
}))

import VideoPlayerScreen from '../../../src/components/player/VideoPlayerScreen.jsx'

describe('VideoPlayerScreen', () => {
  describe('title bar', () => {
    it('renders video number text', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByText('Video 1 of 5')).toBeTruthy()
    })

    it('renders video title from playlist', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByText('Test Video — Content Moderation')).toBeTruthy()
    })
  })

  describe('video element', () => {
    it('has playsinline and preload="metadata" attributes', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      expect(video).toBeTruthy()
      expect(video.hasAttribute('playsinline')).toBe(true)
      expect(video.getAttribute('preload')).toBe('metadata')
    })

    it('does NOT have autoplay attribute', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      expect(video.hasAttribute('autoplay')).toBe(false)
    })

    it('has crossOrigin="" attribute', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      expect(video.getAttribute('crossorigin')).toBe('')
    })
  })

  describe('src prop', () => {
    it('uses default src from playlist', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      expect(video.getAttribute('src')).toBe('/videos/v01.mp4')
    })

    it('overrides src when prop provided', () => {
      render(<VideoPlayerScreen src="/test/custom.mp4" />)
      const video = document.querySelector('video')
      expect(video.getAttribute('src')).toBe('/test/custom.mp4')
    })
  })

  describe('controls', () => {
    it('renders play button', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByTestId('play-btn')).toBeTruthy()
    })

    it('renders seek bar', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByTestId('time-range')).toBeTruthy()
    })

    it('renders time display with showDuration', () => {
      render(<VideoPlayerScreen />)
      const display = screen.getByTestId('time-display')
      expect(display.textContent).toBe('0:00 / 0:00')
    })

    it('renders mute button', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByTestId('mute-btn')).toBeTruthy()
    })

    it('renders volume range', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByTestId('volume-range')).toBeTruthy()
    })

    it('renders fullscreen button', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByTestId('fullscreen-btn')).toBeTruthy()
    })
  })

  describe('loading state', () => {
    it('renders MediaLoadingIndicator', () => {
      render(<VideoPlayerScreen />)
      const indicator = screen.getByTestId('loading-indicator')
      expect(indicator).toBeTruthy()
      expect(indicator.getAttribute('data-slot')).toBe('centered-chrome')
    })
  })

  describe('onReady callback', () => {
    it('fires onReady when canplaythrough event dispatched on video', () => {
      const onReady = vi.fn()
      render(<VideoPlayerScreen onReady={onReady} />)
      const video = document.querySelector('video')
      fireEvent(video, new Event('canplaythrough'))
      expect(onReady).toHaveBeenCalledOnce()
    })

    it('does not fire onReady if callback not provided', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      expect(() => {
        fireEvent(video, new Event('canplaythrough'))
      }).not.toThrow()
    })
  })

  describe('onError callback', () => {
    it('fires onError when error event dispatched on video', () => {
      const onError = vi.fn()
      render(<VideoPlayerScreen onError={onError} />)
      const video = document.querySelector('video')
      fireEvent(video, new Event('error'))
      expect(onError).toHaveBeenCalledOnce()
    })
  })

  describe('error state', () => {
    it('renders error heading after video error event', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      fireEvent(video, new Event('error'))
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Video failed to load'
      )
    })

    it('renders error body text after video error event', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      fireEvent(video, new Event('error'))
      expect(
        screen.getByText('Please refresh the page to try again.')
      ).toBeTruthy()
    })

    it('renders error container with role alert', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      fireEvent(video, new Event('error'))
      expect(screen.getByRole('alert')).toBeTruthy()
    })

    it('does NOT show error UI before error event', () => {
      render(<VideoPlayerScreen />)
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  describe('brand safety', () => {
    it('rendered textContent contains no forbidden brand tokens', () => {
      render(<VideoPlayerScreen />)
      const content = document.body.textContent.toLowerCase()
      const forbidden = [
        'dis' + 'ney',
        'mar' + 'vel',
        'pix' + 'ar',
        'star' + ' ' + 'wars',
      ]
      forbidden.forEach((token) => {
        expect(content).not.toContain(token)
      })
    })
  })

  describe('container structure', () => {
    it('renders section with aria-label "Video player"', () => {
      render(<VideoPlayerScreen />)
      const section = document.querySelector('section[aria-label="Video player"]')
      expect(section).toBeTruthy()
    })

    it('renders MediaController inside player card', () => {
      render(<VideoPlayerScreen />)
      expect(screen.getByTestId('media-controller')).toBeTruthy()
    })

    it('video has slot="media" attribute', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      expect(video.getAttribute('slot')).toBe('media')
    })
  })
})
