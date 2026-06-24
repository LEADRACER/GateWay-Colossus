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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      setProjects(data as Project[])
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

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Projects</h1>
        <a href="/projects/new">
          <Button>+ New</Button>
        </a>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Input
          placeholder="Search by name, description, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {['all', 'active', 'in development', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              statusFilter === s
                ? 'bg-[#00ff41] text-[#0a0a0a] font-medium'
                : 'bg-[#1a1a1a] text-[#a3a3a3] hover:text-[#f5f5f5]'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={search || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
          description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Be the first to add a project.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}
