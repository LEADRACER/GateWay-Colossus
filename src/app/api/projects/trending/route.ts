import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.rpc('get_trending_projects', {
    limit_count: 20,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const projects = (data || []).map((d: any) => ({
    ...d.project_data,
    trend_score: d.trend_score,
    like_count: 0,
    bookmark_count: 0,
    comment_count: 0,
  }))

  return NextResponse.json(projects)
}