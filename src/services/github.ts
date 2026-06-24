export interface GitHubRepo {
  name: string
  description: string | null
  html_url: string
  language: string | null
  topics: string[]
  stargazers_count: number
  license: { spdx_id: string } | null
  owner: { login: string; avatar_url: string }
  default_branch: string
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
}

export async function fetchRepoInfo(url: string): Promise<GitHubRepo> {
  const parsed = parseGitHubUrl(url)
  if (!parsed) throw new Error('Invalid GitHub URL')

  const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error('Repository not found')
    if (res.status === 403) throw new Error('GitHub API rate limit reached — try again later')
    throw new Error(`GitHub API error: ${res.status}`)
  }

  return res.json()
}

export async function fetchReadme(url: string): Promise<string | null> {
  const parsed = parseGitHubUrl(url)
  if (!parsed) return null

  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
      { headers: { Accept: 'application/vnd.github.raw+json' } },
    )
    if (!res.ok) return null
    const text = await res.text()
    return text.slice(0, 50000) || null
  } catch {
    return null
  }
}

export function buildDownloadUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`
}

export function buildVisitUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`
}
