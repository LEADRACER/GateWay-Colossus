'use client'

import { useRef, useState, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  glare?: boolean
}

export function TiltCard({ children, className = '', maxTilt = 8, glare = true }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, glareOpacity: 0 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateY = ((x - centerX) / centerX) * maxTilt
    const rotateX = -((y - centerY) / centerY) * maxTilt

    setTransform({
      rotateX,
      rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      glareOpacity: 0.12,
    })
  }

  function handleMouseLeave() {
    setTransform({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, glareOpacity: 0 })
  }

  return (
    <div
      ref={cardRef}
      className={`perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
        transition: (transform.rotateX === 0 && transform.rotateY === 0) ? 'transform 0.4s ease-out' : 'transform 0.1s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, oklch(0.75 0.25 145 / ${transform.glareOpacity}), transparent 60%)`,
            transition: (transform.rotateX === 0 && transform.rotateY === 0) ? 'background 0.4s ease-out' : 'background 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}
