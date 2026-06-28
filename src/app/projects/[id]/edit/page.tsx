'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProject, updateProject } from '@/services/projects'
import { parseGitHubUrl, fetchRepoInfo, fetchReadme } from '@/services/github'
import type { Project } from '@/lib/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const p = await getProject(supabase, id)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id !== p.created_by) {
          router.push(`/projects/${id}`)
          return
        }
        setProject(p)
        setUrl(p.github_url)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  async function handleSave() {
    if (!project) return
    setSaving(true)
    setError('')

    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      setError('Invalid GitHub URL')
      setSaving(false)
      return
    }

    try {
      const repo = await fetchRepoInfo(url)
      const readme = await fetchReadme(url)
      const supabase = createClient()
      await updateProject(supabase, id, {
        github_url: url,
        name: repo.name,
        owner: repo.owner.login,
        repo_name: repo.name,
        repo_description: repo.description || undefined,
        repo_readme: readme || undefined,
        repo_language: repo.language || undefined,
        repo_topics: repo.topics,
        repo_stars: repo.stargazers_count,
        repo_license: repo.license?.spdx_id || undefined,
        repo_avatar: repo.owner.avatar_url,
      })
      router.push(`/projects/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!project) return <p className="text-text-muted text-center py-24 text-sm">Project not found</p>

  return (
    <div className="max-w-lg mx-auto px-6 py-12 md:py-16">
      <button
        onClick={() => router.push(`/projects/${id}`)}
        className="group inline-flex items-center gap-1.5 text-xs text-text-dim hover:text-text-muted transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </button>

      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text mb-6">Edit Project</h1>
      <Card className="p-6 space-y-4">
        <Input
          label="GitHub URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/projects/${id}`)}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}
