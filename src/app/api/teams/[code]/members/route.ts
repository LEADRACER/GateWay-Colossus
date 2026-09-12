import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTeam, getTeamMembers, inviteMember, searchUsers } from '@/services/teams'

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
    return NextResponse.json(members)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get members'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const userId = request.headers.get('x-user-id')
  const { targetLogin, role } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!targetLogin?.trim()) {
    return NextResponse.json({ error: 'GitHub username required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Find target user by GitHub login
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('login', targetLogin.toLowerCase())
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found on platform' }, { status: 404 })
    }

    const member = await inviteMember(supabase, team.id, targetUser.id, userId, role || 'member')
    return NextResponse.json(member, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to invite member'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}