import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const language = searchParams.get('language') || undefined
  const status = searchParams.get('status') || 'active'

  const supabase = await createServerSupabaseClient()

  let dbQuery = supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,repo_description.ilike.%${query}%,owner.ilike.%${query}%,repo_name.ilike.%${query}%`
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