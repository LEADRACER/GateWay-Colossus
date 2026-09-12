import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { reviewShowcaseRequest, revokeShowcase } from '@/services/teams'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const adminId = request.headers.get('x-user-id')
  const { action, adminNotes } = await request.json()

  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Verify admin
  const { data: admin } = await supabase
    .from('profiles')
    .select('role')
    .eq('github_id', parseInt(adminId, 10))
    .single()

  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (action === 'revoke') {
      // Get request to find project_id
      const { data: req } = await supabase
        .from('showcase_requests')
        .select('project_id')
        .eq('id', id)
        .single()

      if (!req) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      await revokeShowcase(supabase, req.project_id, adminId)
      return NextResponse.json({ success: true })
    }

    const request = await reviewShowcaseRequest(supabase, id, adminId, action, adminNotes)
    return NextResponse.json(request)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to review request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}