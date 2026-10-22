'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Project } from '@/lib/types/database'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Stagger, StaggerRow } from '@/components/motion'

export default function TrendingPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects/trending')
      .then(res => res.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []) })
      .catch(() => { setProjects([]) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-2">[ hot shelf ]</p>
      <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-text mb-1">trending</h1>
      <p className="text-sm text-text-muted mb-8">most starred this week, ranked by stars and recency</p>

      {projects.length === 0 ? (
        <EmptyState
          title="No trending projects"
          description="Projects will appear here once they get likes and stars."
        />
      ) : (
        <Stagger className="divide-y divide-border border-y border-border">
          {projects.map((project, index) => (
            <StaggerRow key={project.id}>
              <Link href={`/projects/${project.id}`} className="group flex items-center gap-4 px-3 py-3.5 hover:bg-surface-hover transition-colors">
                <span className={`font-mono text-sm w-8 tabular-nums shrink-0 ${
                  index === 0 ? 'text-gold' : index < 3 ? 'text-gold-dim' : 'text-text-dim'
                }`}>
                  {String(index + 1).padStart(2, '0')}
                </span>

                {project.repo_avatar ? (
                  <Image src={project.repo_avatar} alt={project.owner} width={36} height={36}
                    className="w-9 h-9 rounded-none shrink-0 border border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-none shrink-0 bg-surface-alt border border-border flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm text-text truncate group-hover:text-green-bright transition-colors">
                      {project.name}
                    </h3>
                    <Badge variant="default">
                      {project.status}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-text-dim mt-0.5">
                    {project.owner}/{project.repo_name}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0 font-mono">
                  {project.repo_stars > 0 && (
                    <span className="flex items-center gap-1 text-gold tabular-nums">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {project.repo_stars}
                    </span>
                  )}
                  {project.repo_language && (
                    <span className="hidden sm:inline px-1.5 py-0.5 border border-border text-text-muted text-[10px]">
                      {project.repo_language.toLowerCase()}
                    </span>
                  )}
                </div>
              </Link>
            </StaggerRow>
          ))}
        </Stagger>
      )}
    </div>
  )
}