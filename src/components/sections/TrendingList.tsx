'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { FadeIn, Stagger, StaggerRow } from '@/components/motion'
import { COPY } from '@/components/shell/copy'
import type { Project } from '@/lib/types/database'

export function TrendingList() {
  const [trending, setTrending] = useState<Project[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('@/lib/supabase/client').then(m => m.createClient),
      import('@/services/discovery').then(m => m.getTrendingProjects),
    ])
      .then(([createClient, getTrendingProjects]) => getTrendingProjects(createClient(), 8))
      .then((t) => { if (!cancelled) setTrending(t) })
      .catch(() => { if (!cancelled) setTrending([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="stamp font-mono text-sm text-gold uppercase tracking-[0.08em]">
                {COPY.home.sections.trending}
              </h2>
              <p className="mt-3 text-sm text-text-dim">most starred this week</p>
            </div>
            <Link href="/trending" className="font-mono text-xs text-text-muted hover:text-green-bright">
              view all →
            </Link>
          </div>
        </FadeIn>

        {trending === null ? (
          <div className="border-y border-border divide-y divide-border">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 bg-surface/40 animate-pulse" />
            ))}
          </div>
        ) : trending.length > 0 ? (
          <Stagger className="divide-y divide-border border-y border-border">
            {trending.map((project, index) => (
              <StaggerRow key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex items-center gap-4 px-3 py-3.5 hover:bg-surface-hover transition-colors"
                >
                  <span className={`font-mono text-sm w-8 tabular-nums ${index === 0 ? 'text-gold' : 'text-text-dim'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {project.repo_avatar ? (
                    <Image
                      src={project.repo_avatar}
                      alt={project.owner}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-none border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 border border-border bg-surface-alt shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm text-text block truncate group-hover:text-green-bright transition-colors">
                      {project.name}
                    </span>
                    <span className="font-mono text-xs text-text-dim">{project.owner}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    {project.repo_language && (
                      <span className="hidden sm:inline px-2 py-0.5 border border-border text-text-muted">
                        {project.repo_language.toLowerCase()}
                      </span>
                    )}
                    {project.repo_stars > 0 && (
                      <span className="flex items-center gap-1.5 text-gold tabular-nums">
                        <Star size={12} className="fill-current" />
                        {project.repo_stars.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              </StaggerRow>
            ))}
          </Stagger>
        ) : (
          <div className="corner-ticks rule-dashed max-w-md mx-auto px-6 py-10 font-mono text-sm text-text-dim text-center">
            ─ nothing trending yet ─
          </div>
        )}
      </div>
    </section>
  )
}
