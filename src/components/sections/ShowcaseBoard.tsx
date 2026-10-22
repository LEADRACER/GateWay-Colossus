'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { FadeIn, Stagger, StaggerRow } from '@/components/motion'
import { COPY } from '@/components/shell/copy'
import type { Project } from '@/lib/types/database'

type FeaturedProject = Project & { featured_note?: string }

export function ShowcaseBoard() {
  const [featured, setFeatured] = useState<FeaturedProject[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('@/lib/supabase/client').then(m => m.createClient),
      import('@/services/discovery').then(m => m.getFeaturedProjects),
    ])
      .then(([createClient, getFeaturedProjects]) => getFeaturedProjects(createClient()))
      .then((f) => { if (!cancelled) setFeatured(f) })
      .catch(() => { if (!cancelled) setFeatured([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <section id="fired" className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <FadeIn>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="stamp font-mono text-sm text-gold uppercase tracking-[0.08em]">
                {COPY.home.sections.showcase}
              </h2>
              <p className="mt-3 text-sm text-text-dim">hand-picked by the community</p>
            </div>
          </div>
        </FadeIn>

        {featured === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 bg-surface/60 animate-pulse" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 9).map((project, index) => (
              <StaggerRow key={project.id} className="h-full">
                <Link
                  href={`/projects/${project.id}`}
                  className="group block h-full p-5 bg-bg-raised border border-border hover:border-border-light transition-colors"
                >
                  <div className={`h-full flex flex-col ${index < 3 ? 'border-l-2 border-gold pl-4' : ''}`}>
                    <div className="flex items-start gap-3 mb-4">
                      {project.repo_avatar ? (
                        <Image
                          src={project.repo_avatar}
                          alt={project.owner}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-none border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 border border-border bg-surface-alt flex items-center justify-center shrink-0 font-mono text-xs text-text-dim">
                          {(project.owner ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono text-sm text-text truncate group-hover:text-green-bright transition-colors">
                          {project.name}
                        </h3>
                        <p className="font-mono text-xs text-text-dim truncate">
                          {project.owner}/{project.repo_name}
                        </p>
                      </div>
                    </div>
                    {project.repo_description && (
                      <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">
                        {project.repo_description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-dim mt-auto">
                      {project.repo_stars > 0 && (
                        <span className="flex items-center gap-1.5 text-gold">
                          <Star size={12} className="fill-current" />
                          {project.repo_stars.toLocaleString()}
                        </span>
                      )}
                      {project.repo_language && (
                        <span className="px-2 py-0.5 border border-border text-text-muted">
                          {project.repo_language.toLowerCase()}
                        </span>
                      )}
                    </div>
                    {project.featured_note && (
                      <p className="mt-4 pt-3 border-t border-border font-mono text-xs text-green-bright">
                        ★ {project.featured_note}
                      </p>
                    )}
                  </div>
                </Link>
              </StaggerRow>
            ))}
          </Stagger>
        ) : (
          <div className="corner-ticks rule-dashed max-w-md mx-auto px-6 py-10 font-mono text-sm text-text-dim text-center">
            ─ no showcased projects yet ─
          </div>
        )}
      </div>
    </section>
  )
}
