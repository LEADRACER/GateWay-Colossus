import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface TrendingRow {
  project_id: string
  trend_score: number
  project_data: {
    id: string
    name: string
    owner: string
    repo_name: string
    repo_description: string | null
    repo_stars: number | null
    repo_language: string | null
    repo_avatar: string | null
    status: string
    created_at: string
  }
}

// Shape mirrors discovery.getTrendingProjects (rpc over the same function)
export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.rpc('get_trending_projects', {
    limit_count: 20,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projects = ((data || []) as TrendingRow[]).map((d) => ({
    ...d.project_data,
    trend_score: d.trend_score,
    like_count: 0,
    bookmark_count: 0,
    comment_count: 0,
  }))

  return NextResponse.json(projects)
}
