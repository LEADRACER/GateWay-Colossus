import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface CanvasTeam {
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

interface CanvasProject {
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

interface CanvasEdge {
  source: string
  target: string
  weight: number
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

export async function GET() {
  const supabase = await createServerSupabaseClient()

  // Fetch teams with member/project counts
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id, code, name, slug, avatar_url, is_locked, is_public,
      leader_id,
      member_count,
      projects:projects(id)
    `)
    .eq('is_public', true)

  // Fetch showcased projects
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

  // Fetch projects with team info
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, github_url, owner, repo_name, repo_description,
      repo_stars, repo_language, repo_avatar,
      team_id, is_team_project,
      team:teams!inner(code, name)
    `)
    .eq('status', 'active')

  // Build team nodes
  const teamNodes: CanvasTeam[] = (teams || []).map((t, i) => {
    const showcasedProject = t.projects?.find((p: any) => showcasedMap.has(p.id))
    const isShowcased = !!showcasedProject
    const showcaseType = showcasedProject ? showcasedMap.get(showcasedProject.id) : undefined

    // Deterministic position from team code (will be overridden by force layout on client)
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

  // Build project nodes
  const projectNodes: CanvasProject[] = (projects || []).map((p, i) => {
    const isShowcased = showcasedMap.has(p.id)
    const showcaseType = showcasedMap.get(p.id)
    const team = teamNodes.find(t => t.id === p.team_id)
    const isTeamProject = !!p.team_id

    // Orbit params
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
      position: [0, 0, 0] as [number, number, number], // computed client-side
      orbitRadius,
      orbitSpeed,
      orbitPhase,
    }
  })

  // Build edges (team-team connections via shared members or project collaborations)
  const edges: CanvasEdge[] = []
  const teamIds = teamNodes.map(t => t.id)
  
  // Simple heuristic: connect teams with similar languages or shared members
  for (let i = 0; i < teamNodes.length; i++) {
    for (let j = i + 1; j < teamNodes.length; j++) {
      const t1 = teamNodes[i]
      const t2 = teamNodes[j]
      
      // Check for shared projects (cross-team collabs)
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

  const feed = {
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

  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    }
  })
}