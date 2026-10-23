import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { reviewShowcaseRequest, revokeShowcase } from '@/services/teams'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { action, adminNotes } = await request.json()

  if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (action === 'revoke') {
      // Get request to find project_id
      const { data: req } = await admin.supabase
        .from('showcase_requests')
        .select('project_id')
        .eq('id', id)
        .single()

      if (!req) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      await revokeShowcase(admin.supabase, req.project_id, admin.userId)
      return NextResponse.json({ success: true })
    }

    const result = await reviewShowcaseRequest(admin.supabase, id, admin.userId, action, adminNotes)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to review request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
