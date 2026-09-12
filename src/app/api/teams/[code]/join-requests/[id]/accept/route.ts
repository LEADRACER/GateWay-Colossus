import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTeam, acceptJoinRequest } from '@/services/teams'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const { code, id } = await params
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

    const request = await acceptJoinRequest(supabase, id, userId)
    return NextResponse.json(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to accept request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}