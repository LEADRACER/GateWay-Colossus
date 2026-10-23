import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { updateUserRole } from '@/services/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const parsed = await request.json().catch(() => null) as { role?: string } | null
  if (!parsed) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  const { role } = parsed as { role?: string }

  if (role !== 'admin' && role !== 'member' && role !== 'viewer') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await updateUserRole(admin.supabase, userId, role as 'admin' | 'member' | 'viewer')
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update role'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
