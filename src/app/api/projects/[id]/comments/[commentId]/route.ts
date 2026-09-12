import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deleteComment } from '@/services/social'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await params
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    await deleteComment(supabase, commentId, userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete comment'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}