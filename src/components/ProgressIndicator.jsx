import useAssessmentStore from '../stores/useAssessmentStore.js'
import playlist from '../data/playlist.json'

export default function ProgressIndicator() {
  const currentVideoIndex = useAssessmentStore((s) => s.currentVideoIndex)

  return (
    <div className="cma-progress">
      Video {currentVideoIndex + 1} of {playlist.videos.length}
    </div>
  )
}
