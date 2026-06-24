'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProject, deleteProject, updateProject } from '@/services/projects'
import { buildDownloadUrl, buildVisitUrl, fetchRepoInfo, fetchReadme } from '@/services/github'
import type { Project } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      const p = await getProject(supabase, id)
      setProject(p)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const isOwner = userId && project?.created_by === userId

  async function handleRefresh() {
    if (!project) return
    setRefreshing(true)
    try {
      const repo = await fetchRepoInfo(project.github_url)
      const readme = await fetchReadme(project.github_url)
      const supabase = createClient()
      const updated = await updateProject(supabase, id, {
        name: repo.name,
        repo_description: repo.description || undefined,
        repo_readme: readme || undefined,
        repo_language: repo.language || undefined,
        repo_topics: repo.topics,
        repo_stars: repo.stargazers_count,
        repo_license: repo.license?.spdx_id || undefined,
        repo_avatar: repo.owner.avatar_url,
      })
      setProject(updated)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const supabase = createClient()
      await deleteProject(supabase, id)
      router.push('/projects')
    } catch (e: any) {
      setError(e.message)
      setDeleting(false)
    }
  }

  async function handleStatusChange(status: Project['status']) {
    if (!project) return
    const supabase = createClient()
    const updated = await updateProject(supabase, id, { status } as any)
    setProject(updated)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (error) return <p className="text-red-400 text-center py-20">{error}</p>
  if (!project) return <p className="text-[#a3a3a3] text-center py-20">Not found</p>

  const cacheAge = project.cached_at
    ? Math.round((Date.now() - new Date(project.cached_at).getTime()) / 60000)
    : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Card className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          {project.repo_avatar && (
            <img
              src={project.repo_avatar}
              alt={project.owner}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#f5f5f5]">
              {project.name}
            </h1>
            <p className="text-sm text-[#666]">
              {project.owner}/{project.repo_name}
            </p>
          </div>
          <Badge variant={project.status === 'active' ? 'success' : project.status === 'in development' ? 'warning' : 'default'}>
            {project.status}
          </Badge>
        </div>

        {/* README — auto-fetched from GitHub */}
        {project.repo_readme ? (
          <div className="border-t border-[#333] pt-4">
            <h3 className="text-sm font-medium text-[#666] mb-3 uppercase tracking-wider">README</h3>
            <MarkdownRenderer content={project.repo_readme} />
          </div>
        ) : project.repo_description && (
          <p className="text-[#a3a3a3] leading-relaxed">
            {project.repo_description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-[#f5f5f5]">⭐ {project.repo_stars} stars</span>
          {project.repo_language && (
            <span className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[#00ff41] text-xs">
              {project.repo_language}
            </span>
          )}
          {project.repo_license && (
            <span className="text-[#a3a3a3] text-xs">{project.repo_license}</span>
          )}
          {cacheAge !== null && (
            <span className="text-[#666] text-xs ml-auto">
              Cached {cacheAge}m ago
            </span>
          )}
        </div>

        {/* Topics */}
        {project.repo_topics && project.repo_topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.repo_topics.map((t) => (
              <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-[#00ff41]/10 text-[#00ff41]">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <a href={buildVisitUrl(project.owner, project.repo_name)} target="_blank" rel="noopener noreferrer">
            <Button variant="primary">Visit on GitHub →</Button>
          </a>
          <a href={buildDownloadUrl(project.owner, project.repo_name)} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">Download ZIP</Button>
          </a>
          <Button variant="ghost" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Spinner /> : 'Refresh'}
          </Button>
        </div>

        {/* Created by link */}
        <div className="text-xs text-[#666]">
          Added by{' '}
          <a href={`/profile/${project.created_by}`} className="text-[#3399ff] hover:underline">
            {project.created_by.slice(0, 8)}
          </a>
        </div>

        {/* Owner / Admin controls */}
        {isOwner && (
          <div className="border-t border-[#333] pt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => router.push(`/projects/${id}/edit`)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleStatusChange(project.status === 'active' ? 'archived' : 'active')}
            >
              {project.status === 'active' ? 'Archive' : 'Set Active'}
            </Button>
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </div>
        )}
      </Card>

      {/* Delete modal */}
      {showDelete && (
        <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete project?">
          <p className="text-[#a3a3a3] mb-6">
            This will permanently remove {project.name}. This can't be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner /> : 'Delete'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
