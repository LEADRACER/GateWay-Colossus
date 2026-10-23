import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin-guard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/services/admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const users = await getAllUsers(admin.supabase)
    return NextResponse.json(users)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list users'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}