'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectCard } from '@/components/features/project/ProjectCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { Project } from '@/lib/types/database'
import Link from 'next/link'

const statusOptions = ['all', 'active', 'in development', 'archived'] as const

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      // Flatten aggregated counts
      const projectsWithCounts = (data as any[]).map((p) => ({
        ...p,
        like_count: p.likes?.[0]?.count ?? 0,
        bookmark_count: p.bookmarks?.[0]?.count ?? 0,
        comment_count: p.comments?.[0]?.count ?? 0,
      }))

      setProjects(projectsWithCounts as any)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase()
    if (q && !p.name.toLowerCase().includes(q) && !p.repo_description?.toLowerCase().includes(q) && !p.owner.toLowerCase().includes(q)) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) return <ErrorMessage message={error} />

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text">
            Projects
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} showcased
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-150 ${
                statusFilter === s
                  ? 'bg-accent text-[#050505] font-medium'
                  : 'bg-surface-alt text-text-muted hover:text-text border border-transparent hover:border-border'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          title={
            search || statusFilter !== 'all'
              ? 'No matching projects'
              : 'No projects yet'
          }
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Be the first to showcase your project.'
          }
        />
      ) : (
        <>
          <p className="text-xs text-text-dim mb-4">
            Showing {filtered.length} of {projects.length} projects
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
