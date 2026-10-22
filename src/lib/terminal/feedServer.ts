import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface CanvasTeam {
  id: string
  code: string
  name: string
  slug: string
  position: [number, number, number]
  memberCount: number
  projectCount: number
  isShowcased: boolean
  showcaseType?: 'homepage' | 'fired' | 'both'
  avatarUrl?: string
  color: string
}

export interface CanvasProject {
  id: string
  teamId: string | null
  name: string
  stars: number
  language: string | null
  languageColor: string
  isShowcased: boolean
  position: [number, number, number]
  orbitRadius: number
  orbitSpeed: number
  orbitPhase: number
}

export interface CanvasEdge {
  source: string
  target: string
  weight: number
}

export interface CanvasFeed {
  teams: CanvasTeam[]
  projects: CanvasProject[]
  edges: CanvasEdge[]
  metadata: {
    totalTeams: number
    totalProjects: number
    totalStars: number
    lastUpdated: string
  }
}

export type TerminalEventKind = 'like' | 'comment' | 'bookmark' | 'project' | 'join' | 'system'

export interface TerminalEventPreview {
  id: string
  kind: TerminalEventKind
  text: string
  at: string
}

function teamColor(name: string): string {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0)
  const hue = (hash * 137) % 360
  return `hsl(${hue}, 70%, 55%)`
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#239120',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#ffac45',
  Kotlin: '#7F52FF',
  Dart: '#00B4AB',
  Vue: '#42b883',
  Svelte: '#ff3e00',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
}

function languageColor(lang: string | null): string {
  if (!lang) return '#888888'
  return LANGUAGE_COLORS[lang] || '#888888'
}

function hashPosition(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % max
}

export async function fetchCanvasFeed(): Promise<CanvasFeed> {
  const supabase = await createServerSupabaseClient()

  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id, code, name, slug, avatar_url, is_locked, is_public,
      leader_id,
      member_count,
      projects:projects(id)
    `)
    .eq('is_public', true)

  const { data: showcasedProjects } = await supabase
    .from('showcase_requests')
    .select('project_id, type')
    .eq('status', 'approved')

  const showcasedMap = new Map<string, 'homepage' | 'fired' | 'both'>()
  showcasedProjects?.forEach(sp => {
    const existing = showcasedMap.get(sp.project_id)
    if (existing && existing !== sp.type && existing !== 'both' && sp.type !== 'both') {
      showcasedMap.set(sp.project_id, 'both')
    } else {
      showcasedMap.set(sp.project_id, sp.type)
    }
  })

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, github_url, owner, repo_name, repo_description,
      repo_stars, repo_language, repo_avatar,
      team_id, is_team_project,
      team:teams!inner(code, name)
    `)
    .eq('status', 'active')

  const teamNodes: CanvasTeam[] = (teams || []).map((t, i) => {
    const showcasedProject = t.projects?.find((p: { id: string }) => showcasedMap.has(p.id))
    const isShowcased = !!showcasedProject
    const showcaseType = showcasedProject ? showcasedMap.get(showcasedProject.id) : undefined

    const angle = (i / (teams?.length || 1)) * Math.PI * 2
    const radius = 0.35 + (t.member_count || 1) * 0.02

    return {
      id: t.id,
      code: t.code,
      name: t.name,
      slug: t.slug,
      position: [
        0.5 + Math.cos(angle) * radius,
        0.5 + Math.sin(angle) * radius,
        0
      ] as [number, number, number],
      memberCount: t.member_count || 1,
      projectCount: t.projects?.length || 0,
      isShowcased,
      showcaseType,
      avatarUrl: t.avatar_url,
      color: teamColor(t.name),
    }
  })

  const projectNodes: CanvasProject[] = (projects || []).map((p) => {
    const isShowcased = showcasedMap.has(p.id)
    const stars = p.repo_stars || 0
    const orbitRadius = 0.025 + Math.min(stars / 50000, 0.08)
    const orbitSpeed = 0.00008 + Math.min(stars / 100000, 0.0004)
    const orbitPhase = hashPosition(p.id, 1000) / 1000 * Math.PI * 2

    return {
      id: p.id,
      teamId: p.team_id,
      name: p.name,
      stars,
      language: p.repo_language,
      languageColor: languageColor(p.repo_language),
      isShowcased,
      position: [0, 0, 0] as [number, number, number],
      orbitRadius,
      orbitSpeed,
      orbitPhase,
    }
  })

  const edges: CanvasEdge[] = []
  for (let i = 0; i < teamNodes.length; i++) {
    for (let j = i + 1; j < teamNodes.length; j++) {
      const t1 = teamNodes[i]
      const t2 = teamNodes[j]

      const t1Projects = projects?.filter(p => p.team_id === t1.id) || []
      const t2Projects = projects?.filter(p => p.team_id === t2.id) || []

      const sharedLanguages = new Set(
        [...t1Projects.map(p => p.repo_language), ...t2Projects.map(p => p.repo_language)]
          .filter(l => l && t1Projects.some(p => p.repo_language === l) && t2Projects.some(p => p.repo_language === l))
      )

      if (sharedLanguages.size > 0) {
        edges.push({
          source: t1.code,
          target: t2.code,
          weight: Math.min(sharedLanguages.size / 5, 1)
        })
      }
    }
  }

  return {
    teams: teamNodes,
    projects: projectNodes,
    edges,
    metadata: {
      totalTeams: teamNodes.length,
      totalProjects: projectNodes.length,
      totalStars: projectNodes.reduce((sum, p) => sum + p.stars, 0),
      lastUpdated: new Date().toISOString(),
    }
  }
}

