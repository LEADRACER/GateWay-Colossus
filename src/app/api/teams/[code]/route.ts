import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTeam, updateTeam, deleteTeam, getTeamMembers, getJoinRequests, getTeamProjects } from '@/services/teams'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const members = await getTeamMembers(supabase, team.id)
    const joinRequests = await getJoinRequests(supabase, team.id)
    const { projects } = await getTeamProjects(supabase, team.id, { limit: 10 })

    return NextResponse.json({ team, members, joinRequests, projects })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get team'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const userId = request.headers.get('x-user-id')
  const { name, description, avatar_url, is_locked, is_public } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const updated = await updateTeam(supabase, team.id, { name, description, avatar_url, is_locked, is_public }, userId)
    return NextResponse.json(updated)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update team'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const userId = _request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await deleteTeam(supabase, team.id, userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete team'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}