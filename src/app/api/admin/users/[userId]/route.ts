import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { updateUserRole } from '@/services/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const adminUserId = request.headers.get('x-user-id')
  const { role } = await request.json()

  if (!adminUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('github_id', parseInt(adminUserId, 10))
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await updateUserRole(supabase, userId, role as 'admin' | 'member' | 'viewer')
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update role'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}