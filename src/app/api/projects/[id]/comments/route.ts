import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addComment, getComments } from '@/services/social'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  let comments: Awaited<ReturnType<typeof getComments>>
  try {
    comments = await getComments(supabase, id)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load comments'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Enrich with author identity in ONE embed query instead of N per-comment
  // lookups. Comments.user_id is an auth uuid; profiles.id matches it.
  const userIds = [...new Set(comments.map(c => c.user_id))]
  if (userIds.length === 0) return NextResponse.json([])

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, login, username, avatar_url')
    .in('id', userIds)

  const byId = new Map((profiles || []).map(p => [p.id, p]))
  const enriched = comments.map(c => {
    const profile = byId.get(c.user_id)
    return {
      ...c,
      username: profile?.login || profile?.username || c.user_id.slice(0, 8),
      avatar_url: profile?.avatar_url,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await request.json().catch(() => null) as { content?: string } | null
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const content = typeof parsed.content === 'string' ? parsed.content : ''
  if (!content.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    await addComment(supabase, id, content.trim(), userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to add comment'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
