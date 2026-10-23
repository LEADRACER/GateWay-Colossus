import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMemberPermissions, getPermissionRequests } from '@/services/admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [members, requests] = await Promise.all([
      getMemberPermissions(admin.supabase),
      getPermissionRequests(admin.supabase),
    ])
    return NextResponse.json({ members, requests })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load permissions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}