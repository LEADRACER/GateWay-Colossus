import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTeam, getJoinRequests, requestJoin } from '@/services/teams'

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

    const requests = await getJoinRequests(supabase, team.id)
    return NextResponse.json(requests)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get join requests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const userId = request.headers.get('x-user-id')
  const { message } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await getTeam(supabase, code)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const joinRequest = await requestJoin(supabase, team.id, userId, message)
    return NextResponse.json(joinRequest, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to request join'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}