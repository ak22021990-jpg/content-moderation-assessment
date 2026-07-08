import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { makeMockMediaController } = vi.hoisted(() => {
  return {
    makeMockMediaController: (React) => {
      const Comp = React.forwardRef(({ children }, ref) =>
        React.createElement('div', { ref, 'data-testid': 'media-controller' }, children)
      )
      Comp.displayName = 'MockMediaController'
      return Comp
    },
  }
})

vi.mock('media-chrome/react', () => ({
  MediaController: makeMockMediaController(React),
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

  describe('track elements', () => {
    it('renders thumbnail track with kind="metadata"', () => {
      render(<VideoPlayerScreen />)
      const thumbTrack = document.querySelector('track[label="thumbnails"]')
      expect(thumbTrack).toBeTruthy()
      expect(thumbTrack.kind).toBe('metadata')
    })

    it('renders chapters track with kind="chapters"', () => {
      render(<VideoPlayerScreen />)
      const chaptersTrack = document.querySelector('track[kind="chapters"]')
      expect(chaptersTrack).toBeTruthy()
    })

    it('thumbnail track src matches playlist thumbsVttUrl', () => {
      render(<VideoPlayerScreen />)
      const thumbTrack = document.querySelector('track[label="thumbnails"]')
      expect(thumbTrack.getAttribute('src')).toBe('/vtt/v01.thumbs.vtt')
    })

    it('chapters track src matches playlist chaptersVttUrl', () => {
      render(<VideoPlayerScreen />)
      const chaptersTrack = document.querySelector('track[kind="chapters"]')
      expect(chaptersTrack.getAttribute('src')).toBe('/vtt/v01.chapters.vtt')
    })

    it('thumbnail track has default attribute', () => {
      render(<VideoPlayerScreen />)
      const thumbTrack = document.querySelector('track[label="thumbnails"]')
      expect(thumbTrack.hasAttribute('default')).toBe(true)
    })

    it('chapters track has default attribute', () => {
      render(<VideoPlayerScreen />)
      const chaptersTrack = document.querySelector('track[kind="chapters"]')
      expect(chaptersTrack.hasAttribute('default')).toBe(true)
    })
  })

  describe('keyboard controls', () => {
    it('registers keydown handler on controller', () => {
      const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener')
      render(<VideoPlayerScreen />)
      const keydownCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'keydown'
      )
      expect(keydownCalls.length).toBeGreaterThanOrEqual(1)
      addEventListenerSpy.mockRestore()
    })

    it('ArrowLeft seeks -5s', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      video.currentTime = 42
      const controller = screen.getByTestId('media-controller')

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      })
      controller.dispatchEvent(event)

      expect(video.currentTime).toBe(37)
      expect(event.defaultPrevented).toBe(true)
    })

    it('ArrowRight seeks +5s', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      video.currentTime = 30
      Object.defineProperty(video, 'duration', { value: 100, writable: true, configurable: true })
      const controller = screen.getByTestId('media-controller')

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      })
      controller.dispatchEvent(event)

      expect(video.currentTime).toBe(35)
      expect(event.defaultPrevented).toBe(true)
    })

    it('ArrowLeft clamps currentTime at 0', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      video.currentTime = 3
      const controller = screen.getByTestId('media-controller')

      controller.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      }))

      expect(video.currentTime).toBe(0)
    })

    it('ArrowRight clamps currentTime at duration', () => {
      render(<VideoPlayerScreen />)
      const video = document.querySelector('video')
      video.currentTime = 97
      Object.defineProperty(video, 'duration', { value: 100, writable: true, configurable: true })
      const controller = screen.getByTestId('media-controller')

      controller.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }))

      expect(video.currentTime).toBe(100)
    })

    it('does not call preventDefault on non-arrow keys', () => {
      render(<VideoPlayerScreen />)
      const controller = screen.getByTestId('media-controller')

      for (const key of ['Space', 'm', 'M']) {
        const event = new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        })
        controller.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      }
    })

    it('removes keydown listener on unmount', () => {
      const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
      const { unmount } = render(<VideoPlayerScreen />)
      unmount()
      const keydownRemovals = removeSpy.mock.calls.filter(
        ([event]) => event === 'keydown'
      )
      expect(keydownRemovals.length).toBe(1)
      removeSpy.mockRestore()
    })
  })
})
