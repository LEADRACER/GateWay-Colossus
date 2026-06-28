'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '@/lib/types/database'

interface ProjectPreviewProps {
  project: Project
  children: React.ReactNode
}

export function ProjectPreview({ project, children }: ProjectPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(800px) rotateX(${y * -10}deg) rotateY(${x * 10}deg)`
      }
    })
  }

  function handleMouseLeave() {
    setIsHovered(false)
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
      }
    })
  }

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease-out',
        willChange: 'transform',
      }}
    >
      {children}

      {/* Hover preview overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-2 left-0 right-0 -translate-y-full z-20
              rounded-xl border border-accent/20 bg-surface/95 backdrop-blur-md p-4
              shadow-xl shadow-accent/5"
            style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-medium text-accent uppercase tracking-wider">Live Preview</span>
            </div>
            <p className="text-xs text-text-muted line-clamp-3 mb-3 leading-relaxed">
              {project.repo_description || 'No description available'}
            </p>
            <div className="flex items-center gap-3 text-[11px]">
              {project.repo_stars !== null && project.repo_stars > 0 && (
                <span className="flex items-center gap-1 text-text-dim">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {project.repo_stars.toLocaleString()}
                </span>
              )}
              {project.repo_language && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                  <span className="text-accent/80">{project.repo_language}</span>
                </span>
              )}
              {project.repo_license && (
                <span className="text-text-dim/60">{project.repo_license}</span>
              )}
            </div>
            {project.repo_topics && project.repo_topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.repo_topics.slice(0, 4).map((t) => (
                  <span key={t} className="px-1.5 py-0.5 text-[9px] rounded border border-accent/15 bg-accent-subtle text-accent/80">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {/* Arrow pointing down */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-surface border-r border-b border-accent/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
