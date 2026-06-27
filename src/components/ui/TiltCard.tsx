'use client'

import { useRef, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  glare?: boolean
}

export function TiltCard({ children, className = '', maxTilt = 8, glare = true }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateY = ((x - centerX) / centerX) * maxTilt
    const rotateX = -((y - centerY) / centerY) * maxTilt

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }
      if (glareRef.current) {
        glareRef.current.style.background =
          `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, oklch(0.75 0.25 145 / 0.12), transparent 60%)`
      }
    })
  }

  function handleMouseLeave() {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
      }
      if (glareRef.current) {
        glareRef.current.style.background = ''
      }
    })
  }

  return (
    <div
      className={`perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      >
        {children}
        {glare && (
          <div
            ref={glareRef}
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              transition: 'background 0.3s ease-out',
              willChange: 'background',
            }}
          />
        )}
      </div>
    </div>
  )
}
