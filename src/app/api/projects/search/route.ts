import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const language = searchParams.get('language') || undefined
  const status = searchParams.get('status') || 'active'
  const sort = searchParams.get('sort') || 'newest'
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const supabase = await createServerSupabaseClient()

  let dbQuery = supabase
    .from('projects')
    .select('*, likes:likes(count), bookmarks:bookmarks(count), comments:comments(count)')
    .eq('status', status)

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

  const projects = (data || []).map((p: any) => ({
    ...p,
    like_count: p.likes?.[0]?.count ?? 0,
    bookmark_count: p.bookmarks?.[0]?.count ?? 0,
    comment_count: p.comments?.[0]?.count ?? 0,
  }))

  return NextResponse.json(projects)
}