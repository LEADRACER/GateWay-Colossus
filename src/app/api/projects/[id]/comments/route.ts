import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addComment, getComments, getCommentCount } from '@/services/social'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const comments = await getComments(supabase, id)

  const enriched = await Promise.all(
    comments.map(async (c) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('login, avatar_url')
        .eq('github_id', c.user_id)
        .single()
      return { ...c, username: profile?.login || c.user_id.slice(0, 8), avatar_url: profile?.avatar_url }
    })
  )

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

  const { content } = await request.json()
  if (!content?.trim()) {
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