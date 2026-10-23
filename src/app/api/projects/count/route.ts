import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const language = searchParams.get('language') || undefined
  const status = searchParams.get('status') || undefined
  const category = searchParams.get('category') || undefined

  const supabase = await createServerSupabaseClient()

  let dbQuery = supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })

  if (status) dbQuery = dbQuery.eq('status', status)

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

  const safeQuery = query.slice(0, 60).replace(/[(),\s.]/g, ' ').trim()

  if (safeQuery) {
    dbQuery = dbQuery.or(
      `name.ilike.%${safeQuery}%,repo_description.ilike.%${safeQuery}%,owner.ilike.%${safeQuery}%,repo_name.ilike.%${safeQuery}%`
    )
  }

  if (language) {
    dbQuery = dbQuery.eq('repo_language', language)
  }

  const { count, error } = await dbQuery

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}