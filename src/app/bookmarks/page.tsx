'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSupabaseSession as useSession } from '@/hooks/useSupabaseSession'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Stagger, StaggerRow } from '@/components/motion'
import type { Project } from '@/lib/types/database'

export default function BookmarksPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/user/bookmarks')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        setError('Failed to load bookmarks')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-2">[ your shelf ]</p>
        <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-text mb-2">bookmarks</h1>
        <p className="text-sm text-text-muted mb-8">projects you saved for later</p>
        <div className="text-center py-16 corner-ticks rule-dashed max-w-md mx-auto">
          <p className="font-mono text-sm text-text-muted mb-4">sign in to see your bookmarks</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 h-10 px-4 bg-green text-text-on-accent font-mono text-xs uppercase tracking-[0.08em] hover:bg-green-dim transition-colors"
          >
            sign in with github
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-gold mb-2">[ your shelf ]</p>
      <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-text mb-2">bookmarks</h1>
      <p className="text-sm text-text-muted mb-8">projects you saved for later</p>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-error mb-4">{error}</p>
          <button
            onClick={load}
            className="text-sm text-accent hover:underline bg-transparent border-none cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Bookmark projects to save them here for quick access."
          action={
            <Link href="/projects">
              <span className="inline-flex items-center gap-2 h-10 px-4 bg-green text-text-on-accent font-mono text-xs uppercase tracking-[0.08em] hover:bg-green-dim transition-colors">
                browse projects
              </span>
            </Link>
          }
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <StaggerRow key={project.id}>
              <ProjectCard project={project} />
            </StaggerRow>
          ))}
        </Stagger>
      )}
    </div>
  )
}