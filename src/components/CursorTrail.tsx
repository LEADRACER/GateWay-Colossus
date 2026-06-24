'use client'

import { useEffect, useRef } from 'react'

interface TrailPoint {
  x: number
  y: number
  age: number
}

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const trailRef = useRef<TrailPoint[]>([])
  const mouseRef = useRef({ x: -100, y: -100 })
  const isMovingRef = useRef(false)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function animate(now: number) {
      const dt = now - lastTimeRef.current
      lastTimeRef.current = now

      ctx!.clearRect(0, 0, w, h)

      const mouse = mouseRef.current
      const trail = trailRef.current

      // Only add points if mouse is on screen and moving
      if (isMovingRef.current && mouse.x > 0 && mouse.y > 0) {
        const last = trail[trail.length - 1]
        if (!last || Math.hypot(mouse.x - last.x, mouse.y - last.y) > 2) {
          trail.push({ x: mouse.x, y: mouse.y, age: 0 })
        }
      }

      // Age and remove old points
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += dt
        if (trail[i].age > 800) {
          trail.splice(i, 1)
        }
      }

      // Draw trail
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const p = trail[i]
          const prev = trail[i - 1]
          const lifeRatio = 1 - p.age / 800
          const alpha = lifeRatio * 0.4
          const width = lifeRatio * 3

          ctx!.beginPath()
          ctx!.moveTo(prev.x, prev.y)
          ctx!.lineTo(p.x, p.y)
          ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${alpha})`
          ctx!.lineWidth = width
          ctx!.lineCap = 'round'
          ctx!.stroke()
        }

        // Glow dot at cursor head
        const head = trail[trail.length - 1]
        if (head) {
          const headLife = 1 - head.age / 800
          const glowGrad = ctx!.createRadialGradient(
            head.x, head.y, 0,
            head.x, head.y, 20 * headLife
          )
          glowGrad.addColorStop(0, `oklch(0.75 0.25 145 / ${0.3 * headLife})`)
          glowGrad.addColorStop(0.5, `oklch(0.75 0.25 145 / ${0.1 * headLife})`)
          glowGrad.addColorStop(1, 'transparent')
          ctx!.fillStyle = glowGrad
          ctx!.fillRect(head.x - 25, head.y - 25, 50, 50)

          // Core dot
          ctx!.beginPath()
          ctx!.arc(head.x, head.y, 3 * headLife, 0, Math.PI * 2)
          ctx!.fillStyle = `oklch(0.85 0.25 145 / ${0.8 * headLife})`
          ctx!.fill()
        }
      }

      // Outer glow ring that follows cursor
      if (mouse.x > 0 && mouse.y > 0) {
        const ringGrad = ctx!.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 60
        )
        ringGrad.addColorStop(0, 'oklch(0.75 0.25 145 / 0.04)')
        ringGrad.addColorStop(1, 'transparent')
        ctx!.fillStyle = ringGrad
        ctx!.fillRect(mouse.x - 60, mouse.y - 60, 120, 120)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      isMovingRef.current = true
    }

    function handleMouseLeave() {
      isMovingRef.current = false
    }

    function handleMouseEnter() {
      isMovingRef.current = true
    }

    resize()
    lastTimeRef.current = performance.now()
    animRef.current = requestAnimationFrame(animate)

    window.addEventListener('resize', resize)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  )
}
