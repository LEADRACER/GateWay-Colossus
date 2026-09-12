import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = _request.headers.get('x-user-id')

  if (!userId) {
    return NextResponse.json({ bookmarked: false })
  }

  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('project_id', id)
    .eq('user_id', userId)
    .single()

  return NextResponse.json({ bookmarked: !!data })
}