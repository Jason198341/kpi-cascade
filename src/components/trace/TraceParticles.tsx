import { useEffect, useRef } from 'react'

interface Props {
  height: number
  active?: boolean
}

interface Particle {
  x: number
  y: number
  speed: number
  size: number
  opacity: number
}

export function TraceParticles({ height, active = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return

    const ctx = canvas.getContext('2d')!
    const w = canvas.width = 60
    const h = canvas.height = height

    const particles: Particle[] = Array.from({ length: 12 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 20,
      y: h + Math.random() * 40,
      speed: 0.5 + Math.random() * 1.5,
      size: 1.5 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7,
    }))

    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.y -= p.speed
        if (p.y < -10) {
          p.y = h + 10
          p.x = w / 2 + (Math.random() - 0.5) * 20
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`
        ctx.fill()

        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity * 0.15})`
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [height, active])

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none"
      style={{ height }}
    />
  )
}
