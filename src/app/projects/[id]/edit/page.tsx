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
      } catch (e: any) {
        setError(e.message)
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
    } catch (e: any) {
      setError(e.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!project) return <p className="text-[#a3a3a3] text-center py-20">Not found</p>

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-6">Edit Project</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm text-[#a3a3a3] mb-1">GitHub URL</label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner /> : 'Save'}
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/projects/${id}`)}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  )
}
