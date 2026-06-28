'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { RippleButton } from '@/components/ui/RippleButton'
import { StatsSection } from '@/components/features/StatsSection'
import { getFeaturedProjects, getTrendingProjects } from '@/services/discovery'
import { Flame, Star } from 'lucide-react'
import type { Project } from '@/lib/types/database'

type FeaturedProject = Project & { featured_note?: string }

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
} as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
} as const

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedProject[]>([])
  const [trending, setTrending] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      getFeaturedProjects(supabase),
      getTrendingProjects(supabase, 5),
    ])
      .then(([f, t]) => {
        setFeatured(f)
        setTrending(t)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-[90vh] flex flex-col">
      {/* Hero — asymmetric split */}
      <section className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left — text */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="order-2 md:order-1"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent-subtle px-3 py-1 text-xs text-accent font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Community Project Showcase
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-none text-text">
                GateWay:<span className="text-accent">Colossus</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-text-muted leading-relaxed max-w-[45ch]">
                A living archive of community-built projects. Share your work, discover what others are building, and draw inspiration from the collective.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <Link href="/projects">
                  <RippleButton size="lg">
                    Browse Projects
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </RippleButton>
                </Link>
                <Link href="/auth/register">
                  <RippleButton variant="secondary" size="lg">
                    Showcase Your Work
                  </RippleButton>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — decorative orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
              className="order-1 md:order-2 flex justify-center md:justify-end"
            >
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 rounded-full border border-accent/5" />
                <div className="absolute inset-[15%] rounded-full border border-accent/10" />
                <div className="absolute inset-[30%] rounded-full border border-accent/15" />
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-[45%] rounded-full bg-accent-glow blur-xl"
                />
                <div className="absolute inset-[45%] rounded-full border border-accent/30" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-[5%] rounded-full border border-dashed border-accent/8"
                />
                <div className="absolute inset-[47%] rounded-full bg-accent blur-sm" />
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <StatsSection />
        </div>
      </section>

      {/* Featured Projects */}
      {!loading && featured.length > 0 && (
        <section className="border-t border-border bg-surface-alt/30">
          <div className="max-w-6xl mx-auto w-full px-6 py-16">
            <div className="flex items-center gap-2 mb-8">
              <Star size={18} className="text-warning" fill="currentColor" />
              <h2 className="text-xl font-bold text-text">Featured Projects</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="rounded-xl border border-border bg-surface p-5 hover:border-accent/20 transition-colors h-full">
                    <div className="flex items-center gap-3 mb-3">
                      {project.repo_avatar ? (
                        <Image src={project.repo_avatar} alt={project.owner} width={32} height={32}
                          className="w-8 h-8 rounded-full ring-1 ring-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-alt ring-1 ring-border flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-text truncate">{project.name}</h3>
                        <p className="text-xs text-text-dim">{project.owner}/{project.repo_name}</p>
                      </div>
                    </div>
                    {project.repo_description && (
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">{project.repo_description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-text-dim">
                      {project.repo_stars > 0 && (
                        <span className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {project.repo_stars}
                        </span>
                      )}
                      {project.repo_language && <span>{project.repo_language}</span>}
                    </div>
                    {project.featured_note && (
                      <p className="text-xs text-accent mt-3 italic">★ {project.featured_note}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Projects */}
      {!loading && trending.length > 0 && (
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto w-full px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-danger" />
                <h2 className="text-xl font-bold text-text">Trending Now</h2>
              </div>
              <Link href="/trending" className="text-sm text-accent hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {trending.slice(0, 5).map((project, index) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-alt transition-colors">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      index < 3 ? 'bg-accent/10 text-accent' : 'bg-surface-alt text-text-dim'
                    }`}>
                      {index + 1}
                    </span>
                    {project.repo_avatar ? (
                      <Image src={project.repo_avatar} alt={project.owner} width={28} height={28}
                        className="w-7 h-7 rounded-full ring-1 ring-border shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface-alt ring-1 ring-border shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text truncate">{project.name}</span>
                      <span className="text-xs text-text-dim ml-2">{project.owner}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-dim shrink-0">
                      {project.repo_stars > 0 && (
                        <span className="flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {project.repo_stars}
                        </span>
                      )}
                      {project.repo_language && <span className="hidden sm:inline">{project.repo_language}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
