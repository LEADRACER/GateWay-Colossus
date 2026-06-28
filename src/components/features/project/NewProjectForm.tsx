'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { createProject } from '@/services/projects'
import { parseGitHubUrl, fetchRepoInfo, fetchReadme } from '@/services/github'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function NewProjectForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{
    name: string
    description: string | null
    readme: string | null
    language: string | null
    topics: string[]
    stars: number
    license: string | null
    owner: string
    repo: string
    avatar: string
  } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleFetch() {
    setError('')
    setPreview(null)

    const parsed = parseGitHubUrl(url)
    if (!parsed) {
      setError('Invalid GitHub URL. Use https://github.com/owner/repo')
      return
    }

    setLoading(true)
    try {
      const repo: {
        name: string
        description: string | null
        language: string | null
        topics: string[]
        stargazers_count: number
        license: { spdx_id: string } | null
        owner: { login: string; avatar_url: string }
      } = await fetchRepoInfo(url)
      const readme = await fetchReadme(url)
      setPreview({
        name: repo.name,
        description: repo.description,
        readme,
        language: repo.language,
        topics: repo.topics,
        stars: repo.stargazers_count,
        license: repo.license?.spdx_id ?? null,
        owner: repo.owner.login,
        repo: repo.name,
        avatar: repo.owner.avatar_url,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch repo info')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!preview) return
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      await createProject(supabase, {
        name: preview.name,
        github_url: url,
        owner: preview.owner,
        repo_name: preview.repo,
        repo_description: preview.description || undefined,
        repo_readme: preview.readme || undefined,
        repo_language: preview.language || undefined,
        repo_topics: preview.topics,
        repo_stars: preview.stars,
        repo_license: preview.license || undefined,
        repo_avatar: preview.avatar,
      })
      router.push('/projects')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex gap-3">
        <Input
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
        />
        <Button onClick={handleFetch} disabled={loading || !url.trim()} loading={loading}>
          Fetch
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {preview && (
        <Card className="p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <Image
              src={preview.avatar}
              alt={preview.owner}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full shrink-0 ring-1 ring-border"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-text">{preview.name}</h3>
              <p className="text-sm text-text-muted line-clamp-2 mt-0.5">
                {preview.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-alt text-text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-text-dim/50">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {preview.stars}
            </span>
            {preview.language && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent-subtle text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {preview.language}
              </span>
            )}
            {preview.license && (
              <span className="px-2 py-1 rounded-md bg-surface-alt text-text-dim">
                {preview.license}
              </span>
            )}
          </div>

          {preview.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {preview.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 text-[11px] rounded-full border border-accent/20 bg-accent-subtle text-accent/90"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving}
            loading={saving}
            className="w-full"
          >
            Add {preview.name}
          </Button>
        </Card>
      )}
    </div>
  )
}
