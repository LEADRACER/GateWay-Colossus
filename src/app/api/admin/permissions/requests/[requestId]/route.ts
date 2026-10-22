import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { handlePermissionRequest } from '@/services/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params
  const { action } = await request.json()

  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await handlePermissionRequest(admin.supabase, requestId, action as 'approve' | 'deny')
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to handle request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
