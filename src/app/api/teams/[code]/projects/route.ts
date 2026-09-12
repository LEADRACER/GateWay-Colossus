import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTeam, getTeamProjects } from '@/services/teams'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { searchParams } = new URL(_request.url)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const { projects, total } = await getTeamProjects(supabase, team.id, { limit, offset })
    return NextResponse.json({ projects, total })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get team projects'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}