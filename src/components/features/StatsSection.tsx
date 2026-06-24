'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

export function StatsSection() {
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [totalStars, setTotalStars] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('projects')
          .select('repo_stars')

        if (!error && data) {
          setProjectCount(data.length)
          const stars = data.reduce((sum, p) => sum + (p.repo_stars || 0), 0)
          setTotalStars(stars)
        }
      } catch {
        // silent fail
      }
    }
    load()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 24 }}
      className="mt-20 md:mt-28 flex flex-wrap justify-center gap-8 md:gap-16 border-t border-border pt-8"
    >
      <div className="text-center">
        <p className="text-lg font-semibold text-accent">
          {projectCount !== null ? (
            <AnimatedCounter value={projectCount} />
          ) : (
            <span className="inline-block w-8 h-5 rounded bg-surface-alt animate-pulse" />
          )}
        </p>
        <p className="text-xs text-text-dim mt-0.5">Projects</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-accent">
          {totalStars !== null ? (
            <AnimatedCounter value={totalStars} />
          ) : (
            <span className="inline-block w-8 h-5 rounded bg-surface-alt animate-pulse" />
          )}
        </p>
        <p className="text-xs text-text-dim mt-0.5">Total Stars</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-accent">
          <AnimatedCounter value={100} suffix="%" />
        </p>
        <p className="text-xs text-text-dim mt-0.5">Open Source</p>
      </div>
    </motion.div>
  )
}
