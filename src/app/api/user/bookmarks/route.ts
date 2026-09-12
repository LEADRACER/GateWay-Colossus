import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserBookmarkedProjects } from '@/services/social'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    const projects = await getUserBookmarkedProjects(supabase, userId)
    return NextResponse.json(projects)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load bookmarks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}