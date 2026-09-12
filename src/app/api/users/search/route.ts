import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { searchUsers } from '@/services/teams'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  const supabase = await createServerSupabaseClient()

  try {
    const users = await searchUsers(supabase, query, limit)
    return NextResponse.json(users)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to search users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}