import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const language = searchParams.get('language') || undefined
  const status = searchParams.get('status') || 'active'
  const category = searchParams.get('category') || undefined
  const sort = searchParams.get('sort') || 'newest'
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const supabase = await createServerSupabaseClient()

  let dbQuery = supabase
    .from('projects')
    .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
    .eq('status', status)

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single()
    if (cat) {
      const { data: links } = await supabase
        .from('project_categories')
        .select('project_id')
        .eq('category_id', cat.id)
      const ids = (links || []).map(r => r.project_id)
      dbQuery = dbQuery.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    } else {
      dbQuery = dbQuery.in('id', ['00000000-0000-0000-0000-000000000000'])
    }
  }

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,repo_description.ilike.%${query}%,owner.ilike.%${query}%,repo_name.ilike.%${query}%`
    )
  }

  if (language) {
    dbQuery = dbQuery.eq('repo_language', language)
  }

  if (sort === 'stars') {
    dbQuery = dbQuery.order('repo_stars', { ascending: false })
  } else {
    dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  dbQuery = dbQuery.range(offset, offset + limit - 1)

  const { data, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projects = (data || []).map((p: ProjectWithCounts) => ({
    ...p,
    like_count: p.likes?.[0]?.count ?? 0,
    bookmark_count: p.bookmarks?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }))

  return NextResponse.json(projects)
}