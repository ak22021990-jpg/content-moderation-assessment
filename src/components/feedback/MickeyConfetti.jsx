import { useEffect, useRef } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function drawMickey(ctx, x, y, size, rotation, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.08
  ctx.beginPath()
  // Face
  ctx.arc(0, size * 0.15, size * 0.35, 0, Math.PI * 2)
  // Left ear
  ctx.moveTo(-size * 0.42, -size * 0.25)
  ctx.arc(-size * 0.42, -size * 0.35, size * 0.22, 0, Math.PI * 2)
  // Right ear
  ctx.moveTo(size * 0.42, -size * 0.25)
  ctx.arc(size * 0.42, -size * 0.35, size * 0.22, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export default function MickeyConfetti({ active, particleCount = 80, duration = 2500 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion()) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const palette = ['#E93A9A', '#3B82F6', '#34C79A', '#F59E0B', '#A855F7', '#fff']
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    particlesRef.current = Array.from({ length: particleCount }).map(() => {
      const angle = Math.random() * Math.PI * 2
      const velocity = 4 + Math.random() * 7
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 4 - Math.random() * 4,
        size: 10 + Math.random() * 18,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        color: palette[Math.floor(Math.random() * palette.length)],
        opacity: 1,
        life: 0,
        maxLife: duration,
      }
    })

    let startTime = null

    function step(timestamp) {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((p) => {
        p.life = elapsed
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.18
        p.rotation += p.rotationSpeed
        p.opacity = Math.max(0, 1 - p.life / p.maxLife)

        if (p.opacity > 0) {
          ctx.globalAlpha = p.opacity
          drawMickey(ctx, p.x, p.y, p.size, p.rotation, p.color)
        }
      })

      ctx.globalAlpha = 1

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    function onResize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [active, particleCount, duration])

  if (!active) return null
  if (prefersReducedMotion()) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1001,
      }}
    />
  )
}
