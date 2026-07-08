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

export default function VideoPlayerScreen({ src, onReady, onError, onReset }) {
  const [videoError, setVideoError] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)

  const videoSrc = src || playlist.videos[0].srcUrl
  const videoTitle = playlist.videos[0].title

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleCanPlayThrough = () => {
      setVideoReady(true)
      onReady?.()
    }

    const handleError = () => {
      setVideoError(true)
      onError?.()
    }

    video.addEventListener('canplaythrough', handleCanPlayThrough)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      video.removeEventListener('error', handleError)
    }
  }, [onReady, onError])

  const handleDevReset = useCallback(() => {
    if (onReset) onReset()
  }, [onReset])

  return (
    <section className="cma-player-container" aria-label="Video player">
      <div className="cma-player-card">
        <div className="cma-video-title-bar">
          <span className="cma-video-title">Video 1 of 5</span>
          <span className="cma-video-subtitle">{videoTitle}</span>
        </div>
        {videoError ? (
          <div className="cma-player-error" role="alert">
            <span className="cma-error-icon" aria-hidden="true">!</span>
            <h2>Video failed to load</h2>
            <p>Please refresh the page to try again.</p>
          </div>
        ) : (
          <MediaController>
            <video
              ref={videoRef}
              slot="media"
              src={videoSrc}
              playsInline
              preload="metadata"
              crossOrigin=""
            />
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
      {import.meta.env.DEV && onReset && (
        <button type="button" onClick={handleDevReset}>
          [dev] Reset
        </button>
      )}
    </section>
  )
}
