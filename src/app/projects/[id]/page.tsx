'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProject, deleteProject, updateProject } from '@/services/projects'
import { buildDownloadUrl, buildVisitUrl, fetchRepoInfo, fetchReadme } from '@/services/github'
import type { Project } from '@/lib/types/database'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { LikeButton, BookmarkButton } from '@/components/ui/SocialButtons'
import { CommentsSection } from '@/components/ui/CommentsSection'

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

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (error) return <p className="text-error text-center py-24 text-sm">{error}</p>
  if (!project) return <p className="text-text-muted text-center py-24 text-sm">Project not found</p>

  const cacheAge = project.cached_at
    ? Math.round((Date.now() - new Date(project.cached_at).getTime()) / 60000)
    : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      {/* Back link */}
      <button
        onClick={() => router.push('/projects')}
        className="group inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text-muted transition-colors mb-8"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:-translate-x-0.5 transition-transform"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Projects
      </button>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-surface">
        {/* Header section */}
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            {project.repo_avatar ? (
              <img
                src={project.repo_avatar}
                alt={project.owner}
                className="w-11 h-11 rounded-full shrink-0 ring-1 ring-border"
              />
            ) : (
              <div className="w-11 h-11 rounded-full shrink-0 bg-surface-alt ring-1 ring-border flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text truncate">
                  {project.name}
                </h1>
                <Badge
                  variant={
                    project.status === 'active'
                      ? 'success'
                      : project.status === 'in development'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-text-dim mt-0.5">
                {project.owner}/{project.repo_name}
              </p>
            </div>
          </div>

          {/* Description or README */}
          {project.repo_readme ? (
            <div className="border-t border-border pt-5">
              <MarkdownRenderer content={project.repo_readme} />
            </div>
          ) : project.repo_description ? (
            <p className="text-sm text-text-muted leading-relaxed border-t border-border pt-5">
              {project.repo_description}
            </p>
          ) : null}

          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-border text-xs">
            <span className="flex items-center gap-1.5 text-text-dim">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="font-medium text-text-muted">{project.repo_stars}</span>
              <span className="text-text-dim">stars</span>
            </span>
            {project.repo_language && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent/60" />
                <span className="text-accent/80 font-medium">{project.repo_language}</span>
              </span>
            )}
            {project.repo_license && (
              <span className="text-text-dim">{project.repo_license}</span>
            )}
            {cacheAge !== null && (
              <span className="text-text-dim ml-auto">
                Cached {cacheAge}m ago
              </span>
            )}
          </div>

          {/* Topics */}
          {project.repo_topics && project.repo_topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
              {project.repo_topics.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-accent/20 bg-accent-subtle text-accent/90"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
            <a href={buildVisitUrl(project.owner, project.repo_name)} target="_blank" rel="noopener noreferrer">
              <Button variant="primary">
                View on GitHub
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Button>
            </a>
            <a href={buildDownloadUrl(project.owner, project.repo_name)} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download ZIP
              </Button>
            </a>
            <LikeButton project={project} />
            <BookmarkButton project={project} />
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              loading={refreshing}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
              Refresh
            </Button>
          </div>

          {/* Created by */}
          <div className="mt-4 text-xs text-text-dim">
            Added by{' '}
            <a
              href={`/profile/${project.created_by}`}
              className="text-info hover:underline"
            >
              {project.created_by.slice(0, 8)}
            </a>
          </div>
        </div>

        {/* Owner controls */}
        {isOwner && (
          <div className="border-t border-border px-6 md:px-8 py-4 flex flex-wrap gap-2 bg-surface-alt rounded-b-xl">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/projects/${id}/edit`)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange(project.status === 'active' ? 'archived' : 'active')}
            >
              {project.status === 'active' ? 'Archive' : 'Set Active'}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Comments */}
      <CommentsSection projectId={id} />

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete project?">
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          This will permanently remove <span className="text-text font-medium">{project.name}</span>. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
            Delete Project
          </Button>
        </div>
      </Modal>
    </div>
  )
}
