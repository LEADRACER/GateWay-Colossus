import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { moderateProject } from '@/services/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = request.headers.get('x-user-id')
  const { action } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('github_id', parseInt(userId, 10))
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await moderateProject(supabase, id, action as 'approve' | 'reject', userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to moderate'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}