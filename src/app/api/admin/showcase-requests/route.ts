import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { getShowcaseRequests } from '@/services/teams'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | undefined
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { requests, total } = await getShowcaseRequests(admin.supabase, { status, limit, offset })
    return NextResponse.json({ requests, total })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get showcase requests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
