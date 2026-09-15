import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Try to find by github_id first
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('github_id', id)
    .single()

  if (!profile) {
    // Fallback to id
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    profile = data
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  interface ProjectWithCounts {
  id: string
  name: string
  purpose: string
  description: string
  github_url: string | null
  website_url: string | null
  logo_url: string | null
  tags: string[]
  status: string
  created_by: string
  created_at: string
  updated_at: string
  likes: { count: number }[]
  bookmarks: { count: number }[]
  comments: { count: number }[]
}

// Get projects
  const { data: projs } = await supabase
    .from('projects')
    .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
    .eq('created_by', profile.id)
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