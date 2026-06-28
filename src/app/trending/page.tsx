'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getTrendingProjects } from '@/services/discovery'
import type { Project } from '@/lib/types/database'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp } from 'lucide-react'

export default function TrendingPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    getTrendingProjects(supabase, 20)
      .then(setProjects)
      .catch(() => {})
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <TrendingUp size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Trending
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Most popular projects ranked by stars, likes, and recency
          </p>
        </div>
      </div>

      {/* Results */}
      {projects.length === 0 ? (
        <EmptyState
          title="No trending projects"
          description="Projects will appear here once they get likes and stars."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface
                hover:border-accent/20 hover:bg-surface-alt/50 transition-colors group">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  index === 0 ? 'bg-warning/10 text-warning' :
                  index === 1 ? 'bg-text-dim/10 text-text-dim' :
                  index === 2 ? 'bg-accent/10 text-accent' :
                  'bg-surface-alt text-text-dim'
                }`}>
                  {index + 1}
                </div>

                {/* Avatar */}
                {project.repo_avatar ? (
                  <Image src={project.repo_avatar} alt={project.owner} width={36} height={36}
                    className="w-9 h-9 rounded-full shrink-0 ring-1 ring-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full shrink-0 bg-surface-alt ring-1 ring-border flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-text truncate group-hover:text-accent transition-colors">
                      {project.name}
                    </h3>
                    <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-dim mt-0.5">
                    {project.owner}/{project.repo_name}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-text-dim shrink-0">
                  {project.repo_stars > 0 && (
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {project.repo_stars}
                    </span>
                  )}
                  {project.repo_language && (
                    <span className="hidden sm:inline">{project.repo_language}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
