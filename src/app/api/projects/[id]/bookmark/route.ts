import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { bookmarkProject, unbookmarkProject } from '@/services/social'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = _request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    await bookmarkProject(supabase, id, userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to bookmark'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = _request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  try {
    await unbookmarkProject(supabase, id, userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to unbookmark'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}