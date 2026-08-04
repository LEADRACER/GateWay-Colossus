'use client'

import { useEffect, useRef } from 'react'

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: -100, y: -100 })
  const isVisibleRef = useRef(false)
  const pulseRef = useRef(0)

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
      ctx!.clearRect(0, 0, w, h)

      const mouse = mouseRef.current

      // Only draw if mouse is on screen
      if (isVisibleRef.current && mouse.x > 0 && mouse.y > 0) {
        // Pulsing animation
        pulseRef.current = (pulseRef.current + 0.003) % (Math.PI * 2)
        const pulse = Math.sin(pulseRef.current) * 0.5 + 0.5 // 0 to 1
        
        // Outer glow ring (breathing)
        const outerRadius = 30 + pulse * 15
        const outerGrad = ctx!.createRadialGradient(
          mouse.x, mouse.y, outerRadius * 0.5,
          mouse.x, mouse.y, outerRadius
        )
        outerGrad.addColorStop(0, 'oklch(0.75 0.25 145 / 0.08)')
        outerGrad.addColorStop(0.5, 'oklch(0.75 0.25 145 / 0.03)')
        outerGrad.addColorStop(1, 'transparent')
        ctx!.fillStyle = outerGrad
        ctx!.fillRect(mouse.x - outerRadius, mouse.y - outerRadius, outerRadius * 2, outerRadius * 2)

        // Main circle ring
        const ringRadius = 20 + pulse * 8
        ctx!.beginPath()
        ctx!.arc(mouse.x, mouse.y, ringRadius, 0, Math.PI * 2)
        ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${0.4 + pulse * 0.2})`
        ctx!.lineWidth = 1.5
        ctx!.stroke()

        // Inner accent ring
        const innerRadius = 8 + pulse * 4
        ctx!.beginPath()
        ctx!.arc(mouse.x, mouse.y, innerRadius, 0, Math.PI * 2)
        ctx!.strokeStyle = `oklch(0.85 0.25 145 / ${0.6 + pulse * 0.2})`
        ctx!.lineWidth = 1
        ctx!.stroke()

        // Crosshair lines (subtle)
        const crossSize = ringRadius + 10
        ctx!.beginPath()
        ctx!.moveTo(mouse.x - crossSize, mouse.y)
        ctx!.lineTo(mouse.x - ringRadius - 3, mouse.y)
        ctx!.moveTo(mouse.x + ringRadius + 3, mouse.y)
        ctx!.lineTo(mouse.x + crossSize, mouse.y)
        ctx!.moveTo(mouse.x, mouse.y - crossSize)
        ctx!.lineTo(mouse.x, mouse.y - ringRadius - 3)
        ctx!.moveTo(mouse.x, mouse.y + ringRadius + 3)
        ctx!.lineTo(mouse.x, mouse.y + crossSize)
        ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${0.2 + pulse * 0.1})`
        ctx!.lineWidth = 1
        ctx!.lineCap = 'round'
        ctx!.stroke()

        // Center dot
        ctx!.beginPath()
        ctx!.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2)
        ctx!.fillStyle = `oklch(0.9 0.2 145 / ${0.7 + pulse * 0.2})`
        ctx!.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      isVisibleRef.current = true
    }

    function handleMouseLeave() {
      isVisibleRef.current = false
    }

    function handleMouseEnter() {
      isVisibleRef.current = true
    }

    resize()
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