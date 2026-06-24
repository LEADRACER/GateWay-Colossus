'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
  hue: number
  type: 'ember' | 'star' | 'vortex' | 'rune'
}

export function GatewayBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const particles: Particle[] = []
    let time = 0
    let mouseX = 0.5
    let mouseY = 0.5
    let scrollY = 0
    let targetScrollY = 0

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function createParticle(type: Particle['type'], x?: number, y?: number): Particle {
      const cx = w / 2
      const baseY = h * 0.85

      if (type === 'ember') {
        return {
          x: x ?? cx + (Math.random() - 0.5) * w * 0.4,
          y: y ?? baseY - Math.random() * h * 0.3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.8 + 0.2),
          size: Math.random() * 2 + 0.5,
          alpha: 0,
          life: 0,
          maxLife: Math.random() * 200 + 100,
          hue: 145 + (Math.random() - 0.5) * 20,
          type,
        }
      }

      if (type === 'star') {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * Math.min(w, h) * 0.5
        return {
          x: cx + Math.cos(angle) * dist,
          y: h * 0.3 + Math.sin(angle) * dist * 0.5,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.5 + 0.1,
          life: 0,
          maxLife: Infinity,
          hue: 145,
          type,
        }
      }

      if (type === 'vortex') {
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * 80 + 20
        return {
          x: cx + Math.cos(angle) * dist,
          y: baseY - h * 0.28 + Math.sin(angle) * dist * 0.4,
          vx: Math.cos(angle + Math.PI / 2) * (Math.random() * 1.5 + 0.5),
          vy: Math.sin(angle + Math.PI / 2) * (Math.random() * 0.8 + 0.2) - 0.3,
          size: Math.random() * 2 + 1,
          alpha: 0,
          life: 0,
          maxLife: Math.random() * 120 + 60,
          hue: 145 + (Math.random() - 0.5) * 30,
          type,
        }
      }

      // rune — slow-rising glowing particles from the arch
      return {
        x: cx + (Math.random() - 0.5) * 200,
        y: baseY - h * 0.28 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.4 + 0.1),
        size: Math.random() * 3 + 1.5,
        alpha: 0,
        life: 0,
        maxLife: Math.random() * 180 + 80,
        hue: 145,
        type: 'rune',
      }
    }

    function initStars() {
      for (let i = 0; i < 150; i++) {
        particles.push(createParticle('star'))
      }
    }

    function drawGateway() {
      const parallaxOffset = scrollY * 0.2
      const cx = w / 2
      const baseY = h * 0.85 + parallaxOffset
      const pillarW = w * 0.06
      const pillarH = h * 0.42
      const archTop = baseY - pillarH
      const archCurve = h * 0.15

      // Ground glow
      const groundGrad = ctx!.createRadialGradient(cx, baseY, 0, cx, baseY, w * 0.5)
      groundGrad.addColorStop(0, 'oklch(0.75 0.25 145 / 0.04)')
      groundGrad.addColorStop(1, 'transparent')
      ctx!.fillStyle = groundGrad
      ctx!.fillRect(0, baseY - 100, w, 200)

      // Left pillar
      const pillarGrad = ctx!.createLinearGradient(0, archTop, 0, baseY)
      pillarGrad.addColorStop(0, 'oklch(0.12 0.01 145)')
      pillarGrad.addColorStop(1, 'oklch(0.04 0.005 145)')

      ctx!.fillStyle = pillarGrad
      ctx!.beginPath()
      ctx!.moveTo(cx - w * 0.22, baseY)
      ctx!.lineTo(cx - w * 0.22, archTop + 20)
      ctx!.lineTo(cx - w * 0.22 + pillarW * 0.3, archTop)
      ctx!.lineTo(cx - w * 0.22 + pillarW, archTop + 20)
      ctx!.lineTo(cx - w * 0.22 + pillarW, baseY)
      ctx!.closePath()
      ctx!.fill()

      // Pillar edge glow
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.15)'
      ctx!.lineWidth = 1
      ctx!.stroke()

      // Right pillar
      ctx!.beginPath()
      ctx!.moveTo(cx + w * 0.22, baseY)
      ctx!.lineTo(cx + w * 0.22, archTop + 20)
      ctx!.lineTo(cx + w * 0.22 - pillarW * 0.3, archTop)
      ctx!.lineTo(cx + w * 0.22 - pillarW, archTop + 20)
      ctx!.lineTo(cx + w * 0.22 - pillarW, baseY)
      ctx!.closePath()
      ctx!.fill()
      ctx!.stroke()

      // Arch top
      ctx!.beginPath()
      ctx!.moveTo(cx - w * 0.22, archTop + 20)
      ctx!.quadraticCurveTo(cx, archTop - archCurve, cx + w * 0.22, archTop + 20)
      ctx!.lineTo(cx + w * 0.22 + pillarW * 0.5, archTop + 25)
      ctx!.quadraticCurveTo(cx, archTop - archCurve + pillarW, cx - w * 0.22 - pillarW * 0.5, archTop + 25)
      ctx!.closePath()
      ctx!.fillStyle = pillarGrad
      ctx!.fill()
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.2)'
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      // Inner arch (void)
      const innerLeft = cx - w * 0.22 + pillarW
      const innerRight = cx + w * 0.22 - pillarW
      const innerTop = archTop + 25

      ctx!.beginPath()
      ctx!.moveTo(innerLeft, baseY)
      ctx!.quadraticCurveTo(cx, innerTop - archCurve * 0.7, innerRight, baseY)
      ctx!.lineTo(innerRight, innerTop + 10)
      ctx!.quadraticCurveTo(cx, innerTop - archCurve * 0.6 + 10, innerLeft, innerTop + 10)
      ctx!.closePath()

      const voidGrad = ctx!.createRadialGradient(cx, innerTop, 0, cx, innerTop, (innerRight - innerLeft) * 0.8)
      voidGrad.addColorStop(0, 'oklch(0.0 0 0)')
      voidGrad.addColorStop(0.7, 'oklch(0.02 0.005 145)')
      voidGrad.addColorStop(1, 'oklch(0.75 0.25 145 / 0.05)')
      ctx!.fillStyle = voidGrad
      ctx!.fill()

      // Gateway glow from within
      const pulseAlpha = 0.15 + Math.sin(time * 0.02) * 0.1
      const glowGrad = ctx!.createRadialGradient(cx, innerTop, 0, cx, innerTop, w * 0.15)
      glowGrad.addColorStop(0, `oklch(0.75 0.25 145 / ${pulseAlpha})`)
      glowGrad.addColorStop(1, 'transparent')
      ctx!.fillStyle = glowGrad
      ctx!.fillRect(innerLeft - 50, innerTop - 100, innerRight - innerLeft + 100, baseY - innerTop + 100)

      // Keystone
      const keyX = cx - 15
      const keyY = innerTop - archCurve * 0.65
      ctx!.fillStyle = 'oklch(0.15 0.01 145)'
      ctx!.fillRect(keyX, keyY, 30, 30)
      ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${0.3 + Math.sin(time * 0.03) * 0.15})`
      ctx!.lineWidth = 1
      ctx!.strokeRect(keyX, keyY, 30, 30)

      // Rune on keystone
      ctx!.beginPath()
      ctx!.arc(cx, keyY + 15, 4, 0, Math.PI * 2)
      ctx!.fillStyle = `oklch(0.75 0.25 145 / ${0.5 + Math.sin(time * 0.04) * 0.3})`
      ctx!.fill()

      // Stone texture lines on pillars
      ctx!.strokeStyle = 'oklch(0.2 0.01 145 / 0.5)'
      ctx!.lineWidth = 0.5
      for (let i = 0; i < 12; i++) {
        const y = archTop + 40 + i * (pillarH - 40) / 12
        // Left
        ctx!.beginPath()
        ctx!.moveTo(cx - w * 0.22 + 3, y)
        ctx!.lineTo(cx - w * 0.22 + pillarW - 3, y)
        ctx!.stroke()
        // Right
        ctx!.beginPath()
        ctx!.moveTo(cx + w * 0.22 - pillarW + 3, y)
        ctx!.lineTo(cx + w * 0.22 - 3, y)
        ctx!.stroke()
      }

      // Energy lines on arch curve
      ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${0.08 + Math.sin(time * 0.015) * 0.04})`
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.moveTo(innerLeft, innerTop + 10)
      for (let t = 0; t <= 1; t += 0.02) {
        const px = innerLeft + (innerRight - innerLeft) * t
        const py = innerTop + 10 - Math.sin(t * Math.PI) * archCurve * 0.6
        ctx!.lineTo(px, py)
      }
      ctx!.stroke()
    }

    function drawColossusFigure() {
      const parallaxOffset = scrollY * 0.15
      const cx = w / 2
      const baseY = h * 0.85 + parallaxOffset
      const scale = Math.min(w, h) / 800

      // The Colossus — a massive humanoid silhouette made of light points
      // Position: standing behind the gateway, head above the arch
      const headY = baseY - h * 0.52
      const bodyTop = baseY - h * 0.42
      const bodyBottom = baseY - h * 0.15
      const shoulderY = bodyTop + 20 * scale

      // Body glow aura
      const auraGrad = ctx!.createRadialGradient(cx, (headY + bodyBottom) / 2, 0, cx, (headY + bodyBottom) / 2, w * 0.2)
      auraGrad.addColorStop(0, 'oklch(0.75 0.25 145 / 0.03)')
      auraGrad.addColorStop(1, 'transparent')
      ctx!.fillStyle = auraGrad
      ctx!.fillRect(cx - w * 0.2, headY - 50, w * 0.4, bodyBottom - headY + 100)

      // Head — circle of light
      const headRadius = 18 * scale
      const headGlow = ctx!.createRadialGradient(cx, headY, 0, cx, headY, headRadius * 2)
      headGlow.addColorStop(0, 'oklch(0.75 0.25 145 / 0.15)')
      headGlow.addColorStop(0.5, 'oklch(0.75 0.25 145 / 0.05)')
      headGlow.addColorStop(1, 'transparent')
      ctx!.fillStyle = headGlow
      ctx!.beginPath()
      ctx!.arc(cx, headY, headRadius * 2, 0, Math.PI * 2)
      ctx!.fill()

      ctx!.beginPath()
      ctx!.arc(cx, headY, headRadius * 0.5, 0, Math.PI * 2)
      ctx!.fillStyle = `oklch(0.75 0.25 145 / ${0.3 + Math.sin(time * 0.025) * 0.15})`
      ctx!.fill()

      // Torso — vertical line of light
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.1)'
      ctx!.lineWidth = 2 * scale
      ctx!.beginPath()
      ctx!.moveTo(cx, headY + headRadius * 0.8)
      ctx!.lineTo(cx, bodyBottom)
      ctx!.stroke()

      // Shoulders
      const shoulderW = w * 0.12
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.12)'
      ctx!.lineWidth = 2 * scale
      ctx!.beginPath()
      ctx!.moveTo(cx - shoulderW, shoulderY)
      ctx!.lineTo(cx + shoulderW, shoulderY)
      ctx!.stroke()

      // Arms reaching upward
      const armSpread = w * 0.18
      const armTop = headY - 30 * scale
      const pulse = Math.sin(time * 0.015) * 5

      // Left arm
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.1)'
      ctx!.lineWidth = 1.5 * scale
      ctx!.beginPath()
      ctx!.moveTo(cx - shoulderW, shoulderY)
      ctx!.quadraticCurveTo(cx - armSpread * 0.7, shoulderY - 40 * scale, cx - armSpread + pulse, armTop)
      ctx!.stroke()

      // Right arm
      ctx!.beginPath()
      ctx!.moveTo(cx + shoulderW, shoulderY)
      ctx!.quadraticCurveTo(cx + armSpread * 0.7, shoulderY - 40 * scale, cx + armSpread - pulse, armTop)
      ctx!.stroke()

      // Hands (glowing orbs at arm ends)
      ;[
        [cx - armSpread + pulse, armTop],
        [cx + armSpread - pulse, armTop],
      ].forEach(([hx, hy]) => {
        const handGlow = ctx!.createRadialGradient(hx, hy, 0, hx, hy, 8 * scale)
        handGlow.addColorStop(0, 'oklch(0.75 0.25 145 / 0.5)')
        handGlow.addColorStop(1, 'transparent')
        ctx!.fillStyle = handGlow
        ctx!.beginPath()
        ctx!.arc(hx, hy, 8 * scale, 0, Math.PI * 2)
        ctx!.fill()
      })

      // Legs
      const legSpread = w * 0.06
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.08)'
      ctx!.lineWidth = 1.5 * scale
      ctx!.beginPath()
      ctx!.moveTo(cx, bodyBottom)
      ctx!.lineTo(cx - legSpread, baseY)
      ctx!.stroke()
      ctx!.beginPath()
      ctx!.moveTo(cx, bodyBottom)
      ctx!.lineTo(cx + legSpread, baseY)
      ctx!.stroke()

      // Rune circles around the figure
      const runeCount = 5
      for (let i = 0; i < runeCount; i++) {
        const angle = (time * 0.005 + (i * Math.PI * 2) / runeCount)
        const runeDist = w * 0.15 + Math.sin(time * 0.01 + i) * 20
        const rx = cx + Math.cos(angle) * runeDist
        const ry = (headY + bodyBottom) / 2 + Math.sin(angle) * runeDist * 0.4
        const runeAlpha = 0.15 + Math.sin(time * 0.02 + i * 1.5) * 0.1

        ctx!.beginPath()
        ctx!.arc(rx, ry, 3 * scale, 0, Math.PI * 2)
        ctx!.fillStyle = `oklch(0.75 0.25 145 / ${runeAlpha})`
        ctx!.fill()

        // Connecting lines between runes
        ctx!.beginPath()
        ctx!.arc(rx, ry, 12 * scale, 0, Math.PI * 2)
        ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${runeAlpha * 0.3})`
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }
    }

    function drawVortex() {
      const cx = w / 2
      const baseY = h * 0.85
      const innerTop = baseY - h * 0.28
      const vortexY = innerTop - h * 0.05

      // Spinning energy rings
      for (let ring = 0; ring < 3; ring++) {
        const radius = 30 + ring * 25 + Math.sin(time * 0.02 + ring) * 10
        const alpha = 0.08 - ring * 0.02

        ctx!.beginPath()
        ctx!.ellipse(cx, vortexY, radius, radius * 0.3, 0, 0, Math.PI * 2)
        ctx!.strokeStyle = `oklch(0.75 0.25 145 / ${alpha})`
        ctx!.lineWidth = 1
        ctx!.stroke()
      }

      // Energy tendrils
      for (let i = 0; i < 8; i++) {
        const angle = (time * 0.01 + (i * Math.PI * 2) / 8)
        const len = 60 + Math.sin(time * 0.03 + i) * 20

        ctx!.beginPath()
        ctx!.moveTo(cx, vortexY)
        for (let t = 0; t <= 1; t += 0.1) {
          const tx = cx + Math.cos(angle + t * 2) * len * t
          const ty = vortexY - len * t * 0.5 + Math.sin(angle + t * 3) * 10 * t
          ctx!.lineTo(tx, ty)
        }
        ctx!.strokeStyle = `oklch(0.75 0.25 145 / 0.06)`
        ctx!.lineWidth = 1
        ctx!.stroke()
      }
    }

    function drawHorizonGrid() {
      const parallaxOffset = scrollY * 0.3
      const baseY = h * 0.85 + parallaxOffset * 0.5
      const horizonY = baseY - h * 0.42 - parallaxOffset

      // Horizontal lines with perspective
      ctx!.strokeStyle = 'oklch(0.75 0.25 145 / 0.03)'
      ctx!.lineWidth = 0.5

      for (let i = 0; i < 20; i++) {
        const t = i / 20
        const y = horizonY + (baseY - horizonY) * Math.pow(t, 1.5)
        ctx!.beginPath()
        ctx!.moveTo(0, y)
        ctx!.lineTo(w, y)
        ctx!.stroke()
      }

      // Vertical lines converging to center
      const vanishX = w / 2
      for (let i = 0; i < 30; i++) {
        const x = (i / 30) * w
        ctx!.beginPath()
        ctx!.moveTo(x, baseY)
        ctx!.lineTo(vanishX + (x - vanishX) * 0.1, horizonY)
        ctx!.stroke()
      }
    }

    function animate() {
      time++
      // Smooth scroll interpolation
      scrollY += (targetScrollY - scrollY) * 0.08
      ctx!.clearRect(0, 0, w, h)

      // Deep background gradient
      const bgGrad = ctx!.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, 'oklch(0.0 0 0)')
      bgGrad.addColorStop(0.7, 'oklch(0.01 0.003 145)')
      bgGrad.addColorStop(1, 'oklch(0.0 0 0)')
      ctx!.fillStyle = bgGrad
      ctx!.fillRect(0, 0, w, h)

      // Horizon grid
      drawHorizonGrid()

      // Stars with parallax
      particles.forEach((p) => {
        if (p.type === 'star') {
          const starParallax = scrollY * 0.05 * (p.size / 2)
          p.alpha = 0.1 + Math.sin(time * 0.02 + p.x * 0.01) * 0.15
          ctx!.beginPath()
          ctx!.arc(p.x, p.y + starParallax, p.size, 0, Math.PI * 2)
          ctx!.fillStyle = `oklch(0.75 0.25 145 / ${p.alpha})`
          ctx!.fill()
        }
      })

      // Colossus figure
      drawColossusFigure()

      // Gateway structure
      drawGateway()

      // Vortex energy
      drawVortex()

      // Update & draw embers
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        if (p.type === 'star') continue

        p.life++
        p.x += p.vx
        p.y += p.vy

        if (p.type === 'ember') {
          p.vx += (Math.random() - 0.5) * 0.02
          p.vy -= 0.003
          const lifeRatio = p.life / p.maxLife
          p.alpha = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : 1
          p.alpha *= 0.6
        }

        if (p.type === 'vortex') {
          const lifeRatio = p.life / p.maxLife
          p.alpha = lifeRatio < 0.2 ? lifeRatio * 5 : lifeRatio > 0.6 ? (1 - lifeRatio) / 0.4 : 1
          p.alpha *= 0.4
          // Pull toward center
          const cx = w / 2
          const cy = h * 0.85 - h * 0.28
          p.vx += (cx - p.x) * 0.001
          p.vy += (cy - p.y) * 0.001
        }

        if (p.type === 'rune') {
          const lifeRatio = p.life / p.maxLife
          p.alpha = lifeRatio < 0.15 ? lifeRatio / 0.15 : lifeRatio > 0.6 ? (1 - lifeRatio) / 0.4 : 1
          p.alpha *= 0.5
          p.vx += Math.sin(time * 0.02 + p.y * 0.01) * 0.01
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `oklch(${p.hue} 0.25 145 / ${p.alpha})`
        ctx!.fill()

        // Glow effect for larger particles
        if (p.size > 1.5 && p.alpha > 0.2) {
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx!.fillStyle = `oklch(${p.hue} 0.25 145 / ${p.alpha * 0.15})`
          ctx!.fill()
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
        }
      }

      // Spawn new particles
      if (particles.length < 300) {
        // Embers from the gateway
        if (time % 3 === 0) particles.push(createParticle('ember'))
        // Vortex particles
        if (time % 8 === 0) particles.push(createParticle('vortex'))
        // Rune particles
        if (time % 12 === 0) particles.push(createParticle('rune'))
      }

      // Mouse parallax on stars
      particles.forEach((p) => {
        if (p.type === 'star') {
          const dx = (mouseX - 0.5) * 2
          const dy = (mouseY - 0.5) * 2
          p.x += dx * 0.15
          p.y += dy * 0.1
        }
      })

      animRef.current = requestAnimationFrame(animate)
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX / w
      mouseY = e.clientY / h
    }

    function handleScroll() {
      targetScrollY = window.scrollY
    }

    resize()
    initStars()
    animate()

    window.addEventListener('resize', resize)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1]"
      style={{ background: 'oklch(0.0 0 0)' }}
      aria-hidden="true"
    />
  )
}
