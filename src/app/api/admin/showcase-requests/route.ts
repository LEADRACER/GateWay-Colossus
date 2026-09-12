import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getShowcaseRequests } from '@/services/teams'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | undefined
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const adminId = request.headers.get('x-user-id')
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const { requests, total } = await getShowcaseRequests(supabase, { status, limit, offset })
    return NextResponse.json({ requests, total })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get showcase requests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}