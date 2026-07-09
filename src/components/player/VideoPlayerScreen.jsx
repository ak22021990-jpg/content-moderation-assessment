import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaMuteButton,
  MediaVolumeRange,
  MediaFullscreenButton,
  MediaLoadingIndicator,
} from 'media-chrome/react'
import playlist from '../../data/playlist.json'
import './VideoPlayer.css'

export default function VideoPlayerScreen({ src, videoIndex, onReady, onPlaying, onError, onReset }) {
  const [videoError, setVideoError] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)
  const controllerRef = useRef(null)

  const currentVideoIdx = videoIndex !== undefined ? videoIndex : 0
  const currentVideo = playlist.videos[currentVideoIdx] || playlist.videos[0]

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const videoSrc = src || (base + currentVideo.srcUrl)
  const thumbsVttUrl = base + currentVideo.thumbsVttUrl
  const chaptersVttUrl = base + currentVideo.chaptersVttUrl

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const handleCanPlayThrough = () => {
      setVideoReady(true)
      onReady?.()
    }

    const handleError = () => {
      setVideoError(true)
      onError?.()
    }

    videoEl.addEventListener('canplaythrough', handleCanPlayThrough)
    videoEl.addEventListener('error', handleError)

    return () => {
      videoEl.removeEventListener('canplaythrough', handleCanPlayThrough)
      videoEl.removeEventListener('error', handleError)
    }
  }, [onReady, onError])

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return
    const handlePlaying = () => {
      onPlaying?.()
    }
    videoEl.addEventListener('playing', handlePlaying)
    return () => videoEl.removeEventListener('playing', handlePlaying)
  }, [onPlaying])

  useEffect(() => {
    const controller = controllerRef.current
    if (!controller) return

    if (controller.hotkeys) {
      controller.hotkeys.add('noarrowleft', 'noarrowright')
    }

    const handler = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const videoEl = videoRef.current
        if (videoEl) videoEl.currentTime = Math.max(0, videoEl.currentTime - 5)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const videoEl = videoRef.current
        if (videoEl) {
          videoEl.currentTime = Math.min(videoEl.duration || Infinity, videoEl.currentTime + 5)
        }
      }
    }

    controller.addEventListener('keydown', handler)
    return () => controller.removeEventListener('keydown', handler)
  }, [])

  const handleDevReset = useCallback(() => {
    if (onReset) onReset()
  }, [onReset])

  const handleRetry = useCallback(() => {
    setVideoError(false)
    setVideoReady(false)
    const videoEl = videoRef.current
    if (videoEl) videoEl.load()
  }, [])

  return (
    <section className="cma-player-card" aria-label="Video player">
      <div className="cma-video-title-bar">
        <span className="cma-video-title">Video {currentVideoIdx + 1} of {playlist.videos.length}</span>
        <span className="cma-video-subtitle">{currentVideo.title}</span>
      </div>
      <div className="cma-video-frame">
        {import.meta.env.DEV && onReset && (
          <button type="button" className="cma-dev-reset" onClick={handleDevReset}>
            [dev] reset
          </button>
        )}
        {videoError ? (
          <div className="cma-player-error" role="alert">
            <span className="cma-error-icon" aria-hidden="true">!</span>
            <h2>Video failed to load</h2>
            <p>Please refresh the page to try again.</p>
            <button
              type="button"
              className="cma-player-error-retry"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        ) : (
          <MediaController ref={controllerRef}>
            <video
              ref={videoRef}
              slot="media"
              src={videoSrc}
              playsInline
              preload="metadata"
              crossOrigin=""
            >
              <track default label="thumbnails" kind="metadata" src={thumbsVttUrl} />
              <track default kind="chapters" src={chaptersVttUrl} srcLang="en" />
            </video>
            <MediaLoadingIndicator slot="centered-chrome" />
            <MediaControlBar>
              <MediaPlayButton />
              <MediaTimeRange />
              <MediaTimeDisplay showDuration />
              <MediaMuteButton />
              <MediaVolumeRange />
              <MediaFullscreenButton />
            </MediaControlBar>
          </MediaController>
        )}
      </div>
      <div className="cma-player-shortcuts" aria-label="Keyboard shortcuts">
        <span><kbd>Space</kbd>play / pause</span>
        <span><kbd>←</kbd><kbd>→</kbd>±5s</span>
        <span><kbd>M</kbd>mute</span>
        <span><kbd>F</kbd>fullscreen</span>
      </div>
    </section>
  )
}
