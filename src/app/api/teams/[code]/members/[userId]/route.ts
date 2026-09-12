import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTeam, getTeamMember, updateMemberRole, removeMember } from '@/services/teams'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; userId: string }> }
) {
  const { code, userId: targetUserId } = await params
  const userId = request.headers.get('x-user-id')
  const { role } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!role || !['leader', 'admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const member = await updateMemberRole(supabase, team.id, targetUserId, role, userId)
    return NextResponse.json(member)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update member'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; userId: string }> }
) {
  const { code, userId: targetUserId } = await params
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await removeMember(supabase, team.id, targetUserId, userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to remove member'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}