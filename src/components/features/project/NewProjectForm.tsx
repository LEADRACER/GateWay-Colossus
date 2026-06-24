'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProject } from '@/services/projects'
import { parseGitHubUrl, fetchRepoInfo, fetchReadme } from '@/services/github'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
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
    } catch (e: any) {
      setError(e.message || 'Failed to fetch repo info')
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
        repo_language: preview.language || undefined,
        repo_topics: preview.topics,
        repo_stars: preview.stars,
        repo_license: preview.license || undefined,
        repo_avatar: preview.avatar,
      })
      router.push('/projects')
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'Failed to save project')
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
        <Button onClick={handleFetch} disabled={loading || !url.trim()}>
          {loading ? <Spinner /> : 'Fetch'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {preview && (
        <Card className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <img
              src={preview.avatar}
              alt={preview.owner}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#f5f5f5]">{preview.name}</h3>
              <p className="text-sm text-[#a3a3a3] line-clamp-2">
                {preview.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-[#1a1a1a] text-[#a3a3a3]">
              ⭐ {preview.stars}
            </span>
            {preview.language && (
              <span className="px-2 py-1 rounded bg-[#1a1a1a] text-[#00ff41]">
                {preview.language}
              </span>
            )}
            {preview.license && (
              <span className="px-2 py-1 rounded bg-[#1a1a1a] text-[#a3a3a3]">
                {preview.license}
              </span>
            )}
          </div>

          {preview.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {preview.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#00ff41]/10 text-[#00ff41]"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full"
          >
            {saving ? <Spinner /> : `Add ${preview.name}`}
          </Button>
        </Card>
      )}
    </div>
  )
}
