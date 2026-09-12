import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMemberPermissions, getPermissionRequests } from '@/services/admin'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const [members, requests] = await Promise.all([
    getMemberPermissions(supabase),
    getPermissionRequests(supabase),
  ])

  return NextResponse.json({ members, requests })
}