interface ActivityJoined {
  id: string
  action: string
  created_at: string
  profiles: { username: string | null } | null
  projects: { name: string | null } | null
}

export function describeActivity(row: ActivityJoined): string {
  const project = row.projects?.name ?? null
  const user = row.profiles?.username ?? null
  switch (row.action) {
    case 'project_created':
      return `${user ?? 'someone'} shipped ${project ?? 'a project'}`
    case 'project_liked':
      return `${user ?? 'someone'} starred ${project ?? 'a project'}`
    case 'project_bookmarked':
      return `${user ?? 'someone'} bookmarked ${project ?? 'a project'}`
    case 'comment_added':
      return `${user ?? 'someone'} commented on ${project ?? 'a project'}`
    case 'project_submitted':
      return `${project ?? 'a project'} submitted for showcase`
    case 'project_approved':
      return `${project ?? 'a project'} entered the FIRED list`
    case 'project_rejected':
      return `${project ?? 'a project'} was turned down`
    default:
      return row.action.replace(/_/g, ' ')
  }
}

export function activityKind(action: string): TerminalEventKind {
  switch (action) {
    case 'project_liked': return 'like'
    case 'comment_added': return 'comment'
    case 'project_bookmarked': return 'bookmark'
    case 'project_submitted':
    case 'project_approved':
    case 'project_rejected': return 'project'
    default: return 'project'
  }
}

export async function fetchRecentEvents(limit = 30): Promise<TerminalEventPreview[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('activities')
    .select('id, action, created_at, profiles(username), projects(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = (data || []) as unknown as Array<{
    id: string
    action: string
    created_at: string
    profiles: { username: string | null }[] | null
    projects: { name: string | null }[] | null
  }>

  return rows.map(row => {
    const normalized: ActivityJoined = {
      id: row.id,
      action: row.action,
      created_at: row.created_at,
      profiles: row.profiles?.[0] ?? null,
      projects: row.projects?.[0] ?? null,
    }
    return {
      id: normalized.id,
      kind: activityKind(normalized.action),
      text: describeActivity(normalized),
      at: normalized.created_at,
    }
  })
}
