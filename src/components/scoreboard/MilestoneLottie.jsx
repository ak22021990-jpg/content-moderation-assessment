import { useState, useEffect, useRef } from 'react'
import Lottie from 'lottie-react'

const MILESTONES = [
  { name: 'PERFECT_EYE', threshold: 100, load: () => import('../../assets/animation/PERFECT_EYE.json') },
  { name: 'SNIPER',      threshold: 90,  load: () => import('../../assets/animation/SNIPER.json') },
  { name: 'ON_FIRE',     threshold: 80,  load: () => import('../../assets/animation/ON_FIRE.json') },
  { name: 'ZONE_CLEAR',  threshold: 70,  load: () => import('../../assets/animation/ZONE_CLEAR.json') },
  { name: 'EAGLE_EYE',   threshold: 60,  load: () => import('../../assets/animation/EAGLE_EYE.json') },
]

function getMilestone(score) {
  for (const m of MILESTONES) {
    if (score >= m.threshold) return m
  }
  return null
}

export default function MilestoneLottie({ score }) {
  const [animData, setAnimData] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const milestoneRef = useRef(null)

  useEffect(() => {
    const milestone = getMilestone(score)
    milestoneRef.current = milestone
    if (!milestone) return

    let cancelled = false
    milestone.load()
      .then(mod => {
        if (!cancelled) setAnimData(mod.default)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => { cancelled = true }
  }, [score])

  if (!milestoneRef.current || loadError) return null

  return (
    <div className="sb-section sb-milestone">
      {animData ? (
        <Lottie
          animationData={animData}
          loop={false}
          autoplay
          style={{ width: '100%', maxWidth: 280 }}
          aria-label={`Milestone: ${milestoneRef.current.name.replace(/_/g, ' ').toLowerCase()}`}
        />
      ) : (
        <div className="sb-milestone-loading" aria-label="Loading milestone animation" />
      )}
    </div>
  )
}
