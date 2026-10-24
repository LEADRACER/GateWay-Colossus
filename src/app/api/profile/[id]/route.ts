import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NUMERIC_RE = /^\d+$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Every in-app link passes an auth uuid; legacy urls may carry a numeric
  // github id. Only query the column whose type actually matches, otherwise
  // PostgREST cast errors degrade into misleading 404s.
  let profile = null
  let dbError = false
  if (UUID_RE.test(id)) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    profile = data
    if (error) dbError = true
  }
  if (!profile && !dbError && NUMERIC_RE.test(id)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('github_id', parseInt(id, 10))
      .maybeSingle()
    profile = data
    if (error) dbError = true
  }

  if (!profile) {
    return NextResponse.json({ error: dbError ? 'Database error' : 'Profile not found' }, { status: dbError ? 500 : 404 })
  }

  interface ProjectWithCounts {
    id: string
    name: string
    status: string
    owner: string
    repo_name: string
    repo_description: string | null
    repo_stars: number | null
    repo_language: string | null
    repo_avatar: string | null
    created_at: string
    likes: { count: number }[]
    bookmarks: { count: number }[]
    comments: { count: number }[]
  }

  // Get projects (public boards only show active records)
  const { data: projs } = await supabase
    .from('projects')
    .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
    .eq('created_by', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const projects = (projs || []).map((p: ProjectWithCounts) => ({
    ...p,
    like_count: p.likes?.[0]?.count ?? 0,
    bookmark_count: p.bookmarks?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }))

  // Get activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(15)

  return NextResponse.json({
    profile: {
      id: profile.id,
      github_id: profile.github_id,
      login: profile.login,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      role: profile.role,
      created_at: profile.created_at,
    },
    projects,
    activities: activities || [],
  })
}
