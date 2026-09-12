import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createTeam, listTeams, searchUsers } from '@/services/teams'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const supabase = await createServerSupabaseClient()

  try {
    const { teams, total } = await listTeams(supabase, { search, limit, offset })
    return NextResponse.json({ teams, total })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list teams'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userLogin = request.headers.get('x-user-login')
  const userAvatar = request.headers.get('x-user-avatar')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, avatar_url, is_public, is_locked } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const team = await createTeam(supabase, { name, description, avatar_url, is_public, is_locked }, userId)
    return NextResponse.json(team, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create team'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}